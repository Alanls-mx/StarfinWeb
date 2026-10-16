import crypto from 'node:crypto';
import Database from './postgres-sync.js';

const db = new Database();
db.exec(`
  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    planId TEXT NOT NULL,
    providerId TEXT UNIQUE,
    initPoint TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    paidThroughISO TEXT,
    createdISO TEXT NOT NULL,
    updatedISO TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS subscriptions_user ON subscriptions (userId);
  CREATE TABLE IF NOT EXISTS subscription_invoices (
    invoiceId TEXT PRIMARY KEY,
    subscriptionId TEXT NOT NULL,
    paymentId TEXT NOT NULL UNIQUE,
    paidAtISO TEXT NOT NULL,
    amountCents INTEGER NOT NULL,
    status TEXT NOT NULL
  );
`);

export const monthlyPlanPrice: Record<string, number> = { craft: 3990, nexus: 4990 };
export type Subscription = {
  id: string; userId: string; planId: string; providerId: string | null;
  initPoint: string | null; status: string; paidThroughISO: string | null;
};

export function currentSubscription(userId: string): Subscription | null {
  return (db.prepare(`SELECT * FROM subscriptions WHERE userId = ? AND status IN ('pending', 'authorized')
    ORDER BY createdISO DESC LIMIT 1`).get(userId) as Subscription | undefined) || null;
}

export function createSubscriptionIntent(userId: string, planId: 'craft' | 'nexus'): Subscription {
  const id = `sub_${crypto.randomUUID()}`;
  const stamp = new Date().toISOString();
  db.prepare('INSERT INTO subscriptions (id, userId, planId, status, createdISO, updatedISO) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, userId, planId, 'pending', stamp, stamp);
  return { id, userId, planId, providerId: null, initPoint: null, status: 'pending', paidThroughISO: null };
}

export function attachProvider(id: string, providerId: string, initPoint: string): boolean {
  return db.prepare('UPDATE subscriptions SET providerId = ?, initPoint = ?, updatedISO = ? WHERE id = ? AND providerId IS NULL')
    .run(providerId, initPoint, new Date().toISOString(), id).changes > 0;
}

export function subscriptionByProvider(providerId: string): Subscription | null {
  return (db.prepare('SELECT * FROM subscriptions WHERE providerId = ?').get(providerId) as Subscription | undefined) || null;
}

export function recordPaidInvoice(input: { subscriptionId: string; invoiceId: string; paymentId: string; paidAtISO: string; amountCents: number }): boolean {
  const row = db.prepare(`
    WITH invoice AS (
      INSERT INTO subscription_invoices (invoiceId, subscriptionId, paymentId, paidAtISO, amountCents, status)
      SELECT ?, s.id, ?, ?, ?, 'approved' FROM subscriptions s
      WHERE s.id = ? AND s.status IN ('pending', 'authorized')
      ON CONFLICT DO NOTHING RETURNING subscriptionId
    ), renewed AS (
      UPDATE subscriptions s SET status = 'authorized',
        paidThroughISO = to_char((GREATEST(COALESCE(s.paidThroughISO::timestamptz, ?::timestamptz), ?::timestamptz) + INTERVAL '1 month') AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        updatedISO = ?
      FROM invoice i WHERE s.id = i.subscriptionId RETURNING s.userId, s.planId, s.paidThroughISO
    )
    UPDATE users u SET plan = CASE WHEN r.planId = 'craft' THEN 'Craft' ELSE 'Nexus' END,
      planExpiresAt = r.paidThroughISO
    FROM renewed r WHERE u.id = r.userId RETURNING u.id
  `).get(input.invoiceId, input.paymentId, input.paidAtISO, input.amountCents, input.subscriptionId,
    input.paidAtISO, input.paidAtISO, new Date().toISOString()) as { id: string } | undefined;
  return Boolean(row);
}

export function suspendSubscription(providerId: string, reason: string): boolean {
  // Cancellation ends renewal; the already paid period remains available until expiry.
  return db.prepare(`UPDATE subscriptions SET status = ?, updatedISO = ?
    WHERE providerId = ? AND status IN ('pending', 'authorized')`)
    .run(reason, new Date().toISOString(), providerId).changes > 0;
}

export function subscriptionInvoiceByPayment(paymentId: string): { invoiceId: string; subscriptionId: string } | null {
  return (db.prepare('SELECT invoiceId, subscriptionId FROM subscription_invoices WHERE paymentId = ?').get(paymentId) as { invoiceId: string; subscriptionId: string } | undefined) || null;
}

export function revokePaidInvoice(paymentId: string): boolean {
  const row = db.prepare(`
    WITH reversed AS (
      UPDATE subscription_invoices SET status = 'reversed' WHERE paymentId = ? AND status = 'approved'
      RETURNING subscriptionId
    ), suspended AS (
      UPDATE subscriptions s SET status = 'suspended', paidThroughISO = NULL, updatedISO = ?
      FROM reversed r WHERE s.id = r.subscriptionId RETURNING s.id, s.userId, s.planId
    ) UPDATE users u SET plan = 'Spawn', planExpiresAt = NULL
      FROM suspended s WHERE u.id = s.userId
        AND u.plan = CASE WHEN s.planId = 'craft' THEN 'Craft' ELSE 'Nexus' END
        AND NOT EXISTS (SELECT 1 FROM subscriptions active WHERE active.userId = u.id
          AND active.id <> s.id AND active.status = 'authorized') RETURNING u.id
  `).get(paymentId, new Date().toISOString()) as { id: string } | undefined;
  return Boolean(row);
}
