import { getCookie, setCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';

export const cookie = createMiddleware(async (c, next) => {
  const uuid = getCookie(c, 'uuid') || crypto.randomUUID();
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict' as const,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  };
  setCookie(c, 'uuid', uuid, options);
  c.set('uuid', uuid);
  await next();
});

export const headers = createMiddleware(async (c, next) => {
  const message = c.env.MESSAGE;
  if (message) {
    c.res.headers.set('X-Message', message);
  }
  await next();
});
