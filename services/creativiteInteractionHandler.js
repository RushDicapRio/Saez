import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  MessageFlags,
} from 'discord.js';
import {
  getUserConsolidatedStats,
  getCreativeChallenge,
  getRandomInspiration,
  getUserReadingBooks,
  getUserStories,
  getUserPoems,
  getUserLetters,
  searchRecipes,
  getUserCollection,
  getGalleryItems,
  likeGalleryItem,
} from './creativeHubService.js';
import { config } from '../config.js';
export function buildAtelierSelectMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('creativite_select_atelier')
      .setPlaceholder('🎨 Choisissez un atelier créatif à explorer...')
      .addOptions([
        {
          label: 'Bibliothèque & Lectures',
          value: 'lecture',
          description: 'Suivi de tomes, objectifs, sessions, citations & clubs de lecture',
          emoji: '📚',
        },
        {
          label: 'Recettes & Cuisine',
          value: 'recette',
          description: 'Livre culinaire, portions proportionnelles, listes de courses',
          emoji: '🍜',
        },
        {
          label: 'Histoires & Écriture',
          value: 'histoire',
          description: 'Romans, conte collaboratif, chapitres, fiches de personnages',
          emoji: '📜',
        },
        {
          label: 'Lettres & Correspondance',
          value: 'lettre',
          description: 'Modèles de lettres, tonalités, messages privés ou fictifs',
          emoji: '✉️',
        },
        {
          label: 'Atelier Poésie',
          value: 'poesie',
          description: 'Haïkus, sonnets, rimes phonétiques françaises, syllabes',
          emoji: '🌸',
        },
        {
          label: 'World Building & Univers',
          value: 'worldbuilding',
          description: 'Création d\'univers fictifs, factions, magie, géographie, lore',
          emoji: '🌍',
        },
        {
          label: 'Collections & Inventaire',
          value: 'collection',
          description: 'Figurines, tomes, cartes, estimations et raretés',
          emoji: '📦',
        },
        {
          label: 'Inspirations & Défis',
          value: 'inspiration',
          description: 'Générateurs d\'idées, défis quotidiens et carnet de notes',
          emoji: '💡',
        },
        {
          label: 'Projets Collaboratifs',
          value: 'projet',
          description: 'Création en équipe, répartition des tâches et chapitres',
          emoji: '🤝',
        },
        {
          label: 'Galerie Communautaire',
          value: 'galerie',
          description: 'Vitrine des créations partagées par les membres du serveur',
          emoji: '🖼️',
        },
      ])
  );
}
export function buildHubActionRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('creativite_btn_inspiration')
      .setLabel('Inspiration Aléatoire')
      .setEmoji('✨')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('creativite_btn_defi')
      .setLabel('Défi du Jour')
      .setEmoji('🎯')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('creativite_btn_stats')
      .setLabel('Mes Statistiques')
      .setEmoji('📊')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('creativite_btn_brouillons')
      .setLabel('Mes Brouillons')
      .setEmoji('📝')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('creativite_btn_hub')
      .setLabel('Accueil Hub')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );
}
export async function buildHubEmbed(user) {
  const stats = await getUserConsolidatedStats(user.id);
  return new EmbedBuilder()
    .setTitle('🎨 Atelier Numérique & Hub Créatif Saez')
    .setDescription(
      `Bienvenue dans votre atelier de création sur **Saez** !\n` +
      `Ici, chaque membre peut **écrire, concevoir, cuisiner, collectionner et partager** ses œuvres personnelles et collectives.`
    )
    .setColor(config.colors?.primary || 0x8b5cf6)
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .addFields(
      {
        name: '📚 Vos Créations Actives',
        value:
          `• 📖 Lectures : **${stats.booksCount}** (*${stats.booksFinished} terminés*)\n` +
          `• 🍜 Recettes : **${stats.recipesCount}**\n` +
          `• 📜 Histoires : **${stats.storiesCount}** (*${stats.totalWordsInStories} mots*)\n` +
          `• 🌸 Poèmes : **${stats.poemsCount}** (*${stats.totalVerses} vers*)\n` +
          `• ✉️ Lettres : **${stats.lettersCount}**\n` +
          `• 📦 Collections : **${stats.collectionsCount} objets**\n` +
          `• 💡 Carnet d'idées : **${stats.ideasCount} notes**`,
        inline: true,
      },
      {
        name: '🛠️ 10 Ateliers Disponibles',
        value:
          `1. 📚 **/creativite lecture** : Bibliothèque & Clubs\n` +
          `2. 🍜 **/creativite recette** : Recettes & Portions\n` +
          `3. 📜 **/creativite histoire** : Atelier de Narration\n` +
          `4. ✉️ **/creativite lettre** : Messages & Modèles\n` +
          `5. 🌸 **/creativite poesie** : Haïkus, Sonnets & Rimes\n` +
          `6. 🌍 **/creativite worldbuilding** : Lore & Factions\n` +
          `7. 📦 **/creativite collection** : Inventaire & Figurines\n` +
          `8. 💡 **/creativite inspiration** : Défis & Générateurs\n` +
          `9. 🤝 **/creativite projet** : Travail Collaboratif\n` +
          `10. 🖼️ **/creativite galerie** : Vitrine Publique`,
        inline: true,
      },
      {
        name: '💡 Astuce Rapide',
        value:
          `Utilisez le menu déroulant ci-dessous pour explorer en détail n'importe quel atelier, ` +
          `ou cliquez sur **Inspiration** pour stimuler votre imagination !`,
      }
    )
    .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Créativité • Votre espace d\'imagination sans limites' })
    .setTimestamp();
}
export async function handleCreativiteInteraction(interaction) {
  const { customId, user, guild } = interaction;
  if (customId === 'creativite_btn_hub') {
    const embed = await buildHubEmbed(user);
    const select = buildAtelierSelectMenu();
    const row = buildHubActionRow();
    return await interaction.update({ embeds: [embed], components: [select, row] });
  }
  if (customId === 'creativite_btn_inspiration') {
    const domains = ['histoire', 'personnage', 'lieu', 'recette'];
    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    const text = getRandomInspiration(randomDomain);
    const embed = new EmbedBuilder()
      .setTitle(`✨ Inspiration Créative [${randomDomain.toUpperCase()}]`)
      .setDescription(`> *« ${text} »*`)
      .setColor(0xf59e0b)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Relancez le bouton pour obtenir une autre suggestion !' })
      .setTimestamp();
    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
  if (customId === 'creativite_btn_defi') {
    const challenge = getCreativeChallenge('daily');
    const embed = new EmbedBuilder()
      .setTitle(`🎯 Défi Créatif du Jour : ${challenge.title}`)
      .setDescription(`**Domaine :** \`${challenge.domain}\`\n\n> **Votre mission :**\n> *${challenge.prompt}*`)
      .setColor(0x10b981)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Partagez votre réalisation avec /creativite histoire, poesie ou recette !' })
      .setTimestamp();
    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
  if (customId === 'creativite_btn_stats') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const stats = await getUserConsolidatedStats(user.id);
    const embed = new EmbedBuilder()
      .setTitle(`📊 Bilan Créatif de ${user.username}`)
      .setColor(0x06b6d4)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '📖 Lectures & Mangas', value: `• Total suivis : **${stats.booksCount}**\n• Terminés : **${stats.booksFinished}**`, inline: true },
        { name: '🍜 Recettes Partagées', value: `• Recettes : **${stats.recipesCount}**`, inline: true },
        { name: '📜 Écriture & Histoires', value: `• Histoires : **${stats.storiesCount}**\n• Mots rédigés : **${stats.totalWordsInStories}**`, inline: true },
        { name: '🌸 Poésie', value: `• Poèmes : **${stats.poemsCount}**\n• Vers rimés : **${stats.totalVerses}**`, inline: true },
        { name: '✉️ Lettres', value: `• Lettres : **${stats.lettersCount}**`, inline: true },
        { name: '📦 Collections', value: `• Pièces : **${stats.collectionsCount}**`, inline: true }
      )
      .setFooter({ text: `Codé avec ❤️ par Saez | Total de ${stats.grandTotal} réalisations créatives enregistrées.` })
      .setTimestamp();
    return await interaction.editReply({ embeds: [embed] });
  }
  if (customId === 'creativite_btn_brouillons') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const [draftStories, draftLetters] = await Promise.all([
      getUserStories(user.id, { status: 'Brouillon', limit: 10 }),
      getUserLetters(user.id, { isDraft: true, limit: 10 }),
    ]);
    const embed = new EmbedBuilder()
      .setTitle('📝 Vos Brouillons en Attente')
      .setColor(0xec4899)
      .setFooter({ text: 'Codé avec ❤️ par Saez' })
      .setTimestamp();
    let desc = '';
    if (draftStories.length > 0) {
      desc += '**📜 Histoires en cours d\'écriture :**\n' +
        draftStories.map(s => `• **${s.title}** (${s.genre}) — \`${s._id}\``).join('\n') + '\n\n';
    }
    if (draftLetters.length > 0) {
      desc += '**✉️ Lettres non finalisées :**\n' +
        draftLetters.map(l => `• **${l.title}** (pour *${l.recipient}*) — \`${l._id}\``).join('\n');
    }
    if (!desc) {
      desc = '*Aucun brouillon en attente. Toutes vos œuvres sont à jour !*';
    }
    embed.setDescription(desc);
    return await interaction.editReply({ embeds: [embed] });
  }
  if (customId.startsWith('creativite_like_')) {
    const itemId = customId.replace('creativite_like_', '');
    try {
      const res = await likeGalleryItem(itemId, user.id);
      return await interaction.reply({
        content: res.liked
          ? `❤️ Vous avez aimé cette création ! (Total : ${res.totalLikes})`
          : `🤍 Mention 'J'aime' retirée. (Total : ${res.totalLikes})`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (e) {
      return await interaction.reply({ content: `❌ ${e.message}`, flags: MessageFlags.Ephemeral });
    }
  }
}
export async function handleCreativiteSelect(interaction) {
  const selected = interaction.values[0];
  const DETAILS = {
    lecture: {
      title: '📚 Atelier Lecture & Bibliothèque Personnelle',
      color: 0x00e5ff,
      desc:
        `Suivez vos lectures de mangas, light novels, webtoons et romans.\n\n` +
        `**Commandes disponibles :**\n` +
        `• \`/creativite lecture ajouter\` : Ajouter un livre, tome ou statut\n` +
        `• \`/creativite lecture liste\` : Voir sa bibliothèque\n` +
        `• \`/creativite lecture session\` : Enregistrer une session de lecture\n` +
        `• \`/creativite lecture consulter\` : Fiche détaillée, notes et citations\n` +
        `• \`/creativite lecture club\` : Rejoindre ou créer un club de lecture`,
    },
    recette: {
      title: '🍜 Livre de Cuisine & Recettes Gourmandes',
      color: 0xf59e0b,
      desc:
        `Partagez et découvrez des recettes de cuisine et délices d'animés.\n\n` +
        `**Commandes disponibles :**\n` +
        `• \`/creativite recette ajouter\` : Créer une recette complète\n` +
        `• \`/creativite recette liste\` : Parcourir ses recettes\n` +
        `• \`/creativite recette rechercher\` : Chercher par nom ou ingrédient\n` +
        `• \`/creativite recette portions\` : Recalculer les portions pour X personnes\n` +
        `• \`/creativite recette courses\` : Générer une liste de courses à cocher\n` +
        `• \`/creativite recette aleatoire\` : Tirer une recette gourmande au sort`,
    },
    histoire: {
      title: '📜 Atelier d\'Écriture & Récits',
      color: 0xa855f7,
      desc:
        `Rédigez vos romans, chapitres ou contribuez au conte collaboratif.\n\n` +
        `**Commandes disponibles :**\n` +
        `• \`/creativite histoire creer\` : Créer une histoire avec genre et résumé\n` +
        `• \`/creativite histoire chapitre\` : Rédiger ou modifier un chapitre\n` +
        `• \`/creativite histoire lire\` : Lire une histoire avec pagination\n` +
        `• \`/creativite histoire ecrire\` : Ajouter une phrase au conte du serveur\n` +
        `• \`/creativite histoire personnage\` : Créer une fiche de personnage`,
    },
    lettre: {
      title: '✉️ Rédaction de Lettres & Messages',
      color: 0x3b82f6,
      desc:
        `Rédigez des lettres soignées avec modèles et tonalités personnalisées.\n\n` +
        `**Commandes disponibles :**\n` +
        `• \`/creativite lettre rediger\` : Écrire une lettre confidentielle\n` +
        `• \`/creativite lettre modeles\` : Aperçu des modèles prêts à l'emploi\n` +
        `• \`/creativite lettre consulter\` : Afficher une lettre avec cachet\n` +
        `• \`/creativite lettre liste\` : Vos lettres et brouillons privés`,
    },
    poesie: {
      title: '🌸 Atelier Poésie & Littérature',
      color: 0xec4899,
      desc:
        `Créez des haïkus, sonnets ou vers libres avec notre boîte à outils poétique.\n\n` +
        `**Commandes disponibles :**\n` +
        `• \`/creativite poesie creer\` : Publier un poème ou un haïku\n` +
        `• \`/creativite poesie rimes\` : Dictionnaire de rimes françaises\n` +
        `• \`/creativite poesie syllabes\` : Compteur métrique de syllabes\n` +
        `• \`/creativite poesie formes\` : Guide des règles métriques\n` +
        `• \`/creativite poesie liste\` : Consulter vos poèmes`,
    },
    worldbuilding: {
      title: '🌍 World Building : Création d\'Univers Fictifs',
      color: 0x10b981,
      desc:
        `Donnez vie à vos mondes imaginaires : factions, magie, géographie et lore.\n\n` +
        `**Commandes disponibles :**\n` +
        `• \`/creativite worldbuilding univers\` : Fonder ou gérer un univers\n` +
        `• \`/creativite worldbuilding element\` : Ajouter une faction, magie ou lieu\n` +
        `• \`/creativite worldbuilding chronologie\` : Frise des ères et événements\n` +
        `• \`/creativite worldbuilding relations\` : Graphe des liens et alliances\n` +
        `• \`/creativite worldbuilding liste\` : Explorer les éléments du lore`,
    },
    collection: {
      title: '📦 Inventaire & Collections Physiques/Numériques',
      color: 0xfbbf24,
      desc:
        `Gérez vos figurines, mangas rares, cartes et goodies avec estimation.\n\n` +
        `**Commandes disponibles :**\n` +
        `• \`/creativite collection ajouter\` : Ajouter une figurine, carte ou tome\n` +
        `• \`/creativite collection liste\` : Consulter son inventaire\n` +
        `• \`/creativite collection stats\` : Estimation de valeur et répartition\n` +
        `• \`/creativite collection modifier\` : Ajuster état, rareté ou note`,
    },
    inspiration: {
      title: '💡 Inspirations, Idées & Défis',
      color: 0x6366f1,
      desc:
        `Stimulez votre créativité avec des défis et tenez un carnet de notes.\n\n` +
        `**Commandes disponibles :**\n` +
        `• \`/creativite inspiration aleatoire\` : Tirer une idée d'intrigue ou de lieu\n` +
        `• \`/creativite inspiration defi\` : Découvrir le défi du jour ou de la semaine\n` +
        `• \`/creativite inspiration carnet\` : Noter une idée à développer plus tard`,
    },
    projet: {
      title: '🤝 Projets Créatifs Collaboratifs',
      color: 0x14b8a6,
      desc:
        `Travaillez à plusieurs sur un roman, un univers partagé ou un fanzine.\n\n` +
        `**Commandes disponibles :**\n` +
        `• \`/creativite projet creer\` : Fonder un projet collectif\n` +
        `• \`/creativite projet rejoindre\` : Participer à un projet existant\n` +
        `• \`/creativite projet contribution\` : Ajouter des tâches et documents\n` +
        `• \`/creativite projet liste\` : Voir les projets actifs`,
    },
    galerie: {
      title: '🖼️ Galerie Communautaire & Vitrine Publique',
      color: 0xd946ef,
      desc:
        `Découvrez et partagez des œuvres avec les membres du serveur.\n\n` +
        `**Commandes disponibles :**\n` +
        `• \`/creativite galerie explorer\` : Voir les œuvres récentes et populaires\n` +
        `• \`/creativite galerie publier\` : Partager une de vos créations validées\n` +
        `• \`/creativite galerie favoris\` : Vos coups de cœur enregistrés`,
    },
  };
  const item = DETAILS[selected] || DETAILS.lecture;
  const embed = new EmbedBuilder()
    .setTitle(item.title)
    .setDescription(item.desc)
    .setColor(item.color)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Pour utiliser une commande, tapez son nom dans le chat.' })
    .setTimestamp();
  return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
