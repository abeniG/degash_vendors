import { PrismaClient } from '@prisma/client';

class Database {
  constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty',
    });
  }

  async connect() {
    try {
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      process.exit(1);
    }
  }

  async disconnect() {
    await this.prisma.$disconnect();
    console.log('✅ Database disconnected');
  }

  getClient() {
    return this.prisma;
  }
}

export const db = new Database();
export const prisma = db.getClient();