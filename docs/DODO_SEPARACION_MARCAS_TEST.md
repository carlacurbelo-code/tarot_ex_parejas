# Separación segura de marcas Dodo — Tarot de Medianoche

## Alcance

Esta separación aplica únicamente al receptor de webhooks de Tarot de Medianoche en **Dodo Test Mode**. No se modificó Dodo Live, no se generaron cobros nuevos y no se crearon checkout sessions durante esta auditoría o implementación.

## Auditoría de Dodo Test Mode

La consulta de sólo lectura confirmó que los dos productos de Tarot están asociados a la marca `Tarot de medianoche`:

| Producto | Product ID | Precio | Brand ID | Resultado |
|---|---|---:|---|---|
| Tarot de Medianoche — Tirada de 3 cartas | `pdt_0NmBt9sQd5Yki1Ci8G1Cp` | USD 2,99 | `brnd_0NmBsWPpuF3v5LYhakKtE` | Correcto |
| Tarot de Medianoche — Pack de 3 lecturas | `pdt_0NmF9cAm2iq0ZLQPiXEZl` | USD 6,99 | `brnd_0NmBsWPpuF3v5LYhakKtE` | Correcto |

La marca está habilitada y su nombre en Dodo es `Tarot de medianoche`. El producto y la marca pertenecen al mismo business de Dodo que también contiene Konstel, por lo que el filtro por marca es necesario.

## Política implementada

La firma continúa verificándose con `getDodoClient().webhooks.unwrap(...)` usando exclusivamente `ENV.dodoPaymentsWebhookKey`, que se alimenta de `DODO_PAYMENTS_WEBHOOK_KEY`. La validación de marca ocurre después de verificar la firma y antes de buscar o modificar una compra.

Un evento `payment.succeeded` sólo puede continuar si `payment.brand_id` existe y coincide exactamente con `DODO_TAROT_BRAND_ID`. Los eventos con `brand_id` ausente, vacío o perteneciente a Konstel se registran para idempotencia, se ignoran sin producir efectos comerciales y reciben HTTP 200. El mismo comportamiento se aplica si la marca persistida al preparar el checkout no coincide con la marca del pago.

La marca que se persiste en cada compra no proviene del cliente: se obtiene de `product.brand_id` al recuperar el producto de Dodo y se almacena en `dodoBrandId` antes de crear el checkout. El webhook compara posteriormente esa marca persistida con la del evento. Las compras antiguas que no tienen marca persistida quedan rechazadas de manera segura por diseño.

El registro de `webhook-id` se conserva antes de cualquier operación que conceda acceso o marque un pago como pagado. Así, los reintentos del mismo evento siguen siendo idempotentes y devuelven HTTP 200 sin duplicar efectos.

## Cambios realizados

| Archivo | Cambio |
|---|---|
| `drizzle/schema.ts` | Nueva columna nullable `dodoBrandId` en compras Dodo. |
| `drizzle/0003_wealthy_bucky.sql` | Migración no destructiva que agrega la columna. |
| `server/_core/env.ts` | Exposición server-side de `DODO_TAROT_BRAND_ID`. |
| `server/dodo.ts` | Recuperación de `brand_id` junto con el producto y precio. |
| `server/routers.ts` | Persistencia de la marca devuelta por Dodo al preparar el checkout. |
| `server/dodoWebhook.ts` | Validación fail-closed por marca, respuestas HTTP 200 para eventos ignorados y comprobación contra la marca persistida. |
| `server/dodoWebhook.test.ts` | Pruebas de aceptación Tarot, rechazo Konstel, marca ausente e idempotencia. |
| `server/dodo.credentials.test.ts` | Consulta ligera de la marca y comprobación de correspondencia producto-marca. |

El flujo heredado de PayPal/audio continúa separado: no utiliza `dodoBrandId`, no comparte el webhook comercial y no fue modificado.

## Validación

Se ejecutaron correctamente la prueba de credenciales contra Dodo Test Mode, las pruebas específicas del webhook y las regresiones Dodo: **25/25 tests pasando**. También pasó `pnpm check` sin errores de TypeScript. La migración fue aplicada correctamente y no contiene operaciones destructivas.
