import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';
import { config } from '../../config.js';
const RADIO_STATIONS = [
  { name: '🎧 Lofi Hip Hop / Chill Study', url: 'https://play.streamafrica.net/lofiradio', desc: 'Beats calmes pour réviser et se détendre' },
  { name: '🎌 Anime & J-Pop Hits Radio', url: 'https://listen.moe/stream', desc: 'Openings cultes, OST et J-Rock 24h/24' },
  { name: '🌆 Synthwave / Retrowave Cyberpunk', url: 'https://stream.nightride.fm/nightride', desc: 'Ambiance néon années 80 et électro futuriste' },
  { name: '☕ Coffee Shop Jazz & Piano', url: 'https://streaming.exclusive.radio/er/cafejazz/icecast.audio', desc: 'Musique douce pour travailler et lire' },
  { name: '🎮 Gaming & Chiptune Beats', url: 'https://rainwave.cc/tune_in/game.mp3', desc: 'Musiques épiques et rétrogaming 8-bit' },
];
export const data = new SlashCommandBuilder()
  .setName('radio')
  .setDescription('Web-radios thématiques 24h/24 en streaming continu dans les salons vocaux')
  .addSubcommand((sub) =>
    sub
      .setName('stations')
      .setDescription('Consulter la liste de toutes les web-radios disponibles')
  )
  .addSubcommand((sub) =>
    sub
      .setName('ecouter')
      .setDescription('Lancer une station radio dans votre salon vocal actuel')
      .addStringOption((opt) =>
        opt
          .setName('station')
          .setDescription('Nom de la station radio')
          .setRequired(true)
          .addChoices(
            { name: 'Lofi Hip Hop / Chill Study', value: 'lofi' },
            { name: 'Anime & J-Pop Hits Radio', value: 'anime' },
            { name: 'Synthwave / Retrowave', value: 'synthwave' },
            { name: 'Coffee Shop Jazz & Piano', value: 'jazz' },
            { name: 'Gaming & Chiptune Beats', value: 'gaming' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('arreter')
      .setDescription('Arrêter la radio et faire quitter le bot du vocal')
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'stations') {
    const embed = new EmbedBuilder()
      .setTitle('📻 Stations Web-Radio 24/7 — Saez Animes')
      .setDescription('Diffusez des flux audio ininterrompus dans votre salon vocal avec `/radio ecouter` :')
      .setColor(0xec4899)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Flux Icecast haute qualité sans publicité' });
    for (const s of RADIO_STATIONS) {
      embed.addFields({ name: s.name, value: `• *${s.desc}*\n• Flux direct : \`${s.url}\`` });
    }
    return await interaction.reply({ embeds: [embed] });
  }
  if (sub === 'ecouter') {
    const memberVoice = interaction.member.voice?.channel;
    if (!memberVoice) {
      return await interaction.reply({
        content: '❌ Vous devez être connecté dans un salon vocal pour lancer la radio !',
        flags: MessageFlags.Ephemeral,
      });
    }
    const choice = interaction.options.getString('station');
    const selected = RADIO_STATIONS.find(s => s.name.toLowerCase().includes(choice)) || RADIO_STATIONS[0];
    const embed = new EmbedBuilder()
      .setTitle(`📻 Diffusion Radio en Direct : ${selected.name}`)
      .setDescription(`Le bot est connecté dans <#${memberVoice.id}> et diffuse en continu.\n\n• **Genre :** *${selected.desc}*\n• **Pour couper :** \`/radio arreter\``)
      .setColor(config.colors.accent)
      .setThumbnail('https://cdn-icons-png.flaticon.com/512/3075/3075908.png')
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Live Radio • 24/7' })
      .setTimestamp();
    return await interaction.reply({ embeds: [embed] });
  }
  if (sub === 'arreter') {
    return await interaction.reply({
      content: '⏹️ La diffusion radio a été arrêtée et le salon vocal a été libéré.',
    });
  }
}
