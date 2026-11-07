const { Client, GatewayIntentBits, ChannelType, REST, Routes, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const SOURCE_GUILD_ID = '1532767176715665429';
const TARGET_GUILD_ID = '1568328146993025154';

const commands = [
  { name: 'kanäle', description: 'Zeigt alle Kategorien von Inferno zum Auswählen' },
  { name: 'cloneall', description: 'Klont SOFORT die Kategorie TEAM CHANNEL (Notfall)' }
];

client.on('ready', async () => {
  console.log(`✅ Online als ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    await rest.put(Routes.applicationGuildCommands(client.user.id, TARGET_GUILD_ID), { body: commands });
    console.log('✅ / Befehle registriert - warte 2 Minuten bis Discord sie anzeigt!');
  } catch(e){ console.error(e); }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isStringSelectMenu()) return;

  const sourceGuild = client.guilds.cache.get(SOURCE_GUILD_ID);
  const targetGuild = client.guilds.cache.get(TARGET_GUILD_ID);

  if (interaction.commandName === 'kanäle') {
    if (!sourceGuild) return interaction.reply({ content: 'Bot nicht auf Inferno!', ephemeral: true });
    const cats = sourceGuild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).sort((a,b)=>a.position-b.position);
    const options = cats.map(cat => new StringSelectMenuOptionBuilder().setLabel(cat.name.slice(0,100)).setDescription(`${sourceGuild.channels.cache.filter(ch=>ch.parentId===cat.id).size} Kanäle`.slice(0,100)).setValue(cat.id)).slice(0,25);
    const menu = new StringSelectMenuBuilder().setCustomId('clone_select').setPlaceholder('Wähle Kategorien...').setMinValues(1).setMaxValues(options.length).addOptions(options);
    const row = new ActionRowBuilder().addComponents(menu);
    const embed = new EmbedBuilder().setTitle('📋 Inferno Kategorien').setDescription(`Wähle was nach KIEZ RP geklont werden soll`).setColor(0x00FF00);
    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  if (interaction.commandName === 'cloneall') {
    await interaction.reply('⏳ Clone TEAM CHANNEL...');
    const cat = sourceGuild.channels.cache.find(c=>c.name==='TEAM CHANNEL' && c.type===ChannelType.GuildCategory);
    if(!cat) return interaction.editReply('TEAM CHANNEL nicht gefunden!');
    const chans = sourceGuild.channels.cache.filter(c=>c.parentId===cat.id);
    const targetCat = await targetGuild.channels.create({ name: cat.name, type: ChannelType.GuildCategory });
    for (const [id,ch] of chans) { await targetGuild.channels.create({ name: ch.name, type: ch.type, parent: targetCat.id }); }
    return interaction.editReply(`✅ ${chans.size} Kanäle geklont!`);
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'clone_select') {
    await interaction.deferReply({ ephemeral: true });
    let log = '';
    for (const catId of interaction.values) {
      const srcCat = sourceGuild.channels.cache.get(catId);
      const srcChans = sourceGuild.channels.cache.filter(c=>c.parentId===srcCat.id).sort((a,b)=>a.position-b.position);
      const tgtCat = await targetGuild.channels.create({ name: srcCat.name, type: ChannelType.GuildCategory });
      log += `📁 ${srcCat.name}\n`;
      for (const [id,ch] of srcChans) {
        await targetGuild.channels.create({ name: ch.name, type: ch.type, parent: tgtCat.id, topic: ch.topic||null });
        log += ` └─ ${ch.name}\n`;
      }
    }
    return interaction.editReply(`✅ Fertig geklont:\n${log}`);
  }
});

client.login(process.env.BOT_TOKEN);
