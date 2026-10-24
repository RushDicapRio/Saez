import { Events, EmbedBuilder } from 'discord.js';
import { sendLog } from '../services/logService.js';
export default {
  name: Events.GuildRoleDelete,
  async execute(role) {
    if (!role.guild) return;
    const embed = new EmbedBuilder()
      .setTitle('🗑️ Rôle Supprimé')
      .setColor(0xef4444)
      .addFields(
        { name: '🏷️ Nom', value: `@${role.name}`, inline: true },
        { name: '🆔 Identifiant', value: `\`${role.id}\``, inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    await sendLog(role.guild, 'channels_roles', embed);
  },
};
