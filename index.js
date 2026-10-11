// ============================
// 1. IMPORTS
// ============================
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');
const path = require('path');

// ============================
// 2. INITIALISATION DU CLIENT
// ============================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ],
    presence: {
        status: 'online',
        activities: [{
            name: 'Shimato',
            type: 0 // 0 = "Joue à..."
        }]
    }
});

// ============================
// 3. FICHIER DES ABONNEMENTS
// ============================
const subscriptionsFile = path.join(__dirname, 'subscriptions.json');

function loadSubscriptions() {
    try {
        if (fs.existsSync(subscriptionsFile)) {
            const data = fs.readFileSync(subscriptionsFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Erreur lecture subscriptions.json:', error.message);
    }
    return {};
}

// ============================
// 4. BOT DISCORD
// ============================
client.once('ready', () => {
    console.log(`✅ Bot connecté : ${client.user.tag}`);
});

// Détection du départ + annulation Stripe
client.on('guildMemberRemove', async (member) => {
    console.log(`🔴 ${member.user.tag} (ID: ${member.id}) a quitté le serveur.`);

    const subscriptions = loadSubscriptions();
    const stripeSubscriptionId = subscriptions[member.id];

    if (stripeSubscriptionId) {
        try {
            await stripe.subscriptions.cancel(stripeSubscriptionId);
            console.log(`✅ Abonnement ${stripeSubscriptionId} annulé pour ${member.user.tag}`);

            delete subscriptions[member.id];
            fs.writeFileSync(subscriptionsFile, JSON.stringify(subscriptions, null, 2));
        } catch (error) {
            console.error(`❌ Erreur annulation Stripe : ${error.message}`);
        }
    } else {
        console.log(`ℹ️ Aucun abonnement trouvé pour ${member.user.tag}`);
    }
});

// ============================
// 5. CONNEXION
// ============================
client.login(process.env.DISCORD_TOKEN);