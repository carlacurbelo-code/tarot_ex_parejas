/**
 * Mazo curado de cartas para lecturas de relaciones de pareja.
 * Solo Arcanos Mayores + algunas Copas (más relevantes a vínculos amorosos).
 */
export interface TarotCard {
  id: string;
  name: string;
  emoji: string;
  /** Significado breve, contexto de relación */
  meaning: string;
}

export const TAROT_DECK: TarotCard[] = [
  // Arcanos Mayores
  { id: "fool", name: "El Loco", emoji: "🌿", meaning: "Comienzos inesperados, ligereza, salto al vacío emocional" },
  { id: "magician", name: "El Mago", emoji: "✦", meaning: "Voluntad, capacidad de manifestar, recursos disponibles" },
  { id: "highpriestess", name: "La Sacerdotisa", emoji: "☾", meaning: "Intuición, lo no dicho, secretos del corazón" },
  { id: "empress", name: "La Emperatriz", emoji: "❀", meaning: "Abundancia emocional, fertilidad afectiva, cuidado" },
  { id: "emperor", name: "El Emperador", emoji: "⌂", meaning: "Estructura, autoridad, control en la relación" },
  { id: "hierophant", name: "El Hierofante", emoji: "✚", meaning: "Tradición, compromiso formal, mandatos heredados" },
  { id: "lovers", name: "Los Enamorados", emoji: "♡", meaning: "Decisión, vínculo profundo, encrucijada del corazón" },
  { id: "chariot", name: "El Carro", emoji: "→", meaning: "Avance con voluntad, conducir el rumbo del vínculo" },
  { id: "strength", name: "La Fuerza", emoji: "✺", meaning: "Domar la herida, paciencia interior, ternura firme" },
  { id: "hermit", name: "El Ermitaño", emoji: "✦", meaning: "Retiro, búsqueda interior, distancia necesaria" },
  { id: "wheel", name: "La Rueda", emoji: "○", meaning: "Ciclos que giran, momento de cambio inevitable" },
  { id: "justice", name: "La Justicia", emoji: "⚖", meaning: "Equilibrio, verdad sin adornos, lo que corresponde" },
  { id: "hangedman", name: "El Colgado", emoji: "⌇", meaning: "Pausa, otra perspectiva, soltar el control" },
  { id: "death", name: "La Muerte", emoji: "✦", meaning: "Final necesario, transformación profunda, cierre" },
  { id: "temperance", name: "La Templanza", emoji: "≋", meaning: "Reconciliación, mezcla de opuestos, paciencia" },
  { id: "devil", name: "El Diablo", emoji: "✦", meaning: "Apego, deseo intenso, dependencia que ata" },
  { id: "tower", name: "La Torre", emoji: "△", meaning: "Ruptura abrupta, verdad que derrumba, liberación" },
  { id: "star", name: "La Estrella", emoji: "✦", meaning: "Esperanza serena, sanación lenta, fe restaurada" },
  { id: "moon", name: "La Luna", emoji: "☾", meaning: "Confusión, miedos antiguos, intuición que avisa" },
  { id: "sun", name: "El Sol", emoji: "☼", meaning: "Claridad, alegría compartida, todo a la luz" },
  { id: "judgement", name: "El Juicio", emoji: "✧", meaning: "Despertar, llamada interior, segunda oportunidad" },
  { id: "world", name: "El Mundo", emoji: "○", meaning: "Cierre completo, integración, ciclo cumplido" },
  // Selección de Copas
  { id: "ace_cups", name: "As de Copas", emoji: "♡", meaning: "Sentimiento naciente, corazón que se abre" },
  { id: "two_cups", name: "Dos de Copas", emoji: "♡♡", meaning: "Reciprocidad, conexión auténtica, encuentro" },
  { id: "three_cups", name: "Tres de Copas", emoji: "♡", meaning: "Celebración, vínculos que sostienen, alegría" },
  { id: "five_cups", name: "Cinco de Copas", emoji: "♡", meaning: "Duelo, mirar lo perdido sin ver lo que queda" },
  { id: "six_cups", name: "Seis de Copas", emoji: "♡", meaning: "Nostalgia, memoria del pasado, cariño antiguo" },
  { id: "seven_cups", name: "Siete de Copas", emoji: "♡", meaning: "Ilusiones, fantasía, decisión confusa" },
  { id: "eight_cups", name: "Ocho de Copas", emoji: "♡", meaning: "Partida emocional, soltar lo que ya no nutre" },
  { id: "ten_cups", name: "Diez de Copas", emoji: "♡", meaning: "Plenitud afectiva, hogar emocional, paz vincular" },
];

export function getCardById(id: string): TarotCard | undefined {
  return TAROT_DECK.find(c => c.id === id);
}
