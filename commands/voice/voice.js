import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import {
  getTempVoiceConfig,
  saveTempVoiceConfig,
  setTempChannelName,
  setTempChannelLimit,
  toggleLockTempChannel,
  permitMemberInTemp,
  blockMemberInTemp,
  transferTempOwnership,
  getGlobalVoiceStats,
  getTempChannelRecord,
} from '../../services/tempVoiceService.js';
import { recordLog } from '../../services/discordLogService.js';
export default {
  data: new SlashCommandBuilder()
    .setName('voice')
    .setDescription('Gestion des salons vocaux temporaires et personnalisés')
    .addSubcommand((sub) =>
      sub
        .setName('setup')
        .setDescription('Configure le salon déclencheur "➕ Créer un salon" (Admin)')
        .addChannelOption((opt) =>
          opt
            .setName('salon_hub')
            .setDescription('Salon vocal qui servira de déclencheur de création')
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)
        )
        .addChannelOption((opt) =>
          opt
            .setName('categorie')
            .setDescription('Catégorie où seront créés les salons temporaires')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName('format_nom')
            .setDescription('Modèle du nom (ex: "🔊 Salon de {user}")')
            .setRequired(false)
        )
        .addIntegerOption((opt) =>
          opt
            .setName('limite_par_defaut')
            .setDescription('Limite de membres par défaut (0 = illimité)')
            .setMinValue(0)
            .setMaxValue(99)
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('nom')
        .setDescription('Renomme votre salon vocal temporaire actuel')
        .addStringOption((opt) =>
          opt
            .setName('nouveau_nom')
            .setDescription('Nouveau nom du salon vocal')
            .setRequired(true)
            .setMaxLength(32)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('limite')
        .setDescription('Définit la limite maximale de participants de votre salon')
        .addIntegerOption((opt) =>
          opt
            .setName('nombre')
            .setDescription('Nombre de participants max (0 = illimité)')
            .setMinValue(0)
            .setMaxValue(99)
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName('verrouiller').setDescription('Verrouille votre salon (rend l\'accès privé)')
    )
    .addSubcommand((sub) =>
      sub.setName('deverrouiller').setDescription('Déverrouille votre salon (ouvert à tous)')
    )
    .addSubcommand((sub) =>
      sub
        .setName('autoriser')
        .setDescription('Autorise un utilisateur spécifique à rejoindre votre salon verrouillé')
        .addUserOption((opt) =>
          opt.setName('membre').setDescription('Membre à autoriser').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('bloquer')
        .setDescription('Bloque et expulse un utilisateur de votre salon')
        .addUserOption((opt) =>
          opt.setName('membre').setDescription('Membre à bloquer').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('transferer')
        .setDescription('Transfère la propriété de votre salon à un autre membre')
        .addUserOption((opt) =>
          opt.setName('nouveau_proprio').setDescription('Nouveau propriétaire').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName('stats').setDescription('Affiche les statistiques globales d\'utilisation vocale du serveur')
    )
    .addSubcommand((sub) =>
      sub.setName('help').setDescription('Affiche l\'aide et le guide complet des salons vocaux')
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;
    const member = interaction.member;
    if (sub === 'help') {
      const embed = new EmbedBuilder()
        .setTitle('🔊 Guide & Commandes — Salons Vocaux Temporaires')
        .setDescription(
          'Rejoignez simplement le salon **➕ Créer un salon** pour générer automatiquement votre propre salon vocal privé ! ' +
          'En tant que propriétaire, vous disposez des commandes suivantes pour le personnaliser :'
        )
        .setColor(0x00e5ff)
        .addFields(
          { name: '✏️ `/voice nom <nouveau_nom>`', value: 'Renomme votre salon vocal temporaire (limité à 32 caractères).' },
          { name: '👥 `/voice limite <nombre>`', value: 'Définit le nombre maximal de membres pouvant rejoindre (0 = illimité).' },
          { name: '🔒 `/voice verrouiller`', value: 'Verrouille votre salon. Plus personne ne peut entrer sans votre accord.' },
          { name: '🔓 `/voice deverrouiller`', value: 'Ouvre votre salon à tous les membres du serveur.' },
          { name: '✅ `/voice autoriser <membre>`', value: 'Accorde la permission d\'entrer à un membre spécifique dans votre salon verrouillé.' },
          { name: '🚫 `/voice bloquer <membre>`', value: 'Bloque et expulse un membre gênant de votre salon.' },
          { name: '👑 `/voice transferer <nouveau_proprio>`', value: 'Transfère la gestion de votre salon à un autre membre présent.' },
          { name: '📊 `/voice stats`', value: 'Consulte les statistiques vocales et le temps passé par la communauté.' },
          { name: '⚙️ `/voice setup` *(Admin)*', value: 'Configure le salon hub déclencheur et la catégorie dédiée.' }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système Vocal Intelligent', iconURL: guild.iconURL() || undefined });
      return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
    if (sub === 'setup') {
      if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
        return await interaction.reply({
          content: '❌ Vous devez être administrateur pour configurer les salons vocaux temporaires.',
          flags: MessageFlags.Ephemeral,
        });
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const hubChannel = interaction.options.getChannel('salon_hub');
      const category = interaction.options.getChannel('categorie');
      const nameTemplate = interaction.options.getString('format_nom') || '🔊 Salon de {user}';
      const defaultLimit = interaction.options.getInteger('limite_par_defaut') || 0;
      await saveTempVoiceConfig(guild.id, {
        hub_channel_id: hubChannel.id,
        category_id: category ? category.id : hubChannel.parentId,
        name_template: nameTemplate,
        default_limit: defaultLimit,
        enabled: true,
      });
      await recordLog({
        client: interaction.client,
        guildId: guild.id,
        type: 'SYSTEM',
        action: 'Configuration Salons Vocaux Temporaires',
        user: interaction.user,
        details: `Salon Hub configuré : <#${hubChannel.id}>`,
        channelId: interaction.channelId,
      });
      const embed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle('🎙️ Salons Vocaux Temporaires Configurés !')
        .setDescription(
          `Le système est désormais actif sur **${guild.name}** !\n\n` +
          `• 📍 **Salon Hub :** <#${hubChannel.id}>\n` +
          `• 📁 **Catégorie :** ${category ? `<#${category.id}>` : 'Catégorie du salon Hub'}\n` +
          `• 🏷️ **Modèle de nom :** \`${nameTemplate}\`\n` +
          `• 👥 **Limite par défaut :** ${defaultLimit ? `${defaultLimit} membres` : 'Illimité'}\n\n` +
          `Dès qu'un membre rejoindra <#${hubChannel.id}>, un salon vocal privé sera automatiquement créé et supprimé une fois vide !`
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système Vocal Dynamique' });
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'stats') {
      await interaction.deferReply();
      const stats = await getGlobalVoiceStats(guild.id);
      const embed = new EmbedBuilder()
        .setColor(0x00e5ff)
        .setTitle('📊 Statistiques Vocales du Serveur')
        .setDescription(`Aperçu de l'activité vocale et des salons temporaires créés sur **${guild.name}** :`)
        .addFields(
          { name: '🟢 Salons Actifs', value: `\`${stats.activeChannels}\` en cours`, inline: true },
          { name: '🎧 Sessions Totales', value: `\`${stats.totalSessions}\` salons créés`, inline: true },
          { name: '⏳ Heures Cumulées', value: `\`${stats.totalHours} h\` d'échanges`, inline: true },
          { name: '⏱️ Durée Moyenne', value: `\`${stats.avgMinutes} min\` par session`, inline: true }
        )
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Voice Tracker' })
        .setTimestamp();
      return await interaction.editReply({ embeds: [embed] });
    }
    const currentVoiceChannel = member.voice?.channel;
    if (!currentVoiceChannel) {
      return await interaction.reply({
        content: '❌ Vous devez être connecté dans votre salon vocal temporaire pour utiliser cette commande.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const tempRecord = await getTempChannelRecord(currentVoiceChannel.id);
    if (!tempRecord) {
      return await interaction.reply({
        content: '❌ Ce salon vocal n\'est pas un salon temporaire géré par le bot.',
        flags: MessageFlags.Ephemeral,
      });
    }
    if (tempRecord.owner_id !== interaction.user.id && !member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: `❌ Seul le propriétaire du salon (<@${tempRecord.owner_id}>) peut gérer les paramètres.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      if (sub === 'nom') {
        const newName = interaction.options.getString('nouveau_nom');
        await setTempChannelName(currentVoiceChannel, newName, interaction.user.id);
        return await interaction.editReply({
          content: `✅ Votre salon vocal a été renommé en **${newName}** !`,
        });
      }
      if (sub === 'limite') {
        const limit = interaction.options.getInteger('nombre');
        await setTempChannelLimit(currentVoiceChannel, limit, interaction.user.id);
        return await interaction.editReply({
          content: limit === 0
            ? '✅ La limite de participants a été supprimée (salon illimité).'
            : `✅ Limite fixée à **${limit} participants max** !`,
        });
      }
      if (sub === 'verrouiller') {
        await toggleLockTempChannel(currentVoiceChannel, interaction.user.id, true);
        return await interaction.editReply({
          content: '🔒 **Salon verrouillé !** Les autres membres ne peuvent plus le rejoindre sans votre autorisation.',
        });
      }
      if (sub === 'deverrouiller') {
        await toggleLockTempChannel(currentVoiceChannel, interaction.user.id, false);
        return await interaction.editReply({
          content: '🔓 **Salon déverrouillé !** Tout le monde peut désormais le rejoindre.',
        });
      }
      if (sub === 'autoriser') {
        const targetUser = interaction.options.getUser('membre');
        const targetMember = await guild.members.fetch(targetUser.id);
        await permitMemberInTemp(currentVoiceChannel, targetMember, interaction.user.id);
        return await interaction.editReply({
          content: `✅ <@${targetUser.id}> a été expressément autorisé à rejoindre votre salon vocal !`,
        });
      }
      if (sub === 'bloquer') {
        const targetUser = interaction.options.getUser('membre');
        const targetMember = await guild.members.fetch(targetUser.id);
        await blockMemberInTemp(currentVoiceChannel, targetMember, interaction.user.id);
        return await interaction.editReply({
          content: `🚫 <@${targetUser.id}> a été bloqué et expulsé de votre salon vocal.`,
        });
      }
      if (sub === 'transferer') {
        const targetUser = interaction.options.getUser('nouveau_proprio');
        const targetMember = await guild.members.fetch(targetUser.id);
        await transferTempOwnership(currentVoiceChannel, targetMember, interaction.user.id);
        return await interaction.editReply({
          content: `👑 Vous avez transféré la propriété de ce salon à <@${targetUser.id}> !`,
        });
      }
    } catch (err) {
      return await interaction.editReply({
        content: `❌ Erreur : ${err.message}`,
      });
    }
  },
};
