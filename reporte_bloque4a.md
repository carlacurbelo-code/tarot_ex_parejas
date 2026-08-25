# Reporte final — Bloque 4A: Tarot de Medianoche

## Resultado

El producto recibió un rediseño visual completo bajo la identidad **Tarot de Medianoche**. La referencia de Konstel se utilizó como sistema de composición y atmósfera, no como copia: se adoptaron profundidad nocturna, tipografía editorial, superficies refinadas, contraste, bordes suaves, ritmo amplio y glow controlado. Se preservó por completo la lógica aprobada de los Bloques 1, 2 y 3.

## Archivos modificados

| Archivo | Cambio realizado |
|---|---|
| `client/src/index.css` | Tokens nocturnos globales, fondos, superficies, glow, acciones y microinteracciones. |
| `client/src/App.tsx` | Activación global del tema oscuro. |
| `client/index.html` | Título de documento: Tarot de Medianoche. |
| `client/src/pages/Home.tsx` | Rediseño de entrada, pregunta, mazo, carga, resultados y acciones. |
| `client/src/components/TarotCardView.tsx` | Nueva superficie de cartas y prop opcional `imageSrc` para el mazo futuro. |
| `client/src/components/SiteFooter.tsx` | Sustitución de la identidad visual del pie. |
| `todo.md` | Seguimiento del bloque completado. |
| `verificacion_bloque4a.md` | Evidencia visual, de flujos y técnica. |

## Sistema visual extraído de la referencia

La captura de Konstel aportó una dirección de **experiencia digital nocturna premium**: fondo violeta profundo, contraste claro, serif editorial grande, sans limpia, superficies con profundidad y botones de presencia táctil. Tarot de Medianoche conserva esa sofisticación mediante una composición centrada, jerarquías amplias y una atmósfera de luz muy contenida.

| Reutilizado conceptualmente | No copiado |
|---|---|
| Fondo nocturno profundo con gradientes lentos. | Textos, estructura funcional y contenido de Konstel. |
| Serif editorial para titulares y sans sobria para interfaz. | Astrología, signos, iconografía zodiacal y narrativa astral. |
| Superficies suaves, bordes sutiles y profundidad visual. | CTA amarillo/dorado pastel. |
| Glow puntual, spacing amplio y composición mobile-first. | Paleta, marca o identidad visual literal de Konstel. |

## Paleta y tokens globales

Los colores se centralizaron en `client/src/index.css`; ningún componente depende de un tono manual del mazo. El token principal que se ajustará al integrar las cartas definitivas es **`--tarot-accent`**.

| Token | Valor exacto | Uso |
|---|---|---|
| `--tarot-void` | `oklch(0.14 0.026 307)` | Fondo base nocturno. |
| `--tarot-night` | `oklch(0.18 0.038 307)` | Gradiente de profundidad. |
| `--tarot-surface` | `oklch(0.23 0.043 309)` | Superficie base. |
| `--tarot-surface-elevated` | `oklch(0.28 0.05 311)` | Superficie elevada y reverso de cartas. |
| `--tarot-ink` | `oklch(0.95 0.015 82)` | Texto principal marfil. |
| `--tarot-ink-muted` | `oklch(0.78 0.026 307)` | Texto secundario lavanda grisáceo. |
| `--tarot-accent` | `oklch(0.72 0.1 347)` | Accent principal malva rosado. |
| `--tarot-accent-hover` | `oklch(0.78 0.11 347)` | Estado luminoso del accent. |
| `--tarot-accent-glow` | `oklch(0.72 0.1 347 / 28%)` | Glow atmosférico controlado. |
| `--tarot-border` | `oklch(0.68 0.052 317 / 34%)` | Bordes malva/lavanda translúcidos. |

El CTA principal utiliza el malva rosado con texto berenjena oscuro mediante `--primary-foreground: var(--tarot-void)`. **No se utilizó amarillo ni dorado pastel como CTA principal.**

## Tipografía, fondos, superficies y botones

Se conservaron las fuentes ya presentes y apropiadas para el sistema: **Cormorant Garamond** para titulares y lectura editorial, e **Inter** para interfaz. El fondo combina gradientes radiales violeta/malva de baja intensidad con una base berenjena, sin competir con el futuro mazo. Las superficies usan gradientes de opacidad sutil, borde translúcido, radio centralizado y sombra profunda; el glow sólo aparece en interacción, selección y CTA.

Los botones primarios usan el token de accent y glow leve. Los secundarios sostienen el mismo sistema mediante una superficie oscura y borde malva, sin perder legibilidad ni visibilidad. La jerarquía entre **«Profundizar esta lectura»** y **«Hacer otra pregunta»** se mantiene explícita.

## Cambios por pantalla

| Pantalla | Rediseño aplicado |
|---|---|
| Entrada | Marca Tarot de Medianoche, superficie editorial y dos puertas de entrada con iconografía mínima: Amor y vínculos / Dinero y trabajo. |
| Pregunta | Copy aprobado sin cambios, textarea oscuro, feedback integrado, CTA malva y tres placeholders sobrios. |
| Selección de una/tres cartas | Mazo dentro de superficie profunda, grid mobile-first de cuatro columnas, feedback de selección, orden y CTA fijo. |
| Loading una carta | Texto literal preservado con loader sobrio, superficie elevada y glow mínimo. |
| Resultado una carta | Carta en tamaño protagonista, interpretación más legible y acciones diferenciadas. |
| Loading tres cartas | Texto literal preservado con el mismo sistema integrado. |
| Resultado tres cartas | Tres cartas separadas, orientación visible e interpretación sistémica de alto contraste. |
| Restricción salud/embarazo/fertilidad | Misma lógica y copy; presentación integrada mediante superficie elevada de alerta. |

## Responsive, microinteracciones y mazo futuro

El diseño se construyó mobile-first. A 390 × 844 px, la entrada mostró áreas táctiles amplias, cards apiladas, títulos legibles y ausencia de overflow horizontal. La cuadrícula usa cuatro columnas en móvil y escala a seis en pantallas mayores; los resultados conservan protagonismo de una o tres cartas sin amontonarlas.

Las microinteracciones se limitan a entrada breve de 320 ms, elevación y glow suave de cards seleccionables, feedback de selección y spinner de carga. No se añadieron partículas, estrellas animadas, esperas artificiales ni efectos de brujería cliché.

`TarotCardView` conserva emoji/placeholders temporales e incorpora la prop opcional `imageSrc`. El siguiente bloque podrá proporcionar un mapping por identificador/nombre y pasar esa URL sin reconstruir el componente ni modificar selección, orientación o el mazo.

> No se generaron, modificaron ni sustituyeron ilustraciones del mazo. Tampoco se integraron las 78 cartas definitivas.

## Verificaciones y validación técnica

Las comprobaciones visuales cubrieron entrada, ambos contextos, pregunta, selector de una carta, selección, loading, resultado, profundización, selector de tres cartas, combinación profunda, invertida, mensaje restringido y la acción **«Hacer otra pregunta»**. Esta última volvió al selector de contexto y conservó su jerarquía secundaria. En la tirada profunda se verificó específicamente **Rey de Oros invertida**, que mantuvo la rotación visual de 180°.

| Validación | Resultado |
|---|---|
| TypeScript | `pnpm check` correcto. |
| Vitest | `pnpm test` correcto: 2 archivos y 42/42 pruebas aprobadas. |
| Build | `pnpm build` correcto. |
| Limitación no bloqueante | Vite reportó una advertencia de bundle superior a 500 kB, existente como advertencia de optimización y sin incidencia en el rediseño. |

## Confirmación de elementos preservados

Permanecieron intactos el motor de tarot, el catálogo de 78 cartas, la selección sin duplicados, el barajado, la probabilidad independiente de 30% de invertidas, su rotación, los prompts de Amor y Dinero, Gemini, modelo, helper, máximo de 50 palabras, la lectura profunda, los contextos Amor/Dinero, la persistencia, las restricciones de Salud/Embarazo/Fertilidad, el funnel, pagos, premium/audio, pedidos, administración y WhatsApp.

No se realizaron cambios colaterales de lógica, monetización, suscripciones, checkout, nuevas categorías o funcionalidades. El Bloque 4A queda cerrado; la incorporación de las ilustraciones definitivas queda reservada para el Bloque 4B.
