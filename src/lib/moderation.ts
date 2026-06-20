// Liste des mots interdits (apolitique, respectueux)
const BLOCKED_WORDS = [
  "politique", "parti", "élection", "vote", "gouvernement", "ministre",
  "insulte", "haine", "violence", "discrimination", "racisme",
  "spam", "pub", "promotion", "lien suspect", "bit.ly", "tinyurl",
  // Ajoutez les termes inappropriés en bété ou en français
];

// Détection de spam par répétition excessive ou liens suspects
export function isSpam(text: string): boolean {
  const words = text.split(/\s+/);
  const unique = new Set(words);
  // Si plus de 50% de répétition
  if (unique.size < words.length * 0.5) return true;
  // Si liens suspects
  if (/(bit\.ly|tinyurl|goo\.gl)/i.test(text)) return true;
  return false;
}

// Détection de contenu interdit
export function containsBlockedContent(text: string): string | null {
  const lower = text.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) return word;
  }
  return null;
}

// Détection de langage excessif
export function isToxic(text: string): boolean {
  const toxicWords = ["imbécile", "idiot", "stupide", "fou", "con"];
  const lower = text.toLowerCase();
  return toxicWords.some(w => lower.includes(w));
}