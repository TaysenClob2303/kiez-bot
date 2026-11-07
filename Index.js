const { Client, GatewayIntentBits, ChannelType } = require('discord.js');

const client = new Client({ 
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

const SOURCE_GUILD_ID = '1532767176715665429'; // Inferno Roleplay
const TARGET_GUILD_ID = '1568328146993025154'; // KIEZ RP
const CATEGORY_NAME = 'TEAM CHANNEL';

client.on('ready', () => {
  console.log(`✅ KIEZ Bot online als ${client.user.tag}`);
  console.log('Bereit zum Klonen! Schreib !clone');
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;
  if (msg.content !== '!clone') return;

  try {
    await msg.reply('⏳ Starte Klonen von TEAM CHANNEL...');
    
    const sourceGuild = client.guilds.cache.get(SOURCE_GUILD_ID);
    const targetGuild = client.guilds.cache.get(TARGET_GUILD_ID);

    if (!sourceGuild || !targetGuild) {
      return msg.reply('❌ Bot ist nicht in beiden Servern! Lade ihn in beide Server ein mit Admin Rechten.');
    }

    const sourceCategory = sourceGuild.channels.cache.find(c => c.name === CATEGORY_NAME && c.type === ChannelType.GuildCategory);
    if (!sourceCategory) {
      return msg.reply(`❌ Kategorie "${CATEGORY_NAME}" auf Inferno nicht gefunden. Heißt sie wirklich genau so? Groß/Klein beachten!`);
    }

    const sourceChannels = sourceGuild.channels.cache
      .filter(c => c.parentId === sourceCategory.id)
      .sort((a,b) => a.position - b.position);

    if (sourceChannels.size === 0) {
      return msg.reply(`⚠️ Kategorie gefunden, aber 0 Kanäle drin.`);
    }

    msg.reply(`🔍 ${sourceChannels.size} Kanäle gefunden, erstelle jetzt auf KIEZ RP...`);

    const targetCategory = await targetGuild.channels.create({
      name: sourceCategory.name,
      type: ChannelType.GuildCategory,
    });

    const mapPermissions = (overwrites) => {
      return overwrites.map(ow => {
        let targetRoleId = ow.id;
        if (ow.type === 0) {
