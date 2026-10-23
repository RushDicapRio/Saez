import http from 'node:http';
import { URL } from 'node:url';
import {
  createSuggestion,
  updateSuggestionStatus,
  deleteSuggestion,
  getSuggestionThreadMessages,
  sendSuggestionThreadMessage,
  getAllSuggestions,
  getSuggestionChannelId,
  setSuggestionChannelId,
  SUGGESTION_STATUSES,
  SUGGESTION_CATEGORIES,
} from './suggestionService.js';
import { config } from '../config.js';
let serverInstance = null;
export function startApiServer(client, port = 4141) {
  if (serverInstance) return serverInstance;
  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }
    const parsedUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
    const pathname = parsedUrl.pathname;
    const readJsonBody = () =>
      new Promise((resolve) => {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch {
            resolve({});
          }
        });
      });
    const sendJson = (statusCode, data) => {
      res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
    };
    try {
      if (pathname === '/api/status' && req.method === 'GET') {
        return sendJson(200, {
          success: true,
          bot: client.user ? { tag: client.user.tag, id: client.user.id } : null,
          uptime: process.uptime(),
          guildId: config.guildId,
        });
      }
      if (pathname === '/api/suggestions' && req.method === 'GET') {
        const statusFilter = parsedUrl.searchParams.get('status');
        const categoryFilter = parsedUrl.searchParams.get('category');
        const filter = {};
        if (statusFilter && statusFilter !== 'all') filter.status = statusFilter;
        if (categoryFilter && categoryFilter !== 'all') filter.category = categoryFilter;
        const suggestions = await getAllSuggestions(filter);
        return sendJson(200, { success: true, suggestions });
      }
      if (pathname === '/api/suggestions' && req.method === 'POST') {
        const body = await readJsonBody();
        const { title, description, category, authorName } = body;
        if (!title || !description) {
          return sendJson(400, { success: false, message: 'Le titre et la description sont obligatoires.' });
        }
        const newSugg = await createSuggestion({
          title,
          description,
          category: category || 'anime',
          author: {
            id: 'software',
            username: authorName || 'Utilisateur Saez',
            avatar: config.assets.logoUrl,
            source: 'software',
          },
          guildId: config.guildId,
          client,
        });
        return sendJson(201, { success: true, suggestion: newSugg });
      }
      if (pathname.match(/^\/api\/suggestions\/[^/]+\/messages$/)) {
        const suggId = pathname.split('/')[3];
        if (req.method === 'GET') {
          const result = await getSuggestionThreadMessages({
            suggestionId: suggId,
            client,
          });
          return sendJson(200, result);
        }
        if (req.method === 'POST') {
          const body = await readJsonBody();
          const { content, authorName } = body;
          const result = await sendSuggestionThreadMessage({
            suggestionId: suggId,
            content,
            authorName,
            client,
          });

          if (!result.success) {
            return sendJson(400, result);
          }
          return sendJson(201, result);
        }
      }
      if (pathname.startsWith('/api/suggestions/') && req.method === 'PATCH') {
        const suggId = pathname.replace('/api/suggestions/', '').split('/')[0];
        const body = await readJsonBody();
        const { status, comment, adminUser } = body;
        if (!status) {
          return sendJson(400, { success: false, message: 'Le statut est obligatoire.' });
        }
        const result = await updateSuggestionStatus({
          suggestionId: suggId,
          status,
          comment,
          adminUser: adminUser || 'Admin Saez',
          client,
        });
        if (!result.success) {
          return sendJson(404, result);
        }
        return sendJson(200, { success: true, suggestion: result.suggestion });
      }
      if (pathname.startsWith('/api/suggestions/') && req.method === 'DELETE') {
        const suggId = pathname.replace('/api/suggestions/', '').split('/')[0];
        const result = await deleteSuggestion({
          suggestionId: suggId,
          client,
        });
        if (!result.success) {
          return sendJson(404, result);
        }
        return sendJson(200, { success: true });
      }
      if (pathname === '/api/suggestions/channel') {
        if (req.method === 'GET') {
          const channelId = await getSuggestionChannelId(config.guildId);
          let channelInfo = null;
          if (channelId && client) {
            const ch = client.channels.cache.get(channelId) || (await client.channels.fetch(channelId).catch(() => null));
            if (ch) {
              channelInfo = { id: ch.id, name: ch.name };
            }
          }
          return sendJson(200, { success: true, channelId, channel: channelInfo });
        }
        if (req.method === 'POST') {
          const body = await readJsonBody();
          const { channelId } = body;
          if (!channelId) {
            return sendJson(400, { success: false, message: 'ID de salon requis.' });
          }
          await setSuggestionChannelId(config.guildId, channelId);
          return sendJson(200, { success: true, channelId });
        }
      }
      if (pathname === '/api/bot/dashboard' && req.method === 'GET') {
        const guild = (config.guildId && client.guilds.cache.get(config.guildId)) || client.guilds.cache.first();
        let guildInfo = null;
        let channelsList = [];
        let rolesList = [];
        if (guild) {
          guildInfo = {
            id: guild.id,
            name: guild.name,
            icon: guild.iconURL({ dynamic: true, size: 256 }),
            memberCount: guild.memberCount,
            description: guild.description,
            ownerId: guild.ownerId,
          };
          channelsList = guild.channels.cache
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
          rolesList = guild.roles.cache
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
        let levelConfig = null;
        let leaderboard = [];
        if (guild) {
          const { getLevelConfig, getGuildLeaderboard } = await import('./discordLevelService.js');
          levelConfig = await getLevelConfig(guild.id);
          leaderboard = await getGuildLeaderboard(guild.id, 10);
        }
        return sendJson(200, {
          success: true,
          bot: client.user ? {
            tag: client.user.tag,
            id: client.user.id,
            avatar: client.user.displayAvatarURL({ dynamic: true }),
            uptime: process.uptime(),
            ping: client.ws.ping,
          } : null,
          guild: guildInfo,
          channels: channelsList,
          roles: rolesList,
          levelConfig,
          leaderboard,
        });
      }
      if (pathname === '/api/bot/send-message' && req.method === 'POST') {
        const body = await readJsonBody();
        const { channelId, content, embed } = body;
        if (!channelId) {
          return sendJson(400, { success: false, message: 'ID de salon requis.' });
        }
        const channel = client.channels.cache.get(channelId) || (await client.channels.fetch(channelId).catch(() => null));
        if (!channel || typeof channel.send !== 'function') {
          return sendJson(404, { success: false, message: 'Salon introuvable ou non accessible en écriture.' });
        }
        const payload = {};
        if (content && typeof content === 'string' && content.trim()) {
          payload.content = content.trim();
        }
        if (embed && (embed.title || embed.description)) {
          const { EmbedBuilder } = await import('discord.js');
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
          } else {
            eb.setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Annonce Officielle', iconURL: config.assets.logoUrl });
          }
          eb.setTimestamp();
          payload.embeds = [eb];
        }
        if (!payload.content && (!payload.embeds || payload.embeds.length === 0)) {
          return sendJson(400, { success: false, message: 'Veuillez saisir un message ou un embed valide.' });
        }
        const sent = await channel.send(payload);
        return sendJson(200, {
          success: true,
          messageId: sent.id,
          channelName: channel.name,
        });
      }
      if (pathname === '/api/bot/presence' && req.method === 'POST') {
        const body = await readJsonBody();
        const { activityType, activityText, status, streamUrl } = body;
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
              url: streamUrl || 'https://twitch.tv/saezanimes',
            },
          ],
        });
        return sendJson(200, { success: true });
      }
      if (pathname === '/api/bot/commands' && req.method === 'GET') {
        const commandsArray = [];
        for (const [name, cmd] of client.commands) {
          const rawOptions = cmd.data?.options || [];
          const formattedOptions = rawOptions.map(opt => ({
            name: opt.name,
            description: opt.description,
            required: !!opt.required,
            type: opt.type,
            options: Array.isArray(opt.options) ? opt.options.map(subOpt => ({
              name: subOpt.name,
              description: subOpt.description,
              required: !!subOpt.required,
            })) : [],
          }));
          commandsArray.push({
            name,
            description: cmd.data?.description || '',
            category: cmd.category || 'général',
            defaultMemberPermissions: cmd.data?.default_member_permissions || null,
            options: formattedOptions,
          });
        }
        return sendJson(200, { success: true, commands: commandsArray });
      }
      if (pathname === '/api/bot/levels/setup-roles' && req.method === 'POST') {
        const guild = (config.guildId && client.guilds.cache.get(config.guildId)) || client.guilds.cache.first();
        if (!guild) {
          return sendJson(404, { success: false, message: 'Serveur Discord introuvable.' });
        }
        const { autoCreateMilestoneRoles } = await import('./discordLevelService.js');
        const res = await autoCreateMilestoneRoles(guild);
        return sendJson(200, res);
      }
      if (pathname === '/api/bot/levels/config' && req.method === 'POST') {
        const guild = (config.guildId && client.guilds.cache.get(config.guildId)) || client.guilds.cache.first();
        if (!guild) {
          return sendJson(404, { success: false, message: 'Serveur Discord introuvable.' });
        }
        const body = await readJsonBody();
        const { saveLevelConfig } = await import('./discordLevelService.js');
        const res = await saveLevelConfig(guild.id, body);
        return sendJson(200, res);
      }
      if (pathname === '/api/bot/levels/leaderboard' && req.method === 'GET') {
        const guild = (config.guildId && client.guilds.cache.get(config.guildId)) || client.guilds.cache.first();
        if (!guild) {
          return sendJson(200, { success: true, leaderboard: [] });
        }
        const limit = parseInt(parsedUrl.searchParams.get('limit') || '15', 10);
        const { getGuildLeaderboard } = await import('./discordLevelService.js');
        const leaderboard = await getGuildLeaderboard(guild.id, limit);
        return sendJson(200, { success: true, leaderboard });
      }
      if (pathname === '/api/bot/logs' && req.method === 'GET') {
        const { getRecentLogs, getLogsConfig, saveLogsConfig } = await import('./discordLogService.js');
        const guild = (config.guildId && client.guilds.cache.get(config.guildId)) || client.guilds.cache.first();
        const limit = parseInt(parsedUrl.searchParams.get('limit') || '60', 10);
        const filterType = parsedUrl.searchParams.get('type') || null;
        const logs = await getRecentLogs(guild?.id, limit, filterType);
        const logsConfig = guild ? await getLogsConfig(guild.id) : null;
        return sendJson(200, { success: true, logs, config: logsConfig });
      }
      if (pathname === '/api/bot/logs/config' && req.method === 'POST') {
        const { saveLogsConfig } = await import('./discordLogService.js');
        const guild = (config.guildId && client.guilds.cache.get(config.guildId)) || client.guilds.cache.first();
        if (!guild) return sendJson(404, { success: false, message: 'Serveur Discord introuvable.' });
        const body = await readJsonBody();
        const res = await saveLogsConfig(guild.id, body);
        return sendJson(200, res);
      }
      if (pathname === '/api/bot/voice/stats' && req.method === 'GET') {
        const { getGlobalVoiceStats, getTempVoiceConfig } = await import('./tempVoiceService.js');
        const guild = (config.guildId && client.guilds.cache.get(config.guildId)) || client.guilds.cache.first();
        const stats = await getGlobalVoiceStats(guild?.id);
        const voiceConfig = guild ? await getTempVoiceConfig(guild.id) : null;
        return sendJson(200, { success: true, stats, config: voiceConfig });
      }
      if (pathname === '/api/bot/voice/setup' && req.method === 'POST') {
        const { saveTempVoiceConfig } = await import('./tempVoiceService.js');
        const guild = (config.guildId && client.guilds.cache.get(config.guildId)) || client.guilds.cache.first();
        if (!guild) return sendJson(404, { success: false, message: 'Serveur Discord introuvable.' });
        const body = await readJsonBody();
        const res = await saveTempVoiceConfig(guild.id, body);
        return sendJson(200, res);
      }
      if (pathname === '/api/bot/economy/leaderboard' && req.method === 'GET') {
        const { getLeaderboardEco } = await import('./economyService.js');
        const guild = (config.guildId && client.guilds.cache.get(config.guildId)) || client.guilds.cache.first();
        const limit = parseInt(parsedUrl.searchParams.get('limit') || '15', 10);
        const rawList = await getLeaderboardEco(guild?.id, limit);
        const list = await Promise.all(
          rawList.map(async (row, idx) => {
            let user = client.users.cache.get(row.user_id);
            if (!user) user = await client.users.fetch(row.user_id).catch(() => null);
            return {
              rank: idx + 1,
              userId: row.user_id,
              username: user?.username || 'Membre Discord',
              avatar: user ? user.displayAvatarURL({ dynamic: true }) : null,
              balance: row.balance || 0,
              bank: row.bank || 0,
              itemsCount: row.inventory?.length || 0,
            };
          })
        );
        return sendJson(200, { success: true, leaderboard: list });
      }
      if (pathname === '/api/bot/economy/adjust' && req.method === 'POST') {
        const { adjustBalance } = await import('./economyService.js');
        const guild = (config.guildId && client.guilds.cache.get(config.guildId)) || client.guilds.cache.first();
        if (!guild) return sendJson(404, { success: false, message: 'Serveur Discord introuvable.' });
        const body = await readJsonBody();
        const { userId, amount } = body;
        if (!userId || typeof amount !== 'number') {
          return sendJson(400, { success: false, message: 'userId et amount requis.' });
        }
        const newBal = await adjustBalance(guild.id, userId, amount);
        return sendJson(200, { success: true, balance: newBal });
      }
      if (pathname === '/api/bot/schedule' && req.method === 'GET') {
        const { getScheduleActivities } = await import('./scheduleActivityService.js');
        const guild = (config.guildId && client.guilds.cache.get(config.guildId)) || client.guilds.cache.first();
        const activities = await getScheduleActivities(guild?.id);
        return sendJson(200, { success: true, activities });
      }
      if (pathname === '/api/bot/schedule' && req.method === 'POST') {
        const { createScheduleActivity } = await import('./scheduleActivityService.js');
        const guild = (config.guildId && client.guilds.cache.get(config.guildId)) || client.guilds.cache.first();
        if (!guild) return sendJson(404, { success: false, message: 'Serveur Discord introuvable.' });
        const body = await readJsonBody();
        const act = await createScheduleActivity({
          guildId: guild.id,
          title: body.title,
          description: body.description,
          date: body.date,
          time: body.time,
          channelId: body.channelId,
          authorId: 'dashboard',
          authorName: 'Gestionnaire Saez',
        });
        return sendJson(200, { success: true, activity: act });
      }
      if (pathname.startsWith('/api/bot/schedule/') && req.method === 'DELETE') {
        const { cancelScheduleActivity } = await import('./scheduleActivityService.js');
        const actId = pathname.replace('/api/bot/schedule/', '');
        const ok = await cancelScheduleActivity(actId);
        return sendJson(200, { success: ok });
      }
      if (pathname === '/api/bot/teams' && req.method === 'GET') {
        const { getTeamsLeaderboard } = await import('./teamService.js');
        const guild = (config.guildId && client.guilds.cache.get(config.guildId)) || client.guilds.cache.first();
        const teams = await getTeamsLeaderboard(guild?.id, 20);
        return sendJson(200, { success: true, teams });
      }
      if (pathname === '/api/bot/leaderboards' && req.method === 'GET') {
        const { getActivityLeaderboard, getQuizLeaderboard, getGiveawayLeaderboard } = await import('./communityLeaderboardService.js');
        const { getTeamsLeaderboard } = await import('./teamService.js');
        const guild = (config.guildId && client.guilds.cache.get(config.guildId)) || client.guilds.cache.first();
        const [activity, quiz, giveaways, teams] = await Promise.all([
          getActivityLeaderboard(guild?.id, 10),
          getQuizLeaderboard(guild?.id, 10),
          getGiveawayLeaderboard(guild?.id, 10),
          getTeamsLeaderboard(guild?.id, 10),
        ]);
        return sendJson(200, {
          success: true,
          leaderboards: { activity, quiz, giveaways, teams },
        });
      }
      if (pathname === '/api/bot/applications' && req.method === 'GET') {
        const { getApplications } = await import('./communityHubService.js');
        const guild = (config.guildId && client.guilds.cache.get(config.guildId)) || client.guilds.cache.first();
        const apps = await getApplications(guild?.id);
        return sendJson(200, { success: true, applications: apps });
      }
      if (pathname === '/api/bot/applications/status' && req.method === 'POST') {
        const { updateApplicationStatus } = await import('./communityHubService.js');
        const body = await readJsonBody();
        const { appId, status, note } = body;
        const ok = await updateApplicationStatus(appId, status, 'dashboard', note);
        return sendJson(200, { success: ok });
      }
      if (pathname === '/api/bot/community-overview' && req.method === 'GET') {
        const { getUpcomingBirthdays, getTopReputation, getCommunityGoals } = await import('./communityHubService.js');
        const guild = (config.guildId && client.guilds.cache.get(config.guildId)) || client.guilds.cache.first();
        const [birthdays, reputations, goals] = await Promise.all([
          getUpcomingBirthdays(guild?.id, 10),
          getTopReputation(guild?.id, 10),
          getCommunityGoals(guild?.id),
        ]);
        return sendJson(200, { success: true, birthdays, reputations, goals });
      }
      if (pathname === '/api/bot/commands' && req.method === 'GET') {
        const commandsList = [];
        const seenNames = new Set();
        if (client && client.commands && client.commands.size > 0) {
          for (const cmd of client.commands.values()) {
            const data = cmd.data || {};
            const cmdName = data.name || 'inconnu';
            seenNames.add(cmdName);
            const options = Array.isArray(data.options)
              ? data.options.map((opt) => ({
                  name: opt.name,
                  description: opt.description || '',
                  required: !!opt.required,
                }))
              : [];
            commandsList.push({
              name: cmdName,
              description: data.description || '',
              category: cmd.category || 'Général',
              options,
            });
          }
        }
        try {
          const { CATEGORIES_CONFIG } = await import('../commands/serveur/help.js');
          if (CATEGORIES_CONFIG) {
            for (const [catKey, catVal] of Object.entries(CATEGORIES_CONFIG)) {
              for (const cmd of catVal.commands || []) {
                const cleanName = cmd.name.replace(/^\//, '').split(' ')[0];
                if (!seenNames.has(cleanName)) {
                  seenNames.add(cleanName);
                  commandsList.push({
                    name: cleanName,
                    description: cmd.desc,
                    category: catVal.label || catKey,
                    options: [],
                  });
                }
              }
            }
          }
        } catch (e) {
          console.warn('[API Server] Note: CATEGORIES_CONFIG non chargé :', e.message);
        }
        return sendJson(200, { success: true, commands: commandsList });
      }
      return sendJson(404, { success: false, message: 'Route introuvable' });
    } catch (err) {
      console.error('[API Server] Erreur :', err);
      return sendJson(500, { success: false, message: err.message });
    }
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[API Server] ⚠️ Le port ${port} est déjà utilisé par une instance active du bot. La passerelle reste opérationnelle.`);
    } else {
      console.error('[API Server] Erreur serveur :', err);
    }
  });
  server.listen(port, '0.0.0.0', () => {
    console.log(`[API Server] 🚀 Passerelle active sur http://0.0.0.0:${port} (Accessible localement et à distance via VPS) !`);
  });
  serverInstance = server;
  return server;
}
