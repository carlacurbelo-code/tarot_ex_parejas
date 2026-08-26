import {
  assignOrientations,
  drawThreeCards,
  getCardById,
  normalizeSelection,
  orientationTransformClass,
  TAROT_DECK,
} from "@shared/tarot";
import {
  createIndependentReadingDeck,
  resolveDeepQuestion,
  selectSingleCard,
  toggleDeepCards,
} from "@shared/readingFlow";
import {
  getRestrictedQuestionCategory,
  isRestrictedQuestion,
  READING_CONTEXTS,
  READING_CONTEXT_LABELS,
  RESTRICTED_QUESTION_MESSAGE,
} from "@shared/readingContext";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  appRouter,
  buildReadingUserMessage,
  buildSingleCardUserMessage,
  countWords,
  MONEY_WORK_SINGLE_CARD_SYSTEM_PROMPT,
  MONEY_WORK_SYSTEM_PROMPT,
  parseSingleCardLLMResponse,
  SINGLE_CARD_RESPONSE_SCHEMA,
  SINGLE_CARD_SYSTEM_PROMPT,
  SYSTEM_PROMPT,
} from "./routers";
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
  it("devuelve el mazo completo de 78 cartas", async () => {
    const caller = appRouter.createCaller(ctxAnon());
    const deck = await caller.tarot.getDeck();
    expect(deck.length).toBe(TAROT_DECK.length);
    expect(deck.length).toBe(78);
    expect(deck[0]).toHaveProperty("id");
    expect(deck[0]).toHaveProperty("name");
  });
});

describe("tarot deck integrity", () => {
  it("contiene 22 mayores y 56 menores, sin cartas faltantes", () => {
    expect(TAROT_DECK).toHaveLength(78);
    expect(TAROT_DECK.filter(card => card.arcana === "major")).toHaveLength(22);
    expect(TAROT_DECK.filter(card => card.arcana === "minor")).toHaveLength(56);
    expect(TAROT_DECK.filter(card => card.id.endsWith("_cups"))).toHaveLength(14);
    expect(TAROT_DECK.filter(card => card.id.endsWith("_wands"))).toHaveLength(14);
    expect(TAROT_DECK.filter(card => card.id.endsWith("_swords"))).toHaveLength(14);
    expect(TAROT_DECK.filter(card => card.id.endsWith("_pentacles"))).toHaveLength(14);
  });

  it("todas las cartas tienen id único y placeholder estable", () => {
    const ids = TAROT_DECK.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(TAROT_DECK.every(card => card.imageKey === `placeholder:${card.id}`)).toBe(true);
    expect(TAROT_DECK.every(card => card.arcana === "major" || card.arcana === "minor")).toBe(true);
  });

  it("puede seleccionar cartas de mayores, Copas, Bastos, Espadas y Oros", () => {
    const selected = normalizeSelection([
      { id: "lovers", orientation: "upright" },
      { id: "ace_cups", orientation: "upright" },
      { id: "two_wands", orientation: "reversed" },
      { id: "three_swords", orientation: "upright" },
      { id: "four_pentacles", orientation: "reversed" },
    ]);
    expect(selected.map(card => card.id)).toEqual([
      "lovers",
      "ace_cups",
      "two_wands",
      "three_swords",
      "four_pentacles",
    ]);
  });

  it("devuelve tres cartas distintas y asigna orientación a cada una", () => {
    const drawn = drawThreeCards(() => 0.9);
    expect(drawn).toHaveLength(3);
    expect(new Set(drawn.map(card => card.id)).size).toBe(3);
    expect(drawn.every(card => card.orientation === "upright" || card.orientation === "reversed")).toBe(true);
  });

  it("representa una carta invertida con rotación visual de 180 grados", () => {
    expect(orientationTransformClass("reversed", true)).toBe("rotate-180");
    expect(orientationTransformClass("upright", true)).toBe("");
    expect(orientationTransformClass("reversed", false)).toBe("");
  });

  it("aplica giro visual explícito a una carta revelada invertida", () => {
    const component = fs.readFileSync(
      path.resolve(import.meta.dirname, "../client/src/components/TarotCardView.tsx"),
      "utf8",
    );
    expect(component).toContain('orientation === "reversed"');
    expect(component).toContain('isReversed && "rotate-180"');
    expect(component).toContain('transition-[border-color,box-shadow] duration-200');
    expect(component).not.toContain('transition-all duration-200');
    expect(component).toContain('tarot-card-reveal');

    const styles = fs.readFileSync(
      path.resolve(import.meta.dirname, "../client/src/index.css"),
      "utf8",
    );
    expect(styles).toContain('.tarot-card-reveal');
    expect(styles).toContain('animation: tarotCardReveal 360ms');
    expect(styles).toContain('.tarot-card-reveal {\n      animation: none;');
  });

  it("baraja mazos visibles independientes antes de cada cuadrícula de Home", () => {
    const home = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/Home.tsx"), "utf8");
    expect(home).toContain("createIndependentReadingDeck()");
    expect(home).toContain("freeDeck");
    expect(home).toContain("paidDeck");
    expect(home).toContain("setFreeDeck(createIndependentDeck())");
    expect(home).toContain("setPaidDeck(createIndependentDeck())");
  });

  it("aplica 30% invertida por carta de forma independiente", () => {
    const reversed = assignOrientations([TAROT_DECK[0]!, TAROT_DECK[1]!], () => 0.29);
    const upright = assignOrientations([TAROT_DECK[0]!, TAROT_DECK[1]!], () => 0.3);
    expect(reversed.every(card => card.orientation === "reversed")).toBe(true);
    expect(upright.every(card => card.orientation === "upright")).toBe(true);
  });

  it("getCardById funciona para cartas válidas", () => {
    expect(getCardById("lovers")?.name).toBe("Los Enamorados");
    expect(getCardById("nonexistent")).toBeUndefined();
  });
});

describe("Bloque 2 — independencia entre tiradas", () => {
  it("la tirada gratuita y las pagas usan tres cartas distintas del mazo completo", () => {
    const deck = createIndependentReadingDeck(() => 0.7);
    const selected = [deck[0]!, deck[1]!, deck[2]!];
    expect(deck).toHaveLength(78);
    expect(selected).toHaveLength(3);
    expect(new Set(selected.map(card => card.id)).size).toBe(3);
    expect(TAROT_DECK.some(card => card.id === selected[0]!.id)).toBe(true);
  });

  it("resuelve la pregunta profunda correcta para profundizar o hacer otra pregunta", () => {
    expect(resolveDeepQuestion({
      originalQuestion: "¿Me va a volver a buscar?",
      newQuestion: "¿Qué necesito entender ahora?",
      useOriginalQuestion: true,
    })).toBe("¿Me va a volver a buscar?");
    expect(resolveDeepQuestion({
      originalQuestion: "¿Me va a volver a buscar?",
      newQuestion: " ¿Qué necesito entender ahora? ",
      useOriginalQuestion: false,
    })).toBe("¿Qué necesito entender ahora?");
  });

  it("la tirada profunda es nueva, permite que reaparezca la carta gratuita y evita duplicados dentro de sus tres cartas", () => {
    const freeCard = TAROT_DECK.find(card => card.id === "fool")!;
    const deepDeck = createIndependentReadingDeck(() => 0.4);
    expect(deepDeck.some(card => card.id === freeCard.id)).toBe(true);

    let deepCards = toggleDeepCards([], freeCard, () => 0.3);
    deepCards = toggleDeepCards(deepCards, TAROT_DECK.find(card => card.id === "ace_cups")!, () => 0.3);
    deepCards = toggleDeepCards(deepCards, TAROT_DECK.find(card => card.id === "two_wands")!, () => 0.29);
    const afterDeselection = toggleDeepCards(deepCards, freeCard, () => 0.29);

    expect(deepCards).toHaveLength(3);
    expect(new Set(deepCards.map(card => card.id)).size).toBe(3);
    expect(deepCards.map(card => card.orientation)).toEqual(["upright", "upright", "reversed"]);
    expect(afterDeselection).toHaveLength(2);
    expect(afterDeselection.some(card => card.id === freeCard.id)).toBe(false);
  });

  it("el envío profundo pago preserva deepQuestion al crear checkout y usa tres cartas nuevas sin usar la lectura gratuita", () => {
    const home = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/Home.tsx"), "utf8");
    expect(home).toContain("createFreeReading");
    expect(home).toContain("submitCreditReading");
    expect(home).toContain("question: paidQuestion");
    expect(home).toContain("cards: paidCards.map");
    expect(home).toContain("email");
    expect(home).not.toContain("deepPurchaseToken");
  });
});

describe("Bloque 3 — contextos y restricciones", () => {
  it("define exactamente los contextos Amor y vínculos y Dinero y trabajo", () => {
    expect(READING_CONTEXTS).toEqual(["love", "money_work"]);
    expect(READING_CONTEXT_LABELS).toEqual({
      love: "Amor y vínculos",
      money_work: "Dinero y trabajo",
    });
  });

  it("conserva la pregunta al profundizar y usa la nueva al reformular", () => {
    expect(resolveDeepQuestion({
      originalQuestion: "¿Qué siente por mí?",
      newQuestion: "¿Cómo se ve este proyecto?",
      useOriginalQuestion: true,
    })).toBe("¿Qué siente por mí?");
    expect(resolveDeepQuestion({
      originalQuestion: "¿Qué siente por mí?",
      newQuestion: "¿Cómo se ve este proyecto?",
      useOriginalQuestion: false,
    })).toBe("¿Cómo se ve este proyecto?");

    const home = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/Home.tsx"), "utf8");
    expect(home).toContain("setContext(next)");
    expect(home).toContain("setStep(\"intro\")");
  });

  it("envía el contexto, las cartas y las orientaciones correctas para Dinero y trabajo", () => {
    const moneySingle = buildSingleCardUserMessage("¿Cómo se ve esta sociedad comercial?", {
      name: "Dos de Copas",
      orientation: "upright",
    }, "money_work");
    const moneyDeep = buildReadingUserMessage("¿Cómo se ve esta sociedad comercial?", [
      { name: "Dos de Copas", orientation: "upright" },
      { name: "Los Enamorados", orientation: "reversed" },
      { name: "La Emperatriz", orientation: "upright" },
    ], "money_work");

    expect(moneySingle).toContain("¿Cómo se ve esta sociedad comercial?");
    expect(moneySingle).toContain("Dos de Copas — derecha");
    expect(moneySingle).toContain("contexto de dinero y trabajo");
    expect(moneyDeep).toContain("Los Enamorados — invertida");
    expect(moneyDeep).toContain("contexto de dinero y trabajo");
    expect(TAROT_DECK).toHaveLength(78);
  });

  it("mantiene los prompts aprobados de Amor y utiliza prompts propios para Dinero y trabajo", () => {
    expect(SYSTEM_PROMPT).toContain("pregunta sobre una ex pareja o vínculo amoroso");
    expect(SINGLE_CARD_SYSTEM_PROMPT).toContain("pregunta sobre una ex pareja o vínculo amoroso");
    expect(MONEY_WORK_SYSTEM_PROMPT).toContain("dinero, trabajo, profesión, proyectos, negocios");
    expect(MONEY_WORK_SYSTEM_PROMPT).toContain("No des asesoramiento financiero técnico");
    expect(MONEY_WORK_SYSTEM_PROMPT).toContain("nunca puede superar 120 palabras");
    expect(MONEY_WORK_SINGLE_CARD_SYSTEM_PROMPT).toContain("nunca puede superar 50 palabras");
    expect(MONEY_WORK_SINGLE_CARD_SYSTEM_PROMPT).toContain("no des asesoramiento financiero técnico");
    expect(MONEY_WORK_SYSTEM_PROMPT).toContain("No uses imperativos ni consejos personales");
    expect(MONEY_WORK_SINGLE_CARD_SYSTEM_PROMPT).toContain("No uses imperativos ni consejos personales");
    expect(MONEY_WORK_SYSTEM_PROMPT).not.toBe(SYSTEM_PROMPT);
    expect(MONEY_WORK_SINGLE_CARD_SYSTEM_PROMPT).not.toBe(SINGLE_CARD_SYSTEM_PROMPT);
  });

  it("muestra el copy neutro y elimina referencias heredadas en la pantalla de pregunta", () => {
    const home = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/Home.tsx"), "utf8");
    expect(home).toContain("Haceme tu pregunta");
    expect(home).toContain("Escribí lo que querés saber y dejá que la tirada abra una perspectiva.");
    expect(home).toContain("¿Qué querés preguntarle al tarot?");
    expect(home).not.toContain("¿Tu ex todavía siente algo?");
    expect(home).not.toContain("ese vínculo");
    expect(home).not.toContain("esta relación");
  });

  it("bloquea consultas médicas, de embarazo y fertilidad", () => {
    [
      "¿Estoy embarazada?",
      "¿Voy a quedar embarazada este año?",
      "¿Tengo alguna enfermedad?",
      "¿Voy a recuperarme de esta enfermedad?",
      "¿Qué tratamiento me conviene?",
      "¿Mi embarazo va a salir bien?",
      "¿Tengo problemas de fertilidad?",
      "¿Tengo diabetes?",
    ].forEach(question => expect(isRestrictedQuestion(question)).toBe(true));
    expect(getRestrictedQuestionCategory("¿Estoy embarazada?")).toBe("pregnancy_fertility");
    expect(getRestrictedQuestionCategory("¿Tengo alguna enfermedad?")).toBe("health");
  });

  it("permite preguntas relacionales sobre hijos y familia", () => {
    [
      "¿Él quiere tener hijos conmigo?",
      "¿Tenemos futuro formando una familia?",
      "¿Cómo ve él la idea de tener hijos?",
      "¿Quiere formar una familia conmigo?",
    ].forEach(question => expect(isRestrictedQuestion(question)).toBe(false));
  });
});

describe("tarot reading prompt", () => {
  it("incluye pregunta exacta y orientaciones, sin CARD_TEXTS ni meanings", () => {
    const prompt = buildReadingUserMessage("¿Qué siente por mí?", [
      { name: "La Luna", orientation: "reversed" },
      { name: "Dos de Copas", orientation: "upright" },
      { name: "El Ermitaño", orientation: "upright" },
    ]);
    expect(prompt).toContain("¿Qué siente por mí?");
    expect(prompt).toContain("La Luna — invertida");
    expect(prompt).toContain("Dos de Copas — derecha");
    expect(prompt).toContain("El Ermitaño — derecha");
    expect(prompt).not.toContain("CARD_TEXTS");
    expect(prompt).not.toContain("meaning");
  });

  it("conserva el prompt profundo aprobado como contrato independiente", () => {
    expect(SYSTEM_PROMPT).toContain("La lectura debe tener entre 80 y 120 palabras");
    expect(SYSTEM_PROMPT).toContain("Interpretá las tres cartas juntas");
    expect(SINGLE_CARD_SYSTEM_PROMPT).not.toBe(SYSTEM_PROMPT);
  });
});

describe("tarot single-card reading contract", () => {
  it("envía la pregunta exacta, el nombre y la orientación de la carta al LLM", () => {
    const prompt = buildSingleCardUserMessage("¿Me va a volver a buscar?", {
      name: "La Torre",
      orientation: "reversed",
    });
    expect(prompt).toContain("¿Me va a volver a buscar?");
    expect(prompt).toContain("La Torre — invertida");
  });

  it("define una respuesta estructurada únicamente con reading", () => {
    expect(SINGLE_CARD_RESPONSE_SCHEMA.json_schema.schema).toMatchObject({
      required: ["reading"],
      additionalProperties: false,
    });
    expect(parseSingleCardLLMResponse(JSON.stringify({
      reading: "La carta sugiere una pausa antes de un movimiento concreto.",
    }))).toEqual({
      reading: "La carta sugiere una pausa antes de un movimiento concreto.",
    });
    expect(() => parseSingleCardLLMResponse(JSON.stringify({
      reading: "La carta sugiere una pausa antes de un movimiento concreto.",
      extra: "No debe formar parte del contrato",
    }))).toThrow();
  });

  it("impone el límite absoluto de 50 palabras para reading", () => {
    const validReading = Array.from({ length: 50 }, (_, index) => `palabra${index}`).join(" ");
    expect(countWords(validReading)).toBe(50);
    expect(parseSingleCardLLMResponse(JSON.stringify({
      reading: validReading,
    }))).toEqual({ reading: validReading });
    expect(() => parseSingleCardLLMResponse(JSON.stringify({
      reading: `${validReading} extra`,
    }))).toThrow("excede el límite");
  });

  it("explicita síntesis y respuesta autosuficiente en el prompt de una carta", () => {
    expect(SINGLE_CARD_SYSTEM_PROMPT).toContain("35 y 50 palabras");
    expect(SINGLE_CARD_SYSTEM_PROMPT).toContain("nunca puede superar 50 palabras");
    expect(SINGLE_CARD_SYSTEM_PROMPT).toContain("no introduzcas anglicismos");
    expect(SINGLE_CARD_SYSTEM_PROMPT).toContain("respuesta real, completa y autosuficiente");
  });

  it("muestra el mensaje de carga aprobado para la combinación de tres cartas", () => {
    const home = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/Home.tsx"), "utf8");
    expect(home).toContain("Interpretando la combinación de tus cartas…");
    expect(home).not.toContain("Interpretando tu carta…");
    expect(home).not.toContain("cards.length === 1");
  });

  it("rechaza una respuesta de una carta incompleta o inválida", () => {
    expect(() => parseSingleCardLLMResponse("{}")).toThrow();
    expect(() => parseSingleCardLLMResponse('{"reading":""}')).toThrow();
    expect(() => parseSingleCardLLMResponse("texto plano")).toThrow();
  });
});

describe("tarot.submitReading input validation", () => {
  it("requiere una pregunta válida y una única carta existente para la tirada gratuita", async () => {
    const caller = appRouter.createCaller(ctxAnon());
    await expect(caller.tarot.submitSingleCardReading({
      situation: "hola",
      context: "love",
      card: { id: "fool", orientation: "upright" },
    })).rejects.toThrow();
    await expect(caller.tarot.submitSingleCardReading({
      situation: "Pregunta válida para probar una carta gratuita.",
      context: "love",
      card: { id: "carta_inexistente", orientation: "reversed" },
    })).rejects.toThrow();
  });

  it("rechaza situación demasiado corta", async () => {
    const caller = appRouter.createCaller(ctxAnon());
    await expect(
      caller.tarot.submitReading({
        situation: "hola",
        context: "love",
        cardIds: ["lovers", "star", "moon"],
      }),
    ).rejects.toThrow();
  });

  it("rechaza cuando no son exactamente 3 cartas", async () => {
    const caller = appRouter.createCaller(ctxAnon());
    await expect(
      caller.tarot.submitReading({
        situation: "Esta es una situación de prueba suficientemente larga.",
        context: "money_work",
        cardIds: ["lovers", "star"],
      }),
    ).rejects.toThrow();
  });

  it("rechaza por tRPC las preguntas restringidas antes de normalizar cartas o invocar la lectura", async () => {
    const caller = appRouter.createCaller(ctxAnon());
    await expect(caller.tarot.submitSingleCardReading({
      situation: "¿Estoy embarazada?",
      context: "love",
      card: { id: "empress", orientation: "upright" },
    })).rejects.toThrow(RESTRICTED_QUESTION_MESSAGE);
    await expect(caller.tarot.submitReading({
      situation: "¿Qué tratamiento me conviene para esta enfermedad?",
      context: "money_work",
      cards: [
        { id: "fool", orientation: "upright" },
        { id: "magician", orientation: "reversed" },
        { id: "world", orientation: "upright" },
      ],
    })).rejects.toThrow(RESTRICTED_QUESTION_MESSAGE);
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
