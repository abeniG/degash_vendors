import { verifyToken } from '../utils/helpers.js';
import { prisma } from '../utils/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const decoded = verifyToken(token);
    
    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        vendor: true,
        admin: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.',
      });
    }

    // Check if vendor is active
    if (user.role === 'VENDOR' && user.vendor && !user.vendor.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your vendor account has been deactivated.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }

    next();
  };
};

// Specific role middlewares
export const requireAdmin = [authenticate, authorize('ADMIN')];
export const requireVendor = [authenticate, authorize('VENDOR')];
export const requireCustomer = [authenticate, authorize('CUSTOMER')];
export const requireAuth = [authenticate];