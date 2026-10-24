import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
  EmbedBuilder,
} from 'discord.js';
import {
  getAutoRoleConfig,
  saveAutoRoleConfig,
  buildAutoRolePanel,
} from '../../services/autoroleService.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('autorole')
  .setDescription('Système complet d’auto-rôles et rôles par réaction/bouton')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addSubcommand((sub) =>
    sub
      .setName('panel')
      .setDescription('Envoie ou actualise le panneau interactif d\'auto-rôles')
      .addChannelOption((opt) =>
        opt
          .setName('salon')
          .setDescription('Salon où envoyer le panneau (ex: #auto-rôles)')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false)
      )
      .addStringOption((opt) =>
        opt
          .setName('titre')
          .setDescription('Titre personnalisé pour l\'embed du panneau')
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('add')
      .setDescription('Ajoute un rôle sélectionnable avec un bouton au panneau')
      .addRoleOption((opt) =>
        opt
          .setName('role')
          .setDescription('Le rôle à faire choisir aux membres')
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName('texte')
          .setDescription('Texte du bouton (ex: Notifications Sorties)')
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName('emoji')
          .setDescription('Emoji sur le bouton (ex: 🔔, 🎮, 🎬)')
          .setRequired(false)
      )
      .addStringOption((opt) =>
        opt
          .setName('description')
          .setDescription('Courte description explicative affichée dans l\'embed')
          .setRequired(false)
      )
      .addStringOption((opt) =>
        opt
          .setName('couleur')
          .setDescription('Couleur du bouton')
          .setRequired(false)
          .addChoices(
            { name: 'Bleu (Primary)', value: 'Primary' },
            { name: 'Gris (Secondary)', value: 'Secondary' },
            { name: 'Vert (Success)', value: 'Success' },
            { name: 'Rouge (Danger)', value: 'Danger' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('remove')
      .setDescription('Retire un rôle de la liste des auto-rôles')
      .addRoleOption((opt) =>
        opt
          .setName('role')
          .setDescription('Le rôle à retirer')
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('list')
      .setDescription('Affiche la liste de tous les auto-rôles actuellement configurés')
  );
export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const cfg = await getAutoRoleConfig();
  if (subcommand === 'panel') {
    let targetChannel = interaction.options.getChannel('salon');
    if (!targetChannel) {
      if (cfg.channel_id) {
        targetChannel = interaction.guild.channels.cache.get(cfg.channel_id);
      }
      if (!targetChannel) {
        targetChannel = interaction.guild.channels.cache.find(
          (c) => c.type === ChannelType.GuildText && c.name.toLowerCase().includes('auto-r')
        );
      }
      if (!targetChannel) {
        targetChannel = interaction.channel;
      }
    }
    const customTitle = interaction.options.getString('titre');
    if (customTitle) cfg.title = customTitle;
    cfg.channel_id = targetChannel.id;
    await saveAutoRoleConfig(cfg);
    const { embed, components } = buildAutoRolePanel(cfg, interaction.guild);
    await targetChannel.send({ embeds: [embed], components });
    return await interaction.reply({
      content: `✅ Le panneau d'auto-rôles a été publié dans ${targetChannel} avec succès !`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (subcommand === 'add') {
    const role = interaction.options.getRole('role');
    const label = interaction.options.getString('texte');
    const emoji = interaction.options.getString('emoji') || '';
    const desc = interaction.options.getString('description') || '';
    const style = interaction.options.getString('couleur') || 'Primary';
    const exists = cfg.roles.find((r) => r.role_id === role.id);
    if (exists) {
      exists.label = label;
      exists.emoji = emoji;
      exists.description = desc;
      exists.style = style;
    } else {
      cfg.roles.push({
        role_id: role.id,
        label,
        emoji,
        description: desc,
        style,
      });
    }
    await saveAutoRoleConfig(cfg);
    return await interaction.reply({
      content: `✅ Le rôle ${role} (**${label}**) a été ajouté à la configuration des auto-rôles !\nUtilisez \`/autorole panel\` pour publier ou actualiser le panneau.`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (subcommand === 'remove') {
    const role = interaction.options.getRole('role');
    const initialLen = cfg.roles.length;
    cfg.roles = cfg.roles.filter((r) => r.role_id !== role.id);
    if (cfg.roles.length === initialLen) {
      return await interaction.reply({
        content: `⚠️ Le rôle ${role} n'était pas présent dans la liste des auto-rôles.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    await saveAutoRoleConfig(cfg);
    return await interaction.reply({
      content: `🗑️ Le rôle ${role} a été retiré de la liste des auto-rôles.`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (subcommand === 'list') {
    const embed = new EmbedBuilder()
      .setTitle('📋 Configuration des Auto-Rôles')
      .setColor(config.colors.primary)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système d’Auto-Rôles' });
    if (!cfg.roles || cfg.roles.length === 0) {
      embed.setDescription('Aucun rôle n\'est actuellement configuré.');
    } else {
      const lines = cfg.roles.map(
        (r, i) =>
          `${i + 1}. ${r.emoji ? `${r.emoji} ` : ''}<@&${r.role_id}> — **${r.label}**\n> *Style : ${r.style}*${r.description ? ` • ${r.description}` : ''}`
      );
      embed.setDescription(lines.join('\n\n'));
    }
    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
}
