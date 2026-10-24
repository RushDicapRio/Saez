import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { getTicketConfig, saveTicketConfig } from '../../services/ticketService.js';
import { getSuggestionChannelId, setSuggestionChannelId, buildSuggestionPanelEmbed, buildSuggestionPanelButtons } from '../../services/suggestionService.js';
import { buildSupportHubEmbed, buildSupportHubComponents } from '../../services/supportService.js';
import { getFunChannelId, setFunChannelId } from '../../services/funService.js';
import { getWelcomeConfig, saveWelcomeConfig } from '../../services/welcomeService.js';
import { getAutoRoleConfig, saveAutoRoleConfig } from '../../services/autoroleService.js';
import { getLogConfig, saveLogConfig } from '../../services/logService.js';
import { getSecurityConfig, saveSecurityConfig } from '../../services/securityService.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('config')
  .setDescription('Centre de configuration unifié de toutes les fonctionnalités du Bot Saez')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((sub) =>
    sub
      .setName('status')
      .setDescription('Affiche le tableau de bord complet de toutes les configurations actives')
  )
  .addSubcommand((sub) =>
    sub
      .setName('salon')
      .setDescription('Configurer le salon d\'un module spécifique')
      .addStringOption((opt) =>
        opt
          .setName('module')
          .setDescription('Le module à configurer')
          .setRequired(true)
          .addChoices(
            { name: '🎌 Demandes & Suggestions (Réception)', value: 'demandes' },
            { name: '🎮 Mini-Jeux Fun (Salon autorisé)', value: 'fun' },
            { name: '👋 Bienvenue (Arrivées)', value: 'welcome' },
            { name: '👋 Au revoir (Départs)', value: 'leave' },
            { name: '🎫 Tickets (Transcripts & Audit)', value: 'tickets_logs' },
            { name: '📂 Logs Serveur (Général)', value: 'logs_general' },
            { name: '💬 Logs Messages (Modifications & suppressions)', value: 'logs_messages' },
            { name: '👥 Logs Membres (Arrivées & départs)', value: 'logs_members' },
            { name: '⚖️ Logs Modération (Sanctions)', value: 'logs_moderation' },
            { name: '🔊 Logs Vocal (Connexions & salons)', value: 'logs_voice' }
          )
      )
      .addChannelOption((opt) =>
        opt
          .setName('salon')
          .setDescription('Le salon textuel à assigner')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('role')
      .setDescription('Configurer un rôle pour un module')
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('L\'action ou le module concerné')
          .setRequired(true)
          .addChoices(
            { name: '🎫 Rôle Support / Staff Tickets', value: 'ticket_support' },
            { name: '➕ Ajouter un rôle d\'arrivée automatique', value: 'autorole_add' },
            { name: '➖ Retirer un rôle d\'arrivée automatique', value: 'autorole_remove' }
          )
      )
      .addRoleOption((opt) =>
        opt
          .setName('role')
          .setDescription('Le rôle Discord à assigner ou modifier')
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('tickets')
      .setDescription('Configuration groupée du système de tickets')
      .addChannelOption((opt) =>
        opt
          .setName('categorie')
          .setDescription('Catégorie où seront créés les salons de tickets')
          .addChannelTypes(ChannelType.GuildCategory)
          .setRequired(false)
      )
      .addRoleOption((opt) =>
        opt
          .setName('role_support')
          .setDescription('Rôle autorisé à claim et gérer les tickets')
          .setRequired(false)
      )
      .addChannelOption((opt) =>
        opt
          .setName('salon_logs')
          .setDescription('Salon où archiver les transcripts de tickets fermés')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false)
      )
      .addBooleanOption((opt) =>
        opt
          .setName('anti_staff_ping')
          .setDescription('Activer/désactiver l\'avertissement et fermeture auto en cas de ping staff')
          .setRequired(false)
      )
      .addIntegerOption((opt) =>
        opt
          .setName('max_pings')
          .setDescription('Nombre max de pings du staff avant fermeture auto (défaut : 2)')
          .setMinValue(1)
          .setMaxValue(5)
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('panel')
      .setDescription('Déployer l\'un des panneaux interactifs officiels dans un salon')
      .addStringOption((opt) =>
        opt
          .setName('type')
          .setDescription('Le type de panneau à déployer')
          .setRequired(true)
          .addChoices(
            { name: '🛡️ Hub d\'Assistance & Support (FAQ, Diag, Bug, Tickets)', value: 'support_hub' },
            { name: '🎌 Panneau des Demandes d\'Animés & Idées', value: 'demandes' },
            { name: '🎫 Panneau simple de Tickets', value: 'ticket_simple' }
          )
      )
      .addChannelOption((opt) =>
        opt
          .setName('salon')
          .setDescription('Salon où envoyer le panneau (par défaut le salon actuel)')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('security')
      .setDescription('Activer ou désactiver les modules de sécurité')
      .addStringOption((opt) =>
        opt
          .setName('module')
          .setDescription('Le module de protection')
          .setRequired(true)
          .addChoices(
            { name: '🛡️ Protection Anti-Raid', value: 'antiraid' },
            { name: '⚡ Protection Anti-Spam', value: 'antispam' },
            { name: '🔗 Protection Anti-Pub & Liens', value: 'antilink' },
            { name: '🤬 Filtrage des mots interdits', value: 'word_filter' }
          )
      )
      .addBooleanOption((opt) =>
        opt
          .setName('actif')
          .setDescription('Activer (Vrai) ou Désactiver (Faux)')
          .setRequired(true)
      )
  );
export async function execute(interaction) {
  if (
    !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) &&
    !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
  ) {
    return await interaction.reply({
      content: '❌ Vous devez posséder la permission **Administrateur** ou **Gérer le serveur** pour utiliser `/config`.',
      flags: MessageFlags.Ephemeral,
    });
  }
  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guildId;
  if (subcommand === 'status') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const [ticketCfg, suggChanId, funChanId, welcomeCfg, autoRoleCfg, logCfg, secCfg] =
      await Promise.all([
        getTicketConfig().catch(() => ({})),
        getSuggestionChannelId(guildId).catch(() => null),
        getFunChannelId(guildId).catch(() => null),
        getWelcomeConfig().catch(() => ({})),
        getAutoRoleConfig().catch(() => ({ roles: [] })),
        getLogConfig(guildId).catch(() => ({})),
        getSecurityConfig().catch(() => ({})),
      ]);
    const autoroles = autoRoleCfg.roles || [];
    const formatChan = (id) => (id ? `<#${id}>` : '`Non configuré`');
    const formatRole = (id) => (id ? `<@&${id}>` : '`Aucun`');
    const formatBool = (b) => (b ? '🟢 Actif' : '🔴 Inactif');
    const embed = new EmbedBuilder()
      .setTitle('⚙️ Tableau de Bord Centralisé des Configurations — Saez Bot')
      .setDescription(
        'Retrouvez ci-dessous la synthèse de toutes les configurations actives du serveur **' +
          interaction.guild.name +
          '**.\n' +
          'Utilisez `/config salon`, `/config role`, `/config tickets` ou `/config security` pour ajuster chaque paramètre.'
      )
      .setColor(config.colors.primary)
      .setThumbnail(config.assets.logoUrl)
      .addFields(
        {
          name: '🎫 Support & Tickets',
          value:
            `• Catégorie : ${ticketCfg.category_id ? `<#${ticketCfg.category_id}>` : '`Automatique`'}\n` +
            `• Rôle Support : ${formatRole(ticketCfg.support_role_id)}\n` +
            `• Salon Transcripts : ${formatChan(ticketCfg.log_channel_id)}\n` +
            `• Anti-Ping Staff : ${ticketCfg.anti_staff_ping === false ? '🔴 Inactif' : `🟢 Actif (${ticketCfg.max_staff_pings || 2} max)`}`,
          inline: true,
        },
        {
          name: '🎌 Demandes & Suggestions',
          value:
            `• Salon Réception : ${formatChan(suggChanId)}\n` +
            `• Synchronisation : 🟢 En direct avec le logiciel Saez`,
          inline: true,
        },
        {
          name: '🎮 Jeux & Arcade',
          value:
            `• Salon Autorisé : ${formatChan(funChanId)}\n` +
            `• Commandes : Quiz, Morpion, Shifumi, Games...`,
          inline: true,
        },
        {
          name: '👋 Bienvenue & Départs',
          value:
            `• Salon Arrivées : ${formatChan(welcomeCfg.welcome?.channel_id)} (${formatBool(welcomeCfg.welcome?.enabled)})\n` +
            `• Salon Départs : ${formatChan(welcomeCfg.leave?.channel_id)} (${formatBool(welcomeCfg.leave?.enabled)})\n` +
            `• Rôles d'arrivée : ${autoroles.length > 0 ? autoroles.map((r) => `<@&${r.role_id || r.id}>`).join(', ') : '`Aucun`'}`,
          inline: false,
        },
        {
          name: '📂 Salons de Logs & Audit',
          value:
            `• Général : ${formatChan(logCfg.general_channel_id)}\n` +
            `• Messages : ${formatChan(logCfg.channels?.messages || logCfg.general_channel_id)}\n` +
            `• Membres : ${formatChan(logCfg.channels?.members || logCfg.general_channel_id)}\n` +
            `• Modération : ${formatChan(logCfg.channels?.moderation || logCfg.general_channel_id)}\n` +
            `• Vocal : ${formatChan(logCfg.channels?.voice || logCfg.general_channel_id)}`,
          inline: true,
        },
        {
          name: '🛡️ Sécurité & Protection',
          value:
            `• Anti-Raid : ${formatBool(secCfg.antiraid?.enabled)}\n` +
            `• Anti-Spam : ${formatBool(secCfg.antispam?.enabled)}\n` +
            `• Anti-Pub/Liens : ${formatBool(secCfg.antilink?.enabled)}\n` +
            `• Mots Interdits : ${formatBool(secCfg.word_filter?.enabled)}`,
          inline: true,
        }
      )
      .setFooter({
        text: 'Codé avec ❤️ par Saez | Saez Animes Config Manager • Toutes vos configurations en un seul endroit',
        iconURL: config.assets.logoUrl,
      })
      .setTimestamp();
    return await interaction.editReply({ embeds: [embed] });
  }
  if (subcommand === 'salon') {
    const mod = interaction.options.getString('module');
    const channel = interaction.options.getChannel('salon');
    if (mod === 'demandes') {
      await setSuggestionChannelId(guildId, channel.id);
      return await interaction.reply({
        content: `✅ Salon des **Demandes & Suggestions** configuré sur ${channel} !\nToutes les demandes y seront publiées et synchronisées avec le logiciel Saez.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (mod === 'fun') {
      await setFunChannelId(guildId, channel.id);
      return await interaction.reply({
        content: `✅ Salon des **Mini-Jeux & Divertissement** configuré sur ${channel} !\nLes jeux comme le Quiz, Morpion et Shifumi y sont désormais cantonnés.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (mod === 'welcome') {
      const wCfg = await getWelcomeConfig();
      wCfg.welcome.channel_id = channel.id;
      wCfg.welcome.enabled = true;
      await saveWelcomeConfig(wCfg);
      return await interaction.reply({
        content: `✅ Salon des **Messages de Bienvenue** configuré sur ${channel} !`,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (mod === 'leave') {
      const wCfg = await getWelcomeConfig();
      wCfg.leave.channel_id = channel.id;
      wCfg.leave.enabled = true;
      await saveWelcomeConfig(wCfg);
      return await interaction.reply({
        content: `✅ Salon des **Messages de Départ** configuré sur ${channel} !`,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (mod === 'tickets_logs') {
      await saveTicketConfig({ log_channel_id: channel.id });
      return await interaction.reply({
        content: `✅ Salon des **Logs et Transcripts de Tickets** configuré sur ${channel} !`,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (mod === 'logs_general') {
      const logCfg = await getLogConfig(guildId);
      logCfg.general_channel_id = channel.id;
      await saveLogConfig(guildId, logCfg);
      return await interaction.reply({
        content: `✅ Salon **Général de Logs** configuré sur ${channel} !`,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (mod.startsWith('logs_')) {
      const logType = mod.replace('logs_', '');
      const typeMap = {
        messages: 'messages',
        members: 'members',
        moderation: 'moderation',
        voice: 'voice',
      };
      const mappedType = typeMap[logType] || 'general';
      const logCfg = await getLogConfig(guildId);
      if (!logCfg.channels) logCfg.channels = {};
      logCfg.channels[mappedType] = channel.id;
      await saveLogConfig(guildId, logCfg);
      return await interaction.reply({
        content: `✅ Salon de logs spécifique **${logType}** configuré sur ${channel} !`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
  if (subcommand === 'role') {
    const action = interaction.options.getString('action');
    const role = interaction.options.getRole('role');
    if (action === 'ticket_support') {
      await saveTicketConfig({ support_role_id: role.id });
      return await interaction.reply({
        content: `✅ Rôle **Support / Staff Tickets** configuré sur ${role} !\nSes possesseurs peuvent désormais claim et administrer les tickets.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (action === 'autorole_add') {
      const aCfg = await getAutoRoleConfig();
      if (!aCfg.roles) aCfg.roles = [];
      if (!aCfg.roles.some((r) => r.role_id === role.id)) {
        aCfg.roles.push({
          role_id: role.id,
          label: role.name,
          emoji: '🏷️',
          description: `Rôle ${role.name}`,
          style: 'Primary',
        });
        await saveAutoRoleConfig(aCfg);
      }
      return await interaction.reply({
        content: `✅ Le rôle ${role} a été ajouté aux auto-rôles configurés !`,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (action === 'autorole_remove') {
      const aCfg = await getAutoRoleConfig();
      if (aCfg.roles) {
        aCfg.roles = aCfg.roles.filter((r) => r.role_id !== role.id);
        await saveAutoRoleConfig(aCfg);
      }
      return await interaction.reply({
        content: `✅ Le rôle ${role} a été retiré des auto-rôles configurés.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
  if (subcommand === 'tickets') {
    const category = interaction.options.getChannel('categorie');
    const supportRole = interaction.options.getRole('role_support');
    const logChannel = interaction.options.getChannel('salon_logs');
    const antiPing = interaction.options.getBoolean('anti_staff_ping');
    const maxPings = interaction.options.getInteger('max_pings');
    if (!category && !supportRole && !logChannel && antiPing === null && maxPings === null) {
      return await interaction.reply({
        content: '⚠️ Veuillez préciser au moins une option à configurer (catégorie, rôle, salon logs ou anti-ping).',
        flags: MessageFlags.Ephemeral,
      });
    }
    const updates = {};
    if (category) updates.category_id = category.id;
    if (supportRole) updates.support_role_id = supportRole.id;
    if (logChannel) updates.log_channel_id = logChannel.id;
    if (antiPing !== null) updates.anti_staff_ping = antiPing;
    if (maxPings !== null) updates.max_staff_pings = maxPings;
    await saveTicketConfig(updates);
    return await interaction.reply({
      content:
        `✅ **Configuration des tickets mise à jour avec succès :**\n` +
        (category ? `• Catégorie des salons : ${category}\n` : '') +
        (supportRole ? `• Rôle Support : ${supportRole}\n` : '') +
        (logChannel ? `• Salon des Transcripts : ${logChannel}\n` : '') +
        (antiPing !== null ? `• Anti-Ping Staff : ${antiPing ? '🟢 Activé' : '🔴 Désactivé'}\n` : '') +
        (maxPings !== null ? `• Pings Max avant fermeture : \`${maxPings}\`\n` : ''),
      flags: MessageFlags.Ephemeral,
    });
  }
  if (subcommand === 'panel') {
    const type = interaction.options.getString('type');
    const targetChannel = interaction.options.getChannel('salon') || interaction.channel;
    if (type === 'support_hub') {
      const embed = buildSupportHubEmbed();
      const components = buildSupportHubComponents();
      await targetChannel.send({ embeds: [embed], components });
      return await interaction.reply({
        content: `✅ Le **Hub d'Assistance & Support** a été déployé dans ${targetChannel} !`,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (type === 'demandes') {
      const embed = buildSuggestionPanelEmbed();
      const components = buildSuggestionPanelButtons();
      await targetChannel.send({ embeds: [embed], components });
      return await interaction.reply({
        content: `✅ Le **Panneau fixe des Demandes d'Animés & Idées** a été déployé dans ${targetChannel} !`,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (type === 'ticket_simple') {
      const { buildTicketPanelEmbed, buildTicketPanelComponents } = await import('../../services/ticketService.js');
      const embed = buildTicketPanelEmbed();
      const components = buildTicketPanelComponents();
      await targetChannel.send({ embeds: [embed], components });
      return await interaction.reply({
        content: `✅ Le **Panneau simple de Tickets** a été déployé dans ${targetChannel} !`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
  if (subcommand === 'security') {
    const secModule = interaction.options.getString('module');
    const active = interaction.options.getBoolean('actif');
    const secCfg = await getSecurityConfig();
    if (!secCfg[secModule]) secCfg[secModule] = {};
    secCfg[secModule].enabled = active;
    await saveSecurityConfig(secCfg);
    const labels = {
      antiraid: 'Protection Anti-Raid',
      antispam: 'Protection Anti-Spam',
      antilink: 'Protection Anti-Pub & Liens',
      word_filter: 'Filtrage des mots interdits',
    };
    return await interaction.reply({
      content: `✅ Le module **${labels[secModule] || secModule}** est désormais **${active ? '🟢 Activé' : '🔴 Désactivé'}** !`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
