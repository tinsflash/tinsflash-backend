// -------------------------
// 🌍 Account Routes
// -------------------------
import express from "express";
const router = express.Router();

// Fake DB (à remplacer plus tard)
const users = [
  { email: "test@test.com", password: "1234", role: "premium" },
];

// Connexion
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ success: false, message: "Identifiants invalides" });
  res.json({ success: true, token: "fake-jwt", role: user.role });
});

// Inscription
router.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ success: false, message: "Utilisateur déjà existant" });
  }
  users.push({ email, password, role: "free" });
  res.json({ success: true, message: "Compte créé avec succès" });
});

export default router;
