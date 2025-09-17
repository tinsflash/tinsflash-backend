// routes/account.js
import express from "express";
const router = express.Router();

// Exemple de route login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (email === "test@test.com" && password === "1234") {
    res.json({ success: true, token: "fake-jwt-token" });
  } else {
    res.status(401).json({ success: false, message: "Identifiants invalides" });
  }
});

export default router;
