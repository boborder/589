import { basicAuth } from "hono/basic-auth";
import { bearerAuth } from "hono/bearer-auth";
import { createMiddleware } from "hono/factory";

export const basic = createMiddleware<Env>(async (c, next) => {
  await basicAuth({
    username: c.env.USERNAME,
    password: c.env.PASSWORD,
  })(c, next);
});

export const bearer = createMiddleware<Env>(async (c, next) => {
  await bearerAuth({
    token: c.env.TOKEN,
  })(c, next);
});
