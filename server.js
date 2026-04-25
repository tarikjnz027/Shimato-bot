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
app.get("/", (req, res) => {
    res.type('html');
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Shimato - Paiement sécurisé</title>
            <script src="https://js.stripe.com/v3/"></script>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: #f5f5f5;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    background: white;
                    border-radius: 16px;
                    padding: 32px;
                    max-width: 500px;
                    width: 100%;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                h1 { margin: 0 0 8px 0; font-size: 24px; }
                .price { color: #6772e5; font-size: 32px; font-weight: bold; margin: 16px 0; }
                .form-group { margin-bottom: 20px; }
                label { display: block; margin-bottom: 8px; font-weight: 500; color: #333; }
                #payment-element { margin-bottom: 20px; padding: 12px; border: 1px solid #ddd; border-radius: 8px; background: white; }
                button {
                    background: #6772e5;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    padding: 14px 24px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    width: 100%;
                    transition: background 0.3s;
                }
                button:hover { background: #5469d4; }
                button:disabled { background: #ccc; cursor: not-allowed; }
                .error { color: red; margin-top: 12px; font-size: 14px; }
                .success { color: green; margin-top: 12px; }
                .card-info { font-size: 12px; color: #666; text-align: center; margin-top: 16px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🔓 Shimato Premium</h1>
                <p>Accès complet à tous nos services</p>
                <div class="price">10,00 € <span style="font-size: 16px;">/ mois</span></div>
                
                <div class="form-group">
                    <label>📧 Email</label>
                    <input type="email" id="email" placeholder="client@exemple.com" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box;">
                </div>
                
                <div class="form-group">
                    <label>💳 Informations de la carte</label>
                    <div id="payment-element"></div>
                </div>
                
                <button id="submit-btn">Payer 10,00 €</button>
                <div id="error-message" class="error"></div>
                <div class="card-info">🔒 Paiement 100% sécurisé par Stripe</div>
            </div>

            <script>
                const stripe = Stripe('${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}');
                let elements;
                let paymentElement;
                
                // Initialiser le formulaire
                async function init() {
                    const response = await fetch('/create-payment-intent', { method: 'POST' });
                    const data = await response.json();
                    
                    elements = stripe.elements({ clientSecret: data.clientSecret });
                    paymentElement = elements.create('payment');
                    paymentElement.mount('#payment-element');
                }
                
                init();
                
                // Gérer le paiement
                const form = document.getElementById('submit-btn');
                form.addEventListener('click', async (e) => {
                    const email = document.getElementById('email').value;
                    if (!email) {
                        document.getElementById('error-message').textContent = 'Veuillez entrer votre email.';
                        return;
                    }
                    
                    form.disabled = true;
                    form.textContent = 'Traitement en cours...';
                    
                    const { error } = await stripe.confirmPayment({
                        elements,
                        confirmParams: { return_url: 'https://shimato-bot.onrender.com/success' },
                        redirect: 'if_required'
                    });
                    
                    if (error) {
                        document.getElementById('error-message').textContent = error.message;
                        form.disabled = false;
                        form.textContent = 'Payer 10,00 €';
                    } else {
                        alert('✅ Paiement réussi ! Vous allez recevoir un email de confirmation.');
                        window.location.href = '/success';
                    }
                });
            </script>
        </body>
        </html>
    `);
});
// Créer un PaymentIntent (pour le formulaire intégré)
app.post("/create-payment-intent", async (req, res) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 1000, // 10,00 € en centimes
            currency: "eur",
            automatic_payment_methods: { enabled: true },
        });
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error("❌ Erreur:", error.message);
        res.status(500).json({ error: error.message });
    }
});