import type { Request, Response } from "express";
import { getDodoClient } from "./dodo";
import {
  getDodoDeepReadingPurchase,
  markDodoPurchasePaid,
  recordDodoWebhookEvent,
} from "./db";
import { ENV } from "./_core/env";

export function isAllowedTarotBrand(brandId: unknown, configuredBrandId = ENV.dodoTarotBrandId): brandId is string {
  return typeof brandId === "string" && brandId.length > 0 && configuredBrandId.length > 0 && brandId === configuredBrandId;
}

function signatureHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const name of ["webhook-id", "webhook-timestamp", "webhook-signature"]) {
    const value = req.header(name);
    if (value) headers[name] = value;
  }
  return headers;
}

export async function handleDodoWebhook(req: Request, res: Response) {
  if (!ENV.dodoPaymentsWebhookKey || !ENV.dodoPaymentsApiKey) {
    res.status(503).json({ error: "Dodo Payments no está configurado." });
    return;
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
  const headers = signatureHeaders(req);
  const webhookId = headers["webhook-id"];

  if (!rawBody || !webhookId) {
    res.status(400).json({ error: "Webhook inválido." });
    return;
  }

  try {
    const event = getDodoClient().webhooks.unwrap(rawBody, {
      headers,
      key: ENV.dodoPaymentsWebhookKey,
    });

    if (event.type !== "payment.succeeded") {
      await recordDodoWebhookEvent({ webhookEventId: webhookId, eventType: event.type });
      res.status(200).end();
      return;
    }

    const payment = event.data;
    const paymentBrandId = payment.brand_id;

    // La firma prueba autenticidad, pero no separa marcas dentro del mismo negocio.
    // Rechazamos de forma fail-closed cualquier evento sin brand_id o de otra marca
    // antes de buscar/conceder acceso, marcar pagos o ejecutar otra lógica comercial.
    if (!isAllowedTarotBrand(paymentBrandId)) {
      await recordDodoWebhookEvent({
        webhookEventId: webhookId,
        eventType: event.type,
        dodoPaymentId: payment.payment_id,
      });
      console.warn("[Dodo] Evento firmado ignorado: brand_id ausente o ajeno a Tarot de medianoche.", {
        webhookId,
        brandId: paymentBrandId ?? null,
      });
      res.status(200).end();
      return;
    }
    const purchaseToken = typeof payment.metadata?.tarot_purchase_token === "string"
      ? payment.metadata.tarot_purchase_token
      : null;

    const isFirstDelivery = await recordDodoWebhookEvent({
      webhookEventId: webhookId,
      eventType: event.type,
      dodoPaymentId: payment.payment_id,
      purchaseToken,
    });

    if (!isFirstDelivery) {
      res.status(200).end();
      return;
    }

    if (!purchaseToken) {
      res.status(200).end();
      return;
    }

    const purchase = await getDodoDeepReadingPurchase(purchaseToken);
    if (!purchase || purchase.dodoBrandId !== paymentBrandId) {
      console.warn("[Dodo] Pago ignorado: la marca persistida del checkout no coincide con el evento.", {
        webhookId,
        purchaseToken,
        persistedBrandId: purchase?.dodoBrandId ?? null,
        eventBrandId: paymentBrandId,
      });
      res.status(200).end();
      return;
    }
    const containsExpectedProduct = Boolean(
      purchase && payment.product_cart?.some(item => item.product_id === purchase.dodoProductId),
    );

    if (!purchase || !containsExpectedProduct) {
      console.warn("[Dodo] Pago recibido sin una compra profunda válida asociada.");
      res.status(200).end();
      return;
    }

    await markDodoPurchasePaid({
      purchaseToken,
      paymentId: payment.payment_id,
    });
    res.status(200).end();
  } catch (error) {
    console.error("[Dodo] Webhook rechazado:", error);
    res.status(400).json({ error: "Firma o payload de Dodo inválido." });
  }
}
