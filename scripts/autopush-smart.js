const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Config
const BRANCH = "main";

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

// Détermine le dossier cible selon l’extension/nom
function resolveTarget(fileName) {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === ".html" || ext === ".css") {
    return path.join("public", fileName);
  }

  if (ext === ".js") {
    const lower = fileName.toLowerCase();
    if (lower.includes("service") || lower.includes("engine")) {
      return path.join("services", fileName);
    }
    if (lower.includes("route")) {
      return path.join("routes", fileName);
    }
    return path.join("utils", fileName);
  }

  // Par défaut → racine
  return fileName;
}

// Récupérer fichiers en argument
const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("❌ Aucun fichier spécifié (ex: node scripts/autopush-smart.js index.html)");
  process.exit(1);
}

try {
  run("git config user.name 'gptcode-bot'");
  run("git config user.email 'gptcode-bot@users.noreply.github.com'");

  let movedFiles = [];

  files.forEach((srcFile) => {
    const baseName = path.basename(srcFile);
    const targetPath = resolveTarget(baseName);

    // Vérifie que le dossier existe, sinon le crée
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    // Déplace le fichier généré/corrigé
    fs.copyFileSync(srcFile, targetPath);

    console.log(`✅ ${srcFile} → ${targetPath}`);
    movedFiles.push(targetPath);
  });

  // Git commit + push
  run(`git add ${movedFiles.join(" ")}`);
  run(`git commit -m "Auto update via GPTCode: ${movedFiles.join(", ")}" || echo "No changes to commit"`);
  run(`git push origin ${BRANCH}`);

  console.log("🎉 Push terminé avec succès !");
} catch (err) {
  console.error("❌ Erreur pendant le push :", err.message);
  process.exit(1);
}
