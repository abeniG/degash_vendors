import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';
import { prisma } from '../utils/prisma.js';

const router = express.Router();

// Get all approved events (for mobile app)
router.get('/approved', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { 
        status: 'APPROVED',
        vendor: { isActive: true }
      },
      include: {
        vendor: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        services: true,
        _count: {
          select: {
            favorites: true,
            orders: true
          }
        }
      },
      orderBy: { 
        rating: 'desc',
        createdAt: 'desc'
      }
    });

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get events by vendor
router.get('/vendor/my-events', authenticate, authorize('VENDOR'), async (req: AuthRequest, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.id }
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const events = await prisma.event.findMany({
      where: { vendorId: vendor.id },
      include: { 
        services: true,
        _count: {
          select: {
            orders: true,
            favorites: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(events);
  } catch (error) {
    console.error('Get vendor events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        services: true,
        _count: {
          select: {
            favorites: true,
            orders: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create event
router.post('/', authenticate, authorize('VENDOR'), [
  body('title').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('category').trim().notEmpty(),
  body('basePrice').isFloat({ min: 0 }),
  handleValidationErrors
], async (req: AuthRequest, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.id }
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const { title, description, category, basePrice, imageUrl, services } = req.body;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        category,
        basePrice,
        imageUrl: imageUrl || 'https://picsum.photos/400/300',
        vendorId: vendor.id,
        services: {
          create: services || [],
        },
      },
      include: { 
        services: true,
        vendor: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      },
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event
router.put('/:id', authenticate, authorize('VENDOR'), async (req: AuthRequest, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.id }
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const event = await prisma.event.findFirst({
      where: { 
        id: req.params.id, 
        vendorId: vendor.id 
      }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const updatedEvent = await prisma.event.update({
      where: { id: req.params.id },
      data: req.body,
      include: { 
        services: true,
        vendor: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      },
    });

    res.json(updatedEvent);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event
router.delete('/:id', authenticate, authorize('VENDOR'), async (req: AuthRequest, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.id }
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const event = await prisma.event.findFirst({
      where: { 
        id: req.params.id, 
        vendorId: vendor.id 
      }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await prisma.event.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;