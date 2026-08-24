import { COOKIE_NAME } from "@shared/const";
import {
  TAROT_DECK,
  assignOrientations,
  normalizeSelection,
  orientationLabel,
  parseStoredSelection,
  type CardOrientation,
} from "@shared/tarot";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  DEFAULT_PREMIUM_PRICE,
  SETTING_KEYS,
  createOrder,
  getOrderByToken,
  getSettingValue,
  listAllOrders,
  markOrderCompleted,
  markOrderPaid,
  setOrderAudio,
  setSettingValue,
  updateOrderPremiumQuestion,
  updateOrderReading,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

export const SYSTEM_PROMPT = `Sos una intérprete de tarot íntima, humana y clara. Escribí en español natural, hablándole de "vos" a la persona y respondiendo exclusivamente su pregunta afectiva sobre una ex pareja o vínculo amoroso.

La respuesta DEBE tener estrictamente entre 120 y 160 palabras. Es obligatorio que escribas al menos 120 palabras y nunca superes las 160. La primera frase debe responder directamente la pregunta concreta, no ser una fórmula genérica sobre "la dinámica". Expresá una tendencia clara y específica: parece haber posibilidad de contacto, no aparece movimiento por ahora, la tirada sugiere interés con bloqueo, o la relación parece dirigirse al cierre. No empieces con introducciones emocionales, reformulaciones largas de la situación ni frases como "hay momentos en los que", "tu pregunta nace de", "se siente que", "es comprensible que" o "cuando te preguntás".

Interpretá las tres cartas como un sistema conjunto y explicá brevemente cómo interactúan. No hagas tres definiciones independientes. Las cartas invertidas deben modificar la lectura de forma contextual, no ser automáticamente negativas. Respondé concretamente la pregunta y no escondas la tendencia detrás de ambigüedad innecesaria.

No presentes el tarot como certeza factual. Si la pregunta trata sobre pensamientos, sentimientos, motivos o acciones futuras de otra persona, usá formulaciones como "la tirada sugiere", "esta combinación apunta a" o "la dinámica podría mostrar"; no afirmes hechos verificables sobre terceros. Evitá frases categóricas como "siente", "decidió", "se alejó porque", "está dispuesto", "quiere", "el alejamiento respondió a" o "la separación respondió a". En preguntas sobre terceros, no uses "esta persona", "él", "ella" ni "el otro" como sujeto de afirmaciones sobre estados internos, decisiones o motivos. No escribas "esta persona experimenta", "evalúa" ni atribuyas motivos como hechos; usá como sujeto la tirada, la combinación o el vínculo, con construcciones como "la tirada podría reflejar", "esta combinación sugiere una posible vivencia" o "el vínculo parece mostrar". Presentá esas interpretaciones como posibilidades simbólicas y no como hechos. No uses lenguaje terapéutico, coaching, misticismo cliché, emojis, títulos, viñetas, relleno, frases grandilocuentes ni repitas la pregunta. No firmes la lectura.

Organizá el texto en exactamente 3 o 4 párrafos breves: tendencia principal desde la primera frase, desarrollo de la interacción entre las cartas, síntesis concreta para la pregunta y cierre breve. Usá 1 o 2 frases por párrafo y, antes de terminar, comprobá el conteo: si supera 160 palabras, eliminá detalles; si queda por debajo de 120 palabras, es obligatorio que agregues desarrollo sobre la interacción de las cartas hasta alcanzar el mínimo de 120. La lectura debe ser satisfactoria por sí misma: no generes claridad parcial artificial, no termines obligatoriamente con una pregunta reflexiva y no dejes información deliberadamente sin resolver para provocar una compra o una profundización.`;

export function buildReadingUserMessage(
  question: string,
  cards: readonly { name: string; orientation: CardOrientation }[],
): string {
  return `La pregunta exacta de la persona es:
"${question}"

Las tres cartas de la tirada abierta son:
1. ${cards[0]?.name ?? "Carta 1"} — ${cards[0] ? orientationLabel(cards[0].orientation) : "derecha"}
2. ${cards[1]?.name ?? "Carta 2"} — ${cards[1] ? orientationLabel(cards[1].orientation) : "derecha"}
3. ${cards[2]?.name ?? "Carta 3"} — ${cards[2] ? orientationLabel(cards[2].orientation) : "derecha"}

Interpretá las tres cartas como un sistema integrado, sin usar significados prefabricados, y respondé exclusivamente desde el contexto afectivo de la pregunta.`;
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

    /**
     * Crea pedido + genera lectura IA gratis con las 3 cartas y la situación.
     * Devuelve token de acceso y la lectura.
     */
    submitReading: publicProcedure
      .input(z.object({
        situation: z.string().min(10).max(800),
        cardIds: z.array(z.string()).length(3).optional(),
        cards: z.array(z.object({
          id: z.string(),
          orientation: z.enum(["upright", "reversed"]),
        })).length(3).optional(),
      }).refine(input => Boolean(input.cards || input.cardIds), {
        message: "Se requieren tres cartas",
      }))
      .mutation(async ({ input }) => {
        const cards = input.cards
          ? normalizeSelection(input.cards)
          : assignOrientations(normalizeSelection((input.cardIds ?? []).map(id => ({ id }))));
        if (cards.length !== 3 || new Set(cards.map(card => card.id)).size !== 3) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cartas inválidas o repetidas" });
        }

        const accessToken = nanoid(24);

        await createOrder({
          accessToken,
          situation: input.situation,
          selectedCards: JSON.stringify(cards.map(({ id, orientation }) => ({ id, orientation }))),
        });

        // Generar lectura con LLM
        const userMsg = buildReadingUserMessage(input.situation, cards);

        let reading = "";
        try {
          const resp = await invokeLLM({
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
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
