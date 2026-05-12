import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Karysm database...');

  // === Service Categories ===
  const categories = await Promise.all([
    prisma.serviceCategory.upsert({
      where: { slug: 'coiffure' },
      update: {},
      create: { name: 'Coiffure', nameEn: 'Hair', icon: '💇', slug: 'coiffure', sortOrder: 1 },
    }),
    prisma.serviceCategory.upsert({
      where: { slug: 'ongles' },
      update: {},
      create: { name: 'Ongles', nameEn: 'Nails', icon: '💅', slug: 'ongles', sortOrder: 2 },
    }),
    prisma.serviceCategory.upsert({
      where: { slug: 'maquillage' },
      update: {},
      create: { name: 'Maquillage', nameEn: 'Makeup', icon: '💄', slug: 'maquillage', sortOrder: 3 },
    }),
    prisma.serviceCategory.upsert({
      where: { slug: 'soins' },
      update: {},
      create: { name: 'Soins', nameEn: 'Care', icon: '💆', slug: 'soins', sortOrder: 4 },
    }),
    prisma.serviceCategory.upsert({
      where: { slug: 'barber' },
      update: {},
      create: { name: 'Barber', nameEn: 'Barber', icon: '✂️', slug: 'barber', sortOrder: 5 },
    }),
    prisma.serviceCategory.upsert({
      where: { slug: 'spa' },
      update: {},
      create: { name: 'Spa', nameEn: 'Spa', icon: '🧖', slug: 'spa', sortOrder: 6 },
    }),
  ]);

  const [coiffure, ongles, maquillage, soins, barber, spa] = categories;

  // === Subcategories ===
  const subcategories = [
    // Coiffure
    { name: 'Tresses', nameEn: 'Braids', slug: 'tresses', parentId: coiffure.id, sortOrder: 1 },
    { name: 'Tissage', nameEn: 'Weave', slug: 'tissage', parentId: coiffure.id, sortOrder: 2 },
    { name: 'Locks', nameEn: 'Locs', slug: 'locks', parentId: coiffure.id, sortOrder: 3 },
    { name: 'Coupe', nameEn: 'Haircut', slug: 'coupe', parentId: coiffure.id, sortOrder: 4 },
    { name: 'Lissage', nameEn: 'Straightening', slug: 'lissage', parentId: coiffure.id, sortOrder: 5 },
    { name: 'Soins capillaires', nameEn: 'Hair care', slug: 'soins-capillaires', parentId: coiffure.id, sortOrder: 6 },
    // Ongles
    { name: 'Manucure', nameEn: 'Manicure', slug: 'manucure', parentId: ongles.id, sortOrder: 1 },
    { name: 'Gel UV', nameEn: 'UV Gel', slug: 'gel-uv', parentId: ongles.id, sortOrder: 2 },
    { name: 'Extension ongles', nameEn: 'Nail extension', slug: 'extension-ongles', parentId: ongles.id, sortOrder: 3 },
    { name: 'Nail art', nameEn: 'Nail art', slug: 'nail-art', parentId: ongles.id, sortOrder: 4 },
    { name: 'Pédicure', nameEn: 'Pedicure', slug: 'pedicure', parentId: ongles.id, sortOrder: 5 },
    // Maquillage
    { name: 'Maquillage jour', nameEn: 'Daytime makeup', slug: 'maquillage-jour', parentId: maquillage.id, sortOrder: 1 },
    { name: 'Maquillage soirée', nameEn: 'Evening makeup', slug: 'maquillage-soiree', parentId: maquillage.id, sortOrder: 2 },
    { name: 'Maquillage mariée', nameEn: 'Bridal makeup', slug: 'maquillage-mariee', parentId: maquillage.id, sortOrder: 3 },
    // Soins
    { name: 'Soins visage', nameEn: 'Facial care', slug: 'soins-visage', parentId: soins.id, sortOrder: 1 },
    { name: 'Soins corps', nameEn: 'Body care', slug: 'soins-corps', parentId: soins.id, sortOrder: 2 },
    { name: 'Massage relaxant', nameEn: 'Relaxing massage', slug: 'massage-relaxant', parentId: soins.id, sortOrder: 3 },
    { name: 'Massage drainant', nameEn: 'Draining massage', slug: 'massage-drainant', parentId: soins.id, sortOrder: 4 },
    { name: 'Soins pieds', nameEn: 'Foot care', slug: 'soins-pieds', parentId: soins.id, sortOrder: 5 },
    // Barber
    { name: 'Coupe homme', nameEn: 'Men haircut', slug: 'coupe-homme', parentId: barber.id, sortOrder: 1 },
    { name: 'Barbe', nameEn: 'Beard', slug: 'barbe', parentId: barber.id, sortOrder: 2 },
    { name: 'Rasage', nameEn: 'Shave', slug: 'rasage', parentId: barber.id, sortOrder: 3 },
    // Spa
    { name: 'Hammam', nameEn: 'Hammam', slug: 'hammam', parentId: spa.id, sortOrder: 1 },
    { name: 'Sauna', nameEn: 'Sauna', slug: 'sauna', parentId: spa.id, sortOrder: 2 },
    { name: 'Soin complet', nameEn: 'Full treatment', slug: 'soin-complet', parentId: spa.id, sortOrder: 3 },
  ];

  for (const sub of subcategories) {
    await prisma.serviceCategory.upsert({
      where: { slug: sub.slug },
      update: {},
      create: sub,
    });
  }

  console.log(`  ✅ ${subcategories.length} subcategories created`);

  // === Admin ===
  await prisma.admin.upsert({
    where: { email: 'admin@Karysm.com' },
    update: {},
    create: {
      name: 'Karysm Admin',
      email: 'admin@Karysm.com',
      password: '$2a$10$dummyHashForDevOnly', // bcrypt hash of 'KarysmAdmin2026!'
      role: 'SUPER_ADMIN',
    },
  });

  // === Users (Providers) ===
  const providerUsers = [
    { phone: '+243812345001', name: 'Marie Kabila', city: 'Kinshasa', commune: 'Gombe', lat: -4.3175, lng: 15.3222 },
    { phone: '+243812345002', name: 'Grace Mutombo', city: 'Kinshasa', commune: 'Bandalungwa', lat: -4.3378, lng: 15.2867 },
    { phone: '+243812345003', name: 'Patrick Lumumba', city: 'Kinshasa', commune: 'Matonge', lat: -4.3344, lng: 15.3137 },
    { phone: '+243812345004', name: 'Esther Tshisekedi', city: 'Kinshasa', commune: 'Gombe', lat: -4.3094, lng: 15.3077 },
    { phone: '+243812345005', name: 'David Bokongo', city: 'Kinshasa', commune: 'Ngaliema', lat: -4.3250, lng: 15.2561 },
    { phone: '+237651234001', name: 'Aissatou Njoya', city: 'Douala', commune: 'Bonanjo', lat: 4.0503, lng: 9.6942 },
    { phone: '+241071234001', name: 'Nadia Obame', city: 'Libreville', commune: 'Centre-ville', lat: 0.3924, lng: 9.4536 },
  ];

  for (const pu of providerUsers) {
    const user = await prisma.user.upsert({
      where: { phone: pu.phone },
      update: {},
      create: { phone: pu.phone, name: pu.name, role: 'PROVIDER', isVerified: true },
    });

    const slug = pu.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const provider = await prisma.provider.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        displayName: pu.name,
        slug,
        city: pu.city,
        commune: pu.commune,
        lat: pu.lat,
        lng: pu.lng,
        isMobile: true,
        mobileRadius: 15,
        whatsappNumber: pu.phone,
        currency: pu.city === 'Kinshasa' ? 'CDF' : 'XAF',
        status: 'ACTIVE',
        avgRating: 4 + Math.random(),
        totalReviews: Math.floor(Math.random() * 50) + 5,
        totalBookings: Math.floor(Math.random() * 100) + 10,
        responseRate: 0.85 + Math.random() * 0.15,
        bio: `Professionnelle basee a ${pu.commune}, ${pu.city}. Passionnee par mon metier.`,
      },
    });

    // Create wallet
    await prisma.providerWallet.upsert({
      where: { providerId: provider.id },
      update: {},
      create: { providerId: provider.id, currency: pu.city === 'Kinshasa' ? 'CDF' : 'XAF' },
    });

    // Create availability (Mon-Sat 08:00-18:00)
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
    for (const day of days) {
      await prisma.availability.upsert({
        where: { providerId_dayOfWeek: { providerId: provider.id, dayOfWeek: day } },
        update: {},
        create: {
          providerId: provider.id,
          dayOfWeek: day,
          startTime: day === 'SAT' ? '09:00' : '08:00',
          endTime: day === 'SAT' ? '14:00' : '18:00',
        },
      });
    }

    console.log(`  ✅ Provider: ${pu.name} (${pu.city})`);
  }

  // === Services ===
  const providers = await prisma.provider.findMany();

  const serviceTemplates: { name: string; categoryId: string; durationMin: number; priceMin: number; priceMax: number | null }[] = [
    // Coiffure
    { name: 'Tresses collees', categoryId: coiffure.id, durationMin: 90, priceMin: 5000, priceMax: 8000 },
    { name: 'Tissage complet', categoryId: coiffure.id, durationMin: 120, priceMin: 12000, priceMax: 20000 },
    { name: 'Locs twist', categoryId: coiffure.id, durationMin: 60, priceMin: 4000, priceMax: null },
    { name: 'Soin keratine', categoryId: coiffure.id, durationMin: 45, priceMin: 7000, priceMax: null },
    // Ongles
    { name: 'Pose gel UV', categoryId: ongles.id, durationMin: 60, priceMin: 8000, priceMax: 12000 },
    { name: 'Manucure classique', categoryId: ongles.id, durationMin: 30, priceMin: 3000, priceMax: null },
    { name: 'Nail art complet', categoryId: ongles.id, durationMin: 90, priceMin: 10000, priceMax: 15000 },
    // Maquillage
    { name: 'Maquillage soiree', categoryId: maquillage.id, durationMin: 60, priceMin: 10000, priceMax: 20000 },
    { name: 'Maquillage naturel', categoryId: maquillage.id, durationMin: 30, priceMin: 5000, priceMax: null },
    // Massage
    { name: 'Massage relaxant', categoryId: soins.id, durationMin: 60, priceMin: 15000, priceMax: null },
    { name: 'Massage sportif', categoryId: soins.id, durationMin: 45, priceMin: 12000, priceMax: null },
    // Barber
    { name: 'Coupe homme classique', categoryId: barber.id, durationMin: 30, priceMin: 3000, priceMax: 5000 },
    { name: 'Barbe + coupe', categoryId: barber.id, durationMin: 45, priceMin: 5000, priceMax: 7000 },
    { name: 'Degrade americain', categoryId: barber.id, durationMin: 40, priceMin: 4000, priceMax: 6000 },
  ];

  for (const provider of providers) {
    // Assign 3-5 random services to each provider
    const shuffled = [...serviceTemplates].sort(() => Math.random() - 0.5);
    const count = 3 + Math.floor(Math.random() * 3);
    const selected = shuffled.slice(0, count);

    for (let i = 0; i < selected.length; i++) {
      const svc = selected[i];
      // Adjust prices for XAF (roughly CDF/10)
      const multiplier = provider.currency === 'XAF' ? 0.1 : 1;
      await prisma.service.create({
        data: {
          providerId: provider.id,
          categoryId: svc.categoryId,
          name: svc.name,
          durationMin: svc.durationMin,
          priceMin: Math.round(svc.priceMin * multiplier),
          priceMax: svc.priceMax ? Math.round(svc.priceMax * multiplier) : null,
          sortOrder: i,
        },
      });
    }
  }

  // === Test client user ===
  await prisma.user.upsert({
    where: { phone: '+243812340000' },
    update: {},
    create: { phone: '+243812340000', name: 'Client Test', role: 'CLIENT', isVerified: true },
  });

  console.log('\n✅ Seed completed!');
  console.log(`  ${categories.length} categories`);
  console.log(`  ${providers.length} providers with services + availability`);
  console.log('  1 admin (admin@Karysm.com)');
  console.log('  1 test client (+243812340000)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
