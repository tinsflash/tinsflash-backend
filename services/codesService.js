// -------------------------
// 🌍 codesService.js
// Table de correspondance icônes météo
// -------------------------

export function getWeatherIcon(code) {
  const mapping = {
    0: "☀️", // ciel clair
    1: "🌤️", // peu nuageux
    2: "⛅", // nuages épars
    3: "☁️", // couvert
    45: "🌫️", // brouillard
    48: "🌫️", // brouillard givrant
    51: "🌦️", // bruine faible
    61: "🌧️", // pluie modérée
    63: "🌧️", // pluie forte
    71: "🌨️", // neige faible
    73: "🌨️", // neige modérée
    75: "❄️", // neige forte
    95: "⛈️", // orage
    99: "🌩️", // orage violent
  };

  return mapping[code] || "❓";
}
