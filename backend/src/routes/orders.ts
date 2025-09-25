import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';
import { prisma } from '../utils/prisma.js';

const router = express.Router();

// Create order
router.post('/', [
  body('customerName').trim().notEmpty(),
  body('phone').trim().notEmpty(),
  body('eventDate').isISO8601(),
  body('totalAmount').isFloat({ min: 0 }),
  body('advancePaid').isFloat({ min: 0 }),
  body('eventId').trim().notEmpty(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { customerName, phone, eventDate, comments, totalAmount, advancePaid, eventId, userId } = req.body;

    // Verify event exists and is approved
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { vendor: true }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Event is not available for booking' });
    }

    const order = await prisma.order.create({
      data: {
        customerName,
        phone,
        eventDate: new Date(eventDate),
        comments,
        totalAmount,
        advancePaid,
        eventId,
        vendorId: event.vendorId,
        userId: userId || 'guest', // For guest orders
      },
      include: {
        event: true,
        vendor: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get vendor orders
router.get('/vendor/my-orders', authenticate, authorize('VENDOR'), async (req: AuthRequest, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.id }
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const orders = await prisma.order.findMany({
      where: { vendorId: vendor.id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            category: true,
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    console.error('Get vendor orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status
router.patch('/:id/status', authenticate, authorize('VENDOR', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;

    if (!['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // If vendor, verify they own the order
    if (req.user!.role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: req.user!.id }
      });

      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const order = await prisma.order.findFirst({
        where: { 
          id: req.params.id, 
          vendorId: vendor.id 
        }
      });

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        event: true,
        vendor: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;