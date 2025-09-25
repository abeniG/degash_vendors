import { prisma } from '../utils/database.js';
import { successResponse, errorResponse, getPagination } from '../utils/helpers.js';

export const createOrder = async (req, res) => {
  try {
    const {
      eventId,
      customerName,
      email,
      phone,
      eventDate,
      venue,
      guestCount = 50,
      comments,
      totalAmount,
      advancePaid,
      selectedServices = [],
    } = req.body;

    // Verify event exists and is approved
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { vendor: true },
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found'));
    }

    if (event.status !== 'APPROVED') {
      return res.status(400).json(errorResponse('This event is not available for booking'));
    }

    if (!event.vendor.isActive) {
      return res.status(400).json(errorResponse('Vendor is not currently active'));
    }

    // Calculate total if not provided
    let calculatedTotal = parseFloat(totalAmount) || event.basePrice;
    
    // Add selected services cost
    if (selectedServices.length > 0) {
      const services = await prisma.service.findMany({
        where: { id: { in: selectedServices } },
      });
      
      const servicesTotal = services.reduce((sum, service) => sum + service.price, 0);
      calculatedTotal += servicesTotal;
    }

    const calculatedAdvance = parseFloat(advancePaid) || calculatedTotal * 0.5;

    const order = await prisma.order.create({
      data: {
        eventId,
        vendorId: event.vendorId,
        userId: req.user?.id, // Optional, for logged-in users
        customerName,
        email,
        phone,
        eventDate: new Date(eventDate),
        venue,
        guestCount: parseInt(guestCount),
        comments,
        totalAmount: calculatedTotal,
        advancePaid: calculatedAdvance,
      },
      include: {
        event: {
          select: {
            title: true,
            category: true,
            imageUrl: true,
          },
        },
        vendor: {
          include: {
            user: {
              select: { name: true, email: true, phone: true },
            },
          },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });

    res.status(201).json(successResponse(
      { order },
      'Order created successfully'
    ));
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json(errorResponse('Failed to create order'));
  }
};

export const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, vendorId, userId } = req.query;
    const { skip, take } = getPagination(page, limit);

    const where = {
      ...(status && { status }),
      ...(vendorId && { vendorId }),
      ...(userId && { userId }),
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
            imageUrl: true,
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
    console.error('Get orders error:', error);
    res.status(500).json(errorResponse('Failed to fetch orders'));
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        event: {
          include: {
            services: true,
            vendor: {
              include: {
                user: {
                  select: { name: true, email: true, phone: true },
                },
              },
            },
          },
        },
        vendor: {
          include: {
            user: {
              select: { name: true, email: true, phone: true },
            },
          },
        },
        user: {
          select: { name: true, email: true, phone: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json(errorResponse('Order not found'));
    }

    res.json(successResponse({ order }));
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json(errorResponse('Failed to fetch order'));
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    // Verify order exists and user has permission
    const order = await prisma.order.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!order) {
      return res.status(404).json(errorResponse('Order not found'));
    }

    // Check if user is vendor and owns the order
    if (req.user.role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: req.user.id },
      });

      if (!vendor || order.vendorId !== vendor.id) {
        return res.status(403).json(errorResponse('Access denied'));
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
      },
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
    });

    res.json(successResponse(
      { order: updatedOrder },
      'Order status updated successfully'
    ));
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json(errorResponse('Failed to update order status'));
  }
};

export const getVendorOrders = async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.id },
    });

    if (!vendor) {
      return res.status(403).json(errorResponse('Vendor profile not found'));
    }

    const { page = 1, limit = 10, status } = req.query;
    const { skip, take } = getPagination(page, limit);

    const where = {
      vendorId: vendor.id,
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
            imageUrl: true,
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
    console.error('Get vendor orders error:', error);
    res.status(500).json(errorResponse('Failed to fetch vendor orders'));
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const { skip, take } = getPagination(page, limit);

    const where = {
      userId: req.user.id,
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
            imageUrl: true,
          },
        },
        vendor: {
          include: {
            user: {
              select: { name: true, email: true, phone: true },
            },
          },
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
    console.error('Get user orders error:', error);
    res.status(500).json(errorResponse('Failed to fetch user orders'));
  }
};