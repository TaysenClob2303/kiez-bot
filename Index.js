const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');

const client = new Client({ 
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

// HIER DEINE SERVER IDs EINTRAGEN:
const SOURCE_GUILD_ID = 'DEINE_INFERNO_ROLEPLAY_SERVER_ID';
const TARGET_GUILD_ID = 'DEINE_KIEZ_RP_SERVER_ID';
const CATEGORY_NAME = 'TEAM CHANNEL';

client.on('ready', () => {
  console.log(`✅ Bot online als ${client.user.tag}`);
  console.log('Schreib !clone in einen Channel um zu kopieren');
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;
  if (msg.content !== '!clone') return;

  try {
    await msg.reply('⏳ Starte Klonen...');
    
    const sourceGuild = client.guilds.cache.get(SOURCE_GUILD_ID);
    const targetGuild = client.guilds.cache.get(TARGET_GUILD_ID);

    if (!sourceGuild || !targetGuild) {
      return msg.reply('❌ Bot ist nicht in beiden Servern! Lade ihn in Inferno RP und Kiez RP ein.');
    }

    // Finde Kategorie auf Inferno
    const sourceCategory = sourceGuild.channels.cache.find(c => c.name === CATEGORY_NAME && c.type === ChannelType.GuildCategory);
    if (!sourceCategory) {
      return msg.reply(`❌ Kategorie "${CATEGORY_NAME}" auf Inferno nicht gefunden.`);
    }

    const sourceChannels = sourceGuild.channels.cache
      .filter(c => c.parentId === sourceCategory.id)
      .sort((a,b) => a.position - b.position);

    console.log(`${sourceChannels.size} Kanäle gefunden in ${CATEGORY_NAME}`);

    // Erstelle Kategorie auf KIEZ RP
    const targetCategory = await targetGuild.channels.create({
      name: sourceCategory.name,
      type: ChannelType.GuildCategory,
    });

    // Hilfsfunktion: Rollen per Name matchen für Permissions
    const mapPermissions = (overwrites) => {
      return overwrites.map(ow => {
        let targetRole = targetGuild.roles.cache.find(r => {
          const sourceRole = sourceGuild.roles.cache.get(ow.id);
          return sourceRole && r.name === sourceRole.name;
        });
        return {
          id: targetRole ? targetRole.id : targetGuild.roles.everyone.id,
          allow: ow.allow,
          deny: ow.deny,
          type: ow.type
        };
      });
    };

    // Kopiere alle Kanäle
    for (const [id, ch] of sourceChannels) {
      await targetGuild.channels.create({
        name: ch.name,
        type: ch.type,
        parent: targetCategory.id,
        topic: ch.topic || null,
        nsfw: ch.nsfw || false,
        bitrate: ch.bitrate || undefined,
        userLimit: ch.userLimit || undefined,
        rateLimitPerUser: ch.rateLimitPerUser || 0,
        permissionOverwrites: mapPermissions([...ch.permissionOverwrites.cache.values()]),
      });
      console.log(`✅ Kopiert: ${ch.name}`);
      await new Promise(r => setTimeout(r, 500)); // Anti-RateLimit
    }

    msg.reply(`✅ Fertig! ${sourceChannels.size} Kanäle von "${CATEGORY_NAME}" nach KIEZ RP kopiert!`);

  } catch (err) {
    console.error(err);
    msg.reply(`❌ Fehler: ${err.message}`);
  }
});

client.login(process.env.BOT_TOKEN);
