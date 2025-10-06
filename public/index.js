// index.js
let coords = null;

document.getElementById("soundToggle").onclick = () => {
  const v = document.getElementById("introJean");
  v.muted = !v.muted;
};

document.getElementById("btnGeo").onclick = () => {
  navigator.geolocation.getCurrentPosition(
    pos => {
      coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      document.getElementById("zoneStatus").textContent = `Position détectée: ${coords.lat.toFixed(2)}, ${coords.lon.toFixed(2)}`;
      loadStatus();
    },
    () => alert("Impossible d’obtenir la géolocalisation.")
  );
};

document.getElementById("manualAddress").addEventListener("change", e => {
  document.getElementById("zoneStatus").textContent = `Adresse encodée: ${e.target.value}`;
  loadStatus();
});

// === Récupération statut moteur ===
async function loadStatus() {
  const res = await fetch("/api/status");
  const data = await res.json();
  renderCoverage(data.coveredZones);
  renderAlerts(data.alerts);
  renderForecast(data.finalReport);
}

// === Cartes ===
let map1, map2;
function renderCoverage(points) {
  if (!map1) {
    map1 = L.map("mapCoverage").setView([50, 5], 3);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map1);
  }
  points.forEach(p => {
    L.circleMarker([p.lat, p.lon], { color: "lime", radius: 3 }).addTo(map1);
  });
}

function renderAlerts(alerts) {
  if (!map2) {
    map2 = L.map("mapAlerts").setView([20, 0], 2);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map2);
  }
  const c = document.getElementById("alertsList");
  c.innerHTML = "";
  alerts.forEach(a => {
    const div = document.createElement("div");
    div.textContent = `⚠️ ${a.title || "Alerte"} (${a.level || "N/A"})`;
    c.appendChild(div);
  });
}

// === Prévisions ===
function renderForecast(finalReport) {
  const zone = document.getElementById("forecastData");
  zone.textContent = "";
  if (!finalReport) {
    zone.textContent = "Prévisions en cours de mise à jour.";
    return;
  }
  for (const country in finalReport) {
    const p = document.createElement("p");
    p.textContent = `${country}: ${finalReport[country].summary || "Données en cours."}`;
    zone.appendChild(p);
  }
}

// === Chat Cohere ===
document.getElementById("sendChat").onclick = async () => {
  const q = document.getElementById("chatInput").value;
  if (!q) return;
  const res = await fetch("/api/cohere", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: q }),
  });
  const data = await res.json();
  document.getElementById("chatInput").value = "";
  document.getElementById("chatAvatar").src = data.avatar;
  alert("J.E.A.N: " + data.reply);
};

window.onload = loadStatus;
