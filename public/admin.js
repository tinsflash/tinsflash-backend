async function fetchLogs() {
  try {
    const res = await fetch("/api/logs");
    const data = await res.json();
    document.getElementById("logs").textContent =
      data.length > 0 ? data.map(l => l.message).join("\n") : "Aucun log pour l’instant.";
  } catch (err) {
    document.getElementById("logs").textContent = "❌ Erreur lors du chargement des logs.";
  }
}

async function fetchAlerts() {
  try {
    const res = await fetch("/api/alerts");
    const data = await res.json();
    document.getElementById("alerts").textContent =
      data.length > 0 ? data.map(a => `⚠️ ${a.type}: ${a.message}`).join("\n") : "Aucune alerte active.";
  } catch (err) {
    document.getElementById("alerts").textContent = "❌ Erreur lors du chargement des alertes.";
  }
}

async function fetchUsers() {
  try {
    const res = await fetch("/api/users/stats");
    const data = await res.json();
    document.getElementById("users").textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("users").textContent = "❌ Erreur lors du chargement des utilisateurs.";
  }
}

async function launchRun() {
  try {
    const res = await fetch("/api/superforecast/run", { method: "POST" });
    const data = await res.json();
    alert("🚀 SuperForecast lancé: " + data.status);
    fetchLogs(); // recharge logs
  } catch (err) {
    alert("❌ Erreur lors du lancement du run.");
  }
}

// Rafraîchissement périodique
setInterval(fetchLogs, 5000);
setInterval(fetchAlerts, 10000);
setInterval(fetchUsers, 15000);

// Premier appel
fetchLogs();
fetchAlerts();
fetchUsers();
