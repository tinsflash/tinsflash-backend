// ===============================
// 🌍 TINSFLASH FRONTEND APP
// ===============================

const API_BASE = "https://tinsflash-backend.onrender.com/api";

// ===============================
// Prévisions locales
// ===============================
async function loadLocalForecast() {
  const c = document.getElementById("local-content");
  c.innerHTML = "⏳ Chargement...";
  try {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const res = await fetch(`${API_BASE}/forecast/local?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
      const data = await res.json();
      const f = data.combined;

      c.innerHTML = `
        <strong>📍 Votre position</strong><br>
        ${f.description} ${f.temperature}°C <br>
        🌡️ Min: ${f.temperature_min}°C / Max: ${f.temperature_max}°C <br>
        💨 Vent: ${f.wind} km/h <br>
        🌧️ Pluie: ${f.precipitation} mm <br>
        🔒 Fiabilité: ${f.reliability}% <br>
        ⚠️ ${f.anomaly?.message || "Conditions normales"} <br>
        ${f.icone || ""}
      `;
    });
  } catch {
    c.innerHTML = "❌ Erreur prévisions locales";
  }
}

// ===============================
// Prévisions nationales
// ===============================
async function loadNationalForecast() {
  const c = document.getElementById("national-content");
  c.innerHTML = "⏳ Chargement...";
  try {
    const res = await fetch(`${API_BASE}/forecast/national?country=BE`);
    const data = await res.json();
    const f = data.combined;

    c.innerHTML = `
      <strong>🇧🇪 Prévisions nationales</strong><br>
      ${f.description} ${f.temperature}°C <br>
      🌡️ Min: ${f.temperature_min}°C / Max: ${f.temperature_max}°C <br>
      💨 Vent: ${f.wind} km/h <br>
      🌧️ Pluie: ${f.precipitation} mm <br>
      🔒 Fiabilité: ${f.reliability}% <br>
      ⚠️ ${f.anomaly?.message || "Conditions normales"} <br>
      ${f.icone || ""}
    `;
  } catch {
    c.innerHTML = "❌ Erreur prévisions nationales";
  }
}

// ===============================
// Prévisions 7 jours
// ===============================
async function load7Days() {
  const c = document.getElementById("days-container");
  c.innerHTML = "⏳ Chargement...";
  try {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const res = await fetch(`${API_BASE}/forecast/7days?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
      const data = await res.json();
      c.innerHTML = "";

      data.days.forEach(d => {
        c.innerHTML += `
          <div class="day-card">
            <strong>${d.jour}</strong><br>
            ${d.icone} ${d.description}<br>
            🌡️ Min: ${d.temperature_min}°C / Max: ${d.temperature_max}°C <br>
            💨 Vent: ${d.vent} km/h <br>
            🌧️ Pluie: ${d.precipitation} mm <br>
            🔒 Fiabilité: ${d.fiabilité}% <br>
            ⚠️ ${d.anomalie}
          </div>
        `;
      });
    });
  } catch {
    c.innerHTML = "❌ Erreur prévisions 7 jours";
  }
}

// ===============================
// Radar interactif
// ===============================
async function loadRadar() {
  const radarDiv = document.getElementById("radar");
  radarDiv.innerHTML = "⏳ Chargement radar...";

  try {
    const res = await fetch(`${API_BASE}/radar`);
    const data = await res.json();

    radarDiv.innerHTML = `<div id="radar-map" style="height:400px;border-radius:10px;"></div>`;
    const map = L.map("radar-map").setView([50.85, 4.35], 6); // Bruxelles par défaut

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap"
    }).addTo(map);

    const framesRes = await fetch(data.timestampsUrl);
    const frames = await framesRes.json();

    let currentFrame = frames.length - 1;
    let radarLayer;

    function showFrame(i) {
      if (radarLayer) map.removeLayer(radarLayer);
      radarLayer = L.tileLayer(
        data.tilesUrl.replace("{time}", frames[i]),
        { opacity: 0.6 }
      ).addTo(map);
    }

    showFrame(currentFrame);
    setInterval(() => {
      currentFrame = (currentFrame + 1) % frames.length;
      showFrame(currentFrame);
    }, 800);

  } catch (err) {
    radarDiv.innerHTML = "❌ Erreur radar";
    console.error("Radar error:", err);
  }
}

// ===============================
// Alertes
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
// Podcasts
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
// Chat IA J.E.A.N
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
  if (document.getElementById("local-content")) loadLocalForecast();
  if (document.getElementById("national-content")) loadNationalForecast();
  if (document.getElementById("days-container")) load7Days();
  if (document.getElementById("radar")) loadRadar();
  if (document.getElementById("alerts")) loadAlerts();
  if (document.getElementById("podcasts")) loadPodcasts();
});
