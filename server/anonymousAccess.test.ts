import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ANONYMOUS_FREE_READING_RATE_LIMIT, hashAnonymousSignal } from "./anonymousAccess";
import {
  getAnonymousVisitorCookieOptions,
  TAROT_ANONYMOUS_VISITOR_COOKIE,
  TAROT_ANONYMOUS_VISITOR_MAX_AGE_MS,
} from "./_core/cookies";

const root = path.resolve(import.meta.dirname, "..");
const readProjectFile = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

describe("acceso gratuito anónimo", () => {
  it("usa una cookie propia, HttpOnly, persistente y compatible con HTTPS", () => {
    const options = getAnonymousVisitorCookieOptions({ protocol: "https", headers: {} } as any);
    expect(TAROT_ANONYMOUS_VISITOR_COOKIE).toBe("tarot_visitor");
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", secure: true, path: "/" });
    expect(options.maxAge).toBe(TAROT_ANONYMOUS_VISITOR_MAX_AGE_MS);
  });

  it("no persiste el valor de cookie ni la IP sin hash", () => {
    const first = hashAnonymousSignal("visitor-example-identifier");
    const second = hashAnonymousSignal("visitor-example-identifier");
    const other = hashAnonymousSignal("different-identifier");
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).toBe(second);
    expect(first).not.toBe(other);
  });

  it("aplica un límite conservador de 12 nuevas identidades por IP cada hora", () => {
    expect(ANONYMOUS_FREE_READING_RATE_LIMIT).toEqual({ windowMs: 60 * 60 * 1000, maxNewVisitors: 12 });
  });

  it("reserva y consume el derecho gratuito sólo después de una interpretación exitosa", () => {
    const router = readProjectFile("server/routers.ts");
    const freeProcedure = router.slice(router.indexOf("createFreeReading:"), router.indexOf("getCreditBalance:"));
    expect(freeProcedure).toContain("reserveFreeReadingAccess");
    expect(freeProcedure).toContain("finalizeFreeReadingAccess");
    expect(freeProcedure).toContain("releaseFreeReadingAccess");
    expect(freeProcedure.indexOf("saveTarotReadingInterpretation")).toBeLessThan(freeProcedure.indexOf("finalizeFreeReadingAccess"));
  });

  it("bloquea preguntas restringidas antes de reservar una lectura o consumir crédito", () => {
    const router = readProjectFile("server/routers.ts");
    const freeProcedure = router.slice(router.indexOf("createFreeReading:"), router.indexOf("getCreditBalance:"));
    const paidProcedure = router.slice(router.indexOf("submitCreditReading:"), router.indexOf("getDeepReadingProduct:"));
    expect(freeProcedure.indexOf("rejectRestrictedQuestion")).toBeLessThan(freeProcedure.indexOf("reserveFreeReadingAccess"));
    expect(paidProcedure.indexOf("rejectRestrictedQuestion")).toBeLessThan(paidProcedure.indexOf("claimCurrentAnonymousCredit"));
  });

  it("mantiene PayPal y audio fuera del flujo anónimo", () => {
    const router = readProjectFile("server/routers.ts");
    const anonymous = readProjectFile("server/anonymousAccess.ts");
    expect(router).toContain("confirmPayment");
    expect(anonymous).not.toContain("PayPal");
    expect(anonymous).not.toContain("audio");
  });

  it("hace idempotente la lectura paga con un token de operación y devuelve un resultado ya listo sin otro descuento", () => {
    const router = readProjectFile("server/routers.ts");
    const home = readProjectFile("client/src/pages/Home.tsx");
    const paidProcedure = router.slice(router.indexOf("submitCreditReading:"), router.indexOf("getDeepReadingProduct:"));
    expect(paidProcedure).toContain("readingToken: z.string().min(20).max(64)");
    expect(paidProcedure).toContain("const existing = await getTarotReading(input.readingToken)");
    expect(paidProcedure.indexOf("const existing = await getTarotReading")).toBeLessThan(paidProcedure.indexOf("claimCurrentAnonymousCredit"));
    expect(paidProcedure).toContain("existing.status === \"ready\" && existing.interpretation");
    expect(paidProcedure).toContain("deleteTarotReading(input.readingToken)");
    expect(home).toContain("window.crypto.randomUUID().replaceAll");
    expect(home).toContain("readingToken: paidReadingToken");
    expect(home).toContain("disabled={selected.length !== 3 || loading}");
  });

  it("mantiene la explicación de privacidad fuera del recorrido principal mediante un enlace discreto", () => {
    const footer = readProjectFile("client/src/components/SiteFooter.tsx");
    const app = readProjectFile("client/src/App.tsx");
    const privacy = readProjectFile("client/src/pages/Privacy.tsx");
    expect(footer).toContain('href="/privacidad"');
    expect(footer).not.toContain("La primera lectura se limita mediante una cookie");
    expect(app).toContain('path="/privacidad"');
    expect(privacy).toContain("Lectura gratuita");
    expect(privacy).toContain("Prevención de abuso");
  });
});
