import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';
import { searchAnimes, getRecentReleases } from '../../services/catalogueService.js';
import { getPlanningForDay } from '../../services/planningService.js';
import { getSaezRealStats } from '../../services/statsService.js';
import { getUserProfile, getOnlineUsers } from '../../services/userService.js';
import { getLeaderboard } from '../../services/leaderboardService.js';
import { syncDiscordStatsChannels } from '../../services/channelSyncService.js';
import { getDb } from '../../database/mongo.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('logiciel')
  .setDescription('Toutes les fonctionnalités connectées à votre logiciel Saez Animes')
  .addSubcommand((sub) =>
    sub
      .setName('catalogue')
      .setDescription('Recherche un animé dans le catalogue officiel de Saez')
      .addStringOption((opt) =>
        opt.setName('titre').setDescription('Titre ou mot-clé de l’animé recherché').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('profil')
      .setDescription('Consulte le profil d’un utilisateur Saez Animes (Niveau, XP, Rang, Statut)')
      .addStringOption((opt) =>
        opt.setName('pseudo').setDescription('Pseudo du membre Saez Animes').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('stats')
      .setDescription('Affiche les statistiques réelles du logiciel Saez Animes en direct')
  )
  .addSubcommand((sub) =>
    sub
      .setName('recent')
      .setDescription('Affiche les dernières sorties et nouveautés ajoutées dans Saez Animes')
  )
  .addSubcommand((sub) =>
    sub
      .setName('planning')
      .setDescription('Consulte le planning des diffusions et sorties programmées sur Saez')
      .addIntegerOption((opt) =>
        opt
          .setName('jour')
          .setDescription('Jour de la semaine (1 = Lundi, 7 = Dimanche)')
          .setRequired(false)
          .addChoices(
            { name: 'Lundi', value: 1 },
            { name: 'Mardi', value: 2 },
            { name: 'Mercredi', value: 3 },
            { name: 'Jeudi', value: 4 },
            { name: 'Vendredi', value: 5 },
            { name: 'Samedi', value: 6 },
            { name: 'Dimanche', value: 7 }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('online')
      .setDescription('Affiche la liste des personnes actuellement en train d’utiliser Saez')
  )
  .addSubcommand((sub) =>
    sub
      .setName('sync')
      .setDescription('[Admin] Force la synchronisation immédiate des salons de statistiques')
  )
  .addSubcommand((sub) =>
    sub
      .setName('version')
      .setDescription('Vérifie la dernière version officielle disponible de Saez Animes')
  )
  .addSubcommand((sub) =>
    sub
      .setName('classement')
      .setDescription('Affiche le classement des membres Saez les plus actifs (Niveaux & XP)')
  )
  .addSubcommand((sub) =>
    sub
      .setName('aide')
      .setDescription('Guide et aide spécifique sur l\'intégration du logiciel Saez Animes')
  );
export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  if (subcommand === 'catalogue') {
    const query = interaction.options.getString('titre');
    await interaction.deferReply();
    try {
      const results = await searchAnimes(query, 3);
      if (results.length === 0) {
        return await interaction.editReply({
          content: `🔍 Aucun animé ne correspond à votre recherche « **${query}** » dans le catalogue Saez.`,
        });
      }
      const first = results[0];
      const seasonsCount = Array.isArray(first.seasons) ? first.seasons.length : 0;
      let totalEp = 0;
      if (Array.isArray(first.seasons)) {
        for (const s of first.seasons) {
          if (Array.isArray(s.episodes)) totalEp += s.episodes.length;
        }
      }
      const embed = new EmbedBuilder()
        .setTitle(`📺 ${first.title}`)
        .setDescription(
          first.description
            ? first.description.length > 350
              ? `${first.description.slice(0, 350)}...`
              : first.description
            : 'Aucune description disponible.'
        )
        .setColor(config.colors.accent)
        .addFields(
          { name: '📅 Année', value: `${first.year || 'Non spécifiée'}`, inline: true },
          { name: '🎞️ Contenu', value: `${seasonsCount} saison(s) • ${totalEp} épisode(s)`, inline: true },
          { name: '🏷️ Genres', value: first.genres || 'Animation', inline: false }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Catalogue officiel' })
        .setTimestamp();
      if (first.banner_url || first.cover_url) {
        embed.setImage(first.banner_url || first.cover_url);
      }
      return await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      return await interaction.editReply({ content: `❌ Erreur : ${err.message}` });
    }
  }
  if (subcommand === 'profil') {
    const target = interaction.options.getString('pseudo');
    await interaction.deferReply();
    try {
      const profile = await getUserProfile(target);
      if (!profile) {
        return await interaction.editReply({
          content: `❌ Aucun compte ou activité trouvée pour le pseudo « **${target}** » dans Saez.`,
        });
      }
      const { level, currentLevelXp, nextLevelXp, progressPct, totalXp } = profile.levelInfo;
      const roleLabel =
        profile.role === 'admin' ? '👑 Administrateur' : profile.role === 'premium' ? '⭐ VIP Premium' : 'Membre';
      const embed = new EmbedBuilder()
        .setTitle(`Profil de ${profile.username}`)
        .setColor(profile.role === 'admin' ? config.colors.accent : config.colors.primary)
        .addFields(
          { name: '🎖️ Rôle', value: roleLabel, inline: true },
          { name: '⭐ Niveau', value: `Niveau **${level}**`, inline: true },
          { name: '⚡ Expérience (XP)', value: `${currentLevelXp} / ${nextLevelXp} XP (${progressPct}%)\n*Total : ${totalXp} XP*`, inline: false },
          { name: '📺 Épisodes vus', value: `\`${profile.episodesCount}\` épisodes`, inline: true },
          { name: '💰 Solde de pièces', value: `\`${profile.balance}\` pièces`, inline: true },
          { name: '📡 Statut Saez', value: profile.status === 'offline' ? '⚪ Hors-ligne' : `🟢 ${profile.activity}`, inline: false }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système de Niveaux RPG' })
        .setTimestamp();
      if (profile.avatar && (profile.avatar.startsWith('http://') || profile.avatar.startsWith('https://'))) {
        embed.setThumbnail(profile.avatar);
      } else {
        embed.setThumbnail(config.assets.logoUrl);
      }
      return await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      return await interaction.editReply({ content: `❌ Erreur : ${err.message}` });
    }
  }
  if (subcommand === 'stats') {
    await interaction.deferReply();
    try {
      const stats = await getSaezRealStats();
      const embed = new EmbedBuilder()
        .setTitle('📊 Statistiques Officielles — Saez Animes')
        .setDescription('Voici les chiffres réels du catalogue et de la communauté Saez synchronisés en direct :')
        .setColor(config.colors.primary)
        .setThumbnail(config.assets.logoUrl)
        .addFields(
          { name: '🟢 Utilisateurs en ligne', value: `\`${stats.onlineUsers.toLocaleString('fr-FR')}\` membre(s) actif(s)`, inline: true },
          { name: '🎌 Catalogue Animés', value: `\`${stats.totalAnimes.toLocaleString('fr-FR')}\` animés répertoriés`, inline: true },
          { name: '📺 Épisodes Disponibles', value: `\`${stats.totalEpisodes.toLocaleString('fr-FR')}\` épisodes de séries`, inline: true },
          { name: '🎬 Films d’Animation', value: `\`${stats.totalFilms.toLocaleString('fr-FR')}\` films complets`, inline: true },
          { name: '💿 OAV & Spéciaux', value: `\`${stats.totalOav.toLocaleString('fr-FR')}\` OAV répertoriés`, inline: true },
          { name: '🍿 Épisodes Visionnés', value: `\`${stats.totalWatched.toLocaleString('fr-FR')}\` lectures par la communauté`, inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Données synchronisées via MongoDB Atlas', iconURL: config.assets.logoUrl })
        .setTimestamp();
      return await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      return await interaction.editReply({ content: '❌ Impossible de récupérer les statistiques de Saez.' });
    }
  }
  if (subcommand === 'recent') {
    await interaction.deferReply();
    try {
      const releases = await getRecentReleases(6);
      const embed = new EmbedBuilder()
        .setTitle('🎉 Dernières Nouveautés — Saez Animes')
        .setDescription('Voici les derniers animés et saisons récemment publiés dans l’application :')
        .setColor(config.colors.accent)
        .setThumbnail(config.assets.logoUrl)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Mises à jour en direct' })
        .setTimestamp();
      if (releases.length === 0) {
        embed.setDescription('Aucune sortie récente n\'a encore été enregistrée.');
      } else {
        for (const r of releases) {
          const title = r.anime_title || r.title || 'Animé';
          const detail = r.season_title ? `${r.season_title} ${r.episode_title ? `• ${r.episode_title}` : ''}` : 'Nouvelle fiche disponible';
          embed.addFields({ name: `🍿 ${title}`, value: detail, inline: true });
        }
      }
      return await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      return await interaction.editReply({ content: '❌ Impossible de récupérer les nouveautés.' });
    }
  }
  if (subcommand === 'planning') {
    const dayOption = interaction.options.getInteger('jour');
    await interaction.deferReply();
    try {
      const { dayName, entries } = await getPlanningForDay(dayOption);
      const embed = new EmbedBuilder()
        .setTitle(`📅 Planning des Sorties — ${dayName}`)
        .setColor(config.colors.primary)
        .setThumbnail(config.assets.logoUrl)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Planning Hebdomadaire' })
        .setTimestamp();
      if (entries.length === 0) {
        embed.setDescription(`Aucune sortie n'est actuellement programmée pour **${dayName}**.`);
      } else {
        for (const e of entries.slice(0, 15)) {
          const time = e.air_time ? `🕒 ${e.air_time}` : '🕒 Heure non fixée';
          const released = e.is_released_today ? '✔ *Disponible*' : '⏳ *En attente*';
          embed.addFields({
            name: `${e.title}`,
            value: `${e.episode_info || 'Épisode'} • ${time} • ${released}`,
            inline: false,
          });
        }
      }
      return await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      return await interaction.editReply({ content: '❌ Impossible de récupérer le planning.' });
    }
  }
  if (subcommand === 'online') {
    await interaction.deferReply();
    try {
      const active = await getOnlineUsers();
      const embed = new EmbedBuilder()
        .setTitle(`🟢 Utilisateurs en Ligne sur Saez (${active.length})`)
        .setColor(config.colors.success)
        .setThumbnail(config.assets.logoUrl)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Présences temps réel' })
        .setTimestamp();
      if (active.length === 0) {
        embed.setDescription('Aucun utilisateur n\'est actuellement actif sur Saez.');
      } else {
        const lines = active.slice(0, 15).map((u) => `• **${u.username}** — ${u.activity || 'En ligne'}`);
        embed.setDescription(lines.join('\n'));
      }
      return await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      return await interaction.editReply({ content: '❌ Impossible de lire les présences.' });
    }
  }
  if (subcommand === 'sync') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      return await interaction.reply({ content: '❌ Permission requise : Gérer les salons.', flags: MessageFlags.Ephemeral });
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      const res = await syncDiscordStatsChannels(interaction.client, true);
      return await interaction.editReply({ content: res.success ? `✅ **Synchronisation terminée !**\n${res.message}` : `⚠️ ${res.message}` });
    } catch (err) {
      return await interaction.editReply({ content: `❌ Erreur : ${err.message}` });
    }
  }
  if (subcommand === 'version') {
    await interaction.deferReply();
    try {
      const db = getDb();
      const col = db.collection('app_version');
      const doc = await col.findOne({ _id: 'latest_version' });
      const versionInfo = doc?.data || {
        version: '1.0.4',
        changelog: 'Mises à jour de stabilité et nouvelles fonctionnalités.',
        download_url: 'https://discord.gg/4djy4pesKd',
      };
      const embed = new EmbedBuilder()
        .setTitle(`🚀 Version de Saez Animes : v${versionInfo.version}`)
        .setDescription(`La dernière version officielle est la **v${versionInfo.version}**.\n\n**Changelog :**\n${versionInfo.changelog || 'Mises à jour de performances.'}`)
        .setColor(config.colors.primary)
        .setThumbnail(config.assets.logoUrl)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système de Mise à Jour' })
        .setTimestamp();
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Télécharger').setStyle(ButtonStyle.Link).setURL(versionInfo.download_url || 'https://discord.gg/4djy4pesKd')
      );
      return await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      return await interaction.editReply({ content: '❌ Erreur de version.' });
    }
  }
  if (subcommand === 'classement') {
    await interaction.deferReply();
    try {
      const list = await getLeaderboard(10);
      const embed = new EmbedBuilder()
        .setTitle('🏆 Classement des Membres — Saez Animes')
        .setDescription('Top 10 des utilisateurs ayant le plus haut niveau et le plus d’XP :')
        .setColor(0xfbbf24)
        .setThumbnail(config.assets.logoUrl)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Espace Level' })
        .setTimestamp();
      if (list.length === 0) {
        embed.setDescription('Aucun membre dans le classement pour le moment.');
      } else {
        const medals = ['🥇', '🥈', '🥉'];
        const lines = list.map((u) => `${medals[u.rank - 1] || `\`#${u.rank}\``} **${u.username}** — Niveau **${u.level}** (\`${u.xp.toLocaleString('fr-FR')} XP\`) • \`${u.episodesCount} épisodes\``);
        embed.setDescription(lines.join('\n\n'));
      }
      return await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      return await interaction.editReply({ content: '❌ Impossible de charger le classement.' });
    }
  }
  if (subcommand === 'aide') {
    const embed = new EmbedBuilder()
      .setTitle('📖 Guide du Logiciel Saez Animes')
      .setDescription('Toutes les sous-commandes de `/logiciel` sont synchronisées en direct avec votre application :')
      .setColor(config.colors.primary)
      .setThumbnail(config.assets.logoUrl)
      .addFields(
        { name: '📺 /logiciel catalogue <titre>', value: 'Rechercher un animé avec synopsis, saisons et genres.' },
        { name: '👤 /logiciel profil <pseudo>', value: 'Consulter le niveau RPG, XP et épisodes vus d\'un utilisateur.' },
        { name: '📊 /logiciel stats', value: 'Chiffres réels en direct (utilisateurs, catalogue, épisodes).' },
        { name: '🍿 /logiciel recent', value: 'Derniers animés et saisons ajoutés.' },
        { name: '📅 /logiciel planning [jour]', value: 'Calendrier des sorties hebdomadaires.' },
        { name: '🟢 /logiciel online', value: 'Membres actuellement connectés sur l\'application.' },
        { name: '🏆 /logiciel classement', value: 'Top 10 des utilisateurs les plus actifs sur Saez.' },
        { name: '🚀 /logiciel version', value: 'Téléchargement et vérification des mises à jour.' }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Logiciel Desktop & Bot' });
    return await interaction.reply({ embeds: [embed] });
  }
}
