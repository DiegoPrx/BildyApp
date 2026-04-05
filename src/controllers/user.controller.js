import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { AppError } from '../utils/AppError.js';
import { generateAccessToken, generateRefreshToken } from '../middlewares/auth.middleware.js';
import emitter from '../services/notification.service.js';
import jwt from 'jsonwebtoken';

// Almacén en memoria para refresh tokens invalidados (lista negra)
const tokenBlacklist = new Set();

// POST /api/user/register
export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Comprobar si el email ya existe y está verificado
    const existing = await User.findOne({ email, status: 'verified' });
    if (existing) throw AppError.conflict('El email ya está registrado y verificado');

    const hashed = await bcrypt.hash(password, 10);
    const code = String(Math.floor(100000 + Math.random() * 900000));

    const user = await User.create({
      email,
      password: hashed,
      verificationCode: code,
      verificationAttempts: 3
    });

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });

    // Guardar refresh token en el usuario
    user.refreshToken = refreshToken;
    await user.save();

    emitter.emit('user:registered', user);

    res.status(201).json({
      user: { email: user.email, status: user.status, role: user.role },
      accessToken,
      refreshToken
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/user/validation
export const verifyEmail = async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) throw AppError.notFound('Usuario no encontrado');

    if (user.verificationAttempts <= 0) {
      throw AppError.tooManyRequests('Se han agotado los intentos de verificación');
    }

    if (user.verificationCode !== code) {
      user.verificationAttempts -= 1;
      await user.save();
      if (user.verificationAttempts <= 0) {
        throw AppError.tooManyRequests('Se han agotado los intentos de verificación');
      }
      throw AppError.badRequest(`Código incorrecto. Intentos restantes: ${user.verificationAttempts}`);
    }

    user.status = 'verified';
    user.verificationCode = null;
    await user.save();

    emitter.emit('user:verified', user);

    res.json({ message: 'Email verificado correctamente' });
  } catch (err) {
    next(err);
  }
};

// POST /api/user/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw AppError.unauthorized('Credenciales incorrectas');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw AppError.unauthorized('Credenciales incorrectas');

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      user: { email: user.email, status: user.status, role: user.role },
      accessToken,
      refreshToken
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/user/register (datos personales)
export const updatePersonalData = async (req, res, next) => {
  try {
    const { name, lastName, nif } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, lastName, nif },
      { new: true, runValidators: true }
    );
    if (!user) throw AppError.notFound('Usuario no encontrado');
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/user/company
export const updateCompany = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw AppError.notFound('Usuario no encontrado');

    let company;
    if (req.body.isFreelance) {
      // Autónomo: usar datos personales del usuario
      const existing = await Company.findOne({ cif: user.nif });
      if (existing) {
        company = existing;
        user.role = 'guest';
      } else {
        company = await Company.create({
          owner: user._id,
          name: `${user.name} ${user.lastName}`,
          cif: user.nif,
          address: user.address,
          isFreelance: true
        });
      }
    } else {
      const { name, cif, address } = req.body;
      const existing = await Company.findOne({ cif });
      if (existing) {
        // Unirse a compañía existente
        company = existing;
        user.role = 'guest';
      } else {
        // Crear nueva compañía
        company = await Company.create({
          owner: user._id,
          name,
          cif,
          address,
          isFreelance: false
        });
      }
    }

    user.company = company._id;
    await user.save();

    res.json({ company, role: user.role });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/user/logo
export const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) throw AppError.badRequest('No se ha proporcionado ninguna imagen');

    const user = await User.findById(req.user.id);
    if (!user || !user.company) throw AppError.badRequest('El usuario no tiene compañía asociada');

    const logoUrl = `${process.env.PUBLIC_URL}/uploads/${req.file.filename}`;
    await Company.findByIdAndUpdate(user.company, { logo: logoUrl });

    res.json({ logo: logoUrl });
  } catch (err) {
    next(err);
  }
};

// GET /api/user
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('company');
    if (!user) throw AppError.notFound('Usuario no encontrado');
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// POST /api/user/refresh
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) throw AppError.unauthorized('Refresh token no proporcionado');
    if (tokenBlacklist.has(token)) throw AppError.unauthorized('Refresh token inválido');

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) throw AppError.unauthorized('Refresh token inválido');

    const newAccessToken = generateAccessToken({ id: user._id, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user._id });

    // Rotar refresh token
    tokenBlacklist.add(token);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
};

// POST /api/user/logout
export const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user && user.refreshToken) {
      tokenBlacklist.add(user.refreshToken);
      user.refreshToken = null;
      await user.save();
    }
    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/user
export const deleteUser = async (req, res, next) => {
  try {
    const soft = req.query.soft === 'true';
    const user = await User.findById(req.user.id);
    if (!user) throw AppError.notFound('Usuario no encontrado');

    if (soft) {
      user.deleted = true;
      await user.save();
    } else {
      await user.deleteOne();
    }

    emitter.emit('user:deleted', user);
    res.json({ message: soft ? 'Usuario desactivado' : 'Usuario eliminado' });
  } catch (err) {
    next(err);
  }
};

// PUT /api/user/password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    if (!user) throw AppError.notFound('Usuario no encontrado');

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw AppError.unauthorized('La contraseña actual no es correcta');

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
};

// POST /api/user/invite
export const inviteUser = async (req, res, next) => {
  try {
    const inviter = await User.findById(req.user.id);
    if (!inviter || !inviter.company) throw AppError.badRequest('No tienes compañía asignada');

    const { email, name, lastName } = req.body;
    const tempPassword = await bcrypt.hash('Temporal123!', 10);
    const code = String(Math.floor(100000 + Math.random() * 900000));

    const invited = await User.create({
      email,
      name,
      lastName,
      password: tempPassword,
      company: inviter.company,
      role: 'guest',
      verificationCode: code,
      verificationAttempts: 3
    });

    emitter.emit('user:invited', invited);

    res.status(201).json({ user: { email: invited.email, role: invited.role } });
  } catch (err) {
    next(err);
  }
};
