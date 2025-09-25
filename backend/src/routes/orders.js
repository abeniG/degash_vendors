import express from 'express';
import { body } from 'express-validator';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getVendorOrders,
  getUserOrders,
} from '../controllers/orderController.js';
import { requireAuth, requireVendor, requireAdmin } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Public route (for guest orders)
router.post('/', [
  body('eventId').trim().notEmpty(),
  body('customerName').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('phone').trim().notEmpty(),
  body('eventDate').isISO8601(),
  body('totalAmount').isFloat({ min: 0 }),
  handleValidationErrors,
], createOrder);

// Protected routes
router.get('/', requireAuth, getOrders);
router.get('/user/my-orders', requireAuth, getUserOrders);
router.get('/:id', requireAuth, getOrderById);

// Vendor routes
router.get('/vendor/my-orders', requireVendor, getVendorOrders);
router.patch('/:id/status', requireVendor, [
  body('status').isIn(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  handleValidationErrors,
], updateOrderStatus);

// Admin routes
router.get('/admin/all', requireAdmin, getOrders);

export default router;