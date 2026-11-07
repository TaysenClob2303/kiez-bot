const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ 
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

client.on('ready', () => {
  console.log(`✅ Kiez-Bot online als ${client.user.tag}`);
});

client.on('messageCreate', (msg) => {
  if (msg.author.bot) return;
  
  if (msg.content === '!ping') {
    msg.reply('Pong! 🏓 Kiez läuft!');
  }
  if (msg.content === '!kiez') {
    msg.reply('Kiez Bot ist online und bereit! 🔥');
  }
});

client.login(process.env.BOT_TOKEN);
