import { Hono } from "hono";
import { accessAuth } from "./middleware/auth";
import { getDb } from "./db/db";
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

type Bindings = {
  cfwl_staging_db: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();
app.use(accessAuth);

app.post("/api/subscribe", async (c) => {
  try {
    const body = await c.req.json();
    const { email, traffic_source, device } = body;

    if (typeof email !== "string" || !email.trim()) {
      return c.json({ error: "Valid email is required" }, 400);
    }

    let token = generateRandomID(24);
    const newSub: NewSubscriber = {
      email: email.trim(),
      trafficSource:
        typeof traffic_source === "string" ? traffic_source : undefined,
      device: typeof device === "string" ? device : undefined,
      confirmationToken: token,
    };

    await insertSubscriber(c.env.cfwl_staging_db, newSub);
    await sendEmailWithResend(
      c,
      email,
      "Confirmation email for NanoMark waitlist.",
      token,
    );
    return c.json({ message: "Confirmation email sent successfully." });
  } catch (error: any) {
    // Handle duplicate email constraint
    if (
      error?.cause?.message?.includes(
        "UNIQUE constraint failed: subscribers.email",
      ) ||
      error?.message?.includes("UNIQUE constraint failed")
    ) {
      return c.json({ error: "Email already registered" }, 409);
    }

    // Handle invalid JSON
    if (
      error?.message?.includes("Failed to parse JSON") ||
      error?.message?.includes("Invalid JSON")
    ) {
      return c.json({ error: "Invalid JSON in request body" }, 400);
    }

    // Generic error for other cases
    console.log(error);
    return c.json({ error: "Failed to process subscription" }, 500);
  }
});

app.get("/api/health", (c) => c.json("Healthy!🔥"));

app.get("/api/subscriber-count", async (c) => {
  try {
    const total = (await totalSubscriberCount(c.env.cfwl_staging_db)) || 0;
    return c.json({ total }, 200);
  } catch (error) {
    return c.json({ error: "Something went wrong fetching count." }, 500);
  }
});

app.get("/api/confirm", async (c) => {
  const token = c.req.query("token") || null;
  if (!token) return c.json({ error: "Token is required" }, 400);
  try {
    await processSubscription(c.env.cfwl_staging_db, token);
    return c.redirect("/confirm/success");
  } catch (error: any) {
    if (error.message === "Invalid token") {
      return c.redirect("/confirm/invalid-token");
    }
    if (error.message === "Already subscribed") {
      return c.redirect("/confirm/already-subscribed");
    }
    return c.redirect("/confirm/error");
  }
});

app.get("/api/unsubscribe", async (c) => {
  const token = c.req.query("token") || null;
  if (!token) return c.json({ error: "Token is required" }, 400);
  try {
    await processUnsubscription(c.env.cfwl_staging_db, token);
    return c.redirect("/unsubscribe/success");
  } catch (error: any) {
    if (error.message === "Invalid token") {
      return c.redirect("/unsubscribe/invalid-token");
    }
    return c.redirect("/unsubscribe/error");
  }
});

export default app;
