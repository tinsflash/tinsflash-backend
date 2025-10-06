const API_BASE = "/api";

// === BOUTON SON ===
document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("introVideo");
  const btn = document.getElementById("soundToggle");

  if (btn && video) {
    btn.addEventListener("click", () => {
      if (video.muted) {
        video.muted = false;
        btn.textContent = "🔊";
      } else {
        video.muted = true;
        btn.textContent = "🔇";
      }
    });
  }
});

// === FETCH JSON ===
async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Erreur HTTP " + res.status);
    return await res.json();
  } catch (e) {
    console.error("❌ Erreur fetch :", e.message);
    return null;
  }
}

// === AVATAR DYNAMIQUE J.E.A.N ===
async function updateJeanAvatar(summary = "") {
  const avatar = document.getElementById("jeanAvatar");
  if (!avatar) return;

  summary = summary.toLowerCase();
  let avatarSrc = "avatars/jean-default.png";

  if (summary.includes("pluie") || summary.includes("rain")) avatarSrc = "avatars/jean-rain.png";
  else if (summary.includes("neige") || summary.includes("snow")) avatarSrc = "avatars/jean-snow.png";
  else if (summary.includes("orage") || summary.includes("storm") || summary.includes("tempête")) avatarSrc = "avatars/jean-storm.png";
  else if (summary.includes("soleil") || summary.includes("sun") || summary.includes("clair")) avatarSrc = "avatars/jean-sun.png";
  else if (summary.includes("alerte") || summary.includes("warning")) avatarSrc = "avatars/jean-alert.png";
  else if (summary.includes("ia") || summary.includes("analyse")) avatarSrc = "avatars/jean-ai.png";
  else if (summary.includes("tablette") || summary.includes("data")) avatarSrc = "avatars/jean-tablet.png";

  avatar.classList.add("avatar-active");
  setTimeout(() => {
    avatar.src = avatarSrc;
    avatar.classList.remove("avatar-active");
  }, 600);
}

// === PREVISIONS LOCALES ===
async function loadForecast(lat = 50.5, lon = 4.7) {
  const local = document.getElementById("local-forecast");
  const national = document.getElementById("national-forecast");
  const week = document.getElementById("forecast-7days");

  local.innerHTML = national.innerHTML = week.innerHTML = "Chargement...";

  const localData = await fetchJSON(`${API_BASE}/forecast/local?lat=${lat}&lon=${lon}`);
  const nationalData = await fetchJSON(`${API_BASE}/forecast/national?lat=${lat}&lon=${lon}`);
  const weekData = await fetchJSON(`${API_BASE}/forecast/7days?lat=${lat}&lon=${lon}`);

  if (localData) {
    local.innerHTML = `<b>${localData.summary}</b><br>🌡 ${localData.temperature_min}°C / ${localData.temperature_max}°C<br>💨 ${localData.wind} km/h`;
    updateJeanAvatar(localData.summary || "");
  } else local.innerHTML = "❌ Erreur chargement prévisions locales";

  if (nationalData)
    national.innerHTML = `<b>${nationalData.country}</b><br>🌡 ${nationalData.temperature_min}°C / ${nationalData.temperature_max}°C<br>🌧 ${nationalData.precipitation} mm`;
  else national.innerHTML = "❌ Erreur prévisions nationales";

  if (weekData && Array.isArray(weekData))
    week.innerHTML = weekData
      .map((d) => `<div>📅 ${d.date} – ${d.summary} – ${d.temperature_min}°C / ${d.temperature_max}°C</div>`)
      .join("");
  else week.innerHTML = "❌ Erreur prévisions 7 jours";
}

// === GEOLOCALISATION ===
navigator.geolocation.getCurrentPosition(
  (pos) => loadForecast(pos.coords.latitude, pos.coords.longitude),
  () => loadForecast(50.5, 4.7)
);

// === Bulle IA-AI ===
document.getElementById("iaBubble").addEventListener("click", () => {
  alert("👋 Ici J.E.A.N – Mode conversation IA bientôt actif !");
});
