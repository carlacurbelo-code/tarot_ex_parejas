import { assignOrientations, drawThreeCards } from "./shared/tarot.ts";
import { buildReadingUserMessage, SYSTEM_PROMPT } from "./server/routers.ts";
import { invokeLLM } from "./server/_core/llm.ts";

const questions = [
  "¿Me va a volver a buscar?",
  "¿Qué siente por mí?",
  "¿Hay posibilidades de reconciliación?",
  "¿Por qué se alejó?",
  "¿Esta relación tiene futuro?",
];
const countWords = text => text.trim().split(/\s+/).filter(Boolean).length;
const results = [];
for (const question of questions) {
  const cards = drawThreeCards();
  const response = await invokeLLM({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildReadingUserMessage(question, cards) },
    ],
  });
  const reading = response.choices?.[0]?.message?.content ?? "";
  results.push({
    question,
    cards: cards.map(card => ({ name: card.name, orientation: card.orientation === "reversed" ? "invertida" : "derecha" })),
    model: response.model,
    wordCount: countWords(reading),
    reading,
  });
}
console.log(JSON.stringify(results, null, 2));
