import { D1Database } from "@cloudflare/workers-types";
import { getDb } from "./db";
import type { NewSubscriber } from "./schema";
import * as schema from "./schema";
import { isNotNull, count, eq, and, isNull } from "drizzle-orm";

export const insertSubscriber = async (
  d1Database: D1Database,
  newSubscriber: NewSubscriber,
) => {
  const db = getDb(d1Database);

  try {
    // Try to insert directly - fast path for new subscribers
    const [result] = await db
      .insert(schema.subscribers)
      .values(newSubscriber)
      .returning();
    return result;
  } catch (error: any) {
    // Only check for UNIQUE constraint failure
    if (
      error?.cause?.message?.includes(
        "UNIQUE constraint failed: subscribers.email",
      ) ||
      error?.message?.includes("UNIQUE constraint failed")
    ) {
      // Check if the subscriber was previously verified and unsubscribed
      const [existingSubscriber] = await db
        .select()
        .from(schema.subscribers)
        .where(eq(schema.subscribers.email, newSubscriber.email))
        .limit(1);

      console.log("Existing Subscriber:", existingSubscriber);

      // If previously verified and now unsubscribed, allow re-subscription
      if (existingSubscriber.emailVerified && existingSubscriber.unsubscribed) {
        newSubscriber.unsubscribed = null;
        newSubscriber.emailVerified = null;

        const [result] = await db
          .update(schema.subscribers)
          .set(newSubscriber)
          .returning();
        return result;
      }

      // Otherwise, it's a genuine duplicate - throw the original error
      throw new Error("UNIQUE constraint failed: subscribers.email");
    }

    // Rethrow other errors
    throw error;
  }
};

export const totalSubscriberCount = async (d1Database: D1Database) => {
  const db = getDb(d1Database);
  const [result] = await db
    .select({ count: count() })
    .from(schema.subscribers)
    .where(
      and(
        isNotNull(schema.subscribers.emailVerified),
        isNull(schema.subscribers.unsubscribed),
      ),
    );
  return result.count;
};

export const processSubscription = async (
  d1Database: D1Database,
  token: string,
) => {
  const db = getDb(d1Database);

  // First check if the subscriber is already verified
  const [existingSubscriber] = await db
    .select()
    .from(schema.subscribers)
    .where(eq(schema.subscribers.confirmationToken, token))
    .limit(1);

  if (!existingSubscriber) {
    throw new Error("Invalid token");
  }

  if (existingSubscriber.emailVerified && !existingSubscriber.unsubscribed) {
    throw new Error("Already subscribed");
  }

  const result = await db
    .update(schema.subscribers)
    .set({ emailVerified: new Date(), unsubscribed: null })
    .where(eq(schema.subscribers.confirmationToken, token));

  if (!result.meta.changed_db) {
    throw new Error("Invalid token");
  }

  // if (result.rowsAffected === 0) {
  //   throw new Error("Invalid token");
  // }

  return true;
};

export const processUnsubscription = async (
  d1Database: D1Database,
  token: string,
) => {
  const db = getDb(d1Database);

  const [existingSubscriber] = await db
    .select()
    .from(schema.subscribers)
    .where(eq(schema.subscribers.confirmationToken, token))
    .limit(1);

  if (!existingSubscriber) {
    throw new Error("Invalid token");
  }

  const result = await db
    .update(schema.subscribers)
    .set({ unsubscribed: new Date() })
    .where(eq(schema.subscribers.confirmationToken, token));

  if (!result.meta.changed_db) {
    throw new Error("Invalid token");
  }

  // if (result.rowsAffected === 0) {
  //   throw new Error("Invalid token");
  // }
  return true;
};
