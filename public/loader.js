// ============================
// 🚀 TINSFLASH Loader amélioré (messages + barre animée en boucle)
// ============================

const loaderMessages = [
  "Connexion aux centres météo mondiaux...",
  "Analyse des vents et températures...",
  "Détection des anomalies climatiques...",
  "Fusion IA exclusive TINSFLASH...",
  "⏳ Les informations arrivent..."
];

function startLoader(containerId, speed = 2500) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  let msgIndex = 0;
  const msgBox = document.createElement("div");
  msgBox.className = "loader-message";
  msgBox.innerText = loaderMessages[msgIndex];
  container.appendChild(msgBox);

  const bar = document.createElement("div");
  bar.className = "loader-bar";
  const progress = document.createElement("div");
  progress.className = "loader-progress";
  bar.appendChild(progress);
  container.appendChild(bar);

  // Changement de messages plus lent
  const interval = setInterval(() => {
    msgIndex++;
    if (msgIndex < loaderMessages.length) {
      msgBox.innerText = loaderMessages[msgIndex];
    }
  }, speed);

  // Retourner un handle pour stopper proprement
  return {
    stop: () => {
      clearInterval(interval);
      container.innerHTML = ""; // efface le loader
    }
  };
}
