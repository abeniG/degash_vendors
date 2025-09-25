import express from 'express';
import { body } from 'express-validator';
import {
  getDashboardStats,
  getPendingEvents,
  updateEventStatus,
  getVendors,
  updateVendorStatus,
  getAdminOrders,
} from '../controllers/adminController.js';
import { requireAdmin } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Admin routes
router.get('/dashboard/stats', requireAdmin, getDashboardStats);
router.get('/events/pending', requireAdmin, getPendingEvents);
router.patch('/events/:id/status', requireAdmin, [
  body('status').isIn(['APPROVED', 'REJECTED', 'SUSPENDED']),
  handleValidationErrors,
], updateEventStatus);
router.get('/vendors', requireAdmin, getVendors);
router.patch('/vendors/:id/status', requireAdmin, updateVendorStatus);
router.get('/orders', requireAdmin, getAdminOrders);

export default router;