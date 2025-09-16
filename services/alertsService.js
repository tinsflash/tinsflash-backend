import fetch from "node-fetch";

export async function getAlerts() {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=Brussels&appid=${process.env.SATELLITE_API}`;
    const reply = await fetch(url);
    const data = await reply.json();

    return [
      {
        id: 1,
        level: "orange",
        type: "vent fort",
        reliability: 92,
        description: "Rafales attendues 90 km/h sur Bruxelles",
        external: data
      }
    ];
  } catch (err) {
    throw new Error("Erreur service alertes météo : " + err.message);
  }
}
