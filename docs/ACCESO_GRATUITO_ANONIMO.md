# Acceso gratuito anónimo y continuidad de créditos

## Recorrido público

La primera experiencia no exige email, registro, contraseña ni inicio de sesión. Una visitante elige el contexto, escribe una pregunta, selecciona tres cartas y recibe la interpretación completa de Gemini en ese mismo recorrido. Las preguntas restringidas se rechazan antes de seleccionar una carta, reservar el derecho gratuito, consumir un crédito o iniciar una compra.

Una vez entregada esa lectura, quien regresa desde el mismo navegador ve la posibilidad de continuar con el pack de **3 lecturas adicionales por USD 6,99**. La interfaz no usa mensajes acusatorios ni muestra un contador de prueba.

## Identificador anónimo y datos mínimos

En la primera visita el servidor crea una cookie host-only llamada `tarot_visitor`, con un valor aleatorio. La cookie es `HttpOnly`, usa `SameSite=Lax`, se marca `Secure` en HTTPS y dura un año. El valor original nunca se guarda en la base de datos: sólo se persiste su hash HMAC-SHA-256, junto con la fecha de consumo del derecho gratuito, una reserva temporal de generación y la fecha de expiración. Los registros de visitantes expiran a los 365 días.

No se usan canvas fingerprinting, fuentes instaladas, huellas de hardware, seguimiento entre sitios ni mecanismos para reconstruir la identidad de una persona.

## Control de abuso por IP

La IP no es una identidad de usuario ni bloquea por sí sola a una segunda persona. Se usa únicamente como señal secundaria contra automatización evidente. El servidor almacena sólo un hash HMAC de la IP dentro de una ventana de una hora y elimina los registros vencidos antes de procesar una nueva solicitud.

El límite es de **12 identidades anónimas nuevas por IP cada 60 minutos**. Una persona o un hogar normal puede usar la web sin quedar bloqueado automáticamente por compartir Wi‑Fi, red móvil, oficina o universidad; el límite entra en juego recién ante alta rotación de identificadores nuevos desde una misma conexión.

## Consumo seguro de la lectura gratuita y de créditos

Antes de llamar a Gemini, el derecho gratuito queda reservado por hasta diez minutos. Si Gemini o el guardado de la interpretación falla, la reserva se libera y la persona puede reintentar sin perder la lectura. Sólo tras obtener y guardar una interpretación válida se marca la lectura gratuita como consumida.

Las lecturas pagas descuentan un crédito de forma atómica desde el perfil asociado a la cookie anónima. Si Gemini falla o la selección resulta inválida, el crédito se restaura. Los webhooks de Dodo siguen siendo idempotentes y el flujo PayPal/audio continúa aislado.

## Email y recuperación

El email no se pide para la lectura gratuita. Se solicita únicamente al comprar el pack para asociar los créditos a la compra; el consentimiento de novedades es independiente, opcional y no viene marcado. Al volver al mismo navegador, la cookie recupera automáticamente los créditos pendientes después de cerrar la web.

La recuperación segura en **otro navegador o dispositivo** requiere incorporar un proveedor de correo transaccional para enviar un enlace de acceso de un solo uso. No se implementó un formulario que entregue créditos sólo con conocer un email, porque no verificaría la titularidad. Esta es la única decisión/integración pendiente para recuperación multi-dispositivo sin construir cuentas ni contraseñas.

## Dodo Payments

El código exige que el producto configurado para el pack sea un pago único de **USD 6,99**, moneda USD y tres créditos. No se modificó el dashboard de Dodo ni se creó un checkout nuevo durante este cambio. Si el producto actualmente configurado conserva esas condiciones, no se requiere ninguna modificación adicional en Dodo.
