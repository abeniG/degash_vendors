import { prisma } from '../utils/database.js';
import { hashPassword, comparePassword, generateToken, isValidEmail } from '../utils/helpers.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

export const register = async (req, res) => {
  try {
    const { email, password, name, phone, role = 'CUSTOMER' } = req.body;

    // Validate email
    if (!isValidEmail(email)) {
      return res.status(400).json(errorResponse('Please provide a valid email address'));
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json(errorResponse('User with this email already exists'));
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.status(201).json(successResponse(
      { user, token },
      'User registered successfully'
    ));
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json(errorResponse('Registration failed'));
  }
};

export const registerVendor = async (req, res) => {
  try {
    const { email, password, name, phone, companyName, description, address, website } = req.body;

    // Validate email
    if (!isValidEmail(email)) {
      return res.status(400).json(errorResponse('Please provide a valid email address'));
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json(errorResponse('User with this email already exists'));
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and vendor
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: 'VENDOR',
        vendor: {
          create: {
            companyName,
            description,
            address,
            website,
            phone,
          },
        },
      },
      include: {
        vendor: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        vendor: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.status(201).json(successResponse(
      { user, token },
      'Vendor registered successfully'
    ));
  } catch (error) {
    console.error('Vendor registration error:', error);
    res.status(500).json(errorResponse('Vendor registration failed'));
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json(errorResponse('Email and password are required'));
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        vendor: true,
        admin: true,
      },
    });

    if (!user) {
      return res.status(401).json(errorResponse('Invalid credentials'));
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(errorResponse('Invalid credentials'));
    }

    // Check if vendor is active
    if (user.role === 'VENDOR' && user.vendor && !user.vendor.isActive) {
      return res.status(403).json(errorResponse('Your vendor account has been deactivated'));
    }

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json(successResponse(
      { user: userWithoutPassword, token },
      'Login successful'
    ));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(errorResponse('Login failed'));
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        vendor: true,
        admin: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        vendor: true,
        admin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    res.json(successResponse({ user }, 'User profile retrieved successfully'));
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json(errorResponse('Failed to get user profile'));
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const userId = req.user.id;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(avatar && { avatar }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(successResponse(
      { user: updatedUser },
      'Profile updated successfully'
    ));
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json(errorResponse('Failed to update profile'));
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json(errorResponse('Current password is incorrect'));
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    res.json(successResponse(null, 'Password changed successfully'));
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json(errorResponse('Failed to change password'));
  }
};