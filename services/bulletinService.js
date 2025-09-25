// PATH: services/bulletinService.js
// Génération de bulletins météo via IA
import { askAI } from "./aiService.js";

export default async function generateBulletin(zone) {
  const prompt = `Rédige un bulletin météo détaillé pour la zone ${zone}.
Inclure températures, précipitations, vents et risques principaux.
Texte clair en français.`;

  const reply = await askAI(prompt);
  return { zone, bulletin: reply };
}
