// ---------------------------
// app.js - TINSFLASH Front
// ---------------------------

// 🌍 Obtenir position GPS (fallback adresse manuelle)
async function getLocationOrAddress() {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => {
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

// 🎭 Mapping conditions -> icône animée
function getIconByCondition(condition) {
  condition = (condition || "").toLowerCase();
  if (condition.includes("sun") || condition.includes("clear") || condition.includes("soleil")) return "/avatars/jean-sun.json";
  if (condition.includes("rain") || condition.includes("pluie")) return "/avatars/jean-rain.json";
  if (condition.includes("snow") || condition.includes("neige")) return "/avatars/jean-snow.json";
  if (condition.includes("storm") || condition.includes("orage") || condition.includes("thunder")) return "/avatars/jean-storm.json";
  return "/avatars/jean-default.json";
}

// 📊 Charger prévisions météo
async function loadForecast(location = {}) {
  try {
    let data = null;

    if (location.lat && location.lon) {
      const res = await fetch("/api/superforecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(location)
      });
      data = await res.json();
    } else if (location.address) {
      const res = await fetch(`/api/forecast/${encodeURIComponent(location.address)}`);
      data = await res.json();
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
        <lottie-player src="${getIconByCondition(today.condition)}"
          background="transparent" speed="1" loop autoplay style="width:60px;height:60px;"></lottie-player>
      `;
      updateJeanAvatar(today.condition); // Avatar suit la météo du jour
    }

    // 7 jours
    let html = "";
    (data.days || []).forEach((d) => {
      html += `
        <div class="forecast-item">
          <b>${d.date}</b><br>
          <lottie-player src="${getIconByCondition(d.condition)}"
            background="transparent" speed="1" loop autoplay style="width:50px;height:50px;"></lottie-player>
          <p>${d.condition}<br>${d.temp_min}° / ${d.temp_max}°</p>
        </div>
      `;
    });
    document.getElementById("days-container").innerHTML = html;

    // Bulletin texte
    const txt = await fetch("/api/textgen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Rédige un bulletin météo clair et concis basé sur les prévisions actuelles." })
    });
    const tdata = await txt.json();
    document.getElementById("forecast-text").innerText = tdata.reply || "❌ Pas de bulletin.";
  } catch (err) {
    console.error("Forecast error:", err);
  }
}

// 🚨 Charger alertes météo
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

    if (data.some(a => a.level >= 80)) {
      updateJeanAvatar("alert");
    }
  } catch (err) {
    console.error("Alerts error:", err);
  }
}

// 🔔 Notifications Push
async function subscribeNotif(zone = "GLOBAL") {
  if (!("Notification" in window)) {
    alert("❌ Ce navigateur ne supporte pas les notifications.");
    return;
  }
  const perm = await Notification.requestPermission();
  if (perm !== "granted") {
    document.getElementById("notif-status").innerText = "⚠️ Notifications refusées.";
    return;
  }

  await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: "browser", zone })
  });

  document.getElementById("notif-status").innerText = `✅ Notifications activées (${zone}).`;
}
function unsubscribeNotif() {
  document.getElementById("notif-status").innerText = "🔕 Notifications désactivées.";
}

// 💬 Chat J.E.A.N (IA)
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

    if (data.avatar) updateJeanAvatar(data.avatar);
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
