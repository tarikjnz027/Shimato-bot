// ====================
// 1. IMPORTS
// ====================
const { Client, GatewayIntentBits, Events } = require("discord.js");
const express = require('express');
require("dotenv").config();

// ====================
// 2. INITIALISATION
// ====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ====================
// 3. MIDDLEWARE
// ====================
app.use(express.static('site'));
app.use(express.json());

// ====================
// 4. ROUTE STRIPE
// ====================
app.post('/create-checkout-session', async (req, res) => {
  console.log("✅ Route Stripe appelée !");
  
  try {
    const discordId = req.body.discordId || "123456789012345678";
    console.log("Discord ID reçu:", discordId);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: 'price_1SiA6kAPxHHnthPYqJXWohXs', // ⬅️ TON NOUVEAU PRICE ID
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: 'http://localhost:4242/success.html',
      cancel_url: 'http://localhost:4242/cancel.html',
      metadata: { discord_id: discordId }
    });

    console.log("✅ Session Stripe créée:", session.id);
    res.json({ url: session.url });
    
  } catch (error) {
    console.error("❌ Erreur Stripe:", error);
    res.status(500).json({ error: error.message });
  }
});

// ====================
// 5. BOT DISCORD
// ====================
client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot Discord connecté : ${c.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content === "!ping") {
    message.reply("🏓 Pong !");
  }
});

// ====================
// 6. DÉMARRAGE
// ====================
const PORT = 4242;
app.listen(PORT, () => {
  console.log(`🚀 Serveur web sur http://localhost:${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);