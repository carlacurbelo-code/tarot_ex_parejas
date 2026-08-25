# Project TODO - Tarot para Ex Parejas

## Setup & Diseño Base
- [x] Configurar paleta de colores (tonos tierra + azules suaves) en index.css
- [x] Configurar tipografía elegante (Google Fonts: Cormorant Garamond + Inter)
- [x] Configurar tema base íntimo/cálido en App.tsx

## Base de Datos
- [x] Schema: tabla `orders` (cliente, situación, cartas, lectura IA, estado, audioKey, paypal info)
- [x] Schema: tabla `settings` (precio configurable, link PayPal)
- [x] Push migrations

## Backend (tRPC + APIs)
- [x] Router `tarot.getDeck` - mazo de cartas
- [x] Router `tarot.submitReading` - lectura IA gratuita con LLM (cierre abierto)
- [x] Router `tarot.getReading` - acceso público por token
- [x] Router `tarot.savePremiumQuestion` - pregunta para audio premium
- [x] Router `tarot.confirmPayment` - confirmar pago PayPal y notificar dueña
- [x] Router `tarot.getPremiumPrice` - precio público actual
- [x] Router `admin.listOrders` - admin ve todos los pedidos (protegido)
- [x] Router `admin.uploadAudio` - admin sube MP3 (storagePut)
- [x] Router `admin.markCompleted` - admin marca pedido como completo
- [x] Router `admin.getSettings` / `admin.updateSettings` - precio + paypal link configurables
- [x] Tests vitest (14 tests pasando)

## Frontend
- [x] Landing Page mobile-first con headline emocional íntimo
- [x] Formulario: situación con ex pareja
- [x] Selección visual de 3 cartas de tarot
- [x] Pantalla de lectura IA (tono íntimo, cierre abierto)
- [x] Sección upsell post-lectura con botón PayPal
- [x] Pantalla de confirmación de pago manual
- [x] Página del cliente para acceder a su audio (con token)

## Panel Admin
- [x] Login admin con Manus OAuth + role admin
- [x] Lista de pedidos segmentada (para entregar / esperando pago / completados)
- [x] Botón subir MP3 por pedido (auto-marca como completado)
- [x] Botón marcar como completado manualmente
- [x] Configuración de precio premium y enlace PayPal.me
- [x] Copiar enlace de la cliente (acceso al pedido)

## Notificaciones
- [x] notifyOwner automática cuando se confirma pago

## Testing & Delivery
- [x] Tests TypeScript pasando (no errors)
- [x] Tests vitest pasando (14/14)
- [x] Mobile-first verificado
- [x] Checkpoint final

## Incidencia reportada
- [x] Diagnosticar por qué la vista pública no carga en la URL compartida
- [x] Corregir el fallo de servidor, compilación o ruta si existe (no fue necesario: el enlace anterior había expirado)
- [x] Verificar la URL vigente en escritorio y móvil antes de entregar
- [x] Verificar la URL vigente en viewport móvil y documentar la carga correcta

## Bloque 1: motor de cartas e interpretación
- [x] Inspeccionar si la implementación actual utiliza cartas invertidas
- [x] Convertir el mazo a exactamente 78 cartas únicas y seleccionables
- [x] No incorporar significados manuales; la interpretación amorosa queda a cargo del LLM según la especificación vigente
- [x] Mantener la pregunta libre, la selección de tres cartas y la lectura integrada
- [x] Incorporar cartas invertidas según la especificación vigente, sin ampliar el alcance
- [x] No modificar branding, diseño general, audio, PayPal, panel admin, pedidos, precios, suscripciones, autenticación, historial, WhatsApp ni estructura premium
- [x] Añadir y ejecutar tests del mazo completo y verificar TypeScript
- [x] Entregar únicamente el reporte del Bloque 1 y detenerse

## Bloque 1 actualizado: 78 cartas, derechas e invertidas e interpretación IA
- [x] Tratar el nuevo prompt como referencia vigente del Bloque 1
- [x] Incorporar orientación derecha/invertida con 30% de probabilidad por carta
- [x] No crear ni almacenar significados manuales para 156 combinaciones
- [x] Enviar a la IA únicamente pregunta, nombres, orientaciones, posiciones si ya existen e instrucciones del lector
- [x] Mantener el funnel actual pregunta libre → 3 cartas → lectura IA
- [x] Mantener sin cambios funnel, monetización, premium/audio, pagos, panel admin, branding, estética y funcionalidades ajenas
- [x] Ejecutar cinco pruebas manuales de calidad de interpretación solicitadas
- [x] Incluir el system prompt completo y el modelo usado en el reporte final

## Especificación vigente confirmada: Bloque 1 final
- [x] Usar exclusivamente el nuevo prompt como fuente de verdad para este bloque
- [x] Recuperar pregunta libre en la ruta `/` y enviarla al LLM
- [x] Unificar `/` y los flujos existentes sin refactorización riesgosa; comparten catálogo, formato y orientación
- [x] Incorporar placeholders sin buscar, descargar, diseñar ni generar imágenes nuevas
- [x] Representar cada carta con una única identidad y orientación independiente
- [x] Mantener el modelo/proveedor/helper de IA actuales
- [x] Verificar que CARD_TEXTS/meaning no se envíen al nuevo flujo IA de `/`
- [x] Reportar literalmente el system prompt, datos enviados, pruebas manuales y modelo disponible

## Ajuste puntual Bloque 1 — tono y extensión
- [x] Modificar únicamente `SYSTEM_PROMPT`.
- [x] Establecer 120–160 palabras, respuesta directa desde la primera frase y estructura breve.
- [x] Eliminar claridad parcial, pregunta reflexiva obligatoria y espera deliberada.
- [x] Ejecutar las mismas cinco preguntas, contar palabras y actualizar el reporte.
- [x] Confirmar que ninguna otra funcionalidad fue modificada y detenerse.

## Corrección Bloque 1 — auditoría del selector y voz conversacional
- [x] Auditar recorrido real de 78 cartas en `/` hasta UI y LLM.
- [x] Ejecutar 20 tiradas reales con el selector de `/` y reportar las 60 cartas.
- [x] Corregir selector únicamente si se detecta un error real; no se detectó error.
- [x] Modificar únicamente `SYSTEM_PROMPT` a voz conversacional de 80–120 palabras.
- [x] Ejecutar cinco lecturas nuevas, contar palabras, correr TypeScript y tests.
- [x] Confirmar que no cambió ninguna otra funcionalidad y detenerse.

## Reapertura Bloque 1 — auditoría real de la ruta `/`
- [x] Auditar en navegador la cadena completa de cartas: catálogo, estado de Home, UI, backend y LLM.
- [x] Realizar y registrar 15 tiradas completas desde la interacción real de `/`.
- [x] Forzar temporalmente una tirada con al menos una carta invertida y comprobar giro visual, nombre, orientación y envío al LLM.
- [x] Corregir solo el fallo confirmado de selección o representación de cartas, si existe, y restaurar el 30% aleatorio normal.
- [x] Ejecutar TypeScript y Vitest, documentar hallazgos y detenerse sin avanzar de bloque.

## Bloque 2 — tirada gratuita de 1 carta y lectura profunda de 3 cartas
- [x] Auditar contratos, componentes y pruebas existentes sin modificar las bases aprobadas del Bloque 1.
- [x] Agregar un prompt independiente y respuesta estructurada `reading + deepening_hook` para una carta en una única llamada al LLM.
- [x] Crear el procedimiento de una carta que reciba pregunta, carta y orientación, sin modificar el procedimiento profundo de tres cartas.
- [x] Adaptar Home a pregunta → una carta → lectura y hook → profundizar u otra pregunta → nueva tirada independiente de tres cartas.
- [x] Conservar correctamente `originalQuestion`, `newQuestion` y `deepQuestion` según la opción elegida.
- [x] Mantener el mazo de 78, el barajado, el 30% de invertidas, la rotación física y el prompt aprobado de tres cartas.
- [x] Agregar pruebas automáticas de contrato, preguntas, independencia de tiradas y ausencia de arrastre de contexto.
- [x] Ejecutar cinco pruebas manuales de una carta y tres flujos completos en la interfaz.
- [x] Ejecutar TypeScript, build y Vitest; documentar resultados, límites y no cambios de pago o diseño; detenerse.

## Corrección puntual Bloque 2 — síntesis, hook y loading
- [x] Instruir `reading` ideal de 35–50 palabras, impedir que supere el máximo absoluto de 50 y no forzar relleno artificial.
- [x] Instruir un `deepening_hook` concreto de hasta 25 palabras sin forzar relleno artificial, según pregunta, carta, orientación y lectura.
- [x] Diferenciar los mensajes de carga de una carta y tres cartas sin modificar ninguna otra funcionalidad.
- [x] Ejecutar y registrar cinco pruebas reales de una carta con lectura, conteo y hook.
- [x] Verificar visualmente ambos mensajes de carga y ejecutar TypeScript y Vitest antes de detenerse.

## Corrección final Bloque 2 — eliminar deepening_hook
- [x] Localizar todas las referencias de `deepening_hook` en prompt, contrato, backend, frontend, estado y pruebas.
- [x] Eliminar `deepening_hook` por completo del prompt, esquema JSON, parser y respuesta de una carta sin llamada LLM adicional.
- [x] Eliminar estado, recuadro y lógica de interfaz asociada, manteniendo las acciones de profundizar y nueva pregunta.
- [x] Actualizar pruebas y verificar que ambas ramas generan una tirada profunda independiente con la pregunta correcta.
- [x] Ejecutar TypeScript, build y Vitest; documentar la eliminación completa y detenerse.

## Ajuste puntual de interfaz — eliminar texto superior
- [x] Eliminar únicamente el texto «Lecturas íntimas» de la parte superior de la pantalla pública, sin sustituirlo ni alterar el resto del encabezado, branding o diseño.

## Bloque 3 — Amor y vínculos + Dinero y trabajo
- [x] Confirmar el tramo final de la especificación adjunta sobre salud, embarazo/fertilidad, pruebas y reporte.
- [x] Incorporar selección mínima de contexto antes de la pregunta y conservarlo durante cada consulta.
- [x] Reemplazar el copy heredado de ex parejas por el copy neutro indicado.
- [x] Mantener prompts separados para Amor y vínculos y crear prompts especializados para Dinero y trabajo.
- [x] Aplicar las restricciones globales antes de consumir una tirada.
- [x] Permitir cambio de contexto al hacer otra pregunta y conservarlo al profundizar.
- [x] Proteger preguntas de salud y embarazo/fertilidad sin bloquear consultas relacionales permitidas sobre hijos o familia.
- [x] Añadir pruebas de contextos, persistencia, catálogo compartido, invertidas y consultas restringidas/permitidas.
- [x] Ejecutar las ocho pruebas manuales de Dinero y trabajo y las comprobaciones de contexto solicitadas.
- [x] Verificar visualmente el copy neutro y la ausencia de referencias heredadas a ex parejas.
- [x] Ejecutar TypeScript, Vitest y build; documentar el Bloque 3 y detenerse.

## Bloque 4A — rediseño visual Tarot de Medianoche
- [x] Confirmar la continuación de la especificación: tirada de tres cartas, restricciones, validación móvil, pruebas y reporte.
- [x] Definir tokens globales nocturnos, tipografía editorial y acento malva rosado para Tarot de Medianoche.
- [x] Reemplazar la identidad visual principal por «Tarot de Medianoche» sin alterar la lógica de los Bloques 1, 2 y 3.
- [x] Rediseñar el selector de contextos, pantalla de pregunta y mazo compartido con diseño mobile-first.
- [x] Rediseñar carga, resultado y acciones de una y tres cartas, preservando copy y comportamiento aprobado.
- [x] Preparar visualmente el componente de carta para imágenes futuras por identificador, sin generar ni modificar el mazo.
- [x] Verificar las 15 comprobaciones móviles solicitadas, las invertidas y los flujos conservados.
- [x] Ejecutar TypeScript, Vitest y build; documentar todos los puntos obligatorios y detenerse.

## Corrección puntual — Bloque 4A
- [x] Eliminar únicamente «VÍNCULOS», «PROYECTOS» y la frase descriptiva de la pantalla inicial, reequilibrando el espacio.
- [x] Desaturar mediante tokens el accent aplicado a superficies grandes y CTA, sin cambiar el sistema visual general.
- [x] Refinar jerarquía del resultado: carta, separación, contenedor de lectura, tamaño/interlineado y acciones.
- [x] Revisar la coherencia de una y tres cartas en móvil; ejecutar TypeScript, Vitest y build; documentar y detenerse.

## Auditoría de portabilidad — sin migración
- [x] Verificar el control del repositorio GitHub, dominio y servicios externos declarados.
- [x] Inventariar secretos, variables de entorno, migraciones, callbacks y dependencias de infraestructura.
- [x] Identificar dependencias propietarias de Manus y definir reemplazos compatibles con Node/Express.
- [x] Documentar despliegue portable, plan de salida, riesgos y pasos sin ejecutar una migración.
- [x] Validar la documentación, guardar el resultado de la auditoría y entregarlo.

## Ajuste puntual — estética de cartas pastel editorial
- [x] Revisar el componente de carta y los tokens que lo afectan sin alterar datos, selección ni orientación.
- [x] Aplicar únicamente a las cartas una superficie pastel lavanda/menta, marco doble, iluminación suave y tipografía editorial inspiradas en la referencia.
- [x] Verificar en móvil y escritorio las cartas derecha/invertida, selección y presentación de una/tres cartas; ejecutar validaciones y documentar.

## Corrección puntual — giro de cartas invertidas en resultado
- [x] Localizar por qué una carta invertida no rota en el estado «Ver mi lectura».
- [x] Corregir únicamente la prop o representación visual del resultado, sin alterar selección, orientación ni flujo.
- [x] Verificar selector y resultado de una/tres cartas con invertidas; ejecutar validaciones y documentar.

## Lote piloto — ilustraciones del mazo Tarot de Medianoche
- [x] Consolidar el sistema visual pastel editorial de las referencias como guía fija del mazo.
- [x] Retirar la transición de rotación de las cartas invertidas sin quitar su orientación visual de 180°.
- [x] Generar el lote piloto: El Sol, La Torre, Dos de Copas, Tres de Espadas y Reina de Oros.
- [x] Verificar que las cinco ilustraciones mantienen proporción, títulos en español, símbolos esenciales y coherencia visual.
- [ ] Presentar el lote piloto para aprobación antes de producir las 78 cartas e integrarlas en la aplicación.
