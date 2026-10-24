import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
  EmbedBuilder,
} from 'discord.js';
import {
  createSuggestion,
  setSuggestionChannelId,
  ensureSuggestionChannelPermissions,
  getSuggestionChannelId,
  updateSuggestionStatus,
  deleteSuggestion,
  buildSuggestionPanelEmbed,
  buildSuggestionPanelButtons,
  SUGGESTION_STATUSES,
  SUGGESTION_CATEGORIES,
} from '../../services/suggestionService.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('suggestion')
  .setDescription('Système officiel de suggestions Saez (Synchronisé avec le logiciel)')
  .addSubcommand((sub) =>
    sub
      .setName('submit')
      .setDescription('Proposer une nouvelle suggestion ou demander un animé')
      .addStringOption((opt) =>
        opt
          .setName('titre')
          .setDescription('Titre court de votre suggestion (ex: Jujutsu Kaisen S2, Mode PiP...)')
          .setRequired(true)
          .setMaxLength(100)
      )
      .addStringOption((opt) =>
        opt
          .setName('description')
          .setDescription('Détails, liens ou explications de votre proposition')
          .setRequired(true)
          .setMaxLength(1000)
      )
      .addStringOption((opt) =>
        opt
          .setName('categorie')
          .setDescription('Type de suggestion')
          .setRequired(false)
          .addChoices(
            { name: '🎌 Animé demandé', value: 'anime' },
            { name: '💻 Fonctionnalité logicielle', value: 'feature' },
            { name: '⚡ Amélioration', value: 'improvement' },
            { name: '🐛 Signalement / Correctif', value: 'bug' },
            { name: '💡 Autre idée', value: 'other' }
          )
      )
      .addStringOption((opt) =>
        opt
          .setName('langue')
          .setDescription('Langue souhaitée (si animé)')
          .setRequired(false)
          .addChoices(
            { name: '🇯🇵 VOSTFR', value: 'VOSTFR' },
            { name: '🇫🇷 VF', value: 'VF' },
            { name: '✨ VOSTFR & VF', value: 'VOSTFR & VF' }
          )
      )
      .addStringOption((opt) =>
        opt
          .setName('image')
          .setDescription('URL de l\'affiche (optionnel, auto si animé)')
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('panel')
      .setDescription('Envoyer le panneau interactif fixe de suggestions avec boutons et formulaires')
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
      .setName('channel')
      .setDescription('Définir le salon où seront publiées les suggestions (Admin)')
      .addChannelOption((opt) =>
        opt
          .setName('salon')
          .setDescription('Le salon textuel dédié aux suggestions')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('status')
      .setDescription('Mettre à jour le statut d\'une suggestion (Modération / Staff)')
      .addStringOption((opt) =>
        opt
          .setName('id')
          .setDescription('L\'identifiant de la suggestion (ex: S-1) ou l\'ID du message Discord')
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName('statut')
          .setDescription('Nouveau statut officiel')
          .setRequired(true)
          .addChoices(
            { name: '🟡 En attente d\'avis', value: 'pending' },
            { name: '🟣 En cours d\'étude', value: 'in_progress' },
            { name: '🟢 Acceptée / Validée', value: 'accepted' },
            { name: '🔴 Refusée', value: 'rejected' }
          )
      )
      .addStringOption((opt) =>
        opt
          .setName('reponse')
          .setDescription('Commentaire ou mot officiel de l\'équipe')
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('delete')
      .setDescription('Supprimer définitivement une suggestion et son message Discord (Staff)')
      .addStringOption((opt) =>
        opt
          .setName('id')
          .setDescription('L\'identifiant de la suggestion (ex: S-1) ou l\'ID du message Discord')
          .setRequired(true)
      )
  );
export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  if (subcommand === 'panel') {
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) &&
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
    ) {
      return await interaction.reply({
        content: '⛔ Vous devez avoir la permission **Gérer les salons** pour poster le panneau de suggestions.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const targetChannel = interaction.options.getChannel('salon') || interaction.channel;
    const embed = buildSuggestionPanelEmbed();
    const components = buildSuggestionPanelButtons();
    await targetChannel.send({ embeds: [embed], components });
    await setSuggestionChannelId(interaction.guildId, targetChannel.id);
    return await interaction.reply({
      content: `✅ **Panneau de suggestions envoyé avec succès dans <#${targetChannel.id}> !**\nLes membres peuvent désormais cliquer sur les boutons pour ouvrir les formulaires et soumettre leurs demandes.`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (subcommand === 'submit') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const title = interaction.options.getString('titre');
    const description = interaction.options.getString('description');
    const category = interaction.options.getString('categorie') || 'anime';
    const language = interaction.options.getString('langue') || null;
    const imageUrl = interaction.options.getString('image') || null;
    try {
      const sugg = await createSuggestion({
        title,
        description,
        category,
        language,
        imageUrl,
        author: {
          id: interaction.user.id,
          username: interaction.user.username,
          avatar: interaction.user.displayAvatarURL({ dynamic: true }),
          source: 'discord',
        },
        guildId: interaction.guildId,
        client: interaction.client,
      });
      const channelMention = sugg.channel_id ? `<#${sugg.channel_id}>` : 'le salon des suggestions';
      return await interaction.editReply({
        content: `🎉 **Votre suggestion #${sugg.sugg_id} a été publiée dans ${channelMention} !**\n\n` +
          `• 💡 **Titre :** ${sugg.title}\n` +
          `• 🏷️ **Catégorie :** ${SUGGESTION_CATEGORIES[category]?.label || category}\n` +
          `• 🔄 **Synchronisation :** Votre demande est maintenant visible en direct dans le logiciel **Saez Animes** !`,
      });
    } catch (err) {
      console.error('[SUGGESTION] Erreur soumission :', err);
      return await interaction.editReply({
        content: `❌ Une erreur est survenue lors de la création de la suggestion : ${err.message}`,
      });
    }
  }
  if (subcommand === 'channel') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({
        content: '⛔ Vous devez avoir la permission **Gérer le serveur** pour configurer ce salon.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const channel = interaction.options.getChannel('salon');
    await setSuggestionChannelId(interaction.guildId, channel.id, interaction.client);
    await ensureSuggestionChannelPermissions(channel);
    return await interaction.reply({
      content: `✅ Le salon des suggestions a été configuré avec succès sur <#${channel.id}> !\nLes nouvelles suggestions créées sur Discord ou depuis le logiciel Saez y seront automatiquement publiées.`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (subcommand === 'status') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
      return await interaction.reply({
        content: '⛔ Vous devez avoir la permission **Gérer les messages** pour modifier le statut d\'une suggestion.',
        flags: MessageFlags.Ephemeral,
      });
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const id = interaction.options.getString('id');
    const newStatus = interaction.options.getString('statut');
    const comment = interaction.options.getString('reponse');
    const result = await updateSuggestionStatus({
      suggestionId: id,
      status: newStatus,
      comment,
      adminUser: interaction.user.username,
      client: interaction.client,
    });
    if (!result.success) {
      return await interaction.editReply({
        content: `❌ ${result.message}`,
      });
    }
    const statusInfo = SUGGESTION_STATUSES[newStatus];
    return await interaction.editReply({
      content: `✅ **Statut mis à jour avec succès !**\n\n` +
        `• **Suggestion :** #${result.suggestion.sugg_id} (${result.suggestion.title})\n` +
        `• **Nouveau statut :** ${statusInfo.badge} (${statusInfo.label})\n` +
        `• **Message Discord, fil de discussion & Logiciel synchronisés !**`,
    });
  }
  if (subcommand === 'delete') {
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) &&
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
    ) {
      return await interaction.reply({
        content: '⛔ Vous devez avoir la permission **Gérer les messages** pour supprimer une suggestion.',
        flags: MessageFlags.Ephemeral,
      });
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const id = interaction.options.getString('id');
    const result = await deleteSuggestion({
      suggestionId: id,
      client: interaction.client,
    });
    if (!result.success) {
      return await interaction.editReply({
        content: `❌ ${result.message}`,
      });
    }
    return await interaction.editReply({
      content: `🗑️ **Suggestion #${result.suggestion?.sugg_id || id} supprimée avec succès !**\nLe message dans le salon Discord et le fil de discussion associé ont été supprimés.`,
    });
  }
}
