/**
 * Motor compartido del mazo Rider–Waite–Smith para consultas afectivas.
 * Las cartas no almacenan significados prefabricados: el LLM interpreta
 * nombre + orientación + pregunta dentro del contexto relacional.
 */
export type CardOrientation = "upright" | "reversed";

export interface TarotCard {
  id: string;
  name: string;
  emoji: string;
  arcana: "major" | "minor";
  /** Placeholder estable para asignar una ilustración definitiva más adelante. */
  imageKey: string;
}

export interface TarotSelection extends TarotCard {
  orientation: CardOrientation;
}

const majorArcana: Array<[string, string, string]> = [
  ["fool", "El Loco", "🌿"],
  ["magician", "El Mago", "✦"],
  ["high_priestess", "La Sacerdotisa", "☾"],
  ["empress", "La Emperatriz", "❀"],
  ["emperor", "El Emperador", "⌂"],
  ["hierophant", "El Hierofante", "✚"],
  ["lovers", "Los Enamorados", "♡"],
  ["chariot", "El Carro", "→"],
  ["strength", "La Fuerza", "✺"],
  ["hermit", "El Ermitaño", "✦"],
  ["wheel_of_fortune", "La Rueda de la Fortuna", "○"],
  ["justice", "La Justicia", "⚖"],
  ["hanged_man", "El Colgado", "⌇"],
  ["death", "La Muerte", "✦"],
  ["temperance", "La Templanza", "≋"],
  ["devil", "El Diablo", "✦"],
  ["tower", "La Torre", "△"],
  ["star", "La Estrella", "✧"],
  ["moon", "La Luna", "☾"],
  ["sun", "El Sol", "☼"],
  ["judgement", "El Juicio", "✧"],
  ["world", "El Mundo", "○"],
];

const minorRanks: Array<[string, string]> = [
  ["ace", "As"],
  ["two", "Dos"],
  ["three", "Tres"],
  ["four", "Cuatro"],
  ["five", "Cinco"],
  ["six", "Seis"],
  ["seven", "Siete"],
  ["eight", "Ocho"],
  ["nine", "Nueve"],
  ["ten", "Diez"],
  ["page", "Sota"],
  ["knight", "Caballero"],
  ["queen", "Reina"],
  ["king", "Rey"],
];

const suits: Array<[string, string, string]> = [
  ["cups", "Copas", "♡"],
  ["wands", "Bastos", "✦"],
  ["swords", "Espadas", "⚔"],
  ["pentacles", "Oros", "◇"],
];

const makeCard = (
  id: string,
  name: string,
  emoji: string,
  arcana: TarotCard["arcana"],
): TarotCard => ({
  id,
  name,
  emoji,
  arcana,
  imageKey: `placeholder:${id}`,
});

export const TAROT_DECK: TarotCard[] = [
  ...majorArcana.map(([id, name, emoji]) => makeCard(id, name, emoji, "major")),
  ...suits.flatMap(([suitId, suitName, emoji]) =>
    minorRanks.map(([rankId, rankName]) =>
      makeCard(`${rankId}_${suitId}`, `${rankName} de ${suitName}`, emoji, "minor"),
    ),
  ),
];

export function getCardById(id: string): TarotCard | undefined {
  return TAROT_DECK.find(card => card.id === id);
}

/** Baraja sin alterar el catálogo original. */
export function shuffleDeck<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

/** Asigna la orientación de cada carta de forma independiente: 30% invertida. */
export function assignOrientations(
  cards: readonly TarotCard[],
  random: () => number = Math.random,
): TarotSelection[] {
  return cards.map(card => ({
    ...card,
    orientation: random() < 0.3 ? "reversed" : "upright",
  }));
}

/** Selecciona tres entidades diferentes y asigna orientación a cada una. */
export function drawThreeCards(random: () => number = Math.random): TarotSelection[] {
  return assignOrientations(shuffleDeck(TAROT_DECK, random).slice(0, 3), random);
}

export function normalizeSelection(
  cards: readonly { id: string; orientation?: CardOrientation }[],
): TarotSelection[] {
  return cards
    .map(({ id, orientation = "upright" }) => {
      const card = getCardById(id);
      return card ? { ...card, orientation } : undefined;
    })
    .filter((card): card is TarotSelection => Boolean(card));
}

/** Acepta tanto el formato histórico ["id1", ...] como el nuevo formato orientado. */
export function parseStoredSelection(value: unknown): TarotSelection[] {
  if (!Array.isArray(value)) return [];
  const normalized = value.flatMap(item => {
    if (typeof item === "string") return [{ id: item, orientation: "upright" as const }];
    if (item && typeof item === "object" && "id" in item && typeof item.id === "string") {
      const orientation = item.orientation === "reversed" ? "reversed" as const : "upright" as const;
      return [{ id: item.id, orientation }];
    }
    return [];
  });
  return normalizeSelection(normalized);
}

export function orientationLabel(orientation: CardOrientation): string {
  return orientation === "reversed" ? "invertida" : "derecha";
}

/** Clase visual única para rotar la misma ilustración, sin duplicar cartas. */
export function orientationTransformClass(
  orientation: CardOrientation,
  revealed: boolean,
): string {
  return revealed && orientation === "reversed" ? "rotate-180" : "";
}

/** URLs persistentes de las ilustraciones aprobadas/disponibles. Las cartas restantes conservan placeholder. */
const TAROT_IMAGE_URLS: Record<string, string> = {
  fool: "/manus-storage/tarot-fool_027a9b5f.webp",
  magician: "/manus-storage/tarot-magician_15b16cf7.webp",
  high_priestess: "/manus-storage/tarot-high-priestess_ec1d9469.webp",
  empress: "/manus-storage/tarot-empress_02f1177d.webp",
  emperor: "/manus-storage/tarot-emperor_1d1f22c1.webp",
  hierophant: "/manus-storage/tarot-hierophant_62c1b09a.webp",
  lovers: "/manus-storage/tarot-lovers_f66c0733.webp",
  chariot: "/manus-storage/tarot-chariot_3ae53da0.webp",
  strength: "/manus-storage/tarot-strength_6826510c.webp",
  hermit: "/manus-storage/tarot-hermit_dafa5880.webp",
  wheel_of_fortune: "/manus-storage/tarot-wheel-of-fortune_b493611b.webp",
  justice: "/manus-storage/tarot-justice_719d841a.webp",
  hanged_man: "/manus-storage/tarot-hanged-man_6f4fbb8c.webp",
  death: "/manus-storage/tarot-death_0ebcd022.webp",
  ace_cups: "/manus-storage/tarot-ace-cups_c38432ea.webp",
  ace_pentacles: "/manus-storage/tarot-ace-pentacles_9ef9d592.webp",
  ace_swords: "/manus-storage/tarot-ace-swords_ffeb7d84.webp",
  ace_wands: "/manus-storage/tarot-ace-wands_97dca7c0.webp",
  two_cups: "/manus-storage/tarot-piloto-dos-de-copas_9a434a0b.webp",
  two_pentacles: "/manus-storage/tarot-two-pentacles_7b0c1297.webp",
  two_swords: "/manus-storage/tarot-two-swords_2cd661c8.webp",
  two_wands: "/manus-storage/tarot-two-wands_ccd0bfa7.webp",
  three_cups: "/manus-storage/tarot-three-cups_a1a43254.webp",
  three_swords: "/manus-storage/tarot-piloto-tres-de-espadas_6050729e.webp",
  three_wands: "/manus-storage/tarot-three-wands_3101c312.webp",
  four_cups: "/manus-storage/tarot-four-cups_c78e3d6d.webp",
  four_pentacles: "/manus-storage/tarot-four-pentacles_c82cafa9.webp",
  four_swords: "/manus-storage/tarot-four-swords_91d3b125.webp",
  four_wands: "/manus-storage/tarot-four-wands_a1e53088.webp",
  five_cups: "/manus-storage/tarot-five-cups_ec3a3960.webp",
  five_pentacles: "/manus-storage/tarot-five-pentacles_d55807b0.webp",
  five_swords: "/manus-storage/tarot-five-swords_93425bbd.webp",
  five_wands: "/manus-storage/tarot-five-wands_c674b8e7.webp",
  sun: "/manus-storage/tarot-piloto-el-sol_fcc992f2.webp",
  tower: "/manus-storage/tarot-piloto-la-torre_3be624eb.webp",
  queen_pentacles: "/manus-storage/tarot-piloto-reina-de-oros_975808ef.webp",
};

export function getTarotImageUrl(id: string): string | undefined {
  return TAROT_IMAGE_URLS[id];
}
