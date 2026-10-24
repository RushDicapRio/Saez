import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { getDb } from '../database/mongo.js';
import { config } from '../config.js';
const executionCooldowns = new Map();
const activeAlerts = new Map();
export const AUTOMATION_TEMPLATES = [
  {
    id: 'tpl_welcome_dm',
    name: 'Message de bienvenue en privé',
    description: 'Envoie un message d\'accueil chaleureux en MP lorsqu\'un nouveau membre rejoint le serveur.',
    trigger: { type: 'member_join' },
    conditions: { logic: 'AND', rules: [] },
    actions: [
      {
        type: 'send_dm',
        message: 'Bienvenue sur **{server}**, {user} ! N\'hésite pas à lire les règles et à choisir tes rôles dans les salons dédiés. Bon visionnage sur Saez Animes ! ✨',
      },
    ],
  },
  {
    id: 'tpl_role_guide',
    name: 'Guide automatique à l\'obtention du rôle VIP',
    description: 'Transmet les instructions d\'accès dès qu\'un membre reçoit un rôle spécifique.',
    trigger: { type: 'role_assigned', role_name: 'VIP' },
    conditions: { logic: 'AND', rules: [] },
    actions: [
      {
        type: 'send_dm',
        message: 'Félicitations {user} ! Tu as reçu le rôle **{role}** sur **{server}**. Tu as désormais accès aux avant-premières et au salon privé ! 🎉',
      },
    ],
  },
  {
    id: 'tpl_auto_faq',
    name: 'Réponse FAQ : Comment installer Saez Animes',
    description: 'Répond instantanément dès qu\'un membre demande comment installer ou mettre à jour le logiciel.',
    trigger: { type: 'keyword', match_type: 'partial', keyword: 'comment installer' },
    conditions: { logic: 'AND', rules: [] },
    actions: [
      {
        type: 'send_message',
        message: 'Bonjour {user} ! Pour installer ou mettre à jour **Saez Animes**, rends-toi sur notre site officiel ou consulte le salon <#1210641679074463754>. Une vidéo d\'installation pas à pas y est disponible ! 💻✨',
      },
      {
        type: 'add_reaction',
        emoji: '📥',
      },
    ],
  },
  {
    id: 'tpl_staff_alert',
    name: 'Alerte d\'assistance urgente pour le staff',
    description: 'Alerte les modérateurs avec demande d\'acquittement si quelqu\'un utilise le mot-clé !urgent.',
    trigger: { type: 'keyword', match_type: 'partial', keyword: '!urgent' },
    conditions: { logic: 'AND', rules: [] },
    actions: [
      {
        type: 'trigger_alert',
        title: '🚨 Demande d\'Assistance Urgente',
        message: 'Le membre {user} a déclenché une alerte prioritaire dans le salon {channel} !',
        priority: 'Haute',
      },
    ],
  },
  {
    id: 'tpl_voice_greeting',
    name: 'Salutation à l\'entrée en vocal',
    description: 'Notifie textuellement l\'arrivée d\'un membre dans un salon vocal actif.',
    trigger: { type: 'voice_join' },
    conditions: { logic: 'AND', rules: [] },
    actions: [
      {
        type: 'send_message',
        message: '🎙️ {user} vient de rejoindre le vocal **{channel}** ! Bienvenue !',
      },
    ],
  },
];
export function resolveVariables(text, context = {}) {
  if (!text || typeof text !== 'string') return '';
  const { member, user, guild, channel, role, customVars = {} } = context;
  const targetUser = user || member?.user;
  const now = new Date();
  const replacements = {
    '{user}': targetUser ? `<@${targetUser.id}>` : '@Membre',
    '{userName}': targetUser?.username || 'Membre',
    '{username}': targetUser?.username || 'Membre',
    '{userTag}': targetUser?.tag || targetUser?.username || 'Membre#0000',
    '{userId}': targetUser?.id || '',
    '{server}': guild?.name || 'Saez Animes',
    '{guildName}': guild?.name || 'Saez Animes',
    '{serverId}': guild?.id || '',
    '{channel}': channel ? `<#${channel.id}>` : '#salon',
    '{channelName}': channel?.name || 'salon',
    '{memberCount}': guild?.memberCount ? String(guild.memberCount) : '1',
    '{role}': role ? (typeof role === 'string' ? role : `<@&${role.id || role}>`) : '@Rôle',
    '{date}': now.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' }),
    '{time}': now.toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }),
  };
  for (const [k, v] of Object.entries(customVars)) {
    replacements[`{${k}}`] = String(v);
  }
  let resolved = text;
  for (const [key, val] of Object.entries(replacements)) {
    resolved = resolved.replaceAll(key, val);
  }
  return resolved;
}
export function evaluateConditions(conditionGroup, context = {}) {
  if (!conditionGroup || !Array.isArray(conditionGroup.rules) || conditionGroup.rules.length === 0) {
    return true;
  }
  const { logic = 'AND', rules } = conditionGroup;
  const { member, channel, message } = context;
  const results = rules.map((rule) => {
    switch (rule.type) {
      case 'has_role':
        return Boolean(member?.roles?.cache?.has(rule.role_id));
      case 'lacks_role':
        return !member?.roles?.cache?.has(rule.role_id);
      case 'in_channel':
        return channel?.id === rule.channel_id;
      case 'not_in_channel':
        return channel?.id !== rule.channel_id;
      case 'message_contains':
        return message?.content ? message.content.toLowerCase().includes(rule.text.toLowerCase()) : false;
      default:
        return true;
    }
  });
  if (logic === 'OR') {
    return results.some(Boolean);
  }
  return results.every(Boolean);
}
export async function executeAutomation(automation, context = {}, isDryRun = false) {
  const startTime = Date.now();
  const execId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const actionReports = [];
  if (!automation.enabled) {
    return { success: false, reason: 'AUTOMATION_DISABLED', execId };
  }
  if (automation.paused) {
    return { success: false, reason: 'AUTOMATION_PAUSED', execId };
  }
  const cooldownKey = `${automation._id || automation.id}:${context.guild?.id || ''}`;
  const now = Date.now();
  const cooldownMs = (automation.cooldown_seconds || 3) * 1000;
  const lastRun = executionCooldowns.get(cooldownKey) || 0;
  if (now - lastRun < cooldownMs) {
    return { success: false, reason: 'COOLDOWN_ACTIVE', execId };
  }
  executionCooldowns.set(cooldownKey, now);
  const conditionsMet = evaluateConditions(automation.conditions, context);
  if (!conditionsMet) {
    await recordExecutionLog({
      execId,
      guildId: context.guild?.id,
      automationId: automation.id || String(automation._id),
      automationName: automation.name || 'Sans nom',
      status: 'SKIPPED_CONDITIONS',
      isDryRun,
      durationMs: Date.now() - startTime,
      actions: [],
    });
    return { success: false, reason: 'CONDITIONS_NOT_MET', execId };
  }
  let overallSuccess = true;
  const actions = automation.actions || [];
  for (let i = 0; i < actions.length; i++) {
    const act = actions[i];
    const report = { index: i, type: act.type, success: true };
    try {
      if (isDryRun) {
        report.simulation = true;
        report.details = `[Simulation] Action ${act.type} validée sans effet secondaire.`;
        actionReports.push(report);
        continue;
      }
      switch (act.type) {
        case 'send_message': {
          const targetChan = act.channel_id
            ? context.guild?.channels?.cache?.get(act.channel_id) || context.channel
            : context.channel;
          if (targetChan && typeof targetChan.send === 'function') {
            const resolvedText = resolveVariables(act.message, context);
            await targetChan.send({ content: resolvedText });
            report.details = `Message envoyé dans #${targetChan.name}`;
          } else {
            throw new Error('Salon introuvable ou inaccessible');
          }
          break;
        }
        case 'send_dm': {
          const targetUser = context.user || context.member?.user;
          if (targetUser) {
            const resolvedText = resolveVariables(act.message, context);
            await targetUser.send({ content: resolvedText }).catch((dmErr) => {
              throw new Error(`Échec envoi DM (${dmErr.message})`);
            });
            report.details = `Message privé transmis à @${targetUser.username}`;
          }
          break;
        }
        case 'add_role': {
          if (context.member && act.role_id) {
            await context.member.roles.add(act.role_id, 'Automatisation Saez').catch((rErr) => {
              throw new Error(`Permission refusée pour ajouter le rôle : ${rErr.message}`);
            });
            report.details = `Rôle ${act.role_id} attribué à ${context.member.user.username}`;
          }
          break;
        }
        case 'remove_role': {
          if (context.member && act.role_id) {
            await context.member.roles.remove(act.role_id, 'Automatisation Saez').catch((rErr) => {
              throw new Error(`Permission refusée pour retirer le rôle : ${rErr.message}`);
            });
            report.details = `Rôle ${act.role_id} retiré de ${context.member.user.username}`;
          }
          break;
        }
        case 'add_reaction': {
          if (context.message && act.emoji) {
            await context.message.react(act.emoji).catch(() => {});
            report.details = `Réaction ${act.emoji} ajoutée`;
          }
          break;
        }
        case 'trigger_alert': {
          const alertReport = await triggerOrchestralAlert({
            guild: context.guild,
            channel: context.channel,
            title: resolveVariables(act.title || 'Alerte Système', context),
            message: resolveVariables(act.message, context),
            priority: act.priority || 'Moyenne',
            targetRoleId: act.target_role_id,
          });
          report.details = `Alerte déclenchée (ID: ${alertReport.alertId})`;
          break;
        }
        case 'wait_delay': {
          const delaySec = Math.min(Math.max(Number(act.seconds) || 1, 1), 60);
          await new Promise((res) => setTimeout(res, delaySec * 1000));
          report.details = `Pause de ${delaySec} seconde(s) respectée`;
          break;
        }
        default:
          report.details = `Action inconnue : ${act.type}`;
      }
    } catch (actErr) {
      report.success = false;
      report.error = actErr.message;
      overallSuccess = false;
    }
    actionReports.push(report);
    if (!overallSuccess && !act.continue_on_error) {
      break; 
    }
  }
  const durationMs = Date.now() - startTime;
  await recordExecutionLog({
    execId,
    guildId: context.guild?.id,
    automationId: automation.id || String(automation._id),
    automationName: automation.name || 'Sans nom',
    status: overallSuccess ? 'SUCCESS' : 'FAILED',
    isDryRun,
    durationMs,
    actions: actionReports,
  });
  try {
    const db = getDb();
    if (db && !isDryRun) {
      await db.collection('bot_automations').updateOne(
        { _id: automation._id },
        {
          $inc: { execution_count: 1, failure_count: overallSuccess ? 0 : 1 },
          $set: { last_triggered_at: new Date() },
        }
      );
    }
  } catch {}
  return {
    success: overallSuccess,
    execId,
    durationMs,
    isDryRun,
    actions: actionReports,
  };
}
export async function triggerOrchestralAlert({ guild, channel, title, message, priority = 'Moyenne', targetRoleId = null }) {
  const alertId = `alert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const colors = {
    Basse: 0x3b82f6,
    Moyenne: 0xf59e0b,
    Haute: 0xf97316,
    Critique: 0xef4444,
  };
  const embed = new EmbedBuilder()
    .setTitle(`🚨 [Alerte ${priority}] ${title}`)
    .setDescription(
      `${message}\n\n` +
      `• **Priorité :** \`${priority}\`\n` +
      `• **Statut :** ⏳ *En attente d'acquittement par le staff*\n` +
      `• **Identifiant :** \`${alertId}\``
    )
    .setColor(colors[priority] || colors.Moyenne)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Système d\'Alerte Orchestré • Saez Automation' })
    .setTimestamp();
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`alert_ack_${alertId}`)
      .setLabel('✅ Acquitter & Prendre en charge')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`alert_mute_${alertId}`)
      .setLabel('🔇 Mettre en sourdine')
      .setStyle(ButtonStyle.Secondary)
  );
  const content = targetRoleId ? `<@&${targetRoleId}>` : undefined;
  const sentMsg = await channel.send({ content, embeds: [embed], components: [row] }).catch(() => null);
  const alertData = {
    alertId,
    guildId: guild?.id,
    channelId: channel?.id,
    messageId: sentMsg?.id,
    title,
    message,
    priority,
    status: 'PENDING',
    createdAt: new Date(),
    acknowledgedBy: null,
  };
  activeAlerts.set(alertId, alertData);
  try {
    const db = getDb();
    if (db) {
      await db.collection('bot_alerts').insertOne(alertData);
    }
  } catch {}
  return { alertId, success: Boolean(sentMsg) };
}
export async function acknowledgeAlert(alertId, user) {
  const alert = activeAlerts.get(alertId);
  if (alert) {
    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedBy = user.id;
    alert.acknowledgedAt = new Date();
  }
  try {
    const db = getDb();
    if (db) {
      await db.collection('bot_alerts').updateOne(
        { alertId },
        {
          $set: {
            status: 'ACKNOWLEDGED',
            acknowledged_by: user.id,
            acknowledged_by_tag: user.tag || user.username,
            acknowledged_at: new Date(),
          },
        }
      );
    }
  } catch {}
  return true;
}
export async function getList(guildId, name) {
  try {
    const db = getDb();
    if (!db) return null;
    return await db.collection('bot_lists').findOne({ guild_id: guildId, name: name.toLowerCase() });
  } catch {
    return null;
  }
}
export async function saveList(guildId, arg2, arg3) {
  try {
    const db = getDb();
    if (!db) return false;
    let listName = '';
    let listData = {};
    if (typeof arg2 === 'string') {
      listName = arg2.toLowerCase();
      listData = arg3 || {};
    } else if (arg2 && typeof arg2 === 'object') {
      listName = (arg2.name || '').toLowerCase();
      listData = arg2;
    }
    if (!listName) return false;
    await db.collection('bot_lists').updateOne(
      { guild_id: guildId, name: listName },
      {
        $set: {
          guild_id: guildId,
          name: listName,
          ...listData,
          updated_at: new Date(),
        },
      },
      { upsert: true }
    );
    return true;
  } catch (err) {
    console.error('[AutomationService] Erreur saveList:', err.message);
    return false;
  }
}
export async function deleteList(guildId, name) {
  try {
    const db = getDb();
    if (!db) return false;
    const res = await db.collection('bot_lists').deleteOne({ guild_id: guildId, name: name.toLowerCase() });
    return res.deletedCount > 0;
  } catch {
    return false;
  }
}
export async function recordExecutionLog(logData) {
  try {
    const db = getDb();
    if (!db) return;
    await db.collection('automation_logs').insertOne({
      ...logData,
      timestamp: new Date(),
    });
  } catch {}
}
export async function getAutomationLogs(guildId, automationId = null, limit = 10) {
  try {
    const db = getDb();
    if (!db) return [];
    const query = { guildId };
    if (automationId) query.automationId = automationId;
    return await db.collection('automation_logs')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  } catch {
    return [];
  }
}
export async function cleanOldLogs(guildId, daysToKeep = 30) {
  try {
    const db = getDb();
    if (!db) return 0;
    const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const res = await db.collection('automation_logs').deleteMany({
      guildId,
      timestamp: { $lt: cutoff },
    });
    return res.deletedCount;
  } catch {
    return 0;
  }
}
export async function handleMessageAutomation(message) {
  if (!message.guild || message.author.bot) return false;
  try {
    const db = getDb();
    if (!db) return false;
    const guildId = message.guild.id;
    const content = message.content.toLowerCase().trim();
    const rules = await db.collection('bot_automations')
      .find({
        guild_id: guildId,
        enabled: { $ne: false },
        paused: { $ne: true },
        $or: [
          { type: 'auto_reply' },
          { 'trigger.type': 'keyword' },
          { 'trigger.type': 'regex' },
        ],
      })
      .sort({ priority: -1 })
      .toArray();
    if (rules.length === 0) return false;
    const context = {
      guild: message.guild,
      channel: message.channel,
      user: message.author,
      member: message.member,
      message,
    };
    for (const rule of rules) {
      let matched = false;
      if (rule.type === 'auto_reply' && rule.trigger) {
        if (content.includes(rule.trigger.toLowerCase())) {
          matched = true;
          const replyText = resolveVariables(rule.reply, context);
          await message.channel.send({ content: replyText });
          return true;
        }
      }
      const trig = rule.trigger || {};
      if (trig.type === 'keyword') {
        const kw = (trig.keyword || '').toLowerCase();
        if (trig.match_type === 'exact' && content === kw) matched = true;
        else if (trig.match_type === 'partial' && content.includes(kw)) matched = true;
        else if (content.includes(kw)) matched = true;
      } else if (trig.type === 'regex' && trig.pattern) {
        try {
          const reg = new RegExp(trig.pattern, trig.flags || 'i');
          if (reg.test(message.content)) matched = true;
        } catch {}
      }
      if (matched) {
        await executeAutomation(rule, context);
        return true;
      }
    }
  } catch (err) {
    console.error('[AutomationService] Erreur handleMessageAutomation:', err.message);
  }
  return false;
}
export async function handleRoleUpdateAutomation(oldMember, newMember, addedRoles) {
  if (!newMember.guild || addedRoles.size === 0) return;
  try {
    const db = getDb();
    if (!db) return;
    const guildId = newMember.guild.id;
    const addedRoleIds = Array.from(addedRoles.keys());
    const legacyRules = await db.collection('bot_automations')
      .find({
        guild_id: guildId,
        type: 'role_dm',
        role_id: { $in: addedRoleIds },
      })
      .toArray();
    for (const r of legacyRules) {
      const msg = resolveVariables(r.message, { member: newMember, guild: newMember.guild, role: r.role_name || r.role_id });
      await newMember.send({ content: msg }).catch(() => {});
    }
    const automations = await db.collection('bot_automations')
      .find({
        guild_id: guildId,
        enabled: { $ne: false },
        paused: { $ne: true },
        'trigger.type': 'role_assigned',
        'trigger.role_id': { $in: addedRoleIds },
      })
      .toArray();
    for (const auto of automations) {
      const matchedRole = addedRoles.get(auto.trigger.role_id);
      await executeAutomation(auto, {
        guild: newMember.guild,
        member: newMember,
        user: newMember.user,
        role: matchedRole,
      });
    }
  } catch (err) {
    console.error('[AutomationService] Erreur handleRoleUpdateAutomation:', err.message);
  }
}
