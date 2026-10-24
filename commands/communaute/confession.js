import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';
import {
  submitConfession,
  getConfessions,
  getConfessionById,
  deleteConfessionBySecret,
  reviewConfession,
  reportConfession,
  getCommunitySettings,
  isCommunityEnabled,
  CONFESSION_CATEGORIES,
} from '../../services/communityHubService.js';
export const data = new SlashCommandBuilder()
  .setName('confession')
  .setDescription('Système de confessions communautaires (anonymes ou signées) avec modération')
  .addSubcommand((sub) =>
    sub
      .setName('envoyer')
      .setDescription('Publier une confession anonyme ou signée')
      .addStringOption((opt) => opt.setName('message').setDescription('Texte de votre confession (ou laissez vide pour ouvrir le formulaire)').setRequired(false))
      .addStringOption((opt) =>
        opt
          .setName('categorie')
          .setDescription('Catégorie du message')
          .setRequired(false)
          .addChoices(
            { name: '📖 Anecdote', value: 'anecdote' },
            { name: '💭 Réflexion', value: 'reflexion' },
            { name: '💖 Remerciement', value: 'remerciement' },
            { name: '❓ Question Intime', value: 'question' },
            { name: '✨ Coup de Cœur', value: 'coup_de_coeur' },
            { name: '💬 Libre', value: 'autre' }
          )
      )
      .addBooleanOption((opt) => opt.setName('anonyme').setDescription('Rester anonyme (par défaut: oui)').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('supprimer')
      .setDescription('Supprimer votre confession anonyme grâce à votre clé secrète')
      .addStringOption((opt) => opt.setName('confession_id').setDescription('Identifiant de la confession (ex: conf_xxx)').setRequired(true))
      .addStringOption((opt) => opt.setName('cle_secrete').setDescription('Votre clé secrète fournie lors de l\'envoi').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('signaler')
      .setDescription('Signaler une confession problématique aux modérateurs')
      .addStringOption((opt) => opt.setName('confession_id').setDescription('Identifiant de la confession').setRequired(true))
      .addStringOption((opt) => opt.setName('motif').setDescription('Motif du signalement (harcèlement, doxxing...)').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('moderer')
      .setDescription('Valider ou rejeter une confession en attente de modération (Staff)')
      .addStringOption((opt) => opt.setName('confession_id').setDescription('Identifiant de la confession').setRequired(true))
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Action de modération')
          .setRequired(true)
          .addChoices(
            { name: '✅ Approuver et publier', value: 'approve' },
            { name: '❌ Rejeter la confession', value: 'reject' }
          )
      )
      .addStringOption((opt) => opt.setName('raison').setDescription('Raison de la décision').setRequired(false))
  );
export async function execute(interaction) {
  const { guild, user, member, options } = interaction;
  const sub = options.getSubcommand();
  const enabled = await isCommunityEnabled(guild.id);
  if (!enabled) {
    return await interaction.reply({
      content: '🔒 Le module des confessions est actuellement désactivé sur ce serveur.',
      flags: MessageFlags.Ephemeral,
    });
  }
  if (sub === 'envoyer') {
    const directMessage = options.getString('message');
    const category = options.getString('categorie') || 'anecdote';
    const isAnonymous = options.getBoolean('anonyme') !== false;
    if (!directMessage) {
      const modal = new ModalBuilder()
        .setCustomId('modal_confession_submit')
        .setTitle('🤫 Nouvelle Confession');
      const textInput = new TextInputBuilder()
        .setCustomId('conf_text')
        .setLabel('Votre message')
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(10)
        .setMaxLength(1500)
        .setRequired(true);
      const catInput = new TextInputBuilder()
        .setCustomId('conf_cat')
        .setLabel('Catégorie (anecdote, reflexion, merci...)')
        .setValue(category)
        .setStyle(TextInputStyle.Short)
        .setRequired(false);
      const anonInput = new TextInputBuilder()
        .setCustomId('conf_anon')
        .setLabel('Mode anonyme ? (Oui / Non)')
        .setValue(isAnonymous ? 'Oui' : 'Non')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);
      modal.addComponents(
        new ActionRowBuilder().addComponents(textInput),
        new ActionRowBuilder().addComponents(catInput),
        new ActionRowBuilder().addComponents(anonInput)
      );
      return await interaction.showModal(modal);
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const res = await submitConfession(guild.id, directMessage, interaction.channelId, {
      isAnonymous,
      authorId: user.id,
      authorName: user.username,
      category,
    });
    const { confession, secretKey, requiresApproval } = res;
    if (requiresApproval) {
      const settings = await getCommunitySettings(guild.id);
      if (settings.confessions_mod_channel_id) {
        const modChan = guild.channels.cache.get(settings.confessions_mod_channel_id);
        if (modChan) {
          const modEmbed = new EmbedBuilder()
            .setTitle(`🛡️ Confession #${confession.number} Soumise à Examen`)
            .setDescription(`*"${directMessage}"*\n\n**Auteur :** ${isAnonymous ? 'Anonyme (protégé)' : `<@${user.id}>`}\n**Catégorie :** ${CONFESSION_CATEGORIES[category]}`)
            .setColor(0xf59e0b)
            .setTimestamp()
            .setFooter({ text: 'Codé avec ❤️ par Saez' });
          const modRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`conf_approve_${confession._id}`).setLabel('Valider').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`conf_reject_${confession._id}`).setLabel('Rejeter').setStyle(ButtonStyle.Danger)
          );
          modChan.send({ embeds: [modEmbed], components: [modRow] }).catch(() => {});
        }
      }
      return await interaction.editReply({
        content: `✅ **Votre confession a été enregistrée avec succès !**\nElle a été transmise à l'équipe de modération.\n🔑 Votre clé secrète de suppression : \`${secretKey}\``,
      });
    }
    const pubEmbed = new EmbedBuilder()
      .setTitle(`🤫 Confession #${confession.number} • ${CONFESSION_CATEGORIES[category] || 'Libre'}`)
      .setDescription(`*"${directMessage}"*`)
      .setColor(0x8b5cf6)
      .setFooter({ text: isAnonymous ? 'Codé avec ❤️ par Saez | Envoyée anonymement • Saez Confessions' : `Par ${user.username}` })
      .setTimestamp();
    const reactRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`conf_react_${confession._id}_love`).setEmoji('❤️').setLabel('0').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`conf_react_${confession._id}_hug`).setEmoji('🫂').setLabel('0').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`conf_react_${confession._id}_funny`).setEmoji('😂').setLabel('0').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`conf_react_${confession._id}_deep`).setEmoji('💭').setLabel('0').setStyle(ButtonStyle.Secondary)
    );
    await interaction.channel.send({ embeds: [pubEmbed], components: [reactRow] });
    return await interaction.editReply({
      content: `✅ Votre confession a été publiée publiquement dans ce salon !\n🔑 Clé secrète de suppression : \`${secretKey}\``,
    });
  }
  if (sub === 'supprimer') {
    const confId = options.getString('confession_id');
    const secret = options.getString('cle_secrete');
    const res = await deleteConfessionBySecret(confId, user.id, secret);
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.error}`, flags: MessageFlags.Ephemeral });
    }
    return await interaction.reply({
      content: `🗑️ **Votre confession \`${confId}\` a été définitivement supprimée de nos serveurs.**`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (sub === 'signaler') {
    const confId = options.getString('confession_id');
    const motif = options.getString('motif');
    const res = await reportConfession(confId, user.id, motif);
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.error}`, flags: MessageFlags.Ephemeral });
    }
    return await interaction.reply({
      content: `🚩 **Signalement pris en compte.** Les modérateurs du serveur ont été prévenus. Merci pour votre vigilance.`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (sub === 'moderer') {
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return await interaction.reply({ content: '❌ Réservé aux modérateurs.', flags: MessageFlags.Ephemeral });
    }
    const confId = options.getString('confession_id');
    const action = options.getString('action');
    const raison = options.getString('raison') || 'Décision staff';
    const res = await reviewConfession(confId, action, user.id, raison);
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.error}`, flags: MessageFlags.Ephemeral });
    }
    return await interaction.reply({
      content: `👌 Confession \`${confId}\` traitée en **${action === 'approve' ? 'APPROUVÉE' : 'REJETÉE'}** par ${user}.`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
