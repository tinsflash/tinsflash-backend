// app.js
// Gestion de l'index public TINSFLASH

// 🎬 Fonction d'affichage d'une icône animée selon la condition météo
function renderWeatherIcon(condition = "") {
  const c = condition.toLowerCase();
  if (c.includes("soleil") || c.includes("sun")) {
    return `<lottie-player class="lottie-icon" src="https://assets2.lottiefiles.com/packages/lf20_q6yccw6s.json" background="transparent" speed="1" loop autoplay></lottie-player>`;
  }
  if (c.includes("nuage") || c.includes("cloud")) {
    return `<lottie-player class="lottie-icon" src="https://assets2.lottiefiles.com/packages/lf20_puciaact.json" background="transparent" speed="1" loop autoplay></lottie-player>`;
  }
  if (c.includes("pluie") || c.includes("rain")) {
    return `<lottie-player class="lottie-icon" src="https://assets2.lottiefiles.com/packages/lf20_jmgekfqg.json" background="transparent" speed="1" loop autoplay></lottie-player>`;
  }
  if (c.includes("neige") || c.includes("snow")) {
    return `<lottie-player class="lottie-icon" src="https://assets2.lottiefiles.com/packages/lf20_rsa2lqdz.json" background="transparent" speed="1" loop autoplay></lottie-player>`;
  }
  if (c.includes("orage") || c.includes("storm") || c.includes("thunder")) {
    return `<lottie-player class="lottie-icon" src="https://assets2.lottiefiles.com/packages/lf20_hqfyzxey.json" background="transparent" speed="1" loop autoplay></lottie-player>`;
  }
  return `<lottie-player class="lottie-icon" src="https://assets2.lottiefiles.com/packages/lf20_puciaact.json" background="transparent" speed="1" loop autoplay></lottie-player>`;
}

// 📍 Charger prévisions par adresse
async function loadForecastFromAddress() {
  const address = document.getElementById("address").value;
  if (!address) return alert("Veuillez entrer une adresse.");

  try {
    const res = await fetch(`/api/forecast?address=${encodeURIComponent(address)}`);
    const data = await res.json();
    renderForecast(data);
  } catch (err) {
    console.error("Erreur API Forecast:", err);
    document.getElementById("today-forecast").innerText = "❌ Erreur de récupération";
  }
}

// 📡 Fonction d’affichage des prévisions
function renderForecast(data) {
  if (!data) return;

  // --- Aujourd'hui ---
  const today = data.days?.[0];
  if (today) {
    document.getElementById("today-forecast").innerHTML = `
      <div style="text-align:center">
        ${renderWeatherIcon(today.condition || "")}
        <h3>${today.date}</h3>
        <p><strong>${today.condition}</strong></p>
        <p>🌡️ ${today.temp_min}°C / ${today.temp_max}°C</p>
      </div>
    `;
  }

  // --- 7 jours ---
  let daysHTML = "";
  (data.days || []).slice(0, 7).forEach(day => {
    daysHTML += `
      <div class="forecast-item">
        ${renderWeatherIcon(day.condition || "")}
        <strong>${day.date}</strong><br>
        ${day.condition}<br>
        🌡️ ${day.temp_min}°C / ${day.temp_max}°C
      </div>
    `;
  });
  document.getElementById("days-container").innerHTML = daysHTML;

  // --- Bulletin texte ---
  document.getElementById("forecast-text").innerText =
    data.bulletin || "❌ Bulletin météo non disponible.";
}

// ⚠️ Charger les alertes
async function loadAlerts() {
  try {
    const res = await fetch("/api/alerts");
    const alerts = await res.json();
    if (!alerts || alerts.length === 0) {
      document.getElementById("alerts-content").innerText = "✅ Aucune alerte active.";
      return;
    }
    document.getElementById("alerts-content").innerHTML = alerts.map(a => `
      <div class="alert">
        <strong>${a.zone}</strong> : ${a.type} <br>
        ⏰ ${a.start} → ${a.end}<br>
        ${a.description}
      </div>
    `).join("");
  } catch (err) {
    console.error("Erreur API Alerts:", err);
    document.getElementById("alerts-content").innerText = "❌ Erreur chargement alertes";
  }
}

// 🎙️ Charger le podcast météo
async function loadPodcast() {
  try {
    const res = await fetch("/api/podcast");
    const data = await res.json();
    if (data?.url) {
      document.getElementById("podcast-container").innerHTML = `
        <audio controls>
          <source src="${data.url}" type="audio/mpeg">
          Votre navigateur ne supporte pas l’audio.
        </audio>
      `;
    } else {
      document.getElementById("podcast-container").innerText = "❌ Podcast non disponible.";
    }
  } catch (err) {
    console.error("Erreur API Podcast:", err);
    document.getElementById("podcast-container").innerText = "❌ Erreur podcast";
  }
}

// 🚀 Initialisation auto au chargement
window.addEventListener("DOMContentLoaded", async () => {
  await loadAlerts();
  await loadPodcast();

  // Essayer géolocalisation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`/api/forecast?lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        renderForecast(data);
      } catch (err) {
        console.error("Erreur géoloc forecast:", err);
        document.getElementById("today-forecast").innerText = "❌ Erreur géolocalisation";
      }
    }, err => {
      console.warn("⚠️ Géolocalisation refusée, utilisez l’adresse manuelle.");
    });
  }
});
