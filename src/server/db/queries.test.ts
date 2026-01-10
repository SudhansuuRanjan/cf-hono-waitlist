import { it, expect, mock, beforeEach } from "bun:test";
import { insertSubscriber, totalSubscriberCount, processSubscription, processUnsubscription } from "./queries";
import type { D1Database } from "@cloudflare/workers-types";
import type { NewSubscriber } from "./schema";
import { getTestDb } from "../../../scripts/get-test-db";
import { reset } from "drizzle-seed";
import * as schema from "./schema";

mock.module("./db.ts", () => {
  return {
    getDb: () => getTestDb(),
  };
});

beforeEach(async () => {
  const db = getTestDb();
  await reset(db, schema);
});

it("insert a new subscriber into the database", async () => {
  const newSub: NewSubscriber = { email: "test@test.com" };
  const subscriber = await insertSubscriber({} as D1Database, newSub);
  expect(subscriber.email).toBe(newSub.email);
  expect(subscriber.id).toBeDefined();
  expect(subscriber.createdAt).toBeDefined();
});

it("throws an error when inserting a duplicate email", async () => {
  const newSub: NewSubscriber = { email: "test@test.com" };
  await insertSubscriber({} as D1Database, newSub);
  expect(insertSubscriber({} as D1Database, newSub)).rejects.toThrow();
});

it("throws an error when trying to insert an invalid email", async () => {
  const newSub: NewSubscriber = { email: "test@test" };
  expect(insertSubscriber({} as D1Database, newSub)).rejects.toThrow();
});

it("returns the total count of subscribers", async () => {
  const newSub1: NewSubscriber = { email: "test1@test.com" };
  const newSub2: NewSubscriber = { email: "test2@test.com", emailVerified: new Date() };

  // Initially should be 0
  const initialCount = await totalSubscriberCount({} as D1Database);
  expect(initialCount).toBe(0);

  // After inserting one subscriber, should be 1
  await insertSubscriber({} as D1Database, newSub1);
  const countAfterOne = await totalSubscriberCount({} as D1Database);
  expect(countAfterOne).toBe(0);

  // After inserting another subscriber, should be 2
  await insertSubscriber({} as D1Database, newSub2);
  const countAfterTwo = await totalSubscriberCount({} as D1Database);
  expect(countAfterTwo).toBe(1);
});

it("successfully processes subscription with valid token", async () => {
  const token = "valid-token-123";
  const newSub: NewSubscriber = {
    email: "test@test.com",
    confirmationToken: token
  };

  await insertSubscriber({} as D1Database, newSub);
  const result = await processSubscription({} as D1Database, token);
  expect(result).toBe(true);
});

it("throws 'Invalid token' for non-existent token in processSubscription", async () => {
  const invalidToken = "non-existent-token";
  expect(processSubscription({} as D1Database, invalidToken)).rejects.toThrow("Invalid token");
});

it("throws 'Already subscribed' for already verified subscriber", async () => {
  const token = "already-verified-token";
  const newSub: NewSubscriber = {
    email: "test@test.com",
    confirmationToken: token,
    emailVerified: new Date()
  };

  await insertSubscriber({} as D1Database, newSub);
  expect(processSubscription({} as D1Database, token)).rejects.toThrow("Already subscribed");
});

it("successfully processes unsubscription with valid token", async () => {
  const token = "valid-unsubscribe-token";
  const newSub: NewSubscriber = {
    email: "test@test.com",
    confirmationToken: token,
    emailVerified: new Date()
  };

  await insertSubscriber({} as D1Database, newSub);
  const result = await processUnsubscription({} as D1Database, token);
  expect(result).toBe(true);
});

it("throws 'Invalid token' for non-existent token in processUnsubscription", async () => {
  const invalidToken = "non-existent-unsubscribe-token";
  expect(processUnsubscription({} as D1Database, invalidToken)).rejects.toThrow("Invalid token");
});
