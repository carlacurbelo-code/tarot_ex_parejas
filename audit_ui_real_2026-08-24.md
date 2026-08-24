# Auditoría real de la ruta `/` — evidencia de navegador

## Observación inicial

- La ruta pública cargó la pantalla de pregunta y, tras introducir una pregunta válida y pulsar **«Elegir mis 3 cartas»**, abrió el selector real.
- El selector renderizó **78 botones de carta boca abajo** visibles en el DOM del navegador, numerados por la herramienta de automatización del 3 al 80.
- La primera pantalla visible del selector contiene las primeras filas de la secuencia, cuyos dorsos no muestran nombre ni tipo; esta evidencia requiere contrastarse con el orden del catálogo para comprobar si una usuaria que pulsa posiciones visibles recibe sistemáticamente Mayores.

## Próxima comprobación

Se registrarán 15 recorridos completos a través de esos botones, el estado revelado, la pantalla de resultado y el envío tRPC al backend/LLM. También se realizará una prueba temporal de carta invertida.

## Evidencia de orden real detectada

- La primera carta pulsada en la cuadrícula real se reveló como **El Loco**, Arcano Mayor, con orientación **derecha**.
- La inspección del DOM real muestra 78 botones de carta y confirma que el primer botón de carta es el primer elemento del catálogo: no se detectó un filtro que elimine Menores antes de renderizar.
- El origen de la repetición percibida es que Home entrega `TAROT_DECK` sin barajar y ese catálogo está construido con los **22 Arcanos Mayores primero**. Como todas las cartas se ven idénticas boca abajo, una selección intuitiva desde las primeras filas puede producir repetidamente sólo Mayores.

## Evidencia parcial de flujo completo

- La automatización mediante clics DOM reales en `/` alcanzó el endpoint `tarot.submitReading` con respuesta HTTP 200 antes de exceder el límite de tiempo de la consola.
- La primera solicitud observada envió `two_pentacles`, `five_cups` y `high_priestess`, y la respuesta del backend devolvió exactamente **Dos de Oros**, **Cinco de Copas** y **La Sacerdotisa**, todas derechas. Esto prueba una cadena real completa con Menores: selección en UI → estado React → payload tRPC → normalización del backend → datos devueltos junto a la lectura.
- La segunda solicitud observada envió y recibió **Tres de Espadas**, **As de Bastos** y **As de Copas**, también desde la UI real. La ejecución se reanudará en lotes pequeños para registrar las 15 tiradas sin depender del tiempo máximo de una sola consola.

## Error visual de cartas invertidas confirmado

- En la decimoquinta interacción real se presentó **Nueve de Bastos, invertida** junto a La Sacerdotisa y Cuatro de Bastos. La página de resultado y el texto de la lectura reconocieron correctamente la orientación invertida.
- La inspección de estilos del navegador detectó que el elemento interno tenía la clase `rotate-180`, pero su estilo computado era `transform: none`. Por tanto, `reversed` llega al estado, al backend y al LLM, pero no se aplica una rotación física en la UI.
- El fallo es de representación CSS, no de la orientación ni del payload. La corrección debe hacer que la clase de rotación exista en la salida CSS de la aplicación, sin cambiar el motor, el prompt ni la lógica de envío.

## Prueba temporal controlada de inversión

- Se restauró el selector desde la pantalla de resultado y se preparó la sesión de navegador para forzar únicamente la próxima asignación de orientación mediante `Math.random = () => 0.1`, valor que activa la rama `reversed` del 30% configurado.
- Este forzado existe sólo en la sesión del navegador de auditoría y no modifica código fuente ni el comportamiento de producción. Se restaurará inmediatamente después de comprobar la selección y el envío.
- La primera carta revelada durante el forzado fue **El Loco, invertida**. El `aria-label` real de la interfaz confirmó el nombre y la orientación, pero la captura visual siguió sin mostrar giro físico; se verificará su estilo calculado y el payload tras completar las otras dos cartas.
- La tirada temporal quedó compuesta por **El Loco, El Mago y La Sacerdotisa**, las tres marcadas como **invertidas** en los controles reales de la interfaz. La captura muestra que permanecen visualmente derechas antes de la corrección CSS.
- Al pulsar el botón real **«Ver mi lectura»**, la pantalla aún no había transitado al resultado tras la primera espera; se verificará el registro de red y consola antes de reintentar con un mecanismo distinto. La sesión conserva las tres cartas invertidas para la comprobación.

## Resultado de envío temporal y restauración

- Tras restaurar `Math.random` a su implementación original y accionar el mismo control desde el DOM, la interfaz transitó a resultado y registró HTTP 200.
- El payload real enviado a `tarot.submitReading` fue: `fool/reversed`, `magician/reversed` y `high_priestess/reversed`. Esto confirma que las orientaciones forzadas se conservaron desde la UI hasta el backend.
- El forzado fue retirado inmediatamente antes del envío. El código fuente nunca fue modificado para alterar la probabilidad; el motor vuelve a utilizar 30% aleatorio en nuevas selecciones.

## Validación posterior a la corrección

- La ruta `/` fue recargada desde el navegador después de la corrección y volvió a mostrar la cuadrícula de 78 cartas. La nueva sesión no conserva el forzado temporal anterior.
- Se verificará mediante revelación de las primeras posiciones que el orden visible ya fue barajado y mediante una orientación invertida forzada en navegador que el estilo computado presenta una rotación real de 180°.
- La primera posición de la nueva cuadrícula se reveló como **Seis de Oros**, Arcano Menor de Oros, lo que confirma que el orden visible ya no comienza de forma determinista con El Loco y los Mayores.
- La prueba temporal posterior a la corrección marcó **Seis de Oros, invertida**, pero su estilo calculado aún fue `transform: none` incluso con `rotate-180` en el DOM. Se aplicará una corrección aún más directa y acotada al `style.transform` del contenido revelado, sin tocar el motor ni la orientación.
- Se restauró explícitamente `Math.random` con una muestra no determinista y se recargó `/` en una sesión limpia después de sustituir la utilidad CSS por un `transform: rotate(180deg)` explícito. La siguiente comprobación volverá a forzar sólo una interacción local y verificará el estilo calculado final.
- La sesión final se abrió mediante la misma secuencia de una usuaria —pregunta válida y botón **«Elegir mis 3 cartas»**— y muestra las 78 cartas del selector. Se forzará una única revelación invertida local, se comprobará el giro y se restaurará el azar normal antes del cierre.
- El test final forzó **La Torre, invertida** durante una única selección de la interfaz. El estilo calculado final fue `matrix(-1, 0, 0, -1, 0, 0)` y el estilo inline fue `rotate(180deg)`: la captura de navegador muestra el símbolo y el nombre físicamente boca abajo.
- La prueba restauró `Math.random` antes de finalizar; por lo tanto, la siguiente selección vuelve a usar la probabilidad normal de 30% invertida. La carta conserva a la vez el nombre y la orientación correctos en el control (`La Torre, invertida`).
