export const READING_CONTEXTS = ["love", "money_work"] as const;

export type ReadingContext = (typeof READING_CONTEXTS)[number];

export const READING_CONTEXT_LABELS: Record<ReadingContext, string> = {
  love: "Amor y vínculos",
  money_work: "Dinero y trabajo",
};

export const RESTRICTED_QUESTION_MESSAGE = "Esta pregunta no puedo responderla con una lectura de tarot. Las consultas sobre salud necesitan información fiable, no una interpretación de cartas. Podés hacerme otra pregunta.";

export type RestrictedQuestionCategory = "health" | "pregnancy_fertility";

function normalizeQuestion(question: string): string {
  return question
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Detecta únicamente consultas que intentan obtener una determinación médica.
 * Las preguntas relacionales sobre hijos o familia no coinciden con estos patrones.
 */
export function getRestrictedQuestionCategory(
  question: string,
): RestrictedQuestionCategory | null {
  const normalized = normalizeQuestion(question);

  const pregnancyOrFertilityPatterns = [
    /\b(?:estoy|estar[eé]|quedar(?:me)?|quedar[eé]|voy a quedar|puedo quedar|podr[eé] quedar|tengo)\s+(?:embarazada|embarazo)\b/,
    /\b(?:mi|este|el)\s+embarazo\b.*\b(?:salir bien|estar bien|evolucion|viab|riesgo|salud)\b/,
    /\b(?:mi|el)\s+bebe\b.*\b(?:esta|estara|salud|bien|sexo|feto)\b/,
    /\b(?:fertilidad|infertilidad|fertil)\b/,
    /\b(?:puedo|podre|voy a poder|tendre)\s+tener\s+hijos\b/,
  ];

  if (pregnancyOrFertilityPatterns.some(pattern => pattern.test(normalized))) {
    return "pregnancy_fertility";
  }

  const explicitMedicalTerms = /\b(?:diagnostico|enfermedad|sintoma|medicacion|medicamento|recuperarme|recuperacion|cirugia|operacion|pronostico|salud fisica|salud mental|resultado medico)\b/;
  const personalTreatmentQuestion = /\btratamiento\b.*\b(?:me conviene|necesito|debo|para mi)\b/;
  const namedHealthCondition = /\b(?:cancer|diabetes|ansiedad|depresion|infeccion|dolor|lesion|tumor|trastorno|autismo|tdah|covid)\b/;
  const medicalDeterminationIntent = /\b(?:tengo|tendre|tendra|padezco|sufro|me voy a recuperar|voy a recuperarme|se va a curar)\b/;

  if (
    explicitMedicalTerms.test(normalized) ||
    personalTreatmentQuestion.test(normalized) ||
    (namedHealthCondition.test(normalized) && medicalDeterminationIntent.test(normalized))
  ) {
    return "health";
  }

  return null;
}

export function isRestrictedQuestion(question: string): boolean {
  return getRestrictedQuestionCategory(question) !== null;
}
