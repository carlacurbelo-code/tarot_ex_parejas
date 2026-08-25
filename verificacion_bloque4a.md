# Verificación visual — Bloque 4A

## Entrada de Tarot de Medianoche

La versión de desarrollo muestra la nueva identidad visual: fondo berenjena/violeta profundo con gradientes atmosféricos, texto marfil, acento malva rosado y superficies refinadas. La entrada presenta claramente **Tarot de Medianoche** y las dos únicas puertas aprobadas: **Amor y vínculos** y **Dinero y trabajo**. La versión publicada anterior permanece sin este rediseño hasta el próximo checkpoint, como corresponde.

La comprobación a 390 × 844 px mostró ambas puertas apiladas, con áreas táctiles amplias, título editorial legible y sin overflow horizontal.

## Pregunta

La selección de **Amor y vínculos** abrió la pantalla de pregunta sin alterar el flujo. El título, texto, placeholder, ayuda y llamada a la acción aprobados se conservaron de forma literal dentro de una superficie nocturna con campo de texto oscuro, borde malva y CTA de acento.

## Mazo y selección

El selector abrió el mazo compartido completo y mantuvo la interacción original. Las cartas boca abajo usan una superficie oscura de profundidad controlada; al elegir una carta se reveló con borde/glow malva, orden de selección y el CTA fijo se habilitó. No se modificaron catálogo, barajado ni selección.

## Lectura de una carta

La carga mantuvo literalmente **«Interpretando tu carta…»** y la presentó dentro de una superficie elevada con indicador sobrio. El resultado dejó a la carta como foco principal, elevó la legibilidad de la interpretación y diferenció visualmente **«Profundizar esta lectura»** como acción primaria de **«Hacer otra pregunta»** como acción secundaria, sin agregar contenido ni cambiar su funcionamiento.

## Tirada de tres cartas

La acción de profundizar abrió una nueva cuadrícula independiente con el mismo sistema visual. Se seleccionaron Caballero de Bastos, Cuatro de Bastos y Seis de Bastos, todas derechas en esta prueba; conservaron orden visual y suficiente separación para la combinación profunda.

Luego se realizó una comprobación temporal de orientación: **El Mago derecha**, **Siete de Espadas derecha** y **Rey de Oros invertida**. El Rey de Oros se mantuvo rotado 180° en la cuadrícula, con nombre, orden y estado visibles, confirmando que el rediseño no rompió la representación aprobada de invertidas.

La lectura profunda conservó literalmente **«Interpretando la combinación de tus cartas…»** durante la carga. El resultado mostró las tres cartas como protagonistas, conservó la invertida rotada y presentó la interpretación sistémica en una superficie de alta legibilidad, sin alterar texto generado, prompt ni lógica.

## Consulta restringida

En **Dinero y trabajo**, la pregunta «¿Estoy embarazada?» conservó su bloqueo previo al mazo. El copy y comportamiento aprobados permanecieron intactos; únicamente se integraron en una superficie elevada de alerta dentro del sistema nocturno.

## Nueva pregunta

Se inició nuevamente el flujo con **«¿Cómo se ve este proyecto?»** dentro de Dinero y trabajo. La consulta permitida abrió el mazo compartido con el diseño actualizado para completar la comprobación de la acción secundaria.

Tras recibir la lectura, **«Hacer otra pregunta»** mantuvo su jerarquía visual secundaria y abrió nuevamente la pantalla de selección de contexto con la opción de volver a la lectura. La acción conserva por tanto su comportamiento aprobado y permite escoger Amor y vínculos o Dinero y trabajo antes de continuar.

## Validación técnica

`pnpm check`, `pnpm test` y `pnpm build` finalizaron correctamente. La suite aprobó **42/42** pruebas. Vite emitió solamente una advertencia no bloqueante por el tamaño de un bundle, sin relación con el rediseño.

## Corrección puntual de jerarquía

En móvil, la entrada conserva su marco, tipografía, fondos y cards aprobados. Se retiraron exclusivamente las etiquetas «VÍNCULOS» y «PROYECTOS», así como la frase «Una lectura clara para mirar lo que está en movimiento.». El espacio resultante se redistribuyó entre el título y las dos opciones, sin huecos artificiales.

La revisión del resultado de una carta usó **Siete de Espadas invertida**. La carta quedó más cerca del título, ligeramente mayor y como foco visual principal; el CTA quedó integrado en malva viejo con glow reducido. La interpretación se mostró en una superficie más transparente, con borde y sombra discretos, texto de menor tamaño e interlineado más compacto.

La revisión del resultado profundo usó **Nueve de Oros derecha**, **Sota de Bastos derecha** y **Cinco de Espadas invertida**. Las tres cartas mantuvieron separación, la invertida conservó su rotación y el mismo contenedor de lectura más ligero se aplicó sin introducir un CTA nuevo.
