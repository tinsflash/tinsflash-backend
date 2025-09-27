// services/runContinental.js
import openweather from "./openweather.js";
import { detectAlerts } from "./alertDetector.js";
import { processAlerts } from "./alertsEngine.js";
import { addEngineLog } from "./engineState.js";

const SAMPLE = {
  Africa:[{name:"Lagos",lat:6.45,lon:3.39},{name:"Cairo",lat:30.04,lon:31.23}],
  Asia:[{name:"Delhi",lat:28.61,lon:77.20},{name:"Tokyo",lat:35.67,lon:139.65}],
  "South America":[{name:"São Paulo",lat:-23.55,lon:-46.63},{name:"Buenos Aires",lat:-34.60,lon:-58.38}],
  Oceania:[{name:"Sydney",lat:-33.86,lon:151.20}],
  "North America":[{name:"Mexico City",lat:19.43,lon:-99.13}]
};

export default async function runContinental() {
  const all = [];
  for (const [continent, points] of Object.entries(SAMPLE)) {
    for (const p of points) {
      try {
        const ow = await openweather(p.lat,p.lon);
        const alerts = detectAlerts({ openweather:ow }, { scope:"global", continent });
        all.push(...alerts.filter(a => a.confidence>=70));
      } catch {}
    }
  }
  const buckets = processAlerts(all);
  addEngineLog(`🌍 Continental scan: ${all.length} alertes candidates`);
  return { generatedAt:new Date().toISOString(), totals:{published:buckets.published.length,toValidate:buckets.toValidate.length}};
}
