// -------------------------
// cockpit.js
// Mode NASA (Premium / Pro / Pro+)
// -------------------------

const API_BASE = "https://tinsflash-backend.onrender.com/api";

// Charger toutes les données cockpit
async function loadCockpitData() {
  try {
    // Local forecast
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const res = await fetch(`${API_BASE}/forecast/local?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
      const data = await res.json();
      document.getElementById("cockpit-local").innerHTML = `
        <div class="weather-icon">${data.combined.icone}</div>
        ${data.combined.description}, <strong>${data.combined.temperature}°C</strong>
      `;
    });

    // 7 jours
    const res7 = await fetch(`${API_BASE}/forecast/7days?lat=50.5&lon=4.5`);
    const data7 = await res7.json();
    let daysHtml = "";
    data7.days.forEach(d => {
      daysHtml += `
        <div>
          <div class="weather-icon">${d.icone}</div>
          <strong>${d.jour}</strong><br>
          ${d.temperature_min}°C / ${d.temperature_max}°C
        </div>
      `;
    });
    document.getElementById("cockpit-7days").innerHTML = daysHtml;

    // Radar
    const resRadar = await fetch(`${API_BASE}/radar`);
    const radarData = await resRadar.json();
    document.getElementById("cockpit-radar").innerHTML = `
      <img src="${radarData.radarUrl}" alt="Radar" style="width:100%;border-radius:10px;">
    `;

    // Alertes
    const resAlerts = await fetch(`${API_BASE}/alerts`);
    const alertData = await resAlerts.json();
    let alertsHtml = "";
    alertData.alerts?.forEach(a => {
      alertsHtml += `
        <div class="alert-row">
          ⚠️ [${a.level}] ${a.type} (${a.reliability}%)
        </div>
      `;
    });
    document.getElementById("cockpit-alerts").innerHTML = alertsHtml || "Aucune alerte";

  } catch (err) {
    console.error("Erreur cockpit :", err);
    document.getElementById("cockpit-local").textContent = "Erreur chargement cockpit";
  }
}

// -------------------------
// Boutons cockpit
// -------------------------
function setupCockpitControls() {
  const buttons = document.querySelectorAll(".round-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.textContent.trim();
      if (type === "🔄") loadCockpitData();
      if (type === "🌡️") highlightPanel("Températures");
      if (type === "💨") highlightPanel("Vent");
      if (type === "🌧️") highlightPanel("Précipitations");
      if (type === "⚡") highlightPanel("Alertes");
    });
  });
}

function highlightPanel(keyword) {
  const panels = document.querySelectorAll(".cockpit-panel");
  panels.forEach(panel => {
    if (panel.innerText.includes(keyword)) {
      panel.classList.add("highlight");
      setTimeout(() => panel.classList.remove("highlight"), 1500);
    }
  });
}

// -------------------------
// Init
// -------------------------
window.onload = () => {
  loadCockpitData();
  setupCockpitControls();
};
