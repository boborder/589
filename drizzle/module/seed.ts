import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../schema/better-auth';
import { seed } from 'drizzle-seed';

const generateSeed = async () => {
  const db = drizzle(process.env.DATABASE_URL!);
  console.log('Generating seed...');
  await seed(db, {
    user: schema.user,
    session: schema.session,
    account: schema.account,
    verification: schema.verification,
  },
  {
    count: 10,
  },
);
  console.log('Seed generated successfully');
};

generateSeed();
