// public/admin.js

async function launchRun() {
  try {
    const res = await fetch("/api/supercalc/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: 50.5, lon: 4.7 }), // Ex: Belgique
    });
    const data = await res.json();
    alert("✅ Run lancé, surveillez les logs !");
    loadLogs();
  } catch (err) {
    alert("❌ Erreur lancement run: " + err.message);
  }
}

async function loadLogs() {
  try {
    const res = await fetch("/api/admin/logs");
    const logs = await res.json();
    document.getElementById("logs").textContent = logs.join("\n");
  } catch {
    document.getElementById("logs").textContent =
      "⚠️ Impossible de charger les logs";
  }
}

async function loadAlerts() {
  try {
    const res = await fetch("/api/alerts");
    const alerts = await res.json();
    document.getElementById("alerts").textContent = JSON.stringify(alerts, null, 2);
  } catch {
    document.getElementById("alerts").textContent =
      "⚠️ Impossible de charger les alertes";
  }
}

async function loadUsers() {
  try {
    const res = await fetch("/api/admin/users");
    const users = await res.json();
    document.getElementById("users").textContent = JSON.stringify(users, null, 2);
  } catch {
    document.getElementById("users").textContent =
      "⚠️ Impossible de charger les utilisateurs";
  }
}

async function askJean() {
  const message = document.getElementById("jeanInput").value;
  if (!message) return;
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    document.getElementById("jeanChat").textContent +=
      "\n👤: " + message + "\n🤖: " + data.reply;
    document.getElementById("jeanInput").value = "";
  } catch {
    document.getElementById("jeanChat").textContent +=
      "\n⚠️ JEAN n’est pas disponible.";
  }
}

async function loadBulletins() {
  try {
    const res = await fetch("/api/admin/bulletins");
    const bulletins = await res.json();
    document.getElementById("bulletins").value = JSON.stringify(bulletins, null, 2);
  } catch {
    document.getElementById("bulletins").value =
      "⚠️ Impossible de charger les bulletins.";
  }
}

async function saveBulletins() {
  try {
    const bulletins = JSON.parse(document.getElementById("bulletins").value);
    await fetch("/api/admin/bulletins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bulletins),
    });
    alert("✅ Bulletins sauvegardés");
  } catch (err) {
    alert("❌ Erreur sauvegarde bulletins: " + err.message);
  }
}

// Auto-refresh
setInterval(() => {
  loadLogs();
  loadAlerts();
  loadUsers();
}, 5000);

window.onload = () => {
  loadLogs();
  loadAlerts();
  loadUsers();
  loadBulletins();
};
