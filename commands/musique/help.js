import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
export default {
  data: new SlashCommandBuilder()
    .setName('music-help')
    .setDescription('Affiche l\'aide et les commandes du lecteur de musique Saez'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🎵 Guide & Commandes Musicales — Saez Animes')
      .setDescription(
        'Diffusez et partagez vos morceaux, openings et playlists préférés directement dans vos salons vocaux ! ' +
        'Le lecteur supporte les principales plateformes de streaming dans le respect des conditions fournisseurs.'
      )
      .setColor(0x00e5ff)
      .addFields(
        { name: '🌐 Plateformes supportées', value: '• **YouTube** & **YouTube Music**\n• **Spotify** (titres, playlists)\n• **Deezer** (liens et titres)\n• **SoundCloud** (streaming direct)\n• **Recherche par mots-clés**' },
        { name: '▶️ `/play <recherche_ou_lien>`', value: 'Lance un morceau ou l\'ajoute à la file d\'attente.' },
        { name: '⏸️ `/pause` & ▶️ `/resume`', value: 'Suspend ou reprend la lecture en cours.' },
        { name: '⏭️ `/skip`', value: 'Passe immédiatement à la piste audio suivante.' },
        { name: '⏹️ `/stop`', value: 'Arrête la musique, vide la file et déconnecte le bot.' },
        { name: '📜 `/queue`', value: 'Affiche la liste complète des morceaux en attente.' },
        { name: 'ℹ️ `/nowplaying`', value: 'Affiche les informations détaillées du morceau en cours.' },
        { name: '🔊 `/volume <1-150>`', value: 'Règle la puissance sonore du bot.' },
        { name: '🔁 `/loop <off|track|queue>`', value: 'Répète le titre actuel ou toute la file.' },
        { name: '🔀 `/shuffle`', value: 'Mélange aléatoirement l\'ordre des morceaux en attente.' }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes Music System', iconURL: interaction.guild?.iconURL() || undefined });
    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
