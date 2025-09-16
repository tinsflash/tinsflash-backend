// Charger les prévisions
document.getElementById("forecast-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const city = document.getElementById("city").value;
  try {
    const res = await fetch(`/forecast?city=${city}`);
    const data = await res.json();
    document.getElementById("forecast-result").innerHTML = `
      <h3>${city}</h3>
      <p>Température: ${data?.data?.list[0]?.main?.temp}°C</p>
      <p>Météo: ${data?.data?.list[0]?.weather[0]?.description}</p>
    `;
  } catch (err) {
    document.getElementById("forecast-result").innerHTML = "Erreur chargement météo.";
  }
});

// Podcasts
async function generatePodcast(type) {
  document.getElementById("podcast-result").innerHTML = "⏳ Génération du podcast...";
  try {
    const res = await fetch(`/podcast/generate?type=${type}`);
    const data = await res.json();
    document.getElementById("podcast-result").innerHTML = `
      <p>${data.forecast}</p>
      🎧 <a href="${data.audioUrl}" target="_blank">Écouter</a>
    `;
  } catch (err) {
    document.getElementById("podcast-result").innerHTML = "❌ Erreur génération podcast.";
  }
}

// Alertes
async function loadAlerts() {
  try {
    const res = await fetch("/alerts");
    const data = await res.json();
    let alertsHTML = "";
    data.alerts.forEach(alert => {
      alertsHTML += `<p>⚠️ [${alert.level}] ${alert.type} → ${alert.description} (${alert.reliability}% fiabilité)</p>`;
    });
    document.getElementById("alerts-result").innerHTML = alertsHTML;
  } catch (err) {
    document.getElementById("alerts-result").innerHTML = "Pas d’alertes disponibles.";
  }
}
loadAlerts();

