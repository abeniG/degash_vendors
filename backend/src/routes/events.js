import express from 'express';
import { body } from 'express-validator';
import {
  getEvents,
  getApprovedEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getVendorEvents,
} from '../controllers/eventController.js';
import { requireAuth, requireVendor, requireAdmin } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';
import { uploadSingle } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getEvents);
router.get('/approved', getApprovedEvents);
router.get('/:id', getEventById);

// Vendor routes
router.get('/vendor/my-events', requireVendor, getVendorEvents);
router.post('/', requireVendor, [
  body('title').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('category').trim().notEmpty(),
  body('basePrice').isFloat({ min: 0 }),
  handleValidationErrors,
], createEvent);

router.put('/:id', requireVendor, updateEvent);
router.delete('/:id', requireVendor, deleteEvent);

// Admin routes (for moderation)
router.get('/admin/pending', requireAdmin, getEvents);

export default router;