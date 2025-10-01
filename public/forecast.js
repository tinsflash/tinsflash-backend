// === Utilitaires ===
function createForecastCard(day, icon, tempMin, tempMax, desc) {
  return `
    <div class="forecast-card">
      <h4>${day}</h4>
      <img src="https://openweathermap.org/img/wn/${icon || "01d"}@2x.png" alt="">
      <p><strong>${tempMin}°C / ${tempMax}°C</strong></p>
      <p>${desc}</p>
    </div>
  `;
}

// === Charger prévisions ===
async function loadForecast(lat, lon, country = "BE", region = "Wallonie") {
  try {
    const res = await fetch("/api/superforecast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lon, country, region })
    });
    const data = await res.json();

    // Prévisions locales
    const localDiv = document.getElementById("localForecast");
    localDiv.innerHTML = "";
    if (data?.local?.forecast) {
      data.local.forecast.forEach(f => {
        localDiv.innerHTML += createForecastCard(
          f.day || "Jour",
          f.icon,
          f.temp_min,
          f.temp_max,
          f.description || "Prévisions locales"
        );
      });
    } else {
      localDiv.innerHTML = "<p>❌ Aucune prévision locale disponible.</p>";
    }

    // Prévisions nationales
    const natDiv = document.getElementById("nationalForecast");
    natDiv.innerHTML = "";
    if (data?.national?.forecast) {
      data.national.forecast.forEach(f => {
        natDiv.innerHTML += createForecastCard(
          f.day || "Jour",
          f.icon,
          f.temp_min,
          f.temp_max,
          f.description || "Prévisions nationales"
        );
      });
    } else {
      natDiv.innerHTML = "<p>❌ Aucune prévision nationale disponible.</p>";
    }

  } catch (err) {
    console.error("Erreur prévisions:", err);
    document.getElementById("localForecast").innerHTML = "<p>❌ Erreur chargement prévisions.</p>";
    document.getElementById("nationalForecast").innerHTML = "<p>❌ Erreur chargement prévisions.</p>";
  }
}

// === Géolocalisation automatique ===
function initGeolocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        loadForecast(lat, lon);
      },
      err => {
        console.warn("⚠️ Géoloc refusée:", err);
        // Défaut : Bruxelles
        loadForecast(50.8503, 4.3517, "BE", "Bruxelles");
      }
    );
  } else {
    loadForecast(50.8503, 4.3517, "BE", "Bruxelles");
  }
}

// === Recherche manuelle adresse ===
async function searchAddress() {
  const address = document.getElementById("addressInput").value;
  if (!address) return;

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
    const data = await res.json();
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      loadForecast(lat, lon, data[0].display_name.split(",").pop().trim());
    } else {
      alert("Adresse non trouvée ❌");
    }
  } catch (err) {
    alert("Erreur recherche adresse: " + err.message);
  }
}

// === Alertes météo ===
async function loadAlerts() {
  try {
    const res = await fetch("/api/alerts");
    const data = await res.json();

    const container = document.getElementById("alertsContainer");
    container.innerHTML = "";

    if (!data || data.length === 0) {
      container.innerHTML = "<p>✅ Aucune alerte active.</p>";
      return;
    }

    data.forEach(alert => {
      const card = document.createElement("div");
      card.style.padding = "1rem";
      card.style.borderRadius = "8px";
      card.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
      card.style.background = "#fff";

      let color = "#f59e0b"; // orange par défaut
      if (alert.reliability >= 90) color = "#ef4444"; // rouge
      else if (alert.reliability < 70) color = "#22c55e"; // vert

      card.innerHTML = `
        <strong style="color:${color}; font-size:1.1rem;">${alert.type || "Alerte"}</strong><br>
        📍 ${alert.country || alert.zone || "Zone inconnue"}<br>
        ⏱️ ${alert.start || "?"} → ${alert.end || "?"}<br>
        ⚡ Intensité : ${alert.intensity || "?"}<br>
        🔢 Fiabilité : ${alert.reliability || "?"}%
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Erreur alertes:", err);
    document.getElementById("alertsContainer").innerHTML = "<p>❌ Erreur chargement alertes.</p>";
  }
}

// Init au chargement
document.addEventListener("DOMContentLoaded", () => {
  initGeolocation();
  loadAlerts();
  setInterval(loadAlerts, 60000); // rafraîchit toutes les 60s
});
