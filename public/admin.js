// public/admin.js

async function fetchLogs() {
  try {
    const res = await fetch("/api/admin/logs");
    const data = await res.json();
    const logs = document.getElementById("logs");
    logs.textContent = (data.logs || []).join("\n");
  } catch (err) {
    document.getElementById("logs").textContent = "❌ Erreur chargement logs";
  }
}

async function fetchAlerts() {
  try {
    const res = await fetch("/api/alerts");
    const data = await res.json();
    document.getElementById("alerts").textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("alerts").textContent = "❌ Erreur chargement alertes";
  }
}

async function fetchUsers() {
  try {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    document.getElementById("users").textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("users").textContent = "❌ Erreur chargement utilisateurs";
  }
}

async function launchRun() {
  try {
    const res = await fetch("/api/supercalc/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: 50.5, lon: 4.7 }), // exemple Belgique
    });
    const data = await res.json();
    alert("✅ Run lancé – vérifiez les logs !");
    console.log(data);
  } catch (err) {
    alert("❌ Erreur lancement Run");
  }
}

async function sendChat() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (!msg) return;

  const log = document.getElementById("chatLog");
  log.innerHTML += `<div class="chat-message admin">👤 Admin: ${msg}</div>`;
  input.value = "";

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg }),
    });
    const data = await res.json();
    const reply = data.reply || JSON.stringify(data);
    log.innerHTML += `<div class="chat-message jean">🤖 J.E.A.N.: ${reply}</div>`;
    log.scrollTop = log.scrollHeight;
  } catch (err) {
    log.innerHTML += `<div class="chat-message jean">❌ Erreur réponse JEAN</div>`;
  }
}

// Rafraîchissement auto
setInterval(fetchLogs, 5000);
setInterval(fetchAlerts, 7000);
setInterval(fetchUsers, 10000);

// Init
fetchLogs();
fetchAlerts();
fetchUsers();
