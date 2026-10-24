import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { getGuildQueue, canControlMusic } from '../../services/musicService.js';
export default {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Règle le volume de sortie sonore du bot (1 à 150%)')
    .addIntegerOption((opt) =>
      opt
        .setName('pourcentage')
        .setDescription('Niveau du volume entre 1 et 150')
        .setMinValue(1)
        .setMaxValue(150)
        .setRequired(true)
    ),
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
        content: '❌ Vous devez être dans le salon vocal pour modifier le volume.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const volume = interaction.options.getInteger('pourcentage');
    queue.volume = volume;
    if (queue.currentResource?.volume) {
      try {
        queue.currentResource.volume.setVolume(volume / 100);
      } catch (e) {}
    }
    const embed = new EmbedBuilder()
      .setTitle('🔊 Volume sonore ajusté')
      .setDescription(`Le volume de lecture est désormais configuré à **${volume}%**.`)
      .setColor(0x00e5ff)
      .setFooter({ text: `Codé avec ❤️ par Saez | Modifié par ${interaction.user.username}` });
    return await interaction.reply({ embeds: [embed] });
  },
};
