import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from '../src/config/config.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash(config.defaultAdminPassword, 12);
  const adminUser = await prisma.user.upsert({
    where: { email: config.defaultAdminEmail },
    update: {},
    create: {
      email: config.defaultAdminEmail,
      password: adminPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      admin: {
        create: {
          level: 'SUPER',
        }
      }
    },
  });

  // Create sample vendor
  const vendorPassword = await bcrypt.hash(config.defaultVendorPassword, 12);
  const vendorUser = await prisma.user.upsert({
    where: { email: config.defaultVendorEmail },
    update: {},
    create: {
      email: config.defaultVendorEmail,
      password: vendorPassword,
      name: 'John Event Vendor',
      phone: '+1234567890',
      role: 'VENDOR',
      vendor: {
        create: {
          companyName: 'Premium Events Co.',
          description: 'We provide the best event management services for weddings, corporate events, and private parties.',
          phone: '+1234567890',
          address: '123 Event Street, New York, NY 10001',
          website: 'https://premium-events.com',
          rating: 4.8,
        }
      }
    },
  });

  // Create sample customer
  const customerPassword = await bcrypt.hash('customer123', 12);
  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: customerPassword,
      name: 'Jane Customer',
      phone: '+1987654321',
      role: 'CUSTOMER',
    },
  });

  // Get vendor ID
  const vendor = await prisma.vendor.findFirst({
    where: { userId: vendorUser.id },
  });

  // Create sample events
  const sampleEvents = [
    {
      title: 'Luxury Wedding Package',
      description: 'Complete wedding package with premium services including venue, catering, photography, and decoration. Perfect for your special day with attention to every detail.',
      category: 'Wedding',
      basePrice: 5000,
      imageUrl: 'https://picsum.photos/600/400?random=1',
      gallery: [
        'https://picsum.photos/600/400?random=2',
        'https://picsum.photos/600/400?random=3',
        'https://picsum.photos/600/400?random=4'
      ],
      status: 'APPROVED',
      featured: true,
      rating: 4.8,
      reviewCount: 24,
      vendorId: vendor.id,
      services: [
        { name: 'Venue Rental', description: 'Luxury wedding venue for 8 hours', price: 2000, duration: 8, isIncluded: true },
        { name: 'Catering', description: 'Premium catering for 100 guests', price: 1500, isIncluded: true },
        { name: 'Photography', description: 'Professional photography package with 2 photographers', price: 800, duration: 10, isIncluded: true },
        { name: 'Decoration', description: 'Full venue decoration with flowers and lighting', price: 700, isIncluded: true },
        { name: 'Videography', description: 'HD videography with drone shots', price: 600, duration: 10, isIncluded: false },
      ]
    },
    {
      title: 'Corporate Event Package',
      description: 'Professional corporate event management for conferences, seminars, and business meetings. Includes full AV setup and catering.',
      category: 'Corporate',
      basePrice: 3000,
      imageUrl: 'https://picsum.photos/600/400?random=5',
      gallery: [
        'https://picsum.photos/600/400?random=6',
        'https://picsum.photos/600/400?random=7'
      ],
      status: 'APPROVED',
      featured: false,
      rating: 4.5,
      reviewCount: 15,
      vendorId: vendor.id,
      services: [
        { name: 'Conference Hall', description: 'Professional conference venue for 200 people', price: 1200, duration: 8, isIncluded: true },
        { name: 'AV Equipment', description: 'Audio-visual equipment setup with projectors and sound system', price: 800, isIncluded: true },
        { name: 'Catering', description: 'Business lunch and coffee breaks for 200 attendees', price: 600, isIncluded: true },
        { name: 'Materials', description: 'Conference materials and handouts', price: 400, isIncluded: true },
      ]
    },
    {
      title: 'Birthday Celebration Package',
      description: 'Fun and memorable birthday celebrations for all ages. Includes entertainment, decorations, and catering.',
      category: 'Birthday',
      basePrice: 1500,
      imageUrl: 'https://picsum.photos/600/400?random=8',
      status: 'PENDING',
      featured: false,
      rating: 0,
      reviewCount: 0,
      vendorId: vendor.id,
      services: [
        { name: 'Venue Setup', description: 'Birthday-themed venue decoration', price: 500, duration: 4, isIncluded: true },
        { name: 'Entertainment', description: 'DJ or live music performance', price: 400, duration: 4, isIncluded: true },
        { name: 'Catering', description: 'Food and drinks for 50 guests', price: 600, isIncluded: true },
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

  // Create sample orders
  const events = await prisma.event.findMany();
  
  const sampleOrders = [
    {
      customerName: 'Michael Johnson',
      email: 'michael@example.com',
      phone: '+1555123456',
      eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      venue: 'Grand Hotel Ballroom',
      guestCount: 120,
      comments: 'Please include vegetarian options',
      totalAmount: 5000,
      advancePaid: 2500,
      status: 'CONFIRMED',
      paymentStatus: 'PARTIAL',
      eventId: events[0].id,
      vendorId: vendor.id,
      userId: customerUser.id,
    },
    {
      customerName: 'Tech Corp Inc.',
      email: 'events@techcorp.com',
      phone: '+1555987654',
      eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      venue: 'Tech Corp Headquarters',
      guestCount: 200,
      comments: 'Need high-speed internet and multiple power outlets',
      totalAmount: 3000,
      advancePaid: 3000,
      status: 'CONFIRMED',
      paymentStatus: 'COMPLETED',
      eventId: events[1].id,
      vendorId: vendor.id,
    }
  ];

  for (const orderData of sampleOrders) {
    await prisma.order.upsert({
      where: { 
        eventId_eventDate: {
          eventId: orderData.eventId,
          eventDate: orderData.eventDate
        }
      },
      update: {},
      create: orderData,
    });
  }

  console.log('✅ Database seed completed successfully!');
  console.log('📊 Created:');
  console.log('   👤 1 Admin user');
  console.log('   🏪 1 Vendor user');
  console.log('   👥 1 Customer user');
  console.log('   🎉 3 Events (2 approved, 1 pending)');
  console.log('   📋 2 Sample orders');
  console.log('');
  console.log('🔑 Login Credentials:');
  console.log('   Admin:    ', config.defaultAdminEmail, '/', config.defaultAdminPassword);
  console.log('   Vendor:   ', config.defaultVendorEmail, '/', config.defaultVendorPassword);
  console.log('   Customer: customer@example.com / customer123');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });