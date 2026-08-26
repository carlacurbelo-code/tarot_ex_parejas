# Manifiesto de producción — Mazo ilustrado Tarot de Medianoche

## Catálogo de origen

El catálogo funcional se mantiene en `shared/tarot.ts` y contiene exactamente **78 identificadores estables**: 22 Arcanos Mayores y 56 Arcanos Menores. Los títulos visibles proceden del mismo catálogo, están en español y constituyen la fuente de verdad para la integración. Las ilustraciones no alterarán el `id`, el nombre, el emoji de reserva, el azar, la orientación ni el flujo de selección.

## Convención de producción

Cada carta tendrá una sola imagen vertical de **1080 × 1920 píxeles** y una clave basada en el identificador del catálogo. La misma ilustración se reutilizará para las cartas invertidas: la interfaz aplica `rotate-180` sin animación sólo cuando la carta está revelada e invertida.

| Grupo | Cantidad | Identificadores |
|---|---:|---|
| Arcanos Mayores | 22 | `fool` a `world` según `TAROT_DECK`. |
| Copas | 14 | `ace_cups` a `king_cups`. |
| Bastos | 14 | `ace_wands` a `king_wands`. |
| Espadas | 14 | `ace_swords` a `king_swords`. |
| Oros | 14 | `ace_pentacles` a `king_pentacles`. |

## Activos ya aprobados

| Identificador | Título | Activo persistente |
|---|---|---|
| `sun` | El Sol | `/manus-storage/tarot-piloto-el-sol_ea74ec76.png` |
| `tower` | La Torre | `/manus-storage/tarot-piloto-la-torre_8bef6eb9.png` |
| `two_cups` | Dos de Copas | `/manus-storage/tarot-piloto-dos-de-copas_41ed9979.png` |
| `three_swords` | Tres de Espadas | `/manus-storage/tarot-piloto-tres-de-espadas_26ecc79c.png` |
| `queen_pentacles` | Reina de Oros | `/manus-storage/tarot-piloto-reina-de-oros_17c92cae.png` |

## Regla de integración

Una vez generados y validados los activos restantes, un único mapa tipado `id → URL` proveerá `imageSrc` a `TarotCardView`. Si un activo faltara, el componente conserva temporalmente el emoji y el nombre actuales; la funcionalidad de lectura no depende de que la imagen esté cargada.

## Inventario visual completo

La siguiente tabla cubre las 78 entradas de `TAROT_DECK`. Los anclajes no son instrucciones para copiar una lámina histórica: son los símbolos mínimos que cada reinterpretación debe conservar dentro de la dirección de arte aprobada.

| ID | Título español | Anclajes simbólicos o escena esenciales |
|---|---|---|
| `fool` | El Loco | Viajero al borde de un precipicio, rosa blanca, perro y pequeño equipaje. |
| `magician` | El Mago | Figura ante mesa con copa, espada, basto y oro; vara elevada e infinito. |
| `high_priestess` | La Sacerdotisa | Figura entre dos columnas, velo lunar o granada, pergamino y luna creciente. |
| `empress` | La Emperatriz | Soberana en jardín fértil, corona de estrellas, trigo y símbolo de Venus. |
| `emperor` | El Emperador | Regente sentado en trono, carneros, cetro y paisaje de montaña. |
| `hierophant` | El Hierofante | Guía ceremonial, dos acólitos, llaves cruzadas y gesto de bendición. |
| `lovers` | Los Enamorados | Dos personas adultas, ángel, árbol/fruto y montaña o sol de vínculo. |
| `chariot` | El Carro | Conductor, carro, dos esfinges o caballos contrastantes y ciudad al fondo. |
| `strength` | La Fuerza | Figura serena con león, infinito y gesto de contención amable. |
| `hermit` | El Ermitaño | Figura con capa, farol de seis puntas, bastón y cumbre nevada. |
| `wheel_of_fortune` | La Rueda de la Fortuna | Rueda central, criaturas aladas o esfinge, letras/símbolos y nubes. |
| `justice` | La Justicia | Figura frontal, balanza, espada vertical y dos pilares. |
| `hanged_man` | El Colgado | Figura suspendida por un pie en árbol o estructura viva, halo y serenidad. |
| `death` | La Muerte | Jinete o figura transformadora, estandarte floral, amanecer y río. |
| `temperance` | La Templanza | Ángel mezclando agua entre dos copas, iris, camino y sol distante. |
| `devil` | El Diablo | Figura central simbólica, dos adultos con cadenas sueltas y pedestal. |
| `tower` | La Torre | Torre, rayo, corona desprendida y dos figuras en caída simbólica. |
| `star` | La Estrella | Figura junto a agua, dos recipientes, estrella principal y siete menores. |
| `moon` | La Luna | Luna con rostro, dos torres, perro/lobo, cangrejo y camino de agua. |
| `sun` | El Sol | Sol con rostro, figura alegre, caballo blanco, girasoles y muro. |
| `judgement` | El Juicio | Ángel con trompeta, personas que se elevan y paisaje acuático o montañoso. |
| `world` | El Mundo | Figura danzante en corona vegetal y cuatro criaturas en las esquinas. |
| `ace_cups` | As de Copas | Una copa principal, agua desbordante, paloma o mano entre nubes. |
| `two_cups` | Dos de Copas | Dos adultos equilibrados, dos copas, caduceo y cabeza de león. |
| `three_cups` | Tres de Copas | Tres figuras adultas celebrando con exactamente tres copas y vegetación. |
| `four_cups` | Cuatro de Copas | Figura contemplativa, tres copas en tierra y una copa ofrecida desde nube. |
| `five_cups` | Cinco de Copas | Figura con capa, tres copas derramadas y dos copas en pie junto a río. |
| `six_cups` | Seis de Copas | Seis copas con flores, dos figuras y escena de memoria o jardín. |
| `seven_cups` | Siete de Copas | Figura ante nube con exactamente siete copas y visiones simbólicas. |
| `eight_cups` | Ocho de Copas | Viajero que se aleja, ocho copas, luna y camino montañoso. |
| `nine_cups` | Nueve de Copas | Figura satisfecha ante arco o mesa con exactamente nueve copas. |
| `ten_cups` | Diez de Copas | Dos adultos, arco iris con diez copas, niños y casa o paisaje. |
| `page_cups` | Sota de Copas | Joven adulto/a con copa y pez simbólico, orilla de mar. |
| `knight_cups` | Caballero de Copas | Jinete pausado con copa, caballo claro, río y armadura suave. |
| `queen_cups` | Reina de Copas | Reina junto al mar, copa ornamentada, trono y agua. |
| `king_cups` | Rey de Copas | Rey sobre trono junto al mar, copa, cetro, pez o nave de fondo. |
| `ace_wands` | As de Bastos | Mano entre nubes sosteniendo un basto floreciente. |
| `two_wands` | Dos de Bastos | Figura en altura, dos bastos, globo o esfera y paisaje distante. |
| `three_wands` | Tres de Bastos | Figura mirando horizonte o mar, exactamente tres bastos y naves. |
| `four_wands` | Cuatro de Bastos | Cuatro bastos con guirnalda, dos figuras y celebración a distancia. |
| `five_wands` | Cinco de Bastos | Cinco figuras adultas en competencia lúdica con cinco bastos. |
| `six_wands` | Seis de Bastos | Figura reconocida sobre caballo, corona de laurel y seis bastos. |
| `seven_wands` | Siete de Bastos | Figura en altura defendiendo su posición con un basto ante seis. |
| `eight_wands` | Ocho de Bastos | Exactamente ocho bastos cruzando un cielo o valle en movimiento. |
| `nine_wands` | Nueve de Bastos | Figura vigilante vendada, un basto en mano y ocho bastos detrás. |
| `ten_wands` | Diez de Bastos | Figura llevando exactamente diez bastos hacia una aldea o puerta. |
| `page_wands` | Sota de Bastos | Joven adulto/a con basto floreciente en paisaje cálido y abierto. |
| `knight_wands` | Caballero de Bastos | Jinete en movimiento, basto floreciente y desierto o paisaje solar. |
| `queen_wands` | Reina de Bastos | Reina con basto, girasol y gato como símbolo de apoyo. |
| `king_wands` | Rey de Bastos | Rey con basto, trono de salamandras y manto cálido pastel. |
| `ace_swords` | As de Espadas | Espada vertical en mano entre nubes, corona y rama. |
| `two_swords` | Dos de Espadas | Figura con ojos cubiertos, dos espadas cruzadas y luna sobre agua. |
| `three_swords` | Tres de Espadas | Corazón central atravesado por exactamente tres espadas y lluvia. |
| `four_swords` | Cuatro de Espadas | Figura en descanso, tres espadas arriba y una lateral en santuario. |
| `five_swords` | Cinco de Espadas | Figura con espadas recogidas, dos figuras alejándose y costa. |
| `six_swords` | Seis de Espadas | Barca con pasajeras/os, remero y exactamente seis espadas. |
| `seven_swords` | Siete de Espadas | Figura alejándose con cinco espadas; dos espadas permanecen al fondo. |
| `eight_swords` | Ocho de Espadas | Figura con venda, ocho espadas alrededor, agua y castillo distante. |
| `nine_swords` | Nueve de Espadas | Figura sentada en cama, nueve espadas en pared y manta simbólica. |
| `ten_swords` | Diez de Espadas | Figura en tierra con diez espadas y amanecer tenue, sin gore. |
| `page_swords` | Sota de Espadas | Joven adulto/a con espada, viento, nubes y paisaje abierto. |
| `knight_swords` | Caballero de Espadas | Jinete rápido, espada elevada, viento y nubes dinámicas. |
| `queen_swords` | Reina de Espadas | Reina con espada vertical, mano extendida y cielo claro. |
| `king_swords` | Rey de Espadas | Rey frontal con espada y mariposas o nubes como apoyo. |
| `ace_pentacles` | As de Oros | Mano entre nubes sosteniendo un pentáculo, jardín y arco. |
| `two_pentacles` | Dos de Oros | Figura danzante con dos pentáculos unidos por infinito y barcos. |
| `three_pentacles` | Tres de Oros | Artesana/o, arco arquitectónico y exactamente tres pentáculos. |
| `four_pentacles` | Cuatro de Oros | Figura que protege cuatro pentáculos: cabeza, brazos y pies. |
| `five_pentacles` | Cinco de Oros | Dos figuras en tránsito ante vidriera con exactamente cinco pentáculos. |
| `six_pentacles` | Seis de Oros | Figura distribuyendo seis pentáculos con balanza y dos receptoras/es. |
| `seven_pentacles` | Siete de Oros | Figura descansando junto a cultivo con exactamente siete pentáculos. |
| `eight_pentacles` | Ocho de Oros | Artesana/o trabajando y exactamente ocho pentáculos expuestos. |
| `nine_pentacles` | Nueve de Oros | Figura elegante en viñedo, halcón y exactamente nueve pentáculos. |
| `ten_pentacles` | Diez de Oros | Grupo familiar adulto, perro, arco y exactamente diez pentáculos. |
| `page_pentacles` | Sota de Oros | Joven adulto/a contemplando un pentáculo en paisaje verde. |
| `knight_pentacles` | Caballero de Oros | Jinete quieto, pentáculo en mano y campo cultivado. |
| `queen_pentacles` | Reina de Oros | Reina adulta, pentáculo, jardín florecido y conejo. |
| `king_pentacles` | Rey de Oros | Rey con pentáculo, trono vegetal, vid y símbolos de abundancia. |
