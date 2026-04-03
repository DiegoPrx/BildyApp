import { AppError } from '../utils/AppError.js';

// Middleware de autorización por roles
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(AppError.forbidden('No tienes permisos para esta acción'));
  }
  next();
};
