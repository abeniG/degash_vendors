import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // File Upload
  maxFileSize: process.env.MAX_FILE_SIZE || 10485760,
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  
  // Default admin credentials (for seeding)
  defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || 'admin@eventmaster.com',
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
  
  // Default vendor credentials (for seeding)
  defaultVendorEmail: process.env.DEFAULT_VENDOR_EMAIL || 'vendor@example.com',
  defaultVendorPassword: process.env.DEFAULT_VENDOR_PASSWORD || 'vendor123'
};

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});