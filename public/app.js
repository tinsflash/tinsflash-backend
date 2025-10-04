// ---------------------------
// app.js - TINSFLASH Front
// ---------------------------

// 🌍 Obtenir position GPS (fallback adresse manuelle)
async function getLocationOrAddress() {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        async () => {
          const addr = prompt("❌ Géolocalisation refusée.\nEntrez votre ville/pays (ex: Paris, FR) :");
          resolve({ address: addr });
        }
      );
    } else {
      const addr = prompt("Entrez votre ville/pays (ex: Paris, FR) :");
      resolve({ address: addr });
    }
  });
}

// 🎨 Avatar J.E.A.N dynamique
function updateJeanAvatar(type = "default") {
  const player = document.getElementById("jean-player");
  if (!player) return;

  const map = {
    "default": "/avatars/jean-default.json",
    "sun": "/avatars/jean-sun.json",
    "rain": "/avatars/jean-rain.json",
    "snow": "/avatars/jean-snow.json",
    "storm": "/avatars/jean-storm.json",
    "alert": "/avatars/jean-alert.json"
  };

  player.load(map[type] || map["default"]);
}

// 🎭 Appliquer icône/avatar selon condition météo
function applyForecastIcon(condition) {
  condition = (condition || "").toLowerCase();
  if (condition.includes("sun") || condition.includes("clear")) updateJeanAvatar("sun");
  else if (condition.includes("rain")) updateJeanAvatar("rain");
  else if (condition.includes("snow")) updateJeanAvatar("snow");
  else if (condition.includes("storm") || condition.includes("thunder")) updateJeanAvatar("storm");
  else updateJeanAvatar("default");
}

// 📊 Charger prévisions météo
async function loadForecast(location = {}) {
  try {
    let url = "";
    if (location.lat && location.lon) {
      url = `/api/superforecast`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(location)
      });
      var data = await res.json();
    } else if (location.address) {
      url = `/api/forecast/${encodeURIComponent(location.address)}`;
      const res = await fetch(url);
      var data = await res.json();
    } else {
      return;
    }

    if (!data || data.error) {
      document.getElementById("today-forecast").innerText = "❌ Erreur de récupération.";
      return;
    }

    // Jour actuel
    const today = data.days?.[0];
    if (today) {
      document.getElementById("today-forecast").innerHTML = `
        <h3>${today.date}</h3>
        <p>${today.condition}, ${today.temp_min}°C / ${today.temp_max}°C</p>
      `;
      applyForecastIcon(today.condition);
    }

    // 7 jours
    let html = "";
    (data.days || []).forEach((d) => {
      html += `
        <div class="forecast-item">
          <p><b>${d.date}</b><br>${d.condition}<br>${d.temp_min}° / ${d.temp_max}°</p>
        </div>
      `;
    });
    document.getElementById("days-container").innerHTML = html;

    // Bulletin texte
    const txt = await fetch("/api/textgen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Fais un bulletin météo clair basé sur les prévisions actuelles." })
    });
    const tdata = await txt.json();
    document.getElementById("forecast-text").innerText = tdata.reply || "❌ Pas de bulletin.";
  } catch (err) {
    console.error("Forecast error:", err);
  }
}

// 🚨 Charger alertes
async function loadAlerts() {
  try {
    const res = await fetch("/api/alerts");
    const data = await res.json();

    const el = document.getElementById("alerts-content");
    if (!data || data.length === 0) {
      el.innerText = "✅ Aucune alerte active.";
      return;
    }

    el.innerHTML = data.map(
      (a) => `<div class="alert"><b>${a.country || a.continent}</b>: ${a.title} (${a.level}%)</div>`
    ).join("");

    // Si alerte forte → avatar passe en "alert"
    if (data.some(a => a.level >= 80)) {
      updateJeanAvatar("alert");
    }
  } catch (err) {
    console.error("Alerts error:", err);
  }
}

// 🔔 Notifications Push
async function subscribeNotif() {
  if (!("Notification" in window)) {
    alert("❌ Ce navigateur ne supporte pas les notifications.");
    return;
  }
  const perm = await Notification.requestPermission();
  if (perm !== "granted") {
    document.getElementById("notif-status").innerText = "⚠️ Notifications refusées.";
    return;
  }

  // Exemple simple (à brancher sur ton pushService)
  await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: "browser" })
  });

  document.getElementById("notif-status").innerText = "✅ Notifications activées.";
}

function unsubscribeNotif() {
  document.getElementById("notif-status").innerText = "🔕 Notifications désactivées.";
}

// 💬 Chat Cohere (J.E.A.N.)
function setupJeanChat() {
  const avatar = document.getElementById("avatar-jean");
  const chat = document.getElementById("chat-jean");
  const sendBtn = document.getElementById("jean-send");
  const input = document.getElementById("jean-input");
  const messages = document.getElementById("chat-messages");

  avatar.addEventListener("click", () => {
    chat.style.display = (chat.style.display === "flex") ? "none" : "flex";
  });

  sendBtn.onclick = async () => {
    const msg = input.value.trim();
    if (!msg) return;
    messages.innerHTML += `<div><b>Vous:</b> ${msg}</div>`;

    const res = await fetch("/api/jean", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg })
    });
    const data = await res.json();

    messages.innerHTML += `<div style="color:#0077cc;"><b>J.E.A.N:</b> ${data.reply}</div>`;
    input.value = "";
    messages.scrollTop = messages.scrollHeight;
  };
}

// 🚀 Initialisation
(async function init() {
  const loc = await getLocationOrAddress();
  await loadForecast(loc);
  await loadAlerts();
  setupJeanChat();
  updateJeanAvatar("default");
})();
