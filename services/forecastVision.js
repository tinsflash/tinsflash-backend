import { detectSeasonalAnomaly } from './seasonalNorms.js';
import { getSuperForecast } from './superForecast.js';

export async function getForecastVision(location, options = {}) {
  try {
    const forecast = await getSuperForecast(location, options);

    const anomalies = detectSeasonalAnomaly(forecast, location);

    return {
      ...forecast,
      anomalies,
      vision: anomalies.length > 0
        ? 'Anomalies détectées dans les prévisions'
        : 'Prévisions dans les normales saisonnières'
    };
  } catch (error) {
    console.error('[ForecastVision] Erreur :', error);
    throw error;
  }
}
