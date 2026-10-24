import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';
import {
  getList,
  saveList,
  deleteList,
} from '../../services/automationService.js';
import { getDb } from '../../database/mongo.js';
export default {
  data: new SlashCommandBuilder()
    .setName('liste')
    .setDescription('Gestionnaire de listes configurables pour les automatisations et l\'administration')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('creer')
        .setDescription('Créer une nouvelle liste personnalisée')
        .addStringOption((opt) => opt.setName('nom').setDescription('Nom unique de la liste').setRequired(true))
        .addStringOption((opt) =>
          opt
            .setName('type')
            .setDescription('Type de données contenues')
            .setRequired(true)
            .addChoices(
              { name: 'Mots-clés filtrés ou autorisés', value: 'mots_cles' },
              { name: 'Réponses alternatives aléatoires', value: 'reponses' },
              { name: 'Destinations d\'alertes (salons / webhooks)', value: 'destinations' },
              { name: 'Ressources et liens recommandés', value: 'liens' },
              { name: 'Éléments personnalisés libres', value: 'custom' }
            )
        )
        .addStringOption((opt) => opt.setName('description').setDescription('Courte description').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('voir')
        .setDescription('Afficher le contenu et les statistiques d\'une liste')
        .addStringOption((opt) => opt.setName('nom').setDescription('Nom de la liste (laisser vide pour lister toutes les listes)').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('ajouter')
        .setDescription('Ajouter un ou plusieurs éléments à une liste')
        .addStringOption((opt) => opt.setName('nom').setDescription('Nom de la liste').setRequired(true))
        .addStringOption((opt) => opt.setName('element').setDescription('Texte ou valeur de l\'élément à ajouter').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('retirer')
        .setDescription('Retirer un élément d\'une liste')
        .addStringOption((opt) => opt.setName('nom').setDescription('Nom de la liste').setRequired(true))
        .addStringOption((opt) => opt.setName('element').setDescription('Texte exact de l\'élément à supprimer').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('hasard')
        .setDescription('Sélectionner un élément aléatoirement dans une liste')
        .addStringOption((opt) => opt.setName('nom').setDescription('Nom de la liste').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('doublons')
        .setDescription('Détecter et nettoyer les doublons dans une liste')
        .addStringOption((opt) => opt.setName('nom').setDescription('Nom de la liste').setRequired(true))
        .addBooleanOption((opt) => opt.setName('nettoyer').setDescription('Nettoyer automatiquement les doublons (True)').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('trier')
        .setDescription('Trier les éléments d\'une liste par ordre alphabétique')
        .addStringOption((opt) => opt.setName('nom').setDescription('Nom de la liste').setRequired(true))
        .addStringOption((opt) =>
          opt
            .setName('ordre')
            .setDescription('Sens du tri')
            .setRequired(true)
            .addChoices(
              { name: 'Croissant (A ➔ Z)', value: 'asc' },
              { name: 'Décroissant (Z ➔ A)', value: 'desc' }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('vider')
        .setDescription('Vider l\'intégralité des éléments d\'une liste')
        .addStringOption((opt) => opt.setName('nom').setDescription('Nom de la liste').setRequired(true))
        .addBooleanOption((opt) => opt.setName('confirmer').setDescription('Confirmation requise (choisir True)').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('dupliquer')
        .setDescription('Dupliquer une liste existante')
        .addStringOption((opt) => opt.setName('source').setDescription('Nom de la liste source').setRequired(true))
        .addStringOption((opt) => opt.setName('destination').setDescription('Nouveau nom').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('fusionner')
        .setDescription('Fusionner deux listes compatibles')
        .addStringOption((opt) => opt.setName('source').setDescription('Liste source').setRequired(true))
        .addStringOption((opt) => opt.setName('cible').setDescription('Liste réceptrice (cible)').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('supprimer')
        .setDescription('Supprimer définitivement une liste')
        .addStringOption((opt) => opt.setName('nom').setDescription('Nom de la liste').setRequired(true))
        .addBooleanOption((opt) => opt.setName('confirmer').setDescription('Confirmation requise').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('export')
        .setDescription('Exporter une liste en format JSON')
        .addStringOption((opt) => opt.setName('nom').setDescription('Nom de la liste').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('import')
        .setDescription('Importer des éléments dans une liste via JSON')
        .addStringOption((opt) => opt.setName('nom').setDescription('Nom de la liste').setRequired(true))
        .addStringOption((opt) => opt.setName('donnees_json').setDescription('Tableau JSON de chaînes').setRequired(true))
    ),
  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({
        content: '❌ Vous devez avoir la permission **Gérer le serveur** pour administrer les listes.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const db = getDb();
    if (!db) {
      return await interaction.reply({
        content: '❌ Base de données momentanément indisponible.',
        flags: MessageFlags.Ephemeral,
      });
    }
    if (sub === 'creer') {
      const name = interaction.options.getString('nom').trim();
      const type = interaction.options.getString('type');
      const desc = interaction.options.getString('description') || `Liste de type ${type}`;
      const existing = await getList(guildId, name);
      if (existing) {
        return await interaction.reply({
          content: `⚠️ Une liste nommée \`${name}\` existe déjà sur ce serveur.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      await saveList(guildId, name, {
        type,
        description: desc,
        items: [],
        createdBy: interaction.user.id,
      });
      return await interaction.reply({
        content: `✅ La liste **${name}** (Type: \`${type}\`) a été créée avec succès. Utilisez \`/liste ajouter nom:${name} element:...\` pour la garnir.`,
      });
    }
    if (sub === 'voir') {
      const name = interaction.options.getString('nom')?.trim();
      if (!name) {
        const lists = await db.collection('bot_lists').find({ guildId }).toArray();
        const embed = new EmbedBuilder()
          .setTitle('📂 Listes Disponibles sur le Serveur')
          .setColor(0x00e5ff)
          .setFooter({ text: `Codé avec ❤️ par Saez | ${lists.length} liste(s) existante(s)` });
        if (lists.length === 0) {
          embed.setDescription('Aucune liste n\'est actuellement configurée.\nCréez-en une avec `/liste creer nom:<nom> type:<type>`.');
        } else {
          embed.setDescription(
            lists.map((l) => `• **${l.name}** [${l.type || 'custom'}] — **${(l.items || []).length}** élément(s)\n  ↳ *${l.description || 'Aucune description'}*`).join('\n\n')
          );
        }
        return await interaction.reply({ embeds: [embed] });
      }
      const list = await getList(guildId, name);
      if (!list) {
        return await interaction.reply({
          content: `❌ Liste \`${name}\` introuvable.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      const items = list.items || [];
      const embed = new EmbedBuilder()
        .setTitle(`📋 Liste : ${list.name}`)
        .setDescription(list.description || 'Sans description')
        .setColor(0x00e5ff)
        .addFields(
          { name: '🏷️ Type', value: `\`${list.type || 'custom'}\``, inline: true },
          { name: '📊 Nombre d\'éléments', value: `${items.length}`, inline: true },
          { name: '🕒 Dernière modification', value: list.updatedAt ? `<t:${Math.floor(new Date(list.updatedAt).getTime() / 1000)}:R>` : 'Inconnue', inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (items.length === 0) {
        embed.addFields({ name: 'Contenu', value: '*Cette liste est actuellement vide.*' });
      } else {
        const preview = items.slice(0, 20).map((it, i) => `\`${i + 1}.\` ${it}`).join('\n');
        embed.addFields({
          name: `Contenu (20 premiers sur ${items.length})`,
          value: preview.length > 1024 ? preview.slice(0, 1020) + '...' : preview,
        });
      }
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'ajouter') {
      const name = interaction.options.getString('nom').trim();
      const element = interaction.options.getString('element').trim();
      const list = await getList(guildId, name);
      if (!list) {
        return await interaction.reply({
          content: `❌ Liste \`${name}\` introuvable.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      const items = list.items || [];
      items.push(element);
      await saveList(guildId, name, { items });
      return await interaction.reply({
        content: `➕ L'élément \`${element}\` a été ajouté à la liste **${name}** (Total : ${items.length}).`,
      });
    }
    if (sub === 'retirer') {
      const name = interaction.options.getString('nom').trim();
      const element = interaction.options.getString('element').trim();
      const list = await getList(guildId, name);
      if (!list) {
        return await interaction.reply({
          content: `❌ Liste \`${name}\` introuvable.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      const items = list.items || [];
      const index = items.indexOf(element);
      if (index === -1) {
        return await interaction.reply({
          content: `⚠️ L'élément \`${element}\` n'a pas été trouvé dans la liste **${name}**.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      items.splice(index, 1);
      await saveList(guildId, name, { items });
      return await interaction.reply({
        content: `➖ L'élément \`${element}\` a été retiré de la liste **${name}** (Restants : ${items.length}).`,
      });
    }
    if (sub === 'hasard') {
      const name = interaction.options.getString('nom').trim();
      const list = await getList(guildId, name);
      if (!list) {
        return await interaction.reply({
          content: `❌ Liste \`${name}\` introuvable.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      const items = list.items || [];
      if (items.length === 0) {
        return await interaction.reply({
          content: `⚠️ La liste **${name}** est vide, aucun tirage possible.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      const picked = items[Math.floor(Math.random() * items.length)];
      const embed = new EmbedBuilder()
        .setTitle(`🎲 Tirage Aléatoire : ${list.name}`)
        .setDescription(`Le sort a désigné :\n\n### 🎯 **${picked}**`)
        .setColor(0x00ff88)
        .setFooter({ text: `Codé avec ❤️ par Saez | Tiré au sort parmi ${items.length} éléments` });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'doublons') {
      const name = interaction.options.getString('nom').trim();
      const doClean = interaction.options.getBoolean('nettoyer') || false;
      const list = await getList(guildId, name);
      if (!list) {
        return await interaction.reply({
          content: `❌ Liste \`${name}\` introuvable.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      const items = list.items || [];
      const seen = new Set();
      const duplicates = [];
      for (const item of items) {
        if (seen.has(item)) duplicates.push(item);
        else seen.add(item);
      }
      if (duplicates.length === 0) {
        return await interaction.reply({
          content: `✨ Aucun doublon détecté dans la liste **${name}** (${items.length} éléments uniques).`,
        });
      }
      if (doClean) {
        const uniqueItems = Array.from(new Set(items));
        await saveList(guildId, name, { items: uniqueItems });
        return await interaction.reply({
          content: `🧹 **${duplicates.length} doublon(s)** supprimé(s) de la liste **${name}** ! La liste compte désormais ${uniqueItems.length} éléments.`,
        });
      } else {
        return await interaction.reply({
          content: `⚠️ **${duplicates.length} doublon(s)** identifié(s) dans **${name}** :\n\`${duplicates.slice(0, 10).join(', ')}${duplicates.length > 10 ? '...' : ''}\`\nPour les nettoyer, réexécutez avec l'option \`nettoyer:True\`.`,
        });
      }
    }
    if (sub === 'trier') {
      const name = interaction.options.getString('nom').trim();
      const order = interaction.options.getString('ordre');
      const list = await getList(guildId, name);
      if (!list) {
        return await interaction.reply({
          content: `❌ Liste \`${name}\` introuvable.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      const items = [...(list.items || [])];
      items.sort((a, b) => (order === 'asc' ? a.localeCompare(b, 'fr') : b.localeCompare(a, 'fr')));
      await saveList(guildId, name, { items });
      return await interaction.reply({
        content: `🔤 La liste **${name}** a été triée par ordre **${order === 'asc' ? 'croissant (A-Z)' : 'décroissant (Z-A)'}**.`,
      });
    }
    if (sub === 'vider') {
      const name = interaction.options.getString('nom').trim();
      const confirm = interaction.options.getBoolean('confirmer');
      if (!confirm) {
        return await interaction.reply({
          content: '❌ Action annulée : vous devez confirmer avec `confirmer:True`.',
          flags: MessageFlags.Ephemeral,
        });
      }
      const list = await getList(guildId, name);
      if (!list) {
        return await interaction.reply({
          content: `❌ Liste \`${name}\` introuvable.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      await saveList(guildId, name, { items: [] });
      return await interaction.reply({
        content: `🗑️ La liste **${name}** a été complètement vidée.`,
      });
    }
    if (sub === 'dupliquer') {
      const srcName = interaction.options.getString('source').trim();
      const destName = interaction.options.getString('destination').trim();
      const source = await getList(guildId, srcName);
      if (!source) {
        return await interaction.reply({
          content: `❌ Liste source \`${srcName}\` introuvable.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      const destExists = await getList(guildId, destName);
      if (destExists) {
        return await interaction.reply({
          content: `⚠️ Une liste nommée \`${destName}\` existe déjà.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      await saveList(guildId, destName, {
        type: source.type,
        description: `Copie de ${srcName}`,
        items: [...(source.items || [])],
        createdBy: interaction.user.id,
      });
      return await interaction.reply({
        content: `📋 Liste **${srcName}** dupliquée avec succès vers **${destName}** (${(source.items || []).length} éléments).`,
      });
    }
    if (sub === 'fusionner') {
      const srcName = interaction.options.getString('source').trim();
      const tgtName = interaction.options.getString('cible').trim();
      const src = await getList(guildId, srcName);
      const tgt = await getList(guildId, tgtName);
      if (!src || !tgt) {
        return await interaction.reply({
          content: '❌ L\'une des deux listes spécifiées est introuvable.',
          flags: MessageFlags.Ephemeral,
        });
      }
      const mergedItems = Array.from(new Set([...(tgt.items || []), ...(src.items || [])]));
      await saveList(guildId, tgtName, { items: mergedItems });
      return await interaction.reply({
        content: `🔗 Fusion réussie ! La liste **${tgtName}** compte désormais **${mergedItems.length}** éléments consolidés.`,
      });
    }
    if (sub === 'supprimer') {
      const name = interaction.options.getString('nom').trim();
      const confirm = interaction.options.getBoolean('confirmer');
      if (!confirm) {
        return await interaction.reply({
          content: '❌ Suppression annulée : confirmation requise (`confirmer:True`).',
          flags: MessageFlags.Ephemeral,
        });
      }
      const success = await deleteList(guildId, name);
      if (!success) {
        return await interaction.reply({
          content: `❌ Impossible de supprimer la liste \`${name}\` (introuvable).`,
          flags: MessageFlags.Ephemeral,
        });
      }
      return await interaction.reply({
        content: `🗑️ La liste **${name}** a été définitivement supprimée.`,
      });
    }
    if (sub === 'export') {
      const name = interaction.options.getString('nom').trim();
      const list = await getList(guildId, name);
      if (!list) {
        return await interaction.reply({
          content: `❌ Liste \`${name}\` introuvable.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      const jsonStr = JSON.stringify(list.items || [], null, 2);
      return await interaction.reply({
        content: `📦 **Export de la liste ${name} (${(list.items || []).length} éléments) :**\n\`\`\`json\n${jsonStr.slice(0, 1800)}\n\`\`\``,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (sub === 'import') {
      const name = interaction.options.getString('nom').trim();
      const raw = interaction.options.getString('donnees_json');
      let parsed;
      try {
        parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) throw new Error('Doit être un tableau');
      } catch {
        return await interaction.reply({
          content: '❌ Données invalides. L\'entrée doit être un tableau JSON valide (ex: `["mot1", "mot2"]`).',
          flags: MessageFlags.Ephemeral,
        });
      }
      const list = await getList(guildId, name);
      if (!list) {
        return await interaction.reply({
          content: `❌ Liste \`${name}\` introuvable. Créez-la d'abord avec \`/liste creer\`.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      const newItems = Array.from(new Set([...(list.items || []), ...parsed.map(String)]));
      await saveList(guildId, name, { items: newItems });
      return await interaction.reply({
        content: `📥 **${parsed.length}** élément(s) importé(s) dans la liste **${name}** (Total : ${newItems.length}).`,
      });
    }
  },
};
