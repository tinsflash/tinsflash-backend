// -------------------------
// ui.js
// Gestion des transitions UI (switch cockpit, effets)
// -------------------------

// Fonction universelle pour passer au cockpit avec effet glitch
function switchToCockpit() {
  document.body.classList.add("transition-glitch");
  setTimeout(() => {
    window.location.href = "cockpit.html";
  }, 800);
}

// Ajouter l'événement sur les boutons cockpit
document.addEventListener("DOMContentLoaded", () => {
  const cockpitButtons = document.querySelectorAll(".cockpit-btn");
  cockpitButtons.forEach(btn => {
    btn.addEventListener("click", switchToCockpit);
  });
});
