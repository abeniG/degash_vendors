import { prisma } from '../utils/database.js';
import { successResponse, errorResponse, getPagination } from '../utils/helpers.js';

export const getEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status, featured, vendorId, search } = req.query;
    const { skip, take } = getPagination(page, limit);

    // Build filter
    const where = {
      ...(category && { category }),
      ...(status && { status }),
      ...(featured !== undefined && { featured: featured === 'true' }),
      ...(vendorId && { vendorId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Get events with vendor info and counts
    const events = await prisma.event.findMany({
      where,
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
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get total count for pagination
    const total = await prisma.event.count({ where });

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
    console.error('Get events error:', error);
    res.status(500).json(errorResponse('Failed to fetch events'));
  }
};

export const getApprovedEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, featured, search } = req.query;
    const { skip, take } = getPagination(page, limit);

    // Build filter for approved events from active vendors
    const where = {
      status: 'APPROVED',
      vendor: { isActive: true },
      ...(category && { category }),
      ...(featured !== undefined && { featured: featured === 'true' }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { vendor: { companyName: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const events = await prisma.event.findMany({
      where,
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
            reviews: true,
          },
        },
      },
      orderBy: {
        ...(featured === 'true' ? { featured: 'desc' } : {}),
        rating: 'desc',
        createdAt: 'desc',
      },
    });

    const total = await prisma.event.count({ where });

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
    console.error('Get approved events error:', error);
    res.status(500).json(errorResponse('Failed to fetch events'));
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        vendor: {
          include: {
            user: {
              select: { name: true, email: true, phone: true, avatar: true },
            },
          },
        },
        services: true,
        reviews: {
          include: {
            user: {
              select: { name: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            favorites: true,
            orders: true,
            reviews: true,
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found'));
    }

    res.json(successResponse({ event }));
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json(errorResponse('Failed to fetch event'));
  }
};

export const createEvent = async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.id },
    });

    if (!vendor) {
      return res.status(403).json(errorResponse('Vendor profile not found'));
    }

    const {
      title,
      description,
      category,
      basePrice,
      services,
      gallery = [],
    } = req.body;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        category,
        basePrice: parseFloat(basePrice),
        vendorId: vendor.id,
        gallery,
        services: {
          create: services.map(service => ({
            name: service.name,
            description: service.description,
            price: parseFloat(service.price),
            duration: service.duration ? parseInt(service.duration) : null,
            isIncluded: service.isIncluded !== false,
          })),
        },
      },
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

    res.status(201).json(successResponse(
      { event },
      'Event created successfully. Waiting for admin approval.'
    ));
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json(errorResponse('Failed to create event'));
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.id },
    });

    if (!vendor) {
      return res.status(403).json(errorResponse('Vendor profile not found'));
    }

    // Verify event belongs to vendor
    const existingEvent = await prisma.event.findFirst({
      where: { id, vendorId: vendor.id },
    });

    if (!existingEvent) {
      return res.status(404).json(errorResponse('Event not found or access denied'));
    }

    const {
      title,
      description,
      category,
      basePrice,
      services,
      gallery,
    } = req.body;

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category }),
        ...(basePrice && { basePrice: parseFloat(basePrice) }),
        ...(gallery && { gallery }),
        ...(services && {
          services: {
            deleteMany: {}, // Remove existing services
            create: services.map(service => ({
              name: service.name,
              description: service.description,
              price: parseFloat(service.price),
              duration: service.duration ? parseInt(service.duration) : null,
              isIncluded: service.isIncluded !== false,
            })),
          },
        }),
        status: 'PENDING', // Reset status for admin review
      },
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

    res.json(successResponse(
      { event },
      'Event updated successfully. Waiting for admin approval.'
    ));
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json(errorResponse('Failed to update event'));
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.id },
    });

    if (!vendor) {
      return res.status(403).json(errorResponse('Vendor profile not found'));
    }

    // Verify event belongs to vendor
    const event = await prisma.event.findFirst({
      where: { id, vendorId: vendor.id },
    });

    if (!event) {
      return res.status(404).json(errorResponse('Event not found or access denied'));
    }

    // Check if event has orders
    const orderCount = await prisma.order.count({
      where: { eventId: id },
    });

    if (orderCount > 0) {
      return res.status(400).json(errorResponse('Cannot delete event with existing orders'));
    }

    await prisma.event.delete({
      where: { id },
    });

    res.json(successResponse(null, 'Event deleted successfully'));
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json(errorResponse('Failed to delete event'));
  }
};

export const getVendorEvents = async (req, res) => {
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

    const events = await prisma.event.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        services: true,
        _count: {
          select: {
            favorites: true,
            orders: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.event.count({ where });

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
    console.error('Get vendor events error:', error);
    res.status(500).json(errorResponse('Failed to fetch vendor events'));
  }
};