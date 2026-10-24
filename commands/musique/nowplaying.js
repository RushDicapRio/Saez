import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { getGuildQueue } from '../../services/musicService.js';
export default {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Affiche les détails du morceau audio actuellement en cours de lecture'),
  async execute(interaction) {
    const queue = getGuildQueue(interaction.guild.id);
    if (!queue || !queue.currentTrack) {
      return await interaction.reply({
        content: '❌ Aucun morceau n\'est actuellement en cours de lecture.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const t = queue.currentTrack;
    const embed = new EmbedBuilder()
      .setTitle(`${t.platformIcon} En cours d'écoute sur Saez Animes`)
      .setDescription(`**[${t.title}](${t.url})**\nArtiste / Chaîne : *${t.artist}*`)
      .setColor(t.color)
      .setThumbnail(t.thumbnail)
      .addFields(
        { name: '🌐 Source', value: `${t.platformIcon} ${t.platform}`, inline: true },
        { name: '⏱️ Durée', value: t.duration, inline: true },
        { name: '🔊 Volume', value: `${queue.volume}%`, inline: true },
        { name: '🔁 Mode Répétition', value: queue.loopMode === 'off' ? 'Désactivé' : queue.loopMode, inline: true },
        { name: '👤 Demandé par', value: `<@${t.requestedBy.id}>`, inline: true },
        { name: '📑 File d\'attente', value: `${queue.tracks.length} morceau(x) restant(s)`, inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes Music Player', iconURL: interaction.client.user.displayAvatarURL() });
    return await interaction.reply({ embeds: [embed] });
  },
};
