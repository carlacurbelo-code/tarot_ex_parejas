import DodoPayments from "dodopayments";
import { ENV } from "./_core/env";

export class DodoConfigurationError extends Error {
  constructor(message = "Dodo Payments todavía no está configurado.") {
    super(message);
    this.name = "DodoConfigurationError";
  }
}

export function isDodoConfigured() {
  return Boolean(ENV.dodoPaymentsApiKey && ENV.dodoPaymentsWebhookKey && ENV.dodoDeepReadingProductId);
}

export function getDodoClient() {
  if (!ENV.dodoPaymentsApiKey) {
    throw new DodoConfigurationError("Falta DODO_PAYMENTS_API_KEY.");
  }

  return new DodoPayments({
    bearerToken: ENV.dodoPaymentsApiKey,
    environment: ENV.dodoPaymentsEnvironment,
  });
}

export async function getDodoDeepReadingProduct() {
  if (!isDodoConfigured()) {
    throw new DodoConfigurationError("Falta configurar el producto de la tirada IA en Dodo.");
  }

  const product = await getDodoClient().products.retrieve(ENV.dodoDeepReadingProductId);
  if (product.is_recurring || product.price.type !== "one_time_price") {
    throw new DodoConfigurationError("El producto configurado en Dodo debe ser de pago único.");
  }

  return {
    productId: product.product_id,
    amountMinor: product.price.price,
    currency: product.price.currency,
  };
}

export async function createDodoDeepReadingCheckout(params: {
  purchaseToken: string;
  returnUrl: string;
  cancelUrl: string;
}) {
  const product = await getDodoDeepReadingProduct();
  const response = await getDodoClient().checkoutSessions.create({
    product_cart: [{ product_id: product.productId, quantity: 1 }],
    return_url: params.returnUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      tarot_purchase_token: params.purchaseToken,
      tarot_product: "deep_reading",
    },
  });

  if (!response.checkout_url) {
    throw new Error("Dodo no devolvió una URL de checkout para la compra.");
  }

  return {
    checkoutSessionId: response.session_id,
    checkoutUrl: response.checkout_url,
    product,
  };
}
