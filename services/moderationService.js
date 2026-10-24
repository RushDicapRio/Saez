import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getDb } from '../database/mongo.js';
import { config } from '../config.js';
export async function sendModerationLog(guild, { action, target, moderator, reason, duration, fields = [] }) {
  try {
    const db = getDb();
    const cfgCol = db.collection('config');
    const secCfg = await cfgCol.findOne({ _id: 'security_config' });
    const logChannelId = secCfg?.log_channel_id || '';
    const logChannel = guild.channels.cache.get(logChannelId) || (await guild.channels.fetch(logChannelId).catch(() => null));
    if (!logChannel) return;
    const actionColors = {
      Ban: 0xe20808,     
      Unban: 0x10b981,  
      Kick: 0xf59e0b,    
      Mute: 0x8b5cf6,   
      Unmute: 0x06b6d4,  
      Warn: 0xf59e0b,    
      Clear: 0x3b82f6,   
      Lock: 0xef4444,    
      Unlock: 0x10b981,  
      Slowmode: 0x6366f1 
    };
    const embed = new EmbedBuilder()
      .setTitle(`⚖️ Modération : ${action}`)
      .setColor(actionColors[action] || config.colors.primary)
      .setThumbnail(target.displayAvatarURL ? target.displayAvatarURL({ dynamic: true }) : config.assets.logoUrl)
      .addFields(
        { name: '👤 Cible', value: `${target.tag || target.username || target.id} (<@${target.id}>)`, inline: true },
        { name: '🛡️ Modérateur', value: `${moderator.tag || moderator.username} (<@${moderator.id}>)`, inline: true },
        { name: '📝 Raison', value: reason || 'Aucune raison spécifiée', inline: false }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système de Modération' })
      .setTimestamp();
    if (duration) {
      embed.addFields({ name: '⏳ Durée', value: duration, inline: true });
    }
    if (fields.length > 0) {
      embed.addFields(fields);
    }
    await logChannel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[ModerationLog] Erreur envoi log modération :', err);
  }
}
export async function sendUserSanctionNotice(user, guildName, action, reason, duration) {
  try {
    const embed = new EmbedBuilder()
      .setTitle(`Sanction reçue sur ${guildName}`)
      .setDescription(`Vous avez reçu une sanction de type **${action}**.`)
      .setColor(0xe20808)
      .addFields(
        { name: '📝 Raison', value: reason || 'Non spécifiée' }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Pour toute contestation, veuillez contacter le support Saez.' })
      .setTimestamp();
    if (duration) {
      embed.addFields({ name: '⏳ Durée', value: duration });
    }
    await user.send({ embeds: [embed] }).catch(() => {});
  } catch {}
}
export async function addWarning(guildId, userId, userTag, moderatorId, moderatorTag, reason) {
  const db = getDb();
  const col = db.collection('infractions');
  const warnDoc = {
    guild_id: guildId,
    user_id: userId,
    user_tag: userTag,
    moderator_id: moderatorId,
    moderator_tag: moderatorTag,
    reason: reason || 'Non spécifiée',
    created_at: new Date(),
  };
  await col.insertOne(warnDoc);
  const total = await col.countDocuments({ guild_id: guildId, user_id: userId });
  return total;
}
export async function getUserWarnings(guildId, userId) {
  const db = getDb();
  const col = db.collection('infractions');
  return await col.find({ guild_id: guildId, user_id: userId }).sort({ created_at: -1 }).toArray();
}
export function checkHierarchy(moderatorMember, targetMember) {
  if (!targetMember) return { canAct: true };
  if (targetMember.id === targetMember.guild.ownerId) {
    return { canAct: false, message: 'Impossible de sanctionner le Propriétaire du serveur.' };
  }
  if (targetMember.id === targetMember.guild.members.me.id) {
    return { canAct: false, message: 'Impossible de sanctionner le bot Saez.' };
  }
  if (
    moderatorMember.id !== moderatorMember.guild.ownerId &&
    targetMember.roles.highest.comparePositionTo(moderatorMember.roles.highest) >= 0
  ) {
    return {
      canAct: false,
      message: 'Cette personne a un rôle supérieur ou égal au vôtre dans la hiérarchie Discord.',
    };
  }
  const botHighestRole = targetMember.guild.members.me.roles.highest;
  if (targetMember.roles.highest.comparePositionTo(botHighestRole) >= 0) {
    return {
      canAct: false,
      message: 'Cette personne a un rôle supérieur ou égal à celui du bot dans la hiérarchie Discord.',
    };
  }
  return { canAct: true };
}
