import { Events, EmbedBuilder } from 'discord.js';
import { sendLog } from '../services/logService.js';
export default {
  name: Events.MessageDelete,
  async execute(message) {
    if (!message.guild) return;
    if (message.author?.bot) return; 
    const content = message.content ? message.content.slice(0, 1024) : '*[Aucun contenu texte ou message non mis en cache]*';
    const attachments = message.attachments?.size > 0
      ? message.attachments.map((a) => `[${a.name}](${a.url})`).join(', ')
      : null;
    const embed = new EmbedBuilder()
      .setTitle('🗑️ Message Supprimé')
      .setColor(0xef4444)
      .setThumbnail(message.author?.displayAvatarURL ? message.author.displayAvatarURL({ dynamic: true }) : null)
      .addFields(
        { name: '👤 Auteur', value: `${message.author ? message.author.tag : 'Inconnu'} (<@${message.author?.id || 'Inconnu'}>)`, inline: true },
        { name: '📍 Salon', value: `${message.channel} (\`#${message.channel?.name}\`)`, inline: true },
        { name: '💬 Contenu', value: `\`\`\`${content}\`\`\``, inline: false }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (attachments) {
      embed.addFields({ name: '📎 Pièces jointes', value: attachments.slice(0, 1024), inline: false });
    }
    await sendLog(message.guild, 'messages', embed);
  },
};
