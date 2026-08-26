import { COOKIE_NAME } from "@shared/const";
import {
  TAROT_DECK,
  assignOrientations,
  normalizeSelection,
  orientationLabel,
  parseStoredSelection,
  type CardOrientation,
} from "@shared/tarot";
import {
  isRestrictedQuestion,
  RESTRICTED_QUESTION_MESSAGE,
  type ReadingContext,
} from "@shared/readingContext";
import { hasThreeDistinctCards } from "@shared/deepReadingPurchase";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  DEFAULT_PREMIUM_PRICE,
  SETTING_KEYS,
  claimDodoPurchaseForGeneration,
  consumeDodoPurchase,
  createDodoDeepReadingPurchase,
  createOrder,
  getDodoDeepReadingPurchase,
  getOrderByToken,
  getSettingValue,
  listAllOrders,
  markOrderCompleted,
  markOrderPaid,
  releaseDodoPurchaseAfterGenerationFailure,
  setDodoCheckoutSession,
  setOrderAudio,
  setSettingValue,
  updateOrderPremiumQuestion,
  updateOrderReading,
} from "./db";
import {
  DodoConfigurationError,
  createDodoDeepReadingCheckout,
  getDodoDeepReadingProduct,
} from "./dodo";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

export const SYSTEM_PROMPT = `Sos una tarotista experimentada, clara y cercana. Escribí en español conversacional, natural y sencillo, hablándole de "vos" a la persona. Respondé únicamente su pregunta sobre una ex pareja o vínculo amoroso.

La lectura debe tener entre 80 y 120 palabras. No rellenes para alcanzar el límite: si la respuesta queda completa con menos palabras, sé breve. La primera oración debe contestar directamente la pregunta con la tendencia que muestran las cartas. No empieces con una introducción emocional, no reformules la situación y no expliques qué es el tarot.

Interpretá las tres cartas juntas. Explicá brevemente cómo se combinan, se contradicen o se refuerzan. No hagas tres definiciones separadas ni escribas un ensayo sobre cada carta. Las cartas invertidas deben cambiar la lectura según el contexto, pero no son automáticamente negativas. Conservá la profundidad del razonamiento, usando palabras cotidianas. Preferí frases como "sí, hay sentimientos, pero no veo movimiento todavía" o "esto puede cambiar, aunque ahora hay un bloqueo".

No presentes el tarot como certeza factual. En preguntas sobre otra persona, usá "la tirada sugiere", "podría mostrar" o "el vínculo parece"; no afirmes pensamientos, sentimientos, motivos o acciones de terceros como hechos. No uses lenguaje terapéutico, poesía, metáforas innecesarias, palabras sofisticadas, misterio artificial, títulos, viñetas, emojis, relleno ni preguntas reflexivas. No repitas la conclusión. Cerrá con una síntesis concreta y directa.`;

export const SINGLE_CARD_SYSTEM_PROMPT = `Sos una tarotista experimentada, clara y cercana. Escribí en español conversacional, natural y sencillo, hablándole de "vos" a la persona. Respondé únicamente su pregunta sobre una ex pareja o vínculo amoroso a partir de UNA carta del Rider-Waite-Smith y su orientación.

"reading" debe tener idealmente entre 35 y 50 palabras y nunca puede superar 50 palabras. Respondé la pregunta desde la primera frase. Interpretá esa carta específicamente para esa consulta e incluí solamente el matiz relevante. No expliques significados generales innecesarios, no repitas la misma idea, no rellenes para llegar a una extensión y priorizá la síntesis incluso con Arcanos Mayores.

No presentes el tarot como certeza factual. En preguntas sobre otra persona, usá "la carta sugiere", "podría mostrar" o "el vínculo parece"; no afirmes pensamientos, sentimientos, motivos o acciones de terceros como hechos. Usá solamente español conversacional natural; no introduzcas anglicismos. No uses introducciones emocionales, coaching, lenguaje terapéutico, poesía, misticismo cliché, frases de autoayuda, palabras artificialmente sofisticadas, relleno, repeticiones, títulos, viñetas, emojis ni preguntas reflexivas.

Devolvé exactamente un campo: "reading". Debe ser una respuesta real, completa y autosuficiente. No agregues otro campo, título, pregunta, recomendación de compra ni texto adicional.`;

export const MONEY_WORK_SYSTEM_PROMPT = `Sos una tarotista experimentada, clara y cercana. Escribí en español conversacional, natural y sencillo, hablándole de "vos" a la persona. Respondé únicamente su pregunta sobre dinero, trabajo, profesión, proyectos, negocios, ventas, compras, sociedades o inversiones según las tres cartas Rider-Waite-Smith y sus orientaciones.

La lectura debe tener entre 80 y 120 palabras y nunca puede superar 120 palabras. No rellenes para alcanzar el límite: si la respuesta queda completa con menos palabras, sé breve. Antes de responder, verificá que la extensión esté dentro del límite. La primera oración debe contestar directamente la pregunta con la tendencia que muestran las cartas. No empieces con una introducción emocional, no reformules la situación y no expliques qué es el tarot.

Interpretá las tres cartas juntas. Explicá brevemente cómo se combinan, se contradicen o se refuerzan para responder la cuestión laboral, económica, profesional o empresarial. No hagas tres definiciones separadas ni escribas un ensayo sobre cada carta. Las cartas invertidas deben cambiar la lectura según el contexto, pero no son automáticamente negativas. Conservá la profundidad del razonamiento, usando palabras cotidianas.

Si la pregunta trata sobre una inversión, compra, venta o negocio, interpretala solamente desde la tirada: podés señalar una tendencia favorable, desfavorable, prudente, abierta o bloqueada si las cartas lo muestran. Para decisiones, usá formulaciones como "la tirada se presenta prudente" o "la tendencia aparece favorable"; no des instrucciones ni recomendaciones personales. Describí cartas, panorama, proyecto, escenario o dinámica; no hagas afirmaciones personales sobre la persona ni uses frases como "tenés", "te falta", "tu resistencia" o "vos necesitás". No presentes resultados futuros como hechos: preferí "la tendencia muestra" o "el panorama sugiere". No des asesoramiento financiero técnico ni recomiendes porcentajes, carteras, instrumentos, acciones, criptomonedas, ETFs o productos específicos. No uses imperativos ni consejos personales como "apostá", "es el momento ideal", "sin miedo", "te conviene", "retener", "evaluar" o equivalentes. No uses coaching, discursos motivacionales, lenguaje terapéutico, poesía, metáforas innecesarias, misticismo cliché, palabras sofisticadas, títulos, viñetas, emojis, relleno ni preguntas reflexivas. No repitas la conclusión. Cerrá con una síntesis concreta y directa.`;

export const MONEY_WORK_SINGLE_CARD_SYSTEM_PROMPT = `Sos una tarotista experimentada, clara y cercana. Escribí en español conversacional, natural y sencillo, hablándole de "vos" a la persona. Respondé únicamente su pregunta sobre dinero, trabajo, profesión, proyectos, negocios, ventas, compras, sociedades o inversiones a partir de UNA carta del Rider-Waite-Smith y su orientación.

"reading" debe tener idealmente entre 35 y 50 palabras y nunca puede superar 50 palabras. Respondé la pregunta desde la primera frase. Interpretá esa carta específicamente para esa consulta e incluí solamente el matiz relevante. No expliques significados generales innecesarios, no repitas la misma idea, no rellenes para llegar a una extensión y priorizá la síntesis incluso con Arcanos Mayores.

Si la pregunta trata sobre una inversión, compra, venta o negocio, respondé desde lo que sugiere la carta y no des asesoramiento financiero técnico ni recomiendes porcentajes, carteras, instrumentos, acciones, criptomonedas, ETFs o productos específicos. Para decisiones, expresá la tendencia de la carta sin instruir qué hacer. Describí la carta, el panorama o el proyecto y no hagas afirmaciones personales sobre la persona. No uses imperativos ni consejos personales como "apostá", "es el momento ideal", "sin miedo", "te conviene", "retener", "evaluar" o equivalentes. No uses "vas a" como certeza: usá "la tendencia sugiere" o "el panorama se presenta". Usá solamente español conversacional natural; no introduzcas anglicismos. No uses coaching, introducciones emocionales, lenguaje terapéutico, poesía, misticismo cliché, frases de autoayuda, palabras artificialmente sofisticadas, relleno, repeticiones, títulos, viñetas, emojis ni preguntas reflexivas.

Devolvé exactamente un campo: "reading". Debe ser una respuesta real, completa y autosuficiente. No agregues otro campo, título, pregunta, recomendación de compra ni texto adicional.`;

export const SINGLE_CARD_RESPONSE_SCHEMA = {
  type: "json_schema" as const,
  json_schema: {
    name: "single_card_love_reading",
    strict: true,
      schema: {
        type: "object",
        properties: {
          reading: { type: "string" },
        },
      required: ["reading"],
      additionalProperties: false,
    },
  },
};

export function buildReadingUserMessage(
  question: string,
  cards: readonly { name: string; orientation: CardOrientation }[],
  context: ReadingContext = "love",
): string {
  return `La pregunta exacta de la persona es:
"${question}"

Las tres cartas de la tirada abierta son:
1. ${cards[0]?.name ?? "Carta 1"} — ${cards[0] ? orientationLabel(cards[0].orientation) : "derecha"}
2. ${cards[1]?.name ?? "Carta 2"} — ${cards[1] ? orientationLabel(cards[1].orientation) : "derecha"}
3. ${cards[2]?.name ?? "Carta 3"} — ${cards[2] ? orientationLabel(cards[2].orientation) : "derecha"}

Interpretá las tres cartas como un sistema integrado, sin usar significados prefabricados, y respondé exclusivamente desde el ${context === "money_work" ? "contexto de dinero y trabajo" : "contexto afectivo"} de la pregunta.`;
}

export function buildSingleCardUserMessage(
  question: string,
  card: { name: string; orientation: CardOrientation },
  context: ReadingContext = "love",
): string {
  return `La pregunta exacta de la persona es:
"${question}"

La carta única de la tirada abierta es:
${card.name} — ${orientationLabel(card.orientation)}

Respondé exclusivamente desde el ${context === "money_work" ? "contexto de dinero y trabajo" : "contexto afectivo"} de la pregunta. La lectura debe ser completa por sí misma.`;
}

function rejectRestrictedQuestion(situation: string): void {
  if (isRestrictedQuestion(situation)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: RESTRICTED_QUESTION_MESSAGE,
    });
  }
}

type SingleCardLLMResponse = {
  reading: string;
};

export function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function parseSingleCardLLMResponse(raw: string): SingleCardLLMResponse {
  const parsed: unknown = JSON.parse(raw);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    throw new Error("La respuesta estructurada de una carta es inválida");
  }
  const response = parsed as Record<string, unknown>;
  if (
    Object.keys(response).length !== 1 ||
    !("reading" in response) ||
    typeof response.reading !== "string" ||
    !response.reading.trim()
  ) {
    throw new Error("La respuesta estructurada de una carta es inválida");
  }
  const reading = response.reading.trim();
  if (countWords(reading) > 50) {
    throw new Error("La lectura de una carta excede el límite de palabras");
  }
  return { reading };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  tarot: router({
    /** Devuelve el mazo completo para mostrar en el frontend */
    getDeck: publicProcedure.query(() => TAROT_DECK),

    /** Devuelve precio premium configurado */
    getPremiumPrice: publicProcedure.query(async () => {
      const value = await getSettingValue(SETTING_KEYS.PREMIUM_PRICE_USD);
      const paypalLink = await getSettingValue(SETTING_KEYS.PAYPAL_ME_LINK);
      return {
        priceUsd: value ?? DEFAULT_PREMIUM_PRICE,
        paypalLink: paypalLink ?? "",
      };
    }),

    /** Genera una lectura gratuita autosuficiente de una carta sin crear pedidos ni tocar pagos. */
    submitSingleCardReading: publicProcedure
      .input(z.object({
        situation: z.string().min(10).max(500),
        context: z.enum(["love", "money_work"]),
        card: z.object({
          id: z.string(),
          orientation: z.enum(["upright", "reversed"]),
        }),
      }))
      .mutation(async ({ input }) => {
        rejectRestrictedQuestion(input.situation);
        const cards = normalizeSelection([input.card]);
        const card = cards[0];
        if (!card || cards.length !== 1) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Carta inválida" });
        }

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: input.context === "money_work" ? MONEY_WORK_SINGLE_CARD_SYSTEM_PROMPT : SINGLE_CARD_SYSTEM_PROMPT },
              { role: "user", content: buildSingleCardUserMessage(input.situation, card, input.context) },
            ],
            response_format: SINGLE_CARD_RESPONSE_SCHEMA,
          });
          const raw = response.choices?.[0]?.message?.content;
          if (typeof raw !== "string") {
            throw new Error("La respuesta de una carta no contiene texto");
          }
          const structured = parseSingleCardLLMResponse(raw);
          return {
            card: {
              id: card.id,
              name: card.name,
              emoji: card.emoji,
              imageKey: card.imageKey,
              orientation: card.orientation,
            },
            ...structured,
          };
        } catch (error) {
          console.error("[LLM] Error generando lectura de una carta:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "No pude completar la lectura en este momento. Volvé a intentarlo en unos segundos.",
          });
        }
      }),

    /**
     * Crea pedido + genera lectura IA gratis con las 3 cartas y la situación.
     * Devuelve token de acceso y la lectura.
     */
    submitReading: publicProcedure
      .input(z.object({
        situation: z.string().min(10).max(800),
        context: z.enum(["love", "money_work"]),
        cardIds: z.array(z.string()).length(3).optional(),
        cards: z.array(z.object({
          id: z.string(),
          orientation: z.enum(["upright", "reversed"]),
        })).length(3).optional(),
      }).refine(input => Boolean(input.cards || input.cardIds), {
        message: "Se requieren tres cartas",
      }))
      .mutation(async ({ input }) => {
        rejectRestrictedQuestion(input.situation);
        const cards = input.cards
          ? normalizeSelection(input.cards)
          : assignOrientations(normalizeSelection((input.cardIds ?? []).map(id => ({ id }))));
        if (!hasThreeDistinctCards(cards)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cartas inválidas o repetidas" });
        }

        const accessToken = nanoid(24);

        await createOrder({
          accessToken,
          situation: input.situation,
          selectedCards: JSON.stringify(cards.map(({ id, orientation }) => ({ id, orientation }))),
        });

        // Generar lectura con LLM
        const userMsg = buildReadingUserMessage(input.situation, cards, input.context);

        let reading = "";
        try {
          const resp = await invokeLLM({
            messages: [
              { role: "system", content: input.context === "money_work" ? MONEY_WORK_SYSTEM_PROMPT : SYSTEM_PROMPT },
              { role: "user", content: userMsg },
            ],
          });
          const raw = resp.choices?.[0]?.message?.content;
          reading = typeof raw === "string" ? raw : "";
        } catch (e) {
          console.error("[LLM] Error generando lectura:", e);
        }

        if (!reading) {
          reading = "En este momento no pude completar la lectura. Por favor probá nuevamente en un instante.";
        }

        await updateOrderReading(accessToken, reading);

        return {
          accessToken,
          reading,
          cards: cards.map(c => ({ id: c!.id, name: c!.name, emoji: c!.emoji, imageKey: c!.imageKey, orientation: c!.orientation })),
        };
      }),

    /** Cliente accede a su pedido (lectura + estado audio) por token */
    getOrderByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const order = await getOrderByToken(input.token);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        const cards = parseStoredSelection((() => {
          try { return JSON.parse(order.selectedCards); } catch { return []; }
        })());

        return {
          id: order.id,
          accessToken: order.accessToken,
          situation: order.situation,
          freeReading: order.freeReading,
          cards: cards.map(c => ({ id: c!.id, name: c!.name, emoji: c!.emoji, imageKey: c!.imageKey, orientation: c!.orientation })),
          paymentStatus: order.paymentStatus,
          deliveryStatus: order.deliveryStatus,
          audioFileKey: order.audioFileKey,
          createdAt: order.createdAt,
          paidAt: order.paidAt,
          completedAt: order.completedAt,
        };
      }),

    /**
     * Confirma pago de PayPal manualmente desde el frontend después del checkout.
     * Recibe paypalOrderId + datos del cliente, marca como paid y notifica a la dueña.
     */
    confirmPayment: publicProcedure
      .input(z.object({
        token: z.string(),
        paypalOrderId: z.string().min(1),
        amount: z.string().min(1),
        currency: z.string().default("USD"),
        clientName: z.string().min(1).max(200),
        clientEmail: z.string().email(),
        premiumQuestion: z.string().min(5).max(800),
      }))
      .mutation(async ({ input }) => {
        const order = await getOrderByToken(input.token);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        if (order.paymentStatus === "paid") {
          return { success: true, alreadyPaid: true };
        }

        await markOrderPaid({
          token: input.token,
          paypalOrderId: input.paypalOrderId,
          amount: input.amount,
          currency: input.currency,
          clientName: input.clientName,
          clientEmail: input.clientEmail,
          premiumQuestion: input.premiumQuestion,
        });

        // Notificar a la dueña
        try {
          await notifyOwner({
            title: "Nuevo pago confirmado — Lectura premium",
            content: `Cliente: ${input.clientName} (${input.clientEmail})
Monto: ${input.amount} ${input.currency}
Pregunta del cliente:
${input.premiumQuestion}

Pedido #${order.id}. Ingresá al panel admin para subir el audio.`,
          });
        } catch (e) {
          console.error("[Notify] Error enviando notificación:", e);
        }

        return { success: true, alreadyPaid: false };
      }),

    /** Cliente actualiza/registra solo su pregunta premium antes del pago (opcional) */
    setPremiumQuestion: publicProcedure
      .input(z.object({ token: z.string(), question: z.string().min(5).max(800) }))
      .mutation(async ({ input }) => {
        await updateOrderPremiumQuestion(input.token, input.question);
        return { success: true };
      }),
  }),

  dodo: router({
    /** Precio y disponibilidad del producto puntual configurado exclusivamente en Dodo. */
    getDeepReadingProduct: publicProcedure.query(async () => {
      try {
        const product = await getDodoDeepReadingProduct();
        return { configured: true as const, ...product };
      } catch (error) {
        if (error instanceof DodoConfigurationError) {
          return { configured: false as const, productId: null, amountMinor: null, currency: null };
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No pude cargar el producto de pago." });
      }
    }),

    /** Crea una compra puntual y una Checkout Session alojada por Dodo. */
    createDeepReadingCheckout: publicProcedure
      .input(z.object({
        question: z.string().min(10).max(500),
        context: z.enum(["love", "money_work"]),
        action: z.enum(["deepen", "new_question"]),
        origin: z.string().url(),
      }))
      .mutation(async ({ input }) => {
        rejectRestrictedQuestion(input.question);
        const purchaseToken = nanoid(32);
        const origin = new URL(input.origin).origin;

        try {
          const product = await getDodoDeepReadingProduct();
          await createDodoDeepReadingPurchase({
            purchaseToken,
            question: input.question.trim(),
            context: input.context,
            action: input.action,
            dodoProductId: product.productId,
          });

          const checkout = await createDodoDeepReadingCheckout({
            purchaseToken,
            returnUrl: `${origin}/?dodo_purchase=${encodeURIComponent(purchaseToken)}`,
            cancelUrl: `${origin}/?dodo_purchase=${encodeURIComponent(purchaseToken)}&checkout=cancelled`,
          });
          await setDodoCheckoutSession(purchaseToken, checkout.checkoutSessionId);

          return { purchaseToken, checkoutUrl: checkout.checkoutUrl };
        } catch (error) {
          if (error instanceof DodoConfigurationError) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La compra todavía no está configurada." });
          }
          console.error("[Dodo] Error creando checkout:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No pude iniciar el checkout. Probá nuevamente." });
        }
      }),

    /** Devuelve sólo el estado necesario para reanudar una compra en el mismo navegador. */
    getDeepReadingPurchase: publicProcedure
      .input(z.object({ purchaseToken: z.string().min(20).max(64) }))
      .query(async ({ input }) => {
        const purchase = await getDodoDeepReadingPurchase(input.purchaseToken);
        if (!purchase) throw new TRPCError({ code: "NOT_FOUND", message: "No encontramos esta compra." });
        return {
          purchaseToken: purchase.purchaseToken,
          question: purchase.question,
          context: purchase.context,
          action: purchase.action,
          status: purchase.status,
          lastGenerationError: purchase.lastGenerationError,
        };
      }),

    /** Ejecuta exactamente la lectura profunda aprobada una vez que Dodo confirmó una compra no consumida. */
    submitPaidDeepReading: publicProcedure
      .input(z.object({
        purchaseToken: z.string().min(20).max(64),
        cards: z.array(z.object({
          id: z.string(),
          orientation: z.enum(["upright", "reversed"]),
        })).length(3),
      }))
      .mutation(async ({ input }) => {
        const purchase = await getDodoDeepReadingPurchase(input.purchaseToken);
        if (!purchase) throw new TRPCError({ code: "NOT_FOUND", message: "No encontramos esta compra." });
        if (purchase.status !== "paid") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Esta compra todavía no habilita una tirada." });
        }

        rejectRestrictedQuestion(purchase.question);
        const cards = normalizeSelection(input.cards);
        if (!hasThreeDistinctCards(cards)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cartas inválidas o repetidas." });
        }

        const claimed = await claimDodoPurchaseForGeneration(purchase.purchaseToken);
        if (!claimed) {
          throw new TRPCError({ code: "CONFLICT", message: "Esta compra ya está siendo utilizada o fue consumida." });
        }

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: purchase.context === "money_work" ? MONEY_WORK_SYSTEM_PROMPT : SYSTEM_PROMPT },
              { role: "user", content: buildReadingUserMessage(purchase.question, cards, purchase.context as ReadingContext) },
            ],
          });
          const reading = response.choices?.[0]?.message?.content;
          if (typeof reading !== "string" || !reading.trim()) {
            throw new Error("Gemini no devolvió una lectura.");
          }
          await consumeDodoPurchase(purchase.purchaseToken);
          return {
            reading: reading.trim(),
            cards: cards.map(card => ({
              id: card.id,
              name: card.name,
              emoji: card.emoji,
              imageKey: card.imageKey,
              orientation: card.orientation,
            })),
          };
        } catch (error) {
          console.error("[Dodo] Error generando lectura paga:", error);
          await releaseDodoPurchaseAfterGenerationFailure(
            purchase.purchaseToken,
            "La lectura no pudo generarse todavía; podés reintentarla sin volver a pagar.",
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Tu pago sigue válido. No pude generar la lectura todavía; reintentá en unos segundos.",
          });
        }
      }),
  }),

  admin: router({
    listOrders: adminProcedure.query(async () => {
      const all = await listAllOrders();
      return all.map(o => ({
        id: o.id,
        accessToken: o.accessToken,
        clientName: o.clientName,
        clientEmail: o.clientEmail,
        situation: o.situation,
        premiumQuestion: o.premiumQuestion,
        selectedCards: (() => { try { return JSON.parse(o.selectedCards) as string[]; } catch { return [] as string[]; } })(),
        freeReading: o.freeReading,
        paymentStatus: o.paymentStatus,
        deliveryStatus: o.deliveryStatus,
        amountPaid: o.amountPaid,
        currency: o.currency,
        audioFileKey: o.audioFileKey,
        createdAt: o.createdAt,
        paidAt: o.paidAt,
        completedAt: o.completedAt,
      }));
    }),

    /** Sube MP3 base64 al storage y lo asocia al pedido */
    uploadAudio: adminProcedure
      .input(z.object({
        orderId: z.number().int().positive(),
        filename: z.string().min(1),
        contentType: z.string().default("audio/mpeg"),
        dataBase64: z.string().min(10),
      }))
      .mutation(async ({ input }) => {
        const buf = Buffer.from(input.dataBase64, "base64");
        if (buf.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Archivo vacío" });
        if (buf.length > 25 * 1024 * 1024) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Archivo demasiado grande (máx 25MB)" });
        }

        const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
        const relKey = `orders/${input.orderId}/${safeName}`;
        const { key, url } = await storagePut(relKey, buf, input.contentType);
        await setOrderAudio(input.orderId, key);
        return { key, url };
      }),

    markCompleted: adminProcedure
      .input(z.object({ orderId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await markOrderCompleted(input.orderId);
        return { success: true };
      }),

    getSettings: adminProcedure.query(async () => {
      const price = await getSettingValue(SETTING_KEYS.PREMIUM_PRICE_USD);
      const paypal = await getSettingValue(SETTING_KEYS.PAYPAL_ME_LINK);
      return {
        priceUsd: price ?? DEFAULT_PREMIUM_PRICE,
        paypalLink: paypal ?? "",
      };
    }),

    updateSettings: adminProcedure
      .input(z.object({
        priceUsd: z.string().regex(/^\d+(\.\d{1,2})?$/),
        paypalLink: z.string().url().or(z.literal("")),
      }))
      .mutation(async ({ input }) => {
        await setSettingValue(SETTING_KEYS.PREMIUM_PRICE_USD, input.priceUsd);
        await setSettingValue(SETTING_KEYS.PAYPAL_ME_LINK, input.paypalLink);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
