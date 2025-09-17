// -------------------------
// 🌍 autopush-test.js
// Script test pour GitHub Actions
// -------------------------
import { writeFileSync } from "fs";

const timestamp = new Date().toISOString();
const content = `Hello TINSFLASH 🌍 — commit auto via autopush.yml (${timestamp})\n`;

writeFileSync("hello.txt", content);

console.log("✅ Fichier hello.txt généré !");
