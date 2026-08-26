import type { Request, Response } from "express";
import { getDodoClient } from "./dodo";
import {
  getDodoDeepReadingPurchase,
  markDodoPurchasePaid,
  recordDodoWebhookEvent,
} from "./db";
import { ENV } from "./_core/env";

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
      res.status(204).end();
      return;
    }

    const payment = event.data;
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
      res.status(204).end();
      return;
    }

    if (!purchaseToken) {
      res.status(204).end();
      return;
    }

    const purchase = await getDodoDeepReadingPurchase(purchaseToken);
    const containsExpectedProduct = Boolean(
      purchase && payment.product_cart?.some(item => item.product_id === purchase.dodoProductId),
    );

    if (!purchase || !containsExpectedProduct) {
      console.warn("[Dodo] Pago recibido sin una compra profunda válida asociada.");
      res.status(204).end();
      return;
    }

    await markDodoPurchasePaid({
      purchaseToken,
      paymentId: payment.payment_id,
    });
    res.status(204).end();
  } catch (error) {
    console.error("[Dodo] Webhook rechazado:", error);
    res.status(400).json({ error: "Firma o payload de Dodo inválido." });
  }
}
