const API_BASE = "/api";
let userLat = null, userLon = null;

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur API");
  return res.json();
}

// === Gestion vidéo ===
const video = document.getElementById("introVideo");
const soundToggle = document.getElementById("soundToggle");
soundToggle.onclick = () => {
  video.muted = !video.muted;
  soundToggle.textContent = video.muted ? "🔇" : "🔊";
};

// === Géolocalisation ===
async function useGeoloc() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLat = pos.coords.latitude;
        userLon = pos.coords.longitude;
        loadAll();
      },
      () => alert("Géolocalisation refusée")
    );
  } else alert("Géolocalisation non supportée");
}

async function manualAddress() {
  const address = document.getElementById("address").value;
  if (!address) return alert("Entrez une adresse complète");
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
  );
  const data = await res.json();
  if (data.length) {
    userLat = parseFloat(data[0].lat);
    userLon = parseFloat(data[0].lon);
    loadAll();
  } else alert("Adresse non trouvée");
}

// === Chargement des prévisions ===
async function loadForecasts() {
  try {
    const res = await fetchJSON(`${API_BASE}/status`);
    const f = res.forecasts || {};
    const local = f.local || {}, national = f.national || {};

    document.getElementById("local-today").innerHTML = local.today
      ? `<b>${local.today.summary}</b><br>${local.today.temp_min}°C / ${local.today.temp_max}°C`
      : "Prévision locale indisponible";

    document.getElementById("national-today").innerHTML = national.today
      ? `<b>${national.today.summary}</b><br>${national.today.temp_min}°C / ${national.today.temp_max}°C`
      : "Prévision nationale indisponible";

    // Avatar dynamique
    const avatar = document.getElementById("jeanAvatar");
    let mood = "default";
    const s = (local.today?.summary || "").toLowerCase();
    if (s.includes("pluie")) mood = "rain";
    else if (s.includes("neige")) mood = "snow";
    else if (s.includes("orage")) mood = "storm";
    else if (s.includes("soleil")) mood = "sun";
    avatar.src = `avatars/jean-${mood}.png`;

  } catch (e) {
    console.error(e);
  }
}

// === Alertes ===
async function loadAlerts() {
  const res = await fetchJSON(`${API_BASE}/alerts`);
  const div = document.getElementById("alerts");
  div.innerHTML = "";
  if (!res.length) {
    div.innerHTML = "<p>Aucune alerte active</p>";
    return;
  }
  res.forEach((a) => {
    const p = document.createElement("p");
    p.innerHTML = `⚠️ <strong>${a.zone || a.country}</strong> – ${a.title || a.type || "Alerte"} (${a.level || "info"})`;
    if (a.level === "high") p.className = "blink";
    div.appendChild(p);
  });
}

// === Cartes ===
function initMaps() {
  const mapForecast = L.map("map-forecast").setView([20, 10], 2);
  const mapAlerts = L.map("map-alerts").setView([20, 10], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapForecast);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapAlerts);

  // Couverture verte / bleue
  fetchJSON(`${API_BASE}/status`).then((data) => {
    const covered = data?.checkup?.coveredPoints || [];
    covered.forEach((p) =>
      L.circle([p.lat, p.lon], { color: "lime", radius: 80000 }).addTo(mapForecast)
    );
  });

  // Alertes mondiales
  fetchJSON(`${API_BASE}/alerts`).then((alerts) => {
    alerts.forEach((a) => {
      if (a.lat && a.lon) {
        L.circle([a.lat, a.lon], {
          color: a.level === "high" ? "red" : "orange",
          radius: 100000,
        }).addTo(mapAlerts).bindPopup(a.title || "Alerte");
      }
    });
  });
}

// === Lancer tout ===
function loadAll() {
  loadForecasts();
  loadAlerts();
  initMaps();
}

// === Chat IA future ===
function openJeanChat() {
  alert("👋 Ici J.E.A.N – module IA-AI en développement (Premium à venir)");
}

// === Auto start ===
document.addEventListener("DOMContentLoaded", () => {
  useGeoloc();
});
