import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { getGuildQueue, destroyGuildQueue, canControlMusic } from '../../services/musicService.js'
export default {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Arrête la musique, vide la file et quitte le salon vocal'),
  async execute(interaction) {
    const queue = getGuildQueue(interaction.guild.id);
    if (!queue || (!queue.currentTrack && queue.tracks.length === 0)) {
      return await interaction.reply({
        content: '❌ Aucune lecture active à arrêter.',
        flags: MessageFlags.Ephemeral,
      });
    }
    if (!canControlMusic(interaction.member, queue)) {
      return await interaction.reply({
        content: '❌ Vous devez avoir les permissions modérateur ou être dans le salon vocal pour arrêter la musique.',
        flags: MessageFlags.Ephemeral,
      });
    }
    destroyGuildQueue(interaction.guild.id);
    const embed = new EmbedBuilder()
      .setTitle('⏹️ Lecture arrêtée')
      .setDescription('La file d\'attente a été vidée et le bot s\'est déconnecté du salon vocal.')
      .setColor(0xef4444)
      .setFooter({ text: `Codé avec ❤️ par Saez | Arrêté par ${interaction.user.username}` });
    return await interaction.reply({ embeds: [embed] });
  },
};
