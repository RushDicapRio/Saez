import { Events, PermissionFlagsBits } from 'discord.js';
import {
  getSecurityConfig,
  checkBlacklistedWord,
  checkSpam,
  checkLink,
  sendSecurityAlert,
} from '../services/securityService.js';
import { config } from '../config.js';
export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.guild || message.author.bot) return;
    try {
      const { handleTicketStaffPing } = await import('../services/ticketService.js');
      const pingHandled = await handleTicketStaffPing(message);
      if (pingHandled) return;
    } catch (ticketPingErr) {
      console.warn('[TicketPing] Erreur vérification mention staff :', ticketPingErr.message);
    }
    try {
      const { handleMessageAutomation } = await import('../services/automationService.js');
      const autoHandled = await handleMessageAutomation(message);
      if (autoHandled) return;
    } catch (autoErr) {
      console.warn('[Automation] Erreur traitement message :', autoErr.message);
    }
    try {
      const { handleCountingMessage } = await import('../services/countingService.js');
      const countingHandled = await handleCountingMessage(message);
      if (countingHandled) {
      }
    } catch (countErr) {
      console.warn('[Counting] Erreur traitement message :', countErr.message);
    }
    if (message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;
    const cfg = await getSecurityConfig();
    if (cfg.word_filter?.enabled) {
      const detectedWord = checkBlacklistedWord(message.content, cfg.word_filter.custom_words);
      if (detectedWord) {
        await message.delete().catch(() => {});
        const warnMsg = await message.channel
          .send({
            content: `🛡️ ${message.author}, votre message a été supprimé car il contient des propos interdits (insultes, racisme ou homophobie strictement prohibés).`,
          })
          .catch(() => null);
        if (warnMsg) {
          setTimeout(() => warnMsg.delete().catch(() => {}), 6000);
        }
        await sendSecurityAlert(
          message.guild,
          'Message Supprimé (Propos Interdits)',
          `Un message envoyé par ${message.author} a été supprimé pour propos haineux ou insultes.`,
          [
            { name: '👤 Auteur', value: `${message.author.tag} (${message.author.id})`, inline: true },
            { name: '📍 Salon', value: `${message.channel}`, inline: true },
            { name: '🚫 Mot détecté', value: `\`${detectedWord}\``, inline: true },
            { name: '💬 Contenu du message', value: `\`\`\`${message.content.slice(0, 1000)}\`\`\``, inline: false },
          ],
          config.colors.accent
        );
        return;
      }
    }
    if (cfg.antispam?.enabled) {
      const isSpamming = checkSpam(
        message.author.id,
        cfg.antispam.max_messages || 5,
        cfg.antispam.window_seconds || 4
      );
      if (isSpamming) {
        await message.delete().catch(() => {});
        const timeoutMs = (cfg.antispam.timeout_minutes || 5) * 60 * 1000;
        await message.member?.timeout(timeoutMs, 'Anti-spam automatique Saez').catch(() => {});
        const warnMsg = await message.channel
          .send({
            content: `🛑 ${message.author} a été exclu temporairement pendant **${cfg.antispam.timeout_minutes} minute(s)** pour spam/flood.`,
          })
          .catch(() => null);
        if (warnMsg) {
          setTimeout(() => warnMsg.delete().catch(() => {}), 7000);
        }
        await sendSecurityAlert(
          message.guild,
          'Sanction Anti-Spam / Flood',
          `${message.author} a été sanctionné pour envoi excessif de messages répétés.`,
          [
            { name: '👤 Membre', value: `${message.author.tag} (${message.author.id})`, inline: true },
            { name: '📍 Salon', value: `${message.channel}`, inline: true },
            { name: '⏳ Sanction', value: `Timeout de ${cfg.antispam.timeout_minutes} minute(s)`, inline: true },
          ],
          config.colors.warning
        );
        return;
      }
    }
    if (cfg.antilink?.enabled) {
      const linkType = checkLink(
        message.content,
        !cfg.antilink.block_discord_invites,
        cfg.antilink.block_all_links
      );
      if (linkType) {
        await message.delete().catch(() => {});
        const warnMsg = await message.channel
          .send({
            content: `🚫 ${message.author}, les invitations Discord et liens publicitaires ne sont pas autorisés ici.`,
          })
          .catch(() => null);
        if (warnMsg) {
          setTimeout(() => warnMsg.delete().catch(() => {}), 6000);
        }
        await sendSecurityAlert(
          message.guild,
          'Lien Non Autorisé Supprimé',
          `Un lien publicitaire ou invitation a été bloqué.`,
          [
            { name: '👤 Auteur', value: `${message.author.tag} (${message.author.id})`, inline: true },
            { name: '📍 Salon', value: `${message.channel}`, inline: true },
            { name: '💬 Message', value: `\`\`\`${message.content.slice(0, 500)}\`\`\``, inline: false },
          ],
          config.colors.warning
        );
      }
    }
    try {
      const { handleMessageXp } = await import('../services/discordLevelService.js');
      await handleMessageXp(message, message.client);
    } catch (xpErr) {
      console.warn('[MessageXP] Erreur attribution XP :', xpErr.message);
    }
  },
};
