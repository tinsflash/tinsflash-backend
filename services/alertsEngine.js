// PATH: services/alertsEngine.js
// Détection + gestion de la fiabilité des alertes
import { askAI } from "./aiService.js";

/**
 * Applique la règle de fiabilité aux alertes
 * @param {object[]} alerts - liste d’alertes détectées
 * @returns {Promise<object[]>} - alertes enrichies
 */
export async function processAlerts(alerts, zoneInfo = {}) {
  const enriched = [];

  for (const alert of alerts) {
    const prompt = `
Analyse cette alerte météo: ${JSON.stringify(alert)}.
Zone: ${JSON.stringify(zoneInfo)}.

Consignes:
- Déterminer la fiabilité (0-100%).
- Expliquer brièvement la raison.
- Indiquer si nous sommes probablement les premiers à la détecter.
Réponds en JSON avec {fiabilite, explication, premier}.
`;

    const analysis = await askAI(prompt);

    let fiabilite = 0;
    let premier = false;
    let explication = "";

    try {
      const parsed = JSON.parse(analysis);
      fiabilite = parsed.fiabilite ?? 0;
      premier = parsed.premier ?? false;
      explication = parsed.explication ?? "";
    } catch {
      explication = analysis;
    }

    let statut = "memoire";
    if (fiabilite >= 90) statut = "auto-publie";
    else if (fiabilite >= 70) statut = "a-valider";

    enriched.push({
      ...alert,
      fiabilite,
      premier,
      explication,
      statut,
      zoneInfo,
    });
  }

  return enriched;
}
