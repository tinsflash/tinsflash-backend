// services/copernicusService.js
import fetch from "node-fetch";

async function fetchCopernicusData(dataset, requestBody) {
  try {
    // Encoder la clé UID:KEY en base64
    const auth = Buffer.from(process.env.CDS_API_KEY).toString("base64");

    const response = await fetch(`${process.env.CDS_API_URL}/resources/${dataset}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Copernicus API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (err) {
    console.error("❌ Error fetching Copernicus data:", err.message);
    throw err;
  }
}

export default {
  fetchCopernicusData
};
