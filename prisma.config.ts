import 'dotenv/config';
import { defineConfig, env } from '@prisma/config';  // Fixed: Use base '@prisma/config' (bundled with Prisma CLI; no separate /next needed)

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',  // Configures seed script here (replaces package.json)
  },
  engine: 'classic',
  datasource: {
    url: env('DATABASE_URL'),
  },
});