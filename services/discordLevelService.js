import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getDb } from '../database/mongo.js';
import { config } from '../config.js';
export const DEFAULT_ROLE_REWARDS = [
  {
    level: 10,
    name: '🍙・Genin Shōnen',
    emoji: '🍙',
    color: '#38bdf8', 
    description: 'Apprenti ninja et novice passionné du monde des animés',
  },
  {
    level: 20,
    name: '⚔️・Pourfendeur de Démons',
    emoji: '⚔️',
    color: '#10b981', 
    description: 'Guerrier aguerri ayant prouvé sa bravoure et son assiduité',
  },
  {
    level: 30,
    name: '⚡・Pilier / Jōnin d\'Élite',
    emoji: '⚡',
    color: '#f59e0b', 
    description: 'Pilier respecté et maître incontournable de la communauté',
  },
  {
    level: 40,
    name: '👑・Capitaine Shinigami',
    emoji: '👑',
    color: '#ec4899', 
    description: 'Commandant d\'élite ayant éveillé son plein potentiel',
  },
  {
    level: 50,
    name: '🌟・Roi des Pirates / Légende Saiyan',
    emoji: '🌟',
    color: '#a855f7', 
    description: 'Légende vivante absolue au sommet de Saez Animes',
  },
];
const messageCooldowns = new Map();
const voiceTracking = new Map();
export function calculateLevel(totalXp = 0, xpBase = 100) {
  const safeXp = Math.max(0, Math.floor(totalXp || 0));
  const base = Math.max(10, Math.floor(xpBase || 100));
  let level = 1;
  let remainingXp = safeXp;
  while (true) {
    const xpNeededForNext = level * base;
    if (remainingXp < xpNeededForNext) {
      const progressPct = Math.min(100, Math.max(0, Math.round((remainingXp / xpNeededForNext) * 100)));
      return {
        level,
        currentLevelXp: remainingXp,
        nextLevelXp: xpNeededForNext,
        progressPct,
        totalXp: safeXp,
      };
    }
    remainingXp -= xpNeededForNext;
    level++;
  }
}
export function formatVoiceTime(seconds = 0) {
  const safeSec = Math.max(0, Math.floor(seconds || 0));
  const hours = Math.floor(safeSec / 3600);
  const minutes = Math.floor((safeSec % 3600) / 60);
  const secs = safeSec % 60;
  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${secs}s`;
}
export function getAnimeTitleForLevel(level = 1) {
  if (level >= 50) return { title: 'Roi des Pirates / Légende Saiyan', emoji: '🌟', color: '#a855f7', tier: 5 };
  if (level >= 40) return { title: 'Capitaine Shinigami', emoji: '👑', color: '#ec4899', tier: 4 };
  if (level >= 30) return { title: 'Pilier / Jōnin d\'Élite', emoji: '⚡', color: '#f59e0b', tier: 3 };
  if (level >= 20) return { title: 'Pourfendeur de Démons', emoji: '⚔️', color: '#10b981', tier: 2 };
  if (level >= 10) return { title: 'Genin Shōnen', emoji: '🍙', color: '#38bdf8', tier: 1 };
  return { title: 'Citoyen d\'Akihabara', emoji: '🌱', color: '#94a3b8', tier: 0 };
}
export async function getLevelConfig(guildId) {
  const targetGuildId = guildId || config.guildId;
  const defaultCfg = {
    guild_id: targetGuildId,
    enabled: true,
    xp_per_message_min: 15,
    xp_per_message_max: 25,
    message_cooldown_seconds: 60,
    xp_per_voice_minute: 10,
    announcement_channel_id: null, 
    announcements_enabled: true,
    dm_announcements: false,
    role_rewards: DEFAULT_ROLE_REWARDS.map(r => ({ ...r, role_id: null })),
  };
  try {
    const db = getDb();
    const col = db.collection('discord_level_config');
    const doc = await col.findOne({ _id: targetGuildId });
    if (!doc) return defaultCfg;
    return {
      ...defaultCfg,
      ...doc,
      role_rewards: Array.isArray(doc.role_rewards) && doc.role_rewards.length > 0 ? doc.role_rewards : defaultCfg.role_rewards,
    };
  } catch (err) {
    console.warn('[LevelService] Erreur lecture configuration :', err.message);
    return defaultCfg;
  }
}
export async function saveLevelConfig(guildId, newConfig) {
  const targetGuildId = guildId || config.guildId;
  try {
    const db = getDb();
    const col = db.collection('discord_level_config');
    await col.updateOne(
      { _id: targetGuildId },
      { $set: { ...newConfig, updated_at: new Date() } },
      { upsert: true }
    );
    return { success: true };
  } catch (err) {
    console.error('[LevelService] Erreur sauvegarde configuration :', err);
    return { success: false, error: err.message };
  }
}
export async function autoCreateMilestoneRoles(guild) {
  if (!guild) {
    throw new Error('Serveur Discord introuvable');
  }
  const botMember = await guild.members.fetchMe().catch(() => null);
  if (!botMember || !botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
    throw new Error('Le bot ne possède pas la permission "Gérer les rôles" (ManageRoles) sur ce serveur.');
  }
  const currentCfg = await getLevelConfig(guild.id);
  const createdRoles = [];
  const updatedRewards = [];
  for (const reward of DEFAULT_ROLE_REWARDS) {
    let targetRole = null;
    if (currentCfg.role_rewards) {
      const existingCfg = currentCfg.role_rewards.find(r => r.level === reward.level);
      if (existingCfg?.role_id) {
        targetRole = guild.roles.cache.get(existingCfg.role_id) || (await guild.roles.fetch(existingCfg.role_id).catch(() => null));
      }
    }
    if (!targetRole) {
      targetRole = guild.roles.cache.find(r => r.name.toLowerCase() === reward.name.toLowerCase());
    }
    if (!targetRole) {
      const colorHex = reward.color.startsWith('#') ? reward.color : `#${reward.color}`;
      targetRole = await guild.roles.create({
        name: reward.name,
        color: colorHex,
        hoist: true, 
        mentionable: false,
        reason: `Rôle de progression Saez Anime — Palier Niveau ${reward.level}`,
      });
      createdRoles.push({ action: 'created', role: targetRole, level: reward.level });
    } else {
      createdRoles.push({ action: 'existing', role: targetRole, level: reward.level });
    }
    updatedRewards.push({
      level: reward.level,
      name: reward.name,
      emoji: reward.emoji,
      color: reward.color,
      description: reward.description,
      role_id: targetRole.id,
    });
  }
  await saveLevelConfig(guild.id, {
    ...currentCfg,
    role_rewards: updatedRewards,
  });
  return {
    success: true,
    roles: createdRoles,
    updatedRewards,
  };
}
export async function getUserLevelData(guildId, userId) {
  try {
    const db = getDb();
    const col = db.collection('discord_levels');
    const doc = await col.findOne({ _id: `${guildId}_${userId}` });
    const xp = doc?.xp || 0;
    const levelInfo = calculateLevel(xp);
    const voiceSec = doc?.voice_seconds || 0;
    return {
      userId,
      guildId,
      username: doc?.username || 'Membre',
      xp,
      level: doc?.level || levelInfo.level,
      levelInfo,
      messagesCount: doc?.messages_count || 0,
      messagesXp: doc?.messages_xp || 0,
      voiceSeconds: voiceSec,
      voiceFormatted: formatVoiceTime(voiceSec),
      voiceXp: doc?.voice_xp || 0,
      lastMessageAt: doc?.last_message_at || null,
      lastVoiceAt: doc?.last_voice_at || null,
    };
  } catch (err) {
    console.warn('[LevelService] Erreur lecture user level :', err.message);
    const levelInfo = calculateLevel(0);
    return {
      userId,
      guildId,
      username: 'Membre',
      xp: 0,
      level: 1,
      levelInfo,
      messagesCount: 0,
      messagesXp: 0,
      voiceSeconds: 0,
      voiceFormatted: '0s',
      voiceXp: 0,
      lastMessageAt: null,
      lastVoiceAt: null,
    };
  }
}
export async function syncUserRewardRoles(guild, member, level) {
  if (!guild || !member || member.user.bot) return [];
  const cfg = await getLevelConfig(guild.id);
  if (!cfg.enabled || !cfg.role_rewards) return [];
  const addedRoles = [];
  for (const reward of cfg.role_rewards) {
    if (!reward.role_id) continue;
    if (level >= reward.level) {
      if (!member.roles.cache.has(reward.role_id)) {
        try {
          await member.roles.add(reward.role_id, `Récompense de niveau Saez (Palier ${reward.level})`);
          addedRoles.push(reward);
        } catch (rErr) {
          console.warn(`[LevelService] Impossible d'attribuer le rôle ${reward.name} :`, rErr.message);
        }
      }
    }
  }
  return addedRoles;
}
export async function addXp(guild, user, amount, options = {}) {
  if (!guild || !user || user.bot) return null;
  const guildId = guild.id;
  const userId = user.id;
  const username = user.username || 'Membre';
  const cfg = await getLevelConfig(guildId);
  if (!cfg.enabled) return null;
  try {
    const db = getDb();
    const col = db.collection('discord_levels');
    const docId = `${guildId}_${userId}`;
    const existing = (await col.findOne({ _id: docId })) || {
      _id: docId,
      guild_id: guildId,
      user_id: userId,
      username,
      xp: 0,
      messages_count: 0,
      messages_xp: 0,
      voice_seconds: 0,
      voice_xp: 0,
    };
    const oldXp = existing.xp || 0;
    const oldLevel = calculateLevel(oldXp).level;
    const newXp = Math.max(0, oldXp + amount);
    const newLevelInfo = calculateLevel(newXp);
    const newLevel = newLevelInfo.level;
    const updateFields = {
      username,
      xp: newXp,
      level: newLevel,
      updated_at: new Date(),
    };
    if (options.isMessage) {
      updateFields.messages_count = (existing.messages_count || 0) + 1;
      updateFields.messages_xp = (existing.messages_xp || 0) + Math.max(0, amount);
      updateFields.last_message_at = new Date();
    }
    if (options.voiceSeconds) {
      updateFields.voice_seconds = (existing.voice_seconds || 0) + options.voiceSeconds;
      if (options.isVoice || amount > 0) {
        updateFields.voice_xp = (existing.voice_xp || 0) + Math.max(0, amount);
      }
      updateFields.last_voice_at = new Date();
    }
    await col.updateOne({ _id: docId }, { $set: updateFields }, { upsert: true });
    if (newLevel > oldLevel) {
      const member = await guild.members.fetch(userId).catch(() => null);
      let unlockedRewards = [];
      if (member) {
        unlockedRewards = await syncUserRewardRoles(guild, member, newLevel);
      }
      if (cfg.announcements_enabled) {
        await sendLevelUpNotification(guild, user, member, newLevel, unlockedRewards, options.channel, cfg);
      }
      return {
        leveledUp: true,
        oldLevel,
        newLevel,
        newXp,
        unlockedRewards,
      };
    }
    return {
      leveledUp: false,
      oldLevel,
      newLevel,
      newXp,
    };
  } catch (err) {
    console.error('[LevelService] Erreur ajout XP :', err);
    return null;
  }
}
async function sendLevelUpNotification(guild, user, member, newLevel, unlockedRewards, triggerChannel, cfg) {
  const animeInfo = getAnimeTitleForLevel(newLevel);
  const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 256 });
  const embed = new EmbedBuilder()
    .setTitle(`🎉 MONTE EN NIVEAU ! — Palier Débloqué`)
    .setDescription(
      `Félicitations <@${user.id}> ! Grâce à ton activité sur le serveur, tu passes au **Niveau ${newLevel}** !`
    )
    .setColor(parseInt(animeInfo.color.replace('#', ''), 16) || 0x00e5ff)
    .setThumbnail(avatarUrl)
    .addFields(
      { name: '⭐ Nouveau Niveau', value: `\`Niveau ${newLevel}\``, inline: true },
      { name: '🏷️ Rang Anime', value: `${animeInfo.emoji} **${animeInfo.title}**`, inline: true }
    )
    .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système de Progression Discord & Anime' })
    .setTimestamp();
  if (unlockedRewards && unlockedRewards.length > 0) {
    const rolesList = unlockedRewards.map(r => `${r.emoji} **${r.name}** (\`Palier ${r.level}\`)`).join('\n');
    embed.addFields({
      name: '🎖️ Rôle(s) Exclusif(s) Attribué(s) !',
      value: `Tu viens de débloquer le(s) rôle(s) :\n${rolesList}`,
      inline: false,
    });
  }
  let targetChannel = null;
  if (cfg.announcement_channel_id) {
    targetChannel = guild.channels.cache.get(cfg.announcement_channel_id) || (await guild.channels.fetch(cfg.announcement_channel_id).catch(() => null));
  }
  if (!targetChannel && triggerChannel) {
    targetChannel = triggerChannel;
  }
  if (targetChannel && typeof targetChannel.send === 'function') {
    await targetChannel.send({ embeds: [embed] }).catch(() => {});
  }
}
export async function handleMessageXp(message, client) {
  if (!message.guild || message.author.bot) return;
  const userId = message.author.id;
  const now = Date.now();
  const cfg = await getLevelConfig(message.guild.id);
  if (!cfg.enabled) return;
  const cooldownMs = (cfg.message_cooldown_seconds || 60) * 1000;
  const lastXpTime = messageCooldowns.get(userId) || 0;
  if (now - lastXpTime < cooldownMs) {
    return; 
  }
  messageCooldowns.set(userId, now);
  const minXp = cfg.xp_per_message_min || 15;
  const maxXp = cfg.xp_per_message_max || 25;
  const gainedXp = Math.floor(Math.random() * (maxXp - minXp + 1)) + minXp;
  await addXp(message.guild, message.author, gainedXp, {
    isMessage: true,
    channel: message.channel,
  });
}
export async function handleVoiceStateUpdate(oldState, newState) {
  const member = newState.member || oldState.member;
  if (!member || member.user.bot) return;
  const guild = newState.guild || oldState.guild;
  const userId = member.id;
  const cfg = await getLevelConfig(guild.id);
  if (!cfg.enabled) return;
  const xpPerMinute = cfg.xp_per_voice_minute || 10;
  if (!oldState.channelId && newState.channelId) {
    voiceTracking.set(userId, {
      joinedAt: Date.now(),
      guildId: guild.id,
      channelId: newState.channelId,
    });
    return;
  }
  if (oldState.channelId && !newState.channelId) {
    const session = voiceTracking.get(userId);
    voiceTracking.delete(userId);
    if (session) {
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - session.joinedAt) / 1000));
      if (elapsedSeconds >= 10) {
        const earnedXp = Math.floor((elapsedSeconds / 60) * xpPerMinute);
        await addXp(guild, member.user, earnedXp, {
          voiceSeconds: elapsedSeconds,
          isVoice: true,
        });
      }
    }
    return;
  }
  if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
    const session = voiceTracking.get(userId);
    if (session) {
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - session.joinedAt) / 1000));
      if (elapsedSeconds >= 10) {
        const earnedXp = Math.floor((elapsedSeconds / 60) * xpPerMinute);
        await addXp(guild, member.user, earnedXp, {
          voiceSeconds: elapsedSeconds,
          isVoice: true,
        });
      }
    }
    voiceTracking.set(userId, {
      joinedAt: Date.now(),
      guildId: guild.id,
      channelId: newState.channelId,
    });
  }
}
export function startVoiceXpTracking(client) {
  setInterval(async () => {
    try {
      const now = Date.now();
      for (const [, guild] of client.guilds.cache) {
        const cfg = await getLevelConfig(guild.id);
        if (!cfg.enabled || !cfg.xp_per_voice_minute) continue;
        const voiceChannels = guild.channels.cache.filter(
          c => c.isVoiceBased() && c.id !== guild.afkChannelId
        );
        for (const [, channel] of voiceChannels) {
          const activeMembers = channel.members.filter(m => !m.user.bot && !m.voice.deaf);
          for (const [, member] of activeMembers) {
            const session = voiceTracking.get(member.id);
            if (!session) {
              voiceTracking.set(member.id, {
                joinedAt: now,
                guildId: guild.id,
                channelId: channel.id,
              });
            } else {
              const elapsedSeconds = Math.floor((now - session.joinedAt) / 1000);
              if (elapsedSeconds >= 60) {
                const minutes = Math.floor(elapsedSeconds / 60);
                const earnedXp = minutes * cfg.xp_per_voice_minute;
                session.joinedAt = now;
                await addXp(guild, member.user, earnedXp, {
                  voiceSeconds: elapsedSeconds,
                  isVoice: true,
                });
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('[LevelService] Erreur boucle vocale XP :', err.message);
    }
  }, 60 * 1000);
}
export async function getGuildLeaderboard(guildId, limit = 10) {
  const targetGuildId = guildId || config.guildId;
  try {
    const db = getDb();
    const col = db.collection('discord_levels');
    const docs = await col
      .find({ guild_id: targetGuildId })
      .sort({ xp: -1 })
      .limit(limit)
      .toArray();
    return docs.map((doc, idx) => {
      const levelInfo = calculateLevel(doc.xp);
      const animeInfo = getAnimeTitleForLevel(levelInfo.level);
      const voiceSec = doc.voice_seconds || 0;
      return {
        rank: idx + 1,
        userId: doc.user_id,
        username: doc.username || 'Membre',
        xp: doc.xp || 0,
        level: levelInfo.level,
        levelInfo,
        animeInfo,
        messagesCount: doc.messages_count || 0,
        messagesXp: doc.messages_xp || 0,
        voiceSeconds: voiceSec,
        voiceFormatted: formatVoiceTime(voiceSec),
        voiceXp: doc.voice_xp || 0,
      };
    });
  } catch (err) {
    console.warn('[LevelService] Erreur lecture leaderboard guild :', err.message);
    return [];
  }
}
