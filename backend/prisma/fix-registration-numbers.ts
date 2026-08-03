import 'dotenv/config';
import prisma from '../src/config/db';
import { repairRegistrationNumbers } from '../src/services/repairRegistrationNumbers';

async function main() {
  console.log('🔧 Repairing registration numbers...');

  const result = await repairRegistrationNumbers();

  console.log(`✅ Updated ${result.updated} registration(s) across ${result.events} event(s).`);
}

main()
  .catch((err) => {
    console.error('❌ Failed to repair registration numbers:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
