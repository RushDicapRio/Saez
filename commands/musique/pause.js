import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { getGuildQueue, canControlMusic } from '../../services/musicService.js';
export default {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Met la lecture de la musique en pause'),
  async execute(interaction) {
    const queue = getGuildQueue(interaction.guild.id);
    if (!queue || !queue.currentTrack) {
      return await interaction.reply({
        content: '❌ Aucune musique n\'est actuellement en cours de lecture.',
        flags: MessageFlags.Ephemeral,
      });
    }
    if (!canControlMusic(interaction.member, queue)) {
      return await interaction.reply({
        content: '❌ Vous devez être dans le même salon vocal que le bot pour contrôler la lecture.',
        flags: MessageFlags.Ephemeral,
      });
    }
    queue.isPaused = true;
    queue.isPlaying = false;
    if (queue.player && typeof queue.player.pause === 'function') {
      try { queue.player.pause(); } catch (e) {}
    }
    const embed = new EmbedBuilder()
      .setTitle('⏸️ Musique en pause')
      .setDescription(`La lecture de **[${queue.currentTrack.title}](${queue.currentTrack.url})** a été suspendue.\nUtilisez \`/resume\` pour reprendre.`)
      .setColor(0xf59e0b)
      .setFooter({ text: `Codé avec ❤️ par Saez | Demandé par ${interaction.user.username}` });
    return await interaction.reply({ embeds: [embed] });
  },
};
