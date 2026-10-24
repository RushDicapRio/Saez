import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';
import {
  submitApplication,
  getApplications,
  getApplicationById,
  saveApplicationDraft,
  getApplicationDraft,
  cancelApplication,
  updateApplicationStatus,
  getApplicationStats,
  canApplyAgain,
  APPLICATION_ROLES,
  APPLICATION_MODELS,
  isCommunityEnabled,
} from '../../services/communityHubService.js';
export const data = new SlashCommandBuilder()
  .setName('candidature')
  .setDescription('Gestion complète des candidatures et du recrutement communautaire')
  .addSubcommand((sub) =>
    sub
      .setName('deposer')
      .setDescription('Déposer une candidature formelle pour un rôle du serveur')
      .addStringOption((opt) =>
        opt
          .setName('role')
          .setDescription('Poste visé')
          .setRequired(true)
          .addChoices(
            { name: '🛡️ Modérateur', value: APPLICATION_ROLES.MODERATEUR },
            { name: '🎉 Animateur', value: APPLICATION_ROLES.ANIMATEUR },
            { name: '🤝 Helper / Entraide', value: APPLICATION_ROLES.HELPER },
            { name: '✍️ Rédacteur Anime', value: APPLICATION_ROLES.REDACTEUR },
            { name: '💻 Développeur Bot', value: APPLICATION_ROLES.DEVELOPPEUR },
            { name: '🌟 Bénévole Projet', value: APPLICATION_ROLES.BENEVOLE }
          )
      )
      .addStringOption((opt) => opt.setName('motivation').setDescription('Vos motivations principales').setRequired(true))
      .addStringOption((opt) => opt.setName('experience').setDescription('Expérience passée (optionnel)').setRequired(false))
      .addStringOption((opt) => opt.setName('disponibilite').setDescription('Vos disponibilités horaires').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('brouillon')
      .setDescription('Enregistrer un brouillon pour peaufiner votre candidature avant envoi')
      .addStringOption((opt) =>
        opt
          .setName('role')
          .setDescription('Poste visé')
          .setRequired(true)
          .addChoices(
            { name: '🛡️ Modérateur', value: APPLICATION_ROLES.MODERATEUR },
            { name: '🎉 Animateur', value: APPLICATION_ROLES.ANIMATEUR },
            { name: '🤝 Helper / Entraide', value: APPLICATION_ROLES.HELPER },
            { name: '✍️ Rédacteur Anime', value: APPLICATION_ROLES.REDACTEUR },
            { name: '💻 Développeur Bot', value: APPLICATION_ROLES.DEVELOPPEUR },
            { name: '🌟 Bénévole Projet', value: APPLICATION_ROLES.BENEVOLE }
          )
      )
      .addStringOption((opt) => opt.setName('motivation').setDescription('Brouillon de vos motivations').setRequired(true))
      .addStringOption((opt) => opt.setName('experience').setDescription('Brouillon de votre expérience').setRequired(false))
      .addStringOption((opt) => opt.setName('disponibilite').setDescription('Vos disponibilités').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('mes-candidatures')
      .setDescription('Consulter l\'historique et le statut de vos candidatures personnelles')
  )
  .addSubcommand((sub) =>
    sub
      .setName('statut')
      .setDescription('Vérifier l\'avancement d\'une candidature via son numéro de dossier')
      .addStringOption((opt) => opt.setName('dossier').setDescription('Identifiant du dossier (ex: app_xxx)').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('annuler')
      .setDescription('Annuler une candidature en attente d\'examen')
      .addStringOption((opt) => opt.setName('dossier').setDescription('Identifiant du dossier').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('modeles')
      .setDescription('Consulter les questions et attentes types pour chaque rôle')
      .addStringOption((opt) =>
        opt
          .setName('role')
          .setDescription('Rôle à examiner')
          .setRequired(true)
          .addChoices(
            { name: '🛡️ Modérateur', value: APPLICATION_ROLES.MODERATEUR },
            { name: '🎉 Animateur', value: APPLICATION_ROLES.ANIMATEUR },
            { name: '🤝 Helper / Entraide', value: APPLICATION_ROLES.HELPER },
            { name: '✍️ Rédacteur Anime', value: APPLICATION_ROLES.REDACTEUR },
            { name: '💻 Développeur Bot', value: APPLICATION_ROLES.DEVELOPPEUR },
            { name: '🌟 Bénévole Projet', value: APPLICATION_ROLES.BENEVOLE }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('examiner')
      .setDescription('Prendre une décision sur une candidature (Staff)')
      .addStringOption((opt) => opt.setName('dossier').setDescription('Identifiant du dossier').setRequired(true))
      .addStringOption((opt) =>
        opt
          .setName('decision')
          .setDescription('Décision prise')
          .setRequired(true)
          .addChoices(
            { name: '✅ Accepter', value: 'accepted' },
            { name: '❌ Refuser', value: 'rejected' },
            { name: '📅 Entretien Requis', value: 'interview' }
          )
      )
      .addStringOption((opt) => opt.setName('motif').setDescription('Justification ou note d\'examen').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('statistiques')
      .setDescription('Consulter les indicateurs de recrutement et délais moyens de traitement (Staff)')
  );
export async function execute(interaction) {
  const { guild, user, member, options } = interaction;
  const sub = options.getSubcommand();
  const enabled = await isCommunityEnabled(guild.id);
  if (!enabled) {
    return await interaction.reply({
      content: '🔒 Le module Communauté / Recrutement est actuellement désactivé sur ce serveur.',
      flags: MessageFlags.Ephemeral,
    });
  }
  if (sub === 'deposer') {
    const role = options.getString('role');
    const motivation = options.getString('motivation');
    const experience = options.getString('experience') || 'Non renseignée';
    const availability = options.getString('disponibilite') || 'Flexible';
    const check = await canApplyAgain(guild.id, user.id);
    if (!check.allowed) {
      return await interaction.reply({ content: `❌ ${check.reason}`, flags: MessageFlags.Ephemeral });
    }
    const res = await submitApplication({
      guildId: guild.id,
      userId: user.id,
      username: user.username,
      role,
      experience,
      motivation,
      availability,
    });
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.error}`, flags: MessageFlags.Ephemeral });
    }
    const app = res.application;
    const embed = new EmbedBuilder()
      .setTitle('📩 Candidature Officiellement Transmise !')
      .setDescription(`Votre dossier pour le poste de **${role}** a été enregistré sous l'identifiant \`${app._id}\`.`)
      .setColor(0x10b981)
      .addFields(
        { name: '🎭 Poste', value: role, inline: true },
        { name: '⏰ Créneaux', value: availability, inline: true },
        { name: '📝 Motivations', value: motivation }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Suivez son état avec /candidature statut' })
      .setTimestamp();
    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
  if (sub === 'brouillon') {
    const role = options.getString('role');
    const motivation = options.getString('motivation');
    const experience = options.getString('experience') || '';
    const availability = options.getString('disponibilite') || '';
    await saveApplicationDraft(guild.id, user.id, { role, motivation, experience, availability });
    return await interaction.reply({
      content: `💾 **Brouillon sauvegardé avec succès pour le poste de ${role} !**\nVous pourrez le soumettre définitivement quand vous le souhaitez.`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (sub === 'mes-candidatures') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const apps = await getApplications(guild.id, { userId: user.id });
    const draft = await getApplicationDraft(guild.id, user.id);
    const embed = new EmbedBuilder()
      .setTitle(`📋 Vos Candidatures — ${guild.name}`)
      .setColor(0x00e5ff)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (draft) {
      embed.addFields({
        name: `📝 Brouillon en cours : ${draft.role}`,
        value: `Modifié le ${new Date(draft.updatedAt).toLocaleDateString('fr-FR')}\n*« ${draft.motivation.slice(0, 100)}... »*`,
      });
    }
    if (apps.length === 0 && !draft) {
      embed.setDescription('Vous n\'avez déposé aucune candidature sur ce serveur.');
    } else {
      apps.forEach((a) => {
        const statusMap = {
          pending: '⏳ En attente d\'examen',
          under_review: '🔍 En cours d\'examen par le staff',
          interview: '📅 Entretien planifié',
          accepted: '✅ Acceptée !',
          rejected: '❌ Non retenue',
          cancelled: '⚪ Annulée',
        };
        embed.addFields({
          name: `${statusMap[a.status] || a.status} — ${a.role} (\`${a._id}\`)`,
          value: `Déposée le ${new Date(a.createdAt).toLocaleDateString('fr-FR')}${a.reviewNote ? `\n💬 *Note : ${a.reviewNote}*` : ''}`,
          inline: false,
        });
      });
    }
    return await interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'statut') {
    const appId = options.getString('dossier');
    const app = await getApplicationById(appId);
    if (!app || app.guildId !== guild.id) {
      return await interaction.reply({ content: '❌ Dossier de candidature introuvable sur ce serveur.', flags: MessageFlags.Ephemeral });
    }
    if (app.userId !== user.id && !member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({ content: '❌ Vous n\'avez pas accès à ce dossier.', flags: MessageFlags.Ephemeral });
    }
    const embed = new EmbedBuilder()
      .setTitle(`📋 Dossier ${app._id} — ${app.role}`)
      .setColor(app.status === 'accepted' ? 0x10b981 : app.status === 'rejected' ? 0xf43f5e : 0x00e5ff)
      .addFields(
        { name: '👤 Candidat', value: `<@${app.userId}> (\`${app.username}\`)`, inline: true },
        { name: '📌 Statut Actuel', value: `**${app.status.toUpperCase()}**`, inline: true },
        { name: '⏰ Disponibilités', value: app.availability || 'Flexible', inline: true },
        { name: '📝 Motivations', value: app.motivation }
      )
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (app.reviewNote) {
      embed.addFields({ name: '💬 Retour du Staff', value: app.reviewNote });
    }
    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
  if (sub === 'annuler') {
    const appId = options.getString('dossier');
    const res = await cancelApplication(appId, user.id);
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.error}`, flags: MessageFlags.Ephemeral });
    }
    return await interaction.reply({
      content: `⚪ **Votre candidature \`${appId}\` a bien été annulée.**`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (sub === 'modeles') {
    const role = options.getString('role');
    const m = APPLICATION_MODELS[role];
    const embed = new EmbedBuilder()
      .setTitle(`📋 Modèle d'Évaluation : ${m.label}`)
      .setDescription('Voici les critères et questions principales attendus pour ce poste :')
      .setColor(0x00e5ff)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    m.questions.forEach((q, idx) => {
      embed.addFields({ name: `Question #${idx + 1}`, value: q });
    });
    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
  if (sub === 'examiner') {
    if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({ content: '❌ Réservé au staff autorisé.', flags: MessageFlags.Ephemeral });
    }
    const appId = options.getString('dossier');
    const decision = options.getString('decision');
    const motif = options.getString('motif') || 'Décision du staff';
    const res = await updateApplicationStatus(appId, decision, user, { note: motif });
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.error}`, flags: MessageFlags.Ephemeral });
    }
    return await interaction.reply({
      content: `✅ Dossier \`${appId}\` mis à jour en **${decision.toUpperCase()}** avec le motif : *« ${motif} »*.`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (sub === 'statistiques') {
    if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({ content: '❌ Réservé au staff.', flags: MessageFlags.Ephemeral });
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const stats = await getApplicationStats(guild.id);
    const embed = new EmbedBuilder()
      .setTitle(`📊 Bilan du Recrutement — ${guild.name}`)
      .setColor(0x00e5ff)
      .addFields(
        { name: '📥 Candidatures Totales', value: `**${stats.total}**`, inline: true },
        { name: '✅ Acceptées', value: `**${stats.accepted}**`, inline: true },
        { name: '❌ Refusées', value: `**${stats.rejected}**`, inline: true },
        { name: '⏳ En Attente', value: `**${stats.pending}**`, inline: true },
        { name: '🔍 En Examen / Entretien', value: `**${stats.underReview}**`, inline: true },
        { name: '⚡ Délai Moyen de Traitement', value: `**${stats.avgProcessingHours}h**`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return await interaction.editReply({ embeds: [embed] });
  }
}
