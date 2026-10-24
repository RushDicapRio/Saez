import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags, EmbedBuilder } from 'discord.js';
import { getLogConfig, saveLogConfig } from '../../services/logService.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('logs')
  .setDescription('Configuration du journal d\'audit et des salons de logs du serveur')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((sub) =>
    sub
      .setName('status')
      .setDescription('Affiche le statut et les salons assignés à chaque module de logs')
  )
  .addSubcommand((sub) =>
    sub
      .setName('channel')
      .setDescription('Définit le salon d\'un type de logs spécifique')
      .addStringOption((opt) =>
        opt
          .setName('type')
          .setDescription('Catégorie d\'événements à router')
          .setRequired(true)
          .addChoices(
            { name: '📂 Général (Tous les logs par défaut)', value: 'general' },
            { name: '💬 Messages (Suppressions & Modifications)', value: 'messages' },
            { name: '👥 Membres (Arrivées, Départs, Surnoms, Rôles)', value: 'members' },
            { name: '⚖️ Modération & Sanctions (Bans, Mutes, Warns)', value: 'moderation' },
            { name: '🔊 Vocal (Connexions & Déplacements)', value: 'voice' },
            { name: '📁 Structure (Salons & Rôles créés/supprimés)', value: 'server' }
          )
      )
      .addChannelOption((opt) =>
        opt
          .setName('salon')
          .setDescription('Salon textuel récepteur')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('toggle')
      .setDescription('Active ou désactive un module de journalisation')
      .addStringOption((opt) =>
        opt
          .setName('module')
          .setDescription('Module concerné')
          .setRequired(true)
          .addChoices(
            { name: '💬 Messages (Suppressions & Modifications)', value: 'messages' },
            { name: '👥 Membres (Arrivées & Départs & Rôles)', value: 'members' },
            { name: '⚖️ Modération & Sanctions', value: 'moderation' },
            { name: '📁 Structure (Salons & Rôles)', value: 'channels_roles' },
            { name: '🔊 Vocal', value: 'voice' }
          )
      )
      .addBooleanOption((opt) =>
        opt.setName('actif').setDescription('Activer ou désactiver').setRequired(true)
      )
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const guild = interaction.guild;
  const cfg = await getLogConfig(guild.id);
  if (sub === 'status') {
    const generalCh = cfg.general_channel_id ? `<#${cfg.general_channel_id}>` : '*Non configuré*';
    const msgCh = cfg.channels?.messages ? `<#${cfg.channels.messages}>` : `*(Par défaut: ${generalCh})*`;
    const memCh = cfg.channels?.members ? `<#${cfg.channels.members}>` : `*(Par défaut: ${generalCh})*`;
    const modCh = cfg.channels?.moderation ? `<#${cfg.channels.moderation}>` : `*(Par défaut: ${generalCh})*`;
    const voiCh = cfg.channels?.voice ? `<#${cfg.channels.voice}>` : `*(Par défaut: ${generalCh})*`;
    const srvCh = cfg.channels?.server ? `<#${cfg.channels.server}>` : `*(Par défaut: ${generalCh})*`;
    const embed = new EmbedBuilder()
      .setTitle('📜 Configuration du Journal d\'Audit & Logs')
      .setDescription('Voici l\'état des salons de réception et des modules actifs :')
      .setColor(config.colors.primary)
      .setThumbnail(config.assets.logoUrl)
      .addFields(
        {
          name: '📂 Salon Général par défaut',
          value: generalCh,
          inline: false,
        },
        {
          name: '💬 Journal Messages',
          value: `Statut : ${cfg.modules?.messages !== false ? '🟢 **Actif**' : '🔴 Inactif'}\nSalon : ${msgCh}`,
          inline: true,
        },
        {
          name: '👥 Journal Membres',
          value: `Statut : ${cfg.modules?.members !== false ? '🟢 **Actif**' : '🔴 Inactif'}\nSalon : ${memCh}`,
          inline: true,
        },
        {
          name: '⚖️ Journal Modération',
          value: `Statut : ${cfg.modules?.moderation !== false ? '🟢 **Actif**' : '🔴 Inactif'}\nSalon : ${modCh}`,
          inline: true,
        },
        {
          name: '🔊 Journal Vocal',
          value: `Statut : ${cfg.modules?.voice !== false ? '🟢 **Actif**' : '🔴 Inactif'}\nSalon : ${voiCh}`,
          inline: true,
        },
        {
          name: '📁 Salons & Rôles',
          value: `Statut : ${cfg.modules?.channels_roles !== false ? '🟢 **Actif**' : '🔴 Inactif'}\nSalon : ${srvCh}`,
          inline: true,
        }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système de Journalisation' })
      .setTimestamp();
    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
  if (sub === 'channel') {
    const type = interaction.options.getString('type');
    const channel = interaction.options.getChannel('salon');
    if (!cfg.channels) cfg.channels = {};
    if (type === 'general') {
      cfg.general_channel_id = channel.id;
    } else {
      cfg.channels[type] = channel.id;
    }
    await saveLogConfig(guild.id, cfg);
    return await interaction.reply({
      content: `✅ Le salon de logs pour **${type.toUpperCase()}** a été défini sur ${channel}.`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (sub === 'toggle') {
    const moduleName = interaction.options.getString('module');
    const actif = interaction.options.getBoolean('actif');
    if (!cfg.modules) cfg.modules = {};
    cfg.modules[moduleName] = actif;
    await saveLogConfig(guild.id, cfg);
    return await interaction.reply({
      content: `✅ Le module de log **${moduleName}** est désormais ${actif ? '🟢 **activé**' : '🔴 **désactivé**'}.`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
