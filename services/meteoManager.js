// services/meteoManager.js
import gfs from "./gfs.js";
import ecmwf from "./ecmwf.js";
import icon from "./icon.js";

/**
 * Centralise les appels aux modèles météo (via Meteomatics)
 * @param {number} lat - latitude
 * @param {number} lon - longitude
 * @returns {Promise<Array>} liste de modèles météo avec leurs données
 */
export default async function meteoManager(lat, lon) {
  const results = [];

  try {
    const gfsData = await gfs(lat, lon);
    if (gfsData) results.push(gfsData);
  } catch (err) {
    console.error("❌ Erreur récupération GFS:", err.message);
  }

  try {
    const ecmwfData = await ecmwf(lat, lon);
    if (ecmwfData) results.push(ecmwfData);
  } catch (err) {
    console.error("❌ Erreur récupération ECMWF:", err.message);
  }

  try {
    const iconData = await icon(lat, lon);
    if (iconData) results.push(iconData);
  } catch (err) {
    console.error("❌ Erreur récupération ICON:", err.message);
  }

  return results;
}
