export const DEEP_READING_STATUSES = ["checkout_created", "paid", "generating", "consumed"] as const;
export type DeepReadingPurchaseStatus = (typeof DEEP_READING_STATUSES)[number];

export const DEEP_READING_ACTIONS = ["deepen", "new_question"] as const;
export type DeepReadingPurchaseAction = (typeof DEEP_READING_ACTIONS)[number];

export function canStartPaidDeepReading(status: DeepReadingPurchaseStatus) {
  return status === "paid";
}

export function isDeepReadingPurchaseToken(value: string) {
  return /^[a-zA-Z0-9_-]{20,64}$/.test(value);
}

export function hasThreeDistinctCards(cards: Array<{ id: string }>) {
  return cards.length === 3 && new Set(cards.map(card => card.id)).size === 3;
}
