# Ajuste puntual — estética de cartas

Se modificó exclusivamente `client/src/components/TarotCardView.tsx`. Las cartas ahora usan una superficie editorial pastel lavanda, rosa y menta, con borde de mayor presencia, marco triple en el reverso, iluminación suave, sombra contenida y tipografía ciruela para nombres y símbolos. La combinación toma la suavidad luminosa, los bordes finos y la composición de carta ilustrada de la referencia, sin copiarla ni alterar el sistema nocturno de la aplicación.

No se añadieron imágenes, se generaron activos ni se modificaron el mazo, el contenido, el tamaño, los datos de cartas, la selección, los estados, el 30% de invertidas o la rotación de 180°.

La comprobación de escritorio incluyó el mazo completo de reversos, una carta invertida en la tirada y su resultado (`El Mundo` invertida), y una selección profunda de tres cartas: `El Colgado` invertida, `La Luna` derecha y `Diez de Oros` derecha. Los reversos, los frentes, los números de selección y la orientación preservaron su comportamiento. La revisión móvil de 390 × 844 px confirmó que la interfaz mantiene la composición responsive sin desbordes; las dimensiones de los componentes de carta se conservaron para no alterar la cuadrícula mobile-first.

`pnpm check`, `pnpm test` (42/42) y `pnpm build` finalizaron correctamente. Vite emitió sólo su advertencia habitual no bloqueante por tamaño de bundle.
