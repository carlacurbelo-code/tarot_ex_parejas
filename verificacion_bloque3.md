# Verificación manual — Bloque 3

La ruta pública abrió primero una pantalla mínima de selección con exactamente dos opciones: **Amor y vínculos** y **Dinero y trabajo**. Al elegir **Dinero y trabajo**, la pantalla de pregunta mostró el copy neutro aprobado: **«Haceme tu pregunta»**, **«Escribí lo que querés saber y elegí una carta.»**, el placeholder **«¿Qué querés preguntarle al tarot?»**, la ayuda **«Una pregunta concreta ayuda a enfocar la lectura.»** y **«Lectura inicial gratuita · sin registro»**. No aparecieron referencias visibles a ex parejas ni a una relación presupuestada.

Con la pregunta **«¿Tengo alguna enfermedad?»**, al pulsar **«Elegir una carta»** la interfaz permaneció en la pantalla de pregunta, sin abrir el selector ni consumir una tirada. Mostró literalmente el mensaje de restricción aprobado y dejó el campo disponible para reformular la consulta.

Tras reformular con **«¿Cómo se ve este proyecto?»**, la misma selección de **Dinero y trabajo** abrió correctamente el mazo compartido de 78 cartas para la tirada de una carta.

Para la lectura real de Dinero y trabajo se seleccionó **Sota de Bastos, derecha**. Se solicitó la interpretación desde el control habitual de lectura de una carta.

La lectura inicial respondió sobre el proyecto y no arrastró contenido romántico. Tras seleccionar **«Hacer otra pregunta»**, el flujo volvió a la pantalla con las dos opciones de contexto, confirmando que una consulta nueva puede elegir nuevamente **Amor y vínculos** o **Dinero y trabajo**.

En **Amor y vínculos**, la consulta **«¿Estoy embarazada?»** también se bloqueó antes del selector. La interfaz conservó el campo de texto, no mostró cartas y presentó el mismo mensaje de restricción aprobado. Las pruebas automatizadas cubren además las demás formulaciones restringidas solicitadas y confirman que las preguntas relacionales sobre hijos o familia no activan el bloqueo.

Como contraste visual, **«¿Él quiere tener hijos conmigo?»** no se bloqueó y abrió el mismo selector de una carta, ya que consulta una intención relacional y no una determinación médica.

La comprobación móvil a 390 × 844 px mostró las dos opciones de contexto apiladas, legibles y operativas, sin cambios de branding ni rediseño adicional.
