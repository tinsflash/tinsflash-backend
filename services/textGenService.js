// PATH: services/textGenService.js
// Génération de textes météo spécialisés
import { askAI } from "./aiService.js";

export async function generateText(context) {
  const prompt = `Rédige une analyse météo claire basée sur ces données:\n${JSON.stringify(
    context
  )}\nFais une synthèse concise en français.`;

  const reply = await askAI(prompt);
  return { text: reply };
}
