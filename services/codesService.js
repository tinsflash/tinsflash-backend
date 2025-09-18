// -------------------------
// codesService.js
// Table de correspondance icônes météo + codes promo
// -------------------------

// Icônes météo (pour affichage dans index.html et cockpit.html)
export function getWeatherIcon(code) {
  const mapping = {
    0: "☀️",  // ciel clair
    1: "🌤️",  // peu nuageux
    2: "⛅",  // nuages épars
    3: "☁️",  // couvert
    45: "🌫️", // brouillard
    48: "🌫️", // brouillard givrant
    51: "🌦️", // bruine faible
    61: "🌧️", // pluie modérée
    65: "🌧️", // pluie forte
    71: "❄️", // neige faible
    73: "❄️", // neige modérée
    79: "❄️", // neige forte
    95: "⛈️", // orage
    99: "🌩️"  // orage violent
  };

  return mapping[code] || "❓";
}

// Codes promo abonnements (utilisé par /api/codes/generate et account.html)
export function generateCode(type) {
  const prefix = type === "premium" ? "PREM" :
                 type === "pro" ? "PRO" :
                 type === "proplus" ? "NASA" : "GEN";
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return { code: `${prefix}-${random}` };
}
