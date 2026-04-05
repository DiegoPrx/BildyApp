import { Router } from 'express';
import {
  register,
  verifyEmail,
  login,
  updatePersonalData,
  updateCompany,
  uploadLogo as uploadLogoController,
  getUser,
  refreshToken,
  logout,
  deleteUser,
  changePassword,
  inviteUser
} from '../controllers/user.controller.js';
import { auth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { uploadLogo } from '../middlewares/upload.middleware.js';
import {
  registerSchema,
  verifyCodeSchema,
  loginSchema,
  personalDataSchema,
  companySchema,
  changePasswordSchema,
  inviteSchema
} from '../validators/user.validator.js';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.put('/validation', auth, validateBody(verifyCodeSchema), verifyEmail);
router.post('/login', validateBody(loginSchema), login);
router.put('/register', auth, validateBody(personalDataSchema), updatePersonalData);
router.patch('/company', auth, validateBody(companySchema), updateCompany);
router.patch('/logo', auth, uploadLogo, uploadLogoController);
router.get('/', auth, getUser);
router.post('/refresh', refreshToken);
router.post('/logout', auth, logout);
router.delete('/', auth, deleteUser);
router.put('/password', auth, validateBody(changePasswordSchema), changePassword);
router.post('/invite', auth, requireRole('admin'), validateBody(inviteSchema), inviteUser);

export default router;
