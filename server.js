require("dotenv").config();
const express = require("express");
const Stripe = require("stripe");

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.json());
app.use(express.static("public"));

// ========== PAGE D'ACCUEIL (FORMULAIRE INTÉGRÉ) ==========
app.get("/", (req, res) => {
    res.type('html');
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Shimato - Paiement sécurisé</title>
            <script src="https://js.stripe.com/v3/"></script>
            <style>
                body { font-family: Arial, sans-serif; background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
                .container { background: white; border-radius: 16px; padding: 32px; max-width: 500px; width: 100%; }
                h1 { margin: 0 0 8px 0; }
                .price { color: #6772e5; font-size: 32px; font-weight: bold; margin: 16px 0; }
                .form-group { margin-bottom: 20px; }
                label { display: block; margin-bottom: 8px; font-weight: 500; }
                #payment-element { margin-bottom: 20px; padding: 12px; border: 1px solid #ddd; border-radius: 8px; }
                button { background: #6772e5; color: white; border: none; border-radius: 8px; padding: 14px; font-size: 16px; font-weight: 600; cursor: pointer; width: 100%; }
                button:hover { background: #5469d4; }
                .error { color: red; margin-top: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Shimato Premium</h1>
                <div class="price">10,00 € <span style="font-size: 16px;">/ mois</span></div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="email" placeholder="client@exemple.com" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box;">
                </div>
                <div class="form-group">
                    <label>Carte bancaire</label>
                    <div id="payment-element"></div>
                </div>
                <button id="submit-btn">Payer 10,00 €</button>
                <div id="error-message" class="error"></div>
            </div>
            <script>
                const stripe = Stripe('${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}');
                let elements, paymentElement;
                
                async function init() {
                    const response = await fetch('/create-payment-intent', { method: 'POST' });
                    const data = await response.json();
                    elements = stripe.elements({ clientSecret: data.clientSecret });
                    paymentElement = elements.create('payment');
                    paymentElement.mount('#payment-element');
                }
                init();
                
                document.getElementById('submit-btn').addEventListener('click', async (e) => {
                    const email = document.getElementById('email').value;
                    if (!email) { document.getElementById('error-message').textContent = 'Email requis'; return; }
                    const btn = e.target;
                    btn.disabled = true;
                    btn.textContent = 'Traitement...';
                    const { error } = await stripe.confirmPayment({
                        elements,
                        confirmParams: { return_url: 'https://shimato-bot.onrender.com/success' },
                        redirect: 'if_required'
                    });
                    if (error) {
                        document.getElementById('error-message').textContent = error.message;
                        btn.disabled = false;
                        btn.textContent = 'Payer 10,00 €';
                    } else {
                        alert('Paiement reussi !');
                        window.location.href = '/success';
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// ========== CRÉER UN PAYMENT INTENT ==========
app.post("/create-payment-intent", async (req, res) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 1000,
            currency: "eur",
            automatic_payment_methods: { enabled: true },
        });
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error("Erreur:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// ========== LANCEMENT ==========
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("Serveur pret sur http://localhost:" + PORT);
});