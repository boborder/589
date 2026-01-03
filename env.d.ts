import type { DrizzleSqliteDODatabase } from 'drizzle-orm/durable-sqlite';

declare global {
  interface Env {
    Bindings: Cloudflare.Env;
    Variables: {
      uuid?: string;
      ip?: string;
      message?: string;
      do?: DrizzleSqliteDODatabase;
    };
  }
}
