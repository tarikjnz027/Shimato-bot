require("dotenv").config();
const express = require("express");
const Stripe = require("stripe");

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(express.json());
app.use(express.static("public"));

// ========== PAGE D'ACCUEIL ==========
app.get("/", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Shimato - Paiement</title>
            <script src="https://js.stripe.com/v3/"></script>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                button { background-color: #6772e5; color: white; padding: 12px 24px; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; }
                button:hover { background-color: #5469d4; }
            </style>
        </head>
        <body>
            <h1>🎉 Shimato - Accès Premium</h1>
            <p>Abonnement à <strong>10,00 € par mois</strong></p>
            <button id="checkoutBtn">Payer maintenant</button>
            <script>
                const stripe = Stripe('${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}');
                const priceId = '${process.env.STRIPE_PRICE_ID}';
                
                document.getElementById('checkoutBtn').addEventListener('click', async () => {
                    const response = await fetch('/create-checkout-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const session = await response.json();
                    if (session.id) {
                        await stripe.redirectToCheckout({ sessionId: session.id });
                    } else {
                        alert('Erreur: ' + session.error);
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// ========== ROUTE : CRÉER UN CHECKOUT ==========
app.post("/create-checkout-session", async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [{
                price: process.env.STRIPE_PRICE_ID,
                quantity: 1
            }],
            success_url: "https://shimato-bot.onrender.com/success.html",
            cancel_url: "https://shimato-bot.onrender.com/"
        });
        res.json({ id: session.id });
    } catch (error) {
        console.error("❌ Erreur Stripe:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// ========== LANCEMENT ==========
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`✅ Serveur Stripe lancé sur http://localhost:${PORT}`);
});