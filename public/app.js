// -------------------------
// 🌍 app.js
// Frontend universel TINSFLASH
// Connecte toutes les pages au backend Render
// -------------------------

const API_BASE = "https://tinsflash-backend.onrender.com/api"; // adapte si besoin

document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (path.includes("index.html") || path === "/") loadIndex();
  if (path.includes("premium.html")) loadPremium();
  if (path.includes("pro.html")) loadPro();
  if (path.includes("proplus.html")) loadProPlus();
  if (path.includes("alerts.html")) loadAlerts();
  if (path.includes("account.html")) loadAccount();
  if (path.includes("admin-pp.html")) loadAdmin();
});

// -------------------------
// 🏠 Index (Gratuit)
// -------------------------
async function loadIndex() {
  try {
    // Prévisions locales
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const res = await fetch(`${API_BASE}/forecast/local?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
      const data = await res.json();

      document.querySelector("#local-widget .weather-temp").textContent = `${data.combined.temperature}°C`;
      document.querySelector("#local-widget .weather-desc").textContent = data.combined.description;
      document.querySelector("#local-widget .weather-icon").textContent = data.combined.icone;
    });

    // Prévisions nationales (Belgique par défaut)
    const resNat = await fetch(`${API_BASE}/forecast/national?country=BE`);
    const nat = await resNat.json();
    document.getElementById("national-content").innerHTML =
      `${nat.combined.description}, ${nat.combined.temperature}°C`;

    // Prévisions 7 jours
    const res7 = await fetch(`${API_BASE}/forecast/7days?lat=50.5&lon=4.5`);
    const data7 = await res7.json();
    document.getElementById("days-container").innerHTML = data7.days.map(d => `
      <div class="day-card">
        <div class="weather-icon">${d.icone}</div>
        <strong>${d.jour}</strong><br>
        ${d.temperature_min}°C / ${d.temperature_max}°C
      </div>
    `).join("");

    // Radar
    const resRadar = await fetch(`${API_BASE}/radar`);
    const radarData = await resRadar.json();
    document.getElementById("radar-content").innerHTML =
      `<img src="${radarData.radarUrl}" alt="Radar" />`;

    // Alertes
    const resAlerts = await fetch(`${API_BASE}/alerts`);
    const alertData = await resAlerts.json();
    document.getElementById("alerts-local").innerHTML =
      alertData.local?.map(a => `⚠️ ${a.type} (${a.reliability}%)`).join("<br>") || "Aucune alerte";
    document.getElementById("alerts-world").innerHTML =
      alertData.world?.map(a => `🌍 ${a.type} (${a.reliability}%)`).join("<br>") || "Aucune alerte";

    // Podcasts gratuits
    document.getElementById("podcast-free").textContent =
      "🎧 Podcasts gratuits matin & soir – auto-générés.";

    // IA J.E.A.N gratuite
    document.getElementById("ai-send")?.addEventListener("click", async () => {
      const input = document.getElementById("ai-input").value;
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input })
      });
      const reply = await res.json();
      document.getElementById("ai-response").textContent = reply.text;
    });

  } catch (err) {
    console.error("Erreur index:", err);
  }
}

// -------------------------
// 🌟 Premium
// -------------------------
async function loadPremium() {
  try {
    const res = await fetch(`${API_BASE}/forecast/national?country=BE`);
    const data = await res.json();
    document.getElementById("premium-forecast").textContent =
      `${data.combined.description}, ${data.combined.temperature}°C`;

    // Podcasts Premium
    const resPod = await fetch(`${API_BASE}/podcast/generate?type=premium`);
    const pod = await resPod.json();
    document.getElementById("podcast-premium").textContent = `🎧 ${pod.title}`;

    // IA Premium
    document.getElementById("ai-send-premium")?.addEventListener("click", async () => {
      const input = document.getElementById("ai-input-premium").value;
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `[Premium] ${input}` })
      });
      const reply = await res.json();
      document.getElementById("ai-response-premium").textContent = reply.text;
    });
  } catch (err) {
    console.error("Erreur premium:", err);
  }
}

// -------------------------
// 💼 Pro
// -------------------------
async function loadPro() {
  try {
    document.getElementById("salage-data").textContent = "Prévisions verglas disponibles";
    document.getElementById("agri-data").textContent = "Agenda cultures en cours...";
    document.getElementById("flood-data").textContent = "Risque inondation calculé...";
    document.getElementById("heat-data").textContent = "Canicule surveillée...";
  } catch (err) {
    console.error("Erreur pro:", err);
  }
}

// -------------------------
// 🚀 Pro+
// -------------------------
async function loadProPlus() {
  try {
    document.getElementById("models-data").textContent = "Fusion multi-modèles IA + satellites";
    document.getElementById("aero-data").textContent = "Prévisions aviation & spatial actives";
    document.getElementById("ai-scientific").textContent = "IA scientifique prête";
  } catch (err) {
    console.error("Erreur pro+:", err);
  }
}

// -------------------------
// ⚠️ Alertes
// -------------------------
async function loadAlerts() {
  try {
    const resAlerts = await fetch(`${API_BASE}/alerts`);
    const alertData = await resAlerts.json();

    document.getElementById("alerts-local").innerHTML =
      alertData.local?.map(a => `⚠️ ${a.type} (${a.reliability}%)`).join("<br>") || "Aucune alerte locale";
    document.getElementById("alerts-national").innerHTML =
      alertData.national?.map(a => `🇧🇪 ${a.type} (${a.reliability}%)`).join("<br>") || "Aucune alerte nationale";
    document.getElementById("alerts-world").innerHTML =
      alertData.world?.map(a => `🌍 ${a.type} (${a.reliability}%)`).join("<br>") || "Aucune alerte mondiale";
  } catch (err) {
    console.error("Erreur alerts:", err);
  }
}

// -------------------------
// 👤 Account
// -------------------------
async function loadAccount() {
  try {
    document.getElementById("subscriptions").textContent = "Chargement abonnements...";
    document.getElementById("user-podcasts").textContent = "Historique podcasts...";
    document.getElementById("user-alerts").textContent = "Historique alertes...";
  } catch (err) {
    console.error("Erreur account:", err);
  }
}

// -------------------------
// 🛠️ Admin
// -------------------------
async function loadAdmin() {
  try {
    const resAlerts = await fetch(`${API_BASE}/alerts`);
    const data = await resAlerts.json();
    document.getElementById("alerts-review").textContent = "Alertes à valider (70–90%)";
    document.getElementById("alerts-validated").textContent = data.world?.map(a => `✅ ${a.type}`).join("<br>");
    document.getElementById("admin-podcasts").textContent = "Liste des podcasts...";
    document.getElementById("admin-codes").textContent = "Codes promo générés...";
    document.getElementById("admin-users").textContent = "Supervision abonnements...";
  } catch (err) {
    console.error("Erreur admin:", err);
  }
}
