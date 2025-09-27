// services/adminBulletins.js
import { askAI } from "./aiService.js";
import { addLog } from "./adminLogs.js";

/**
 * Génère un bulletin météo synthétique par pays couvert
 * en utilisant toutes les régions traitées.
 * 
 * @param {Array} results - résultats du runGlobal (prévisions + alertes locales)
 * @returns {Array} bulletins
 */
export async function generateAdminBulletins(results) {
  const bulletins = [];

  for (const entry of results) {
    const { country, national, locals } = entry;

    try {
      const prompt = `
Bulletin météo national demandé par l'Administrateur TINSFLASH.

Pays: ${country}

Prévisions nationales multi-régions:
${JSON.stringify(national)}

Alertes locales (toutes régions, villes et villages):
${JSON.stringify(locals)}

Consignes:
- Fournis un bulletin synthétique pour ${country}.
- Horizon: aujourd'hui + 7 jours.
- Mets en avant températures, précipitations, vent, phénomènes extrêmes.
- Intègre les alertes régionales (ex. orages, inondations, vents violents).
- Donne un indice de fiabilité global.
- Style = clair, professionnel, concis.
`;

      const reply = await askAI(prompt);

      bulletins.push({ country, bulletin: reply });
      addLog(`📝 Bulletin IA généré pour ${country}`);
    } catch (err) {
      addLog(`❌ Erreur génération bulletin ${country}: ${err.message}`);
      bulletins.push({ country, error: err.message });
    }
  }

  return bulletins;
}
