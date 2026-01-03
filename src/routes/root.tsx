import { Hono } from 'hono';

const app = new Hono<Env>();

export const root = app.get('/', (c) => {
  const message = c.env.MESSAGE;
  return c.render(
    <>
      <title>{message}</title>
      <p className="text-primary text-3xl">{message}</p>
      <div id="root" />
    </>,
  );
});
