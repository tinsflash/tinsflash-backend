// public/admin.js

async function launchRun() {
  try {
    const res = await fetch("/api/admin/superforecast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location: { lat: 50.5, lon: 4.7 } })
    });

    const data = await res.json();
    appendLog("✅ Run lancé avec succès !");
    if (data.bulletin) {
      appendLog("📰 Bulletin généré : " + data.bulletin.summary);
    }
  } catch (err) {
    appendLog("❌ Erreur lancement Run: " + err.message);
  }
}

async function loadForecasts() {
  try {
    const res = await fetch("/api/admin/forecasts");
    const data = await res.json();
    document.getElementById("forecasts").innerText = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("forecasts").innerText = "❌ Erreur récupération prévisions";
  }
}

async function loadAlerts() {
  try {
    const res = await fetch("/api/admin/alerts");
    const data = await res.json();
    document.getElementById("alerts").innerText = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("alerts").innerText = "❌ Erreur récupération alertes";
  }
}

async function loadUsers() {
  try {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    document.getElementById("users").innerText = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("users").innerText = "❌ Erreur récupération utilisateurs";
  }
}

/**
 * 🤖 Chat avec J.E.A.N.
 */
async function sendChat() {
  const input = document.getElementById("chatInput").value;
  if (!input) return;

  appendLog("💬 Question envoyée à J.E.A.N.: " + input);

  try {
    const res = await fetch("/api/admin/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input })
    });

    const data = await res.json();
    if (data.response) {
      // La réponse contient le moteur IA utilisé
      appendLog("🤖 Réponse J.E.A.N. (" + data.response.engine + "): " + data.response.text);
    } else {
      appendLog("⚠️ Pas de réponse de J.E.A.N.");
    }
  } catch (err) {
    appendLog("❌ Erreur chat J.E.A.N.: " + err.message);
  }
}

/**
 * 📜 Append logs multi-lignes
 */
function appendLog(message) {
  const logs = document.getElementById("logs");
  logs.textContent += `[${new Date().toISOString()}] ${message}\n`;
  logs.scrollTop = logs.scrollHeight;
}

// Charger les données admin automatiquement
loadForecasts();
loadAlerts();
loadUsers();
