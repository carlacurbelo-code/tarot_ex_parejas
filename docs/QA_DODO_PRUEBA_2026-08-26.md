# Evidencia QA — Checkout Dodo en test_mode

## Alcance

Se recorrió en navegador el flujo público desde una consulta gratuita hasta la creación del checkout de la lectura profunda. No se completó ningún pago, no se cargaron datos personales y no se ejecutó una compra.

## Resultado observado

La pantalla pública cargó correctamente. Después de elegir `Amor y vínculos`, introducir una pregunta y seleccionar una carta, la lectura gratuita terminó y mostró las acciones `Profundizar esta lectura` y `Hacer otra pregunta`.

Al elegir `Profundizar esta lectura`, la pantalla mostró `Tres cartas para tu pregunta` y el importe configurado por Dodo: `US$ 2,99`. La aplicación no mostró un precio duplicado en código.

Al pulsar `Continuar al pago`, Dodo creó correctamente una Checkout Session y redirigió a un dominio de prueba `test.checkout.dodopayments.com`. El checkout mostró el producto `Tarot de medianoche — Tirada de 3 cartas`, el total `$2.99`, la descripción de una lectura personalizada de tres cartas y los campos de contacto y facturación.

## Conclusión

La API key, el entorno `test_mode`, el producto y la creación de Checkout Session funcionan correctamente. Queda pendiente validar el tramo posterior a un pago de prueba: recepción de `payment.succeeded`, verificación de firma, habilitación del token y consumo único de la tirada. Esa validación requiere completar un pago sandbox con datos de prueba de Dodo; no se realizó en esta sesión.

## Verificación posterior al pago

La usuaria informó que el checkout de Dodo mostró el pago como aprobado. La consulta posterior de la base de datos, sin exponer tokens, mostró que las compras seguían en `checkout_created` y que `dodoWebhookEvents` tenía `0` eventos. Por lo tanto, el webhook todavía no llegó al endpoint público o Dodo no lo entregó correctamente. No se debe considerar completada la validación del desbloqueo hasta que aparezca `payment.succeeded` y una compra pase a `paid`.

La prueba automática de credenciales sí confirmó previamente que la API key y el producto one-time son válidos en `test_mode`, y la prueba manual confirmó que Dodo crea el checkout y muestra el producto por US$ 2,99.

## Retorno desde checkout

Al abrir la URL pública y la de desarrollo con `?dodo_purchase=...`, Home volvía a la selección inicial de contexto en lugar de mostrar las tres cartas. El componente leía el valor de `useLocation()` dividido manualmente por `?`, que no incluía de forma fiable el query string en este adaptador. Se corrigió únicamente esa lectura para usar `window.location.search`, manteniendo intactos el token, el estado de compra y el resto del flujo.

## Revisión posterior del retorno

Después del primer ajuste y de una nueva carga en desarrollo con el token pagado, la pantalla siguió mostrando el contexto inicial. La consola del navegador no mostró errores. La corrección debe continuar investigando cómo se sincroniza la consulta de tRPC con la URL de retorno y el montaje inicial de Home; no se modificaron PayPal, audio ni el motor de tarot.

## Validación del retorno pagado

Tras publicar el backend actualizado, abrir la URL de retorno con la compra sandbox pagada y esperar la consulta tRPC mostró correctamente la pantalla `Elegí tres cartas`, con 78 cartas disponibles, contador de tres selecciones y botón `Ver mi lectura profunda`. Esto confirma que el webhook pagado y el retorno del token ya habilitan el tramo correcto; la pantalla inicial observada inmediatamente al navegar era sólo el estado previo a la respuesta asíncrona.

Durante la selección profunda sandbox se observaron dos cartas seleccionadas sin salir del flujo pagado: `Nueve de Bastos`, derecha, y `Caballero de Espadas`, invertida. La interfaz mostró correctamente el contador de cartas restantes y la segunda carta apareció visualmente invertida sin animación de giro.

## Generación de lectura profunda

Con la compra `paid` se seleccionaron `Nueve de Bastos` derecha, `Caballero de Espadas` invertida y `La Templanza` derecha. La interfaz mostró las tres cartas, conservó la inversión sin animación y aceptó `Ver mi lectura profunda`. El procedimiento cambió a `Tu lectura profunda` y mostró el loading aprobado `Interpretando la combinación de tus cartas…`, confirmando que el token pagado llegó al envío correcto.
