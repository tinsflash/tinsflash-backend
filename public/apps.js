// ------------------------------
// TINSFLASH - app.js
// Gestion frontend des appels API
// ------------------------------

// 🌍 Prévisions météo (Gratuit, Premium, Pro, Pro+)
async function getForecast(city, targetDiv) {
  try {
    const res = await fetch(`/forecast?city=${encodeURIComponent(city)}`);
    const data = await res.json();
    document.getElementById(targetDiv).innerHTML =
      `<h3>Prévisions pour ${city}</h3><pre>${JSON.stringify(data, null, 2)}</pre>`;
  } catch (err) {
    document.getElementById(targetDiv).innerHTML = "⚠️ Erreur prévisions météo.";
  }
}

// 🎙️ Podcasts (Free, Premium, Pro, Pro+)
async function generatePodcast(type) {
  try {
    const res = await fetch(`/podcast/generate?type=${type}`);
    const data = await res.json();
    document.getElementById("podcast-result").innerHTML = `
      <h3>Podcast ${type}</h3>
      <p>${data.forecast}</p>
      🎧 <audio controls src="${data.audioUrl}"></audio>
    `;
  } catch (err) {
    document.getElementById("podcast-result").innerHTML = "⚠️ Erreur génération podcast.";
  }
}

// ⚠️ Alertes météo
async function loadAlerts() {
  try {
    const res = await fetch("/alerts");
    const data = await res.json();
    if (document.getElementById("alerts-local")) {
      document.getElementById("alerts-local").innerHTML =
        `<pre>${JSON.stringify(data.alerts || [], null, 2)}</pre>`;
    }
    if (document.getElementById("alerts-world")) {
      document.getElementById("alerts-world").innerHTML =
        `<pre>${JSON.stringify(data.external || [], null, 2)}</pre>`;
    }
  } catch (err) {
    console.error(err);
  }
}

// 🎟️ Codes promos
async function generateCode(type) {
  try {
    const res = await fetch(`/codes/generate?type=${type}`);
    const data = await res.json();
    document.getElementById("codes-result").innerHTML =
      `<h3>Code généré :</h3><pre>${JSON.stringify(data, null, 2)}</pre>`;
  } catch (err) {
    document.getElementById("codes-result").innerHTML = "⚠️ Erreur génération code promo.";
  }
}

// 🤖 Chat J.E.A.N
async function askAI() {
  const question = document.getElementById("question").value;
  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: question })
    });
    const data = await res.json();
    document.getElementById("answer").innerHTML = `<p><strong>J.E.A.N :</strong> ${data.reply}</p>`;
  } catch (err) {
    document.getElementById("answer").innerHTML = "⚠️ Erreur IA.";
  }
}

// ------------------------------
// Gestion des formulaires par page
// ------------------------------

// Index - prévisions locales
const freeForm = document.getElementById("forecast-form");
if (freeForm) {
  freeForm.addEventListener("submit", e => {
    e.preventDefault();
    const city = document.getElementById("city").value;
    getForecast(city, "forecast-result");
  });
}

// Premium
const premiumForm = document.getElementById("premium-form");
if (premiumForm) {
  premiumForm.addEventListener("submit", e => {
    e.preventDefault();
    const city1 = document.getElementById("city1").value;
    const city2 = document.getElementById("city2").value;
    getForecast(city1, "premium-result");
    getForecast(city2, "premium-result");
  });
}

// Pro
const proForm = document.getElementById("pro-form");
if (proForm) {
  proForm.addEventListener("submit", e => {
    e.preventDefault();
    const city = document.getElementById("city").value;
    getForecast(city, "pro-result");
  });
}

// Pro+
const proplusForm = document.getElementById("proplus-form");
if (proplusForm) {
  proplusForm.addEventListener("submit", e => {
    e.preventDefault();
    const zones = document.getElementById("zones").value;
    zones.split(",").forEach(z => getForecast(z.trim(), "proplus-result"));
  });
}

// Alertes
if (document.getElementById("alerts-local") || document.getElementById("alerts-world")) {
  loadAlerts();
}

