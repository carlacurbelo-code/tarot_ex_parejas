import { describe, expect, it } from "vitest";
import { getDodoClient, getDodoDeepReadingProduct, isDodoConfigured } from "./dodo";
import { ENV } from "./_core/env";

describe("credenciales Dodo Payments", () => {
  it("consulta la marca Tarot configurada mediante el brand_id del secreto", async () => {
    expect(ENV.dodoTarotBrandId).toMatch(/^brnd_/);
    const brand = await getDodoClient().brands.retrieve(ENV.dodoTarotBrandId);
    expect(brand.brand_id).toBe(ENV.dodoTarotBrandId);
    expect(brand.name?.toLowerCase()).toContain("tarot");
  }, 20_000);

  it("consulta el producto configurado y confirma que es un pago único", async () => {
    expect(isDodoConfigured()).toBe(true);
    const product = await getDodoDeepReadingProduct();

    expect(product.productId).toMatch(/^pdt_/);
    expect(product.brandId).toBe(ENV.dodoTarotBrandId);
    expect(product.amountMinor).toEqual(expect.any(Number));
    expect(product.amountMinor).toBeGreaterThan(0);
    expect(product.currency).toMatch(/^[A-Z]{3}$/);
  }, 20_000);
});
