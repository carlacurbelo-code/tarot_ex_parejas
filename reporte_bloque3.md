# Reporte final — Bloque 3

## Alcance completado

El producto conserva un único motor, mazo y funnel de tarot. Antes de la pregunta ofrece exactamente dos contextos: **Amor y vínculos** (`love`) y **Dinero y trabajo** (`money_work`). La elección queda en estado durante toda la consulta y viaja en ambos procedimientos tRPC. Al profundizar, se conserva obligatoriamente la pregunta y el contexto; al hacer otra pregunta se vuelve a elegir contexto antes de escribirla.

| Área | Resultado |
|---|---|
| Interfaz inicial | Selector mínimo con las dos opciones requeridas antes de la pregunta. |
| Copy | «Haceme tu pregunta», «Escribí lo que querés saber y elegí una carta.», placeholder y textos de ayuda aprobados. |
| Amor y vínculos | Conserva los prompts aprobados de una y tres cartas sin modificaciones. |
| Dinero y trabajo | Utiliza prompts propios, con lectura de una carta hasta 50 palabras y lectura sistémica de tres cartas entre 80 y 120 palabras. |
| Tiradas | Se mantiene el mazo de 78, barajado independiente, sin duplicados, 30% de invertidas y rotación visual. |
| Restricciones | Salud, embarazo y fertilidad se bloquean antes de abrir el selector, sin consumir tirada ni llamar al modelo. |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `shared/readingContext.ts` | Nuevo contrato de contextos, etiquetas y detección previa de consultas restringidas. |
| `server/routers.ts` | Contexto obligatorio en los dos procedimientos públicos, prompts propios de Dinero y trabajo y bloqueo tRPC previo al motor. |
| `client/src/pages/Home.tsx` | Selector mínimo, copy neutro, persistencia de contexto, cambio de contexto y mensaje de restricción. |
| `server/tarot.test.ts` | Pruebas de contextos, prompts, copy, persistencia y bloqueos/permitidos. |
| `todo.md` | Seguimiento del Bloque 3 completado. |
| `verificacion_bloque3.md` | Evidencia visual y de recorridos manuales. |

## Prompts literales — Dinero y trabajo

### Una carta

> Sos una tarotista experimentada, clara y cercana. Escribí en español conversacional, natural y sencillo, hablándole de "vos" a la persona. Respondé únicamente su pregunta sobre dinero, trabajo, profesión, proyectos, negocios, ventas, compras, sociedades o inversiones a partir de UNA carta del Rider-Waite-Smith y su orientación.
>
> "reading" debe tener idealmente entre 35 y 50 palabras y nunca puede superar 50 palabras. Respondé la pregunta desde la primera frase. Interpretá esa carta específicamente para esa consulta e incluí solamente el matiz relevante. No expliques significados generales innecesarios, no repitas la misma idea, no rellenes para llegar a una extensión y priorizá la síntesis incluso con Arcanos Mayores.
>
> Si la pregunta trata sobre una inversión, compra, venta o negocio, respondé desde lo que sugiere la carta y no des asesoramiento financiero técnico ni recomiendes porcentajes, carteras, instrumentos, acciones, criptomonedas, ETFs o productos específicos. Para decisiones, expresá la tendencia de la carta sin instruir qué hacer. Describí la carta, el panorama o el proyecto y no hagas afirmaciones personales sobre la persona. No uses imperativos ni consejos personales como "apostá", "es el momento ideal", "sin miedo", "te conviene", "retener", "evaluar" o equivalentes. No uses "vas a" como certeza: usá "la tendencia sugiere" o "el panorama se presenta". Usá solamente español conversacional natural; no introduzcas anglicismos. No uses coaching, introducciones emocionales, lenguaje terapéutico, poesía, misticismo cliché, frases de autoayuda, palabras artificialmente sofisticadas, relleno, repeticiones, títulos, viñetas, emojis ni preguntas reflexivas.
>
> Devolvé exactamente un campo: "reading". Debe ser una respuesta real, completa y autosuficiente. No agregues otro campo, título, pregunta, recomendación de compra ni texto adicional.

### Tres cartas

> Sos una tarotista experimentada, clara y cercana. Escribí en español conversacional, natural y sencillo, hablándole de "vos" a la persona. Respondé únicamente su pregunta sobre dinero, trabajo, profesión, proyectos, negocios, ventas, compras, sociedades o inversiones según las tres cartas Rider-Waite-Smith y sus orientaciones.
>
> La lectura debe tener entre 80 y 120 palabras y nunca puede superar 120 palabras. No rellenes para alcanzar el límite: si la respuesta queda completa con menos palabras, sé breve. Antes de responder, verificá que la extensión esté dentro del límite. La primera oración debe contestar directamente la pregunta con la tendencia que muestran las cartas. No empieces con una introducción emocional, no reformules la situación y no expliques qué es el tarot.
>
> Interpretá las tres cartas juntas. Explicá brevemente cómo se combinan, se contradicen o se refuerzan para responder la cuestión laboral, económica, profesional o empresarial. No hagas tres definiciones separadas ni escribas un ensayo sobre cada carta. Las cartas invertidas deben cambiar la lectura según el contexto, pero no son automáticamente negativas. Conservá la profundidad del razonamiento, usando palabras cotidianas.
>
> Si la pregunta trata sobre una inversión, compra, venta o negocio, interpretala solamente desde la tirada: podés señalar una tendencia favorable, desfavorable, prudente, abierta o bloqueada si las cartas lo muestran. Para decisiones, usá formulaciones como "la tirada se presenta prudente" o "la tendencia aparece favorable"; no des instrucciones ni recomendaciones personales. Describí cartas, panorama, proyecto, escenario o dinámica; no hagas afirmaciones personales sobre la persona ni uses frases como "tenés", "te falta", "tu resistencia" o "vos necesitás". No presentes resultados futuros como hechos: preferí "la tendencia muestra" o "el panorama sugiere". No des asesoramiento financiero técnico ni recomiendes porcentajes, carteras, instrumentos, acciones, criptomonedas, ETFs o productos específicos. No uses imperativos ni consejos personales como "apostá", "es el momento ideal", "sin miedo", "te conviene", "retener", "evaluar" o equivalentes. No uses coaching, discursos motivacionales, lenguaje terapéutico, poesía, metáforas innecesarias, misticismo cliché, palabras sofisticadas, títulos, viñetas, emojis, relleno ni preguntas reflexivas. No repitas la conclusión. Cerrá con una síntesis concreta y directa.

Los prompts aprobados de **Amor y vínculos** quedaron intactos; se eligieron desde el router únicamente cuando `context` es `love`.

## Contexto y restricciones

El frontend almacena `readingContext` en estado. `submitSingleCardReading` y `submitReading` exigen un `context` válido y lo incluyen en el mensaje que llega al modelo. La rama de profundización conserva ese mismo estado junto con `originalQuestion`; la rama de otra pregunta limpia la pregunta nueva y vuelve al selector de contexto.

La protección previa usa reglas semánticas acotadas en `getRestrictedQuestionCategory`. Detecta determinaciones médicas, tratamientos, diagnóstico, recuperación, embarazo y fertilidad; no es un filtro ciego de palabras como «hijos» o «familia». El cliente detiene el flujo antes del selector y el servidor repite la validación para impedir una llamada directa. El mensaje mostrado es exactamente: «Esta pregunta no puedo responderla con una lectura de tarot. Las consultas sobre salud necesitan información fiable, no una interpretación de cartas. Podés hacerme otra pregunta.»

| Consulta | Resultado |
|---|---|
| ¿Estoy embarazada? | Bloqueada antes de las cartas. |
| ¿Voy a quedar embarazada este año? | Bloqueada antes de las cartas. |
| ¿Tengo alguna enfermedad? | Bloqueada antes de las cartas. |
| ¿Voy a recuperarme de esta enfermedad? | Bloqueada antes de las cartas. |
| ¿Qué tratamiento me conviene? | Bloqueada antes de las cartas. |
| ¿Mi embarazo va a salir bien? | Bloqueada antes de las cartas. |
| ¿Tengo problemas de fertilidad? | Bloqueada antes de las cartas. |
| ¿Él quiere tener hijos conmigo? | Permitida; abre el selector porque consulta una intención relacional. |
| ¿Tenemos futuro formando una familia? | Permitida. |
| ¿Cómo ve él la idea de tener hijos? | Permitida. |
| ¿Quiere formar una familia conmigo? | Permitida. |

## Ocho pruebas manuales — Dinero y trabajo

| # | Pregunta | Carta única | Palabras | Tirada profunda | Palabras |
|---|---|---|---:|---|---:|
| 1 | ¿Me conviene aceptar este trabajo? | El Carro, derecha | 41 | Ocho de Oros derecha; Dos de Bastos derecha; La Fuerza derecha | 99 |
| 2 | ¿Voy a mejorar económicamente? | Seis de Oros, derecha | 47 | Rueda de la Fortuna derecha; Diez de Oros derecha; Dos de Oros invertida | 104 |
| 3 | ¿Este proyecto tiene posibilidades? | La Emperatriz, derecha | 42 | As de Bastos derecha; Tres de Oros derecha; Siete de Oros derecha | 96 |
| 4 | ¿Qué está bloqueando mi crecimiento laboral? | Cuatro de Copas, invertida | 43 | Ocho de Espadas derecha; El Colgado invertido; Reina de Oros derecha | 91 |
| 5 | ¿Cómo se ve esta inversión? | La Justicia, derecha | 38 | Dos de Oros derecha; La Luna invertida; Rey de Oros derecha | 85 |
| 6 | ¿Me conviene vender ahora? | El Colgado, invertido | 35 | Siete de Oros invertida; As de Espadas derecha; Caballero de Oros derecha | 74 |
| 7 | ¿Voy a conseguir trabajo pronto? | Sota de Oros, derecha | 43 | Tres de Bastos derecha; El Mago derecha; Cinco de Oros invertida | 98 |
| 8 | ¿Cómo se ve esta sociedad comercial? | Dos de Copas, derecha | 45 | Dos de Copas derecha; Los Enamorados invertidos; La Emperatriz derecha | 119 |

### Resultados de las lecturas

**1. ¿Me conviene aceptar este trabajo?**

> Una carta: «El Carro en posición derecha indica que la propuesta laboral avanza con impulso y dirección clara. El panorama se presenta favorable para tomar decisiones firmes en el ámbito profesional, con una tendencia hacia el crecimiento y el control de nuevos desafíos.»
>
> Tres cartas: «La tendencia se muestra muy favorable para aceptar este empleo, ya que el panorama combina crecimiento, esfuerzo constante y visión a futuro. El Ocho de Oros señala una etapa de dedicación al detalle y aprendizaje práctico que se alinea perfectamente con la energía de expansión y planificación del Dos de Bastos. A su vez, La Fuerza aporta la seguridad y el dominio interno necesarios para afrontar este nuevo desafío con templanza y liderazgo. En conjunto, el sistema refleja un escenario óptimo de consolidación profesional donde la constancia y la confianza personal permitirán consolidar bases firmes y avanzar con éxito.»

**2. ¿Voy a mejorar económicamente?**

> Una carta: «La mejora económica llega a través de un equilibrio entre ingresos y salidas, donde la generosidad y el flujo de recursos se ordenan justamente. El panorama muestra estabilidad mediante colaboraciones o ayuda mutua, sugiriendo que el dinero circula y se recompensa el esfuerzo previo con entradas justas.»
>
> Tres cartas: «La tendencia muestra una mejora económica impulsada por ciclos cambiantes que se estabilizan hacia una ganancia material sólida, aunque requiere atender desequilibrios recientes en la gestión de recursos. La combinación de La Rueda de la Fortuna y el Diez de Oros señala un giro favorable hacia la consolidación financiera y el bienestar familiar o estructural. Sin embargo, el Dos de Oros invertido advierte sobre dificultades para coordinar pagos o mantener el balance diario, reflejando cierta sobrecarga o falta de flexibilidad operativa. El escenario sugiere un crecimiento material genuino, condicionado por la necesidad de ordenar las prioridades financieras inmediatas para sostener el flujo de ingresos.»

**3. ¿Este proyecto tiene posibilidades?**

> Una carta: «La tendencia sugiere una etapa de notable fertilidad y crecimiento económico para este proyecto. El panorama se presenta próspero, con capacidad real de desarrollo, consolidación material y expansión a largo plazo gracias al cuidado constante y a la generación de recursos sólidos.»
>
> Tres cartas: «La tendencia para este proyecto muestra posibilidades muy favorables de crecimiento y consolidación sostenida. El As de Bastos aporta el impulso creativo inicial y la energía de arranque, que se conecta directamente con la colaboración y el trabajo en equipo que señala el Tres de Oros. Esta combinación productiva encuentra su cauce definitivo en el Siete de Oros, cuyo escenario invita a la paciencia y a la evaluación prudente de los frutos a mediano plazo. En conjunto, el panorama integra la chispa de inicio con la construcción metódica y la espera necesaria para ver resultados tangibles.»

**4. ¿Qué está bloqueando mi crecimiento laboral?**

> Una carta: «El Cuatro de Copas invertido señala que la falta de crecimiento laboral surge de rechazar nuevas oportunidades por apatía o desconexión. La tendencia sugiere salir de la pasividad, ya que el panorama se aclara al prestar atención a propuestas que antes se ignoraban.»
>
> Tres cartas: «El bloqueo laboral responde a una sensación de encierro mental combinada con la resistencia a soltar viejas estructuras y una excesiva rigidez material. El Ocho de Espadas marca limitaciones autodefinidas que paralizan la acción, mientras que El Colgado invertido refleja el rechazo a cambiar de perspectiva o a tolerar demoras necesarias. Esta falta de flexibilidad choca con la Reina de Oros, cuyo enfoque práctico queda estancado ante tanta rigidez. La dinámica muestra que la traba principal no proviene del exterior, sino de sostener métodos rígidos que impiden materializar un progreso sostenido.»

**5. ¿Cómo se ve esta inversión?**

> Una carta: «La tendencia muestra un panorama de claridad, orden y contratos regulados bajo normativas justas. El proceso financiero avanza respaldado por documentos formales y una correcta verificación de cuentas, donde cada aspecto legal y numérico se presenta debidamente equilibrado.»
>
> Tres cartas: «La tendencia de la inversión muestra un proceso de reorganización que comienza a despejar dudas financieras latentes. El Dos de Oros señala un manejo constante de recursos frente a oscilaciones, mientras que La Luna invertida ayuda a disipar confusiones y engaños previos en el escenario económico. Esta combinación confluye en la solidez que aporta el Rey de Oros, consolidando una estructura material más firme. El panorama general sugiere el paso de una etapa de adaptación y tanteo hacia una gestión mucho más segura y estable.»

**6. ¿Me conviene vender ahora?**

> Una carta: «El Colgado invertido señala que la tendencia sugiere destrabar situaciones estancadas y finalizar bloqueos. El panorama para la venta muestra menor resistencia y la posibilidad de concretar operaciones que antes no avanzaban, facilitando acuerdos necesarios.»
>
> Tres cartas: «La tendencia muestra que la venta enfrenta dudas y falta de paciencia, aunque surge una claridad mental para definir las condiciones. El Siete de Oros invertido refleja impaciencia frente a los frutos esperados, pero el As de Espadas aporta una decisión firme y el Caballero de Oros consolida un enfoque realista, metódico y seguro. El panorama sugiere que el momento requiere evaluar la operación con frialdad y rigor práctico antes de concretar la transacción.»

**7. ¿Voy a conseguir trabajo pronto?**

> Una carta: «La Sota de Oros al derecho indica que el panorama laboral se presenta favorable para recibir una propuesta concreta o iniciar un proyecto. La tendencia sugiere el ingreso a una nueva etapa de aprendizaje o una oferta inicial que requiere atención y constancia.»
>
> Tres cartas: «La tendencia muestra la llegada de oportunidades laborales concretas tras un período de incertidumbre económica. El Tres de Bastos proyecta horizontes abiertos y expansión profesional, mientras que El Mago aporta los recursos, habilidades y la iniciativa personal necesarias para concretar entrevistas o propuestas. Sin embargo, la presencia del Cinco de Oros invertido indica que la recuperación financiera o la salida de la escasez será paulatina y requerirá paciencia para superar los baches recientes. La combinación señala que el movimiento y la capacidad de acción empiezan a dar frutos, abriendo paso gradualmente a una mejora en la estabilidad laboral.»

**8. ¿Cómo se ve esta sociedad comercial?**

> Una carta: «El Dos de Copas en posición derecha muestra una sociedad comercial basada en la afinidad y el entendimiento mutuo. El panorama se presenta favorable para la colaboración y el acuerdo entre partes, donde la unión de intereses facilita el crecimiento conjunto y la armonía operativa.»
>
> Tres cartas: «La tendencia de esta sociedad comercial muestra una alianza inicial armónica que enfrenta desacuerdos profundos en valores o direcciones, aunque conserva un potencial creativo y de abundancia material. El Dos de Copas marca un acuerdo sincero y una buena química entre las partes. Sin embargo, Los Enamorados invertidos señalan discrepancias latentes en decisiones clave y falta de sintonía en los objetivos compartidos. Por su parte, La Emperatriz en posición derecha aporta estabilidad, recursos y una base fértil para el crecimiento económico. En conjunto, el panorama es complejo: la buena voluntad inicial y la productividad material chocan con una falta de alineación en las elecciones estratégicas, sugiriendo una dinámica donde los resultados prósperos dependen de resolver diferencias fundamentales de criterio.»

## Comprobación de contexto

Las comparaciones de una carta mantuvieron el significado coherente pero cambiaron el enfoque. **Dos de Copas** se interpretó en Amor como conexión, reciprocidad y apertura emocional; en Dinero como colaboración, acuerdos equilibrados e intereses compartidos. **Los Enamorados** se leyó en Amor como valores y decisión afectiva; en Dinero como una encrucijada profesional. **La Emperatriz** distinguió afecto y cuidado en Amor de recursos y crecimiento del proyecto en Dinero. **Seis de Copas** pasó de nostalgia y vínculo en Amor a proyectos previos, entorno conocido y oportunidad laboral en Dinero. Ninguna de las lecturas de Dinero usó un cierre romántico.

## Validación final

| Control | Resultado |
|---|---|
| TypeScript | `pnpm check` correcto. |
| Pruebas | `pnpm test` correcto: 2 archivos y 42/42 pruebas aprobadas. |
| Compilación | `pnpm build` correcto. Vite sólo emitió su advertencia no bloqueante de tamaño de bundle. |
| Desktop y móvil | Selector, copy neutro, restricciones y cambio de contexto comprobados visualmente. |

El Bloque 3 queda finalizado. No se modificaron pagos, audio, pedidos, administración, autenticación, WhatsApp, el catálogo o el motor compartido de cartas.
