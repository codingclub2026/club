import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Super Admin...');

  const adminId = process.env.SEED_ADMIN_ID ?? 'superadmin';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe@2026!!';
  const displayName = process.env.SEED_ADMIN_NAME ?? 'Super Admin';

  const rawMemoryCost = parseInt(process.env.ARGON2_MEMORY_COST ?? '65536', 10);
  const rawTimeCost = parseInt(process.env.ARGON2_TIME_COST ?? '3', 10);
  const rawParallelism = parseInt(process.env.ARGON2_PARALLELISM ?? '4', 10);

  const memoryCost = Number.isNaN(rawMemoryCost) ? 65536 : rawMemoryCost;
  const timeCost = Number.isNaN(rawTimeCost) ? 3 : rawTimeCost;
  const parallelism = Number.isNaN(rawParallelism) ? 4 : rawParallelism;

  const password_hash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost,
    timeCost,
    parallelism,
  });

  const existing = await prisma.adminUser.findUnique({ where: { admin_id: adminId } });

  if (existing) {
    console.log(`⚠️  Admin '${adminId}' already exists. Skipping.`);
  } else {
    const admin = await prisma.adminUser.create({
      data: {
        admin_id: adminId,
        password_hash,
        display_name: displayName,
        role: 'super_admin',
        is_active: true,
      },
    });
    console.log(`✅ Super Admin created: ${admin.admin_id} (${admin.id})`);
  }

  console.log('🏁 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
