// ============================
// 🚀 TINSFLASH Loader amélioré (messages plus lents)
// ============================

const loaderMessages = [
  "Connexion aux centres météo mondiaux...",
  "Analyse des vents et températures...",
  "Détection des anomalies climatiques...",
  "Fusion IA exclusive TINSFLASH...",
  "⏳ Les informations arrivent..."
];

function startLoader(containerId, speed = 2500) { 
  // speed en ms → par défaut 2,5 sec
  const container = document.getElementById(containerId);
  if (!container) return;

  // Nettoyer le conteneur
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

  // Changement de message progressif plus lent
  const interval = setInterval(() => {
    msgIndex++;
    if (msgIndex < loaderMessages.length) {
      msgBox.innerText = loaderMessages[msgIndex];
    }
  }, speed);

  // Retourner un handle pour pouvoir stopper le loader quand les données arrivent
  return {
    stop: () => {
      clearInterval(interval);
      container.innerHTML = ""; // on nettoie quand les vraies données sont prêtes
    }
  };
}
