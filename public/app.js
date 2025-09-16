// =========================
// Transition entre pages
// =========================
function transitionTo(url) {
  const body = document.body;
  body.classList.add("fade-exit");
  setTimeout(() => {
    window.location.href = url;
  }, 500);
}

// =========================
// Mode Cockpit
// =========================
function toggleCockpit() {
  document.body.classList.toggle("cockpit");
  alert("🛰️ Mode Cockpit activé !");
}

// =========================
// Génération des podcasts
// =========================
async function generatePodcast(type) {
  try {
    const res = await fetch(`/podcast/generate?type=${type}`);
    const data = await res.json();

    let containerId = "";
    if (type.includes("premium")) containerId = "podcast-premium";
    else if (type.includes("proplus")) containerId = "podcast-proplus";
    else if (type.includes("pro")) containerId = "podcast-pro";
    else containerId = "podcast-free";

    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <h3>Prévision générée :</h3>
        <p>${data.forecast}</p>
        <audio controls>
          <source src="${data.audioUrl}" type="audio/mpeg">
          Votre navigateur ne supporte pas l'audio.
        </audio>
      `;
    }
  } catch (err) {
    console.error("Erreur podcast:", err);
    alert("⚠️ Impossible de générer le podcast.");
  }
}

// =========================
// Mode Tocsin
// =========================
function activateTocsin() {
  alert("🚨 Mode Tocsin activé : Surveillance en cours...");
  // TODO: connecter capteurs physiques + API alertes
}

// =========================
// Chargement auto prévisions (page index ou premium/pro/pro+)
// =========================
document.addEventListener("DOMContentLoaded", async () => {
  const forecastContainer = document.getElementById("forecast-premium")
    || document.getElementById("forecast-pro")
    || document.getElementById("forecast-proplus")
    || document.getElementById("forecast-container");

  if (forecastContainer && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      try {
        const res = await fetch(`/forecast?lat=${lat}&lon=${lon}`);
        const data = await res.json();
        const list = data.data?.list?.slice(0, 5) || [];

        let html = "<ul>";
        list.forEach(item => {
          const date = new Date(item.dt * 1000).toLocaleString();
          const temp = item.main.temp.toFixed(1);
          const desc = item.weather[0].description;
          html += `<li>${date} → 🌡️ ${temp}°C, ${desc}</li>`;
        });
        html += "</ul>";

        forecastContainer.innerHTML = html;
      } catch (err) {
        forecastContainer.innerHTML = "<p>⚠️ Erreur récupération météo</p>";
      }
    });
  }
});
