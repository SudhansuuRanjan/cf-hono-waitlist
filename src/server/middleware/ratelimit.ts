import { createMiddleware } from "hono/factory";

export const rateLimit = createMiddleware(async (c, next) => {
  if (c.env.ENVIRONMENT === "development") {
    return await next();
  }

  const ipAddress = c.req.header("cf-connecting-ip") || "";
  const { success } = await c.env.MY_RATE_LIMITER.limit({ key: ipAddress });

  if (success) {
    return await next();
  }

  return c.json({ error: "Rate limit exceeded" }, 429);
});
