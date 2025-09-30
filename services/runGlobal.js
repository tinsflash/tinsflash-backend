// services/runGlobal.js
// ⚡ Centrale nucléaire météo – Centralisation des zones couvertes
// UE27 + UK + Ukraine + Norvège + Suisse + USA (extensible)

// === Import des zones détaillées ===
import { EUROPE_ZONES } from "./runGlobalEurope.js";
import { USA_ZONES } from "./runGlobalUSA.js";

// ✅ Fusion de toutes les zones disponibles
export const ALL_ZONES = {
  ...EUROPE_ZONES,
  ...USA_ZONES,
  // Ajout futur :
  // ...CANADA_ZONES,
  // ...AFRICA_ZONES,
  // ...ASIA_ZONES,
};

// ✅ Export par défaut pour compatibilité Render
export default { ALL_ZONES };
