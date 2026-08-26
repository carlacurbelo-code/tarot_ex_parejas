# Configuración de Dodo Payments — Lectura IA profunda

La integración creada habilita un único producto: **una lectura IA independiente de tres cartas**. No reemplaza ni utiliza los pedidos PayPal/audio heredados. El precio se obtiene directamente del producto de pago único configurado en Dodo; no existe precio duplicado en el código.

## Variables requeridas

| Variable | Clasificación | Uso |
|---|---|---|
| `DODO_PAYMENTS_API_KEY` | Secreta | Crea Checkout Sessions y consulta el producto desde el servidor. |
| `DODO_PAYMENTS_WEBHOOK_KEY` | Secreta | Verifica la firma Standard Webhooks de Dodo antes de habilitar una tirada. |
| `DODO_DEEP_READING_PRODUCT_ID` | Configuración | Identificador `pdt_...` del producto de pago único creado en Dodo. |
| `DODO_PAYMENTS_ENVIRONMENT` | Configuración | Usar `test_mode` para sandbox y `live_mode` para producción. |

La aplicación mantiene el checkout deshabilitado hasta que estén presentes las **tres primeras variables**. Esto evita recibir pagos que no se puedan confirmar por webhook.

## Configuración en Dodo

Creá en el Dashboard de Dodo un producto de tipo **one-time** para la lectura profunda. Definí allí el precio final y la moneda; esa configuración será la única fuente de verdad que verá el paywall. Copiá el ID del producto, que comienza con `pdt_`, como valor de `DODO_DEEP_READING_PRODUCT_ID`.

Creá un webhook HTTPS con la URL pública:

```text
https://tarotpairs-2bz8spuk.manus.space/api/dodo/webhook
```

Suscribilo como mínimo al evento `payment.succeeded`. Copiá el secreto que proporciona Dodo como `DODO_PAYMENTS_WEBHOOK_KEY`. La ruta verifica el cuerpo crudo y la firma oficial antes de guardar el evento, y registra cada `webhook-id` para impedir duplicados.

## Prueba recomendada antes de producción

En `test_mode`, completá una compra con el producto de prueba. Confirmá que Dodo envía `payment.succeeded`, que el retorno vuelve a la app, que recién entonces se habilita la elección de tres cartas y que esa compra no puede usarse por segunda vez. Si Gemini falla, la compra vuelve al estado pagado para permitir un reintento sin pagar de nuevo.

> Las URLs de retorno se generan desde el dominio actual de la usuaria. Si el dominio público cambia, sólo hay que actualizar la URL del webhook en Dodo; el flujo de negocio no cambia.

## Fuentes oficiales

La implementación usa el SDK oficial `dodopayments`, Checkout Sessions alojadas y verificación `webhooks.unwrap()` de Standard Webhooks. Ver [referencia técnica guardada](./REFERENCIA_DODO_OFICIAL.md), la [guía de integración de Dodo](https://docs.dodopayments.com/developer-resources/integration-guide) y su [referencia de webhooks](https://docs.dodopayments.com/developer-resources/webhooks).
