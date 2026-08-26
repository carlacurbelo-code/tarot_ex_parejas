# Auditoría final de monetización — Tarot de Medianoche

**Alcance.** Esta auditoría revisa el código, las rutas y la configuración persistida. No se modificaron flujos, precios, pasarelas, mazo, imágenes, prompts, audio, administración ni infraestructura.

> **Resultado inmediato:** la experiencia actual de tres cartas se entrega gratis y de forma directa. El pago heredado está diseñado para solicitar y entregar una lectura humana en audio; no desbloquea la nueva lectura de tres cartas con Gemini.

## 1. Sistema de pago existente

El mecanismo actual es un **enlace PayPal.me configurable**. La pantalla heredada `/lectura/:token` abre ese enlace externo con el importe en USD y solicita que la cliente vuelva a introducir manualmente el ID de transacción. No existe integración con una API de creación/captura de órdenes de PayPal, ni consulta de estado a PayPal, ni webhook entrante de pago.

La mutación pública `tarot.confirmPayment` recibe del navegador el token de pedido, el ID de transacción, importe, moneda, nombre, email y pregunta premium; después cambia el estado local del pedido a `paid` y notifica a la administradora. El servidor **no verifica** que el ID exista, que el importe corresponda, que el pagador haya efectuado el pago ni que PayPal haya confirmado la operación.

| Pregunta | Estado real |
|---|---|
| Método integrado | Enlace externo PayPal.me configurable. |
| API/checkout propio | No. |
| Webhook/verificación de PayPal | No. |
| Confirmación actual | Manual y autodeclarada por la cliente mediante ID de transacción. |
| Efecto local de confirmar | Marca `paymentStatus = paid`, guarda datos y notifica a la administradora. |
| Producto que desbloquea | Preparación y entrega posterior de un audio humano, no una lectura IA de tres cartas. |

## 2. Precio actual

La tabla `settings` contiene actualmente `premium_price_usd = "20"` y `paypal_me_link = ""`. Por lo tanto, el precio persistido es **USD 20**, pero el enlace de cobro está vacío y la pantalla heredada muestra un error en vez de abrir PayPal. El código usa un valor de reserva de **USD 15** sólo cuando la clave de precio no existe; no aplica con la configuración actual.

El importe y enlace se editan desde el panel de administración mediante una única configuración global. Los nombres de las claves (`premium_price_usd` y `paypal_me_link`) y el copy de pantalla los vinculan al producto premium heredado de audio; no existe un precio separado ni una configuración específica para la nueva lectura IA de tres cartas.

## 3. Pedido, token, audio y administración

El modelo `orders` concentra el flujo heredado. Cada registro almacena token de acceso, situación, cartas seleccionadas, lectura, pregunta premium, estado de pago, identificador PayPal, monto, moneda, clave de MP3 y estado de entrega. El token permite abrir `/lectura/:token` o `/mi-lectura/:token` sin login.

Después de que `confirmPayment` marca un pedido como pagado, la administradora recibe una notificación y el panel coloca el pedido en «Para entregar». Desde allí puede subir un MP3, asociarlo al pedido y marcarlo completado. La vista de cliente por token muestra el audio sólo cuando el pedido está `paid`, `completed` y tiene `audioFileKey`.

| Componente | Rol actual | Relación con el nuevo producto IA |
|---|---|---|
| `orders` | Pedido de audio, pago y entrega humana. | No contiene un permiso de acceso ni resultado de «tres cartas pagas». |
| `accessToken` | Enlace sin login para la lectura/pedido y su audio. | No se usa desde la interfaz nueva de una carta. |
| `confirmPayment` | Cambia estado local y avisa a la dueña. | No invoca Gemini ni entrega tres cartas. |
| Panel admin | Ve pedidos, pago/entrega, sube MP3, completa y edita precio/enlace. | Sirve al audio; no es necesario para entregar una lectura IA automática. |
| `audioFileKey` | Referencia al MP3 subido manualmente. | Exclusiva del producto heredado de audio. |

## 4. Estado real de la nueva lectura de tres cartas

### Recorrido exigido: pago → tres cartas → Gemini → resultado

**NO.** Hoy no existe el recorrido automático solicitado. La ruta pública nueva hace lo siguiente:

```text
Pregunta → 1 carta gratis → lectura IA → Profundizar / Hacer otra pregunta
→ selección de 3 cartas → Gemini → resultado inmediato
```

No aparece un paywall, no se consulta el precio, no se abre PayPal, no se confirma pago y no se evalúa un permiso de acceso antes de `tarot.submitReading`. El corte con el flujo deseado sucede **inmediatamente después** de pulsar «Profundizar esta lectura» o «Hacer otra pregunta»: ambos botones dirigen directamente a la selección de tres cartas.

Además, `tarot.submitReading` crea internamente un registro `orders` y un token incluso para esta lectura profunda, pero Home no conserva ni muestra ese token. La llamada genera Gemini de inmediato y devuelve el resultado; crear ese pedido no constituye ni un cobro ni un bloqueo de contenido.

### A. «Profundizar esta lectura»

**Estado actual:** conserva la pregunta original y el contexto ya elegido; crea una tirada independiente de tres cartas y genera Gemini directamente. **No paga, no crea checkout visible, no confirma pago ni usa el token de pedido en la interfaz nueva.**

### B. «Hacer otra pregunta»

**Estado actual:** permite escribir otra pregunta y volver a elegir o conservar el contexto antes de crear una tirada independiente de tres cartas. Gemini se invoca directamente. **No hay paso de pago ni comprobación de cobro.**

## 5. Modificación mínima para el producto deseado

El objetivo exige un pago confirmado antes de permitir la selección/generación profunda. La modificación debe conservar el audio heredado aislado y reutilizar sólo los elementos compatibles.

| Categoría | Situación |
|---|---|
| **A. Reutilizable** | Lectura gratuita de una carta; gestión de pregunta/contexto; selección independiente de tres cartas; procedimiento Gemini de tres cartas; UI de resultados; configuración de precio como patrón; token de acceso como patrón técnico. |
| **B. A modificar** | Las dos acciones posteriores a la lectura gratis deben dirigir a un estado de checkout/paywall, no a `beginDeepDraw`. `submitReading` debe exigir una autorización de compra válida en el servidor antes de generar Gemini. |
| **C. A crear** | Un registro o estado de «desbloqueo de tirada profunda» que conserve pregunta/contexto antes de elegir cartas; un checkout verificable; una confirmación confiable de pago; una relación entre pago confirmado y permiso de una única tirada profunda. Es preferible mantenerlo separado de `orders` de audio mediante un tipo de producto explícito o una entidad de desbloqueo nueva. |
| **D. Servicios/credenciales** | Cuenta del proveedor de pago elegido, credenciales de servidor, secreto de firma de webhook y URL pública de callback/webhook. Si se envían recibos, también un proveedor de correo o el mecanismo de notificación elegido. |

El enlace PayPal.me vigente no proporciona confirmación servidor-a-servidor. Adaptarlo para el flujo automático requeriría sustituir el enlace/manual ID por una integración oficial de checkout de PayPal con verificación y webhooks. Alternativamente podría elegirse otra pasarela compatible con checkout y webhooks; no se seleccionó ni integró ninguna alternativa en esta auditoría.

## 6. Complejidad, riesgos y bloqueos

La complejidad es **media**. La parte de tarot y Gemini ya existe; el trabajo se concentra en autorización de pago, seguridad de la confirmación, persistencia del desbloqueo y unión de UI/servidor.

| Riesgo o bloqueo | Consecuencia si no se resuelve |
|---|---|
| Enlace PayPal.me vacío | El pago heredado no puede iniciarse desde la pantalla actual. |
| Confirmación recibida del cliente sin verificación | Una persona puede marcar un pedido como pagado con un ID y monto arbitrarios. |
| Sin webhook/API | No existe pago automático ni fuente confiable de verdad del proveedor. |
| `orders` orientado a audio | Mezclar una tirada IA instantánea con entrega humana puede producir estados y copy incorrectos. |
| `submitReading` público | Sin control de autorización, la lectura profunda puede solicitarse sin pagar. |
| Precio global de audio | Reutilizarlo para IA sin separar productos puede cambiar accidentalmente la oferta heredada. |

## Evidencia revisada

| Evidencia | Hallazgo principal |
|---|---|
| `client/src/pages/Home.tsx` | Ambos caminos de la lectura gratis invocan directamente la selección/lectura profunda; no hay pago. |
| `client/src/pages/Reading.tsx` | PayPal.me, ID de transacción manual y copy exclusivo de audio. |
| `client/src/pages/OrderView.tsx` | Entrega por token de un MP3 administrado manualmente. |
| `client/src/pages/Admin.tsx` | Gestión de pedidos pagados, audio, entrega y configuración global de precio/enlace. |
| `server/routers.ts` | Confirmación local sin verificación externa; Gemini de tres cartas público y separado. |
| `server/db.ts` y `drizzle/schema.ts` | Pedido, token, precio, pago y audio unidos al modelo heredado. |
| Consulta de `settings` del 25/08/2026 | Precio persistido USD 20; enlace PayPal.me vacío. |

## Conclusión

> **LISTO PARA COBRAR POR LA TIRADA DE 3 CARTAS: NO.**

La tirada profunda actual es gratuita y se ejecuta antes de cualquier pago. El cobro existente pertenece al flujo heredado de audio, usa PayPal.me con confirmación manual no verificada y hoy no tiene enlace configurado. Para cobrar y desbloquear la lectura IA automáticamente hace falta un checkout verificable, una autorización de compra persistente y una validación de servidor antes de ejecutar Gemini.
