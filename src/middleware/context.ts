import { getConnInfo } from 'hono/cloudflare-workers';
import { contextStorage } from 'hono/context-storage';
import { createMiddleware } from 'hono/factory';

export const context = createMiddleware((c, next) => {
  contextStorage();
  c.set('message', 'Time is money');
  return next();
});

export const connInfo = createMiddleware(async (c, next) => {
  const info = getConnInfo(c);
  c.set('ip', info.remote.address || '::1');
  return next();
});
