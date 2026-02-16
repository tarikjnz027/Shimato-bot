const emailjs = require('emailjs');

const server = emailjs.server.connect({
    user: "user_id", // Ton User ID depuis EmailJS.com
    password: "accessToken", // Ton Access Token (privé)
    host: 'smtp.emailjs.com', // Important : pas Gmail
    ssl: true,
    port: 465
});

server.send({
    from: "ton@email.com", // Email vérifié dans EmailJS
    to: "tarikjnz027@gmail.com",
    subject: "Test EmailJS",
    text: "Test réussi !"
}, (err, msg) => {
    if (err) console.error('X Erreur :', err.message);
    else console.log('✅ Email envoyé !');
});