import { ChannelType, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { getDb } from '../database/mongo.js';
import { config } from '../config.js';
import {
  buildSuggestionEmbed,
  buildSuggestionButtons,
  ensureSuggestionChannelPermissions,
  getSuggestionChannelId,
  setSuggestionChannelId,
  SUGGESTION_STATUSES,
} from './suggestionService.js';
let relayInterval = null;
let isProcessingQueue = false;
export async function updateBotHeartbeat(client) {
  try {
    const db = getDb();
    const col = db.collection('bot_status');
    const guild = (config.guildId && client.guilds.cache.get(config.guildId)) || client.guilds.cache.first();
    let guildData = null;
    let channelsData = [];
    let rolesData = [];
    if (guild) {
      guildData = {
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL({ dynamic: true, size: 256 }),
        memberCount: guild.memberCount,
        description: guild.description,
        ownerId: guild.ownerId,
      };
      channelsData = guild.channels.cache
        .filter((c) => !c.isDMBased())
        .map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          typeLabel: c.type === 0 ? 'Texte' : c.type === 2 ? 'Vocal' : c.type === 4 ? 'Catégorie' : c.type === 5 ? 'Annonces' : 'Autre',
          parentId: c.parentId,
          position: c.rawPosition,
        }))
        .sort((a, b) => a.position - b.position);
      rolesData = guild.roles.cache
        .map((r) => ({
          id: r.id,
          name: r.name,
          color: `#${r.color.toString(16).padStart(6, '0')}`,
          position: r.position,
          membersCount: r.members.size,
          isManaged: r.managed,
        }))
        .sort((a, b) => b.position - a.position);
    }
    const doc = {
      _id: 'bot_live_status',
      isOnline: true,
      lastHeartbeat: new Date(),
      lastSeen: Date.now(),
      bot: client.user ? {
        id: client.user.id,
        tag: client.user.tag,
        avatar: client.user.displayAvatarURL({ dynamic: true }),
        uptime: process.uptime(),
        ping: client.ws.ping,
      } : null,
      guild: guildData,
      channels: channelsData,
      roles: rolesData,
      mode: 'cloud_relay',
    };
    await col.updateOne(
      { _id: 'bot_live_status' },
      { $set: doc },
      { upsert: true }
    );
  } catch (err) {
    console.debug('[CloudRelay] Erreur écriture heartbeat MongoDB :', err.message);
  }
}
async function processPendingSuggestions(client) {
  try {
    const db = getDb();
    const col = db.collection('suggestions');
    const pendingNew = await col.find({ sync_discord: 'pending' }).limit(5).toArray();
    for (const sugg of pendingNew) {
      try {
        const guildId = sugg.guild_id || config.guildId;
        const guild = client.guilds.cache.get(guildId) || client.guilds.cache.first();
        if (!guild) continue;
        let channelId = await getSuggestionChannelId(guild.id);
        let channel = null;
        if (channelId) {
          channel = guild.channels.cache.get(channelId) || (await guild.channels.fetch(channelId).catch(() => null));
        }
        if (!channel) {
          channel = guild.channels.cache.find(
            (c) => c.type === ChannelType.GuildText && (c.name.includes('suggest') || c.name.includes('demande') || c.name.includes('idee'))
          );
        }
        if (!channel) {
          channel = await guild.channels.create({
            name: '💡︱suggestions',
            type: ChannelType.GuildText,
            topic: '💡 Boîte à suggestions Saez Animes • Synchronisée en temps réel avec le logiciel',
            permissionOverwrites: [
              {
                id: guild.roles.everyone.id,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.ReadMessageHistory,
                  PermissionFlagsBits.SendMessagesInThreads,
                  PermissionFlagsBits.AddReactions,
                  PermissionFlagsBits.AttachFiles,
                  PermissionFlagsBits.EmbedLinks,
                ],
                deny: [
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.CreatePublicThreads,
                  PermissionFlagsBits.CreatePrivateThreads,
                ],
              },
              {
                id: client.user.id,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.EmbedLinks,
                  PermissionFlagsBits.AttachFiles,
                  PermissionFlagsBits.ManageMessages,
                  PermissionFlagsBits.ManageThreads,
                ],
              },
            ],
          });
          await setSuggestionChannelId(guild.id, channel.id);
        }
        if (channel) {
          await ensureSuggestionChannelPermissions(channel);
          const embed = buildSuggestionEmbed(sugg);
          const components = buildSuggestionButtons(sugg);
          const sentMsg = await channel.send({ embeds: [embed], components });
          let threadId = null;
          try {
            const thread = await sentMsg.startThread({
              name: `Discussion : ${(sugg.title || 'Suggestion').slice(0, 80)}`,
              autoArchiveDuration: 1440,
            });
            if (thread) {
              threadId = thread.id;
              await thread.send({
                content: `👋 **Espace de discussion ouvert à tous !**\n` +
                  `N'hésitez pas à donner votre avis ou argumenter sur cette demande d'ajout (**${sugg.title}**).\n` +
                  `*N'oubliez pas de voter 👍 **Pour** ou 👎 **Contre** sur le message ci-dessus !*`,
              }).catch(() => {});
            }
          } catch (tErr) {
            console.debug('[CloudRelay] Fil non créé :', tErr.message);
          }
          await col.updateOne(
            { _id: sugg._id },
            {
              $set: {
                channel_id: channel.id,
                message_id: sentMsg.id,
                thread_id: threadId || sentMsg.id,
                sync_discord: 'synced',
                updated_at: new Date(),
              },
            }
          );
          console.log(`[CloudRelay] ✅ Suggestion #${sugg.sugg_id} publiée sur Discord (${sentMsg.id}) !`);
        }
      } catch (err) {
        console.error(`[CloudRelay] Erreur publication suggestion ${sugg.sugg_id} :`, err);
        await col.updateOne({ _id: sugg._id }, { $set: { sync_discord: 'error', sync_error: err.message } });
      }
    }
    const pendingUpdates = await col.find({ sync_discord: 'update_status' }).limit(5).toArray();
    for (const sugg of pendingUpdates) {
      try {
        if (sugg.channel_id && sugg.message_id) {
          const channel = client.channels.cache.get(sugg.channel_id) || (await client.channels.fetch(sugg.channel_id).catch(() => null));
          if (channel) {
            const msg = await channel.messages.fetch(sugg.message_id).catch(() => null);
            if (msg) {
              const embed = buildSuggestionEmbed(sugg);
              const components = buildSuggestionButtons(sugg);
              await msg.edit({ embeds: [embed], components }).catch(() => {});
              const statusInfo = SUGGESTION_STATUSES[sugg.status] || SUGGESTION_STATUSES.pending;
              let thread = msg.thread || (await channel.threads.fetch(msg.id).catch(() => null));
              if (thread) {
                if (thread.archived) await thread.setArchived(false).catch(() => {});
                await thread.send({
                  content: `📢 **Mise à jour du statut :** La suggestion est passée en **${statusInfo.badge}** par **${sugg.admin_by || 'Staff Saez'}** !` +
                    (sugg.admin_comment ? `\n💬 *« ${sugg.admin_comment} »*` : ''),
                }).catch(() => {});
              }
            }
          }
        }
        await col.updateOne({ _id: sugg._id }, { $set: { sync_discord: 'synced' } });
      } catch (updErr) {
        console.error('[CloudRelay] Erreur mise à jour statut Discord :', updErr);
      }
    }
    const pendingDeletes = await col.find({ sync_discord: 'delete' }).limit(5).toArray();
    for (const sugg of pendingDeletes) {
      try {
        if (sugg.channel_id && sugg.message_id) {
          const channel = client.channels.cache.get(sugg.channel_id) || (await client.channels.fetch(sugg.channel_id).catch(() => null));
          if (channel) {
            const thread = channel.threads.cache.get(sugg.message_id) || (await channel.threads.fetch(sugg.message_id).catch(() => null));
            if (thread) await thread.delete().catch(() => {});
            const msg = await channel.messages.fetch(sugg.message_id).catch(() => null);
            if (msg) await msg.delete().catch(() => {});
          }
        }
        await col.deleteOne({ _id: sugg._id });
        console.log(`[CloudRelay] 🗑️ Suggestion #${sugg.sugg_id} supprimée de Discord et MongoDB.`);
      } catch (delErr) {
        console.error('[CloudRelay] Erreur suppression suggestion :', delErr);
      }
    }
  } catch (err) {
    console.debug('[CloudRelay] Erreur boucle suggestions :', err.message);
  }
}
async function processPendingThreadMessages(client) {
  try {
    const db = getDb();
    const colMsg = db.collection('suggestion_messages');
    const colSugg = db.collection('suggestions');
    const pendingMsgs = await colMsg.find({ pending_discord: true }).limit(10).toArray();
    for (const m of pendingMsgs) {
      try {
        const sugg = await colSugg.findOne({
          $or: [
            { sugg_id: m.suggestion_id },
            { message_id: m.suggestion_id },
            { _id: m.suggestion_id }
          ]
        });
        if (!sugg || !sugg.channel_id || !sugg.message_id) {
          await colMsg.updateOne({ _id: m._id }, { $set: { pending_discord: false, sync_error: 'Suggestion non synchronisée sur Discord' } });
          continue;
        }
        const channel = client.channels.cache.get(sugg.channel_id) || (await client.channels.fetch(sugg.channel_id).catch(() => null));
        if (!channel) continue;
        let thread = client.channels.cache.get(sugg.message_id) || (await client.channels.fetch(sugg.message_id).catch(() => null));
        if (!thread || !thread.isThread()) {
          const msg = await channel.messages.fetch(sugg.message_id).catch(() => null);
          thread = msg?.thread || (await channel.threads.fetch(msg?.id).catch(() => null));
          if (!thread && msg) {
            thread = await msg.startThread({
              name: `Discussion : ${(sugg.title || 'Suggestion').slice(0, 80)}`,
              autoArchiveDuration: 1440,
            }).catch(() => null);
          }
        }
        if (thread) {
          if (thread.archived) await thread.setArchived(false).catch(() => {});
          const authorLabel = m.author?.username || 'Utilisateur Saez';
          const sent = await thread.send({
            content: `💬 **[${authorLabel}]** : ${m.content}`,
          });
          await colMsg.updateOne(
            { _id: m._id },
            {
              $set: {
                pending_discord: false,
                discord_message_id: sent.id,
                sent_at: new Date(),
              },
            }
          );
          console.log(`[CloudRelay] 💬 Message logiciel relayé dans le fil Discord (${sent.id}) !`);
        }
      } catch (relayErr) {
        console.error('[CloudRelay] Erreur relai message fil :', relayErr);
        await colMsg.updateOne({ _id: m._id }, { $set: { pending_discord: false, sync_error: relayErr.message } });
      }
    }
  } catch (err) {
    console.debug('[CloudRelay] Erreur boucle messages fil :', err.message);
  }
}
async function processPendingBotCommands(client) {
  try {
    const db = getDb();
    const colCmd = db.collection('bot_commands');
    const pendingCmds = await colCmd.find({ status: 'pending' }).limit(5).toArray();
    for (const cmd of pendingCmds) {
      try {
        console.log(`[CloudRelay] ⚡ Exécution commande à distance : ${cmd.command}`);
        let result = null;
        if (cmd.command === 'send_message') {
          const { channelId, content, embed } = cmd.payload || {};
          const channel = client.channels.cache.get(channelId) || (await client.channels.fetch(channelId).catch(() => null));
          if (!channel) throw new Error('Salon introuvable');
          const payload = {};
          if (content && content.trim()) payload.content = content.trim();
          if (embed && (embed.title || embed.description)) {
            const eb = new EmbedBuilder();
            if (embed.title) eb.setTitle(embed.title);
            if (embed.description) eb.setDescription(embed.description);
            if (embed.color) {
              const hex = embed.color.replace('#', '');
              eb.setColor(parseInt(hex, 16) || config.colors.primary);
            } else {
              eb.setColor(config.colors.primary);
            }
            if (embed.bannerUrl) eb.setImage(embed.bannerUrl);
            if (embed.thumbnailUrl) eb.setThumbnail(embed.thumbnailUrl);
            if (embed.footer) {
              eb.setFooter({ text: embed.footer, iconURL: config.assets.logoUrl });
            }
            eb.setTimestamp();
            payload.embeds = [eb];
          }
          const sent = await channel.send(payload);
          result = { success: true, messageId: sent.id };
        } else if (cmd.command === 'presence') {
          const { activityType, activityText, status, streamUrl } = cmd.payload || {};
          const { ActivityType } = await import('discord.js');
          let mappedType = ActivityType.Streaming;
          if (activityType === 'playing') mappedType = ActivityType.Playing;
          if (activityType === 'watching') mappedType = ActivityType.Watching;
          if (activityType === 'listening') mappedType = ActivityType.Listening;
          client.user.setPresence({
            status: status || 'online',
            activities: [
              {
                name: activityText || 'Saez Animes',
                type: mappedType,
                url: streamUrl || 'https://twitch.tv/saez924',
              },
            ],
          });
          result = { success: true };
        } else if (cmd.command === 'setup_level_roles') {
          const guild = (config.guildId && client.guilds.cache.get(config.guildId)) || client.guilds.cache.first();
          if (guild) {
            const { autoCreateMilestoneRoles } = await import('./discordLevelService.js');
            result = await autoCreateMilestoneRoles(guild);
          }
        }
        await colCmd.updateOne(
          { _id: cmd._id },
          {
            $set: {
              status: 'completed',
              result: result || { success: true },
              completed_at: new Date(),
            },
          }
        );
      } catch (cmdErr) {
        console.error(`[CloudRelay] Erreur commande ${cmd.command} :`, cmdErr);
        await colCmd.updateOne(
          { _id: cmd._id },
          {
            $set: {
              status: 'error',
              error: cmdErr.message,
              completed_at: new Date(),
            },
          }
        );
      }
    }
  } catch (err) {
    console.debug('[CloudRelay] Erreur boucle commandes :', err.message);
  }
}
export async function recordDiscordThreadMessage(message) {
  if (!message.channel.isThread()) return;
  try {
    const db = getDb();
    const colSugg = db.collection('suggestions');
    const colMsg = db.collection('suggestion_messages');
    const sugg = await colSugg.findOne({
      $or: [
        { message_id: message.channel.id },
        { thread_id: message.channel.id },
        { message_id: message.channel.parentId }
      ]
    });
    if (sugg) {
      await colMsg.insertOne({
        suggestion_id: sugg.sugg_id,
        id: message.id,
        author: {
          id: message.author.id,
          username: message.member?.displayName || message.author.displayName || message.author.username,
          avatar: message.author.displayAvatarURL({ dynamic: true }),
          isBot: message.author.bot,
        },
        content: message.content,
        created_at: message.createdAt.toISOString(),
        source: 'discord',
        pending_discord: false,
      });
      console.log(`[CloudRelay] 📥 Message fil Discord #${sugg.sugg_id} enregistré dans MongoDB Atlas.`);
    }
  } catch (err) {
    console.debug('[CloudRelay] Erreur enregistrement message fil Discord :', err.message);
  }
}
export function startCloudRelayService(client) {
  console.log('[CloudRelay] ☁️ Démarrage de la passerelle Cloud MongoDB Atlas (0 IP requise)...');
  updateBotHeartbeat(client);
  if (relayInterval) clearInterval(relayInterval);
  let heartbeatCounter = 0;
  relayInterval = setInterval(async () => {
    if (isProcessingQueue) return;
    isProcessingQueue = true;
    try {
      heartbeatCounter++;
      if (heartbeatCounter % 5 === 0) {
        await updateBotHeartbeat(client);
      }
      await processPendingSuggestions(client);
      await processPendingThreadMessages(client);
      await processPendingBotCommands(client);
    } catch (err) {
      console.debug('[CloudRelay] Erreur dans la boucle relais :', err.message);
    } finally {
      isProcessingQueue = false;
    }
  }, 3000);
  console.log('[CloudRelay] 🚀 Passerelle Cloud active ! Le bot est maintenant synchronisé partout sans port ni IP publique.');
}
