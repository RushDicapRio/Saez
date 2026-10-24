import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { getDb } from '../database/mongo.js';
import { config } from '../config.js';
export function parseEventDate(dateString) {
  if (!dateString) return null;
  const str = dateString.trim();
  const frMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (frMatch) {
    const day = parseInt(frMatch[1], 10);
    const month = parseInt(frMatch[2], 10) - 1;
    const year = parseInt(frMatch[3], 10);
    const hours = frMatch[4] ? parseInt(frMatch[4], 10) : 20;
    const minutes = frMatch[5] ? parseInt(frMatch[5], 10) : 0;
    const d = new Date(year, month, day, hours, minutes);
    if (!isNaN(d.getTime())) return d;
  }
  const standardDate = new Date(str);
  if (!isNaN(standardDate.getTime())) {
    return standardDate;
  }
  return null;
}
export function buildEventEmbed(event) {
  const eventTimestamp = Math.floor(new Date(event.date).getTime() / 1000);
  const participantsCount = Array.isArray(event.participants) ? event.participants.length : 0;
  const maxLabel = event.max_participants > 0 ? ` / ${event.max_participants}` : ' (Places illimitées)';
  const isCancelled = event.status === 'cancelled';
  const isCompleted = event.status === 'completed';
  let statusBadge = '🟢 Événement Ouvert';
  let embedColor = config.colors.primary || 0x00e5ff;
  if (isCancelled) {
    statusBadge = '🔴 Événement Annulé';
    embedColor = 0xef4444;
  } else if (isCompleted) {
    statusBadge = '🏁 Événement Terminé';
    embedColor = 0x64748b;
  }
  const embed = new EmbedBuilder()
    .setTitle(`🎉 ${event.title}`)
    .setDescription(
      `${isCancelled ? '⚠️ **CET ÉVÉNEMENT A ÉTÉ ANNULÉ**\n\n' : ''}${event.description}\n\n` +
      `📅 **Date & Heure :** <t:${eventTimestamp}:F> (<t:${eventTimestamp}:R>)\n` +
      `👥 **Inscrits :** **${participantsCount}${maxLabel}**\n` +
      `👑 **Organisé par :** <@${event.creator_id}>\n` +
      `🏷️ **Statut :** \`${statusBadge}\``
    )
    .setColor(embedColor)
    .setFooter({ text: `Codé avec ❤️ par Saez | ID Événement : ${event._id} • Saez Animes` })
    .setTimestamp();
  if (event.banner_url) {
    embed.setImage(event.banner_url);
  }
  return embed;
}
export function buildEventButtons(eventId, disabled = false) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`event_join_${eventId}`)
      .setLabel('S\'inscrire')
      .setEmoji('🎟️')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`event_leave_${eventId}`)
      .setLabel('Se désinscrire')
      .setEmoji('❌')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`event_list_${eventId}`)
      .setLabel('Participants')
      .setEmoji('👥')
      .setStyle(ButtonStyle.Primary)
  );
  return [row];
}
export async function createEvent(guild, {
  title,
  description,
  date,
  channelId,
  bannerUrl,
  maxParticipants = 0,
  creator,
}) {
  const eventDate = typeof date === 'string' ? parseEventDate(date) : date;
  if (!eventDate || isNaN(eventDate.getTime())) {
    throw new Error('Date invalide. Utilisez le format "JJ/MM/AAAA HH:mm" (ex: 25/10/2026 21:00).');
  }
  const channel = guild.channels.cache.get(channelId) || (await guild.channels.fetch(channelId).catch(() => null));
  if (!channel || typeof channel.send !== 'function') {
    throw new Error('Salon introuvable ou non accessible pour envoyer l\'événement.');
  }
  const eventId = `evt_${Date.now()}`;
  const eventDoc = {
    _id: eventId,
    guild_id: guild.id,
    title: title.trim(),
    description: description.trim(),
    date: eventDate,
    channel_id: channel.id,
    message_id: null,
    banner_url: bannerUrl?.trim() || null,
    max_participants: Math.max(0, parseInt(maxParticipants, 10) || 0),
    creator_id: creator.id,
    creator_name: creator.username || 'Organisateur',
    participants: [],
    status: 'active',
    reminded_1h: false,
    reminded_15m: false,
    created_at: new Date(),
  };
  const embed = buildEventEmbed(eventDoc);
  const components = buildEventButtons(eventId);
  const sentMessage = await channel.send({
    content: '📢 **NOUVEL ÉVÉNEMENT COMMUNAUTAIRE !** Cliquez ci-dessous pour participer :',
    embeds: [embed],
    components,
  });
  eventDoc.message_id = sentMessage.id;
  const db = getDb();
  await db.collection('discord_events').insertOne(eventDoc);
  return eventDoc;
}
export async function getEventById(eventId) {
  try {
    const db = getDb();
    return await db.collection('discord_events').findOne({ _id: eventId });
  } catch (err) {
    console.warn('[EventService] Erreur lecture événement :', err.message);
    return null;
  }
}
export async function joinEvent(eventId, user, client) {
  const event = await getEventById(eventId);
  if (!event) {
    return { success: false, message: 'Cet événement n\'existe plus.' };
  }
  if (event.status !== 'active') {
    return { success: false, message: 'Cet événement est déjà terminé ou a été annulé.' };
  }
  if (event.participants?.some((p) => p.user_id === user.id)) {
    return { success: false, message: 'Vous êtes déjà inscrit à cet événement !' };
  }
  if (event.max_participants > 0 && (event.participants?.length || 0) >= event.max_participants) {
    return { success: false, message: 'Désolé, le nombre maximum de places pour cet événement est déjà atteint.' };
  }
  const newParticipant = {
    user_id: user.id,
    username: user.username,
    avatar: user.displayAvatarURL ? user.displayAvatarURL({ dynamic: true }) : null,
    joined_at: new Date(),
  };
  const db = getDb();
  await db.collection('discord_events').updateOne(
    { _id: eventId },
    { $push: { participants: newParticipant } }
  );
  event.participants.push(newParticipant);
  await refreshEventMessage(event, client);
  return {
    success: true,
    message: `🎉 Inscription confirmée pour **${event.title}** ! Vous recevrez un rappel automatique avant le début.`,
    participantsCount: event.participants.length,
  };
}
export async function leaveEvent(eventId, user, client) {
  const event = await getEventById(eventId);
  if (!event) {
    return { success: false, message: 'Cet événement n\'existe plus.' };
  }
  if (!event.participants?.some((p) => p.user_id === user.id)) {
    return { success: false, message: 'Vous n\'êtes pas inscrit à cet événement.' };
  }
  const db = getDb();
  await db.collection('discord_events').updateOne(
    { _id: eventId },
    { $pull: { participants: { user_id: user.id } } }
  );
  event.participants = event.participants.filter((p) => p.user_id !== user.id);
  await refreshEventMessage(event, client);
  return {
    success: true,
    message: `❌ Vous vous êtes désinscrit de **${event.title}**.`,
    participantsCount: event.participants.length,
  };
}
export async function refreshEventMessage(event, client) {
  try {
    if (!event.channel_id || !event.message_id || !client) return;
    const channel = client.channels.cache.get(event.channel_id) || (await client.channels.fetch(event.channel_id).catch(() => null));
    if (!channel) return;
    const message = await channel.messages.fetch(event.message_id).catch(() => null);
    if (!message) return;
    const embed = buildEventEmbed(event);
    const disabled = event.status !== 'active';
    const components = buildEventButtons(event._id, disabled);
    await message.edit({ embeds: [embed], components }).catch(() => {});
  } catch (err) {
    console.warn('[EventService] Erreur mise à jour message événement :', err.message);
  }
}
export async function cancelEvent(eventId, client, reason = '') {
  const event = await getEventById(eventId);
  if (!event) {
    return { success: false, message: 'Événement introuvable.' };
  }
  const db = getDb();
  await db.collection('discord_events').updateOne(
    { _id: eventId },
    { $set: { status: 'cancelled', cancel_reason: reason, updated_at: new Date() } }
  );
  event.status = 'cancelled';
  await refreshEventMessage(event, client);
  try {
    if (event.channel_id && client) {
      const channel = client.channels.cache.get(event.channel_id) || (await client.channels.fetch(event.channel_id).catch(() => null));
      if (channel) {
        const mentions = (event.participants || []).map(p => `<@${p.user_id}>`).join(' ');
        const cancelEmbed = new EmbedBuilder()
          .setTitle(`🚫 Événement Annulé : ${event.title}`)
          .setDescription(
            `L'événement prévu le <t:${Math.floor(new Date(event.date).getTime() / 1000)}:F> a été annulé.${reason ? `\n\n**Raison :** ${reason}` : ''}`
          )
          .setColor(0xef4444)
          .setFooter({ text: 'Codé avec ❤️ par Saez' })
          .setTimestamp();
        await channel.send({ content: mentions ? `Attention aux participants : ${mentions}` : undefined, embeds: [cancelEmbed] }).catch(() => {});
      }
    }
  } catch {}
  return { success: true, message: `L'événement « ${event.title} » a été annulé avec succès.` };
}
export async function getUpcomingEvents(guildId, limit = 10) {
  try {
    const db = getDb();
    const now = new Date();
    return await db
      .collection('discord_events')
      .find({
        guild_id: guildId || config.guildId,
        status: 'active',
        date: { $gte: now },
      })
      .sort({ date: 1 })
      .limit(limit)
      .toArray();
  } catch (err) {
    console.warn('[EventService] Erreur lecture upcoming events :', err.message);
    return [];
  }
}
export async function getPastEvents(guildId, limit = 15) {
  try {
    const db = getDb();
    const now = new Date();
    return await db
      .collection('discord_events')
      .find({
        guild_id: guildId || config.guildId,
        $or: [{ status: { $in: ['completed', 'cancelled'] } }, { date: { $lt: now } }],
      })
      .sort({ date: -1 })
      .limit(limit)
      .toArray();
  } catch (err) {
    console.warn('[EventService] Erreur lecture past events :', err.message);
    return [];
  }
}
export function startEventReminderLoop(client) {
  setInterval(async () => {
    try {
      const db = getDb();
      const now = Date.now();
      const col = db.collection('discord_events');
      const activeEvents = await col.find({ status: 'active' }).toArray();
      for (const event of activeEvents) {
        const eventTime = new Date(event.date).getTime();
        const diffMs = eventTime - now;
        if (diffMs > 0 && diffMs <= 60 * 60 * 1000 && !event.reminded_1h) {
          await col.updateOne({ _id: event._id }, { $set: { reminded_1h: true } });
          await sendEventReminder(client, event, '1 heure');
        }
        if (diffMs > 0 && diffMs <= 15 * 60 * 1000 && !event.reminded_15m) {
          await col.updateOne({ _id: event._id }, { $set: { reminded_15m: true } });
          await sendEventReminder(client, event, '15 minutes');
        }
        if (diffMs < 0) {
          await col.updateOne({ _id: event._id }, { $set: { status: 'completed' } });
          event.status = 'completed';
          await refreshEventMessage(event, client);
        }
      }
    } catch (err) {
      console.warn('[EventService] Erreur boucle de rappels :', err.message);
    }
  }, 60 * 1000);
}
async function sendEventReminder(client, event, timeLeftLabel) {
  if (!event.channel_id || !client) return;
  try {
    const channel = client.channels.cache.get(event.channel_id) || (await client.channels.fetch(event.channel_id).catch(() => null));
    if (!channel) return;
    const mentions = (event.participants || []).map(p => `<@${p.user_id}>`).join(' ');
    const eventTimestamp = Math.floor(new Date(event.date).getTime() / 1000);
    const embed = new EmbedBuilder()
      .setTitle(`⏰ RAPPEL D'ÉVÉNEMENT — Commence dans ${timeLeftLabel} !`)
      .setDescription(
        `L'événement **${event.title}** commence très bientôt !\n\n` +
        `📅 **Début :** <t:${eventTimestamp}:F> (<t:${eventTimestamp}:R>)\n` +
        `👥 **Inscrits :** ${event.participants?.length || 0} participant(s)\n\n` +
        `Préparez-vous à nous rejoindre !`
      )
      .setColor(0xfbbf24)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système d\'Événements Automatisé' })
      .setTimestamp();
    if (event.banner_url) {
      embed.setThumbnail(event.banner_url);
    }
    await channel.send({
      content: mentions ? `🔔 Rappel pour les inscrits : ${mentions}` : '🔔 Rappel d\'événement communautaire !',
      embeds: [embed],
    });
  } catch (err) {
    console.warn('[EventService] Impossible d\'envoyer le rappel :', err.message);
  }
}
