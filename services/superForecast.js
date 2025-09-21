import trullemans from './trullemans.js';
import wetterzentrale from './wetterzentrale.js';
import openweather from './openweather.js';
import meteomatics from './meteomatics.js';
import copernicusService from './copernicusService.js';
import localFactors from './localFactors.js';
import geoFactors from './geoFactors.js';

export async function getSuperForecast(location, options = {}) {
  try {
    const [
      trullemansData,
      wetterzentraleData,
      openweatherData,
      meteomaticsData,
      copernicusData,
      localAdjust,
      geoAdjust
    ] = await Promise.all([
      trullemans(location, options),
      wetterzentrale(location, options),
      openweather(location, options),
      meteomatics(location, options),
      copernicusService(location, options),
      localFactors(location, options),
      geoFactors(location, options)
    ]);

    // Fusionner les résultats (pondération simple ou algo ML plus avancé)
    const forecast = {
      location,
      temperature: (
        (trullemansData.temperature +
          wetterzentraleData.temperature +
          openweatherData.temperature +
          meteomaticsData.temperature +
          copernicusData.temperature) / 5
      ) + localAdjust.temperature + geoAdjust.temperature,
      precipitation: (
        (trullemansData.precipitation +
          wetterzentraleData.precipitation +
          openweatherData.precipitation +
          meteomaticsData.precipitation +
          copernicusData.precipitation) / 5
      ) + localAdjust.precipitation + geoAdjust.precipitation,
      wind: (
        (trullemansData.wind +
          wetterzentraleData.wind +
          openweatherData.wind +
          meteomaticsData.wind +
          copernicusData.wind) / 5
      ) + localAdjust.wind + geoAdjust.wind,
      updated: new Date().toISOString()
    };

    return forecast;
  } catch (error) {
    console.error('[SuperForecast] Erreur lors de la fusion des modèles :', error);
    throw error;
  }
}
