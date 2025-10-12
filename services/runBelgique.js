// ==========================================================
// 🇧🇪 TINSFLASH – runBelgique.js (Everest Protocol v3.95 PRO+++)
// ==========================================================
// Extraction nationale – Belgique entière (haute densité)
// Objectif : couverture plus fine que les services météo officiels.
// Phase 1 = extraction pure (aucune IA ici). Phase 2 séparée.
// ==========================================================

import { superForecast } from "./superForecast.js";
import { addEngineLog, addEngineError } from "./engineState.js";

// ----------------------------------------------------------
// 🗺️ Maillage national (villes + sous-localités clés)
// (coordonnées WGS84 décimales)
// ----------------------------------------------------------
export const BELGIQUE_ZONES = [
  // —— Bruxelles-Capitale
  { name: "Bruxelles", lat: 50.8466, lon: 4.3528 },
  { name: "Laeken", lat: 50.883, lon: 4.35 },
  { name: "Uccle", lat: 50.800, lon: 4.332 },
  { name: "Woluwe-Saint-Lambert", lat: 50.847, lon: 4.436 },
  { name: "Anderlecht", lat: 50.837, lon: 4.300 },
  { name: "Ixelles", lat: 50.833, lon: 4.366 },
  { name: "Schaerbeek", lat: 50.870, lon: 4.383 },

  // —— Brabant Wallon
  { name: "Wavre", lat: 50.718, lon: 4.611 },
  { name: "Ottignies-Louvain-la-Neuve", lat: 50.668, lon: 4.614 },
  { name: "Nivelles", lat: 50.596, lon: 4.328 },
  { name: "Waterloo", lat: 50.717, lon: 4.401 },
  { name: "Braine-l’Alleud", lat: 50.684, lon: 4.371 },
  { name: "Rixensart", lat: 50.711, lon: 4.523 },
  { name: "Genval", lat: 50.725, lon: 4.512 },
  { name: "Jodoigne", lat: 50.728, lon: 4.871 },
  { name: "Perwez", lat: 50.635, lon: 4.813 },
  { name: "Tubize", lat: 50.690, lon: 4.200 },

  // —— Brabant Flamand
  { name: "Louvain (Leuven)", lat: 50.879, lon: 4.701 },
  { name: "Tervuren", lat: 50.824, lon: 4.514 },
  { name: "Vilvorde", lat: 50.929, lon: 4.429 },
  { name: "Zaventem", lat: 50.883, lon: 4.473 },
  { name: "Diest", lat: 50.989, lon: 5.051 },
  { name: "Aarschot", lat: 50.989, lon: 4.836 },
  { name: "Halle", lat: 50.735, lon: 4.238 },

  // —— Hainaut
  { name: "Mons", lat: 50.454, lon: 3.952 },
  { name: "Charleroi", lat: 50.411, lon: 4.444 },
  { name: "La Louvière", lat: 50.475, lon: 4.186 },
  { name: "Tournai", lat: 50.607, lon: 3.389 },
  { name: "Ath", lat: 50.630, lon: 3.777 },
  { name: "Mouscron", lat: 50.744, lon: 3.206 },
  { name: "Soignies", lat: 50.580, lon: 4.070 },
  { name: "Lessines", lat: 50.712, lon: 3.835 },
  { name: "Beloeil", lat: 50.552, lon: 3.740 },
  { name: "Binche", lat: 50.410, lon: 4.165 },
  { name: "Anderlues", lat: 50.405, lon: 4.274 },
  { name: "Chimay", lat: 50.048, lon: 4.314 },
  { name: "Thuin", lat: 50.338, lon: 4.286 },
  { name: "Momignies", lat: 50.011, lon: 4.162 },

  // —— Province de Namur
  { name: "Namur", lat: 50.467, lon: 4.867 },
  { name: "Jambes", lat: 50.451, lon: 4.872 },
  { name: "Salzinnes", lat: 50.461, lon: 4.859 },
  { name: "Gembloux", lat: 50.562, lon: 4.698 },
  { name: "Grand-Leez", lat: 50.561, lon: 4.763 },
  { name: "Éghezée", lat: 50.583, lon: 4.908 },
  { name: "Andenne", lat: 50.489, lon: 5.095 },
  { name: "Fosses-la-Ville", lat: 50.395, lon: 4.695 },
  { name: "Floreffe", lat: 50.430, lon: 4.759 },
  { name: "Floriffoux", lat: 50.460, lon: 4.748 },
  { name: "Sambreville (Tamines)", lat: 50.440, lon: 4.622 },
  { name: "Jemeppe-sur-Sambre", lat: 50.485, lon: 4.668 },
  { name: "Profondeville", lat: 50.382, lon: 4.872 },
  { name: "Dinant", lat: 50.262, lon: 4.911 },
  { name: "Yvoir", lat: 50.327, lon: 4.881 },
  { name: "Ciney", lat: 50.295, lon: 5.094 },
  { name: "Houyet", lat: 50.181, lon: 5.001 },
  { name: "Rochefort", lat: 50.163, lon: 5.223 },
  { name: "Gedinne", lat: 49.985, lon: 4.942 },
  { name: "Beauraing", lat: 50.121, lon: 4.957 },
  { name: "Couvin", lat: 50.053, lon: 4.495 },
  { name: "Walcourt", lat: 50.254, lon: 4.441 },
  { name: "Philippeville", lat: 50.201, lon: 4.541 },

  // —— Liège
  { name: "Liège", lat: 50.631, lon: 5.579 },
  { name: "Seraing", lat: 50.583, lon: 5.505 },
  { name: "Herstal", lat: 50.670, lon: 5.635 },
  { name: "Ans", lat: 50.664, lon: 5.523 },
  { name: "Verviers", lat: 50.589, lon: 5.864 },
  { name: "Waremme", lat: 50.699, lon: 5.256 },
  { name: "Huy", lat: 50.517, lon: 5.224 },
  { name: "Wanze", lat: 50.535, lon: 5.251 },
  { name: "Spa", lat: 50.492, lon: 5.866 },
  { name: "Malmedy", lat: 50.426, lon: 6.027 },
  { name: "Stavelot", lat: 50.395, lon: 5.931 },
  { name: "Eupen", lat: 50.630, lon: 6.034 },
  { name: "Sankt Vith", lat: 50.284, lon: 6.126 },
  { name: "Aywaille", lat: 50.473, lon: 5.676 },
  { name: "Hamoir", lat: 50.442, lon: 5.555 },
  { name: "Trois-Ponts", lat: 50.369, lon: 5.872 },

  // —— Luxembourg
  { name: "Arlon", lat: 49.683, lon: 5.816 },
  { name: "Bastogne", lat: 50.000, lon: 5.716 },
  { name: "Marche-en-Famenne", lat: 50.228, lon: 5.347 },
  { name: "La Roche-en-Ardenne", lat: 50.182, lon: 5.575 },
  { name: "Durbuy", lat: 50.354, lon: 5.456 },
  { name: "Bouillon", lat: 49.794, lon: 5.067 },
  { name: "Virton", lat: 49.569, lon: 5.535 },
  { name: "Neufchâteau", lat: 49.842, lon: 5.434 },
  { name: "Saint-Hubert", lat: 50.026, lon: 5.373 },
  { name: "Vielsalm", lat: 50.283, lon: 5.914 },

  // —— Flandre Occidentale
  { name: "Bruges", lat: 51.209, lon: 3.224 },
  { name: "Ostende", lat: 51.218, lon: 2.928 },
  { name: "Courtrai", lat: 50.828, lon: 3.264 },
  { name: "Ypres", lat: 50.851, lon: 2.887 },
  { name: "Roulers", lat: 50.950, lon: 3.121 },
  { name: "Knokke-Heist", lat: 51.347, lon: 3.291 },
  { name: "La Panne", lat: 51.099, lon: 2.592 },

  // —— Flandre Orientale
  { name: "Gand", lat: 51.055, lon: 3.717 },
  { name: "Alost", lat: 50.938, lon: 4.040 },
  { name: "Saint-Nicolas", lat: 51.166, lon: 4.143 },
  { name: "Eeklo", lat: 51.182, lon: 3.566 },
  { name: "Deinze", lat: 50.981, lon: 3.531 },

  // —— Anvers
  { name: "Anvers", lat: 51.221, lon: 4.399 },
  { name: "Malines", lat: 51.025, lon: 4.477 },
  { name: "Lierre", lat: 51.132, lon: 4.570 },
  { name: "Turnhout", lat: 51.323, lon: 4.944 },
  { name: "Geel", lat: 51.165, lon: 4.994 },

  // —— Limbourg
  { name: "Hasselt", lat: 50.930, lon: 5.338 },
  { name: "Genk", lat: 50.965, lon: 5.500 },
  { name: "Tongres", lat: 50.780, lon: 5.464 },
  { name: "Maaseik", lat: 51.098, lon: 5.783 },
  { name: "Bree", lat: 51.140, lon: 5.594 }
];

// ----------------------------------------------------------
// 🚀 Lancement extraction nationale
// ----------------------------------------------------------
export async function runBelgique() {
  try {
    await addEngineLog("🇧🇪 Démarrage runBelgique (national complet)", "info", "runBelgique");

    const result = await superForecast({ zones: BELGIQUE_ZONES, runType: "Belgique" });

    await addEngineLog(
      `✅ runBelgique terminé (${BELGIQUE_ZONES.length} zones nationales)`,
      "success",
      "runBelgique"
    );
    return result;
  } catch (err) {
    await addEngineError(`Erreur runBelgique : ${err.message}`, "runBelgique");
    return { error: err.message };
  }
}
