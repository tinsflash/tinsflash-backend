// ==============================================
// 🌦️ Dôme de Protection Floreffe – JS Principal
// ==============================================

// 🔐 Mot de passe d’accès
const PASSWORD = "5150PV";
const content = document.getElementById("protectedContent");
if (!sessionStorage.getItem("access")) {
  const pass = prompt("Entrez le mot de passe d’accès :");
  if (pass === PASSWORD) {
    sessionStorage.setItem("access", "ok");
    content.style.display = "block";
  } else {
    alert("Accès refusé.");
    window.location.href = "/";
  }
} else {
  content.style.display = "block";
}

const API_FORECAST = "/floreffe_forecasts.json";
const API_ALERTS = "/floreffe_alerts.json";

// ===============================
// 🔹 Chargement des prévisions
// ===============================
async function loadForecasts() {
  try {
    const r = await fetch(API_FORECAST);
    const data = await r.json();
    renderToday(data.general);
    renderWeek(data.general.week);
    populateZones(data.zones);
  } catch (e) {
    console.error("Erreur chargement prévisions", e);
  }
}

function renderToday(f) {
  const el = document.getElementById("forecast-today");
  el.innerHTML = `
    <div class="forecast-card">
      <img src="https://open-meteo.com/images/weather-icons/${f.icon}.svg">
      <div><b>${f.temp_min}° / ${f.temp_max}°</b></div>
      <small>${f.condition}</small>
      <div>Fiabilité : ${(f.reliability*100).toFixed(0)}%</div>
    </div>`;
}

function renderWeek(days) {
  const el = document.getElementById("forecast-week");
  el.innerHTML = "";
  days.forEach(d => {
    const card = document.createElement("div");
    card.className = "forecast-card";
    card.innerHTML = `
      <img src="https://open-meteo.com/images/weather-icons/${d.icon}.svg">
      <div><b>${d.day}</b></div>
      <div>${d.temp_min}° / ${d.temp_max}°</div>
      <small>${d.condition}</small>`;
    el.appendChild(card);
  });
}

function populateZones(zones) {
  const select = document.getElementById("zoneSelect");
  const zoneBox = document.getElementById("zoneForecast");
  zones.forEach(z => {
    const opt = document.createElement("option");
    opt.value = z.id;
    opt.textContent = z.name;
    select.appendChild(opt);
  });
  select.onchange = () => {
    const z = zones.find(x => x.id === select.value);
    if (!z) return;
    zoneBox.innerHTML = `
      <div class="forecast-card">
        <b>${z.name}</b><br>
        ${z.temp_min}° / ${z.temp_max}°<br>
        <img src="https://open-meteo.com/images/weather-icons/${z.icon}.svg">
        <small>${z.condition}</small>
      </div>`;
  };
}

// ===============================
// 🚨 Chargement des alertes
// ===============================
async function loadAlerts() {
  try {
    const r = await fetch(API_ALERTS);
    const alerts = await r.json();
    renderAlerts(alerts);
    initMap(alerts);
  } catch (e) {
    console.error("Erreur alertes", e);
  }
}

function renderAlerts(list) {
  const el = document.getElementById("alerts-local");
  el.innerHTML = "";
  list
    .filter(a => a.reliability >= 0.9)
    .forEach(a => {
      const box = document.createElement("div");
      box.className = "alert-box";
      box.innerHTML = `
        <b>${a.type}</b> – ${a.zone}<br>
        <small>${a.description}</small><br>
        Fiabilité : ${(a.reliability*100).toFixed(0)}%`;
      el.appendChild(box);
    });
}

function initMap(alerts) {
  const map = L.map("map-alerts").setView([50.44, 4.76], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
  alerts.forEach(a => {
    if (a.lat && a.lon && a.reliability >= 0.9) {
      const color =
        a.type.includes("Verglas") ? "blue" :
        a.type.includes("Pluie") ? "aqua" :
        a.type.includes("Vent") ? "orange" :
        "red";
      const marker = L.circleMarker([a.lat, a.lon], {
        radius: 8, color, fillOpacity: 0.8
      }).addTo(map);
      marker.bindPopup(`<b>${a.type}</b><br>${a.zone}<br>${a.description}`);
    }
  });
}

// 💬 Bulle IA
document.getElementById("btnAI").onclick = () => {
  const chatBox = document.getElementById("chatJean");
  chatBox.style.display = chatBox.style.display === "flex" ? "none" : "flex";
};

// Démarrage
document.addEventListener("DOMContentLoaded", () => {
  loadForecasts();
  loadAlerts();
});
