import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, version as djsVersion } from 'discord.js';
import os from 'node:os';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('info')
  .setDescription('Informations détaillées sur les membres, le serveur, le bot, les salons et rôles')
  .addSubcommand((sub) =>
    sub
      .setName('user')
      .setDescription('Fiche détaillée d\'un membre (rôles, date d\'arrivée, avatar, badges)')
      .addUserOption((opt) => opt.setName('membre').setDescription('Membre à inspecter').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('serveur')
      .setDescription('Statistiques complètes du serveur (membres, salons, sécurité)')
  )
  .addSubcommand((sub) =>
    sub
      .setName('bot')
      .setDescription('État technique, latence, uptime et mémoire du bot Saez')
  )
  .addSubcommand((sub) =>
    sub
      .setName('salon')
      .setDescription('Informations sur un salon textuel, vocal ou forum')
      .addChannelOption((opt) => opt.setName('salon').setDescription('Salon à analyser').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('role')
      .setDescription('Permissions, couleur et membres d\'un rôle Discord')
      .addRoleOption((opt) => opt.setName('role').setDescription('Rôle à inspecter').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('avatar')
      .setDescription('Afficher l\'avatar HD d\'un membre')
      .addUserOption((opt) => opt.setName('membre').setDescription('Membre cible').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('banniere')
      .setDescription('Afficher la bannière personnalisée d\'un membre')
      .addUserOption((opt) => opt.setName('membre').setDescription('Membre cible').setRequired(false))
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'user') {
    const targetUser = interaction.options.getUser('membre') || interaction.user;
    const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);
    const fullUser = await interaction.client.users.fetch(targetUser.id, { force: true }).catch(() => targetUser);
    const createdAtTs = Math.floor(targetUser.createdTimestamp / 1000);
    const joinedAtTs = member?.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;
    const embed = new EmbedBuilder()
      .setAuthor({ name: `${targetUser.tag} (${targetUser.id})`, iconURL: targetUser.displayAvatarURL() })
      .setTitle(`👤 Profil de ${member?.displayName || targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
      .setColor(fullUser.hexAccentColor || member?.displayHexColor || 0x00e5ff)
      .addFields(
        { name: '📅 Création du compte', value: `<t:${createdAtTs}:f> (<t:${createdAtTs}:R>)`, inline: true },
        { name: '📥 Arrivée sur le serveur', value: joinedAtTs ? `<t:${joinedAtTs}:f> (<t:${joinedAtTs}:R>)` : 'Non présent', inline: true },
        { name: '🤖 Type de compte', value: targetUser.bot ? 'Bot Discord' : 'Utilisateur Humain', inline: true },
        { name: `🏷️ Rôles (${member?.roles?.cache?.size ? member.roles.cache.size - 1 : 0})`, value: member?.roles?.cache?.filter(r => r.id !== interaction.guild.id)?.map(r => `<@&${r.id}>`).slice(0, 15).join(', ') || 'Aucun rôle particulier' }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Inspecteur de Membres' })
      .setTimestamp();
    if (fullUser.bannerURL()) {
      embed.setImage(fullUser.bannerURL({ dynamic: true, size: 1024 }));
    }
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'serveur') {
    const guild = interaction.guild;
    const createdAtTs = Math.floor(guild.createdTimestamp / 1000);
    const owner = await guild.fetchOwner().catch(() => null);
    const embed = new EmbedBuilder()
      .setTitle(`🏰 Informations sur ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
      .setColor(0x00e5ff)
      .addFields(
        { name: '👑 Propriétaire', value: owner ? `<@${owner.id}> (${owner.user.tag})` : 'Inconnu', inline: true },
        { name: '👥 Membres', value: `**${guild.memberCount}** membres`, inline: true },
        { name: '🗓️ Création', value: `<t:${createdAtTs}:D>`, inline: true },
        { name: '💬 Salons', value: `**${guild.channels.cache.size}** salons`, inline: true },
        { name: '🛡️ Rôles', value: `**${guild.roles.cache.size}** rôles`, inline: true },
        { name: '✨ Niveau de Boost', value: `Palier ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)`, inline: true }
      )
      .setFooter({ text: `Codé avec ❤️ par Saez | ID Serveur : ${guild.id}` })
      .setTimestamp();
    if (guild.bannerURL()) embed.setImage(guild.bannerURL({ size: 1024 }));
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'bot') {
    const uptimeSec = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSec / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);
    const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const embed = new EmbedBuilder()
      .setTitle('🤖 État & Métriques du Bot Saez')
      .setColor(0x10b981)
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .addFields(
        { name: '⚡ Latence WebSocket', value: `\`${Math.round(interaction.client.ws.ping)} ms\``, inline: true },
        { name: '⏱️ Temps en Ligne', value: `\`${hours}h ${minutes}m\``, inline: true },
        { name: '💾 Mémoire Utilisée', value: `\`${memUsage} Mo\``, inline: true },
        { name: '📦 Node.js', value: `\`${process.version}\``, inline: true },
        { name: '📚 Discord.js', value: `\`v${djsVersion}\``, inline: true },
        { name: '🖥️ OS', value: `\`${os.type()} ${os.arch()}\``, inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Passerelle API & Engine Saez Live' })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'salon') {
    const ch = interaction.options.getChannel('salon') || interaction.channel;
    const createdAtTs = Math.floor(ch.createdTimestamp / 1000);
    const embed = new EmbedBuilder()
      .setTitle(`📍 Salon : #${ch.name}`)
      .setColor(0x00e5ff)
      .addFields(
        { name: '🆔 ID', value: `\`${ch.id}\``, inline: true },
        { name: '📂 Type', value: `${ch.type}`, inline: true },
        { name: '📅 Création', value: `<t:${createdAtTs}:f>`, inline: true },
        { name: '📝 Sujet / Description', value: ch.topic || '*Aucun sujet défini.*', inline: false }
      )
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'role') {
    const role = interaction.options.getRole('role');
    const createdAtTs = Math.floor(role.createdTimestamp / 1000);
    const embed = new EmbedBuilder()
      .setTitle(`🏷️ Rôle : @${role.name}`)
      .setColor(role.color || 0x64748b)
      .addFields(
        { name: '🆔 ID', value: `\`${role.id}\``, inline: true },
        { name: '🎨 Couleur', value: `\`${role.hexColor}\``, inline: true },
        { name: '👥 Membres ayant ce rôle', value: `**${role.members.size}**`, inline: true },
        { name: '⭐ Affiché séparément', value: role.hoist ? 'Oui' : 'Non', inline: true },
        { name: '📅 Création', value: `<t:${createdAtTs}:f>`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'avatar') {
    const targetUser = interaction.options.getUser('membre') || interaction.user;
    const avatarUrl = targetUser.displayAvatarURL({ dynamic: true, size: 2048 });
    const embed = new EmbedBuilder()
      .setTitle(`🖼️ Avatar de ${targetUser.username}`)
      .setImage(avatarUrl)
      .setColor(0x00e5ff)
      .setDescription(`[Ouvrir en taille originale](${avatarUrl})`)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes Media' });
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'banniere') {
    const targetUser = interaction.options.getUser('membre') || interaction.user;
    const fullUser = await interaction.client.users.fetch(targetUser.id, { force: true });
    const bannerUrl = fullUser.bannerURL({ dynamic: true, size: 2048 });
    if (!bannerUrl) {
      return interaction.reply({ content: `ℹ️ **${targetUser.username}** n'a pas configuré de bannière Discord personnalisée.`, ephemeral: true });
    }
    const embed = new EmbedBuilder()
      .setTitle(`🎨 Bannière de ${targetUser.username}`)
      .setImage(bannerUrl)
      .setColor(fullUser.hexAccentColor || 0x00e5ff)
      .setDescription(`[Ouvrir en taille originale](${bannerUrl})`)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return interaction.reply({ embeds: [embed] });
  }
}
