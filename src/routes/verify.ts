import { Hono } from 'hono';

const app = new Hono<Env>();

// /api/verify
export const verify = app.post('/', async (c) => {
  const { token } = await c.req.parseBody<{ token: string }>();
  const formData = new FormData();
  formData.append('response', token);
  formData.append('secret', c.env.SECRET_KEY);

  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      body: formData,
    },
  );
  const data = (await response.json()) as { success: boolean };
  console.log(data);
  if (!data.success) {
    return c.json({ success: false, error: 'Invalid token' }, 400);
  }

  return c.json({ success: true });
});
