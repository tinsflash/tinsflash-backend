const express = require("express");
const { stripe } = require("../utils/stripe");
const router = express.Router();

router.post("/create-checkout", async (req, res) => {
  try {
    const { priceId } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: "https://tinsflash.com/success",
      cancel_url: "https://tinsflash.com/cancel",
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: "Erreur Stripe" });
  }
});

module.exports = router;
