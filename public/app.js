// ===============================
// 🌍 TINSFLASH FRONTEND APP
// ===============================

// API Base URL (Render backend)
const API_BASE = "https://tinsflash-backend.onrender.com/api";

// ===============================
// GEOLOCALISATION → Prévisions locales
// ===============================
async function loadLocalForecast() {
  if (!navigator.geolocation) {
    document.getElementById("local-forecast").innerHTML = "⚠️ Géolocalisation non supportée";
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    try {
      const res = await fetch(`${API_BASE}/forecast/local?lat=${lat}&lon=${lon}`);
      const data = await res.json();

      document.getElementById("local-forecast").innerHTML = `
        <div class="card weather-card">
          <span>📍 ${data.city || "Localisation détectée"}</span>
          <span>🌡️ ${data.combined.temperature}°C</span>
          <span>💨 ${data.combined.wind} km/h</span>
          <span>${data.combined.description}</span>
        </div>`;
    } catch (err) {
      console.error("Erreur forecast local:", err);
    }
  });
}

// ===============================
// PRÉVISIONS NATIONALES
// ===============================
async function loadNationalForecast(country = "BE") {
  try {
    const res = await fetch(`${API_BASE}/forecast/national?country=${country}`);
    const data = await res.json();

    document.getElementById("national-forecast").innerHTML = `
      <div class="card weather-card">
        <span>🏳️ ${country}</span>
        <span>🌡️ ${data.combined.temperature}°C</span>
        <span>${data.combined.description}</span>
      </div>`;
  } catch (err) {
    console.error("Erreur forecast national:", err);
  }
}

// ===============================
// PRÉVISIONS 7 JOURS
// ===============================
async function loadSevenDays(lat = 50.85, lon = 4.35) {
  try {
    const res = await fetch(`${API_BASE}/forecast/7days?lat=${lat}&lon=${lon}`);
    const data = await res.json();

    const daysHTML = data.days
      .map(
        (d) => `
        <div>
          <h4>${d.jour}</h4>
          <p>${d.temperature_min}°C - ${d.temperature_max}°C</p>
          <p>${d.icone} ${d.description}</p>
        </div>`
      )
      .join("");

    document.getElementById("forecast-7days").innerHTML = `
      <div class="forecast-grid">${daysHTML}</div>`;
  } catch (err) {
    console.error("Erreur forecast 7j:", err);
  }
}

// ===============================
// RADAR
// ===============================
async function loadRadar() {
  try {
    const res = await fetch(`${API_BASE}/radar`);
    const data = await res.json();

    document.getElementById("radar").innerHTML = `
      <div class="card radar-card">
        <img src="${data.radarUrl}" alt="Radar précipitations">
      </div>`;
  } catch (err) {
    console.error("Erreur radar:", err);
  }
}

// ===============================
// ALERTES
// ===============================
async function loadAlerts() {
  try {
    const res = await fetch(`${API_BASE}/alerts`);
    const data = await res.json();

    const alertsHTML = data
      .map(
        (a) => `<div>⚠️ ${a.level.toUpperCase()} - ${a.message} (Fiabilité: ${a.reliability}%)</div>`
      )
      .join("");

    document.getElementById("alerts").innerHTML = `
      <div class="alerts-container">${alertsHTML}</div>`;
  } catch (err) {
    console.error("Erreur alerts:", err);
  }
}

// ===============================
// PODCASTS
// ===============================
async function loadPodcasts(type = "daily") {
  try {
    const res = await fetch(`${API_BASE}/podcast/generate?type=${type}`);
    const data = await res.json();

    document.getElementById("podcasts").innerHTML = `
      <div class="card">
        <h3>🎙️ ${data.title || "Podcast météo"}</h3>
        <audio controls src="${data.url}"></audio>
      </div>`;
  } catch (err) {
    console.error("Erreur podcast:", err);
  }
}

// ===============================
// CHAT IA J.E.A.N
// ===============================
async function chatWithJean() {
  const input = document.getElementById("chat-input").value;
  if (!input) return;

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });

    const data = await res.json();

    document.getElementById("chat-output").innerHTML += `
      <div class="card"><b>Vous:</b> ${input}</div>
      <div class="card ai"><b>J.E.A.N:</b> ${data.reply}</div>`;
  } catch (err) {
    console.error("Erreur chat:", err);
  }
}

// ===============================
// INIT
// ===============================
window.addEventListener("DOMContentLoaded", () => {
  loadLocalForecast();
  loadNationalForecast("BE");
  loadSevenDays();
  loadRadar();
  loadAlerts();
  loadPodcasts();
});
