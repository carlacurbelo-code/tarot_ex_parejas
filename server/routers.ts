import { COOKIE_NAME } from "@shared/const";
import { TAROT_DECK, getCardById } from "@shared/tarot";
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

const SYSTEM_PROMPT = `Sos una tarotista íntima y humana que escribe lecturas para personas con dudas sobre una ex pareja o un vínculo amoroso terminado o en pausa.

Tu voz:
- Cálida, cercana, emocional. Hablás de "vos" (rioplatense / hispano neutro suave).
- Empática y honesta, sin sonar terapéutica ni de coaching corporativo.
- Sin estética mística cliché: nada de "el universo te dice", "los astros", "la energía cósmica", "querida alma", lunas, brujería.
- No fatalista, no rígida, no robótica.

Cómo escribís la lectura:
- Entre 220 y 280 palabras, en castellano neutro hispano.
- Hablá directamente con la persona, en segunda persona.
- Integrá las 3 cartas en un relato coherente, no las listes una por una de forma técnica.
- Reflejá lo que la persona compartió en su situación.
- Generá CLARIDAD PARCIAL: tocá el corazón del tema, mostrá la dinámica real, pero NO cierres la interpretación. Dejá puertas abiertas, matices, una pregunta sin responder, un detalle por explorar.
- El final debe dejar a la persona con ganas de profundizar, sintiendo que hay más por entender en su caso particular.
- NO prometas certezas absolutas (jamás "va a volver", "no va a volver", "te ama", "no te ama"). Hablá de tendencias, energías del vínculo, gestos posibles.
- NO uses bullet points ni títulos. Es un texto fluido, en 3 a 5 párrafos cortos.
- NO uses emojis.
- NO firmes la lectura.

Estructura sugerida (sin titularla):
1. Apertura íntima reflejando la situación.
2. La energía actual del vínculo, según las cartas.
3. La dinámica emocional entre ambos / el bloqueo principal.
4. Cierre abierto que orienta sin resolver del todo.`;

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
        cardIds: z.array(z.string()).length(3),
      }))
      .mutation(async ({ input }) => {
        const cards = input.cardIds.map(id => getCardById(id)).filter(Boolean);
        if (cards.length !== 3) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cartas inválidas" });
        }

        const accessToken = nanoid(24);

        await createOrder({
          accessToken,
          situation: input.situation,
          selectedCards: JSON.stringify(input.cardIds),
        });

        // Generar lectura con LLM
        const userMsg = `La persona compartió esta situación con su ex / vínculo:
"${input.situation}"

Las 3 cartas que eligió son:
1. ${cards[0]!.name} — ${cards[0]!.meaning}
2. ${cards[1]!.name} — ${cards[1]!.meaning}
3. ${cards[2]!.name} — ${cards[2]!.meaning}

Escribí ahora la lectura siguiendo todas las reglas del sistema.`;

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
          cards: cards.map(c => ({ id: c!.id, name: c!.name, emoji: c!.emoji, meaning: c!.meaning })),
        };
      }),

    /** Cliente accede a su pedido (lectura + estado audio) por token */
    getOrderByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const order = await getOrderByToken(input.token);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        const cardIds: string[] = (() => {
          try { return JSON.parse(order.selectedCards); } catch { return []; }
        })();
        const cards = cardIds.map(id => getCardById(id)).filter(Boolean);

        return {
          id: order.id,
          accessToken: order.accessToken,
          situation: order.situation,
          freeReading: order.freeReading,
          cards: cards.map(c => ({ id: c!.id, name: c!.name, emoji: c!.emoji, meaning: c!.meaning })),
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
