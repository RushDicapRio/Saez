import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  ComponentType,
} from 'discord.js';
import {
  addBookmark,
  getUserBookmarks,
  getBookmarkById,
  updateBookmark,
  deleteBookmark,
  toggleFavorite,
  togglePin,
  toggleArchive,
  recordBookmarkVisit,
  duplicateBookmark,
  createCollection,
  getUserCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  moveBookmark,
  getUserTags,
  addTagToBookmark,
  removeTagFromBookmark,
  findAllDuplicates,
  getRandomBookmarks,
  verifyBookmarkUrl,
  exportUserBookmarks,
  importUserBookmarks,
  getUserBookmarkStats,
  getUserBookmarkQuota,
  getUserBookmarkHistory,
} from '../../services/bookmarkService.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('bookmark')
  .setDescription('Système complet de marque-pages, collections, favoris et partage')
  .addSubcommand((sub) =>
    sub
      .setName('ajouter')
      .setDescription('Enregistrer un nouveau marque-page ou lien utile')
      .addStringOption((opt) => opt.setName('titre').setDescription('Titre du marque-page').setRequired(true))
      .addStringOption((opt) => opt.setName('url').setDescription('URL complète (http://... ou https://...)').setRequired(true))
      .addStringOption((opt) => opt.setName('collection').setDescription('Collection de destination').setRequired(false).setAutocomplete(true))
      .addStringOption((opt) => opt.setName('tags').setDescription('Mots-clés séparés par virgule').setRequired(false))
      .addStringOption((opt) => opt.setName('note').setDescription('Note personnelle privée').setRequired(false))
      .addBooleanOption((opt) => opt.setName('favori').setDescription('Ajouter directement aux favoris').setRequired(false))
      .addBooleanOption((opt) => opt.setName('prive').setDescription('Marque-page privé (défaut : Vrai)').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('liste')
      .setDescription('Afficher la liste de vos marque-pages et favoris')
      .addStringOption((opt) => opt.setName('collection').setDescription('Filtrer par collection').setRequired(false).setAutocomplete(true))
      .addStringOption((opt) =>
        opt
          .setName('filtre')
          .setDescription('Filtre d\'affichage')
          .setRequired(false)
          .addChoices(
            { name: 'Tous les marque-pages actifs', value: 'all' },
            { name: 'Favoris prioritaires uniquement ⭐', value: 'favorites' },
            { name: 'Épinglés 📌', value: 'pinned' },
            { name: 'Archivés 📦', value: 'archived' }
          )
      )
      .addStringOption((opt) =>
        opt
          .setName('tri')
          .setDescription('Ordre de tri')
          .setRequired(false)
          .addChoices(
            { name: 'Plus récents d\'abord', value: 'createdAt' },
            { name: 'Titre alphabétique', value: 'title' },
            { name: 'Plus visités / consultés', value: 'viewCount' }
          )
      )
      .addIntegerOption((opt) => opt.setName('page').setDescription('Numéro de page').setMinValue(1).setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('partager')
      .setDescription('Partager publiquement un de vos favoris dans le salon')
      .addStringOption((opt) => opt.setName('id').setDescription('Identifiant du favori').setRequired(true).setAutocomplete(true))
      .addUserOption((opt) => opt.setName('membre').setDescription('Partager spécifiquement avec un membre').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('supprimer')
      .setDescription('Supprimer définitivement un marque-page de vos favoris')
      .addStringOption((opt) => opt.setName('id').setDescription('Identifiant du favori à supprimer').setRequired(true).setAutocomplete(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('modifier')
      .setDescription('Modifier les informations d\'un marque-page')
      .addStringOption((opt) => opt.setName('id').setDescription('Identifiant du marque-page').setRequired(true).setAutocomplete(true))
      .addStringOption((opt) => opt.setName('titre').setDescription('Nouveau titre').setRequired(false))
      .addStringOption((opt) => opt.setName('url').setDescription('Nouvelle URL').setRequired(false))
      .addStringOption((opt) => opt.setName('description').setDescription('Nouvelle description').setRequired(false))
      .addStringOption((opt) => opt.setName('collection').setDescription('Changer de collection').setRequired(false).setAutocomplete(true))
      .addStringOption((opt) => opt.setName('tags').setDescription('Nouveaux tags (séparés par virgule)').setRequired(false))
      .addStringOption((opt) => opt.setName('note').setDescription('Nouvelle note personnelle').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('details')
      .setDescription('Afficher la fiche technique complète d\'un marque-page')
      .addStringOption((opt) => opt.setName('id').setDescription('Identifiant du marque-page').setRequired(true).setAutocomplete(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('rechercher')
      .setDescription('Recherche multi-critères parmi vos marque-pages')
      .addStringOption((opt) => opt.setName('terme').setDescription('Mot-clé, titre, note ou URL').setRequired(true))
      .addStringOption((opt) => opt.setName('collection').setDescription('Restreindre à une collection').setRequired(false).setAutocomplete(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('ouvrir')
      .setDescription('Accéder directement au lien et incrémenter le compteur de visites')
      .addStringOption((opt) => opt.setName('id').setDescription('Identifiant du marque-page').setRequired(true).setAutocomplete(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('favori')
      .setDescription('Gérer le statut de favori prioritaire ⭐')
      .addStringOption((opt) => opt.setName('id').setDescription('Identifiant du marque-page').setRequired(true).setAutocomplete(true))
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Action à effectuer')
          .setRequired(false)
          .addChoices(
            { name: 'Basculer (Activer/Désactiver)', value: 'toggle' },
            { name: 'Ajouter aux favoris', value: 'add' },
            { name: 'Retirer des favoris', value: 'remove' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('archiver')
      .setDescription('Archiver ou restaurer un marque-page sans le supprimer')
      .addStringOption((opt) => opt.setName('id').setDescription('Identifiant du marque-page').setRequired(true).setAutocomplete(true))
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Action')
          .setRequired(false)
          .addChoices(
            { name: 'Archiver 📦', value: 'archive' },
            { name: 'Restaurer ♻️', value: 'restore' },
            { name: 'Basculer', value: 'toggle' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('epingler')
      .setDescription('Épingler ou désépingler un marque-page important')
      .addStringOption((opt) => opt.setName('id').setDescription('Identifiant du marque-page').setRequired(true).setAutocomplete(true))
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Action')
          .setRequired(false)
          .addChoices(
            { name: 'Épingler 📌', value: 'pin' },
            { name: 'Désépingler', value: 'unpin' },
            { name: 'Basculer', value: 'toggle' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('deplacer')
      .setDescription('Déplacer ou copier un marque-page vers une collection')
      .addStringOption((opt) => opt.setName('id').setDescription('Identifiant du marque-page').setRequired(true).setAutocomplete(true))
      .addStringOption((opt) => opt.setName('collection').setDescription('Collection cible').setRequired(true).setAutocomplete(true))
      .addStringOption((opt) =>
        opt
          .setName('mode')
          .setDescription('Déplacer ou copier')
          .setRequired(false)
          .addChoices({ name: 'Déplacer (Move)', value: 'move' }, { name: 'Copier (Copy)', value: 'copy' })
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('dupliquer')
      .setDescription('Créer un doublon volontaire d\'un marque-page')
      .addStringOption((opt) => opt.setName('id').setDescription('Identifiant du marque-page source').setRequired(true).setAutocomplete(true))
      .addStringOption((opt) => opt.setName('nouveau_titre').setDescription('Titre du duplicata').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('aleatoire')
      .setDescription('Tirer au sort un ou plusieurs marque-pages de votre collection')
      .addIntegerOption((opt) => opt.setName('nombre').setDescription('Nombre de liens à tirer (1 à 10)').setMinValue(1).setMaxValue(10).setRequired(false))
      .addStringOption((opt) => opt.setName('collection').setDescription('Dans une collection précise').setRequired(false).setAutocomplete(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('note')
      .setDescription('Consulter, ajouter ou modifier une note personnelle privée')
      .addStringOption((opt) => opt.setName('id').setDescription('Identifiant du marque-page').setRequired(true).setAutocomplete(true))
      .addStringOption((opt) => opt.setName('texte').setDescription('Nouvelle note personnelle').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('exporter')
      .setDescription('Exporter tous vos marque-pages en fichier JSON ou CSV')
      .addStringOption((opt) =>
        opt.setName('format').setDescription('Format de fichier').setRequired(false).addChoices({ name: 'JSON (.json)', value: 'json' }, { name: 'CSV (.csv)', value: 'csv' })
      )
      .addBooleanOption((opt) => opt.setName('uniquement_favoris').setDescription('Exporter seulement les favoris').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('importer')
      .setDescription('Importer des marque-pages depuis un fichier JSON')
      .addAttachmentOption((opt) => opt.setName('fichier').setDescription('Fichier JSON de sauvegarde').setRequired(true))
      .addStringOption((opt) =>
        opt
          .setName('doublons')
          .setDescription('Comportement face aux URLs déjà existantes')
          .setRequired(false)
          .addChoices({ name: 'Ignorer les doublons (défaut)', value: 'ignore' }, { name: 'Importer quand même (créer doublon)', value: 'add' })
      )
  )
  .addSubcommand((sub) =>
    sub.setName('statistiques').setDescription('Consulter vos statistiques complètes d\'utilisation des marque-pages')
  )
  .addSubcommand((sub) =>
    sub
      .setName('verifier')
      .setDescription('Tester la disponibilité HTTP/HTTPS d\'un marque-page')
      .addStringOption((opt) => opt.setName('id').setDescription('Identifiant du lien à tester').setRequired(true).setAutocomplete(true))
  )
  .addSubcommand((sub) =>
    sub.setName('doublons').setDescription('Rechercher les liens et URLs en double dans votre collection')
  )
  .addSubcommand((sub) =>
    sub
      .setName('historique')
      .setDescription('Consulter l\'historique d\'audit de vos actions sur les marque-pages')
      .addIntegerOption((opt) => opt.setName('limite').setDescription('Nombre d\'entrées (1 à 25)').setMinValue(1).setMaxValue(25).setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('parametres')
      .setDescription('Consulter vos quotas de stockage et préférences personnelles')
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Affichage')
          .setRequired(false)
          .addChoices({ name: 'Quotas de stockage', value: 'quota' }, { name: 'Préférences générales', value: 'prefs' })
      )
  )
  .addSubcommand((sub) =>
    sub.setName('aide').setDescription('Guide d\'utilisation complet et documentation du module Bookmark')
  )
  .addSubcommandGroup((grp) =>
    grp
      .setName('collection')
      .setDescription('Organisation et gestion de vos collections thématiques')
      .addSubcommand((sub) =>
        sub
          .setName('creer')
          .setDescription('Créer une nouvelle collection de marque-pages')
          .addStringOption((opt) => opt.setName('nom').setDescription('Nom de la collection').setRequired(true))
          .addStringOption((opt) => opt.setName('description').setDescription('Description facultative').setRequired(false))
          .addStringOption((opt) => opt.setName('emoji').setDescription('Emoji de la collection (ex: 🎬, 📚, 💻)').setRequired(false))
      )
      .addSubcommand((sub) =>
        sub.setName('liste').setDescription('Afficher la liste de vos collections et leur contenu')
      )
      .addSubcommand((sub) =>
        sub
          .setName('modifier')
          .setDescription('Modifier une collection existante')
          .addStringOption((opt) => opt.setName('id').setDescription('Identifiant de la collection').setRequired(true).setAutocomplete(true))
          .addStringOption((opt) => opt.setName('nom').setDescription('Nouveau nom').setRequired(false))
          .addStringOption((opt) => opt.setName('description').setDescription('Nouvelle description').setRequired(false))
          .addStringOption((opt) => opt.setName('emoji').setDescription('Nouvel emoji').setRequired(false))
      )
      .addSubcommand((sub) =>
        sub
          .setName('supprimer')
          .setDescription('Supprimer une collection')
          .addStringOption((opt) => opt.setName('id').setDescription('Identifiant de la collection').setRequired(true).setAutocomplete(true))
          .addBooleanOption((opt) => opt.setName('supprimer_liens').setDescription('Supprimer aussi tous les liens qu\'elle contient ?').setRequired(false))
      )
      .addSubcommand((sub) =>
        sub
          .setName('ajouter')
          .setDescription('Ajouter un marque-page à une collection')
          .addStringOption((opt) => opt.setName('id').setDescription('Identifiant du marque-page').setRequired(true).setAutocomplete(true))
          .addStringOption((opt) => opt.setName('collection_id').setDescription('Identifiant de la collection').setRequired(true).setAutocomplete(true))
      )
      .addSubcommand((sub) =>
        sub
          .setName('retirer')
          .setDescription('Retirer un marque-page de sa collection actuelle')
          .addStringOption((opt) => opt.setName('id').setDescription('Identifiant du marque-page').setRequired(true).setAutocomplete(true))
      )
  )
  .addSubcommandGroup((grp) =>
    grp
      .setName('tag')
      .setDescription('Classement et filtrage par tags et mots-clés')
      .addSubcommand((sub) =>
        sub.setName('liste').setDescription('Afficher tous vos tags avec le nombre de liens associés')
      )
      .addSubcommand((sub) =>
        sub
          .setName('ajouter')
          .setDescription('Ajouter un tag à un marque-page existant')
          .addStringOption((opt) => opt.setName('id').setDescription('Identifiant du marque-page').setRequired(true).setAutocomplete(true))
          .addStringOption((opt) => opt.setName('tag').setDescription('Nom du tag à ajouter').setRequired(true))
      )
      .addSubcommand((sub) =>
        sub
          .setName('retirer')
          .setDescription('Retirer un tag d\'un marque-page')
          .addStringOption((opt) => opt.setName('id').setDescription('Identifiant du marque-page').setRequired(true).setAutocomplete(true))
          .addStringOption((opt) => opt.setName('tag').setDescription('Nom du tag à retirer').setRequired(true).setAutocomplete(true))
      )
      .addSubcommand((sub) =>
        sub
          .setName('filtrer')
          .setDescription('Afficher tous les marque-pages associés à un tag')
          .addStringOption((opt) => opt.setName('tag').setDescription('Tag à rechercher').setRequired(true).setAutocomplete(true))
      )
  );
export async function autocomplete(interaction) {
  try {
    const focused = interaction.options.getFocused(true);
    const userId = interaction.user.id;
    const query = focused.value?.toLowerCase() || '';
    if (focused.name === 'id') {
      const list = await getUserBookmarks(userId, { limit: 25 });
      const filtered = list.filter((b) => {
        return (
          b._id.toLowerCase().includes(query) ||
          b.title.toLowerCase().includes(query) ||
          (b.tags && b.tags.some((t) => t.includes(query)))
        );
      });
      const choices = filtered.slice(0, 25).map((b) => {
        const star = b.isFavorite ? '⭐ ' : '';
        const pin = b.isPinned ? '📌 ' : '';
        const name = `${pin}${star}${b.title}`.slice(0, 95);
        return { name, value: b._id };
      });
      return await interaction.respond(choices);
    }
    if (focused.name === 'collection' || focused.name === 'collection_id') {
      const collections = await getUserCollections(userId);
      const filtered = collections.filter(
        (c) => c._id.toLowerCase().includes(query) || c.name.toLowerCase().includes(query)
      );
      const choices = filtered.slice(0, 25).map((c) => ({
        name: `${c.emoji || '📁'} ${c.name} (${c.count || 0})`.slice(0, 95),
        value: c._id,
      }));
      return await interaction.respond(choices);
    }
    if (focused.name === 'tag') {
      const tags = await getUserTags(userId);
      const filtered = tags.filter((t) => t.tag.toLowerCase().includes(query));
      const choices = filtered.slice(0, 25).map((t) => ({
        name: `#${t.tag} (${t.count} lien${t.count > 1 ? 's' : ''})`.slice(0, 95),
        value: t.tag,
      }));
      return await interaction.respond(choices);
    }
  } catch {}
}
export async function execute(interaction) {
  const group = interaction.options.getSubcommandGroup(false);
  const sub = interaction.options.getSubcommand();
  const userId = interaction.user.id;
  if (group === 'collection') {
    if (sub === 'creer') {
      const name = interaction.options.getString('nom');
      const desc = interaction.options.getString('description') || '';
      const emoji = interaction.options.getString('emoji') || '📁';
      try {
        const col = await createCollection(userId, { name, description: desc, emoji });
        const embed = new EmbedBuilder()
          .setTitle('📁 Collection Créée !')
          .setDescription(`Votre collection **${col.emoji} ${col.name}** a été créée avec succès.`)
          .setColor(config.colors?.success || 0x10b981)
          .addFields(
            { name: '🆔 Identifiant', value: `\`${col._id}\``, inline: true },
            { name: '📝 Description', value: col.description || '*Aucune*', inline: true }
          )
          .setFooter({ text: 'Codé avec ❤️ par Saez | Ajoutez-y des liens avec : /bookmark collection ajouter' });
        return interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (err) {
        return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
      }
    }
    if (sub === 'liste') {
      const collections = await getUserCollections(userId);
      const embed = new EmbedBuilder()
        .setTitle(`📁 Vos Collections Personnelles (${collections.length})`)
        .setColor(config.colors?.primary || 0x00e5ff)
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (collections.length === 0) {
        embed.setDescription('Vous n\'avez encore créé aucune collection.\nUtilisez `/bookmark collection creer` pour commencer à organiser vos marque-pages !');
      } else {
        for (const c of collections.slice(0, 15)) {
          embed.addFields({
            name: `${c.emoji || '📁'} ${c.name} — ${c.count || 0} lien(s)`,
            value: `> 🆔 ID : \`${c._id}\`\n> ${c.description || '*Aucune description*'}\n> 💡 *Voir les liens : \`/bookmark liste collection:${c._id}\`*`,
            inline: false,
          });
        }
      }
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    if (sub === 'modifier') {
      const colId = interaction.options.getString('id');
      const name = interaction.options.getString('nom');
      const desc = interaction.options.getString('description');
      const emoji = interaction.options.getString('emoji');
      const updates = {};
      if (name) updates.name = name;
      if (desc !== null) updates.description = desc;
      if (emoji) updates.emoji = emoji;
      const res = await updateCollection(userId, colId, updates);
      if (!res.success) {
        return interaction.reply({ content: `❌ ${res.message}`, ephemeral: true });
      }
      return interaction.reply({
        content: `✅ La collection **${res.collection.emoji} ${res.collection.name}** a été mise à jour.`,
        ephemeral: true,
      });
    }
    if (sub === 'supprimer') {
      const colId = interaction.options.getString('id');
      const delLinks = interaction.options.getBoolean('supprimer_liens') || false;
      const res = await deleteCollection(userId, colId, delLinks);
      if (!res.success) {
        return interaction.reply({ content: `❌ ${res.message}`, ephemeral: true });
      }
      return interaction.reply({
        content: `🗑️ La collection a été supprimée.${delLinks ? ' Tous ses marque-pages ont également été supprimés.' : ' Ses marque-pages ont été conservés dans votre bibliothèque générale.'}`,
        ephemeral: true,
      });
    }
    if (sub === 'ajouter') {
      const bmId = interaction.options.getString('id');
      const colId = interaction.options.getString('collection_id');
      const res = await moveBookmark(userId, bmId, colId, false);
      if (!res.success) {
        return interaction.reply({ content: `❌ ${res.message}`, ephemeral: true });
      }
      return interaction.reply({
        content: `✅ Le marque-page a été ajouté à la collection.`,
        ephemeral: true,
      });
    }
    if (sub === 'retirer') {
      const bmId = interaction.options.getString('id');
      const res = await moveBookmark(userId, bmId, null, false);
      if (!res.success) {
        return interaction.reply({ content: `❌ ${res.message}`, ephemeral: true });
      }
      return interaction.reply({
        content: `✅ Le marque-page a été retiré de sa collection.`,
        ephemeral: true,
      });
    }
  }
  if (group === 'tag') {
    if (sub === 'liste') {
      const tags = await getUserTags(userId);
      const embed = new EmbedBuilder()
        .setTitle(`🏷️ Vos Tags Personnels (${tags.length})`)
        .setColor(config.colors?.primary || 0x00e5ff)
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (tags.length === 0) {
        embed.setDescription('Aucun tag n\'est encore utilisé dans vos marque-pages.\nAjoutez des tags lors de la création d\'un lien ou via `/bookmark tag ajouter` !');
      } else {
        const text = tags.map((t) => `• \`#${t.tag}\` : **${t.count}** ressource${t.count > 1 ? 's' : ''}`).join('\n');
        embed.setDescription(text.slice(0, 4000));
      }
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    if (sub === 'ajouter') {
      const bmId = interaction.options.getString('id');
      const tag = interaction.options.getString('tag');
      const updated = await addTagToBookmark(userId, bmId, tag);
      if (!updated) {
        return interaction.reply({ content: '❌ Marque-page introuvable.', ephemeral: true });
      }
      return interaction.reply({
        content: `✅ Le tag \`#${tag.toLowerCase().trim()}\` a été ajouté au marque-page.`,
        ephemeral: true,
      });
    }
    if (sub === 'retirer') {
      const bmId = interaction.options.getString('id');
      const tag = interaction.options.getString('tag');
      const updated = await removeTagFromBookmark(userId, bmId, tag);
      if (!updated) {
        return interaction.reply({ content: '❌ Marque-page introuvable.', ephemeral: true });
      }
      return interaction.reply({
        content: `✅ Le tag \`#${tag.toLowerCase().trim()}\` a été retiré.`,
        ephemeral: true,
      });
    }
    if (sub === 'filtrer') {
      const tag = interaction.options.getString('tag');
      const list = await getUserBookmarks(userId, { tag });
      const embed = new EmbedBuilder()
        .setTitle(`🏷️ Marque-pages avec le tag #${tag} (${list.length})`)
        .setColor(config.colors?.primary || 0x00e5ff)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (list.length === 0) {
        embed.setDescription(`Aucun marque-page n'est associé au tag \`#${tag}\`.`);
      } else {
        for (const bm of list.slice(0, 15)) {
          embed.addFields({
            name: `${bm.isFavorite ? '⭐ ' : ''}${bm.title}`,
            value: `🔗 [Ouvrir le lien](${bm.url}) • ID : \`${bm._id}\``,
          });
        }
      }
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
  if (sub === 'ajouter') {
    const title = interaction.options.getString('titre');
    const url = interaction.options.getString('url');
    const colId = interaction.options.getString('collection');
    const tagsRaw = interaction.options.getString('tags') || '';
    const note = interaction.options.getString('note') || '';
    const isFav = interaction.options.getBoolean('favori') || false;
    const isPriv = interaction.options.getBoolean('prive') !== false;
    const tags = tagsRaw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    try {
      const bookmark = await addBookmark(userId, {
        title,
        url,
        collectionId: colId,
        tags,
        note,
        isFavorite: isFav,
        isPrivate: isPriv,
      });
      const embed = new EmbedBuilder()
        .setTitle('🔖 Marque-Page Enregistré !')
        .setDescription(`Votre lien a été sauvegardé en privé avec succès.\n\n📌 **${bookmark.title}**\n🔗 [${bookmark.url}](${bookmark.url})\n\n🆔 Identifiant : \`${bookmark._id}\``)
        .setColor(config.colors?.success || 0x10b981)
        .addFields(
          { name: '🏷️ Type', value: `\`${bookmark.contentType}\``, inline: true },
          { name: '⭐ Favori', value: bookmark.isFavorite ? 'Oui' : 'Non', inline: true },
          { name: '🔖 Tags', value: tags.length ? tags.map((t) => `\`#${t}\``).join(' ') : '*Aucun*', inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Consulter tous vos favoris : /bookmark liste' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      if (err.code === 'DUPLICATE_URL') {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`btn_bm_open_${err.existing._id}`)
            .setLabel('Ouvrir l\'existant')
            .setStyle(ButtonStyle.Link)
            .setURL(err.existing.url),
          new ButtonBuilder()
            .setCustomId(`btn_bm_dup_confirm_${Date.now()}`)
            .setLabel('Forcer l\'ajout en doublon')
            .setStyle(ButtonStyle.Secondary)
        );
        return interaction.reply({
          content: `⚠️ **Lien déjà enregistré !**\nCe lien figure déjà dans vos marque-pages : **${err.existing.title}** (ID : \`${err.existing._id}\`).`,
          components: [row],
          ephemeral: true,
        });
      }
      return interaction.reply({ content: `❌ Erreur : ${err.message}`, ephemeral: true });
    }
  }
  if (sub === 'liste') {
    await interaction.deferReply({ ephemeral: true });
    const colFilter = interaction.options.getString('collection');
    const filtre = interaction.options.getString('filtre') || 'all';
    const sortBy = interaction.options.getString('tri') || 'createdAt';
    let page = interaction.options.getInteger('page') || 1;
    const pageSize = 10;
    const fetchBookmarks = async (p) => {
      return await getUserBookmarks(userId, {
        collectionId: colFilter,
        filter: filtre,
        sortBy,
        page: p,
        limit: pageSize,
      });
    };
    const bookmarks = await fetchBookmarks(page);
    const buildListEmbed = (list, p) => {
      const embed = new EmbedBuilder()
        .setTitle(`📑 Vos Marque-Pages & Favoris (${list.length})`)
        .setColor(config.colors?.primary || 0x00e5ff)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Pour ouvrir un lien : /bookmark ouvrir <id> • Partager : /bookmark partager <id>' })
        .setTimestamp();
      if (list.length === 0) {
        embed.setDescription('Aucun marque-page ne correspond à vos critères de recherche.\nUtilisez `/bookmark ajouter` pour en enregistrer un nouveau !');
      } else {
        for (const bm of list) {
          const star = bm.isFavorite ? '⭐ ' : '';
          const pin = bm.isPinned ? '📌 ' : '';
          const tagText = bm.tags?.length ? ` • Tags: \`${bm.tags.join(', ')}\`` : '';
          const views = bm.viewCount ? ` • 👁️ ${bm.viewCount}` : '';
          embed.addFields({
            name: `${pin}${star}${bm.title} (ID: \`${bm._id}\`)`,
            value: `🔗 [Ouvrir le lien](${bm.url})${tagText}${views}`,
            inline: false,
          });
        }
      }
      return embed;
    };
    return interaction.editReply({ embeds: [buildListEmbed(bookmarks, page)] });
  }
  if (sub === 'partager') {
    const bmId = interaction.options.getString('id');
    const targetMember = interaction.options.getUser('membre');
    const bookmark = await getBookmarkById(userId, bmId, false);
    if (!bookmark) {
      return interaction.reply({ content: '❌ Marque-page introuvable dans votre collection.', ephemeral: true });
    }
    const embed = new EmbedBuilder()
      .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .setTitle(`🔗 Lien Partagé : ${bookmark.title}`)
      .setDescription(`[Accéder à la ressource](${bookmark.url})\n\n${bookmark.url}`)
      .setColor(config.colors?.primary || 0x00e5ff)
      .addFields(
        { name: '🏷️ Type', value: `\`${bookmark.contentType}\``, inline: true },
        { name: '🔖 Tags', value: bookmark.tags?.length ? bookmark.tags.map((t) => `\`#${t}\``).join(' ') : '*Aucun*', inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Partagé via Saez Bookmarks' })
      .setTimestamp();
    if (bookmark.description) {
      embed.setDescription(`${bookmark.description}\n\n👉 [Ouvrir le lien](${bookmark.url})\n${bookmark.url}`);
    }
    if (targetMember) {
      return interaction.reply({
        content: `📨 Ce marque-page est partagé à l'attention de <@${targetMember.id}> :`,
        embeds: [embed],
      });
    }
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'supprimer') {
    const bmId = interaction.options.getString('id');
    const ok = await deleteBookmark(userId, bmId);
    if (!ok) {
      return interaction.reply({ content: '❌ Marque-page introuvable ou déjà supprimé.', ephemeral: true });
    }
    return interaction.reply({
      content: `🗑️ Le marque-page \`${bmId}\` a été supprimé de votre collection.`,
      ephemeral: true,
    });
  }
  if (sub === 'modifier') {
    const bmId = interaction.options.getString('id');
    const title = interaction.options.getString('titre');
    const url = interaction.options.getString('url');
    const desc = interaction.options.getString('description');
    const colId = interaction.options.getString('collection');
    const tagsRaw = interaction.options.getString('tags');
    const note = interaction.options.getString('note');
    const updates = {};
    if (title) updates.title = title;
    if (url) updates.url = url;
    if (desc !== null) updates.description = desc;
    if (colId !== null) updates.collectionId = colId;
    if (tagsRaw !== null) updates.tags = tagsRaw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (note !== null) updates.note = note;
    const res = await updateBookmark(userId, bmId, updates);
    if (!res.success) {
      return interaction.reply({ content: `❌ ${res.message}`, ephemeral: true });
    }
    return interaction.reply({
      content: `✅ Le marque-page **${res.bookmark.title}** a été mis à jour avec succès.`,
      ephemeral: true,
    });
  }
  if (sub === 'details') {
    const bmId = interaction.options.getString('id');
    const bm = await getBookmarkById(userId, bmId, true);
    if (!bm) {
      return interaction.reply({ content: '❌ Marque-page introuvable.', ephemeral: true });
    }
    const embed = new EmbedBuilder()
      .setTitle(`🔍 Détails : ${bm.title}`)
      .setDescription(`🔗 **Lien :** [${bm.url}](${bm.url})\n\n${bm.description ? `*${bm.description}*\n` : ''}`)
      .setColor(config.colors?.primary || 0x00e5ff)
      .addFields(
        { name: '🆔 Identifiant', value: `\`${bm._id}\``, inline: true },
        { name: '📁 Type de Ressource', value: `\`${bm.contentType || 'site'}\``, inline: true },
        { name: '⭐ Favori', value: bm.isFavorite ? 'Oui' : 'Non', inline: true },
        { name: '📌 Épinglé', value: bm.isPinned ? 'Oui' : 'Non', inline: true },
        { name: '📦 Archivé', value: bm.isArchived ? 'Oui' : 'Non', inline: true },
        { name: '👁️ Visites', value: `${bm.viewCount || 0}`, inline: true },
        { name: '🏷️ Tags', value: bm.tags?.length ? bm.tags.map((t) => `\`#${t}\``).join(' ') : '*Aucun*', inline: false },
        { name: '📅 Date d\'ajout', value: bm.createdAt ? new Date(bm.createdAt).toLocaleString('fr-FR') : 'Inconnue', inline: true },
        { name: '🌐 Statut HTTP', value: bm.httpStatus ? `\`${bm.httpStatus}\`` : '*Non testé*', inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (bm.userId === userId && bm.note) {
      embed.addFields({ name: '🔒 Note Privée (Strictement Confidentielle)', value: bm.note, inline: false });
    }
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Ouvrir le lien').setURL(bm.url),
      new ButtonBuilder().setCustomId(`btn_fav_toggle_${bm._id}`).setLabel(bm.isFavorite ? 'Retirer Favori' : 'Mettre Favori').setStyle(ButtonStyle.Secondary)
    );
    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
  if (sub === 'rechercher') {
    const term = interaction.options.getString('terme');
    const colId = interaction.options.getString('collection');
    const results = await getUserBookmarks(userId, { search: term, collectionId: colId });
    const embed = new EmbedBuilder()
      .setTitle(`🔍 Recherche pour "${term}" (${results.length} résultat${results.length > 1 ? 's' : ''})`)
      .setColor(config.colors?.primary || 0x00e5ff)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (results.length === 0) {
      embed.setDescription('Aucun marque-page ne correspond à vos termes de recherche.');
    } else {
      for (const bm of results.slice(0, 15)) {
        embed.addFields({
          name: `${bm.isFavorite ? '⭐ ' : ''}${bm.title}`,
          value: `🔗 [Accéder](${bm.url}) • ID : \`${bm._id}\``,
        });
      }
    }
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (sub === 'ouvrir') {
    const bmId = interaction.options.getString('id');
    const bm = await getBookmarkById(userId, bmId, true);
    if (!bm) {
      return interaction.reply({ content: '❌ Marque-page introuvable.', ephemeral: true });
    }
    const newViews = await recordBookmarkVisit(userId, bmId);
    const embed = new EmbedBuilder()
      .setTitle(`🔗 ${bm.title}`)
      .setDescription(`[Cliquer ici pour ouvrir le lien](${bm.url})\n\n${bm.url}`)
      .setColor(config.colors?.primary || 0x00e5ff)
      .setFooter({ text: `Codé avec ❤️ par Saez | Consulté ${newViews} fois` });
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (sub === 'favori') {
    const bmId = interaction.options.getString('id');
    const action = interaction.options.getString('action') || 'toggle';
    let force = null;
    if (action === 'add') force = true;
    if (action === 'remove') force = false;
    const res = await toggleFavorite(userId, bmId, force);
    if (res === null) {
      return interaction.reply({ content: '❌ Marque-page introuvable.', ephemeral: true });
    }
    return interaction.reply({
      content: res ? '⭐ Marque-page ajouté à vos favoris prioritaires !' : 'Marque-page retiré de vos favoris prioritaires.',
      ephemeral: true,
    });
  }
  if (sub === 'archiver') {
    const bmId = interaction.options.getString('id');
    const action = interaction.options.getString('action') || 'toggle';
    let force = null;
    if (action === 'archive') force = true;
    if (action === 'restore') force = false;
    const res = await toggleArchive(userId, bmId, force);
    if (res === null) {
      return interaction.reply({ content: '❌ Marque-page introuvable.', ephemeral: true });
    }
    return interaction.reply({
      content: res ? '📦 Marque-page archivé (masqué de votre liste principale).' : '♻️ Marque-page restauré dans vos liens actifs.',
      ephemeral: true,
    });
  }
  if (sub === 'epingler') {
    const bmId = interaction.options.getString('id');
    const action = interaction.options.getString('action') || 'toggle';
    let force = null;
    if (action === 'pin') force = true;
    if (action === 'unpin') force = false;
    const res = await togglePin(userId, bmId, force);
    if (res === null) {
      return interaction.reply({ content: '❌ Marque-page introuvable.', ephemeral: true });
    }
    return interaction.reply({
      content: res ? '📌 Marque-page épinglé en haut de liste !' : 'Marque-page désépinglé.',
      ephemeral: true,
    });
  }
  if (sub === 'deplacer') {
    const bmId = interaction.options.getString('id');
    const targetCol = interaction.options.getString('collection');
    const mode = interaction.options.getString('mode') || 'move';
    const res = await moveBookmark(userId, bmId, targetCol, mode === 'copy');
    if (!res.success) {
      return interaction.reply({ content: `❌ ${res.message}`, ephemeral: true });
    }
    return interaction.reply({
      content: mode === 'copy' ? '📋 Le marque-page a été copié dans la collection cible.' : '🚚 Le marque-page a été déplacé vers la collection cible.',
      ephemeral: true,
    });
  }
  if (sub === 'dupliquer') {
    const bmId = interaction.options.getString('id');
    const customTitle = interaction.options.getString('nouveau_titre');
    const copy = await duplicateBookmark(userId, bmId, customTitle);
    if (!copy) {
      return interaction.reply({ content: '❌ Marque-page source introuvable.', ephemeral: true });
    }
    return interaction.reply({
      content: `📋 Duplicata créé avec succès : **${copy.title}** (Nouvel ID : \`${copy._id}\`).`,
      ephemeral: true,
    });
  }
  if (sub === 'aleatoire') {
    const count = interaction.options.getInteger('nombre') || 1;
    const colId = interaction.options.getString('collection');
    const picks = await getRandomBookmarks(userId, count, colId);
    if (picks.length === 0) {
      return interaction.reply({ content: '❌ Aucun marque-page disponible pour le tirage au sort.', ephemeral: true });
    }
    const embed = new EmbedBuilder()
      .setTitle(`🎲 Tirage Aléatoire (${picks.length})`)
      .setColor(config.colors?.primary || 0x00e5ff)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    for (const p of picks) {
      embed.addFields({
        name: `🎯 ${p.title}`,
        value: `🔗 [Ouvrir le lien](${p.url}) • ID : \`${p._id}\``,
      });
    }
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (sub === 'note') {
    const bmId = interaction.options.getString('id');
    const text = interaction.options.getString('texte');
    const bm = await getBookmarkById(userId, bmId, false);
    if (!bm) {
      return interaction.reply({ content: '❌ Marque-page introuvable.', ephemeral: true });
    }
    if (text !== null) {
      await updateBookmark(userId, bmId, { note: text });
      return interaction.reply({ content: '🔒 Note personnelle privée enregistrée avec succès.', ephemeral: true });
    }
    const embed = new EmbedBuilder()
      .setTitle(`🔒 Note Privée : ${bm.title}`)
      .setDescription(bm.note ? bm.note : '*Aucune note enregistrée pour ce marque-page.*')
      .setColor(config.colors?.primary || 0x00e5ff)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Visible exclusivement par vous' });
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (sub === 'exporter') {
    await interaction.deferReply({ ephemeral: true });
    const format = interaction.options.getString('format') || 'json';
    const onlyFav = interaction.options.getBoolean('uniquement_favoris') || false;
    const exported = await exportUserBookmarks(userId, { format, onlyFavorites: onlyFav });
    const attachment = new AttachmentBuilder(exported.data, { name: exported.filename });
    return interaction.editReply({
      content: `📦 Voici l'export complet de vos marque-pages (${exported.count} ressources) au format \`.${format}\` :`,
      files: [attachment],
    });
  }
  if (sub === 'importer') {
    await interaction.deferReply({ ephemeral: true });
    const attachment = interaction.options.getAttachment('fichier');
    const dupChoice = interaction.options.getString('doublons') || 'ignore';
    if (!attachment.name.endsWith('.json')) {
      return interaction.editReply({ content: '❌ Le fichier doit être au format JSON (.json).' });
    }
    try {
      const response = await fetch(attachment.url);
      const buffer = Buffer.from(await response.arrayBuffer());
      const res = await importUserBookmarks(userId, buffer, { onDuplicate: dupChoice });
      return interaction.editReply({
        content: `✅ Importation réussie ! **${res.importedCount}** marque-pages importés (${res.skippedCount} ignorés ou doublons).`,
      });
    } catch (err) {
      return interaction.editReply({ content: `❌ Échec de l'importation : ${err.message}` });
    }
  }
  if (sub === 'statistiques') {
    const stats = await getUserBookmarkStats(userId);
    const embed = new EmbedBuilder()
      .setTitle(`📊 Vos Statistiques Marque-Pages`)
      .setColor(config.colors?.primary || 0x00e5ff)
      .addFields(
        { name: '📚 Total Liens', value: `${stats.total}`, inline: true },
        { name: '⭐ Favoris', value: `${stats.favorites}`, inline: true },
        { name: '📁 Collections', value: `${stats.collectionsCount}`, inline: true },
        { name: '📌 Épinglés', value: `${stats.pinned}`, inline: true },
        { name: '📦 Archivés', value: `${stats.archived}`, inline: true },
        { name: '🏷️ Tags Actifs', value: `${stats.topTags.length}`, inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (stats.mostVisited.length > 0) {
      embed.addFields({
        name: '🔥 Liens les plus consultés',
        value: stats.mostVisited.map((b) => `• [${b.title}](${b.url}) — **${b.viewCount || 0}** visites`).join('\n'),
      });
    }
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (sub === 'verifier') {
    await interaction.deferReply({ ephemeral: true });
    const bmId = interaction.options.getString('id');
    const res = await verifyBookmarkUrl(userId, bmId);
    if (!res.success) {
      return interaction.editReply({ content: `❌ ${res.message}` });
    }
    const embed = new EmbedBuilder()
      .setTitle(res.accessible ? '🟢 Lien Accessible et Opérationnel' : '🔴 Lien Potentiellement Inaccessible')
      .setDescription(`URL testée : [${res.url}](${res.url})`)
      .setColor(res.accessible ? 0x10b981 : 0xef4444)
      .addFields(
        { name: 'Code HTTP Réponse', value: `\`${res.status || 'Erreur réseau/Timeout'}\``, inline: true },
        { name: 'Disponibilité', value: res.accessible ? '✅ En ligne' : '⚠️ Non joignable', inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Vérification sécurisée anti-SSRF effectuée' });
    return interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'doublons') {
    const dups = await findAllDuplicates(userId);
    const embed = new EmbedBuilder()
      .setTitle(`🔍 Analyse des Liens en Double (${dups.length})`)
      .setColor(config.colors?.primary || 0x00e5ff)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (dups.length === 0) {
      embed.setDescription('✅ Aucun doublon détecté ! Tous vos marque-pages possèdent des URLs distinctes.');
    } else {
      for (const d of dups.slice(0, 10)) {
        embed.addFields({
          name: `🔗 ${d.duplicate.title}`,
          value: `> URL : [${d.duplicate.url}](${d.duplicate.url})\n> Identique à : \`${d.original.title}\` (ID: \`${d.original._id}\`)`,
        });
      }
    }
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (sub === 'historique') {
    const limit = interaction.options.getInteger('limite') || 10;
    const history = await getUserBookmarkHistory(userId, limit);
    const embed = new EmbedBuilder()
      .setTitle(`📜 Journal d'Activité de vos Marque-Pages`)
      .setColor(config.colors?.primary || 0x00e5ff)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (history.length === 0) {
      embed.setDescription('Aucune activité récente enregistrée.');
    } else {
      for (const h of history) {
        const dateStr = new Date(h.timestamp).toLocaleString('fr-FR');
        embed.addFields({
          name: `${h.action} — ${dateStr}`,
          value: `> ${h.details || 'Action exécutée.'}`,
        });
      }
    }
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (sub === 'parametres') {
    const quota = await getUserBookmarkQuota(userId);
    const embed = new EmbedBuilder()
      .setTitle('⚙️ Vos Quotas et Paramètres Bookmark')
      .setColor(config.colors?.primary || 0x00e5ff)
      .addFields(
        {
          name: '📚 Quota de Marque-Pages',
          value: `**${quota.usedBookmarks}** / ${quota.maxBookmarks} liens (${quota.percentBookmarks}%)\n\`[${'■'.repeat(Math.round(quota.percentBookmarks / 10))}${' '.repeat(10 - Math.round(quota.percentBookmarks / 10))}]\``,
          inline: false,
        },
        {
          name: '📁 Quota de Collections',
          value: `**${quota.usedCollections}** / ${quota.maxCollections} collections (${quota.percentCollections}%)\n\`[${'■'.repeat(Math.round(quota.percentCollections / 10))}${' '.repeat(10 - Math.round(quota.percentCollections / 10))}]\``,
          inline: false,
        }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes Bookmark Engine • Sauvegarde Cloud Automatique' });
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (sub === 'aide') {
    const embed = new EmbedBuilder()
      .setTitle('📖 Guide Complet du Système de Marque-Pages')
      .setDescription(
        'Bienvenue sur le module de marque-pages officiel de **Saez Animes** ! Ce système vous permet de conserver, classer et retrouver n\'importe quel lien ou ressource utile en toute sécurité.\n\n' +
        '### 📌 Commandes Principales\n' +
        '• `/bookmark ajouter` : Enregistrer un nouveau lien avec titre, collection, tags et note privée.\n' +
        '• `/bookmark liste` : Consulter vos favoris avec filtres (favoris, épinglés, archivés) et tri.\n' +
        '• `/bookmark ouvrir <id>` : Ouvrir directement un lien et incrémenter vos statistiques.\n' +
        '• `/bookmark rechercher <terme>` : Recherche instantanée dans vos liens, tags et notes.\n' +
        '• `/bookmark partager <id>` : Partager publiquement une ressource dans le salon.\n\n' +
        '### 📁 Collections Thématiques\n' +
        '• `/bookmark collection creer` : Créer une collection (ex: 🎬 Animes, 💻 Dev, 📚 Études).\n' +
        '• `/bookmark collection liste` : Afficher vos collections et le nombre de liens.\n' +
        '• `/bookmark deplacer <id> <collection>` : Déplacer ou copier un lien vers une collection.\n\n' +
        '### 🏷️ Tags & Organisation\n' +
        '• `/bookmark tag liste` : Voir tous vos tags et leur utilisation.\n' +
        '• `/bookmark favori <id>` : Basculer un marque-page en favori prioritaire ⭐.\n' +
        '• `/bookmark epingler <id>` : Épingler un marque-page en tête de liste 📌.\n' +
        '• `/bookmark archiver <id>` : Archiver un lien sans le supprimer 📦.\n\n' +
        '### 🛠️ Outils Avancés\n' +
        '• `/bookmark verifier <id>` : Tester la validité HTTP/HTTPS du lien avec protection anti-SSRF.\n' +
        '• `/bookmark doublons` : Détecter et nettoyer les liens en double.\n' +
        '• `/bookmark exporter` : Télécharger tous vos marque-pages en format JSON ou CSV.\n' +
        '• `/bookmark importer` : Importer une sauvegarde JSON externe.\n' +
        '• `/bookmark statistiques` : Consulter vos métriques de consultation.'
      )
      .setColor(config.colors?.primary || 0x00e5ff)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Toutes vos données sont stockées de façon sécurisée et isolée par utilisateur.' });
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
export default { data, execute, autocomplete };
