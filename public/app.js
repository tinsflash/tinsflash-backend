// ==============================
// APP.JS GLOBAL
// ==============================

// Transition entre pages
function transitionTo(url) {
  const body = document.body;
  body.classList.add("fade-exit");
  setTimeout(() => {
    window.location.href = url;
  }, 600);
}

// ==============================
// Bouton cockpit
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.createElement("button");
  btn.id = "cockpitToggle";
  btn.innerText = "Cockpit";
  document.body.appendChild(btn);

  btn.addEventListener("click", () => {
    document.body.classList.toggle("cockpit");
    if (document.body.classList.contains("cockpit")) {
      btn.innerText = "Quitter Cockpit";
    } else {
      btn.innerText = "Cockpit";
    }
  });
});

// ==============================
// Gestion podcasts
// ==============================
async function generatePodcast(type) {
  try {
    const res = await fetch(`/podcast/generate?type=${type}`);
    const data = await res.json();
    const player = document.getElementById("podcast-player");
    if (player) {
      player.innerHTML = `
        <h3>🎙️ Podcast généré (${type})</h3>
        <p>${data.forecast}</p>
        <audio controls src="${data.audioUrl}"></audio>
      `;
    }
  } catch (err) {
    console.error("Erreur podcast:", err);
  }
}

// ==============================
// Gestion alertes
// ==============================
async function loadAlerts() {
  try {
    const res = await fetch("/alerts");
    const data = await res.json();
    const list = document.getElementById("alerts-list");
    if (list) {
      list.innerHTML = "";
      data.alerts.forEach(alert => {
        const li = document.createElement("li");
        li.innerText = `[${alert.level.toUpperCase()}] ${alert.type} (${alert.reliability}% fiabilité) - ${alert.description}`;
        list.appendChild(li);
      });
    }
  } catch (err) {
    console.error("Erreur alertes:", err);
  }
}
