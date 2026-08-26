import { describe, expect, it } from "vitest";
import { getDodoDeepReadingProduct, isDodoConfigured } from "./dodo";

describe("credenciales Dodo Payments", () => {
  it("consulta el producto configurado y confirma que es un pago único", async () => {
    expect(isDodoConfigured()).toBe(true);
    const product = await getDodoDeepReadingProduct();

    expect(product.productId).toMatch(/^pdt_/);
    expect(product.amountMinor).toEqual(expect.any(Number));
    expect(product.amountMinor).toBeGreaterThan(0);
    expect(product.currency).toMatch(/^[A-Z]{3}$/);
  }, 20_000);
});
