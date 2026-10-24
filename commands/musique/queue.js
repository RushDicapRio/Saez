import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { getGuildQueue } from '../../services/musicService.js';
export default {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Affiche la file d\'attente musicale actuelle du serveur'),
  async execute(interaction) {
    const queue = getGuildQueue(interaction.guild.id);
    if (!queue || (!queue.currentTrack && queue.tracks.length === 0)) {
      return await interaction.reply({
        content: '📭 La file d\'attente musicale est actuellement vide. Lancez un morceau avec `/play` !',
        flags: MessageFlags.Ephemeral,
      });
    }
    const current = queue.currentTrack;
    const embed = new EmbedBuilder()
      .setTitle('📜 File d\'attente musicale — Saez Animes')
      .setColor(0x00e5ff)
      .setFooter({
        text: `Codé avec ❤️ par Saez | Statut: ${queue.isPaused ? '⏸️ En pause' : '▶️ En lecture'} • Répétition: ${queue.loopMode} • Volume: ${queue.volume}%`,
      });
    if (current) {
      embed.addFields({
        name: '▶️ En cours de lecture',
        value: `**[${current.title}](${current.url})**\n> Source: ${current.platformIcon} ${current.platform} | Durée: \`${current.duration}\` | Demandé par: <@${current.requestedBy.id}>`,
      });
    }
    if (queue.tracks.length > 0) {
      const tracksList = queue.tracks
        .slice(0, 10)
        .map((t, index) => `**${index + 1}.** [${t.title}](${t.url}) — \`${t.duration}\` *(par <@${t.requestedBy.id}>)*`)
        .join('\n');
      const remaining = queue.tracks.length - 10;
      embed.addFields({
        name: `📑 Morceaux suivants (${queue.tracks.length})`,
        value: tracksList + (remaining > 0 ? `\n*... et ${remaining} autres morceau(x)*` : ''),
      });
    } else {
      embed.addFields({
        name: '📑 Morceaux suivants',
        value: '*Aucun morceau en attente dans la file.*',
      });
    }
    return await interaction.reply({ embeds: [embed] });
  },
};
