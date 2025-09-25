import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { prisma } from '../utils/prisma.js';

const router = express.Router();

// Vendor middleware
router.use(authenticate, authorize('VENDOR'));

// Get vendor dashboard stats
router.get('/dashboard/stats', async (req: AuthRequest, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.id },
      include: {
        events: true,
        orders: true,
      },
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const totalEvents = vendor.events.length;
    const pendingEvents = vendor.events.filter((event: { status: string; }) => event.status === 'PENDING').length;
    const approvedEvents = vendor.events.filter((event: { status: string; }) => event.status === 'APPROVED').length;
    const totalOrders = vendor.orders.length;
    const totalRevenue = vendor.orders.reduce((sum: any, order: { totalAmount: any; }) => sum + order.totalAmount, 0);

    const recentEvents = await prisma.event.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentOrders = await prisma.order.findMany({
      where: { vendorId: vendor.id },
      include: {
        event: {
          select: {
            title: true,
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    res.json({
      totalEvents,
      pendingEvents,
      approvedEvents,
      totalOrders,
      totalRevenue,
      recentEvents,
      recentOrders,
    });
  } catch (error) {
    console.error('Get vendor stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get vendor orders
router.get('/orders', async (req: AuthRequest, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user!.id },
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
          },
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    console.error('Get vendor orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;