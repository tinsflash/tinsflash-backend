// services/localFactors.js

/**
 * Ajuste les prévisions avec des facteurs locaux spécifiques
 * (ex : microclimat, zone urbaine, effet local empirique).
 */
export async function applyLocalFactors(forecast, countryCode = "BE") {
  const adjusted = { ...forecast };

  switch (countryCode) {
    case "BE":
      // Belgique → ajustement pluie empirique (surévaluation habituelle)
      adjusted.precipitation = Math.max(0, (adjusted.precipitation || 0) * 0.9);
      break;

    case "FR":
      // France → mistral / tramontane (vent accentué dans le sud)
      if (adjusted.wind && adjusted.wind > 20) {
        adjusted.wind = adjusted.wind + 5;
      }
      break;

    default:
      // Par défaut → pas d’ajustement
      break;
  }

  return adjusted;
}

/**
 * Variante : applique plusieurs couches de facteurs locaux
 */
export async function adjustWithLocalFactors(forecast, lat, lon) {
  let result = { ...forecast };

  // Exemple futur → ajustement via base MongoDB (observations locales)
  // TODO: connecter Netatmo / Météociel / stations locales
  result = await applyLocalFactors(result, forecast.countryCode);

  return result;
}
