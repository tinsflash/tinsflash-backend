// hiddensources/meteomatics.js
// Meteomatics Free API - Besoin d’un compte gratuit

import fetch from "node-fetch";

export async function getMeteomaticsForecast(lat = 50.5, lon = 4.5) {
  try {
    // Exemple d’appel simple (température actuelle)
    const username = process.env.METEOMATICS_USER;
    const password = process.env.METEOMATICS_PASS;
    const url = `https://api.meteomatics.com/now/t_2m:C/${lat},${lon}/json`;

    const response = await fetch(url, {
      headers: {
        Authorization: "Basic " + Buffer.from(username + ":" + password).toString("base64")
      }
    });

    const data = await response.json();
    return {
      source: "Meteomatics",
      temp: data?.data?.[0]?.coordinates?.[0]?.dates?.[0]?.value || "N/A",
      date: new Date().toISOString(),
    };
  } catch (err) {
    console.error("Erreur Meteomatics:", err);
    return { source: "Meteomatics", error: true };
  }
}
