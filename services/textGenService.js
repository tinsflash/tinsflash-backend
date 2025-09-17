// -------------------------
// 🌍 textGenService.js
// Générateur de texte météo automatique
// -------------------------

export function generateWeatherText(forecast, location = "votre région") {
  try {
    const temp = forecast.temperature;
    const desc = forecast.description;
    const vent = forecast.wind;
    const pluie = forecast.precipitation;

    let texte = `Prévisions météo pour ${location} : ${desc}, `;
    texte += `température autour de ${temp}°C, `;
    texte += vent > 20 ? `vent soutenu à ${vent} km/h` : `vent faible à ${vent} km/h`;
    texte += pluie > 0
      ? ` et risque de précipitations (${pluie} mm).`
      : ` et pas de précipitations attendues.`;

    return texte;
  } catch (err) {
    return "Prévisions météo indisponibles pour le moment.";
  }
}
