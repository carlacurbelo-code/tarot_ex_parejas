# Verificación manual — eliminación del hook

Se abrió la ruta `/` después de eliminar el contrato y estado asociados. La pregunta de prueba fue **«¿Me va a volver a buscar pronto?»** y la interfaz abrió correctamente el selector de una carta. Se continuará el recorrido real hasta el resultado para comprobar que sólo quedan las acciones de profundización y nueva pregunta.

La carta revelada fue **El Mundo, derecha**. La lectura se mostró sin bloque intermedio ni texto de continuación: «El Mundo sugiere que esa persona cerró una etapa importante y podría buscarte pronto para reiniciar el vínculo desde un lugar más maduro y completo, habiendo superado los viejos conflictos que los distanciaron.» Debajo aparecieron directamente y sólo los controles **«Profundizar esta lectura»** y **«Hacer otra pregunta»**.

Al pulsar **«Profundizar esta lectura»**, la interfaz abrió una cuadrícula nueva con el encabezado **«Elegí tres cartas»** y cero cartas seleccionadas. Este recorrido utiliza internamente la pregunta original, como confirma la lógica cubierta por `resolveDeepQuestion` y el envío profundo que usa exclusivamente `deepQuestion`.

Al volver al resultado y pulsar **«Hacer otra pregunta»**, se abrió correctamente el campo libre **«¿Qué querés preguntar?»** con la acción **«Elegir tres cartas»**. La segunda rama no arrastra la consulta original: carga el texto en `newQuestion` y luego lo resuelve como `deepQuestion` para una nueva cuadrícula independiente.

Se ingresó **«¿Qué está frenando la comunicación?»** y el botón abrió una cuadrícula nueva de tres cartas, vacía e independiente. Ambas rutas de continuación permanecen disponibles sin generar ningún texto adicional ni una segunda llamada para la lectura gratuita.

En la cuadrícula de la rama de nueva pregunta, la selección visual comenzó con tres cartas independientes: **La Fuerza invertida**, **El Juicio invertida** y **La Estrella derecha**. La interfaz expone sus nombres y orientaciones mediante etiquetas accesibles, confirmando que la selección conserva las orientaciones antes del envío profundo.

Tras la recarga automática causada por la validación técnica, se reinició de forma controlada el recorrido con la misma nueva pregunta y se abrió otra vez el selector de una carta. El reinicio no modifica la lógica verificada de las dos ramas; sólo restablece el estado efímero del navegador.

En esta comprobación adicional, se eligió **Nueve de Copas invertida**. La carta se mostró físicamente rotada y la etiqueta accesible coincidió con la orientación, manteniendo intacta la representación aprobada de invertidas.

La respuesta de una carta fue «El Nueve de Copas invertido sugiere que la falta de comunicación nace de una insatisfacción profunda y de expectativas que no se cumplieron en el vínculo. Esa desconexión emocional personal frena el acercamiento y mantiene la distancia actual entre ustedes dos.» Sólo se mostraron los dos botones aprobados. Desde allí, **«Hacer otra pregunta»** abrió el formulario independiente sin ningún recuadro o texto de hook.

Para la comprobación de la segunda ruta, se ingresó como consulta profunda independiente **«¿Qué está frenando la comunicación?»**. El control **«Elegir tres cartas»** se habilitó sólo con ese texto nuevo.

La nueva cuadrícula de tres cartas reveló **Cuatro de Oros derecha**, **Sota de Copas invertida** y **Caballero de Bastos derecha**. Son tres cartas nuevas, distintas de la carta única previa, y sus orientaciones quedaron disponibles para el envío profundo.

La solicitud real a `tarot.submitReading` confirmó la rama B: envió `situation` igual al valor ingresado en el campo libre, **«¿Qué está frenando la comunicación?»**, y exactamente las tres cartas nuevas seleccionadas (`four_pentacles` derecha, `page_cups` invertida, `knight_wands` derecha). Esta ejecución usó la misma frase que la pregunta inicial como control; la suite automatizada comprueba por separado que la fuente de B es `newQuestion`, no `originalQuestion`. La respuesta profunda se mostró correctamente. Se volvió luego, mediante los controles de la interfaz, a la lectura gratuita para comprobar también la rama A.

En la rama A se abrió una nueva cuadrícula vacía de tres cartas y se seleccionaron **La Templanza invertida**, **El Carro derecha** y **La Emperatriz invertida**. Son tres cartas diferentes de la carta única inicial (Nueve de Copas invertida), por lo que la nueva tirada es independiente.

La solicitud real a `tarot.submitReading` de la rama A envió la consulta original **«¿Qué está frenando la comunicación?»** con exactamente esas tres cartas (`temperance` invertida, `chariot` derecha y `empress` invertida). La respuesta profunda se mostró correctamente. La resolución de la pregunta para ambas ramas también está cubierta por la suite automatizada, que verifica que A conserva `originalQuestion` y B usa `newQuestion` como `deepQuestion`.

La validación final informó TypeScript sin errores, **34/34 pruebas Vitest aprobadas** y compilación de producción completada. Un grep limitado al código y pruebas activas (`server`, `client` y `shared`, archivos TS/TSX) no devolvió coincidencias de `deepening_hook` ni `deepeningHook`.
