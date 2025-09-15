const Stripe = require("stripe");

const stripe = Stripe(process.env.STRIPE_KEY);

module.exports = { stripe };
