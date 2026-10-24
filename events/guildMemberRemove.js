import { Events } from 'discord.js';
import { sendLeaveMessage } from '../services/welcomeService.js';
export default {
  name: Events.GuildMemberRemove,
  async execute(member) {
    console.log(`[Leave] Membre parti : ${member.user?.tag || member.id}`);
    await sendLeaveMessage(member);
    const { sendLog } = await import('../services/logService.js');
    const { EmbedBuilder } = await import('discord.js');
    const roles = member.roles?.cache
      ? member.roles.cache
          .filter((r) => r.id !== member.guild.id)
          .map((r) => `<@&${r.id}>`)
          .join(', ') || 'Aucun rôle'
      : 'Inconnu';
    const embed = new EmbedBuilder()
      .setTitle('📤 Départ d\'un membre')
      .setColor(0xef4444)
      .setThumbnail(member.user?.displayAvatarURL ? member.user.displayAvatarURL({ dynamic: true }) : null)
      .addFields(
        { name: '👤 Membre', value: `${member.user?.tag || 'Inconnu'} (<@${member.id}>)`, inline: true },
        { name: '🆔 Identifiant', value: `\`${member.id}\``, inline: true },
        { name: '🏷️ Rôles possédés', value: roles.slice(0, 1024), inline: false }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    await sendLog(member.guild, 'members', embed);
    const { syncServerStatsChannels } = await import('../services/serverStatsService.js');
    await syncServerStatsChannels(member.guild).catch(() => {});
  },
};
