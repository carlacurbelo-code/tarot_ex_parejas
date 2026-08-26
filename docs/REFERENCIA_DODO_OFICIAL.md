# Referencia técnica oficial — Dodo Payments

**Consulta realizada:** 25 de agosto de 2026. Esta nota registra únicamente información pública de la documentación oficial para implementar la integración solicitada.

| Tema | Hallazgo oficial relevante |
|---|---|
| Checkout recomendado | Dodo recomienda crear una **Checkout Session** en el servidor y redirigir a la usuaria al `checkout_url` hospedado. La sesión es de un solo uso y expira en 24 horas por defecto. |
| Producto | La sesión requiere un `product_id` válido creado previamente en el Dashboard de Dodo. |
| Retorno | `return_url` puede recibir parámetros de pago, pero el retorno no debe usarse como autorización definitiva. |
| Webhook | Dodo emite eventos, incluido `payment.succeeded`, y recomienda usarlos para cambios de estado verificables. |
| Firma | Los webhooks usan Standard Webhooks; se verifica con los encabezados `webhook-id`, `webhook-timestamp` y `webhook-signature`. El SDK oficial expone `unwrap()` para verificar y parsear. |
| Idempotencia | Cada evento incluye `webhook-id`; debe persistirse/procesarse una sola vez. Dodo reintenta las entregas fallidas y pueden llegar fuera de orden. |
| Seguridad | La API usa autenticación Bearer con una clave de API de servidor. El secreto de webhook y la API key no deben exponerse al frontend. |
| Pruebas | El Dashboard puede enviar eventos de ejemplo; Dodo también ofrece CLI para reenviar eventos de test a un servidor local. |

## Fuentes oficiales

1. [Guía de integración de pagos únicos](https://docs.dodopayments.com/developer-resources/integration-guide)
2. [Crear una Checkout Session](https://docs.dodopayments.com/api-reference/checkout-sessions/create)
3. [Guía de Checkout Sessions](https://docs.dodopayments.com/developer-resources/checkout-session)
4. [Webhooks](https://docs.dodopayments.com/developer-resources/webhooks)
5. [SDK TypeScript](https://docs.dodopayments.com/developer-resources/sdks/typescript)
6. [Adaptador oficial para Express](https://docs.dodopayments.com/developer-resources/express-adaptor)
