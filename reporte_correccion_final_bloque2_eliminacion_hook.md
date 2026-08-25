# Reporte final — corrección del Bloque 2

## Alcance cumplido

Se eliminó por completo el campo `deepening_hook` del flujo activo de lectura gratuita de una carta. La aplicación conserva el recorrido aprobado: pregunta libre, selección de una carta, lectura de IA de hasta 50 palabras y dos acciones directas: **«Profundizar esta lectura»** y **«Hacer otra pregunta»**.

| Área | Resultado verificado |
|---|---|
| Prompt de una carta | Ya no solicita ni menciona el campo eliminado. |
| Formato estructurado LLM | El esquema estricto declara y requiere únicamente `reading`. |
| Parser y respuesta tRPC | El parser acepta exclusivamente el objeto `{ reading }`, rechaza propiedades adicionales y la respuesta pública no contiene ningún campo accesorio. |
| Interfaz y estado | Se retiraron el estado, setters, prop y recuadro asociados; permanecen solamente las dos acciones aprobadas. |
| Pruebas | Se adaptó el contrato de una carta y se mantuvieron las pruebas de límite, mensajes de carga e independencia de tiradas. |

No se añadió una llamada adicional al modelo para reemplazar el campo eliminado. La lectura de una carta mantiene una única llamada estructurada y retorna sólo el texto `reading`.

## Verificación de los recorridos

La lectura gratuita real mostró sólo su lectura y las dos acciones aprobadas, sin texto intermedio. La respuesta tRPC observada para la carta única contenía `card` y `reading`, sin un campo de continuación.

| Ruta | Pregunta enviada a `tarot.submitReading` | Cartas nuevas enviadas | Resultado |
|---|---|---|---|
| A: Profundizar esta lectura | Conservó la pregunta original: «¿Qué está frenando la comunicación?» | La Templanza invertida, El Carro derecha y La Emperatriz invertida | Tirada independiente y lectura profunda correcta. |
| B: Hacer otra pregunta | El valor ingresado en el campo libre fue «¿Qué está frenando la comunicación?». Se resolvió como `deepQuestion`; la prueba automatizada confirma que procede de `newQuestion`, no de `originalQuestion`. | Cuatro de Oros derecha, Sota de Copas invertida y Caballero de Bastos derecha | Tirada independiente y lectura profunda correcta. |

La resolución de ambas ramas se valida además de forma automática: la rama A usa `originalQuestion`; la B usa `newQuestion`. Ambas envían al procedimiento profundo exclusivamente una pregunta y exactamente tres cartas nuevas con sus orientaciones.

## Controles preservados

Se conservaron literalmente los mensajes de carga: **«Interpretando tu carta…»** para una carta y **«Interpretando la combinación de tus cartas…»** para tres. No se alteraron el prompt aprobado de tres cartas, el mazo de 78, el barajado, la probabilidad del 30% de invertidas, su rotación visual, el proveedor o helper de IA, ni los flujos comerciales y administrativos excluidos.

## Validación técnica final

| Control | Resultado |
|---|---|
| `pnpm check` | Correcto; TypeScript sin errores. |
| `pnpm test` | Correcto; 2 archivos y **34/34** pruebas aprobadas. |
| `pnpm build` | Correcto; compilación de cliente y servidor finalizada. |
| Búsqueda de referencias activas | Cero coincidencias de `deepening_hook` o `deepeningHook` en `server`, `client` y `shared` (TS/TSX). |

La advertencia de tamaño de bundle emitida por Vite no bloqueó la compilación y no está relacionada con esta corrección. El detalle de la comprobación manual se conserva en `verificacion_eliminacion_hook.md`.
