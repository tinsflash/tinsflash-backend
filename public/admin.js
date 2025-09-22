// --- Fetch Logs ---
async function fetchLogs() {
  try {
    const res = await fetch("/api/admin/logs");
    const data = await res.json();
    document.getElementById("logs").textContent =
      (data.logs && data.logs.join("\n")) || "Aucun log disponible.";
  } catch (err) {
    document.getElementById("logs").textContent = "❌ Erreur chargement logs";
  }
}

// --- Fetch Alerts ---
async function fetchAlerts() {
  try {
    const res = await fetch("/api/alerts");
    const data = await res.json();
    document.getElementById("alerts").textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("alerts").textContent = "❌ Erreur chargement alertes";
  }
}

// --- Fetch Users ---
async function fetchUsers() {
  try {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    document.getElementById("users").textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById("users").textContent = "❌ Erreur chargement utilisateurs";
  }
}

// --- Launch Run ---
async function launchRun() {
  try {
    const res = await fetch("/api/supercalc/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: 50.5, lon: 4.7 }), // centre Europe
    });
    const data = await res.json();
    alert("✅ Run lancé – suivez les logs !");
    console.log("Run:", data);
    fetchLogs();
  } catch (err) {
    alert("❌ Erreur lancement Run");
  }
}

// --- Refresh Index ---
async function refreshIndex() {
  try {
    const res = await fetch("/api/admin/refresh-index", { method: "POST" });
    const data = await res.json();
    alert("✅ Index rafraîchi !");
    console.log("Index:", data);
  } catch (err) {
    alert("❌ Erreur rafraîchissement index");
  }
}

// --- Bulletin ---
async function saveBulletin() {
  const txt = document.getElementById("bulletin").value;
  try {
    const res = await fetch("/api/admin/bulletin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: txt }),
    });
    const data = await res.json();
    alert("✅ Bulletin sauvegardé !");
    console.log("Bulletin:", data);
  } catch (err) {
    alert("❌ Erreur sauvegarde bulletin");
  }
}

// --- Chat ---
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
    log.innerHTML += `<div class="chat-message jean">🤖 J.E.A.N.: ${data.reply || "..."}</div>`;
    log.scrollTop = log.scrollHeight;
  } catch {
    log.innerHTML += `<div class="chat-message jean">❌ Erreur réponse JEAN</div>`;
  }
}

// --- Auto Refresh ---
setInterval(fetchLogs, 5000);
setInterval(fetchAlerts, 10000);
setInterval(fetchUsers, 15000);

// Initial Load
fetchLogs();
fetchAlerts();
fetchUsers();
