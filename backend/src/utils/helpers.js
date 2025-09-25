import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

// Password utilities
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// JWT utilities
export const generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

// Validation utilities
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

// Response utilities
export const successResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data,
  };
};

export const errorResponse = (message = 'Error', errors = null) => {
  return {
    success: false,
    message,
    errors,
  };
};

// Pagination utilities
export const getPagination = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
};

export const getPagingData = (data, page, limit) => {
  const { count: totalItems, rows: items } = data;
  const currentPage = page ? +page : 1;
  const totalPages = Math.ceil(totalItems / limit);

  return { totalItems, items, totalPages, currentPage };
};