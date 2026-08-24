# Reporte de implementación — Bloque 2

## Resultado y alcance

Se implementó el flujo funcional solicitado: **pregunta libre → tirada gratuita de una carta → lectura completa + `deepening_hook` → profundizar la misma lectura u otra pregunta → nueva tirada independiente de tres cartas → lectura profunda**. La lectura gratuita usa una única llamada estructurada al LLM; la profunda conserva el procedimiento y el `SYSTEM_PROMPT` de tres cartas del Bloque 1.

No se incorporó checkout, precio, cobro, créditos, suscripción ni WhatsApp. Tampoco se alteraron el catálogo de 78 cartas, el barajado por tirada, el 30% de invertidas, la rotación visual, PayPal, pedidos, audio, administración, autenticación o el modelo/helper existentes.

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `server/routers.ts` | Se agregó `SINGLE_CARD_SYSTEM_PROMPT`, el esquema JSON estricto, `buildSingleCardUserMessage`, `parseSingleCardLLMResponse` y el procedimiento público `tarot.submitSingleCardReading`. El prompt/procedimiento profundo sigue separado. |
| `shared/readingFlow.ts` | Nuevo módulo puro para crear mazos independientes, seleccionar una carta, mantener hasta tres cartas profundas sin duplicados y resolver `deepQuestion`. |
| `client/src/pages/Home.tsx` | Nuevo estado y recorrido de una carta, resultado con hook y dos acciones, campo de nueva pregunta y tirada profunda nueva de tres cartas. |
| `server/tarot.test.ts` | Cobertura del contrato de una carta, esquema `reading + deepening_hook`, pregunta/orientación, independencia de tiradas, `deepQuestion`, reutilización legítima de cartas y ausencia de contexto gratuito en el envío profundo. |
| `auditoria_manual_bloque2.md` | Registro de las comprobaciones reales en navegador. |
| `reporte_bloque2.md` | Este reporte final. |
| `todo.md` | Seguimiento de tareas del Bloque 2. |

## System prompt literal — tirada de una carta

```text
Sos una tarotista experimentada, clara y cercana. Escribí en español conversacional, natural y sencillo, hablándole de "vos" a la persona. Respondé únicamente su pregunta sobre una ex pareja o vínculo amoroso a partir de UNA carta del Rider-Waite-Smith y su orientación.

La lectura debe rondar 90 a 130 palabras, sin rellenar para alcanzar un mínimo: si queda correctamente resuelta antes, terminá. La primera frase debe responder concretamente la pregunta con la tendencia principal que sugiere la carta. Profundizá en una energía dominante, bloqueo, dinámica, apertura, cierre o dirección probable, pero no exageres lo que una sola carta permite concluir ni fabriques ambigüedad para que la persona continúe.

No presentes el tarot como certeza factual. En preguntas sobre otra persona, usá "la carta sugiere", "podría mostrar" o "el vínculo parece"; no afirmes pensamientos, sentimientos, motivos o acciones de terceros como hechos. No uses introducciones emocionales, coaching, lenguaje terapéutico, poesía, misticismo cliché, frases de autoayuda, palabras artificialmente sofisticadas, relleno, repeticiones, títulos, viñetas, emojis ni preguntas reflexivas.

Devolvé exactamente dos campos: "reading" y "deepening_hook". "reading" debe ser una respuesta real, completa y autosuficiente. "deepening_hook" debe ser una sola oración declarativa, breve, contextual y natural que se entienda al leerse sola; debe contener un verbo conjugado y no puede ser un título, sintagma, fragmento, rótulo ni lista. Debe explicar qué dimensión podría explorarse con más profundidad en otra lectura. El hook no debe inventar una pregunta, no debe ser una pregunta, no debe prometer revelaciones, no debe sugerir secretos, terceras personas, engaños o peligros sin fundamento, no debe generar miedo ni contradecir la lectura. No mencionés pago, compra, precio ni una lectura bloqueada.
```

## Contrato exacto de respuesta de una carta

La misma llamada al helper LLM usa un esquema JSON estricto. No existe una segunda llamada para el hook.

```json
{
  "reading": "string no vacío",
  "deepening_hook": "string no vacío"
}
```

El esquema exige ambos campos y prohíbe propiedades adicionales. La API recibe pregunta, ID de carta y orientación; el servidor normaliza el ID contra el catálogo compartido antes de formar el mensaje que llega al LLM.

## Cinco pruebas manuales de una carta

| # | Pregunta | Carta y orientación | Palabras de `reading` |
|---:|---|---|---:|
| 1 | ¿Lo nuestro está cerrado? | Siete de Oros, invertida | 58 |
| 2 | ¿Qué siente por mí? | Siete de Bastos, derecha | 99 |
| 3 | ¿Me va a volver a buscar? | Siete de Espadas, derecha | 94 |
| 4 | ¿Hay posibilidad de reconciliación entre nosotros? | Dos de Oros, derecha | 97 |
| 5 | ¿Qué lugar ocupo todavía en su vida? | Dos de Oros, invertida | 88 |

### Prueba 1

> **Reading:** Lo vuestro no está completamente cerrado de forma definitiva, pero el Siete de Oros invertido señala un desgaste profundo y la sensación de que el esfuerzo invertido no está dando frutos. El vínculo parece estancado en una espera cansina donde los resultados esperados no llegan, lo que refleja más frustración que un cierre formal o una resolución clara.
>
> **Deepening hook:** El análisis del grado de desgaste acumulado en la comunicación permite comprender mejor la dinámica actual del vínculo.

### Prueba 2

> **Reading:** El Siete de Bastos en posición derecha sugiere que la otra persona se encuentra actualmente a la defensiva respecto a vos, sosteniendo su postura con firmeza pero también con cierto desgaste. La carta muestra que hay una necesidad de proteger su espacio o sus decisiones afectivas, lo que indica que el vínculo podría estar atravesado por tensiones o por la sensación constante de tener que dar explicaciones o luchar por mantenerse firme. No se percibe una apertura fluida en este momento, sino más bien resistencia y un esfuerzo por preservar su individualidad frente a lo que demanda la relación.
>
> **Deepening hook:** Se puede explorar con más detalle la raíz de esa necesidad de defensa y qué factores del entorno están influenciando su actitud actual.

### Prueba 3

> **Reading:** El Siete de Espadas en posición derecha sugiere que es poco probable que vuelva a buscarte de manera directa o sincera en este momento. La carta muestra una energía de evasión, donde la otra persona prefiere especular, mantener distancia o resolver sus asuntos por su cuenta antes que enfrentar un vínculo claro. Si bien podría haber algún tipo de contacto esporádico o calculado, la dinámica actual no apunta a una reconciliación abierta ni honesta, sino más bien a una actitud esquiva que prioriza su propia conveniencia por encima de la comunicación sincera con vos.
>
> **Deepening hook:** Esta situación permite analizar con más detalle cuáles son las motivaciones reales detrás de su conducta evasiva.

### Prueba 4

> **Reading:** El Dos de Oros al derecho sugiere que la posibilidad de reconciliación existe, pero transita por un momento de constante balance y adaptación entre ambos. La carta muestra una dinámica donde los altibajos, las dudas prácticas y la necesidad de priorizar otras áreas de la vida impiden que se consolide un acuerdo firme por ahora. El vínculo parece moverse entre el deseo de acercamiento y la vacilación constante sobre cómo encajar los tiempos de cada uno. No hay una negativa rotunda, sino una gestión inestable de la energía que complica dar un paso definitivo hacia el reencuentro.
>
> **Deepening hook:** Esta situación permite examinar con mayor detalle qué prioridades prácticas están pesando más en la balanza de cada uno.

### Prueba 5

> **Reading:** El Dos de Oros invertido sugiere que actualmente ocupás un lugar de inestabilidad y dificultad para equilibrar las prioridades en su vida. La carta muestra que el vínculo se mueve entre confusiones y falta de organización emocional, lo que le impide sostener una atención constante hacia vos. No parece haber un espacio consolidado ni una dirección clara en este momento, sino más bien complicaciones cotidianas que opacan la conexión. Aunque existió un flujo constante en el pasado, la energía actual refleja desbalance y abrumo frente a otras exigencias.
>
> **Deepening hook:** Se puede examinar con mayor detalle qué factores externos están generando este desequilibrio en su rutina diaria.

Los cinco hooks finales son diferentes, contextuales y no imponen una próxima pregunta. Se detectó durante la prueba una respuesta inicial con hook fragmentario; antes de cerrar el bloque se reforzó el prompt para exigir una oración autónoma con verbo conjugado y se repitió la prueba afectada.

## Tres flujos completos

| Flujo | Pregunta gratuita | Carta gratis | Elección | Pregunta profunda enviada | Tres cartas nuevas |
|---|---|---|---|---|---|
| A | ¿Lo nuestro está cerrado? | Siete de Oros, invertida | Profundizar esta lectura | ¿Lo nuestro está cerrado? | La Fuerza, derecha; Dos de Espadas, derecha; Caballero de Copas, derecha |
| B | ¿Qué siente por mí? | Siete de Bastos, derecha | Hacer otra pregunta | ¿Qué está frenando la comunicación entre nosotros? | La Estrella, derecha; Reina de Oros, derecha; Diez de Bastos, derecha |
| C | ¿Me va a volver a buscar? | Siete de Espadas, derecha | Hacer otra pregunta | ¿Qué necesito comprender para cerrar esta etapa? | Diez de Bastos, derecha; Seis de Bastos, derecha; El Mago, derecha |

En el flujo A, el payload profundo real recibió la pregunta original y sólo las tres cartas nuevas. En los flujos B y C, el payload recibió exactamente la nueva pregunta escrita en el campo libre y sólo sus tres nuevas cartas. Ninguno de los tres envíos profundos incluyó `reading`, `deepening_hook`, significados manuales ni la carta gratuita previa.

> **Lectura profunda A:** El vínculo no está cerrado del todo, pero la energía actual está completamente detenida por dudas y bloqueo mental. La presencia de La Fuerza junto al Dos de Espadas muestra que, aunque hay paciencia, dominio de impulso y un deseo genuino de sostener la conexión, vos o él se están negando a ver la realidad o a tomar una decisión definitiva por miedo al conflicto. Sin embargo, la aparición del Caballero de Copas al final sugiere que la disposición emocional sigue intacta y que podría haber un acercamiento o un mensaje sensible más adelante. En síntesis, la puerta sigue entornada, frenada por la indecisión, pero el afecto todavía busca un cauce para expresarse.

> **Lectura profunda B:** Lo que está frenando la comunicación es un agotamiento profundo y una carga excesiva que impide que ambos se conecten con fluidez. La tirada sugiere que el peso de las responsabilidades cotidianas, representado por el Diez de Bastos, ahoga la esperanza y la inspiración de La Estrella. A esto se suma la energía de la Reina de Oros, que muestra una actitud práctica, distante o ensimismada en resolver cuestiones materiales o personales, priorizando la estabilidad individual antes que el riesgo de abrir el diálogo. Las cartas se combinan para mostrar que el cansancio y el enfoque en lo cotidiano bloquean cualquier intento de acercamiento genuino. En síntesis, el freno actual pasa por una saturación de cargas que deja sin energía ni espacio mental para hablar.

> **Lectura profunda C:** Para cerrar esta etapa necesitás comprender que cargaste con todo el peso del vínculo vos sola, buscando una validación externa que nunca terminó de equilibrarse. La tirada sugiere que este desgaste y la necesidad constante de reconocimiento o triunfo en la relación te mantuvieron atada a una dinámica agotadora. El Mago aparece indicándote que ya tenés todas las herramientas y el poder personal para reiniciar tu camino por cuenta propia, sin depender de la aprobación de la otra persona. En síntesis, el cierre llegará cuando sueltes esa carga pesada y reconozcas que tu capacidad de crear una realidad distinta depende única y exclusivamente de vos.

## Estado y separación de preguntas

El estado de Home conserva tres variables separadas:

| Variable | Función |
|---|---|
| `originalQuestion` | Guarda la pregunta de la tirada gratuita. Si se pulsa **«Profundizar esta lectura»**, se convierte en `deepQuestion`. |
| `newQuestion` | Guarda únicamente el texto del campo que aparece tras **«Hacer otra pregunta»**. |
| `deepQuestion` | Es la única pregunta enviada a `tarot.submitReading` con las tres cartas nuevas. |

La segunda tirada siempre crea `deepDeck` nuevo mediante `createIndependentReadingDeck()`, vacía `deepCards` y aplica nuevamente las orientaciones por carta. La carta gratuita no se inserta ni se excluye: puede reaparecer de forma legítima porque se trata de un mazo independiente.

## Confirmaciones de no regresión

- El `SYSTEM_PROMPT` de tres cartas quedó intacto. Sigue siendo `SYSTEM_PROMPT`; la nueva lectura utiliza `SINGLE_CARD_SYSTEM_PROMPT` por separado.
- La tirada profunda continúa llamando a `tarot.submitReading` con `deepQuestion` y exactamente tres cartas distintas; no recibe contexto interpretativo de la tirada gratuita.
- La baraja sigue teniendo 78 cartas, se baraja al iniciar cada tirada, no admite duplicados dentro de la profunda y mantiene orientación independiente con 30% de invertidas.
- No se implementaron pagos, checkout, precios, créditos, suscripciones ni cambios en PayPal, pedidos, audio, administración, autenticación o WhatsApp.
- No se realizó rediseño visual: se reutilizaron los componentes, colores, tipografías, fondos y animaciones existentes. El único cambio visual funcional fue sustituir la oferta de pago que antes ocupaba el resultado de `/` por el hook y las dos acciones obligatorias del nuevo flujo.

## Validación técnica

| Verificación | Resultado |
|---|---|
| TypeScript — `pnpm check` | Correcto, sin errores. |
| Vitest — `pnpm test` | Correcto: 2 archivos, 31 pruebas aprobadas. |
| Producción — `pnpm build` | Correcto. |
| Navegador — cinco lecturas y tres flujos | Correcto: solicitudes tRPC reales HTTP 200 y estados visibles verificados. |

El build emitió únicamente la advertencia estándar de Vite por un bundle JavaScript mayor a 500 kB tras minificación; no bloqueó la compilación ni la ejecución.

## Errores, ajustes y limitaciones encontrados

Durante la primera prueba el modelo generó un `deepening_hook` como fragmento. Se corrigió únicamente el prompt de una carta para exigir una oración declarativa con verbo conjugado y se repitió la prueba. El resultado final cumple ese formato.

La redacción de las lecturas se mantiene no factual por instrucción, pero sigue dependiendo de la generación del modelo en cada llamada. No se agregaron significados manuales ni reglas interpretativas para reemplazar al LLM.

El Bloque 2 termina aquí. No se avanzó a monetización, checkout, precios, diseño, branding, suscripción, WhatsApp ni ningún bloque posterior.
