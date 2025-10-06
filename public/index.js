// PATH: public/index.js
// ==========================================================
// 🌍 TINSFLASH – Front 100 % réel & connecté
// ==========================================================
const API_BASE = "https://tinsflash-backend.onrender.com/api";

// === UTILITAIRE FETCH JSON ===
async function fetchJSON(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`Erreur API ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("❌ Erreur API:", e);
    return null;
  }
}

// === LANCEMENT INITIAL ===
document.addEventListener("DOMContentLoaded", () => {
  initPosition();

  document.getElementById("btnLocate").addEventListener("click", async () => {
    const addr = document.getElementById("manualAddress").value.trim();
    if (addr) await geocodeAddress(addr);
  });

  const sendBtn = document.getElementById("sendChat");
  if (sendBtn) sendBtn.addEventListener("click", askJean);

  const soundToggle = document.getElementById("soundToggle");
  if (soundToggle) soundToggle.onclick = toggleSound;
});

// ==========================================================
// 🔊 VIDEO / SON
// ==========================================================
function toggleSound() {
  const video = document.getElementById("introJean");
  if (!video) return;
  video.muted = !video.muted;
  const btn = document.getElementById("soundToggle");
  if (btn) btn.innerText = video.muted ? "🔇 Son" : "🔊 Son";
}

// ==========================================================
// 📍 GÉOLOCALISATION / ADRESSE
// ==========================================================
async function initPosition() {
  const locEl = document.getElementById("user-location");
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        locEl.innerHTML = `📍 Latitude : ${latitude.toFixed(2)}, Longitude : ${longitude.toFixed(2)}`;
        await loadAll(latitude, longitude);
      },
      () => {
        locEl.innerHTML = "⚠️ Géolocalisation refusée ; utilisez le champ ci-dessous.";
      }
    );
  } else {
    locEl.innerHTML = "❌ Géolocalisation non supportée.";
  }
}

async function geocodeAddress(address) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    );
    const data = await res.json();
    if (!data.length) throw new Error("Adresse non trouvée");
    const { lat, lon, display_name } = data[0];
    document.getElementById("user-location").innerHTML = `📍 ${display_name}`;
    await loadAll(parseFloat(lat), parseFloat(lon));
  } catch (err) {
    alert(err.message);
  }
}

// ==========================================================
// 🔁 CHARGEMENT GLOBAL
// ==========================================================
async function loadAll(lat, lon) {
  await loadStatus();
  await loadForecast(lat, lon);
  await loadAlerts(lat, lon);
  initMaps(lat, lon);
}

// ==========================================================
// ⚙️ ÉTAT DU MOTEUR
// ==========================================================
async function loadStatus() {
  const s = await fetchJSON(`${API_BASE}/status`);
  if (!s) return;
  console.log("✅ Moteur connecté :", s.status, "– zones :", s.coveredZones?.length);
}

// ==========================================================
// 🌦️ PRÉVISIONS (locales, nationales, 7 jours)
// ==========================================================
async function loadForecast(lat, lon) {
  const local = document.getElementById("local-forecast");
  const national = document.getElementById("national-forecast");
  const week = document.getElementById("forecast-7days");

  local.innerHTML = national.innerHTML = week.innerHTML = "Chargement…";

  const localData = await fetchJSON(`${API_BASE}/forecast/local?lat=${lat}&lon=${lon}`);
  const nationalData = await fetchJSON(`${API_BASE}/forecast/national?lat=${lat}&lon=${lon}`);
  const weekData = await fetchJSON(`${API_BASE}/forecast/7days?lat=${lat}&lon=${lon}`);

  if (localData)
    local.innerHTML = `<b>${localData.summary}</b><br>🌡 ${localData.temperature_min} °C / ${localData.temperature_max} °C<br>💨 ${localData.wind} km/h`;
  else local.innerHTML = "❌ Erreur prévisions locales";

  if (nationalData)
    national.innerHTML = `<b>${nationalData.country}</b><br>🌡 ${nationalData.temperature_min} °C / ${nationalData.temperature_max} °C<br>🌧 ${nationalData.precipitation} mm`;
  else national.innerHTML = "❌ Erreur prévisions nationales";

  if (Array.isArray(weekData))
    week.innerHTML = weekData
      .map(
        (d) =>
          `<div>📅 ${d.date} – ${d.summary || ""} – ${d.temperature_min} °C / ${d.temperature_max} °C</div>`
      )
      .join("");
  else week.innerHTML = "❌ Erreur prévisions 7 jours";
}

// ==========================================================
// ⚠️ ALERTES
// ==========================================================
async function loadAlerts(lat, lon) {
  const alertsEl = document.getElementById("alerts");
  const data = await fetchJSON(`${API_BASE}/alerts`);
  if (!data) {
    alertsEl.innerHTML = "❌ Erreur chargement alertes";
    return;
  }

  const localAlerts = data.filter(
    (a) => a.lat && Math.abs(a.lat - lat) < 5 && Math.abs(a.lon - lon) < 5
  );

  if (localAlerts.length > 0) {
    alertsEl.innerHTML = localAlerts
      .map(
        (a) =>
          `⚠️ <b>${a.zone || a.country}</b> – ${a.title || a.type || "Alerte"} (${a.level || "info"})`
      )
      .join("<br>");
  } else {
    alertsEl.innerHTML = "✅ Aucune alerte locale active";
    const warn = document.getElementById("continent-warning");
    if (warn)
      warn.innerText = "🌍 Alertes sur votre continent : consultez la carte ci-dessous.";
  }
}

// ==========================================================
// 🗺️ CARTES INTERACTIVES
// ==========================================================
let mapForecast, mapAlerts;
function initMaps(lat, lon) {
  if (!mapForecast) {
    mapForecast = L.map("map-forecast").setView([lat, lon], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapForecast);
  } else mapForecast.setView([lat, lon], 4);

  if (!mapAlerts) {
    mapAlerts = L.map("map-alerts").setView([lat, lon], 3);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapAlerts);
  } else mapAlerts.setView([lat, lon], 3);

  L.circle([lat, lon], { color: "cyan", radius: 100000 })
    .addTo(mapForecast)
    .bindPopup("Votre position");
}

// ==========================================================
// 💬 CHAT PUBLIC (Cohere IA)
// ==========================================================
async function askJean() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (!msg) return;

  const chatBox = document.getElementById("chatMessages");
  const userMsg = document.createElement("div");
  userMsg.className = "msg-user";
  userMsg.textContent = "Vous : " + msg;
  chatBox.appendChild(userMsg);
  input.value = "";

  const res = await fetchJSON(`${API_BASE}/cohere`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: msg }),
  });

  const botMsg = document.createElement("div");
  botMsg.className = "msg-bot";
  botMsg.textContent = "J.E.A.N : " + (res?.reply || "Pas de réponse");
  chatBox.appendChild(botMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

  const avatar = document.getElementById("chatAvatar");
  if (avatar && res?.avatar) avatar.src = `/avatars/jean-${res.avatar}.png`;
}
