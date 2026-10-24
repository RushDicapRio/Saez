import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { getGuildQueue, canControlMusic } from '../../services/musicService.js';
export default {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Mélange aléatoirement les pistes dans la file d\'attente'),
  async execute(interaction) {
    const queue = getGuildQueue(interaction.guild.id);
    if (!queue || queue.tracks.length <= 1) {
      return await interaction.reply({
        content: '❌ Il doit y avoir au moins 2 morceaux dans la file d\'attente pour mélanger.',
        flags: MessageFlags.Ephemeral,
      });
    }
    if (!canControlMusic(interaction.member, queue)) {
      return await interaction.reply({
        content: '❌ Vous devez être dans le salon vocal pour mélanger la file.',
        flags: MessageFlags.Ephemeral,
      });
    }
    for (let i = queue.tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue.tracks[i], queue.tracks[j]] = [queue.tracks[j], queue.tracks[i]];
    }
    const embed = new EmbedBuilder()
      .setTitle('🔀 File d\'attente mélangée')
      .setDescription(`Les **${queue.tracks.length} morceaux** de la file ont été mélangés aléatoirement !`)
      .setColor(0x00e5ff)
      .setFooter({ text: `Codé avec ❤️ par Saez | Mélangé par ${interaction.user.username}` });
    return await interaction.reply({ embeds: [embed] });
  },
};
