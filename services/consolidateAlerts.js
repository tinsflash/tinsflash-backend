// services/consolidateAlerts.js
// ⚡ Consolidation des alertes météo brutes
// Mission : dédupliquer, regrouper, pondérer et classer

import { askOpenAI } from "./openaiService.js";
import { addEngineLog } from "./engineState.js";

/**
 * Consolidation IA des alertes météo brutes
 * @param {Array} alerts - liste brute (peut contenir 10 000+ entrées)
 * @returns {Array} alerts consolidées
 */
export async function consolidateAlerts(alerts = []) {
  if (!alerts || alerts.length === 0) {
    return [];
  }

  addEngineLog(`📊 Consolidation de ${alerts.length} alertes brutes...`);

  // Nettoyage simple : on garde seulement alertes valides
  const validAlerts = alerts.filter(a => a?.data);

  // Prompt IA pour regrouper et classer
  const prompt = `
Tu es l'IA chef d'orchestre météo.
Mission : consolider une liste brute d'alertes météo.
Règles :
1. Détecter les doublons (même type + même zone) → fusionner.
2. Pondérer fiabilité/intensité selon répétitions.
3. Classer en catégories : local / national / continental.
4. Supprimer les alertes expirées (si date fin < maintenant).
5. Fournir un JSON final clair : tableau d'alertes optimisées.
   Chaque entrée doit contenir :
   {
     "type": "...",
     "zone": "...",
     "fiabilite": "...",
     "intensite": "...",
     "consequences": "...",
     "recommandations": "...",
     "debut": "...",
     "fin": "...",
     "categorie": "local|national|continental"
   }
Voici les alertes brutes à traiter :
${JSON.stringify(validAlerts)}
`;

  try {
    const aiResult = await askOpenAI(
      "Tu es une IA spécialisée en consolidation d'alertes météo.",
      prompt
    );

    let consolidated;
    try {
      consolidated = JSON.parse(aiResult);
    } catch {
      consolidated = { raw: aiResult };
    }

    addEngineLog(`✅ Consolidation terminée (${Array.isArray(consolidated) ? consolidated.length : "?"} alertes finales)`);
    return consolidated;
  } catch (err) {
    addEngineLog(`❌ Erreur consolidation alertes: ${err.message}`);
    return alerts; // fallback → garder brut si échec IA
  }
}
