import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { getGuildQueue, canControlMusic } from '../../services/musicService.js';
export default {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Reprend la lecture de la musique mise en pause'),
  async execute(interaction) {
    const queue = getGuildQueue(interaction.guild.id);
    if (!queue || !queue.currentTrack) {
      return await interaction.reply({
        content: '❌ Aucune musique n\'est actuellement en file d\'attente.',
        flags: MessageFlags.Ephemeral,
      });
    }
    if (!canControlMusic(interaction.member, queue)) {
      return await interaction.reply({
        content: '❌ Vous devez être dans le même salon vocal que le bot pour contrôler la lecture.',
        flags: MessageFlags.Ephemeral,
      });
    }
    queue.isPaused = false;
    queue.isPlaying = true;
    if (queue.player && typeof queue.player.unpause === 'function') {
      try { queue.player.unpause(); } catch (e) {}
    }
    const embed = new EmbedBuilder()
      .setTitle('▶️ Lecture reprise')
      .setDescription(`Reprise de **[${queue.currentTrack.title}](${queue.currentTrack.url})** !`)
      .setColor(0x10b981)
      .setFooter({ text: `Codé avec ❤️ par Saez | Demandé par ${interaction.user.username}` });
    return await interaction.reply({ embeds: [embed] });
  },
};
