import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';
const KB_ARTICLES = [
  {
    id: 'streaming_quality',
    category: 'Application',
    title: 'Comment passer les animes en 1080p 60 FPS ?',
    content: 'Dans le lecteur de Saez Animes, cliquez sur la roue crantée des paramètres en bas à droite pour forcer la qualité maximale 1080p HD.',
  },
  {
    id: 'karaoke_sync',
    category: 'Karaoké',
    title: 'Comment synchroniser les paroles en karaoké vocal ?',
    content: 'Rejoignez un salon vocal temporaire, puis lancez l\'espace Karaoké dans le logiciel. Le bot diffuse l\'audio instrumental et les paroles défilent en temps réel.',
  },
  {
    id: 'vip_perks',
    category: 'VIP & Niveaux',
    title: 'Quels sont les avantages du statut VIP ?',
    content: 'Les membres VIP obtiennent le badge doré, un multiplicateur de pièces x1.5, des débits vocaux haute-fidélité et l\'accès prioritaire aux nouveaux animés.',
  },
  {
    id: 'discord_rpc',
    category: 'Discord',
    title: 'Comment afficher ce que je regarde sur mon profil Discord ?',
    content: 'Activez l\'option « Discord Rich Presence » dans les Paramètres du logiciel Saez Animes. Dès qu\'un épisode démarre, votre profil affiche l\'affiche et l\'épisode en direct.',
  },
  {
    id: 'storage_clean',
    category: 'Système',
    title: 'Comment vider le cache vidéo pour libérer de l\'espace disque ?',
    content: 'Rendez-vous dans la rubrique « Nettoyage Stockage C: » du logiciel pour purger en un clic les fichiers temporaires et les segments HLS mis en cache.',
  },
];
export default {
  data: new SlashCommandBuilder()
    .setName('kb')
    .setDescription('Base de connaissances officielle et centre d\'aide Saez Animes')
    .addSubcommand((sub) =>
      sub
        .setName('search')
        .setDescription('Recherche un article ou un guide par mot-clé')
        .addStringOption((opt) => opt.setName('requete').setDescription('Terme de recherche (ex: 1080p, rpc, cache, vip)').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName('categories').setDescription('Lister toutes les rubriques de la base de connaissances')
    )
    .addSubcommand((sub) =>
      sub
        .setName('article')
        .setDescription('Consulter directement un article par son identifiant')
        .addStringOption((opt) =>
          opt
            .setName('id')
            .setDescription('Identifiant de l\'article')
            .setRequired(true)
            .addChoices(
              { name: '🎬 Qualité 1080p 60 FPS', value: 'streaming_quality' },
              { name: '🎤 Synchronisation Karaoké', value: 'karaoke_sync' },
              { name: '👑 Avantages VIP', value: 'vip_perks' },
              { name: '🎮 Statut Discord RPC', value: 'discord_rpc' },
              { name: '💾 Nettoyage Cache & Disque', value: 'storage_clean' }
            )
        )
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'categories') {
      const cats = [...new Set(KB_ARTICLES.map((a) => a.category))];
      const embed = new EmbedBuilder()
        .setTitle('📚 Rubriques de la Base de Connaissances')
        .setDescription('Voici les catégories d\'articles consultables :\n\n' + cats.map((c) => `📁 **${c}**`).join('\n'))
        .setColor(0x00e5ff)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Utilisez /kb search <terme> pour trouver un guide' });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'article') {
      const articleId = interaction.options.getString('id');
      const art = KB_ARTICLES.find((a) => a.id === articleId);
      if (!art) {
        return await interaction.reply({ content: '❌ Article introuvable.', flags: MessageFlags.Ephemeral });
      }
      const embed = new EmbedBuilder()
        .setTitle(`📖 [${art.category}] ${art.title}`)
        .setDescription(art.content)
        .setColor(0x00e5ff)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Base de Connaissances Saez Animes' });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'search') {
      const q = interaction.options.getString('requete').toLowerCase();
      const matches = KB_ARTICLES.filter(
        (a) => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
      );
      const embed = new EmbedBuilder()
        .setTitle(`🔍 Résultats de recherche pour "${q}"`)
        .setColor(0x00e5ff)
        .setFooter({ text: `Codé avec ❤️ par Saez | ${matches.length} article(s) trouvé(s)` });
      if (matches.length === 0) {
        embed.setDescription('Aucun article ne correspond à votre recherche. N\'hésitez pas à ouvrir un ticket via `/ticket creer` !');
      } else {
        for (const m of matches) {
          embed.addFields({
            name: `📁 [${m.category}] ${m.title}`,
            value: `${m.content}\n*(ID: \`/kb article id:${m.id}\`)*`,
          });
        }
      }
      return await interaction.reply({ embeds: [embed] });
    }
  },
};
