# Reporte final — Corrección puntual del Bloque 4A

## Alcance realizado

Se aplicaron exclusivamente los ajustes visuales solicitados. La dirección nocturna, composición, marco, tipografías, cards, iconografía, bordes, glow y relación visual aprobada de la entrada permanecen intactos. No se rehízo el rediseño, no se incorporó el mazo definitivo y no se modificó ninguna funcionalidad.

| Archivo modificado | Ajuste exclusivamente visual |
|---|---|
| `client/src/index.css` | Token de accent para CTA, glow, color de texto de CTA y nueva superficie integrada de interpretación. |
| `client/src/pages/Home.tsx` | Limpieza de copy inicial y ajustes de jerarquía, espacios, contenedor y tipografía de resultados. |
| `client/src/components/TarotCardView.tsx` | Tamaño visual `lg` de la carta; sin cambios de selección, orientación, contenido ni lógica. |
| `todo.md` | Seguimiento de la corrección completado. |
| `verificacion_bloque4a.md` | Evidencia visual y técnica de la corrección. |

## Textos eliminados de la pantalla inicial

Se eliminaron únicamente los siguientes textos, sin reemplazarlos: **«VÍNCULOS»**, **«PROYECTOS»** y **«Una lectura clara para mirar lo que está en movimiento.»**. La entrada conserva ahora la secuencia limpia: marca, «Elegí el tema de tu consulta» y las dos opciones.

## Token de CTA y superficies grandes

| Token | Valor anterior | Valor nuevo | Efecto |
|---|---|---|---|
| `--tarot-accent` | `oklch(0.72 0.1 347)` | `oklch(0.58 0.06 335)` | Malva viejo más profundo, menos luminoso y menos saturado. |
| `--tarot-accent-hover` | `oklch(0.78 0.11 347)` | `oklch(0.64 0.07 335)` | Estado activo integrado en el universo berenjena. |
| `--tarot-accent-glow` | `oklch(0.72 0.1 347 / 28%)` | `oklch(0.58 0.06 335 / 16%)` | Glow mucho más discreto. |
| Sombra de `.tarot-primary-action` | `0 12px 30px` | `0 10px 24px` | Menor presencia del CTA sin perder accionabilidad. |

El CTA **«Profundizar esta lectura»** sigue siendo la acción principal, pero ya no compite con la carta. El texto del CTA usa marfil (`--tarot-ink`) para mantener contraste suficiente sobre el malva desaturado.

## Carta, interpretación y jerarquía

| Elemento | Antes | Después |
|---|---|---|
| Carta protagonista | `h-56 w-36` (224 × 144 px) | `h-60 w-[9.5rem]` (240 × 152 px). |
| Separación título → carta | `mt-9` (36 px) | `mt-5` (20 px). |
| Título de resultado | `text-4xl` / `sm:text-5xl` | `text-3xl` / `sm:text-4xl`, para no competir con la carta. |
| Separación carta → interpretación | `mt-10` (40 px) | `mt-7` (28 px). |
| Contenedor de interpretación | `.tarot-surface`, opacidad 88–92%, borde estándar, sombra 22 × 60, blur 16 | `.tarot-reading-surface`, opacidad 68–72%, borde al 20%, sombra 14 × 36 y blur 12. |
| Padding del contenedor | `p-6`, `sm:p-9` | `p-5`, `sm:p-7`. |
| Altura mínima | `min-h-44` (176 px) | Eliminada. |
| Tipografía de la lectura | 18 px / line-height 1.8; 20 px en escritorio | 16 px / line-height 1.65; 18 px en escritorio. |

La jerarquía final es: **carta**, interpretación, CTA principal y CTA secundario. «Hacer otra pregunta» permanece claramente secundario y visible, sin corte en la composición móvil.

## Verificación de resultados

La revisión de una carta se efectuó con **Siete de Espadas invertida**. Confirmó la carta como foco visual, menor espacio muerto, texto más compacto, caja integrada y CTA malva desaturado. La revisión profunda se efectuó con **Nueve de Oros derecha**, **Sota de Bastos derecha** y **Cinco de Espadas invertida**. Confirmó que la misma reducción de peso visual funciona con tres cartas y que la invertida sigue rotando 180°.

## Validación técnica

| Control | Resultado |
|---|---|
| TypeScript | `pnpm check` correcto. |
| Tests existentes | `pnpm test` correcto: 2 archivos y **42/42** pruebas aprobadas. |
| Build | `pnpm build` correcto. Vite emitió sólo la advertencia no bloqueante de tamaño de bundle. |

Se confirma expresamente que **no se modificó ninguna funcionalidad**: mazo de 78, selección, barajado, 30% de invertidas, rotación, Gemini, prompts, contextos, restricciones, lecturas, acciones, funnel, monetización, PayPal, audio, administración y WhatsApp permanecen sin cambios. No se avanzó al Bloque 4B ni se integró el mazo definitivo.
