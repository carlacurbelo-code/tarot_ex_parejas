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
