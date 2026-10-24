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
  buildSuggestionPanelEmbed,
  buildSuggestionPanelButtons,
  SUGGESTION_STATUSES,
  SUGGESTION_CATEGORIES,
} from '../../services/suggestionService.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('demande')
  .setDescription('Centre officiel de demandes d\'animés et suggestions Saez (Synchronisé avec le logiciel)')
  .addSubcommand((sub) =>
    sub
      .setName('panel')
      .setDescription('Déployer le panneau interactif fixe pour que les membres fassent leurs demandes')
      .addChannelOption((opt) =>
        opt
          .setName('salon')
          .setDescription('Salon où poster le panneau fixe (par défaut le salon actuel)')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('salon')
      .setDescription('Configurer le salon spécifique où arrivent toutes les demandes soumises (Admin)')
      .addChannelOption((opt) =>
        opt
          .setName('salon')
          .setDescription('Le salon textuel de réception des demandes')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('submit')
      .setDescription('Soumettre directement une demande d\'animé ou une idée logicielle')
      .addStringOption((opt) =>
        opt
          .setName('titre')
          .setDescription('Nom de l\'animé ou titre de la demande (ex: Solo Leveling S2, Mode PiP...)')
          .setRequired(true)
          .setMaxLength(100)
      )
      .addStringOption((opt) =>
        opt
          .setName('description')
          .setDescription('Précisions, saison, langues (VF/VOSTFR) ou explication')
          .setRequired(true)
          .setMaxLength(1000)
      )
      .addStringOption((opt) =>
        opt
          .setName('categorie')
          .setDescription('Type de demande')
          .setRequired(false)
          .addChoices(
            { name: '🎌 Animé demandé', value: 'anime' },
            { name: '💻 Fonctionnalité logicielle', value: 'feature' },
            { name: '⚡ Amélioration générale', value: 'improvement' },
            { name: '💡 Autre idée', value: 'other' }
          )
      )
      .addStringOption((opt) =>
        opt
          .setName('langue')
          .setDescription('Langue souhaitée pour l\'animé (ex: VOSTFR, VF, VF & VOSTFR)')
          .setRequired(false)
          .addChoices(
            { name: '🎌 VOSTFR', value: 'VOSTFR' },
            { name: '🇫🇷 VF', value: 'VF' },
            { name: '🎌 & 🇫🇷 VF & VOSTFR (Les deux)', value: 'VOSTFR & VF' }
          )
      )
      .addStringOption((opt) =>
        opt
          .setName('image')
          .setDescription('Lien URL de l\'affiche (laissez vide pour détection automatique)')
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('status')
      .setDescription('Mettre à jour le statut d\'une demande (Staff / Modération)')
      .addStringOption((opt) =>
        opt
          .setName('id')
          .setDescription('L\'ID de la demande (ex: S-1)')
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName('statut')
          .setDescription('Nouveau statut')
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
          .setName('commentaire')
          .setDescription('Commentaire du staff (ex: Ajout prévu pour la mise à jour v1.2)')
          .setRequired(false)
          .setMaxLength(300)
      )
  );
export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  if (subcommand === 'panel') {
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) &&
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      return await interaction.reply({
        content: '❌ Vous devez avoir la permission **Gérer les salons** pour envoyer ce panneau.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const targetChannel = interaction.options.getChannel('salon') || interaction.channel;
    const embed = buildSuggestionPanelEmbed();
    const components = buildSuggestionPanelButtons();
    await targetChannel.send({
      embeds: [embed],
      components,
    });
    return await interaction.reply({
      content: `✅ Le **Panneau fixe de demandes & suggestions** a été déployé avec succès dans ${targetChannel} !`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (subcommand === 'salon') {
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) &&
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      return await interaction.reply({
        content: '❌ Vous devez avoir la permission **Gérer le serveur** pour configurer ce salon.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const targetChannel = interaction.options.getChannel('salon');
    await setSuggestionChannelId(interaction.guildId, targetChannel.id, interaction.client);
    await ensureSuggestionChannelPermissions(targetChannel);
    return await interaction.reply({
      content: `✅ Le salon de réception des demandes a été configuré sur ${targetChannel} !\nToutes les demandes y seront postées automatiquement et synchronisées avec le logiciel Saez.`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (subcommand === 'submit') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const title = interaction.options.getString('titre');
    const description = interaction.options.getString('description');
    const category = interaction.options.getString('categorie') || 'anime';
    const language = interaction.options.getString('langue') || 'VOSTFR & VF';
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
      const channelMention = sugg.channel_id ? `<#${sugg.channel_id}>` : 'le salon configuré';
      return await interaction.editReply({
        content:
          `🎉 **Votre demande #${sugg.sugg_id} a été enregistrée avec succès !**\n\n` +
          `• 💡 **Titre :** ${sugg.title}\n` +
          `• 🏷️ **Catégorie :** ${SUGGESTION_CATEGORIES[category]?.label || category}\n` +
          `• 📍 **Publication :** Visible dans ${channelMention}\n` +
          `• 🔄 **Synchronisation :** Directement disponible dans le logiciel **Saez Animes** !`,
      });
    } catch (err) {
      console.error('[DemandeSubmit] Erreur:', err);
      return await interaction.editReply({
        content: `❌ Une erreur est survenue : ${err.message}`,
      });
    }
  }
  if (subcommand === 'status') {
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) &&
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      return await interaction.reply({
        content: '❌ Vous devez avoir la permission **Gérer les messages** pour modérer les demandes.',
        flags: MessageFlags.Ephemeral,
      });
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const id = interaction.options.getString('id');
    const status = interaction.options.getString('statut');
    const comment = interaction.options.getString('commentaire');
    const res = await updateSuggestionStatus({
      identifier: id,
      newStatus: status,
      adminUser: interaction.user,
      reason: comment,
      guild: interaction.guild,
    });
    if (!res.success) {
      return await interaction.editReply({
        content: `❌ Impossible de mettre à jour la demande : ${res.error}`,
      });
    }
    return await interaction.editReply({
      content:
        `✅ Le statut de la demande **#${res.suggestion.sugg_id}** a été passé en **${SUGGESTION_STATUSES[status]?.badge || status}**.\n` +
        `🔄 *La mise à jour a été répercutée sur le message Discord et dans le logiciel Saez Animes.*`,
    });
  }
}
