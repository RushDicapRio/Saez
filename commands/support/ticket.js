import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  MessageFlags,
} from 'discord.js';
import {
  getTicketConfig,
  saveTicketConfig,
  closeTicketChannel,
} from '../../services/ticketService.js';
import { generateTicketTranscript } from '../../services/supportService.js';
import { config } from '../../config.js';
import { getDb } from '../../database/mongo.js';
export const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('Système de gestion des tickets Saez Support avec transcripts et priorités')
  .addSubcommand((sub) =>
    sub
      .setName('panel')
      .setDescription('Envoie le panneau d\'ouverture de ticket interactif')
      .addChannelOption((opt) =>
        opt
          .setName('salon')
          .setDescription('Salon où poster le panneau (par défaut le salon actuel)')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('close')
      .setDescription('Ferme le ticket actuel et génère un transcript archivé')
      .addStringOption((opt) =>
        opt
          .setName('raison')
          .setDescription('Raison de la fermeture du ticket')
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('transcript')
      .setDescription('Génère et télécharge le transcript complet des messages de ce ticket')
  )
  .addSubcommand((sub) =>
    sub
      .setName('priority')
      .setDescription('Définir le niveau d\'urgence / priorité du ticket (Staff)')
      .addStringOption((opt) =>
        opt
          .setName('niveau')
          .setDescription('Niveau de priorité')
          .setRequired(true)
          .addChoices(
            { name: '🟢 Basse', value: 'low' },
            { name: '🟡 Moyenne', value: 'medium' },
            { name: '🟠 Haute', value: 'high' },
            { name: '🔴 Urgente / Bloquante', value: 'urgent' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('add')
      .setDescription('Ajoute un utilisateur au ticket actuel')
      .addUserOption((opt) =>
        opt
          .setName('membre')
          .setDescription('Membre à ajouter au salon')
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('remove')
      .setDescription('Retire un utilisateur du ticket actuel')
      .addUserOption((opt) =>
        opt
          .setName('membre')
          .setDescription('Membre à retirer du salon')
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('claim')
      .setDescription('Prendre en charge le ticket actuel (Staff)')
  )
  .addSubcommand((sub) =>
    sub
      .setName('config')
      .setDescription('Configure la catégorie et le rôle staff pour les tickets')
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
          .setDescription('Rôle membre du staff ayant accès aux tickets')
          .setRequired(false)
      )
      .addBooleanOption((opt) =>
        opt
          .setName('anti_staff_ping')
          .setDescription('Activer l\'avertissement et la fermeture auto en cas de ping du staff')
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
  );
export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  if (subcommand === 'panel') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      return await interaction.reply({
        content: '❌ Vous devez avoir la permission **Gérer les salons** pour poster le panneau.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const targetChannel = interaction.options.getChannel('salon') || interaction.channel;
    const embed = new EmbedBuilder()
      .setTitle('🎫 Centre de Support & Assistance — Saez Animes')
      .setDescription(
        'Besoin d’aide, d’assistance technique, ou d’effectuer un signalement sur **Saez Animes** ?\n\n' +
        'Cliquez sur le bouton ci-dessous pour ouvrir un ticket privé avec notre équipe.\n\n' +
        '**Catégories d\'aide :**\n' +
        '• 🛠️ **Support Technique :** Problème d\'installation, mise à jour ou écran noir.\n' +
        '• 🐛 **Signalement :** Lien mort, épisode manquant ou audio décalé.\n' +
        '• 💬 **Autre :** Question sur le mode VIP, partenariat ou demande générale.'
      )
      .setColor(config.colors.primary)
      .setThumbnail(config.assets.logoUrl)
      .setImage(config.assets.bannerUrl)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Support Officiel 7j/7' });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_open_ticket_support')
        .setLabel('Support Technique')
        .setEmoji('🛠️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('btn_open_ticket_bug')
        .setLabel('Signaler un bug')
        .setEmoji('🐛')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('btn_open_ticket_other')
        .setLabel('Autre demande')
        .setEmoji('💬')
        .setStyle(ButtonStyle.Success)
    );
    await targetChannel.send({ embeds: [embed], components: [row] });
    return await interaction.reply({
      content: `✅ Panneau de tickets envoyé avec succès dans <#${targetChannel.id}> !`,
      flags: MessageFlags.Ephemeral,
    });
  }
  const isTicketChannel = interaction.channel.name.startsWith('ticket-');
  if (subcommand === 'close') {
    if (!isTicketChannel) {
      return await interaction.reply({
        content: '❌ Cette commande ne peut être exécutée qu\'à l\'intérieur d\'un salon de ticket.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const reason = interaction.options.getString('raison') || 'Résolu';
    await interaction.reply({
      content: '⏳ Génération du transcript et fermeture du ticket en cours...',
    });
    const transRes = await generateTicketTranscript(interaction.channel);
    await closeTicketChannel(interaction.channel, interaction.user, reason, transRes.attachment);
    return;
  }
  if (subcommand === 'transcript') {
    if (!isTicketChannel) {
      return await interaction.reply({
        content: '❌ Cette commande ne peut être exécutée qu\'à l\'intérieur d\'un salon de ticket.',
        flags: MessageFlags.Ephemeral,
      });
    }
    await interaction.deferReply();
    const res = await generateTicketTranscript(interaction.channel);
    if (res.success && res.attachment) {
      return await interaction.editReply({
        content: `📄 **Transcript du ticket généré avec succès (${res.messageCount} messages) !**`,
        files: [res.attachment],
      });
    } else {
      return await interaction.editReply({
        content: `❌ Impossible de générer le transcript : ${res.error}`,
      });
    }
  }
  if (subcommand === 'priority') {
    if (!isTicketChannel) {
      return await interaction.reply({
        content: '❌ Cette commande ne peut être exécutée qu\'à l\'intérieur d\'un salon de ticket.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const level = interaction.options.getString('niveau');
    const priorityLabels = {
      low: { text: '🟢 Basse', color: 0x10b981 },
      medium: { text: '🟡 Moyenne', color: 0xf59e0b },
      high: { text: '🟠 Haute', color: 0xf97316 },
      urgent: { text: '🔴 Urgente', color: 0xef4444 },
    };
    const prio = priorityLabels[level] || priorityLabels.medium;
    const embed = new EmbedBuilder()
      .setTitle('📌 Priorité du Ticket Modifiée')
      .setDescription(`Ce ticket a été passé en priorité **${prio.text}** par ${interaction.user}.`)
      .setColor(prio.color)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return await interaction.reply({ embeds: [embed] });
  }
  if (subcommand === 'add') {
    if (!isTicketChannel) {
      return await interaction.reply({
        content: '❌ Cette commande ne peut être exécutée qu\'à l\'intérieur d\'un salon de ticket.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const member = interaction.options.getUser('membre');
    await interaction.channel.permissionOverwrites.edit(member.id, {
      ViewChannel: true,
      SendMessages: true,
      AttachFiles: true,
      EmbedLinks: true,
      ReadMessageHistory: true,
    });
    return await interaction.reply({
      content: `✅ L'utilisateur ${member} a été ajouté au ticket avec succès !`,
    });
  }
  if (subcommand === 'remove') {
    if (!isTicketChannel) {
      return await interaction.reply({
        content: '❌ Cette commande ne peut être exécutée qu\'à l\'intérieur d\'un salon de ticket.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const member = interaction.options.getUser('membre');
    await interaction.channel.permissionOverwrites.delete(member.id);
    return await interaction.reply({
      content: `✅ L'utilisateur ${member} a été retiré du ticket avec succès.`,
    });
  }
  if (subcommand === 'claim') {
    if (!isTicketChannel) {
      return await interaction.reply({
        content: '❌ Cette commande ne peut être exécutée qu\'à l\'intérieur d\'un salon de ticket.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const db = getDb();
    const ticketCol = db.collection('tickets');
    const doc = await ticketCol.findOne({ channel_id: interaction.channel.id });
    if (doc?.claimed_by) {
      return await interaction.reply({
        content: `⚠️ Ce ticket est déjà pris en charge par <@${doc.claimed_by}>.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    await ticketCol.updateOne(
      { channel_id: interaction.channel.id },
      { $set: { claimed_by: interaction.user.id, claimed_at: new Date() } }
    );
    const embed = new EmbedBuilder()
      .setTitle('🙋 Ticket Pris en Charge')
      .setDescription(`Ce ticket est désormais géré par ${interaction.user}.\n*L'équipe va vous répondre dans les plus brefs délais.*`)
      .setColor(config.colors.success)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return await interaction.reply({ embeds: [embed] });
  }
  if (subcommand === 'config') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({
        content: '❌ Vous devez avoir la permission **Gérer le serveur** pour configurer les tickets.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const cat = interaction.options.getChannel('categorie');
    const role = interaction.options.getRole('role_support');
    const antiPing = interaction.options.getBoolean('anti_staff_ping');
    const maxPings = interaction.options.getInteger('max_pings');
    const currentCfg = await getTicketConfig();
    const newCfg = { ...currentCfg };
    if (cat) newCfg.category_id = cat.id;
    if (role) newCfg.support_role_id = role.id;
    if (antiPing !== null) newCfg.anti_staff_ping = antiPing;
    if (maxPings !== null) newCfg.max_staff_pings = maxPings;
    await saveTicketConfig(newCfg);
    return await interaction.reply({
      content:
        `✅ **Configuration des tickets mise à jour avec succès !**\n` +
        `• Catégorie : ${newCfg.category_id ? `<#${newCfg.category_id}>` : '*Non définie*'}\n` +
        `• Rôle Support : ${newCfg.support_role_id ? `<@&${newCfg.support_role_id}>` : '*Non défini*'}\n` +
        `• Modération Pings Staff : ${newCfg.anti_staff_ping === false ? '🔴 Désactivée' : '🟢 Activée'}\n` +
        `• Pings Max avant fermeture : \`${newCfg.max_staff_pings || 2}\``,
      flags: MessageFlags.Ephemeral,
    });
  }
}
