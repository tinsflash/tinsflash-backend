// public/admin.js

// -------------------------
// 🌍 Fonction : lancer un Run SuperForecast
// -------------------------
async function launchRun() {
  try {
    logMessage("🚀 Lancement du Run SuperForecast en cours...");

    const response = await fetch("/api/supercalc/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: 50.5, lon: 4.7 }) // Exemple Bruxelles
    });

    if (!response.ok) {
      throw new Error("Erreur API " + response.status);
    }

    const data = await response.json();
    logMessage("✅ Run terminé avec succès");
    if (data.logs) {
      data.logs.forEach((line) => logMessage(line));
    }
    if (data.jeanResponse) {
      logMessage("🤖 Réponse J.E.A.N.: " + (data.jeanResponse.text || data.jeanResponse));
    }
  } catch (err) {
    logMessage("❌ Erreur lancement Run: " + err.message);
  }
}

// -------------------------
// 🌍 Fonction : afficher logs
// -------------------------
function logMessage(message) {
  const logs = document.getElementById("logs");
  logs.textContent += message + "\n";
  logs.scrollTop = logs.scrollHeight;
}

// -------------------------
// 🌍 Charger les alertes
// -------------------------
async function loadAlerts() {
  try {
    const response = await fetch("/api/alerts");
    const alerts = await response.json();
    document.getElementById("alerts").textContent = JSON.stringify(alerts, null, 2);
  } catch (err) {
    document.getElementById("alerts").textContent = "❌ Erreur chargement alertes: " + err.message;
  }
}

// -------------------------
// 🌍 Charger les utilisateurs
// -------------------------
async function loadUsers() {
  try {
    const response = await fetch("/api/admin/users");
    const users = await response.json();
    document.getElementById("users").textContent = JSON.stringify(users, null, 2);
  } catch (err) {
    document.getElementById("users").textContent = "❌ Erreur chargement utilisateurs: " + err.message;
  }
}

// -------------------------
// 🌍 Initialisation
// -------------------------
window.onload = () => {
  loadAlerts();
  loadUsers();
};
