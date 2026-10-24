import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';
import {
  registerMentorProfile,
  getMentorProfile,
  searchMentors,
  requestMentorship,
  respondMentorshipRequest,
  getMentorships,
  addMentorshipPrivateNote,
  isCommunityEnabled,
  MENTOR_DOMAINS,
} from '../../services/communityHubService.js';
export const data = new SlashCommandBuilder()
  .setName('mentorat')
  .setDescription('Système approfondi de mentorat et d\'accompagnement entre membres')
  .addSubcommand((sub) =>
    sub
      .setName('devenir')
      .setDescription('S\'inscrire en tant que mentor volontaire sur le serveur')
      .addStringOption((opt) =>
        opt
          .setName('domaine')
          .setDescription('Votre spécialité principale')
          .setRequired(true)
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
      .addStringOption((opt) => opt.setName('bio').setDescription('Courte présentation de votre parcours').setRequired(true))
      .addStringOption((opt) => opt.setName('disponibilite').setDescription('Vos créneaux horaires').setRequired(false))
      .addIntegerOption((opt) => opt.setName('max_personnes').setDescription('Nombre max de personnes accompagnées (1 à 5)').setMinValue(1).setMaxValue(5).setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('chercher')
      .setDescription('Rechercher des mentors disponibles selon vos besoins')
      .addStringOption((opt) =>
        opt
          .setName('domaine')
          .setDescription('Domaine ciblé')
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
      .setName('demander')
      .setDescription('Envoyer une demande d\'accompagnement à un mentor volontaire')
      .addUserOption((opt) => opt.setName('mentor').setDescription('Mentor sollicité').setRequired(true))
      .addStringOption((opt) => opt.setName('objectifs').setDescription('Ce que vous aimeriez apprendre ou accomplir').setRequired(true))
      .addStringOption((opt) => opt.setName('domaine').setDescription('Domaine ciblé').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('mes-accompagnements')
      .setDescription('Consulter vos parrainages actifs en cours (en tant que mentor ou mentoré)')
  )
  .addSubcommand((sub) =>
    sub
      .setName('note-privee')
      .setDescription('Ajouter une note personnelle strictement confidentielle sur votre accompagnement')
      .addStringOption((opt) => opt.setName('accompagnement').setDescription('Identifiant du parrainage (ment_xxx)').setRequired(true))
      .addStringOption((opt) => opt.setName('note').setDescription('Texte de votre note secrète').setRequired(true))
  );
export async function execute(interaction) {
  const { guild, user, options } = interaction;
  const sub = options.getSubcommand();
  const enabled = await isCommunityEnabled(guild.id);
  if (!enabled) {
    return await interaction.reply({
      content: '🔒 Le programme de mentorat est actuellement inactif sur ce serveur.',
      flags: MessageFlags.Ephemeral,
    });
  }
  if (sub === 'devenir') {
    const domain = options.getString('domaine');
    const bio = options.getString('bio');
    const availability = options.getString('disponibilite') || 'Soirées & Week-ends';
    const maxMentees = options.getInteger('max_personnes') || 2;
    await registerMentorProfile(guild.id, user.id, user.username, {
      domains: [domain],
      bio,
      availability,
      maxMentees,
    });
    const embed = new EmbedBuilder()
      .setTitle('🎓 Profil Mentor Créé avec Succès !')
      .setDescription(`Merci <@${user.id}> pour votre engagement solidaire au sein de Saez !\n\n• 🎯 **Domaine :** ${domain}\n• ⏰ **Disponibilités :** ${availability}\n• 👥 **Capacité d\'accueil :** ${maxMentees} personne(s) simultanément\n• 📝 **Bio :** *« ${bio} »*`)
      .setColor(0x10b981)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Votre profil est visible par les membres en recherche de mentorat.' })
      .setTimestamp();
    return await interaction.reply({ embeds: [embed] });
  }
  if (sub === 'chercher') {
    await interaction.deferReply();
    const domain = options.getString('domaine');
    const list = await searchMentors(guild.id, domain);
    const embed = new EmbedBuilder()
      .setTitle(`🔍 Mentors Volontaires ${domain ? `— ${domain}` : ''}`)
      .setColor(0x10b981)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (list.length === 0) {
      embed.setDescription('Aucun mentor n\'est actuellement disponible pour ce critère. Rejoignez le programme avec `/mentorat devenir` !');
    } else {
      list.forEach((m) => {
        embed.addFields({
          name: `👤 ${m.username} (<@${m.userId}>)`,
          value: `🎯 **Domaines :** ${m.domains.join(', ')}\n⏰ **Créneaux :** ${m.availability}\n💬 *« ${m.bio} »*`,
          inline: false,
        });
      });
    }
    return await interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'demander') {
    const mentorUser = options.getUser('mentor');
    const goals = options.getString('objectifs');
    const domain = options.getString('domaine');
    const res = await requestMentorship({
      guildId: guild.id,
      menteeId: user.id,
      menteeName: user.username,
      mentorId: mentorUser.id,
      domain,
      goals,
    });
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.error}`, flags: MessageFlags.Ephemeral });
    }
    try {
      const notifEmbed = new EmbedBuilder()
        .setTitle(`🤝 Nouvelle Demande de Parrainage — ${guild.name}`)
        .setDescription(`**<@${user.id}>** (\`${user.username}\`) souhaite être accompagné par vous dans le domaine **${domain}** !\n\n🎯 **Objectifs indiqués :**\n*« ${goals} »*`)
        .setColor(0x10b981)
        .setFooter({ text: `Codé avec ❤️ par Saez | ID demande : ${res.mentorship._id}` })
        .setTimestamp();
      await mentorUser.send({ embeds: [notifEmbed] }).catch(() => {});
    } catch {}
    const embed = new EmbedBuilder()
      .setTitle('📨 Demande de Parrainage Envoyée !')
      .setDescription(`Votre demande a été transmise à <@${mentorUser.id}>.\nIdentifiant de l'accompagnement : \`${res.mentorship._id}\`.`)
      .setColor(0x10b981)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
  if (sub === 'mes-accompagnements') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const list = await getMentorships(guild.id, { userId: user.id });
    const embed = new EmbedBuilder()
      .setTitle(`🤝 Vos Parrainages & Accompagnements — ${guild.name}`)
      .setColor(0x00e5ff)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (list.length === 0) {
      embed.setDescription('Vous n\'avez aucun accompagnement actif pour le moment.');
    } else {
      list.forEach((m) => {
        const isMentor = m.mentorId === user.id;
        const counterpart = isMentor ? `<@${m.menteeId}>` : `<@${m.mentorId}>`;
        const roleStr = isMentor ? '🎓 Vous êtes le mentor' : '🌱 Vous êtes accompagné';
        embed.addFields({
          name: `${m.status === 'active' ? '🟢 Actif' : '⏳ En attente'} — ${m.domain} (\`${m._id}\`)`,
          value: `${roleStr} de ${counterpart}\n🎯 **Objectifs :** *${m.goals}*`,
          inline: false,
        });
      });
    }
    return await interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'note-privee') {
    const mentorshipId = options.getString('accompagnement');
    const noteText = options.getString('note');
    const res = await addMentorshipPrivateNote(mentorshipId, user.id, noteText);
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.error}`, flags: MessageFlags.Ephemeral });
    }
    return await interaction.reply({
      content: `🔒 **Note personnelle enregistrée avec succès.**\nElle est strictement confidentielle et visible uniquement par vous.`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
