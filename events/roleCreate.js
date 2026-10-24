import { Events, EmbedBuilder } from 'discord.js';
import { sendLog } from '../services/logService.js';
export default {
  name: Events.GuildRoleCreate,
  async execute(role) {
    if (!role.guild) return;
    const embed = new EmbedBuilder()
      .setTitle('🛡️ Nouveau Rôle Créé')
      .setColor(role.color || 0x10b981)
      .addFields(
        { name: '🏷️ Nom', value: `${role.name} (<@&${role.id}>)`, inline: true },
        { name: '🆔 Identifiant', value: `\`${role.id}\``, inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    await sendLog(role.guild, 'channels_roles', embed);
  },
};
