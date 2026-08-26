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
