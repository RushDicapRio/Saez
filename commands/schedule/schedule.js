import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import {
  getUpcomingActivities,
  createScheduleActivity,
  toggleActivityParticipant,
  deleteScheduleActivity,
} from '../../services/scheduleActivityService.js';
export const data = new SlashCommandBuilder()
  .setName('schedule')
  .setDescription('Organisation et planning des activités du serveur')
  .addSubcommand((sub) =>
    sub
      .setName('planning')
      .setDescription('Consulter le calendrier complet des activités prévues')
  )
  .addSubcommand((sub) =>
    sub
      .setName('prochaines')
      .setDescription('Aperçu rapide des prochaines activités à venir')
  )
  .addSubcommand((sub) =>
    sub
      .setName('ajouter')
      .setDescription('Ajouter une nouvelle activité au calendrier')
      .addStringOption((opt) =>
        opt
          .setName('titre')
          .setDescription('Nom de l\'activité (ex: Soirée Anime, Tournoi Gaming...)')
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName('date')
          .setDescription('Date de l\'activité (ex: 25/10 ou 2026-10-25)')
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName('heure')
          .setDescription('Heure de début (ex: 21:00)')
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName('description')
          .setDescription('Description ou détails de l\'événement')
          .setRequired(false)
      )
      .addChannelOption((opt) =>
        opt
          .setName('salon')
          .setDescription('Salon Discord prévu pour cette activité')
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('participer')
      .setDescription('S\'inscrire ou se désinscrire d\'une activité prévue')
      .addStringOption((opt) =>
        opt
          .setName('id')
          .setDescription('L\'identifiant de l\'activité')
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('annuler')
      .setDescription('Annuler et supprimer une activité du planning')
      .addStringOption((opt) =>
        opt
          .setName('id')
          .setDescription('Identifiant de l\'activité à annuler')
          .setRequired(true)
      )
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'planning') {
    await interaction.deferReply();
    const activities = await getUpcomingActivities(interaction.guild.id);
    const embed = new EmbedBuilder()
      .setTitle('📅 Planning & Calendrier des Activités — Saez Animes')
      .setDescription(
        activities.length === 0
          ? 'Aucune activité n\'est actuellement programmée sur le serveur.\nUtilisez `/schedule ajouter` pour en créer une !'
          : `Retrouvez ci-dessous toutes les activités programmées sur le serveur (${activities.length} au total) :`
      )
      .setColor(0x38bdf8)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Pour vous inscrire : /schedule participer <id>' })
      .setTimestamp();
    for (const act of activities.slice(0, 15)) {
      const partCount = act.participants ? act.participants.length : 0;
      const channelInfo = act.channelId ? `<#${act.channelId}>` : '*Non assigné*';
      embed.addFields({
        name: `📌 ${act.title} (ID: \`${act._id}\`)`,
        value: `🗓️ **${act.date} à ${act.time}**\n📍 Salon : ${channelInfo}\n👥 Participants : **${partCount}** inscrit(s)\n📝 ${act.description || '*Aucune description.*'}`,
        inline: false,
      });
    }
    return interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'prochaines') {
    await interaction.deferReply();
    const activities = await getUpcomingActivities(interaction.guild.id);
    const nextThree = activities.slice(0, 3);
    const embed = new EmbedBuilder()
      .setTitle('⚡ 3 Prochaines Activités du Serveur')
      .setColor(0x00e5ff)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (nextThree.length === 0) {
      embed.setDescription('Aucune activité prévue dans les prochains jours. Proposez-en une avec `/schedule ajouter` !');
    } else {
      nextThree.forEach((act, idx) => {
        embed.addFields({
          name: `${idx + 1}. ${act.title}`,
          value: `🗓️ **${act.date} à ${act.time}**\n👥 **${act.participants?.length || 0}** inscrit(s)\nID: \`${act._id}\``,
          inline: true,
        });
      });
    }
    return interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'ajouter') {
    const title = interaction.options.getString('titre');
    const rawDate = interaction.options.getString('date');
    const rawTime = interaction.options.getString('heure').replace('h', ':');
    const description = interaction.options.getString('description') || '';
    const channel = interaction.options.getChannel('salon');
    const activity = await createScheduleActivity({
      guildId: interaction.guild.id,
      title,
      description,
      date: rawDate,
      time: rawTime,
      channelId: channel ? channel.id : null,
      authorId: interaction.user.id,
      authorName: interaction.user.username,
    });
    const embed = new EmbedBuilder()
      .setTitle('✅ Activité Programmée avec Succès !')
      .setDescription(`L'activité a bien été ajoutée au planning du serveur.\nIdentifiant unique : \`${activity._id}\``)
      .setColor(0x10b981)
      .addFields(
        { name: '📌 Titre', value: title, inline: true },
        { name: '🗓️ Date & Heure', value: `${rawDate} à ${rawTime}`, inline: true },
        { name: '📍 Salon', value: channel ? `<#${channel.id}>` : '*Non spécifié*', inline: true },
        { name: '📝 Description', value: description || '*Aucune description.*', inline: false }
      )
      .setFooter({ text: `Codé avec ❤️ par Saez | Inscription rapide : /schedule participer ${activity._id}` })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'participer') {
    const actId = interaction.options.getString('id');
    const res = await toggleActivityParticipant(actId, interaction.user.id);
    if (!res.success) {
      return interaction.reply({ content: `❌ ${res.message || 'Activité introuvable.'}`, ephemeral: true });
    }
    if (res.joined) {
      return interaction.reply({
        content: `🎉 **Félicitations !** Vous êtes maintenant inscrit à cette activité. Il y a désormais **${res.total}** participant(s).`,
        ephemeral: true,
      });
    } else {
      return interaction.reply({
        content: `ℹ️ Vous vous êtes désinscrit de cette activité. Il reste **${res.total}** participant(s).`,
        ephemeral: true,
      });
    }
  }
  if (sub === 'annuler') {
    const actId = interaction.options.getString('id');
    const success = await deleteScheduleActivity(actId, interaction.user.id, interaction.member.permissions.has(PermissionFlagsBits.ManageGuild));
    if (!success) {
      return interaction.reply({
        content: '❌ Impossible de supprimer cette activité. Vérifiez l\'ID ou assurez-vous d\'être l\'auteur ou modérateur.',
        ephemeral: true,
      });
    }
    return interaction.reply({
      content: `🗑️ L'activité \`${actId}\` a été supprimée avec succès du calendrier.`,
      ephemeral: true,
    });
  }
}
