import { Events, EmbedBuilder } from 'discord.js';
import { sendLog } from '../services/logService.js';
export default {
  name: Events.GuildMemberUpdate,
  async execute(oldMember, newMember) {
    if (!newMember.guild) return;
    if (oldMember.nickname !== newMember.nickname) {
      const embed = new EmbedBuilder()
        .setTitle('🏷️ Surnom Modifié')
        .setColor(0x3b82f6)
        .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '👤 Membre', value: `${newMember.user.tag} (<@${newMember.id}>)`, inline: true },
          { name: '⬅️ Ancien surnom', value: oldMember.nickname || '*Aucun*', inline: true },
          { name: '➡️ Nouveau surnom', value: newMember.nickname || '*Aucun*', inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      await sendLog(newMember.guild, 'members', embed);
      const { recordLog } = await import('../services/discordLogService.js');
      await recordLog({
        client: newMember.client,
        guildId: newMember.guild.id,
        type: 'MEMBER',
        action: 'Surnom Modifié',
        user: newMember.user,
        details: `Surnom : "${oldMember.nickname || 'Aucun'}" ➔ "${newMember.nickname || 'Aucun'}"`,
        status: 'INFO',
      }).catch(() => {});
    }
    const addedRoles = newMember.roles.cache.filter((r) => !oldMember.roles.cache.has(r.id));
    const removedRoles = oldMember.roles.cache.filter((r) => !newMember.roles.cache.has(r.id));
    if (addedRoles.size > 0 || removedRoles.size > 0) {
      const embed = new EmbedBuilder()
        .setTitle('🛡️ Mise à jour des Rôles')
        .setColor(addedRoles.size > 0 ? 0x10b981 : 0xf59e0b)
        .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
        .addFields({ name: '👤 Membre', value: `${newMember.user.tag} (<@${newMember.id}>)`, inline: false })
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (addedRoles.size > 0) {
        embed.addFields({
          name: '➕ Rôle(s) Ajouté(s)',
          value: addedRoles.map((r) => `<@&${r.id}>`).join(', '),
          inline: true,
        });
      }
      if (removedRoles.size > 0) {
        embed.addFields({
          name: '➖ Rôle(s) Retiré(s)',
          value: removedRoles.map((r) => `<@&${r.id}>`).join(', '),
          inline: true,
        });
      }
      await sendLog(newMember.guild, 'members', embed);
      const { recordLog } = await import('../services/discordLogService.js');
      const roleDetails = [
        addedRoles.size > 0 ? `+ ${addedRoles.map((r) => r.name).join(', ')}` : '',
        removedRoles.size > 0 ? `- ${removedRoles.map((r) => r.name).join(', ')}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      await recordLog({
        client: newMember.client,
        guildId: newMember.guild.id,
        type: 'ROLE',
        action: addedRoles.size > 0 && removedRoles.size > 0 ? 'Modification de Rôles' : addedRoles.size > 0 ? 'Rôle(s) Attribué(s)' : 'Rôle(s) Retiré(s)',
        user: newMember.user,
        details: roleDetails,
        status: 'INFO',
      }).catch(() => {});
      if (addedRoles.size > 0) {
        try {
          const { handleRoleUpdateAutomation } = await import('../services/automationService.js');
          await handleRoleUpdateAutomation(oldMember, newMember, addedRoles);
        } catch (autoErr) {
          console.warn('[Automation] Erreur traitement rôle update :', autoErr.message);
        }
      }
    }
  },
};
