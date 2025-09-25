import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import { prisma } from '../utils/prisma.js';
import { config } from '../config/config.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

/** Interfaces for typed req.body */
interface RegisterBody {
  email: string;
  password: string;
  name: string;
  companyName: string;
  phone: string;
  address: string;
}

interface LoginBody {
  email: string;
  password: string;
}

// ========================
// Register vendor
// ========================
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
    body('companyName').trim().notEmpty(),
    body('phone').trim().notEmpty(),
    body('address').trim().notEmpty(),
    handleValidationErrors,
  ],
  async (req: Request<{}, {}, RegisterBody>, res: Response): Promise<void> => {
    try {
      const { email, password, name, companyName, phone, address } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        res.status(400).json({ message: 'User already exists' });
        return;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user and vendor
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'VENDOR',
          vendor: {
            create: {
              companyName,
              phone,
              address,
            },
          },
        },
        include: {
          vendor: true,
          admin: true,
        },
      });

      // Create JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwtSecret as jwt.Secret, // cast to Secret
        );


      // Remove password from response
      const { password: _password, ...userWithoutPassword } = user;

      res.status(201).json({
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ========================
// Login
// ========================
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists(),
    handleValidationErrors,
  ],
  async (req: Request<{}, {}, LoginBody>, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Find user with vendor/admin relations
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          vendor: true,
          admin: true,
        },
      });

      if (!user) {
        res.status(400).json({ message: 'Invalid credentials' });
        return;
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(400).json({ message: 'Invalid credentials' });
        return;
      }

      // Create JWT token
      const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
       config.jwtSecret as jwt.Secret, // cast to Secret
       { expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] } // cast to correct type
      );

      // Remove password from response
      const { password: _password, ...userWithoutPassword } = user;

      res.json({
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ========================
// Get current user
// ========================
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        vendor: true,
        admin: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
