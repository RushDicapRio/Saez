import {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { getDb } from '../database/mongo.js';
import { recordLog } from './discordLogService.js';
const activeTempChannels = new Map();
export async function getTempVoiceConfig(guildId) {
  try {
    const db = getDb();
    const doc = await db.collection('temp_voice_config').findOne({ guild_id: guildId });
    return (
      doc || {
        guild_id: guildId,
        hub_channel_id: null,
        category_id: null,
        name_template: '🔊 Salon de {user}',
        default_limit: 0,
        enabled: true,
      }
    );
  } catch (err) {
    console.error('[TempVoice] Erreur getTempVoiceConfig :', err);
    return { guild_id: guildId, enabled: false };
  }
}
export async function saveTempVoiceConfig(guildId, updates) {
  try {
    const db = getDb();
    await db.collection('temp_voice_config').updateOne(
      { guild_id: guildId },
      { $set: { ...updates, guild_id: guildId, updated_at: new Date() } },
      { upsert: true }
    );
    return { success: true };
  } catch (err) {
    console.error('[TempVoice] Erreur saveTempVoiceConfig :', err);
    return { success: false, error: err.message };
  }
}
export function buildVoiceControlButtons(channelId) {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`tempvoice_lock_${channelId}`)
      .setLabel('Verrouiller')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`tempvoice_unlock_${channelId}`)
      .setLabel('Déverrouiller')
      .setEmoji('🔓')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`tempvoice_limit_${channelId}`)
      .setLabel('Limite Membres')
      .setEmoji('👥')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`tempvoice_rename_${channelId}`)
      .setLabel('Renommer')
      .setEmoji('✏️')
      .setStyle(ButtonStyle.Secondary)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`tempvoice_block_${channelId}`)
      .setLabel('Bloquer/Expulser')
      .setEmoji('🚫')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`tempvoice_permit_${channelId}`)
      .setLabel('Autoriser Membre')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`tempvoice_stats_${channelId}`)
      .setLabel('Statistiques')
      .setEmoji('📊')
      .setStyle(ButtonStyle.Secondary)
  );
  return [row1, row2];
}
export async function initTempVoice(client) {
  try {
    const db = getDb();
    const channels = await db.collection('temp_voice_channels').find({}).toArray();
    for (const c of channels) {
      activeTempChannels.set(c.channel_id, c);
    }
    console.log(`[TempVoice] 🎙️ ${activeTempChannels.size} salon(s) temporaire(s) restauré(s).`);
  } catch (err) {
    console.error('[TempVoice] Erreur initTempVoice :', err);
  }
}
export async function handleTempVoiceStateUpdate(oldState, newState, client) {
  const guild = newState.guild || oldState.guild;
  if (!guild) return;
  const config = await getTempVoiceConfig(guild.id);
  if (!config || !config.enabled || !config.hub_channel_id) return;
  const member = newState.member || oldState.member;
  if (!member || member.user.bot) return;
  if (newState.channelId === config.hub_channel_id) {
    try {
      const parentCategory = config.category_id || newState.channel?.parentId;
      const channelName = (config.name_template || '🔊 Salon de {user}').replace(
        '{user}',
        member.displayName.slice(0, 20)
      );
      const tempChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        parent: parentCategory || undefined,
        userLimit: config.default_limit || 0,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
          },
          {
            id: member.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.MuteMembers,
              PermissionFlagsBits.DeafenMembers,
              PermissionFlagsBits.MoveMembers,
            ],
          },
        ],
      });
      await member.voice.setChannel(tempChannel);
      const record = {
        channel_id: tempChannel.id,
        guild_id: guild.id,
        owner_id: member.id,
        owner_name: member.displayName,
        created_at: new Date(),
        name: channelName,
        user_limit: config.default_limit || 0,
        is_locked: false,
        total_members_joined: 1,
      };
      activeTempChannels.set(tempChannel.id, record);
      const db = getDb();
      await db.collection('temp_voice_channels').insertOne(record);
      const controlEmbed = new EmbedBuilder()
        .setColor(0x00e5ff)
        .setTitle(`🎙️ Bienvenue dans votre salon vocal temporaire !`)
        .setDescription(
          `Vous êtes le propriétaire de ce salon (**${channelName}**).\n` +
          `Utilisez les boutons ci-dessous ou la commande \`/voice\` pour personnaliser votre salon vocal en temps réel !`
        )
        .addFields(
          { name: '👑 Propriétaire', value: `<@${member.id}>`, inline: true },
          { name: '👥 Limite', value: config.default_limit ? `${config.default_limit} membres` : 'Illimitée', inline: true },
          { name: '🔒 Statut', value: 'Ouvert à tous', inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Ce salon sera supprimé automatiquement dès que tout le monde le quittera.' })
        .setTimestamp();
      await tempChannel
        .send({
          embeds: [controlEmbed],
          components: buildVoiceControlButtons(tempChannel.id),
        })
        .catch(() => {});
      await recordLog({
        client,
        guildId: guild.id,
        type: 'VOICE',
        action: 'Création Salon Temporaire',
        user: member.user,
        target: { id: tempChannel.id, name: channelName, type: 'Salon Vocal' },
        details: `Nouveau salon vocal temporaire créé par ${member.displayName}`,
        channelId: tempChannel.id,
      });
    } catch (createErr) {
      console.error('[TempVoice] Erreur création salon vocal temporaire :', createErr);
    }
  }
  if (oldState.channelId && oldState.channelId !== config.hub_channel_id) {
    const tempChannelId = oldState.channelId;
    const tempRecord = activeTempChannels.get(tempChannelId);
    if (tempRecord) {
      const oldChannel = oldState.channel;
      const remainingHumans = oldChannel?.members.filter((m) => !m.user.bot).size || 0;
      if (remainingHumans === 0) {
        activeTempChannels.delete(tempChannelId);
        try {
          const db = getDb();
          const durationSeconds = Math.round((Date.now() - new Date(tempRecord.created_at).getTime()) / 1000);
          await db.collection('temp_voice_history').insertOne({
            ...tempRecord,
            closed_at: new Date(),
            duration_seconds: durationSeconds,
          });
          await db.collection('temp_voice_channels').deleteOne({ channel_id: tempChannelId });
          if (oldChannel && oldChannel.deletable) {
            await oldChannel.delete('Salon temporaire vide');
          }
          await recordLog({
            client,
            guildId: guild.id,
            type: 'VOICE',
            action: 'Suppression Salon Temporaire',
            user: member?.user,
            target: { id: tempChannelId, name: tempRecord.name, type: 'Salon Vocal' },
            details: `Salon fermé car vide. Durée totale de la session : ${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`,
            channelId: null,
          });
        } catch (delErr) {
          console.error('[TempVoice] Erreur suppression salon vide :', delErr);
        }
      }
    }
  }
}
export async function getTempChannelRecord(channelId) {
  let rec = activeTempChannels.get(channelId);
  if (!rec) {
    try {
      const db = getDb();
      rec = await db.collection('temp_voice_channels').findOne({ channel_id: channelId });
      if (rec) activeTempChannels.set(channelId, rec);
    } catch {}
  }
  return rec;
}
export async function setTempChannelName(channel, newName, userId) {
  const rec = await getTempChannelRecord(channel.id);
  if (!rec) throw new Error("Ce salon n'est pas un salon vocal temporaire géré.");
  if (rec.owner_id !== userId) throw new Error("Seul le créateur du salon peut le renommer.");
  await channel.setName(newName.slice(0, 32));
  rec.name = newName;
  activeTempChannels.set(channel.id, rec);
  const db = getDb();
  await db.collection('temp_voice_channels').updateOne({ channel_id: channel.id }, { $set: { name: newName } });
  return true;
}
export async function setTempChannelLimit(channel, limit, userId) {
  const rec = await getTempChannelRecord(channel.id);
  if (!rec) throw new Error("Ce salon n'est pas un salon vocal temporaire géré.");
  if (rec.owner_id !== userId) throw new Error("Seul le créateur du salon peut changer la limite.");
  const numLimit = Math.max(0, Math.min(99, parseInt(limit, 10) || 0));
  await channel.setUserLimit(numLimit);
  rec.user_limit = numLimit;
  activeTempChannels.set(channel.id, rec);
  const db = getDb();
  await db.collection('temp_voice_channels').updateOne({ channel_id: channel.id }, { $set: { user_limit: numLimit } });
  return numLimit;
}
export async function toggleLockTempChannel(channel, userId, lockState = null) {
  const rec = await getTempChannelRecord(channel.id);
  if (!rec) throw new Error("Ce salon n'est pas un salon vocal temporaire géré.");
  if (rec.owner_id !== userId) throw new Error("Seul le créateur du salon peut verrouiller/déverrouiller.");
  const shouldLock = lockState !== null ? lockState : !rec.is_locked;
  await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
    Connect: !shouldLock,
  });
  rec.is_locked = shouldLock;
  activeTempChannels.set(channel.id, rec);
  const db = getDb();
  await db.collection('temp_voice_channels').updateOne({ channel_id: channel.id }, { $set: { is_locked: shouldLock } });
  return shouldLock;
}
export async function permitMemberInTemp(channel, targetMember, userId) {
  const rec = await getTempChannelRecord(channel.id);
  if (!rec) throw new Error("Ce salon n'est pas un salon vocal temporaire géré.");
  if (rec.owner_id !== userId) throw new Error("Seul le créateur du salon peut gérer les accès.");
  await channel.permissionOverwrites.edit(targetMember, {
    ViewChannel: true,
    Connect: true,
    Speak: true,
  });
  return true;
}
export async function blockMemberInTemp(channel, targetMember, userId) {
  const rec = await getTempChannelRecord(channel.id);
  if (!rec) throw new Error("Ce salon n'est pas un salon vocal temporaire géré.");
  if (rec.owner_id !== userId) throw new Error("Seul le créateur du salon peut bloquer un membre.");
  await channel.permissionOverwrites.edit(targetMember, {
    Connect: false,
  });
  if (targetMember.voice?.channelId === channel.id) {
    await targetMember.voice.disconnect('Bloqué par le propriétaire du salon temporaire');
  }
  return true;
}
export async function transferTempOwnership(channel, newOwnerMember, currentUserId) {
  const rec = await getTempChannelRecord(channel.id);
  if (!rec) throw new Error("Ce salon n'est pas un salon vocal temporaire géré.");
  if (rec.owner_id !== currentUserId) throw new Error("Seul le propriétaire actuel peut céder la gestion.");
  rec.owner_id = newOwnerMember.id;
  rec.owner_name = newOwnerMember.displayName;
  activeTempChannels.set(channel.id, rec);
  const db = getDb();
  await db.collection('temp_voice_channels').updateOne(
    { channel_id: channel.id },
    { $set: { owner_id: newOwnerMember.id, owner_name: newOwnerMember.displayName } }
  );
  return true;
}
export async function getGlobalVoiceStats(guildId) {
  try {
    const db = getDb();
    const historyCol = db.collection('temp_voice_history');
    const totalSessions = await historyCol.countDocuments(guildId ? { guild_id: guildId } : {});
    const pipeline = [
      ...(guildId ? [{ $match: { guild_id: guildId } }] : []),
      {
        $group: {
          _id: null,
          totalDuration: { $sum: '$duration_seconds' },
          avgDuration: { $avg: '$duration_seconds' },
        },
      },
    ];
    const agg = await historyCol.aggregate(pipeline).toArray();
    const stats = agg[0] || { totalDuration: 0, avgDuration: 0 };
    return {
      activeChannels: activeTempChannels.size,
      totalSessions,
      totalHours: Math.round(((stats.totalDuration || 0) / 3600) * 10) / 10,
      avgMinutes: Math.round(((stats.avgDuration || 0) / 60) * 10) / 10,
    };
  } catch (err) {
    console.error('[TempVoice] Erreur getGlobalVoiceStats :', err);
    return { activeChannels: 0, totalSessions: 0, totalHours: 0, avgMinutes: 0 };
  }
}
