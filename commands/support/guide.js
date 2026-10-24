import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('guide')
  .setDescription('Tutoriels et guides d\'utilisation du logiciel Saez Animes')
  .addStringOption((opt) =>
    opt
      .setName('sujet')
      .setDescription('Le sujet du guide')
      .setRequired(false)
      .addChoices(
        { name: '⌨️ Raccourcis Clavier du Lecteur', value: 'shortcuts' },
        { name: '🎮 Synchroniser Discord Rich Presence', value: 'rpc' },
        { name: '👑 Statut VIP & Téléchargement hors-ligne', value: 'vip' },
        { name: '🎤 Espace Karaoké & Mini-Jeux', value: 'games' },
        { name: '🧹 Optimisation & Nettoyage du Stockage', value: 'storage' }
      )
  );
export async function execute(interaction) {
  const topic = interaction.options.getString('sujet') || 'shortcuts';
  const guides = {
    shortcuts: {
      title: '⌨️ Guide : Raccourcis Clavier du Lecteur Saez',
      description:
        'Contrôlez votre visionnage comme un pro sans toucher à la souris :\n\n' +
        '• <kbd>Espace</kbd> ou <kbd>K</kbd> : Lecture / Pause\n' +
        '• <kbd>F</kbd> : Basculer en Plein écran (Fullscreen)\n' +
        '• <kbd>M</kbd> : Couper / Rétablir le son (Mute)\n' +
        '• <kbd>Flèche Droite</kbd> / <kbd>L</kbd> : Avancer de 5 ou 10 secondes\n' +
        '• <kbd>Flèche Gauche</kbd> / <kbd>J</kbd> : Reculer de 5 ou 10 secondes\n' +
        '• <kbd>Flèche Haut</kbd> / <kbd>Flèche Bas</kbd> : Ajuster le volume sonore (±5%)\n' +
        '• <kbd>N</kbd> : Passer à l\'épisode suivant automatiquement\n' +
        '• <kbd>P</kbd> : Mode Image dans l\'image (Picture-in-Picture)',
      color: config.colors.primary,
    },
    rpc: {
      title: '🎮 Guide : Synchronisation Discord Rich Presence',
      description:
        'Affichez fièrement votre animé en cours sur votre profil Discord :\n\n' +
        '1. Lancez votre application Discord de bureau.\n' +
        '2. Allez dans **Paramètres utilisateur > Confidentialité de l\'activité**.\n' +
        '3. Activez **« Partager l\'état d\'activité avec les autres »**.\n' +
        '4. Ouvrez Saez Animes et lancez un épisode : votre statut passe automatiquement en direct avec les détails de l\'épisode !',
      color: 0x5865f2,
    },
    vip: {
      title: '👑 Guide : Avantages VIP Premium & Débridage',
      description:
        'Tout ce que vous devez savoir sur le mode Saez VIP :\n\n' +
        '• **Streaming Débridé :** Accès aux serveurs ultra-rapides sans aucun bridage de débit.\n' +
        '• **Mode Hors-Ligne :** Bouton de téléchargement direct pour stocker vos épisodes et les regarder dans le train ou l\'avion.\n' +
        '• **Badges & Rôles :** Affichage d\'une aura cyber dorée sur votre profil et accès aux salons VIP Discord.',
      color: 0xf59e0b,
    },
    games: {
      title: '🎤 Guide : Espace Karaoké, Jeux & Cartes à Collectionner',
      description:
        'Détendez-vous entre deux épisodes :\n\n' +
        '• **Karaoké Live :** Chantez avec les paroles synchronisées de vos génériques préférés.\n' +
        '• **Mini-Jeux Saez :** Jouez à Piano Tiles pour engranger de l\'XP et monter de niveau (`/profil`).\n' +
        '• **Cartes d\'Animés :** Débloquez des cartes de collection à échanger avec vos amis dans le hub communautaire.',
      color: config.colors.accent,
    },
    storage: {
      title: '🧹 Guide : Optimisation et Nettoyage du Disque C:',
      description:
        'Gardez votre PC propre et fluide :\n\n' +
        '• Saez met en cache les épisodes visionnés pour un chargement instantané.\n' +
        '• Utilisez le bouton **« Nettoyage Stockage C: »** dans la barre latérale pour libérer plusieurs Go en supprimant les fichiers temporaires sans risquer de perdre vos données personnelles.',
      color: config.colors.success,
    },
  };
  const selected = guides[topic] || guides.shortcuts;
  const embed = new EmbedBuilder()
    .setTitle(selected.title)
    .setDescription(selected.description)
    .setColor(selected.color)
    .setThumbnail(config.assets.logoUrl)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Guides & Astuces' })
    .setTimestamp();
  return await interaction.reply({ embeds: [embed] });
}
