import { prisma } from '../utils/database.js';
import { successResponse, errorResponse, getPagination } from '../utils/helpers.js';

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalVendors,
      activeVendors,
      totalEvents,
      approvedEvents,
      pendingEvents,
      totalOrders,
      totalRevenue,
      recentOrders,
      recentEvents,
    ] = await Promise.all([
      prisma.vendor.count(),
      prisma.vendor.count({ where: { isActive: true } }),
      prisma.event.count(),
      prisma.event.count({ where: { status: 'APPROVED' } }),
      prisma.event.count({ where: { status: 'PENDING' } }),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'COMPLETED' },
      }),
      prisma.order.findMany({
        take: 5,
        include: {
          event: { select: { title: true } },
          vendor: { include: { user: { select: { name: true } } } },
          user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.event.findMany({
        take: 5,
        include: {
          vendor: { include: { user: { select: { name: true } } } },
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json(successResponse({
      stats: {
        totalVendors,
        activeVendors,
        totalEvents,
        approvedEvents,
        pendingEvents,
        totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
      },
      recentOrders,
      recentEvents,
    }));
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json(errorResponse('Failed to fetch dashboard stats'));
  }
};

export const getPendingEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip, take } = getPagination(page, limit);

    const events = await prisma.event.findMany({
      where: { status: 'PENDING' },
      skip,
      take: parseInt(limit),
      include: {
        vendor: {
          include: {
            user: {
              select: { name: true, email: true, phone: true },
            },
          },
        },
        services: true,
        _count: {
          select: {
            favorites: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.event.count({ where: { status: 'PENDING' } });

    res.json(successResponse({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }));
  } catch (error) {
    console.error('Get pending events error:', error);
    res.status(500).json(errorResponse('Failed to fetch pending events'));
  }
};

export const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) {
      return res.status(400).json(errorResponse('Invalid status'));
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json(errorResponse('Event not found'));
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { status },
      include: {
        vendor: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        services: true,
      },
    });

    // TODO: Send notification to vendor about status change

    res.json(successResponse(
      { event: updatedEvent },
      `Event ${status.toLowerCase()} successfully`
    ));
  } catch (error) {
    console.error('Update event status error:', error);
    res.status(500).json(errorResponse('Failed to update event status'));
  }
};

export const getVendors = async (req, res) => {
  try {
    const { page = 1, limit = 10, active } = req.query;
    const { skip, take } = getPagination(page, limit);

    const where = {
      ...(active !== undefined && { isActive: active === 'true' }),
    };

    const vendors = await prisma.vendor.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            events: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.vendor.count({ where });

    res.json(successResponse({
      vendors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }));
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json(errorResponse('Failed to fetch vendors'));
  }
};

export const updateVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return res.status(404).json(errorResponse('Vendor not found'));
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data: { isActive },
      include: {
        user: {
          select: { name: true, email: true },
        },
        _count: {
          select: {
            events: true,
            orders: true,
          },
        },
      },
    });

    // TODO: Send notification to vendor about status change

    res.json(successResponse(
      { vendor: updatedVendor },
      `Vendor ${isActive ? 'activated' : 'deactivated'} successfully`
    ));
  } catch (error) {
    console.error('Update vendor status error:', error);
    res.status(500).json(errorResponse('Failed to update vendor status'));
  }
};

export const getAdminOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const { skip, take } = getPagination(page, limit);

    const where = {
      ...(status && { status }),
    };

    const orders = await prisma.order.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        event: {
          select: {
            title: true,
            category: true,
          },
        },
        vendor: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.order.count({ where });

    res.json(successResponse({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }));
  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json(errorResponse('Failed to fetch orders'));
  }
};