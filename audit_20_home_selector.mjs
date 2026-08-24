import { assignOrientations, TAROT_DECK } from "./shared/tarot.ts";

const draws = [];
for (let draw = 1; draw <= 20; draw += 1) {
  const chosen = [];
  while (chosen.length < 3) {
    const index = Math.floor(Math.random() * TAROT_DECK.length);
    const card = TAROT_DECK[index];
    if (!card || chosen.some(item => item.id === card.id)) continue;
    const [oriented] = assignOrientations([card]);
    if (oriented) chosen.push(oriented);
  }
  draws.push({
    tirada: draw,
    cartas: chosen.map(card => ({
      id: card.id,
      name: card.name,
      arcana: card.arcana,
      orientation: card.orientation,
    })),
  });
}

const summary = draws.flatMap(draw => draw.cartas);
const counts = summary.reduce((acc, card) => {
  acc[card.arcana] = (acc[card.arcana] ?? 0) + 1;
  if (card.id.endsWith("_cups")) acc.cups = (acc.cups ?? 0) + 1;
  if (card.id.endsWith("_wands")) acc.wands = (acc.wands ?? 0) + 1;
  if (card.id.endsWith("_swords")) acc.swords = (acc.swords ?? 0) + 1;
  if (card.id.endsWith("_pentacles")) acc.pentacles = (acc.pentacles ?? 0) + 1;
  return acc;
}, {});

console.log(JSON.stringify({ deckLength: TAROT_DECK.length, draws, counts }, null, 2));
