import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';
import {
  getGuildQueue,
  resolveTrack,
  connectToVoice,
  startPlayingTrack,
  playNextTrack,
} from '../../services/musicService.js';
export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Joue un morceau ou ajoute à la file (YouTube, Spotify, Deezer, SoundCloud)')
    .addStringOption((opt) =>
      opt
        .setName('recherche')
        .setDescription('Titre de la chanson ou lien direct (YouTube, Spotify, Deezer, SoundCloud)')
        .setRequired(true)
    ),
  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice?.channel;
    if (!voiceChannel) {
      return await interaction.reply({
        content: '❌ Vous devez d\'abord être connecté dans un salon vocal pour lancer de la musique !',
        flags: MessageFlags.Ephemeral,
      });
    }
    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return await interaction.reply({
        content: '❌ Je n\'ai pas la permission de rejoindre ou de parler dans votre salon vocal !',
        flags: MessageFlags.Ephemeral,
      });
    }
    await interaction.deferReply();
    const query = interaction.options.getString('recherche');
    const queue = getGuildQueue(interaction.guild.id);
    queue.voiceChannelId = voiceChannel.id;
    queue.textChannelId = interaction.channel.id;t
    if (!queue.connection) {
      queue.connection = await connectToVoice(voiceChannel);
    }
    const track = await resolveTrack(query, member.user);
    const isFirst = !queue.currentTrack;
    if (isFirst) {
      queue.currentTrack = track;
      queue.isPlaying = true;
      queue.isPaused = false;
      await startPlayingTrack(interaction.guild.id);
    } else {
      queue.tracks.push(track);
    }
    const embed = new EmbedBuilder()
      .setTitle(isFirst ? `${track.platformIcon} En cours de lecture` : '📥 Ajouté à la file d\'attente')
      .setDescription(`**[${track.title}](${track.url})**\nArtiste / Source : *${track.artist}*`)
      .setColor(track.color)
      .setThumbnail(track.thumbnail)
      .addFields(
        { name: '⏱️ Durée', value: track.duration, inline: true },
        { name: '🌐 Source', value: track.platform, inline: true },
        { name: '👤 Demandé par', value: `<@${member.id}>`, inline: true },
        {
          name: '📊 Position dans la file',
          value: isFirst ? '▶️ En direct' : `#${queue.tracks.length} en attente`,
          inline: true,
        },
        { name: '🔊 Salon', value: `<#${voiceChannel.id}>`, inline: true },
        { name: '🔁 Répétition', value: queue.loopMode === 'off' ? 'Désactivée' : queue.loopMode, inline: true }
      )
      .setFooter({
        text: 'Codé avec ❤️ par Saez | Saez Animes Music • Conforme aux conditions des fournisseurs audio',
        iconURL: interaction.client.user.displayAvatarURL(),
      });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('music_pause').setEmoji('⏸️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('music_skip').setEmoji('⏭️').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('music_queue').setEmoji('📜').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('music_shuffle').setEmoji('🔀').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('music_stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger)
    );
    return await interaction.editReply({
      embeds: [embed],
      components: [row],
    });
  },
};
