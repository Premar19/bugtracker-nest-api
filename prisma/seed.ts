import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma/client';
import { Role } from '../generated/prisma/enums';

const SALT_ROUNDS = 10;

/**
 * Bootstraps the first ADMIN. Promotion is admin-only, so without this there is
 * no path to a first admin and the role would be unreachable.
 */
async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set to seed an admin');
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL must be set');
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const admin = await prisma.user.upsert({
      where: { email },
      update: { role: Role.ADMIN },
      create: { email, passwordHash, role: Role.ADMIN },
    });

    console.log(`Seeded admin: ${admin.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
