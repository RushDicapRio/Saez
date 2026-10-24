import { Events, EmbedBuilder } from 'discord.js';
import { sendLog } from '../services/logService.js';
export default {
  name: Events.ChannelCreate,
  async execute(channel) {
    if (!channel.guild) return;
    const embed = new EmbedBuilder()
      .setTitle('📁 Salon Créé')
      .setColor(0x10b981)
      .addFields(
        { name: '📍 Nom', value: `${channel.name} (<#${channel.id}>)`, inline: true },
        { name: '🆔 Identifiant', value: `\`${channel.id}\``, inline: true },
        { name: '📂 Catégorie', value: channel.parent ? channel.parent.name : '*Aucune*', inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    await sendLog(channel.guild, 'channels_roles', embed);
  },
};
