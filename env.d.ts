import type { DrizzleSqliteDODatabase } from 'drizzle-orm/durable-sqlite';
import type { Client } from '@rivetkit/cloudflare-workers';
import type { registry } from './src/registry';

declare global {
  interface Env {
    Bindings: Cloudflare.Env & {
      RIVET: Client<typeof registry>;
    };
    Variables: {
      uuid?: string;
      ip?: string;
      message?: string;
      do?: DrizzleSqliteDODatabase;
    };
  }
}
