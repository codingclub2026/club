import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('4000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_ORIGIN: z.string().url(),
  ADMIN_ORIGIN: z.string().url(),

  DATABASE_URL: z.string().min(1),

  CLERK_SECRET_KEY: z.string().min(1),

  ADMIN_JWT_SECRET: z.string().min(32, 'ADMIN_JWT_SECRET must be at least 32 chars'),
  ADMIN_COOKIE_SECRET: z.string().min(32).optional(),

  ARGON2_MEMORY_COST: z.string().default('65536').transform(Number),
  ARGON2_TIME_COST: z.string().default('3').transform(Number),
  ARGON2_PARALLELISM: z.string().default('4').transform(Number),

  IMAGEKIT_PUBLIC_KEY: z.string().optional(),
  IMAGEKIT_PRIVATE_KEY: z.string().optional(),
  IMAGEKIT_URL_ENDPOINT: z.string().optional(),
});

const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(_parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = _parsed.data;
