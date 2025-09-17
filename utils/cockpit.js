// 🌍 API Backend
const API_BASE = "https://tinsflash-backend.onrender.com";

// Chargement alertes
async function loadAlerts() {
  const container = document.getElementById("alerts");
  container.innerHTML = "Chargement...";
  try {
    const res = await fetch(`${API_BASE}/alerts`);
    const data = await res.json();
    container.innerHTML = "";
    data.alerts.forEach(a => {
      container.innerHTML += `
        <div>
          ⚠️ ${a.type} (${a.level.toUpperCase()}) – Fiabilité: ${a.reliability}%
          <br><em>${a.region}</em>
        </div>
      `;
    });
  } catch (err) {
    container.innerHTML = "❌ Erreur alertes";
  }
}

// Chat IA J.E.A.N
async function sendMessage() {
  const input = document.getElementById("chat-input");
  const box = document.getElementById("chat-box");
  const message = input.value.trim();
  if (!message) return;

  box.innerHTML += `<div><b>Vous:</b> ${message}</div>`;
  input.value = "";

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    box.innerHTML += `<div><b>J.E.A.N:</b> ${data.reply}</div>`;
    box.scrollTop = box.scrollHeight;
  } catch (err) {
    box.innerHTML += `<div>❌ Erreur IA</div>`;
  }
}

// Auto-load
window.onload = () => {
  loadAlerts();
};
