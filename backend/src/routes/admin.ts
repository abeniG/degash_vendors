import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';

const router = express.Router();

// Admin middleware
router.use(authenticate, authorize('ADMIN'));

// Get all pending events for approval
router.get('/events/pending', async (req: AuthRequest, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { status: 'PENDING' },
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
      orderBy: { createdAt: 'desc' }
    });

    res.json(events);
  } catch (error) {
    console.error('Get pending events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/Reject event
router.patch('/events/:id/status', async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        vendor: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
      },
    });

    res.json(event);
  } catch (error) {
    console.error('Update event status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all vendors
router.get('/vendors', async (req: AuthRequest, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        user: {
          select: { 
            name: true, 
            email: true, 
            createdAt: true 
          }
        },
        events: {
          select: {
            _count: true
          }
        },
        orders: {
          select: {
            _count: true
          }
        },
        _count: {
          select: {
            events: true,
            orders: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(vendors);
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle vendor status
router.patch('/vendors/:id/status', async (req: AuthRequest, res) => {
  try {
    const { isActive } = req.body;

    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: { isActive },
      include: {
        user: {
          select: { name: true, email: true }
        },
      },
    });

    res.json(vendor);
  } catch (error) {
    console.error('Toggle vendor status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all orders
router.get('/orders', async (req: AuthRequest, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        event: {
          select: {
            title: true,
            category: true,
          }
        },
        vendor: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        user: {
          select: { name: true, email: true }
        },
      },
      orderBy: { eventDate: 'asc' }
    });

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard stats
router.get('/dashboard/stats', async (req: AuthRequest, res) => {
  try {
    const [
      totalVendors,
      activeVendors,
      totalEvents,
      approvedEvents,
      pendingEvents,
      totalOrders,
      recentOrders
    ] = await Promise.all([
      prisma.vendor.count(),
      prisma.vendor.count({ where: { isActive: true } }),
      prisma.event.count(),
      prisma.event.count({ where: { status: 'APPROVED' } }),
      prisma.event.count({ where: { status: 'PENDING' } }),
      prisma.order.count(),
      prisma.order.findMany({
        take: 5,
        include: {
          event: {
            select: {
              title: true,
              category: true
            }
          },
          vendor: {
            include: {
              user: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const totalRevenue = await prisma.order.aggregate({
      _sum: {
        totalAmount: true
      }
    });

    res.json({
      totalVendors,
      activeVendors,
      totalEvents,
      approvedEvents,
      pendingEvents,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      recentOrders
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;