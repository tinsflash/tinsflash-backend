// services/adminBulletins.js
import { askAI } from "./aiService.js";
import { addLog } from "./adminLogs.js";

/**
 * Génère un bulletin météo synthétique par pays couvert
 * après un RUN GLOBAL.
 * 
 * @param {Array} results - résultats du runGlobal (prévisions nationales/locales)
 * @returns {Array} bulletins
 */
export async function generateAdminBulletins(results) {
  const bulletins = [];

  for (const entry of results) {
    const { country, national, local } = entry;

    try {
      const prompt = `
Bulletin météo national demandé par l'Administrateur TINSFLASH.

Pays: ${country}

Prévisions nationales brutes:
${JSON.stringify(national)}

Prévisions locales (capitale):
${JSON.stringify(local)}

Consignes:
- Résume clairement pour ${country}.
- Horizon: aujourd'hui + 7 jours.
- Mets en avant températures, précipitations, vent, phénomènes extrêmes.
- Mentionne un indice de fiabilité global.
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
