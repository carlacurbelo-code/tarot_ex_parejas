import { int, mysqlEnum, mysqlTable, text, timestamp, tinyint, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Pedidos de lecturas premium (audio).
 * Se crea cuando la usuaria completa el formulario y recibe la lectura IA gratis.
 * Se actualiza con paymentStatus cuando paga via PayPal.
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  /** Token único para que el cliente acceda a su pedido sin login */
  accessToken: varchar("accessToken", { length: 64 }).notNull().unique(),

  /** Datos del cliente */
  clientName: varchar("clientName", { length: 200 }),
  clientEmail: varchar("clientEmail", { length: 320 }),

  /** Contexto y lectura */
  situation: text("situation").notNull(),
  selectedCards: text("selectedCards").notNull(), // JSON array de cartas
  freeReading: text("freeReading"), // Lectura IA gratis generada
  premiumQuestion: text("premiumQuestion"), // Pregunta específica para audio premium

  /** Pago */
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "refunded"]).default("pending").notNull(),
  paypalOrderId: varchar("paypalOrderId", { length: 100 }),
  amountPaid: varchar("amountPaid", { length: 20 }), // String para evitar problemas de decimales
  currency: varchar("currency", { length: 8 }).default("USD"),

  /** Entrega */
  audioFileKey: varchar("audioFileKey", { length: 500 }), // S3 key del MP3
  deliveryStatus: mysqlEnum("deliveryStatus", ["pending", "completed"]).default("pending").notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  paidAt: timestamp("paidAt"),
  completedAt: timestamp("completedAt"),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Compra puntual y derecho de una única lectura IA profunda mediante Dodo Payments.
 * Esta tabla está deliberadamente separada de `orders`, que conserva el producto
 * heredado PayPal + audio humano.
 */
export const dodoDeepReadingPurchases = mysqlTable("dodoDeepReadingPurchases", {
  id: int("id").autoincrement().primaryKey(),
  purchaseToken: varchar("purchaseToken", { length: 64 }).notNull().unique(),
  question: text("question").notNull(),
  context: mysqlEnum("context", ["love", "money_work"]).notNull(),
  action: mysqlEnum("action", ["deepen", "new_question"]).notNull(),
  status: mysqlEnum("status", ["checkout_created", "paid", "generating", "consumed"]).default("checkout_created").notNull(),
  dodoProductId: varchar("dodoProductId", { length: 100 }).notNull(),
  /** Marca Dodo del producto asociado al checkout; null sólo en compras heredadas. */
  dodoBrandId: varchar("dodoBrandId", { length: 100 }),
  checkoutSessionId: varchar("checkoutSessionId", { length: 120 }).unique(),
  dodoPaymentId: varchar("dodoPaymentId", { length: 120 }).unique(),
  generationAttempts: int("generationAttempts").default(0).notNull(),
  lastGenerationError: text("lastGenerationError"),
  paidAt: timestamp("paidAt"),
  consumedAt: timestamp("consumedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DodoDeepReadingPurchase = typeof dodoDeepReadingPurchases.$inferSelect;
export type InsertDodoDeepReadingPurchase = typeof dodoDeepReadingPurchases.$inferInsert;

/**
 * Registro de eventos de Dodo ya recibidos para garantizar idempotencia frente a
 * reintentos de webhook y entregas duplicadas.
 */
export const dodoWebhookEvents = mysqlTable("dodoWebhookEvents", {
  id: int("id").autoincrement().primaryKey(),
  webhookEventId: varchar("webhookEventId", { length: 160 }).notNull().unique(),
  eventType: varchar("eventType", { length: 120 }).notNull(),
  dodoPaymentId: varchar("dodoPaymentId", { length: 120 }),
  purchaseToken: varchar("purchaseToken", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Identidad sin contraseña del nuevo funnel público. */
export const tarotProfiles = mysqlTable("tarotProfiles", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  marketingConsent: tinyint("marketingConsent").default(0).notNull(),
  credits: int("credits").default(0).notNull(),
  freeReadingClaimedAt: timestamp("freeReadingClaimedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TarotProfile = typeof tarotProfiles.$inferSelect;
export type InsertTarotProfile = typeof tarotProfiles.$inferInsert;

/** Lecturas del funnel por email: la lectura gratuita se desbloquea después del email. */
export const tarotReadings = mysqlTable("tarotReadings", {
  id: int("id").autoincrement().primaryKey(),
  readingToken: varchar("readingToken", { length: 80 }).notNull().unique(),
  profileId: int("profileId"),
  question: text("question").notNull(),
  context: mysqlEnum("context", ["love", "money_work"]).notNull(),
  selectedCards: text("selectedCards").notNull(),
  interpretation: text("interpretation"),
  kind: mysqlEnum("kind", ["free", "credit"]).notNull(),
  status: mysqlEnum("status", ["pending_email", "ready", "consumed"]).default("pending_email").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TarotReading = typeof tarotReadings.$inferSelect;
export type InsertTarotReading = typeof tarotReadings.$inferInsert;

/** Compra de pack Dodo asociada a un email, con idempotencia por payment_id. */
export const tarotCreditPacks = mysqlTable("tarotCreditPacks", {
  id: int("id").autoincrement().primaryKey(),
  packToken: varchar("packToken", { length: 80 }).notNull().unique(),
  profileId: int("profileId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  dodoProductId: varchar("dodoProductId", { length: 100 }).notNull(),
  dodoBrandId: varchar("dodoBrandId", { length: 100 }).notNull(),
  checkoutSessionId: varchar("checkoutSessionId", { length: 120 }).unique(),
  dodoPaymentId: varchar("dodoPaymentId", { length: 120 }).unique(),
  status: mysqlEnum("status", ["checkout_created", "paid"]).default("checkout_created").notNull(),
  creditsGranted: int("creditsGranted").default(3).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  paidAt: timestamp("paidAt"),
});

export type TarotCreditPack = typeof tarotCreditPacks.$inferSelect;
export type InsertTarotCreditPack = typeof tarotCreditPacks.$inferInsert;

/**
 * Configuraciones globales editables por la admin (precio, etc.)
 * Tabla key-value simple.
 */
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;
