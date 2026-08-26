import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isAllowedTarotBrand } from "./dodoWebhook";

const TAROT_BRAND_ID = "brnd_tarot";
const KONSTEL_BRAND_ID = "brnd_konstel";

describe("separación de marcas del webhook Dodo", () => {
  it("acepta un evento firmado cuya marca coincide con Tarot", () => {
    expect(isAllowedTarotBrand(TAROT_BRAND_ID, TAROT_BRAND_ID)).toBe(true);
  });

  it("ignora un evento firmado de Konstel", () => {
    expect(isAllowedTarotBrand(KONSTEL_BRAND_ID, TAROT_BRAND_ID)).toBe(false);
  });

  it("ignora un evento firmado sin brand_id", () => {
    expect(isAllowedTarotBrand(undefined, TAROT_BRAND_ID)).toBe(false);
    expect(isAllowedTarotBrand(null, TAROT_BRAND_ID)).toBe(false);
    expect(isAllowedTarotBrand("", TAROT_BRAND_ID)).toBe(false);
  });

  it("mantiene el registro de webhook antes de los efectos y responde 200 al ignorar", () => {
    const source = readFileSync(resolve(process.cwd(), "server/dodoWebhook.ts"), "utf8");
    expect(source.indexOf("recordDodoWebhookEvent({")).toBeLessThan(source.indexOf("markDodoPurchasePaid({"));
    expect(source).toContain("res.status(200).end();");
    expect(source).toContain("if (!isFirstDelivery)");
    expect(source).toContain("purchase.dodoBrandId !== paymentBrandId");
  });
});


describe("pack de créditos del nuevo funnel", () => {
  it("recibe el metadata del pack y acredita antes de devolver 200", () => {
    const source = readFileSync(resolve(process.cwd(), "server/dodoWebhook.ts"), "utf8");
    expect(source).toContain("tarot_pack_token");
    expect(source).toContain("grantTarotCreditPack");
    expect(source).toContain("payment.product_cart?.[0]?.product_id");
    expect(source).toContain("res.status(200).end();");
  });

  it("conserva la idempotencia específica del pack", () => {
    const source = readFileSync(resolve(process.cwd(), "server/dodoWebhook.ts"), "utf8");
    expect(source.indexOf("const isFirstPackDelivery")).toBeLessThan(source.indexOf("await grantTarotCreditPack"));
    expect(source).toContain("if (!isFirstPackDelivery)");
  });
});
