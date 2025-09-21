import fetch from 'node-fetch';

const METEOMATICS_USER = process.env.METEOMATICS_USER;
const METEOMATICS_PASS = process.env.METEOMATICS_PASS;

export default async function meteomatics(location, options = {}) {
  const { lat, lon } = location; // latitude & longitude nécessaires
  const url = `https://api.meteomatics.com/now/t_2m:C,precip_1h:mm,wind_speed_10m:ms/${lat},${lon}/json`;

  const response = await fetch(url, {
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${METEOMATICS_USER}:${METEOMATICS_PASS}`).toString('base64')
    }
  });

  if (!response.ok) {
    throw new Error(`[Meteomatics] Erreur API: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    temperature: data.data[0].coordinates[0].dates[0].value,
    precipitation: data.data[1].coordinates[0].dates[0].value,
    wind: data.data[2].coordinates[0].dates[0].value,
    source: 'Meteomatics'
  };
}
