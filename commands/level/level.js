import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import {
  getUserLevelData,
  getAnimeTitleForLevel,
  getLevelConfig,
  getGuildLeaderboard,
  autoCreateMilestoneRoles,
  saveLevelConfig,
  addXp,
  DEFAULT_ROLE_REWARDS,
} from '../../services/discordLevelService.js';
import { config } from '../../config.js';
function createProgressBar(percent = 0, length = 12) {
  const safePct = Math.max(0, Math.min(100, percent));
  const filled = Math.round((safePct / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}
export const data = new SlashCommandBuilder()
  .setName('level')
  .setDescription('Système de niveaux, XP, classement et rôles de paliers Anime')
  .addSubcommand((sub) =>
    sub
      .setName('rang')
      .setDescription('Consulter son niveau, son XP et sa progression')
      .addUserOption((opt) => opt.setName('membre').setDescription('Membre cible').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('classement')
      .setDescription('Classement des membres les plus actifs (Niveaux & XP)')
      .addIntegerOption((opt) => opt.setName('limite').setDescription('Nombre de membres (max 25)').setMinValue(3).setMaxValue(25).setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('roles')
      .setDescription('Afficher la liste des rôles de palier (10 à 50)')
  )
  .addSubcommand((sub) =>
    sub
      .setName('donner-xp')
      .setDescription('Ajouter de l\'XP à un membre (Staff)')
      .addUserOption((opt) => opt.setName('membre').setDescription('Membre cible').setRequired(true))
      .addIntegerOption((opt) => opt.setName('xp').setDescription('Montant d\'XP').setMinValue(1).setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('config')
      .setDescription('Consulter et modifier la configuration du système de niveaux et XP')
      .addChannelOption((opt) =>
        opt
          .setName('salon_annonces')
          .setDescription('Salon textuel pour les annonces de passage de niveau')
          .setRequired(false)
      )
      .addBooleanOption((opt) =>
        opt
          .setName('annonces_actives')
          .setDescription('Activer ou désactiver les annonces de passage de niveau')
          .setRequired(false)
      )
      .addIntegerOption((opt) =>
        opt
          .setName('xp_min')
          .setDescription('Gain minimum d\'XP par message (défaut: 15)')
          .setMinValue(1)
          .setMaxValue(500)
          .setRequired(false)
      )
      .addIntegerOption((opt) =>
        opt
          .setName('xp_max')
          .setDescription('Gain maximum d\'XP par message (défaut: 25)')
          .setMinValue(1)
          .setMaxValue(500)
          .setRequired(false)
      )
      .addIntegerOption((opt) =>
        opt
          .setName('xp_vocal')
          .setDescription('Gain d\'XP par minute passée en vocal (défaut: 10)')
          .setMinValue(1)
          .setMaxValue(200)
          .setRequired(false)
      )
  );
export async function execute(interaction) {
  await interaction.deferReply();
  const sub = interaction.options.getSubcommand();
  const guild = interaction.guild;
  if (!guild) {
    return interaction.editReply({ content: '❌ Cette commande doit être exécutée sur un serveur Discord.' });
  }
  if (sub === 'rang') {
    const targetUser = interaction.options.getUser('membre') || interaction.user;
    const levelData = await getUserLevelData(guild.id, targetUser.id);
    const { level, currentLevelXp, nextLevelXp, progressPct, totalXp } = levelData.levelInfo;
    const animeTitle = getAnimeTitleForLevel(level);
    const cfg = await getLevelConfig(guild.id);
    const rewards = cfg.role_rewards || [];
    const nextReward = rewards.find((r) => r.level > level);
    const progressBar = createProgressBar(progressPct, 12);
    const avatarUrl = targetUser.displayAvatarURL({ dynamic: true, size: 256 });
    const colorHex = animeTitle.color.startsWith('#') ? animeTitle.color : `#${animeTitle.color}`;
    const embed = new EmbedBuilder()
      .setAuthor({ name: `Niveau & Rang — ${targetUser.username}`, iconURL: avatarUrl })
      .setTitle(`${animeTitle.emoji} Titre : ${animeTitle.title}`)
      .setDescription(`*${animeTitle.description}*`)
      .setThumbnail(avatarUrl)
      .setColor(parseInt(colorHex.replace('#', ''), 16) || 0x00e5ff)
      .addFields(
        { name: '⭐ Niveau Actuel', value: `\`Niveau ${level}\``, inline: true },
        { name: '✨ Total XP', value: `\`${totalXp.toLocaleString()} XP\``, inline: true },
        { name: '🎯 Prochain Palier', value: nextReward ? `\`Palier ${nextReward.level}\` (<@&${nextReward.role_id}>)` : '`Palier Max Atteint !`', inline: true },
        { name: `📊 Progression vers le Niveau ${level + 1} (${progressPct}%)`, value: `\`${progressBar}\`\n**${currentLevelXp} / ${nextLevelXp} XP** restants`, inline: false }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Gagnez de l\'XP en discutant et en participant aux salons vocaux !' })
      .setTimestamp();
    return interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'classement') {
    const limit = interaction.options.getInteger('limite') || 10;
    const list = await getGuildLeaderboard(guild.id, limit);
    const embed = new EmbedBuilder()
      .setTitle(`🏆 Classement d'Activité & Niveaux — ${guild.name}`)
      .setDescription('Membres les plus actifs et dévoués de la communauté :')
      .setColor(0xfbbf24)
      .setThumbnail(guild.iconURL({ dynamic: true }) || config.assets.logoUrl)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système de Niveaux Discord' })
      .setTimestamp();
    if (list.length === 0) {
      embed.setDescription('Aucun membre n\'a encore gagné d\'expérience sur ce serveur.');
    } else {
      const medals = ['🥇', '🥈', '🥉'];
      const lines = list.map((item) => {
        const medal = medals[item.rank - 1] || `\`#${item.rank}\``;
        const titleInfo = getAnimeTitleForLevel(item.level);
        return `${medal} **${item.username}** • **Niveau ${item.level}** (${titleInfo.title}) — \`${item.xp.toLocaleString()} XP\``;
      });
      embed.setDescription(lines.join('\n\n'));
    }
    return interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'roles') {
    const cfg = await getLevelConfig(guild.id);
    const rewards = cfg.role_rewards || DEFAULT_ROLE_REWARDS;
    const embed = new EmbedBuilder()
      .setTitle('🏅 Paliers Anime & Rôles de Récompense')
      .setDescription('Atteignez les niveaux requis pour débloquer automatiquement vos rôles exclusifs :')
      .setColor(0x00e5ff)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    rewards.forEach((r) => {
      embed.addFields({
        name: `Niveau ${r.level} : ${r.title_name || 'Titre Anime'}`,
        value: r.role_id ? `Rôle : <@&${r.role_id}>` : '*Rôle automatique*',
        inline: true,
      });
    });
    return interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'donner-xp') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.editReply({ content: '❌ Cette commande est réservée aux administrateurs.' });
    }
    const targetUser = interaction.options.getUser('membre');
    const xpToAdd = interaction.options.getInteger('xp');
    const res = await addXp(guild.id, targetUser.id, targetUser.username, xpToAdd);
    return interaction.editReply({
      content: `✅ **${xpToAdd.toLocaleString()} XP** ont été attribués à <@${targetUser.id}> ! (Nouveau total : **${res.newTotalXp.toLocaleString()} XP** • Niveau : **${res.newLevel}**)`
    });
  }
  if (sub === 'config') {
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) &&
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.editReply({
        content: '❌ Cette commande est réservée aux modérateurs/administrateurs du serveur (Permission Gérer le serveur).',
      });
    }
    const currentCfg = await getLevelConfig(guild.id);
    const newAnnouncementChannel = interaction.options.getChannel('salon_annonces');
    const newAnnouncementsEnabled = interaction.options.getBoolean('annonces_actives');
    const newXpMin = interaction.options.getInteger('xp_min');
    const newXpMax = interaction.options.getInteger('xp_max');
    const newXpVocal = interaction.options.getInteger('xp_vocal');
    let modified = false;
    const updated = { ...currentCfg };

    if (newAnnouncementChannel !== null) {
      updated.announcement_channel_id = newAnnouncementChannel.id;
      modified = true;
    }
    if (newAnnouncementsEnabled !== null) {
      updated.announcements_enabled = newAnnouncementsEnabled;
      modified = true;
    }
    if (newXpMin !== null) {
      updated.xp_per_message_min = newXpMin;
      modified = true;
    }
    if (newXpMax !== null) {
      updated.xp_per_message_max = newXpMax;
      modified = true;
    }
    if (newXpVocal !== null) {
      updated.xp_per_voice_minute = newXpVocal;
      modified = true;
    }
    if (modified) {
      await saveLevelConfig(guild.id, updated);
    }
    const embed = new EmbedBuilder()
      .setTitle('⚙️ Configuration du Système de Niveaux & XP')
      .setColor(0x00e5ff)
      .setDescription(
        modified
          ? '✅ **La configuration des niveaux et de l\'XP a été mise à jour avec succès !**'
          : 'Voici la configuration actuelle du système de niveaux pour ce serveur :'
      )
      .addFields(
        {
          name: '📢 Salon d\'annonces',
          value: updated.announcement_channel_id ? `<#${updated.announcement_channel_id}>` : '*Non défini (salon où le niveau est franchi)*',
          inline: true,
        },
        {
          name: '🔔 Annonces actives',
          value: updated.announcements_enabled !== false ? '✅ Activé' : '❌ Désactivé',
          inline: true,
        },
        {
          name: '💬 XP par message',
          value: `\`${updated.xp_per_message_min || 15} à ${updated.xp_per_message_max || 25} XP\` (délai : ${updated.message_cooldown_seconds || 60}s)`,
          inline: true,
        },
        {
          name: '🎙️ XP vocal',
          value: `\`${updated.xp_per_voice_minute || 10} XP / minute\``,
          inline: true,
        },
        {
          name: '🏅 Rôles de Paliers Anime',
          value: `${(updated.role_rewards || []).length} paliers configurés (Niveaux 10 à 50)`,
          inline: true,
        }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Cliquez ci-dessous pour créer automatiquement les rôles sur le serveur !' })
      .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('level_cfg_sync_roles')
        .setLabel('Créer / Associer les Rôles de Paliers')
        .setEmoji('👑')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('level_cfg_toggle_announcements')
        .setLabel(updated.announcements_enabled !== false ? 'Désactiver Annonces' : 'Activer Annonces')
        .setEmoji('🔔')
        .setStyle(ButtonStyle.Secondary)
    );
    return interaction.editReply({ embeds: [embed], components: [row] });
  }
}
