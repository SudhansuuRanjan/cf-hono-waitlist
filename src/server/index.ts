import { Hono } from "hono";
import { accessAuth } from "./middleware/auth";
import type { NewSubscriber } from "./db/schema";
import {
  insertSubscriber,
  totalSubscriberCount,
  processSubscription,
  processUnsubscription,
} from "./db/queries";
import { sendEmailWithResend } from "./service/email";
import { generateRandomID } from "./utils/generateToken";
import type { D1Database } from "@cloudflare/workers-types";
import { z } from "zod";

type Bindings = {
  cfwl_staging_db: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();
app.use(accessAuth);

const subscribeSchema = z.object({
  email: z.email({ message: "Invalid email address", pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }),
  traffic_source: z.string().optional(),
  device: z.string().optional(),
});

const stripPlusAlias = (email: string): string => {
  return email.split("@").map((part, index) => {
    if (index === 0) {
      return part.replace(/\+[a-zA-Z0-9_-]+$/, "");
    }
    return part;
  }).join("@");
};

app.post("/api/subscribe", async (c) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const body = await c.req.json();
    const result = subscribeSchema.safeParse(body);

    if (!result.success) {
      console.log({
        requestId,
        endpoint: "/api/subscribe",
        action: "validation_failed",
        reason: "invalid_input",
        errors: result.error.format(),
      });
      return c.json({ error: "Valid email is required" }, 400);
    }

    const { email, traffic_source, device } = result.data;
    const normalizedEmail = stripPlusAlias(email);
    let token = generateRandomID(24);
    const newSub: NewSubscriber = {
      email: normalizedEmail,
      trafficSource: traffic_source,
      device: device,
      confirmationToken: token,
    };

    await insertSubscriber(c.env.cfwl_staging_db, newSub);

    await sendEmailWithResend(
      c,
      email,
      "Confirmation email for NanoMark waitlist.",
      token,
    );

    const duration = Date.now() - startTime;
    console.log({
      requestId,
      endpoint: "/api/subscribe",
      action: "subscribe_success",
      email: normalizedEmail,
      duration_ms: duration,
    });

    return c.json({ message: "Confirmation email sent successfully." });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    if (
      error?.cause?.message?.includes(
        "UNIQUE constraint failed: subscribers.email",
      ) ||
      error?.message?.includes("UNIQUE constraint failed")
    ) {
      console.log({
        requestId,
        endpoint: "/api/subscribe",
        action: "subscribe_failed",
        reason: "email_already_registered",
        duration_ms: duration,
      });
      return c.json({ error: "Email already registered" }, 409);
    }

    console.error({
      requestId,
      endpoint: "/api/subscribe",
      action: "subscribe_failed",
      reason: "internal_error",
      error: error.message || String(error),
      duration_ms: duration,
    });
    return c.json({ error: "Failed to process subscription" }, 500);
  }
});

app.get("/api/health", (c) => {
  return c.json({ status: "Healthy", timestamp: new Date().toISOString() });
});

app.get("/api/subscriber-count", async (c) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const total = (await totalSubscriberCount(c.env.cfwl_staging_db)) || 0;
    return c.json({ total }, 200);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error({
      requestId,
      endpoint: "/api/subscriber-count",
      action: "subscriber_count_failed",
      error: error.message || String(error),
      duration_ms: duration,
    });
    return c.json({ error: "Something went wrong fetching count." }, 500);
  }
});

app.get("/api/confirm", async (c) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  const token = c.req.query("token") || null;

  if (!token) {
    console.log({
      requestId,
      endpoint: "/api/confirm",
      action: "validation_failed",
      reason: "missing_token",
    });
    return c.json({ error: "Token is required" }, 400);
  }

  try {
    await processSubscription(c.env.cfwl_staging_db, token);

    const duration = Date.now() - startTime;
    console.log({
      requestId,
      endpoint: "/api/confirm",
      action: "confirm_success",
      duration_ms: duration,
    });

    return c.redirect("/confirm/success");
  } catch (error: any) {
    const duration = Date.now() - startTime;

    if (error.message === "Invalid token") {
      console.log({
        requestId,
        endpoint: "/api/confirm",
        action: "confirm_failed",
        reason: "invalid_token",
        duration_ms: duration,
      });
      return c.redirect("/confirm/invalid-token");
    }
    if (error.message === "Already subscribed") {
      console.log({
        requestId,
        endpoint: "/api/confirm",
        action: "confirm_failed",
        reason: "already_subscribed",
        duration_ms: duration,
      });
      return c.redirect("/confirm/already-subscribed");
    }

    console.error({
      requestId,
      endpoint: "/api/confirm",
      action: "confirm_failed",
      reason: "internal_error",
      error: error.message || String(error),
      duration_ms: duration,
    });
    return c.redirect("/confirm/error");
  }
});

app.get("/api/unsubscribe", async (c) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  const token = c.req.query("token") || null;

  if (!token) {
    console.log({
      requestId,
      endpoint: "/api/unsubscribe",
      action: "validation_failed",
      reason: "missing_token",
    });
    return c.json({ error: "Token is required" }, 400);
  }

  try {
    await processUnsubscription(c.env.cfwl_staging_db, token);

    const duration = Date.now() - startTime;
    console.log({
      requestId,
      endpoint: "/api/unsubscribe",
      action: "unsubscribe_success",
      duration_ms: duration,
    });

    return c.redirect("/unsubscribe/success");
  } catch (error: any) {
    const duration = Date.now() - startTime;

    if (error.message === "Invalid token") {
      console.log({
        requestId,
        endpoint: "/api/unsubscribe",
        action: "unsubscribe_failed",
        reason: "invalid_token",
        duration_ms: duration,
      });
      return c.redirect("/unsubscribe/invalid-token");
    }

    console.error({
      requestId,
      endpoint: "/api/unsubscribe",
      action: "unsubscribe_failed",
      reason: "internal_error",
      error: error.message || String(error),
      duration_ms: duration,
    });
    return c.redirect("/unsubscribe/error");
  }
});

export default app;