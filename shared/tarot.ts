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
  fool: "/manus-storage/tarot-fool_59dfd9f9.png",
  magician: "/manus-storage/tarot-magician_e76bee9a.png",
  high_priestess: "/manus-storage/tarot-high-priestess_0a7e679e.png",
  empress: "/manus-storage/tarot-empress_770c0a4c.png",
  emperor: "/manus-storage/tarot-emperor_2f420308.png",
  hierophant: "/manus-storage/tarot-hierophant_9ae03164.png",
  lovers: "/manus-storage/tarot-lovers_e5434a91.png",
  chariot: "/manus-storage/tarot-chariot_a69ac42d.png",
  strength: "/manus-storage/tarot-strength_7212f447.png",
  hermit: "/manus-storage/tarot-hermit_6ed436bf.png",
  wheel_of_fortune: "/manus-storage/tarot-wheel-of-fortune_01724a1d.png",
  justice: "/manus-storage/tarot-justice_bfc4038f.png",
  hanged_man: "/manus-storage/tarot-hanged-man_f0ba0aa4.png",
  death: "/manus-storage/tarot-death_c21cc466.png",
  ace_cups: "/manus-storage/tarot-ace-cups_26729558.png",
  ace_pentacles: "/manus-storage/tarot-ace-pentacles_7f2c94da.png",
  ace_swords: "/manus-storage/tarot-ace-swords_f06a0b0c.png",
  ace_wands: "/manus-storage/tarot-ace-wands_a18f36f4.png",
  two_cups: "/manus-storage/tarot-two-cups_2f68bce8.png",
  two_pentacles: "/manus-storage/tarot-two-pentacles_dd0032cc.png",
  two_swords: "/manus-storage/tarot-two-swords_b7b41653.png",
  two_wands: "/manus-storage/tarot-two-wands_463cbad6.png",
  three_cups: "/manus-storage/tarot-three-cups_4b6347cb.png",
  three_swords: "/manus-storage/tarot-three-swords_f2b62a43.png",
  three_wands: "/manus-storage/tarot-three-wands_95e7a699.png",
  four_cups: "/manus-storage/tarot-four-cups_4305f244.png",
  four_pentacles: "/manus-storage/tarot-four-pentacles_ee057294.png",
  four_swords: "/manus-storage/tarot-four-swords_0270d4d8.png",
  four_wands: "/manus-storage/tarot-four-wands_b860c571.png",
  five_cups: "/manus-storage/tarot-five-cups_d9576136.png",
  five_pentacles: "/manus-storage/tarot-five-pentacles_394bfaea.png",
  five_swords: "/manus-storage/tarot-five-swords_7266bffa.png",
  five_wands: "/manus-storage/tarot-five-wands_cb531f67.png",
};

export function getTarotImageUrl(id: string): string | undefined {
  return TAROT_IMAGE_URLS[id];
}
