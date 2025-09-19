// -------------------------
// 🌍 localFactors.js
// Ajustements météo locaux (relief, eau, urbain…)
// -------------------------
export function applyLocalFactors(lat, lon, { temp, wind, rain }) {
  // Exemple simple : en vrai, tu relies à une base relief / zones urbaines
  if (lat > 45 && lat < 55 && lon > 3 && lon < 8) {
    // Belgique
    temp += 1; // îlot urbain / densité
    wind += 2; // relief vallonné
  }

  return { temp, wind, rain };
}
