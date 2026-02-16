// ========== IMPORTS ==========
require("dotenv").config();
const express = require("express");
const Stripe = require("stripe");
const { Client, Intents } = require("discord.js");
const emailjs = require("emailjs");

// ========== INIT ==========
const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.MESSAGE_CONTENT
    ]
});

// ========== MIDDLEWARE GÉNÉRAUX ==========
app.use(express.static("site"));

// ========== ROUTE SPÉCIALE WEBHOOK (CORPS BRUT OBLIGATOIRE) ==========
app.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
        console.log('✅ Signature webhook vérifiée avec succès !');
    } catch (err) {
        console.error('❌ Signature webhook invalide:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const customerEmail = session.customer_details.email;
        const customerName = session.customer_details.name || 'Utilisateur';
        const discordId = session.metadata?.discord_id;

        console.log(`✅ Paiement reçu de ${customerEmail} (Discord: ${discordId})`);

        const server = emailjs.server.connect({
            user: process.env.EMAILJS_USER_ID,
            password: process.env.EMAILJS_ACCESS_TOKEN,
            host: 'smtp.emailjs.com',
            ssl: true,
            port: 465
        });

        server.send({
            from: process.env.EMAILJS_FROM_EMAIL,
            to: customerEmail,
            subject: 'Bienvenue sur Shimato !',
            text: `Salut ${customerName},\n\nTon abonnement Shimato à 10€/mois est confirmé !\n\nRejoins le serveur Discord ici : https://discord.gg/ton-lien\n\nÀ tout de suite !`
        }, (err, msg) => {
            if (err) console.error('❌ Erreur email:', err.message);
            else console.log('✅ Email envoyé à', customerEmail);
        });
    }

    res.json({ received: true });
});

// ========== MIDDLEWARE JSON POUR TOUTES LES AUTRES ROUTES ==========
app.use(express.json());

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
            success_url: "http://localhost:4242/success.html",
            cancel_url: "http://localhost:4242/cancel.html",
            metadata: {
                discord_id: req.body.discordId || "inconnu"
            }
        });
        res.json({ url: session.url });
    } catch (err) {
        console.error("❌ Erreur Stripe :", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ========== PAGE D'ACCUEIL ==========
app.get("/", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Shimato - Abonnement</title>
            <style>
                body { font-family: Arial; text-align: center; padding: 50px; }
                button { padding: 15px 30px; font-size: 18px; background: #5865F2; color: white; border: none; border-radius: 8px; cursor: pointer; }
            </style>
        </head>
        <body>
            <h1>Shimato Premium</h1>
            <p>Abonnement à 10€/mois</p>
            <button onclick="subscribe()">S'abonner avec Stripe</button>
            <script>
                async function subscribe() {
                    const res = await fetch('/create-checkout-session', { method: 'POST' });
                    const { url } = await res.json();
                    window.location.href = url;
                }
            </script>
        </body>
        </html>
    `);
});

// ========== BOT DISCORD ==========
client.once("ready", () => {
    console.log(`🤖 Bot Discord connecté : ${client.user.tag}`);
});

// ========== LANCEMENT ==========
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
    console.log(`✅ Serveur Stripe lancé sur http://localhost:${PORT}`);
    client.login(process.env.DISCORD_TOKEN);
});