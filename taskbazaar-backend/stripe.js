const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // your test secret key
module.exports = stripe;