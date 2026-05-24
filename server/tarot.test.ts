import { TAROT_DECK, getCardById } from "@shared/tarot";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests sin BD — verifican que el router responde correctamente
 * cuando la BD no está disponible (devuelve estructuras consistentes)
 * y que rechaza inputs inválidos / accesos sin admin.
 */

function ctxAnon(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function ctxAdmin(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function ctxRegular(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "user",
      email: "u@x.com",
      name: "U",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("tarot.getDeck", () => {
  it("devuelve el mazo completo de 30 cartas", async () => {
    const caller = appRouter.createCaller(ctxAnon());
    const deck = await caller.tarot.getDeck();
    expect(deck.length).toBe(TAROT_DECK.length);
    expect(deck.length).toBeGreaterThanOrEqual(22);
    expect(deck[0]).toHaveProperty("id");
    expect(deck[0]).toHaveProperty("name");
  });
});

describe("tarot deck integrity", () => {
  it("todas las cartas tienen id único", () => {
    const ids = TAROT_DECK.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getCardById funciona para cartas válidas", () => {
    expect(getCardById("lovers")?.name).toBe("Los Enamorados");
    expect(getCardById("nonexistent")).toBeUndefined();
  });
});

describe("tarot.submitReading input validation", () => {
  it("rechaza situación demasiado corta", async () => {
    const caller = appRouter.createCaller(ctxAnon());
    await expect(
      caller.tarot.submitReading({
        situation: "hola",
        cardIds: ["lovers", "star", "moon"],
      }),
    ).rejects.toThrow();
  });

  it("rechaza cuando no son exactamente 3 cartas", async () => {
    const caller = appRouter.createCaller(ctxAnon());
    await expect(
      caller.tarot.submitReading({
        situation: "Esta es una situación de prueba suficientemente larga.",
        cardIds: ["lovers", "star"],
      }),
    ).rejects.toThrow();
  });
});

describe("tarot.getPremiumPrice", () => {
  it(
    "devuelve un precio configurado o el default",
    async () => {
      const caller = appRouter.createCaller(ctxAnon());
      const res = await caller.tarot.getPremiumPrice();
      expect(res).toHaveProperty("priceUsd");
      expect(res).toHaveProperty("paypalLink");
      expect(typeof res.priceUsd).toBe("string");
      expect(res.priceUsd.length).toBeGreaterThan(0);
    },
    15000,
  );
});

describe("admin procedures - acceso restringido", () => {
  it("listOrders rechaza usuarios anónimos", async () => {
    const caller = appRouter.createCaller(ctxAnon());
    await expect(caller.admin.listOrders()).rejects.toThrow();
  });

  it("listOrders rechaza usuarios regulares (no admin)", async () => {
    const caller = appRouter.createCaller(ctxRegular());
    await expect(caller.admin.listOrders()).rejects.toThrow();
  });

  it("updateSettings valida formato del precio", async () => {
    const caller = appRouter.createCaller(ctxAdmin());
    await expect(
      caller.admin.updateSettings({
        priceUsd: "abc",
        paypalLink: "https://paypal.me/test",
      }),
    ).rejects.toThrow();
  });

  it(
    "updateSettings acepta precio válido y link válido",
    async () => {
      const caller = appRouter.createCaller(ctxAdmin());
      const res = await caller.admin.updateSettings({
        priceUsd: "15.00",
        paypalLink: "https://paypal.me/test",
      });
      expect(res).toEqual({ success: true });
    },
    15000,
  );

  it(
    "updateSettings acepta paypal link vacío",
    async () => {
      const caller = appRouter.createCaller(ctxAdmin());
      const res = await caller.admin.updateSettings({
        priceUsd: "20",
        paypalLink: "",
      });
      expect(res).toEqual({ success: true });
    },
    15000,
  );

  it("uploadAudio rechaza archivos demasiado grandes", async () => {
    const caller = appRouter.createCaller(ctxAdmin());
    // 30MB de bytes en base64
    const bigBase64 = "A".repeat(40 * 1024 * 1024);
    await expect(
      caller.admin.uploadAudio({
        orderId: 1,
        filename: "test.mp3",
        contentType: "audio/mpeg",
        dataBase64: bigBase64,
      }),
    ).rejects.toThrow();
  });
});

describe("confirmPayment validation", () => {
  it("rechaza email inválido", async () => {
    const caller = appRouter.createCaller(ctxAnon());
    await expect(
      caller.tarot.confirmPayment({
        token: "abc",
        paypalOrderId: "X",
        amount: "15",
        currency: "USD",
        clientName: "Test",
        clientEmail: "no-es-email",
        premiumQuestion: "Pregunta de prueba para premium.",
      }),
    ).rejects.toThrow();
  });
});
