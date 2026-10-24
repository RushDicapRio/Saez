import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';
import {
  createEvent,
  parseEventDate,
  getUpcomingEvents,
  getEventById,
  cancelEvent,
  getPastEvents,
} from '../../services/eventService.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('event')
  .setDescription('Gestion des événements communautaires du serveur')
  .addSubcommand((sub) =>
    sub
      .setName('creer')
      .setDescription('Créer et annoncer un événement communautaire')
      .addStringOption((opt) =>
        opt.setName('titre').setDescription('Titre de l\'événement').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('description').setDescription('Description détaillée').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('date').setDescription('Date et heure (JJ/MM/AAAA HH:mm, ex: 25/10/2026 21:00)').setRequired(true)
      )
      .addChannelOption((opt) =>
        opt
          .setName('salon')
          .setDescription('Salon pour l\'annonce')
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          .setRequired(false)
      )
      .addIntegerOption((opt) =>
        opt.setName('max_participants').setDescription('Nombre max de places (0 = illimité)').setMinValue(0).setMaxValue(1000).setRequired(false)
      )
      .addStringOption((opt) =>
        opt.setName('banniere').setDescription('URL de la bannière (PNG/JPG/GIF)').setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('liste')
      .setDescription('Afficher la liste des prochains événements programmés')
  )
  .addSubcommand((sub) =>
    sub
      .setName('participants')
      .setDescription('Afficher la liste complète des membres inscrits')
      .addStringOption((opt) =>
        opt.setName('id').setDescription('Identifiant de l\'événement (ex: evt_...)').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('annuler')
      .setDescription('Annuler un événement programmé')
      .addStringOption((opt) =>
        opt.setName('id').setDescription('Identifiant de l\'événement à annuler').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('raison').setDescription('Raison de l\'annulation').setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('historique')
      .setDescription('Afficher l\'historique des événements passés')
      .addIntegerOption((opt) =>
        opt.setName('limite').setDescription('Nombre d\'événements (max 25)').setMinValue(1).setMaxValue(25).setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('help')
      .setDescription('Guide et aide du système d\'événements')
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const guild = interaction.guild;
  if (!guild) {
    return interaction.reply({ content: '❌ Cette commande doit être exécutée sur un serveur Discord.', ephemeral: true });
  }
  if (sub === 'help') {
    const embed = new EmbedBuilder()
      .setTitle('📅 Guide & Commandes — Événements Communautaires')
      .setDescription('Organisez des séances cinéma d\'anime, tournois de jeux, soirées karaoké et rassemblements avec gestion automatique des inscriptions et rappels Discord !')
      .setColor(0x00e5ff)
      .addFields(
        { name: '✨ `/event creer`', value: 'Créer un nouvel événement avec titre, date/heure, salon et bannière personnalisée.' },
        { name: '📋 `/event liste`', value: 'Consulter tous les événements à venir avec le nombre de participants inscrits.' },
        { name: '👥 `/event participants [id]`', value: 'Afficher la liste complète des membres inscrits à un événement.' },
        { name: '📜 `/event historique`', value: 'Voir les derniers événements terminés ou archivés.' },
        { name: '❌ `/event annuler [id]`', value: 'Annuler un événement programmé.' }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système d\'Événements' });
    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
  if (sub === 'liste') {
    await interaction.deferReply();
    const events = await getUpcomingEvents(guild.id, 10);
    const embed = new EmbedBuilder()
      .setTitle(`📅 Prochains Événements — ${guild.name}`)
      .setDescription('Voici la liste des événements à venir sur le serveur :')
      .setColor(config.colors.primary || 0x00e5ff)
      .setThumbnail(guild.iconURL({ dynamic: true }) || config.assets.logoUrl)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système d\'Événements' })
      .setTimestamp();
    if (events.length === 0) {
      embed.setDescription('Aucun événement n\'est actuellement programmé. Utilisez `/event creer` pour en organiser un !');
    } else {
      const fields = events.map((ev) => {
        const timestamp = Math.floor(new Date(ev.date).getTime() / 1000);
        const count = ev.participants?.length || 0;
        const maxText = ev.max_participants > 0 ? ` / ${ev.max_participants}` : '';
        return {
          name: `🎉 ${ev.title}`,
          value: `📅 <t:${timestamp}:F> (<t:${timestamp}:R>)\n📍 Annonce : <#${ev.channel_id}>\n👥 Inscrits : **${count}${maxText}**\n🆔 ID : \`${ev._id}\`\n*${ev.description.slice(0, 120)}${ev.description.length > 120 ? '...' : ''}*`,
          inline: false,
        };
      });
      embed.addFields(fields);
    }
    return interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'creer') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageEvents)) {
      return interaction.reply({ content: '❌ Vous devez avoir la permission Gérer les événements pour créer un événement.', ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });
    const title = interaction.options.getString('titre');
    const description = interaction.options.getString('description');
    const dateStr = interaction.options.getString('date');
    const targetChannel = interaction.options.getChannel('salon') || interaction.channel;
    const maxParticipants = interaction.options.getInteger('max_participants') || 0;
    const bannerUrl = interaction.options.getString('banniere') || '';
    const eventDate = parseEventDate(dateStr);
    if (!eventDate) {
      return interaction.editReply({
        content: '❌ Format de date invalide. Utilisez le format `JJ/MM/AAAA HH:mm` (ex: `25/10/2026 21:00`).',
      });
    }
    if (eventDate.getTime() <= Date.now()) {
      return interaction.editReply({
        content: '❌ La date de l\'événement doit être située dans le futur.',
      });
    }
    try {
      const timestamp = Math.floor(eventDate.getTime() / 1000);
      const maxText = maxParticipants > 0 ? ` (Places limitées : ${maxParticipants})` : '';
      const publicEmbed = new EmbedBuilder()
        .setTitle(`🎉 NOUVEL ÉVÉNEMENT : ${title}`)
        .setDescription(
          `**Début de l'événement :** <t:${timestamp}:F> (<t:${timestamp}:R>)\n\n` +
          `**Description :**\n${description}\n\n` +
          `**Organisateur :** <@${interaction.user.id}>\n` +
          `**Participants :** 0 inscrit(s)${maxText}`
        )
        .setColor(config.colors.primary || 0x00e5ff)
        .setThumbnail(guild.iconURL({ dynamic: true }) || config.assets.logoUrl)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Cliquez sur les boutons ci-dessous pour vous inscrire ou vous désinscrire !' })
        .setTimestamp(eventDate);
      if (bannerUrl && bannerUrl.startsWith('http')) {
        publicEmbed.setImage(bannerUrl);
      }
      const tempId = `evt_${Date.now()}`;
      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`event_join_${tempId}`)
          .setLabel('Participer')
          .setEmoji('✋')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`event_leave_${tempId}`)
          .setLabel('Se désinscrire')
          .setEmoji('✖️')
          .setStyle(ButtonStyle.Secondary)
      );
      const announcementMsg = await targetChannel.send({
        content: '📢 **Un nouvel événement communautaire a été programmé !**',
        embeds: [publicEmbed],
        components: [actionRow],
      });
      const eventData = await createEvent({
        guild_id: guild.id,
        channel_id: targetChannel.id,
        message_id: announcementMsg.id,
        creator_id: interaction.user.id,
        title,
        description,
        date: eventDate,
        max_participants: maxParticipants,
        banner_url: bannerUrl,
      });
      const updatedRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`event_join_${eventData._id}`)
          .setLabel('Participer')
          .setEmoji('✋')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`event_leave_${eventData._id}`)
          .setLabel('Se désinscrire')
          .setEmoji('✖️')
          .setStyle(ButtonStyle.Secondary)
      );
      publicEmbed.setFooter({ text: `Codé avec ❤️ par Saez | ID : ${eventData._id} • Cliquez pour participer !` });
      await announcementMsg.edit({ embeds: [publicEmbed], components: [updatedRow] });
      return interaction.editReply({
        content: `✅ L'événement **${title}** a été créé et annoncé avec succès dans <#${targetChannel.id}> !\nIdentifiant : \`${eventData._id}\``,
      });
    } catch (err) {
      return interaction.editReply({ content: `❌ Erreur : ${err.message}` });
    }
  }
  if (sub === 'participants') {
    await interaction.deferReply();
    const eventId = interaction.options.getString('id').trim();
    const event = await getEventById(eventId);
    if (!event) {
      return interaction.editReply({
        content: `❌ Aucun événement trouvé avec l'identifiant \`${eventId}\`. Utilisez \`/event liste\` pour voir les IDs valides.`,
      });
    }
    const participants = event.participants || [];
    const maxLabel = event.max_participants > 0 ? ` / ${event.max_participants}` : '';
    const timestamp = Math.floor(new Date(event.date).getTime() / 1000);
    const embed = new EmbedBuilder()
      .setTitle(`👥 Participants — ${event.title}`)
      .setDescription(
        `📅 **Date :** <t:${timestamp}:F>\n` +
        `👥 **Total inscrits :** **${participants.length}${maxLabel}**\n\n` +
        (participants.length === 0
          ? '*Aucun membre n\'est encore inscrit à cet événement.*'
          : participants.map((p, idx) => `\`${idx + 1}.\` <@${p.user_id}> (${p.username})`).join('\n'))
      )
      .setColor(config.colors.primary || 0x00e5ff)
      .setFooter({ text: `Codé avec ❤️ par Saez | ID : ${event._id} • Saez Animes` })
      .setTimestamp();
    return interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'annuler') {
    await interaction.deferReply({ ephemeral: true });
    const eventId = interaction.options.getString('id').trim();
    const reason = interaction.options.getString('raison') || '';
    const event = await getEventById(eventId);
    if (!event) {
      return interaction.editReply({ content: `❌ Aucun événement trouvé avec l'identifiant \`${eventId}\`.` });
    }
    const isCreator = event.creator_id === interaction.user.id;
    const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
    if (!isCreator && !isAdmin) {
      return interaction.editReply({ content: '❌ Seul le créateur de cet événement ou un administrateur peut l\'annuler.' });
    }
    if (event.status === 'cancelled') {
      return interaction.editReply({ content: '⚠️ Cet événement est déjà annulé.' });
    }
    const success = await cancelEvent(eventId, reason);
    if (!success) {
      return interaction.editReply({ content: '❌ Une erreur est survenue lors de l\'annulation de l\'événement.' });
    }
    try {
      const channel = await guild.channels.fetch(event.channel_id).catch(() => null);
      if (channel) {
        const msg = await channel.messages.fetch(event.message_id).catch(() => null);
        if (msg) {
          const cancelEmbed = EmbedBuilder.from(msg.embeds[0] || {})
            .setTitle(`🔴 ÉVÉNEMENT ANNULÉ : ${event.title}`)
            .setColor(0xef4444)
            .setDescription(`⚠️ **Cet événement a été annulé.**\n${reason ? `*Raison : ${reason}*` : ''}`)
            .setFooter({ text: 'Codé avec ❤️ par Saez | Événement Annulé' });
          await msg.edit({ embeds: [cancelEmbed], components: [] });
        }
      }
    } catch {}
    return interaction.editReply({ content: `✅ L'événement **${event.title}** (\`${eventId}\`) a été annulé avec succès.` });
  }
  if (sub === 'historique') {
    await interaction.deferReply();
    const limit = interaction.options.getInteger('limite') || 10;
    const events = await getPastEvents(guild.id, limit);
    const embed = new EmbedBuilder()
      .setTitle(`📜 Historique des Événements Passés — ${guild.name}`)
      .setDescription('Voici les événements passés de la communauté :')
      .setColor(0x64748b)
      .setThumbnail(guild.iconURL({ dynamic: true }) || config.assets.logoUrl)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système d\'Événements' })
      .setTimestamp();
    if (events.length === 0) {
      embed.setDescription('Aucun événement passé n\'a été trouvé dans l\'historique.');
    } else {
      const fields = events.map((ev) => {
        const timestamp = Math.floor(new Date(ev.date).getTime() / 1000);
        const count = ev.participants?.length || 0;
        const statusLabel = ev.status === 'cancelled' ? '🔴 Annulé' : '🏁 Terminé';
        return {
          name: `${statusLabel} ${ev.title}`,
          value: `📅 <t:${timestamp}:d> • 👥 ${count} inscrit(s)\n🆔 \`${ev._id}\``,
          inline: true,
        };
      });
      embed.addFields(fields);
    }
    return interaction.editReply({ embeds: [embed] });
  }
}
