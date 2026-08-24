# Reporte — Corrección puntual del Bloque 2

## Cambios realizados

Se modificaron exclusivamente el prompt, el control de longitud de la lectura gratuita de una carta y los mensajes de carga. No se cambiaron el `SYSTEM_PROMPT` de tres cartas, su flujo, el mazo, las orientaciones, la interfaz general, pagos, audio, administración, WhatsApp, branding ni el resto de funcionalidades.

| Área | Ajuste aplicado |
|---|---|
| `reading` de una carta | El prompt pide idealmente 35–50 palabras, respuesta directa y síntesis. El parser bloquea toda respuesta superior a **50 palabras**. |
| `deepening_hook` | El prompt fija un máximo de **25 palabras**, exige una única oración concreta con verbo conjugado y el dato pendiente específico. Prohíbe abstracciones, sintagmas, secretismo, datos ocultos no justificados, anglicismos y gramática forzada. |
| Loading de una carta | **«Interpretando tu carta…»** |
| Loading de tres cartas | **«Interpretando la combinación de tus cartas…»** |

Los rangos inferiores no se impusieron mediante relleno artificial: dos lecturas completas quedaron por debajo del rango ideal de 35–50 palabras, respetando la instrucción de no extender una respuesta sólo para alcanzar una cifra.

## Cinco pruebas reales de una carta

| # | Pregunta | Carta y orientación | Lectura | Palabras | `deepening_hook` | Palabras |
|---:|---|---|---|---:|---|---:|
| 1 | ¿Me va a volver a buscar? | As de Espadas, derecha | Sí, el As de Espadas derecho sugiere que esa persona podría volver a buscarte con una comunicación directa, clara y decidida. La carta muestra una energía de cortes definidos o verdades que salen a la luz, abriendo la posibilidad de un contacto mentalmente honesto. | 44 | Todavía falta saber si ese impulso repentino se convertirá en una acción concreta o si quedará solo en una intención aislada. | 21 |
| 2 | ¿Qué siente por mí ahora? | Cinco de Copas, derecha | El Cinco de Copas muestra que esa persona experimenta actualmente una sensación de pérdida y tristeza respecto a lo nuestro. La carta sugiere que su atención está puesta en lo que no funcionó, aunque todavía guarda un vínculo afectivo con los recuerdos compartidos. | 43 | Todavía falta saber si ese pesar se transformará en un deseo activo de reparación o en una aceptación definitiva del distanciamiento. | 21 |
| 3 | ¿Hay una posibilidad de reconciliación? | El Mundo, invertida | La carta sugiere que todavía hay asuntos inconclusos que frenan la reconciliación y el vínculo parece estancado en un ciclo que no termina de cerrarse para poder avanzar. | 28 | Falta saber qué obstáculo específico impide soltar el pasado para definir un nuevo comienzo. | 14 |
| 4 | ¿Qué está bloqueando el contacto? | Sota de Espadas, invertida | El contacto se bloquea porque la comunicación genera suspicacia y la Sota de Espadas invertida sugiere palabras malinterpretadas o temores a confrontar discusiones pendientes que distancian al vínculo en este momento. | 31 | Falta determinar qué malentendido específico alimenta esa distancia y frena cualquier iniciativa de hablar. | 14 |
| 5 | ¿Qué intención tiene conmigo? | Siete de Copas, derecha | El Siete de Copas sugiere que esa persona oscila entre fantasías y muchas opciones, por lo que su intención actual parece confusa y poco definida. Podría estar idealizando el vínculo sin saber bien qué paso dar realmente con vos. | 39 | Todavía falta saber si ese impulso imaginario se transformará en una decisión concreta o si quedará en una simple ilusión pasajera. | 21 |

Las cinco respuestas fueron generadas desde el flujo real de `/`. Todas cumplen el máximo absoluto de 50 palabras para `reading`; los hooks cumplen el máximo de 25 palabras y señalan una incógnita concreta que una tirada nueva de tres cartas podría investigar.

## Verificación de loading

Se retrasó temporalmente la respuesta de red sólo en la sesión de prueba para observar los estados reales. La tirada de una carta mostró **«Interpretando tu carta…»**. Desde esa lectura se abrió una tirada profunda independiente, se eligieron Reina de Bastos, Sota de Copas y Tres de Copas, y el estado de carga mostró **«Interpretando la combinación de tus cartas…»**.

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `server/routers.ts` | Ajuste del prompt de una carta y validación de máximo de palabras. |
| `client/src/pages/Home.tsx` | Mensajes de carga diferenciados según una o tres cartas. |
| `server/tarot.test.ts` | Pruebas de límites, contrato del hook y textos de loading. |
| `auditoria_correccion_bloque2.md` | Evidencia detallada de las pruebas reales. |
| `reporte_correccion_puntual_bloque2.md` | Este reporte. |
| `todo.md` | Seguimiento de la corrección puntual. |

## Validación técnica

`pnpm check` terminó sin errores. `pnpm test` terminó con **34 pruebas aprobadas en 2 archivos**. El Bloque 2 no fue extendido a ningún otro alcance.
