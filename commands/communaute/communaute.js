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
  getCommunitySettings,
  saveCommunitySettings,
  isCommunityEnabled,
  getCommunityOverviewStats,
  purgeUserData,
  submitApplication,
  getApplications,
  getApplicationStats,
  canApplyAgain,
  APPLICATION_ROLES,
  APPLICATION_MODELS,
  setUserBirthday,
  getUserBirthday,
  deleteUserBirthday,
  getUpcomingBirthdays,
  getTodayBirthdays,
  giveReputation,
  getUserReputation,
  getTopReputation,
  getReputationHistory,
  submitConfession,
  getConfessions,
  CONFESSION_CATEGORIES,
  createDebate,
  getActiveDebates,
  registerMentorProfile,
  searchMentors,
  getMentorProfile,
  MENTOR_DOMAINS,
  createCommunityGoal,
  getCommunityGoals,
  contributeGoal,
  sendThankYou,
  getPublicThanks,
  THANK_CATEGORIES,
  saveUserProfile,
  getUserProfile,
  searchMembersByInterests,
  calculateCompatibility,
  getRandomIcebreaker,
  POPULAR_INTERESTS,
  createHelpRequest,
  getHelpRequests,
  getMilestones,
  getGuestbookEntries,
  addGuestbookEntry,
} from '../../services/communityHubService.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('communaute')
  .setDescription('Hub central de la vie communautaire Saez : entraide, débats, réputation, anniversaires...')
  .addSubcommand((sub) =>
    sub
      .setName('postuler')
      .setDescription('Déposer une candidature de recrutement (Modérateur, Animateur, Helper...)')
      .addStringOption((opt) =>
        opt
          .setName('role')
          .setDescription('Rôle visé')
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
      .addStringOption((opt) => opt.setName('disponibilite').setDescription('Vos créneaux horaires de disponibilité').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('candidatures')
      .setDescription('Consulter et examiner les candidatures reçues sur le serveur (Staff)')
      .addStringOption((opt) =>
        opt
          .setName('statut')
          .setDescription('Filtrer par statut')
          .setRequired(false)
          .addChoices(
            { name: '⏳ En attente', value: 'pending' },
            { name: '🔍 En examen', value: 'under_review' },
            { name: '📅 Entretien', value: 'interview' },
            { name: '✅ Acceptée', value: 'accepted' },
            { name: '❌ Refusée', value: 'rejected' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('anniversaire')
      .setDescription('Enregistrer ou mettre à jour votre date d\'anniversaire')
      .addIntegerOption((opt) => opt.setName('jour').setDescription('Jour (1 à 31)').setMinValue(1).setMaxValue(31).setRequired(true))
      .addIntegerOption((opt) => opt.setName('mois').setDescription('Mois (1 à 12)').setMinValue(1).setMaxValue(12).setRequired(true))
      .addIntegerOption((opt) => opt.setName('annee').setDescription('Année de naissance (facultatif)').setMinValue(1920).setMaxValue(2025).setRequired(false))
      .addBooleanOption((opt) => opt.setName('afficher_age').setDescription('Afficher votre âge lors de l\'annonce (par défaut: non)').setRequired(false))
      .addStringOption((opt) =>
        opt
          .setName('visibilite')
          .setDescription('Confidentialité de votre anniversaire')
          .setRequired(false)
          .addChoices(
            { name: '🌍 Public (annoncé sur le serveur)', value: 'public' },
            { name: '👥 Amis uniquement', value: 'friends' },
            { name: '🔒 Privé (aucun affichage public)', value: 'private' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('anniversaires')
      .setDescription('Afficher les anniversaires du jour et à venir de la communauté')
  )
  .addSubcommand((sub) =>
    sub
      .setName('anniversaire-test')
      .setDescription('Tester la publication d\'une annonce d\'anniversaire (Staff / Admin)')
      .addUserOption((opt) => opt.setName('membre').setDescription('Membre ciblé pour la simulation').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('reputation')
      .setDescription('Donner 1 point de réputation à un membre pour son aide ou sa bienveillance')
      .addUserOption((opt) => opt.setName('membre').setDescription('Membre à recommander').setRequired(true))
      .addStringOption((opt) => opt.setName('raison').setDescription('Raison de la recommandation').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('top-reputation')
      .setDescription('Classement des membres les plus réputés et recommandés')
      .addStringOption((opt) =>
        opt
          .setName('periode')
          .setDescription('Période du classement')
          .setRequired(false)
          .addChoices(
            { name: '🏆 Général (Historique)', value: 'all' },
            { name: '📅 Ce mois-ci (30 jours)', value: 'month' },
            { name: '⚡ Cette semaine (7 jours)', value: 'week' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('confession')
      .setDescription('Envoyer une confession (anonyme ou signée) dans le salon dédié')
      .addStringOption((opt) => opt.setName('message').setDescription('Votre confession ou pensée').setRequired(false))
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
      .addBooleanOption((opt) => opt.setName('anonyme').setDescription('Garder l\'anonymat (par défaut : oui)').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('confessions')
      .setDescription('Consulter les dernières confessions publiées sur le serveur')
  )
  .addSubcommand((sub) =>
    sub
      .setName('debat')
      .setDescription('Lancer un débat structuré avec vote interactif en temps réel')
      .addStringOption((opt) => opt.setName('sujet').setDescription('Sujet du débat (ex: Sub vs Dub en Anime)').setRequired(true))
      .addStringOption((opt) => opt.setName('description').setDescription('Contexte ou règles du débat').setRequired(false))
      .addIntegerOption((opt) => opt.setName('duree').setDescription('Durée en heures avant clôture (défaut : 24h)').setMinValue(1).setMaxValue(168).setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('debats')
      .setDescription('Afficher les débats actifs ou récents de la communauté')
  )
  .addSubcommand((sub) =>
    sub
      .setName('mentorat')
      .setDescription('Programme de parrainage et mentorat entre membres')
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Action souhaitée')
          .setRequired(true)
          .addChoices(
            { name: '🔍 Chercher un Mentor', value: 'chercher' },
            { name: '🎓 Devenir Mentor Volontaire', value: 'devenir' },
            { name: '📋 Voir les Mentors Disponibles', value: 'liste' }
          )
      )
      .addStringOption((opt) =>
        opt
          .setName('domaine')
          .setDescription('Domaine de prédilection')
          .setRequired(false)
          .addChoices(
            { name: '💻 Programmation & Bot', value: 'Programmation & Bot' },
            { name: '🎨 Graphisme & Montage', value: 'Graphisme & Montage' },
            { name: '🎌 Anime & Manga Culture', value: 'Anime & Manga Culture' },
            { name: '🎮 Gaming & Stratégie', value: 'Gaming & Stratégie' },
            { name: '🎉 Animation & Organisation', value: 'Animation & Organisation' },
            { name: '✍️ Langues & Écriture', value: 'Langues & Écriture' },
            { name: '📚 Études & Orientation', value: 'Études & Orientation' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('objectifs')
      .setDescription('Consulter ou contribuer aux objectifs collectifs du serveur')
      .addStringOption((opt) => opt.setName('action').setDescription('Action').setRequired(false).addChoices(
        { name: '📋 Consulter la progression', value: 'voir' },
        { name: '🎯 Créer un objectif (Staff)', value: 'creer' }
      ))
      .addStringOption((opt) => opt.setName('titre').setDescription('Titre (si création)').setRequired(false))
      .addIntegerOption((opt) => opt.setName('cible').setDescription('Cible numérique (si création)').setRequired(false))
      .addStringOption((opt) => opt.setName('unite').setDescription('Unité (membres, messages, avis...)').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('merci')
      .setDescription('Remercier chaleureusement un membre de la communauté')
      .addUserOption((opt) => opt.setName('membre').setDescription('Membre à remercier').setRequired(true))
      .addStringOption((opt) => opt.setName('message').setDescription('Message de remerciement').setRequired(true))
      .addStringOption((opt) =>
        opt
          .setName('categorie')
          .setDescription('Type d\'entraide ou de soutien')
          .setRequired(false)
          .addChoices(
            { name: '🤝 Entraide & Dépannage', value: 'entraide' },
            { name: '👋 Accueil & Intégration', value: 'accueil' },
            { name: '🎨 Créativité & Projets', value: 'creativite' },
            { name: '💖 Soutien Moral & Écoute', value: 'soutien' },
            { name: '🎉 Organisation & Animation', value: 'organisation' },
            { name: '🌟 Sympathie Générale', value: 'autre' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('mur-merci')
      .setDescription('Consulter les remerciements publics récents (Mur de la Gratitude)')
  )
  .addSubcommand((sub) =>
    sub
      .setName('presentation')
      .setDescription('Créer, consulter ou modifier votre présentation personnelle')
      .addUserOption((opt) => opt.setName('membre').setDescription('Membre dont vous voulez voir la présentation').setRequired(false))
      .addStringOption((opt) => opt.setName('bio').setDescription('Courte bio / À propos de vous').setRequired(false))
      .addStringOption((opt) => opt.setName('animes_favoris').setDescription('Vos 3 animes/mangas préférés').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('interets')
      .setDescription('Rechercher des membres volontaires partageant vos centres d\'intérêt')
      .addStringOption((opt) =>
        opt
          .setName('interet')
          .setDescription('Centre d\'intérêt recherché')
          .setRequired(true)
          .addChoices(
            { name: '🎌 Anime & Manga', value: 'Anime & Manga' },
            { name: '🎮 Gaming (PC / Console)', value: 'Gaming (PC / Console)' },
            { name: '💻 Programmation & Dev', value: 'Programmation & Dev' },
            { name: '🎨 Dessin & Art Digital', value: 'Dessin & Art Digital' },
            { name: '🎵 Musique & Chant', value: 'Musique & Chant' },
            { name: '🎭 Cosplay & Conventions', value: 'Cosplay & Conventions' },
            { name: '📚 Lecture & Écriture', value: 'Lecture & Écriture' },
            { name: '🍿 Cinéma & Séries', value: 'Cinéma & Séries' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('compatibilite')
      .setDescription('Découvrir vos points communs et centres d\'intérêt partagés avec un membre')
      .addUserOption((opt) => opt.setName('membre').setDescription('Membre avec qui comparer vos passions').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('brise-glace')
      .setDescription('Générer une question amusante ou profonde pour relancer les échanges')
  )
  .addSubcommand((sub) =>
    sub
      .setName('entraide')
      .setDescription('Publier une demande d\'entraide ou consulter les demandes ouvertes')
      .addStringOption((opt) => opt.setName('action').setDescription('Action').setRequired(false).addChoices(
        { name: '📋 Voir les demandes ouvertes', value: 'liste' },
        { name: '❓ Publier une demande', value: 'demander' }
      ))
      .addStringOption((opt) => opt.setName('titre').setDescription('Titre court de votre besoin (si demande)').setRequired(false))
      .addStringOption((opt) => opt.setName('domaine').setDescription('Domaine (Informatique, Anime, Graphisme...)').setRequired(false))
      .addStringOption((opt) => opt.setName('description').setDescription('Détails de l\'aide recherchée').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('souvenirs')
      .setDescription('Consulter la chronologie des moments forts et le livre d\'or du serveur')
  )
  .addSubcommand((sub) =>
    sub
      .setName('config')
      .setDescription('Configurer les salons, rôles et options de la vie communautaire (Staff)')
      .addChannelOption((opt) => opt.setName('salon_anniversaires').setDescription('Salon de publication des anniversaires').setRequired(false))
      .addChannelOption((opt) => opt.setName('salon_confessions').setDescription('Salon de publication des confessions').setRequired(false))
      .addChannelOption((opt) => opt.setName('salon_candidatures').setDescription('Salon privé pour l\'examen des candidatures').setRequired(false))
      .addBooleanOption((opt) => opt.setName('validation_confessions').setDescription('Exiger une validation staff avant publication des confessions').setRequired(false))
      .addBooleanOption((opt) => opt.setName('module_actif').setDescription('Activer ou désactiver la catégorie Communauté sur ce serveur').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('statistiques')
      .setDescription('Afficher les statistiques agrégées de la vie communautaire')
  )
  .addSubcommand((sub) =>
    sub
      .setName('confidentialite')
      .setDescription('Consulter vos données communautaires enregistrées ou les purger (Droit à l\'oubli)')
      .addBooleanOption((opt) => opt.setName('supprimer_mes_donnees').setDescription('Confirmer la suppression irréversible de votre profil & dates').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('aide')
      .setDescription('Guide complet et interactif de toutes les fonctionnalités communautaires')
  );
export async function execute(interaction) {
  const { guild, user, member, options } = interaction;
  const sub = options.getSubcommand();
  const enabled = await isCommunityEnabled(guild.id);
  if (!enabled && sub !== 'config') {
    return await interaction.reply({
      content: '🔒 **Le module Communauté est actuellement désactivé sur ce serveur.**\nUn administrateur peut le réactiver à tout moment avec `/communaute config module_actif:Vrai`.',
      flags: MessageFlags.Ephemeral,
    });
  }
  if (sub === 'postuler') {
    const role = options.getString('role');
    const motivation = options.getString('motivation');
    const experience = options.getString('experience') || 'Aucune renseignée';
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
      .setTitle('📩 Candidature Déposée avec Succès !')
      .setDescription(`Merci <@${user.id}> ! Votre candidature pour le poste de **${role}** a bien été transmise aux administrateurs.`)
      .setColor(0x10b981)
      .addFields(
        { name: '🎭 Poste Visé', value: `**${role}**`, inline: true },
        { name: '⏰ Disponibilités', value: availability, inline: true },
        { name: '📝 Motivations', value: motivation },
        { name: '🆔 Numéro de dossier', value: `\`${app._id}\``, inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | L\'équipe examinera votre candidature dans les meilleurs délais.' })
      .setTimestamp();
    const settings = await getCommunitySettings(guild.id);
    if (settings.candidatures_channel_id) {
      const staffChan = guild.channels.cache.get(settings.candidatures_channel_id);
      if (staffChan) {
        const alertEmbed = new EmbedBuilder()
          .setTitle(`🚨 Nouvelle Candidature : ${role}`)
          .setDescription(`Déposée par <@${user.id}> (\`${user.username}\`)\n\n**Motivations :**\n${motivation}\n\n**Disponibilités :** ${availability}`)
          .setColor(0x00e5ff)
          .setFooter({ text: `Codé avec ❤️ par Saez | Dossier : ${app._id}` })
          .setTimestamp();
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`app_action_${app._id}_interview`).setLabel('Planifier Entretien').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId(`app_action_${app._id}_accepted`).setLabel('Accepter').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`app_action_${app._id}_rejected`).setLabel('Refuser').setStyle(ButtonStyle.Danger)
        );
        staffChan.send({ embeds: [alertEmbed], components: [row] }).catch(() => {});
      }
    }
    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
  if (sub === 'candidatures') {
    if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({ content: '❌ Cette commande est strictement réservée au staff.', flags: MessageFlags.Ephemeral });
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const filterStatus = options.getString('statut');
    const apps = await getApplications(guild.id, { status: filterStatus });
    const stats = await getApplicationStats(guild.id);
    const embed = new EmbedBuilder()
      .setTitle(`📋 Dossiers de Recrutement (${apps.length})`)
      .setDescription(`Statistiques globales : **${stats.total}** reçues • **${stats.accepted}** acceptées • **${stats.pending}** en attente\nDélai moyen de réponse : **${stats.avgProcessingHours}h**`)
      .setColor(0x00e5ff)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (apps.length === 0) {
      embed.addFields({ name: 'Dossiers', value: 'Aucune candidature trouvée avec ce filtre.' });
    } else {
      apps.slice(0, 8).forEach((a) => {
        const emoji = a.status === 'accepted' ? '✅' : a.status === 'rejected' ? '❌' : a.status === 'interview' ? '📅' : '⏳';
        embed.addFields({
          name: `${emoji} ${a.role} — ${a.username} (\`${a._id}\`)`,
          value: `👤 <@${a.userId}> • Dispos: **${a.availability}**\n📝 *${a.motivation.slice(0, 120)}...*`,
          inline: false,
        });
      });
    }
    return await interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'anniversaire') {
    const day = options.getInteger('jour');
    const month = options.getInteger('mois');
    const year = options.getInteger('annee');
    const showAge = options.getBoolean('afficher_age') || false;
    const visibility = options.getString('visibilite') || 'public';
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    try {
      await setUserBirthday(guild.id, user.id, user.username, day, month, { year, showAge, visibility });
    } catch (err) {
      return await interaction.reply({ content: `❌ ${err.message}`, flags: MessageFlags.Ephemeral });
    }
    const embed = new EmbedBuilder()
      .setTitle('🎂 Anniversaire Enregistré !')
      .setDescription(`Votre anniversaire est noté au **${day} ${months[month - 1]}${year ? ` ${year}` : ''}** !\n\n• 👁️ **Visibilité :** ${visibility === 'public' ? 'Publique (annoncé sur le serveur)' : visibility === 'friends' ? 'Amis uniquement' : 'Privé'}\n• 🎈 **Affichage de l\'âge :** ${showAge ? 'Oui' : 'Non (masqué pour protéger votre vie privée)'}`)
      .setColor(0xf472b6)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Le jour J, le serveur célébrera cet événement avec vous !' })
      .setTimestamp();
    return await interaction.reply({ embeds: [embed] });
  }
  if (sub === 'anniversaires') {
    await interaction.deferReply();
    const today = await getTodayBirthdays(guild.id);
    const upcoming = await getUpcomingBirthdays(guild.id, 10);
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const embed = new EmbedBuilder()
      .setTitle('🎉 Calendrier des Anniversaires du Serveur')
      .setColor(0xf472b6)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    const components = [];
    if (today.length > 0) {
      const todayLines = today.map((b) => `🎂 **C'est son anniversaire aujourd'hui !** 👉 <@${b.userId}> ✨`).join('\n');
      embed.addFields({ name: '🌟 Aujourd\'hui à l\'honneur !', value: todayLines });
      const row = new ActionRowBuilder();
      today.slice(0, 3).forEach((b) => {
        row.addComponents(
          new ButtonBuilder().setCustomId(`bday_wish_${b.userId}`).setLabel(`🎉 Souhaiter à ${b.username}`).setStyle(ButtonStyle.Primary)
        );
      });
      components.push(row);
    }
    if (upcoming.length === 0) {
      embed.setDescription('Aucun anniversaire public n\'est enregistré. Définissez le vôtre avec `/communaute anniversaire` !');
    } else {
      const listStr = upcoming.map((b) => `📅 **${b.day} ${months[b.month - 1]}** — <@${b.userId}>`).join('\n');
      embed.addFields({ name: '⏳ Prochains Anniversaires', value: listStr });
    }
    return await interaction.editReply({ embeds: [embed], components });
  }
  if (sub === 'anniversaire-test') {
    if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({ content: '❌ Réservé aux administrateurs.', flags: MessageFlags.Ephemeral });
    }
    const targetUser = options.getUser('membre') || user;
    const embed = new EmbedBuilder()
      .setTitle('🎂 Joyeux Anniversaire ! 🎉')
      .setDescription(`Aujourd'hui, toute la communauté **${guild.name}** souhaite un merveilleux anniversaire à <@${targetUser.id}> ! 🥳✨\n\nQue cette nouvelle année t'apporte bonheur, réussite et d'excellents animés !`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setColor(0xf472b6)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Simulation d\'annonce officielle Saez' })
      .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`bday_wish_${targetUser.id}`).setLabel('🎉 Envoyer vos vœux').setStyle(ButtonStyle.Success)
    );
    return await interaction.reply({ content: '🧪 **Simulation d\'annonce d\'anniversaire :**', embeds: [embed], components: [row] });
  }
  if (sub === 'reputation') {
    const target = options.getUser('membre');
    const reason = options.getString('raison') || 'Entraide, sympathie et bienveillance';
    if (target.bot) {
      return await interaction.reply({ content: '❌ Vous ne pouvez pas attribuer de réputation à un bot.', flags: MessageFlags.Ephemeral });
    }
    const res = await giveReputation(guild.id, user.id, target.id, reason);
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.message}`, flags: MessageFlags.Ephemeral });
    }
    const embed = new EmbedBuilder()
      .setTitle('🌟 Point de Réputation Attribué !')
      .setDescription(`**<@${user.id}>** a offert +1 point de réputation à **<@${target.id}>** !\n💬 Motif : *« ${reason} »*`)
      .setColor(0xfbbf24)
      .addFields({ name: '⭐ Réputation Totale', value: `**${res.points}** points de reconnaissance`, inline: true })
      .setFooter({ text: 'Codé avec ❤️ par Saez | Merci de valoriser les membres bienveillants de Saez !' })
      .setTimestamp();
    return await interaction.reply({ embeds: [embed] });
  }
  if (sub === 'top-reputation') {
    await interaction.deferReply();
    const period = options.getString('periode') || 'all';
    const list = await getTopReputation(guild.id, 10, period);
    const medals = ['🥇', '🥈', '🥉'];
    const pLabel = period === 'week' ? 'de la Semaine' : period === 'month' ? 'du Mois' : 'Général (Historique)';
    const embed = new EmbedBuilder()
      .setTitle(`⭐ Classement de Réputation — ${pLabel}`)
      .setColor(0xfbbf24)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Récompensez un membre méritant avec /communaute reputation' })
      .setTimestamp();
    if (list.length === 0) {
      embed.setDescription('Aucun point de réputation n\'a été attribué sur cette période.');
    } else {
      const lines = list.map((u, idx) => {
        const medal = medals[idx] || `\`#${idx + 1}\``;
        return `${medal} <@${u.userId}> — **${u.points}** point(s) de réputation`;
      });
      embed.setDescription(lines.join('\n\n'));
    }
    return await interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'confession') {
    const directMessage = options.getString('message');
    const category = options.getString('categorie') || 'anecdote';
    const isAnonymous = options.getBoolean('anonyme') !== false;
    if (!directMessage) {
      const modal = new ModalBuilder()
        .setCustomId('modal_confession_submit')
        .setTitle('🤫 Rédiger une Confession Sécurisée');
      const textInput = new TextInputBuilder()
        .setCustomId('conf_text')
        .setLabel('Votre pensée, anecdote ou message secret')
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
            .setTitle(`🛡️ Confession #${confession.number} en Attente`)
            .setDescription(`*"${directMessage}"*\n\n**Auteur :** ${isAnonymous ? 'Anonyme (protégé)' : `<@${user.id}>`}\n**Catégorie :** ${CONFESSION_CATEGORIES[category]}`)
            .setColor(0xf59e0b)
            .setTimestamp()
            .setFooter({ text: 'Codé avec ❤️ par Saez' });
          const modRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`conf_approve_${confession._id}`).setLabel('Valider et Publier').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`conf_reject_${confession._id}`).setLabel('Rejeter').setStyle(ButtonStyle.Danger)
          );
          modChan.send({ embeds: [modEmbed], components: [modRow] }).catch(() => {});
        }
      }
      return await interaction.editReply({
        content: `✅ **Votre confession a été soumise avec succès !**\nElle sera vérifiée par le staff avant publication publique.\n🔑 Votre clé secrète de suppression : \`${secretKey}\``,
      });
    }
    const pubEmbed = new EmbedBuilder()
      .setTitle(`🤫 Confession #${confession.number} • ${CONFESSION_CATEGORIES[category] || 'Libre'}`)
      .setDescription(`*"${directMessage}"*`)
      .setColor(0x8b5cf6)
      .setFooter({ text: isAnonymous ? ' Codé avec ❤️ par Saez | Envoyée anonymement • Saez Confessions' : `Par ${user.username}` })
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
  if (sub === 'confessions') {
    await interaction.deferReply();
    const list = await getConfessions(guild.id, { limit: 5 });
    const embed = new EmbedBuilder()
      .setTitle('🤫 Dernières Confessions de la Communauté')
      .setColor(0x8b5cf6)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (list.length === 0) {
      embed.setDescription('Aucune confession n\'est encore disponible.');
    } else {
      list.forEach((c) => {
        const cat = CONFESSION_CATEGORIES[c.category] || 'Libre';
        embed.addFields({
          name: `#${c.number} • ${cat} (${c.isAnonymous ? 'Anonyme' : c.authorName})`,
          value: `*"${c.text.slice(0, 200)}"*`,
          inline: false,
        });
      });
    }
    return await interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'debat') {
    const topic = options.getString('sujet');
    const desc = options.getString('description') || 'Partagez vos arguments et votez ci-dessous !';
    const hours = options.getInteger('duree') || 24;
    const debate = await createDebate({
      guildId: guild.id,
      authorId: user.id,
      authorName: user.username,
      topic,
      description: desc,
      options: ['Pour 👍', 'Contre 👎', 'Nuancé 🤔'],
      durationHours: hours,
    });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`deb_vote_${debate._id}_0`).setLabel('Pour 👍 (0 • 0%)').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`deb_vote_${debate._id}_1`).setLabel('Contre 👎 (0 • 0%)').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`deb_vote_${debate._id}_2`).setLabel('Nuancé 🤔 (0 • 0%)').setStyle(ButtonStyle.Secondary)
    );
    const embed = new EmbedBuilder()
      .setTitle('🎙️ Débat Communautaire Ouvert !')
      .setDescription(`### **${topic}**\n\n${desc}\n\n⏳ Clôture prévue dans **${hours} heure(s)**.`)
      .setColor(0x00e5ff)
      .setFooter({ text: `Codé avec ❤️ par Saez | Proposé par ${user.username} • Cliquez pour voter en temps réel` })
      .setTimestamp();
    return await interaction.reply({ embeds: [embed], components: [row] });
  }
  if (sub === 'debats') {
    await interaction.deferReply();
    const debates = await getActiveDebates(guild.id, 5);
    const embed = new EmbedBuilder()
      .setTitle('🎙️ Débats Actifs sur le Serveur')
      .setColor(0x00e5ff)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (debates.length === 0) {
      embed.setDescription('Aucun débat n\'est actif en ce moment. Lancez-en un avec `/communaute debat` !');
    } else {
      debates.forEach((d) => {
        const total = Object.keys(d.votes || {}).length;
        embed.addFields({
          name: `📌 ${d.topic}`,
          value: `👤 Proposé par **${d.authorName}** • **${total}** votant(s)\n${d.description || 'Pas de description'}`,
          inline: false,
        });
      });
    }
    return await interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'mentorat') {
    const action = options.getString('action');
    const domain = options.getString('domaine');
    if (action === 'devenir') {
      await registerMentorProfile(guild.id, user.id, user.username, {
        domains: domain ? [domain] : ['Culture Anime', 'Entraide'],
        bio: 'Volontaire pour accompagner les membres.',
      });
      const embed = new EmbedBuilder()
        .setTitle('🎓 Inscription au Mentorat Validée !')
        .setDescription(`Bravo <@${user.id}> ! Vous êtes désormais inscrit comme **Mentor volontaire**${domain ? ` dans le domaine **${domain}**` : ''} !`)
        .setColor(0x10b981)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Les membres pourront vous solliciter pour des conseils bienveillants.' })
        .setTimestamp();
      return await interaction.reply({ embeds: [embed] });
    }
    if (action === 'chercher' || action === 'liste') {
      await interaction.deferReply();
      const mentors = await searchMentors(guild.id, domain);
      const embed = new EmbedBuilder()
        .setTitle(`🤝 Mentors Disponibles ${domain ? `(${domain})` : ''}`)
        .setColor(0x10b981)
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (mentors.length === 0) {
        embed.setDescription('Aucun mentor n\'est encore enregistré dans ce domaine. Devenez le premier avec `/communaute mentorat action:devenir` !');
      } else {
        mentors.forEach((m) => {
          embed.addFields({
            name: `👤 ${m.username}`,
            value: `🎯 Domaines : **${m.domains.join(', ')}**\n⏰ Dispos : *${m.availability}*`,
            inline: false,
          });
        });
      }
      return await interaction.editReply({ embeds: [embed] });
    }
  }
  if (sub === 'objectifs') {
    const action = options.getString('action') || 'voir';
    if (action === 'creer') {
      if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return await interaction.reply({ content: '❌ La création d\'objectifs collectifs est réservée au staff.', flags: MessageFlags.Ephemeral });
      }
      const titre = options.getString('titre');
      const cible = options.getInteger('cible');
      const unite = options.getString('unite') || 'points';
      if (!titre || !cible) {
        return await interaction.reply({ content: '❌ Veuillez préciser un titre et une cible numérique.', flags: MessageFlags.Ephemeral });
      }
      const g = await createCommunityGoal({ guildId: guild.id, title: titre, target: cible, unit: unite });
      return await interaction.reply({
        content: `🎯 **Objectif collectif créé avec succès !**\n• Titre : **${g.title}**\n• Cible : **${g.target} ${g.unit}**`,
      });
    }
    await interaction.deferReply();
    const goals = await getCommunityGoals(guild.id, 'active');
    const embed = new EmbedBuilder()
      .setTitle('🎯 Objectifs Collectifs du Serveur')
      .setColor(0x38bdf8)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    const components = [];
    if (goals.length === 0) {
      embed.setDescription('Aucun objectif collectif n\'est actuellement en cours.');
    } else {
      goals.slice(0, 5).forEach((g, idx) => {
        const pct = Math.min(100, Math.round((g.current / g.target) * 100));
        const filled = Math.round(pct / 10);
        const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
        embed.addFields({
          name: `📌 ${g.title}`,
          value: `\`${bar}\` **${pct}%** (${g.current} / ${g.target} ${g.unit})`,
          inline: false,
        });
        if (idx === 0) {
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`goal_contrib_${g._id}_1`).setLabel('+1 Contribuer').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`goal_contrib_${g._id}_5`).setLabel('+5 Contribuer').setStyle(ButtonStyle.Primary)
          );
          components.push(row);
        }
      });
    }
    return await interaction.editReply({ embeds: [embed], components });
  }
  if (sub === 'merci') {
    const target = options.getUser('membre');
    const message = options.getString('message');
    const cat = options.getString('categorie') || 'entraide';
    const res = await sendThankYou({
      guildId: guild.id,
      fromUserId: user.id,
      fromUsername: user.username,
      toUserId: target.id,
      toUsername: target.username,
      message,
      category: cat,
      isPublic: true,
    });
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.error}`, flags: MessageFlags.Ephemeral });
    }
    const embed = new EmbedBuilder()
      .setTitle('💖 Remerciement Public')
      .setDescription(`**<@${user.id}>** tient à remercier chaleureusement **<@${target.id}>** !\n\n> *« ${message} »*`)
      .setColor(0xf43f5e)
      .addFields({ name: '🏷️ Catégorie', value: THANK_CATEGORIES[cat] || 'Sympathie', inline: true })
      .setFooter({ text: 'Codé avec ❤️ par Saez | La reconnaissance et la bienveillance renforcent Saez !' })
      .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`thx_react_${res.thank._id}`).setEmoji('💖').setLabel('Soutiens (0)').setStyle(ButtonStyle.Secondary)
    );
    return await interaction.reply({ embeds: [embed], components: [row] });
  }
  if (sub === 'mur-merci') {
    await interaction.deferReply();
    const list = await getPublicThanks(guild.id, 6);
    const embed = new EmbedBuilder()
      .setTitle('💖 Mur de la Gratitude & des Remerciements')
      .setColor(0xf43f5e)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (list.length === 0) {
      embed.setDescription('Le mur est encore vierge. Soyez le premier à remercier un membre avec `/communaute merci` !');
    } else {
      list.forEach((t) => {
        embed.addFields({
          name: `💖 De <@${t.fromUserId}> à <@${t.toUserId}> • ${THANK_CATEGORIES[t.category] || 'Soutien'}`,
          value: `*"${t.message}"*\n✨ **${t.reactionsCount || 0}** soutien(s)`,
          inline: false,
        });
      });
    }
    return await interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'presentation') {
    const targetUser = options.getUser('membre');
    const bio = options.getString('bio');
    const animeFavs = options.getString('animes_favoris');
    if (bio || animeFavs) {
      const p = await saveUserProfile(guild.id, user.id, user.username, {
        bio: bio || '',
        animeFavorites: animeFavs || '',
      });
      const embed = new EmbedBuilder()
        .setTitle('✨ Votre Présentation a été Enregistrée !')
        .setDescription(`**Bio :** ${p.bio || 'Non renseignée'}\n**Animes favoris :** ${p.animeFavorites || 'Non renseignés'}`)
        .setColor(0x10b981)
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
    const target = targetUser || user;
    const p = await getUserProfile(guild.id, target.id);
    const embed = new EmbedBuilder()
      .setTitle(`👤 Présentation de ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setColor(0x00e5ff)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (!p) {
      embed.setDescription(`<@${target.id}> n'a pas encore créé sa présentation. Remplissez la vôtre avec \`/communaute presentation bio:...\` !`);
    } else {
      embed.addFields(
        { name: '📝 À propos', value: p.bio || 'Aucune description', inline: false },
        { name: '🎌 Animes / Mangas favoris', value: p.animeFavorites || 'Non renseignés', inline: false },
        { name: '🎯 Centres d\'intérêt', value: (p.interests && p.interests.length > 0) ? p.interests.join(', ') : 'Non déclarés', inline: false }
      );
    }
    return await interaction.reply({ embeds: [embed] });
  }
  if (sub === 'interets') {
    await interaction.deferReply();
    const interest = options.getString('interet');
    const matches = await searchMembersByInterests(guild.id, [interest], 8);
    const embed = new EmbedBuilder()
      .setTitle(`🎯 Membres partageant la passion : ${interest}`)
      .setColor(0x00e5ff)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (matches.length === 0) {
      embed.setDescription(`Aucun membre n'a encore déclaré cet intérêt. Déclarez le vôtre dans \`/communaute presentation\` !`);
    } else {
      const lines = matches.map((m) => `• <@${m.profile.userId}> (\`${m.profile.username}\`)`);
      embed.setDescription(lines.join('\n'));
    }
    return await interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'compatibilite') {
    const target = options.getUser('membre');
    const res = await calculateCompatibility(guild.id, user.id, target.id);
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.error}`, flags: MessageFlags.Ephemeral });
    }
    const embed = new EmbedBuilder()
      .setTitle('🤝 Points Communs & Centres d\'Intérêt Partagés')
      .setDescription(`Affinité déclarée entre **<@${user.id}>** et **<@${target.id}>** :\n\n` +
        `📊 **Score d'intérêts partagés :** **${res.score}%**\n` +
        (res.commonInterests.length > 0
          ? `✨ **Passions communes :** ${res.commonInterests.join(', ')}`
          : `💡 *Vous n'avez pas encore d'intérêts en commun déclarés. Une belle opportunité pour faire connaissance !*`))
      .setColor(0x10b981)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Basé sur les centres d\'intérêt enregistrés dans les profils' })
      .setTimestamp();
    return await interaction.reply({ embeds: [embed] });
  }
  if (sub === 'brise-glace') {
    const q = getRandomIcebreaker();
    const embed = new EmbedBuilder()
      .setTitle('❄️ Brise-Glace Communautaire !')
      .setDescription(`### *« ${q} »*\n\nLancez vos réponses et partagez votre avis dans le salon ! ✨`)
      .setColor(0x38bdf8)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Discussions & Partage' })
      .setTimestamp();
    return await interaction.reply({ embeds: [embed] });
  }
  if (sub === 'entraide') {
    const action = options.getString('action') || 'liste';
    if (action === 'demander') {
      const titre = options.getString('titre');
      const domaine = options.getString('domaine') || 'Général';
      const desc = options.getString('description');
      if (!titre || !desc) {
        return await interaction.reply({ content: '❌ Veuillez indiquer un titre et une description détaillée.', flags: MessageFlags.Ephemeral });
      }
      const req = await createHelpRequest({
        guildId: guild.id,
        authorId: user.id,
        authorName: user.username,
        title: titre,
        domain: domaine,
        description: desc,
      });
      const embed = new EmbedBuilder()
        .setTitle(`🤝 Demande d'Entraide : ${req.title}`)
        .setDescription(`**Domaine :** \`${req.domain}\`\n**Demandeur :** <@${user.id}>\n\n**Détails :**\n${desc}`)
        .setColor(0xf59e0b)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Si vous avez la solution, venez apporter votre aide !' })
        .setTimestamp();
      return await interaction.reply({ embeds: [embed] });
    }
    await interaction.deferReply();
    const list = await getHelpRequests(guild.id, 'open', 6);
    const embed = new EmbedBuilder()
      .setTitle('🤝 Demandes d\'Entraide Ouvertes')
      .setColor(0xf59e0b)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (list.length === 0) {
      embed.setDescription('Aucune demande d\'aide en attente. Toute la communauté est sereine ! ✨');
    } else {
      list.forEach((r) => {
        embed.addFields({
          name: `❓ ${r.title} [${r.domain}]`,
          value: `👤 <@${r.authorId}> : *${r.description.slice(0, 150)}*`,
          inline: false,
        });
      });
    }
    return await interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'souvenirs') {
    await interaction.deferReply();
    const milestones = await getMilestones(guild.id);
    const guestbook = await getGuestbookEntries(guild.id, 5);
    const embed = new EmbedBuilder()
      .setTitle(`🏛️ Histoire & Livre d'or — ${guild.name}`)
      .setColor(0x00e5ff)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (milestones.length === 0 && guestbook.length === 0) {
      embed.setDescription('Aucun jalon historique ou message du livre d\'or n\'a encore été gravé.');
    } else {
      if (milestones.length > 0) {
        const lines = milestones.map((m) => `📅 **${new Date(m.date).toLocaleDateString('fr-FR')}** : **${m.title}** — *${m.description}*`);
        embed.addFields({ name: '🏆 Jalons Historiques du Serveur', value: lines.join('\n') });
      }
      if (guestbook.length > 0) {
        const gbLines = guestbook.map((g) => `📖 **${g.authorName}** : *« ${g.message} »*`);
        embed.addFields({ name: '✨ Extraits du Livre d\'Or', value: gbLines.join('\n') });
      }
    }
    return await interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'config') {
    if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({ content: '❌ Cette commande nécessite la permission `Gérer le serveur`.', flags: MessageFlags.Ephemeral });
    }
    const bChan = options.getChannel('salon_anniversaires');
    const cChan = options.getChannel('salon_confessions');
    const aChan = options.getChannel('salon_candidatures');
    const vConf = options.getBoolean('validation_confessions');
    const mActive = options.getBoolean('module_actif');
    const updates = {};
    if (bChan) updates.anniversaires_channel_id = bChan.id;
    if (cChan) updates.confessions_channel_id = cChan.id;
    if (aChan) updates.candidatures_channel_id = aChan.id;
    if (vConf !== null) updates.confessions_require_approval = vConf;
    if (mActive !== null) updates.enabled = mActive;
    const saved = await saveCommunitySettings(guild.id, updates);
    const embed = new EmbedBuilder()
      .setTitle('⚙️ Configuration Communautaire Actualisée')
      .setColor(0x10b981)
      .addFields(
        { name: '🔌 Statut Module', value: saved.enabled ? '✅ Activé' : '❌ Désactivé', inline: true },
        { name: '🎂 Salon Anniversaires', value: saved.anniversaires_channel_id ? `<#${saved.anniversaires_channel_id}>` : '*Non défini*', inline: true },
        { name: '🤫 Salon Confessions', value: saved.confessions_channel_id ? `<#${saved.confessions_channel_id}>` : '*Non défini*', inline: true },
        { name: '📩 Salon Candidatures', value: saved.candidatures_channel_id ? `<#${saved.candidatures_channel_id}>` : '*Non défini*', inline: true },
        { name: '🛡️ Modération Confessions', value: saved.confessions_require_approval ? '✅ Exigée avant publication' : '⚡ Directe', inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Modifications sauvegardées avec succès.' })
      .setTimestamp();
    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
  if (sub === 'statistiques') {
    await interaction.deferReply();
    const stats = await getCommunityOverviewStats(guild.id);
    const embed = new EmbedBuilder()
      .setTitle(`📊 Panorama de la Vie Communautaire — ${guild.name}`)
      .setColor(0x00e5ff)
      .addFields(
        { name: '📩 Candidatures Déposées', value: `**${stats.applicationsTotal}** dossiers`, inline: true },
        { name: '🎂 Anniversaires Indexés', value: `**${stats.birthdaysTotal}** membres`, inline: true },
        { name: '🎯 Objectifs Fixés', value: `**${stats.goalsTotal}** défis`, inline: true },
        { name: '💖 Remerciements Partagés', value: `**${stats.thanksTotal}** messages`, inline: true },
        { name: '🎙️ Débats Ouverts', value: `**${stats.activeDebatesTotal}** actifs`, inline: true },
        { name: '🎓 Mentors Actifs', value: `**${stats.mentorsTotal}** volontaires`, inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Statistiques mises à jour en temps réel' })
      .setTimestamp();
    return await interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'confidentialite') {
    const doDelete = options.getBoolean('supprimer_mes_donnees');
    if (doDelete) {
      await purgeUserData(guild.id, user.id);
      return await interaction.reply({
        content: '🗑️ **Conformément au RGPD et au droit à l\'oubli, l\'intégralité de vos données communautaires privées (profil, date d\'anniversaire, profil mentor, brouillons) a été supprimée de nos bases.**',
        flags: MessageFlags.Ephemeral,
      });
    }
    const b = await getUserBirthday(guild.id, user.id);
    const p = await getUserProfile(guild.id, user.id);
    const embed = new EmbedBuilder()
      .setTitle('🔒 Vos Données Communautaires & Confidentialité')
      .setDescription('Saez respecte votre vie privée. Aucune donnée sensible n\'est transmise à des tiers.')
      .setColor(0x10b981)
      .addFields(
        { name: '🎂 Anniversaire Enregistré', value: b ? `${b.day}/${b.month} (Visibilité: ${b.visibility})` : '*Aucun*', inline: true },
        { name: '👤 Profil Communautaire', value: p ? 'Enregistré' : '*Aucun*', inline: true },
        { name: '🗑️ Suppression', value: 'Utilisez `/communaute confidentialite supprimer_mes_donnees:Vrai` pour effacer toutes vos données.', inline: false }
      )
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
  if (sub === 'aide') {
    const embed = new EmbedBuilder()
      .setTitle('🌟 Guide Interactif du Hub Communautaire Saez')
      .setDescription('Retrouvez l\'ensemble des commandes et outils conçus pour animer et connecter le serveur.')
      .setColor(0x00e5ff)
      .addFields(
        { name: '📩 Recrutement & Staff', value: '`/communaute postuler` • `/communaute candidatures`' },
        { name: '🎂 Célébrations & Fêtes', value: '`/communaute anniversaire` • `/communaute anniversaires`' },
        { name: '⭐ Réputation & Gratitude', value: '`/communaute reputation` • `/communaute top-reputation` • `/communaute merci`' },
        { name: '🤫 Confessions & Échanges', value: '`/communaute confession` • `/communaute confessions`' },
        { name: '🎙️ Débats & Citoyenneté', value: '`/communaute debat` • `/communaute debats`' },
        { name: '🤝 Mentorat & Entraide', value: '`/communaute mentorat` • `/communaute entraide` • `/communaute objectifs`' },
        { name: '✨ Rencontres & Passion', value: '`/communaute presentation` • `/communaute interets` • `/communaute compatibilite`' },
        { name: '⚙️ Administration & RGPD', value: '`/communaute config` • `/communaute statistiques` • `/communaute confidentialite`' }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes Community Hub' })
      .setTimestamp();
    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
}
