import { Events, PermissionFlagsBits } from 'discord.js';
import {
  getSecurityConfig,
  checkBlacklistedWord,
  checkLink,
  sendSecurityAlert,
} from '../services/securityService.js';
import { config } from '../config.js';
export default {
  name: Events.MessageUpdate,
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (newMessage.member?.permissions.has(PermissionFlagsBits.Administrator)) return;
    if (!newMessage.content) return;
    const cfg = await getSecurityConfig();
    if (cfg.word_filter?.enabled) {
      const detectedWord = checkBlacklistedWord(newMessage.content, cfg.word_filter.custom_words);
      if (detectedWord) {
        await newMessage.delete().catch(() => {});
        const warnMsg = await newMessage.channel
          .send({
            content: `🛡️ ${newMessage.author}, votre message modifié a été supprimé car il contient des propos interdits.`,
          })
          .catch(() => null);
        if (warnMsg) setTimeout(() => warnMsg.delete().catch(() => {}), 6000);
        await sendSecurityAlert(
          newMessage.guild,
          'Message Modifié Supprimé (Propos Interdits)',
          `Un message modifié par ${newMessage.author} a été supprimé pour propos haineux ou insultes.`,
          [
            { name: '👤 Auteur', value: `${newMessage.author.tag} (${newMessage.author.id})`, inline: true },
            { name: '📍 Salon', value: `${newMessage.channel}`, inline: true },
            { name: '🚫 Mot détecté', value: `\`${detectedWord}\``, inline: true },
            { name: '💬 Contenu', value: `\`\`\`${newMessage.content.slice(0, 1000)}\`\`\``, inline: false },
          ],
          config.colors.accent
        );
        return;
      }
    }
    if (cfg.antilink?.enabled) {
      const linkType = checkLink(
        newMessage.content,
        !cfg.antilink.block_discord_invites,
        cfg.antilink.block_all_links
      );
      if (linkType) {
        await newMessage.delete().catch(() => {});
        const warnMsg = await newMessage.channel
          .send({
            content: `🚫 ${newMessage.author}, les invitations Discord et liens publicitaires ne sont pas autorisés ici (même par modification de message).`,
          })
          .catch(() => null);
        if (warnMsg) setTimeout(() => warnMsg.delete().catch(() => {}), 6000);
        await sendSecurityAlert(
          newMessage.guild,
          'Lien Non Autorisé Supprimé (Message Modifié)',
          `Un message modifié contenant une invitation ou un lien publicitaire a été bloqué.`,
          [
            { name: '👤 Auteur', value: `${newMessage.author.tag} (${newMessage.author.id})`, inline: true },
            { name: '📍 Salon', value: `${newMessage.channel}`, inline: true },
            { name: '💬 Message', value: `\`\`\`${newMessage.content.slice(0, 500)}\`\`\``, inline: false },
          ],
          config.colors.warning
        );
        return;
      }
    }
    if (oldMessage.content && newMessage.content && oldMessage.content !== newMessage.content) {
      const { sendLog } = await import('../services/logService.js');
      const { EmbedBuilder } = await import('discord.js');
      const embed = new EmbedBuilder()
        .setTitle('✏️ Message Modifié')
        .setColor(0x3b82f6)
        .setThumbnail(newMessage.author?.displayAvatarURL ? newMessage.author.displayAvatarURL({ dynamic: true }) : null)
        .addFields(
          { name: '👤 Auteur', value: `${newMessage.author.tag} (<@${newMessage.author.id}>)`, inline: true },
          { name: '📍 Salon', value: `${newMessage.channel} ([Aller au message](${newMessage.url}))`, inline: true },
          { name: '⬅️ Avant', value: `\`\`\`${oldMessage.content.slice(0, 1000)}\`\`\``, inline: false },
          { name: '➡️ Après', value: `\`\`\`${newMessage.content.slice(0, 1000)}\`\`\``, inline: false }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      await sendLog(newMessage.guild, 'messages', embed);
    }
  },
};
