import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { getGuildQueue, canControlMusic, playNextTrack, startPlayingTrack } from '../../services/musicService.js';
export default {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Passe à la piste audio suivante dans la file d\'attente'),
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
        content: '❌ Vous devez être dans le même salon vocal que le bot pour passer un morceau.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const previousTitle = queue.currentTrack.title;
    const nextTrack = playNextTrack(interaction.guild.id);
    if (nextTrack) {
      await startPlayingTrack(interaction.guild.id);
    }
    const embed = new EmbedBuilder()
      .setTitle('⏭️ Piste ignorée')
      .setDescription(`Le titre **${previousTitle}** a été passé.`)
      .setColor(0x00e5ff)
      .setFooter({ text: `Codé avec ❤️ par Saez | Action effectuée par ${interaction.user.username}` });
    if (nextTrack) {
      embed.addFields({
        name: '▶️ Enchaînement sur',
        value: `**[${nextTrack.title}](${nextTrack.url})** (${nextTrack.duration})`,
      });
    } else {
      embed.addFields({
        name: '📭 File d\'attente vide',
        value: 'Plus aucun morceau dans la file. Utilisez `/play` pour en ajouter d\'autres !',
      });
    }
    return await interaction.reply({ embeds: [embed] });
  },
};
