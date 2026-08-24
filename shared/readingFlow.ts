import {
  assignOrientations,
  shuffleDeck,
  TAROT_DECK,
  type TarotCard,
  type TarotSelection,
} from "./tarot";

/** Crea una nueva baraja visual completa para cada tirada independiente. */
export function createIndependentReadingDeck(
  random: () => number = Math.random,
): TarotCard[] {
  return shuffleDeck(TAROT_DECK, random);
}

/** Una tirada gratuita siempre contiene exactamente una carta con orientación propia. */
export function selectSingleCard(
  card: TarotCard,
  random: () => number = Math.random,
): TarotSelection {
  return assignOrientations([card], random)[0]!;
}

/** Mantiene una selección profunda de hasta tres identidades distintas. */
export function toggleDeepCards(
  selected: readonly TarotSelection[],
  card: TarotCard,
  random: () => number = Math.random,
): TarotSelection[] {
  const existing = selected.find(item => item.id === card.id);
  if (existing) return selected.filter(item => item.id !== card.id);
  if (selected.length >= 3) return [...selected];
  return [...selected, selectSingleCard(card, random)];
}

/** Decide la pregunta limpia que recibirá la nueva lectura profunda. */
export function resolveDeepQuestion({
  originalQuestion,
  newQuestion,
  useOriginalQuestion,
}: {
  originalQuestion: string;
  newQuestion: string;
  useOriginalQuestion: boolean;
}): string {
  return (useOriginalQuestion ? originalQuestion : newQuestion).trim();
}
