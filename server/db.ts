import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  DodoDeepReadingPurchase,
  InsertDodoDeepReadingPurchase,
  InsertOrder,
  InsertUser,
  Order,
  dodoDeepReadingPurchases,
  dodoWebhookEvents,
  tarotCreditPacks,
  tarotProfiles,
  tarotReadings,
  type InsertTarotCreditPack,
  type InsertTarotProfile,
  type InsertTarotReading,
  orders,
  settings,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/* ============== ORDERS ============== */

export async function createOrder(data: InsertOrder): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const result: any = await db.insert(orders).values(data);
  // mysql2/drizzle returns [ResultSetHeader, ...]
  const insertId = result?.[0]?.insertId ?? result?.insertId ?? null;
  return insertId;
}

export async function getOrderByToken(token: string): Promise<Order | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(orders).where(eq(orders.accessToken, token)).limit(1);
  return rows[0];
}

export async function getOrderById(id: number): Promise<Order | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return rows[0];
}

export async function updateOrderReading(token: string, freeReading: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set({ freeReading }).where(eq(orders.accessToken, token));
}

export async function updateOrderPremiumQuestion(token: string, premiumQuestion: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set({ premiumQuestion }).where(eq(orders.accessToken, token));
}

export async function markOrderPaid(params: {
  token: string;
  paypalOrderId: string;
  amount: string;
  currency: string;
  clientName?: string | null;
  clientEmail?: string | null;
  premiumQuestion?: string | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const update: Record<string, unknown> = {
    paymentStatus: "paid",
    paypalOrderId: params.paypalOrderId,
    amountPaid: params.amount,
    currency: params.currency,
    paidAt: new Date(),
  };
  if (params.clientName !== undefined && params.clientName !== null) update.clientName = params.clientName;
  if (params.clientEmail !== undefined && params.clientEmail !== null) update.clientEmail = params.clientEmail;
  if (params.premiumQuestion !== undefined && params.premiumQuestion !== null) update.premiumQuestion = params.premiumQuestion;
  await db.update(orders).set(update).where(eq(orders.accessToken, params.token));
}

export async function setOrderAudio(orderId: number, audioFileKey: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set({ audioFileKey }).where(eq(orders.id, orderId));
}

export async function markOrderCompleted(orderId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set({
    deliveryStatus: "completed",
    completedAt: new Date(),
  }).where(eq(orders.id, orderId));
}

export async function listAllOrders(): Promise<Order[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders).orderBy(desc(orders.createdAt));
}

/* ============== DODO — TIRADA IA DE USO ÚNICO ============== */

function affectedRows(result: unknown): number {
  const value = result as { affectedRows?: number; 0?: { affectedRows?: number } };
  return value?.affectedRows ?? value?.[0]?.affectedRows ?? 0;
}

export async function createDodoDeepReadingPurchase(data: InsertDodoDeepReadingPurchase): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible.");
  await db.insert(dodoDeepReadingPurchases).values(data);
}

export async function getDodoDeepReadingPurchase(purchaseToken: string): Promise<DodoDeepReadingPurchase | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(dodoDeepReadingPurchases)
    .where(eq(dodoDeepReadingPurchases.purchaseToken, purchaseToken)).limit(1);
  return rows[0];
}

export async function setDodoCheckoutSession(purchaseToken: string, checkoutSessionId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible.");
  await db.update(dodoDeepReadingPurchases)
    .set({ checkoutSessionId })
    .where(eq(dodoDeepReadingPurchases.purchaseToken, purchaseToken));
}

export async function recordDodoWebhookEvent(event: {
  webhookEventId: string;
  eventType: string;
  dodoPaymentId?: string | null;
  purchaseToken?: string | null;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible.");
  const existing = await db.select({ id: dodoWebhookEvents.id }).from(dodoWebhookEvents)
    .where(eq(dodoWebhookEvents.webhookEventId, event.webhookEventId)).limit(1);
  if (existing[0]) return false;

  try {
    await db.insert(dodoWebhookEvents).values(event);
    return true;
  } catch (error) {
    const raced = await db.select({ id: dodoWebhookEvents.id }).from(dodoWebhookEvents)
      .where(eq(dodoWebhookEvents.webhookEventId, event.webhookEventId)).limit(1);
    if (raced[0]) return false;
    throw error;
  }
}

export async function markDodoPurchasePaid(params: { purchaseToken: string; paymentId: string }): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible.");
  const result = await db.update(dodoDeepReadingPurchases)
    .set({ status: "paid", dodoPaymentId: params.paymentId, paidAt: new Date(), lastGenerationError: null })
    .where(and(
      eq(dodoDeepReadingPurchases.purchaseToken, params.purchaseToken),
      eq(dodoDeepReadingPurchases.status, "checkout_created"),
    ));
  return affectedRows(result) > 0;
}

export async function claimDodoPurchaseForGeneration(purchaseToken: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible.");
  const result = await db.update(dodoDeepReadingPurchases)
    .set({
      status: "generating",
      generationAttempts: sql`${dodoDeepReadingPurchases.generationAttempts} + 1`,
      lastGenerationError: null,
    })
    .where(and(
      eq(dodoDeepReadingPurchases.purchaseToken, purchaseToken),
      eq(dodoDeepReadingPurchases.status, "paid"),
    ));
  return affectedRows(result) > 0;
}

export async function releaseDodoPurchaseAfterGenerationFailure(purchaseToken: string, message: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(dodoDeepReadingPurchases)
    .set({ status: "paid", lastGenerationError: message })
    .where(and(
      eq(dodoDeepReadingPurchases.purchaseToken, purchaseToken),
      eq(dodoDeepReadingPurchases.status, "generating"),
    ));
}

export async function consumeDodoPurchase(purchaseToken: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible.");
  await db.update(dodoDeepReadingPurchases)
    .set({ status: "consumed", consumedAt: new Date(), lastGenerationError: null })
    .where(and(
      eq(dodoDeepReadingPurchases.purchaseToken, purchaseToken),
      eq(dodoDeepReadingPurchases.status, "generating"),
    ));
}

/* ============== SETTINGS ============== */

export async function getSettingValue(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return rows[0]?.value ?? null;
}

export async function setSettingValue(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(settings).values({ key, value }).onDuplicateKeyUpdate({
    set: { value },
  });
}

export const SETTING_KEYS = {
  PREMIUM_PRICE_USD: "premium_price_usd",
  PAYPAL_ME_LINK: "paypal_me_link",
} as const;

export const DEFAULT_PREMIUM_PRICE = "15";

/* ============== NUEVO FUNNEL: EMAIL, LECTURAS Y CRÉDITOS ============== */

function normalizeTarotEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getTarotProfileByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(tarotProfiles)
    .where(eq(tarotProfiles.email, normalizeTarotEmail(email))).limit(1);
  return rows[0];
}

export async function createOrUpdateTarotProfile(email: string, marketingConsent: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible.");
  const normalizedEmail = normalizeTarotEmail(email);
  const existing = await getTarotProfileByEmail(normalizedEmail);
  if (existing) {
    if (marketingConsent && !existing.marketingConsent) {
      await db.update(tarotProfiles).set({ marketingConsent: 1 }).where(eq(tarotProfiles.id, existing.id));
      return { ...existing, marketingConsent: 1 };
    }
    return existing;
  }
  const result: any = await db.insert(tarotProfiles).values({ email: normalizedEmail, marketingConsent: marketingConsent ? 1 : 0 });
  const id = result?.[0]?.insertId ?? result?.insertId;
  const created = await db.select().from(tarotProfiles).where(eq(tarotProfiles.id, id)).limit(1);
  if (!created[0]) throw new Error("No se pudo crear la identidad por email.");
  return created[0];
}

export async function createTarotReading(data: InsertTarotReading): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible.");
  await db.insert(tarotReadings).values(data);
}

export async function getTarotReading(readingToken: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(tarotReadings).where(eq(tarotReadings.readingToken, readingToken)).limit(1);
  return rows[0];
}

export async function unlockTarotFreeReading(params: { readingToken: string; email: string; marketingConsent: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible.");
  const profile = await createOrUpdateTarotProfile(params.email, params.marketingConsent);
  const result = await db.update(tarotProfiles)
    .set({ freeReadingClaimedAt: new Date() })
    .where(and(eq(tarotProfiles.id, profile.id), sql`${tarotProfiles.freeReadingClaimedAt} IS NULL`));
  const claimed = affectedRows(result) > 0;
  if (!claimed) return { claimed: false, profile };
  await db.update(tarotReadings)
    .set({ profileId: profile.id, status: "ready" })
    .where(eq(tarotReadings.readingToken, params.readingToken));
  return { claimed: true, profile: { ...profile, freeReadingClaimedAt: new Date() } };
}

export async function saveTarotReadingInterpretation(readingToken: string, interpretation: string) {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible.");
  await db.update(tarotReadings).set({ interpretation, status: "ready" }).where(eq(tarotReadings.readingToken, readingToken));
}

export async function createTarotCreditPack(data: InsertTarotCreditPack): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible.");
  await db.insert(tarotCreditPacks).values(data);
}

export async function setTarotCreditPackCheckout(packToken: string, checkoutSessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible.");
  await db.update(tarotCreditPacks).set({ checkoutSessionId }).where(eq(tarotCreditPacks.packToken, packToken));
}

export async function getTarotCreditPack(packToken: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(tarotCreditPacks).where(eq(tarotCreditPacks.packToken, packToken)).limit(1);
  return rows[0];
}

export async function getTarotCreditPackStatus(packToken: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select({ pack: tarotCreditPacks, profile: tarotProfiles })
    .from(tarotCreditPacks)
    .leftJoin(tarotProfiles, eq(tarotCreditPacks.profileId, tarotProfiles.id))
    .where(eq(tarotCreditPacks.packToken, packToken)).limit(1);
  return rows[0];
}

export async function grantTarotCreditPack(params: { packToken: string; paymentId: string; productId: string; brandId: string }): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible.");
  const pack = await getTarotCreditPack(params.packToken);
  if (!pack || pack.status !== "checkout_created" || pack.dodoProductId !== params.productId || pack.dodoBrandId !== params.brandId) return false;
  const result = await db.update(tarotCreditPacks)
    .set({ status: "paid", dodoPaymentId: params.paymentId, paidAt: new Date() })
    .where(and(eq(tarotCreditPacks.packToken, params.packToken), eq(tarotCreditPacks.status, "checkout_created")));
  if (affectedRows(result) === 0) return false;
  await db.update(tarotProfiles)
    .set({ credits: sql`${tarotProfiles.credits} + ${pack.creditsGranted}` })
    .where(eq(tarotProfiles.id, pack.profileId));
  return true;
}

export async function claimTarotCredit(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible.");
  const result = await db.update(tarotProfiles)
    .set({ credits: sql`${tarotProfiles.credits} - 1` })
    .where(and(eq(tarotProfiles.email, normalizeTarotEmail(email)), sql`${tarotProfiles.credits} > 0`));
  return affectedRows(result) > 0;
}

export async function releaseTarotCredit(email: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(tarotProfiles)
    .set({ credits: sql`${tarotProfiles.credits} + 1` })
    .where(eq(tarotProfiles.email, normalizeTarotEmail(email)));
}
