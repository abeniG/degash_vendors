import express from 'express';
import authRoutes from './auth.js';
import eventRoutes from './events.js';
import orderRoutes from './orders.js';
import adminRoutes from './admin.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);

export default router;