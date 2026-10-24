import { Events, EmbedBuilder } from 'discord.js';
import { sendLog } from '../services/logService.js';
export default {
  name: Events.ChannelDelete,
  async execute(channel) {
    if (!channel.guild) return;
    const embed = new EmbedBuilder()
      .setTitle('🗑️ Salon Supprimé')
      .setColor(0xef4444)
      .addFields(
        { name: '📍 Nom', value: `#${channel.name}`, inline: true },
        { name: '🆔 Identifiant', value: `\`${channel.id}\``, inline: true },
        { name: '📂 Type', value: `${channel.type}`, inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    await sendLog(channel.guild, 'channels_roles', embed);
  },
};
