import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  canStartPaidDeepReading,
  hasThreeDistinctCards,
  isDeepReadingPurchaseToken,
} from "../shared/deepReadingPurchase";

const root = path.resolve(import.meta.dirname, "..");
const readProjectFile = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

describe("política de compra única para lectura profunda", () => {
  it("habilita la tirada sólo cuando el pago está confirmado", () => {
    expect(canStartPaidDeepReading("paid")).toBe(true);
  });

  it.each(["checkout_created", "generating", "consumed"] as const)("bloquea una compra con estado %s", status => {
    expect(canStartPaidDeepReading(status)).toBe(false);
  });

  it("acepta un token de compra seguro y suficiente", () => {
    expect(isDeepReadingPurchaseToken("dodo_purchase_token_1234567890")).toBe(true);
  });

  it.each(["", "short-token", "token con espacio 1234567890", "x".repeat(65)])("rechaza token inválido: %s", token => {
    expect(isDeepReadingPurchaseToken(token)).toBe(false);
  });

  it("admite exactamente tres cartas distintas", () => {
    expect(hasThreeDistinctCards([{ id: "sun" }, { id: "moon" }, { id: "world" }])).toBe(true);
  });

  it("rechaza cartas repetidas aunque haya tres selecciones", () => {
    expect(hasThreeDistinctCards([{ id: "sun" }, { id: "sun" }, { id: "world" }])).toBe(false);
  });

  it("rechaza una selección que no tenga tres cartas", () => {
    expect(hasThreeDistinctCards([{ id: "sun" }, { id: "moon" }])).toBe(false);
  });
});

describe("contrato Dodo y regresiones del flujo heredado", () => {
  const routerSource = readProjectFile("server/routers.ts");
  const webhookSource = readProjectFile("server/dodoWebhook.ts");
  const indexSource = readProjectFile("server/_core/index.ts");
  const homeSource = readProjectFile("client/src/pages/Home.tsx");

  it("crea checkout con producto de Dodo sin un precio hardcodeado", () => {
    expect(routerSource).toContain("createDodoDeepReadingCheckout");
    expect(routerSource).toContain("getDodoDeepReadingProduct");
    expect(routerSource).not.toContain("price: 20");
  });

  it("verifica la firma oficial antes de procesar un webhook", () => {
    expect(webhookSource).toContain("webhooks.unwrap");
    expect(webhookSource).toContain("ENV.dodoPaymentsWebhookKey");
  });

  it("reserva el cuerpo crudo del webhook antes de express.json", () => {
    expect(indexSource.indexOf('app.post("/api/dodo/webhook"')).toBeLessThan(indexSource.indexOf("app.use(express.json"));
  });

  it("asocia el pago al token y producto esperado antes de conceder acceso", () => {
    expect(webhookSource).toContain("tarot_purchase_token");
    expect(webhookSource).toContain("containsExpectedProduct");
  });

  it("protege el uso único frente a una generación fallida", () => {
    expect(routerSource).toContain("claimDodoPurchaseForGeneration");
    expect(routerSource).toContain("releaseDodoPurchaseAfterGenerationFailure");
    expect(routerSource).toContain("consumeDodoPurchase");
  });

  it("mantiene el producto PayPal/audio separado del nuevo router Dodo", () => {
    expect(routerSource).toContain("confirmPayment");
    expect(routerSource).toContain("SETTING_KEYS.PAYPAL_ME_LINK");
    expect(routerSource).toContain("dodo: router");
  });

  it("exige un purchaseToken antes de la lectura profunda en la interfaz", () => {
    expect(homeSource).toContain("purchaseToken: deepPurchaseToken");
    expect(homeSource).toContain("Continuar al pago");
  });
});
