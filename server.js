// 🌍 server.js - Backend Express pour TINSFLASH

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware JSON
app.use(express.json());

// Sert tout le dossier "public"
app.use(express.static(path.join(__dirname, "public")));

// Route racine → renvoie index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Catch-all (toute autre route non définie) → renvoie index.html
// Utile si tu as un frontend avec navigation client (SPA)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🚀 Lancement du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur TINSFLASH en ligne sur le port ${PORT}`);
});
