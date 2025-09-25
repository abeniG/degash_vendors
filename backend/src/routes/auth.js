import express from 'express';
import { body } from 'express-validator';
import {
  register,
  registerVendor,
  login,
  getMe,
  updateProfile,
  changePassword,
} from '../controllers/authController.js';
import { authenticate, requireAuth } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  handleValidationErrors,
], register);

router.post('/register/vendor', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  body('companyName').trim().notEmpty(),
  body('phone').trim().notEmpty(),
  body('address').trim().notEmpty(),
  handleValidationErrors,
], registerVendor);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists(),
  handleValidationErrors,
], login);

// Protected routes
router.get('/me', requireAuth, getMe);
router.put('/profile', requireAuth, updateProfile);
router.put('/password', requireAuth, [
  body('currentPassword').exists(),
  body('newPassword').isLength({ min: 6 }),
  handleValidationErrors,
], changePassword);

export default router;