// PATH: config/modelEndpoints.js
// 📡 Canonical endpoints for each model family (with fallbacks)

const env = (name, def = undefined) => process.env[name] ?? def;

export const MODEL_ENDPOINTS = {
  openMeteo: "https://api.open-meteo.com/v1/forecast",
  nasaPower: "https://power.larc.nasa.gov/api/temporal/hourly/point",
  openWeather: "https://api.openweathermap.org/data/2.5/forecast",
  meteomatics: "https://api.meteomatics.com",
  // Proxies / custom gateways (provided in .env screenshot)
  graphcast: env("GRAPHCAST_API", ""),
  pangu: env("PANGU_API", ""),
  corrdiff: env("CORRDIFF_API", ""),
  nowcastnet: env("NOWCASTNET_API", ""),
  // Copernicus / CDS (ping only in health check)
  cds: env("CDS_API_URL", "https://cds.climate.copernicus.eu/api"),
  meteoFrance: "https://public-api.meteo.fr"
};

export const MODEL_KEYS = {
  OPENWEATHER_KEY: env("OPENWEATHER_KEY", ""),
  METEOMATICS_USER: env("METEOMATICS_USER", ""),
  METEOMATICS_PASS: env("METEOMATICS_PASS", ""),
  HF_API_KEY: env("HF_API_KEY", ""),
  GEMINI_API_KEY: env("GEMINI_API_KEY", ""),
};
