# Auditoría real de la ruta `/` — Bloque 1

## Alcance y método

La auditoría se ejecutó sobre la **ruta pública `/` en navegador**. Cada tirada utilizó el flujo real: carga de la página, pregunta válida, botón **«Elegir mis 3 cartas»**, clics sobre las cartas renderizadas y botón **«Ver mi lectura»**. Se inspeccionaron el DOM, los `aria-label` de cartas reveladas, el estado visual resultante y las solicitudes tRPC reales a `tarot.submitReading`.

No se ejecutó `drawThreeCards` ni se llamó al router directamente para estas quince tiradas. La automatización accionó los mismos controles de la interfaz; por ello se recorrió la cadena que usa una persona: catálogo disponible en Home → clic de una carta → estado `selectedCards` → cartas reveladas → payload tRPC → normalización backend → mensaje al LLM.

## Resultado de las 15 tiradas reales

Todas las solicitudes devolvieron HTTP 200. Los IDs y las orientaciones enviados desde la UI coincidieron con las cartas normalizadas devueltas por el backend. El tipo de cada carta se obtuvo del catálogo compartido de 78 cartas.

| Tirada | Carta 1 | Carta 2 | Carta 3 | Resultado |
|---:|---|---|---|---|
| 1 | Dos de Oros — Menor/Oros, derecha | Cinco de Copas — Menor/Copas, derecha | La Sacerdotisa — Mayor, derecha | UI, backend y respuesta coinciden |
| 2 | Tres de Espadas — Menor/Espadas, derecha | As de Bastos — Menor/Bastos, derecha | As de Copas — Menor/Copas, derecha | UI, backend y respuesta coinciden |
| 3 | Dos de Copas — Menor/Copas, derecha | Ocho de Bastos — Menor/Bastos, derecha | Sota de Bastos — Menor/Bastos, derecha | UI, backend y respuesta coinciden |
| 4 | Nueve de Oros — Menor/Oros, derecha | Seis de Oros — Menor/Oros, derecha | Dos de Espadas — Menor/Espadas, derecha | UI, backend y respuesta coinciden |
| 5 | Rey de Oros — Menor/Oros, invertida | La Emperatriz — Mayor, invertida | Cinco de Oros — Menor/Oros, derecha | UI, backend y respuesta coinciden |
| 6 | Nueve de Oros — Menor/Oros, derecha | Diez de Bastos — Menor/Bastos, derecha | Sota de Espadas — Menor/Espadas, derecha | UI, backend y respuesta coinciden |
| 7 | As de Espadas — Menor/Espadas, derecha | Cinco de Espadas — Menor/Espadas, invertida | Siete de Bastos — Menor/Bastos, invertida | UI, backend y respuesta coinciden |
| 8 | As de Bastos — Menor/Bastos, derecha | El Diablo — Mayor, derecha | La Templanza — Mayor, derecha | UI, backend y respuesta coinciden |
| 9 | Siete de Bastos — Menor/Bastos, derecha | Ocho de Bastos — Menor/Bastos, invertida | Rey de Copas — Menor/Copas, derecha | UI, backend y respuesta coinciden |
| 10 | La Fuerza — Mayor, derecha | Dos de Copas — Menor/Copas, derecha | Reina de Oros — Menor/Oros, derecha | UI, backend y respuesta coinciden |
| 11 | Cuatro de Oros — Menor/Oros, derecha | La Emperatriz — Mayor, derecha | Nueve de Bastos — Menor/Bastos, derecha | UI, backend y respuesta coinciden |
| 12 | Reina de Copas — Menor/Copas, derecha | Ocho de Bastos — Menor/Bastos, derecha | Reina de Bastos — Menor/Bastos, derecha | UI, backend y respuesta coinciden |
| 13 | Dos de Espadas — Menor/Espadas, derecha | La Muerte — Mayor, derecha | Cuatro de Copas — Menor/Copas, derecha | UI, backend y respuesta coinciden |
| 14 | Reina de Bastos — Menor/Bastos, derecha | Nueve de Espadas — Menor/Espadas, derecha | Dos de Bastos — Menor/Bastos, derecha | UI, backend y respuesta coinciden |
| 15 | La Sacerdotisa — Mayor, derecha | Cuatro de Bastos — Menor/Bastos, derecha | Nueve de Bastos — Menor/Bastos, invertida | UI, backend y respuesta coinciden |

Las quince tiradas incluyen Mayores, Copas, Bastos, Espadas y Oros. Por tanto, **el flujo real no filtra Arcanos Menores al enviar o normalizar cartas**.

## Cadena completa verificada

| Tramo | Verificación |
|---|---|
| Catálogo de 78 | El selector real renderizó 78 botones de cartas. El catálogo compartido conserva 22 Mayores y 56 Menores. |
| Cartas disponibles en Home | Home recibió inicialmente el catálogo entero, pero lo mostraba en el orden fijo del catálogo antes de esta corrección. |
| Selección y estado | Cada clic reveló una carta, asignó `orientation` y actualizó el contador/orden de selección de la UI. |
| Cartas visibles | Los `aria-label` revelados mostraron nombre y orientación; las 15 tiradas expusieron Menores de los cuatro palos y Mayores. |
| Envío al backend | Se capturaron solicitudes reales a `tarot.submitReading` con exactamente los tres IDs y orientaciones elegidos. |
| Backend y LLM | El router aplica `normalizeSelection(input.cards)`, valida tres IDs distintos y construye el mensaje del LLM con los nombres y etiquetas de orientación. Luego llama a `invokeLLM` con el `SYSTEM_PROMPT` aprobado y ese mensaje. |

## Causa de la repetición de Arcanos Mayores

No existía un filtro a Mayores, un array antiguo ni un build anterior. El problema estaba en la **representación ordenada de la cuadrícula**: `TAROT_DECK` se construye con los 22 Arcanos Mayores primero y Home lo pasaba directamente a la pantalla de cartas sin barajar. Como los dorsos son iguales, una usuaria que elige desde las primeras filas podía revelar repetidamente El Loco, El Mago, La Sacerdotisa y otros Mayores.

La auditoría anterior que invocaba `drawThreeCards()` no detectó ese comportamiento porque esa función sí baraja el mazo. La ruta `/` no usa `drawThreeCards()` para seleccionar cartas: permite elegir posiciones visuales y sólo asigna la orientación tras cada clic. Esa es la diferencia confirmada entre el selector testeado antes y el flujo real.

## Prueba visual de una carta invertida

Se forzó temporalmente una única selección con `Math.random = () => 0.1` **sólo dentro de la sesión de navegador**. El resultado conocido fue **La Torre, invertida**. El control real mostró el nombre y la orientación correctos, y el estilo calculado del contenido de la carta fue:

```text
inline transform: rotate(180deg)
computed transform: matrix(-1, 0, 0, -1, 0, 0)
```

La captura de la interfaz muestra el nombre y el símbolo físicamente boca abajo. El azar normal se restauró inmediatamente y no se modificó el 30% de cartas invertidas del motor.

## Correcciones aplicadas

| Archivo | Cambio mínimo |
|---|---|
| `client/src/pages/Home.tsx` | Se agregó `visibleDeck`, generado con `shuffleDeck(TAROT_DECK)`, y se vuelve a barajar al abrir el selector. El mazo sigue teniendo 78 cartas y la selección manual continúa sin duplicados. |
| `client/src/components/TarotCardView.tsx` | La carta revelada e invertida aplica `style={{ transform: "rotate(180deg)" }}`; elimina la dependencia de una clase utilitaria que estaba presente en el DOM pero ausente del CSS generado. |
| `server/tarot.test.ts` | Se añadieron dos pruebas de regresión: una verifica que Home baraja el mazo visible y otra que el componente contiene la rotación explícita. |

No se modificaron `SYSTEM_PROMPT`, textos de lectura, funnel, diseño general, pagos, audio, administración ni WhatsApp.

## Verificación final

`pnpm check` terminó correctamente sin errores de TypeScript. `pnpm test` terminó correctamente con **22 pruebas aprobadas en 2 archivos**. La orientación normal conserva 30% aleatorio y las cartas invertidas ahora se representan físicamente giradas 180° en `/`.
