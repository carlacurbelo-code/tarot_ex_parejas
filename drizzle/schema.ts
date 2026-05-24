import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
