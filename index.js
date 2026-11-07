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
      return msg.reply(`❌ Kategorie "${CATEGORY_NAME}" auf Inferno nicht gefunden.`);
    }

    const sourceChannels = sourceGuild.channels.cache
      .filter(c => c.parentId === sourceCategory.id)
      .sort((a,b) => a.position - b.position);

    if (sourceChannels.size === 0) {
      return msg.reply(`⚠️ Kategorie gefunden, aber 0 Kanäle drin.`);
    }

    await msg.channel.send(`🔍 ${sourceChannels.size} Kanäle gefunden, erstelle jetzt auf KIEZ RP...`);

    const targetCategory = await targetGuild.channels.create({
      name: sourceCategory.name,
      type: ChannelType.GuildCategory,
    });

    for (const [id, sourceChannel] of sourceChannels) {
      try {
        const overwrites = [];
        for (const [owId, ow] of sourceChannel.permissionOverwrites.cache) {
          let targetId = ow.id;
          if (ow.type === 0) { // Rolle
            const sourceRole = sourceGuild.roles.cache.get(ow.id);
            if (sourceRole) {
              const targetRole = targetGuild.roles.cache.find(r => r.name === sourceRole.name);
              if (targetRole) targetId = targetRole.id;
            }
          }
          overwrites.push({
            id: targetId,
            allow: ow.allow.bitfield,
            deny: ow.deny.bitfield,
            type: ow.type
          });
        }

        await targetGuild.channels.create({
          name: sourceChannel.name,
          type: sourceChannel.type,
          parent: targetCategory.id,
          permissionOverwrites: overwrites,
          topic: sourceChannel.topic || null,
        });
        console.log(`✅ Erstellt: ${sourceChannel.name}`);
      } catch (e) {
        console.log(`❌ Fehler bei ${sourceChannel.name}: ${e.message}`);
        await msg.channel.send(`❌ Fehler bei ${sourceChannel.name}: ${e.message}`);
      }
    }

    await msg.channel.send(`✅ Fertig! ${sourceChannels.size} Kanäle in Kategorie ${targetCategory.name} geklont!`);

  } catch (err) {
    console.error(err);
    msg.reply(`❌ Schwerer Fehler: ${err.message}`);
  }
});

// WICHTIG FÜR DISCLOUD:
const token = process.env.BOT_TOKEN || process.env.TOKEN;
if (!token) {
  console.error('❌ Kein BOT_TOKEN gefunden! In Discloud RAM -> Env eintragen!');
  process.exit(1);
}
client.login(token);
