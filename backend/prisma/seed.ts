import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@eventmaster.com' },
    update: {},
    create: {
      email: 'admin@eventmaster.com',
      password: adminPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      admin: {
        create: {}
      }
    },
  });

  // Create sample vendor
  const vendorPassword = await bcrypt.hash('vendor123', 10);
  const vendorUser = await prisma.user.upsert({
    where: { email: 'vendor@example.com' },
    update: {},
    create: {
      email: 'vendor@example.com',
      password: vendorPassword,
      name: 'John Vendor',
      role: 'VENDOR',
      vendor: {
        create: {
          companyName: 'Premium Events Co.',
          phone: '+1234567890',
          address: '123 Event Street, City, Country'
        }
      }
    },
  });

  // Create sample events
  const sampleEvents = [
    {
      title: 'Luxury Wedding Package',
      description: 'Complete wedding package with premium services including venue, catering, photography, and decoration.',
      category: 'Wedding',
      basePrice: 5000,
      imageUrl: 'https://picsum.photos/400/300?random=1',
      status: 'APPROVED' as const,
      vendorId: (await prisma.vendor.findFirst({ where: { userId: vendorUser.id } }))!.id,
      services: [
        { name: 'Venue Rental', description: 'Luxury wedding venue', price: 2000, isIncluded: true },
        { name: 'Catering', description: 'Premium catering for 100 guests', price: 1500, isIncluded: true },
        { name: 'Photography', description: 'Professional photography package', price: 800, isIncluded: true },
        { name: 'Decoration', description: 'Full venue decoration', price: 700, isIncluded: true },
      ]
    },
    {
      title: 'Corporate Event Package',
      description: 'Professional corporate event management for conferences and business meetings.',
      category: 'Corporate',
      basePrice: 3000,
      imageUrl: 'https://picsum.photos/400/300?random=2',
      status: 'APPROVED' as const,
      vendorId: (await prisma.vendor.findFirst({ where: { userId: vendorUser.id } }))!.id,
      services: [
        { name: 'Conference Hall', description: 'Professional conference venue', price: 1200, isIncluded: true },
        { name: 'AV Equipment', description: 'Audio-visual equipment setup', price: 800, isIncluded: true },
        { name: 'Catering', description: 'Business lunch and coffee breaks', price: 600, isIncluded: true },
        { name: 'Materials', description: 'Conference materials and handouts', price: 400, isIncluded: true },
      ]
    }
  ];

  for (const eventData of sampleEvents) {
    const { services, ...event } = eventData;
    await prisma.event.upsert({
      where: { title: event.title },
      update: {},
      create: {
        ...event,
        services: {
          create: services
        }
      },
    });
  }

  console.log('✅ Database seed completed!');
  console.log('👤 Admin credentials: admin@eventmaster.com / admin123');
  console.log('🏪 Vendor credentials: vendor@example.com / vendor123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });