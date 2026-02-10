import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DateTime } from 'luxon';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed shipping costs
  const shippingCosts = [
    { dayOfWeek: 0, dayName: 'Domingo', cost: 5.0 },
    { dayOfWeek: 1, dayName: 'Lunes', cost: 3.0 },
    { dayOfWeek: 2, dayName: 'Martes', cost: 3.0 },
    { dayOfWeek: 3, dayName: 'Miércoles', cost: 3.5 },
    { dayOfWeek: 4, dayName: 'Jueves', cost: 3.5 },
    { dayOfWeek: 5, dayName: 'Viernes', cost: 4.0 },
    { dayOfWeek: 6, dayName: 'Sábado', cost: 4.5 },
  ];

  for (const cost of shippingCosts) {
    await prisma.shippingCost.upsert({
      where: { dayOfWeek: cost.dayOfWeek },
      update: cost,
      create: cost,
    });
  }

  console.log('Shipping costs seeded');

  // Seed test user
  const hashedPassword = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'test@boxful.com' },
    update: {},
    create: {
      firstName: 'Usuario',
      lastName: 'De Prueba',
      gender: 'M',
      birthDate: DateTime.fromISO('1990-01-01', { zone: 'utc' }).toJSDate(),
      whatsappCode: '+503',
      whatsappNumber: '70001234',
      email: 'test@boxful.com',
      password: hashedPassword,
    },
  });

  console.log('Test user seeded (test@boxful.com / password123)');
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
