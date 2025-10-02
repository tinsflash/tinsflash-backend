// services/externalAlerts.js
// 🔎 Vérification d'exclusivité via fournisseurs OFFICIELS
// - USA: NOAA/NWS (api.weather.gov)
// - Europe: Meteoalarm (feeds.meteoalarm.org CAP JSON)
// Le but: savoir si notre alerte est "exclusive" ou "confirmée ailleurs" de façon 100% réelle.

const UA = 'Tinsflash/1.0 (+contact@tinsflash.example)';

const EUROPE_COUNTRY_TO_ISO2 = {
  Belgium: 'BE', France: 'FR', Germany: 'DE', Netherlands: 'NL', Luxembourg: 'LU',
  Switzerland: 'CH', Austria: 'AT', Denmark: 'DK', Norway: 'NO', Sweden: 'SE',
  Finland: 'FI', Iceland: 'IS', Poland: 'PL', Czechia: 'CZ', Slovakia: 'SK',
  Hungary: 'HU', Romania: 'RO', Moldova: 'MD', Ukraine: 'UA',
  Estonia: 'EE', Latvia: 'LV', Lithuania: 'LT',
  Spain: 'ES', Portugal: 'PT', Italy: 'IT', Malta: 'MT', Greece: 'GR', Cyprus: 'CY',
  Croatia: 'HR', Slovenia: 'SI', BosniaHerzegovina: 'BA', Serbia: 'RS', Montenegro: 'ME',
  Kosovo: 'XK', NorthMacedonia: 'MK', Albania: 'AL',
  UnitedKingdom: 'GB', Ireland: 'IE'
};

function norm(x) {
  if (!x) return '';
  return String(x).toLowerCase();
}

/** 🛰 NOAA/NWS (USA) — par point lat,lon */
async function fetchNOAA(lat, lon) {
  try {
    const url = `https://api.weather.gov/alerts/active?status=actual&point=${lat},${lon}`;
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/ld+json' } });
    if (!res.ok) throw new Error(`NOAA ${res.status}`);
    const json = await res.json();
    const feats = Array.isArray(json.features) ? json.features : [];

    return feats.map(f => {
      const props = f.properties || {};
      return {
        provider: 'NOAA/NWS',
        type: props.event || 'alert',
        severity: props.severity || props.severityLevel || 'unknown',
        headline: props.headline || props.parameters?.NWSheadline?.[0] || props.event || 'Alert',
        onset: props.onset || null,
        ends: props.ends || props.expires || null,
        link: props?.id || props?.['@id'] || null,
      };
    });
  } catch (e) {
    // On ne casse rien : si NOAA indispo, return []
    return [];
  }
}

/** 🇪🇺 Meteoalarm (Europe) — par ISO2 pays ; filtre best-effort par proximité point */
async function fetchMeteoalarm(countryName, lat, lon) {
  try {
    const iso = EUROPE_COUNTRY_TO_ISO2[countryName];
    if (!iso) return [];

    const url = `https://feeds.meteoalarm.org/api/cap/${iso}.json`;
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`Meteoalarm ${res.status}`);
    const data = await res.json();

    // Les structures CAP varient un peu selon le flux ; on sécurise :
    const items = Array.isArray(data?.features) ? data.features
                : Array.isArray(data?.entries) ? data.entries
                : Array.isArray(data) ? data
                : [];

    const out = [];
    for (const it of items) {
      // Essayer plusieurs chemins CAP possibles
      const props = it?.properties || it?.info || it || {};
      const info = props?.info || props?.parameter || props || {};
      const area = (info?.area && (Array.isArray(info.area) ? info.area[0] : info.area)) || {};
      const areaDesc = area?.areaDesc || props?.areaDesc || props?.headline || '';
      const event = props?.event || info?.event || 'Alert';
      const severity = props?.severity || info?.severity || 'unknown';
      const onset = props?.onset || props?.effective || info?.onset || null;
      const ends = props?.expires || info?.expires || null;
      const link = props?.web || props?.id || null;

      // 🔎 Filtre géographique “best effort”
      let keep = true;
      // Si polygon dispo → test rapide bounding-box
      const polygonStr = area?.polygon || props?.polygon || null;
      if (polygonStr && typeof polygonStr === 'string') {
        const pts = polygonStr.split(' ').map(p => {
          const [plat, plon] = p.split(',').map(Number);
          return { lat: plat, lon: plon };
        }).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lon));

        if (pts.length >= 3) {
          const lats = pts.map(p => p.lat);
          const lons = pts.map(p => p.lon);
          const minLat = Math.min(...lats), maxLat = Math.max(...lats);
          const minLon = Math.min(...lons), maxLon = Math.max(...lons);
          if (!(lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon)) {
            // hors bbox — on peut encore garder si areaDesc mentionne large pays (souvent national)
            const ad = norm(areaDesc);
            const cn = norm(countryName);
            keep = ad.includes(cn) || ad.includes('national');
          }
        }
      }

      if (!keep) continue;

      out.push({
        provider: 'Meteoalarm',
        type: event,
        severity,
        headline: areaDesc || event,
        onset,
        ends,
        link
      });
    }
    return out;
  } catch (_) {
    return [];
  }
}

/**
 * 🔗 Check externes unifiés
 * @returns {Array<{provider,type,severity,headline,onset,ends,link}>}
 */
export async function checkExternalAlerts(lat, lon, country, region) {
  const tasks = [];
  if (country === 'USA') tasks.push(fetchNOAA(lat, lon));
  else tasks.push(fetchMeteoalarm(country, lat, lon));

  const results = await Promise.allSettled(tasks);
  const merged = [];
  for (const r of results) {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) merged.push(...r.value);
  }
  return merged;
}
