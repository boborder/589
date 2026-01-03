import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

// neon better-auth
export default defineConfig({
  out: './drizzle/migrations',
  schema: './drizzle/schema/better-auth.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
