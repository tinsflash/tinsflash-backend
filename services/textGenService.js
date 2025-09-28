// PATH: services/textGenService.js
import { askOpenAI } from "./openaiService.js";

export async function generateText(context) {
  const sys = "Tu es un rédacteur météo spécialisé. Rédige des synthèses fiables et concises.";
  const prompt = `Produis une analyse claire à partir de ces données:\n${JSON.stringify(context)}\nRéponds en français, structuré, 10 lignes max.`;
  const reply = await askOpenAI(sys, prompt);
  return { text: reply };
}
