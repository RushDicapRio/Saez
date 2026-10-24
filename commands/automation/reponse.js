import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';
import { getDb } from '../../database/mongo.js';
import { resolveVariables } from '../../services/automationService.js';
import crypto from 'crypto';
export default {
  data: new SlashCommandBuilder()
    .setName('reponse')
    .setDescription('Gestion avancée des réponses automatiques intelligentes')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('creer')
        .setDescription('Créer une nouvelle réponse automatique avancée')
        .addStringOption((opt) => opt.setName('declencheur').setDescription('Mot-clé, phrase ou motif regex').setRequired(true))
        .addStringOption((opt) => opt.setName('reponse').setDescription('Texte de la réponse (supporte variables {user}, {server}, etc.)').setRequired(true))
        .addStringOption((opt) =>
          opt
            .setName('mode')
            .setDescription('Mode de correspondance')
            .setRequired(false)
            .addChoices(
              { name: 'Partiel (contient le mot-clé)', value: 'partial' },
              { name: 'Exact (message strictement identique)', value: 'exact' },
              { name: 'Expression régulière (Regex sécurisée)', value: 'regex' },
              { name: 'Mots-clés multiples (séparés par virgules)', value: 'keywords' }
            )
        )
        .addChannelOption((opt) => opt.setName('salon').setDescription('Limiter la réponse à un salon précis').setRequired(false))
        .addRoleOption((opt) => opt.setName('role_requis').setDescription('Réservé aux membres ayant ce rôle').setRequired(false))
        .addIntegerOption((opt) => opt.setName('cooldown').setDescription('Délai anti-spam en secondes (ex: 10)').setRequired(false))
        .addBooleanOption((opt) => opt.setName('format_embed').setDescription('Envoyer sous forme d\'embed soigné').setRequired(false))
        .addIntegerOption((opt) => opt.setName('priorite').setDescription('Priorité de déclenchement (1 à 10, défaut: 5)').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('liste')
        .setDescription('Lister toutes les réponses automatiques configurées')
        .addStringOption((opt) => opt.setName('filtre').setDescription('Filtrer par mot-clé').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('details')
        .setDescription('Consulter la configuration complète d\'une réponse automatique')
        .addStringOption((opt) => opt.setName('id').setDescription('ID de la réponse automatique').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('modifier')
        .setDescription('Modifier le texte ou la priorité d\'une réponse')
        .addStringOption((opt) => opt.setName('id').setDescription('ID de la réponse').setRequired(true))
        .addStringOption((opt) => opt.setName('nouvelle_reponse').setDescription('Nouveau texte').setRequired(false))
        .addIntegerOption((opt) => opt.setName('priorite').setDescription('Nouvelle priorité (1-10)').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('supprimer')
        .setDescription('Supprimer une réponse automatique')
        .addStringOption((opt) => opt.setName('id').setDescription('ID ou mot-clé de la réponse').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('tester')
        .setDescription('Tester et prévisualiser une phrase pour voir quelle règle se déclencherait')
        .addStringOption((opt) => opt.setName('message').setDescription('Message simulant l\'envoi d\'un utilisateur').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('toggle')
        .setDescription('Activer ou désactiver une réponse automatique')
        .addStringOption((opt) => opt.setName('id').setDescription('ID de la règle').setRequired(true))
        .addBooleanOption((opt) => opt.setName('actif').setDescription('True pour activer, False pour désactiver').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('priorite')
        .setDescription('Ajuster rapidement la priorité d\'évaluation')
        .addStringOption((opt) => opt.setName('id').setDescription('ID de la règle').setRequired(true))
        .addIntegerOption((opt) => opt.setName('niveau').setDescription('Niveau de priorité (1 à 10)').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('dupliquer')
        .setDescription('Dupliquer une réponse automatique pour la décliner')
        .addStringOption((opt) => opt.setName('id').setDescription('ID source').setRequired(true))
        .addStringOption((opt) => opt.setName('nouveau_declencheur').setDescription('Nouveau déclencheur').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('stats')
        .setDescription('Afficher les statistiques d\'utilisation des réponses automatiques')
        .addStringOption((opt) => opt.setName('id').setDescription('ID de la règle (facultatif)').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('export')
        .setDescription('Exporter les réponses automatiques en format JSON')
    )
    .addSubcommand((sub) =>
      sub
        .setName('import')
        .setDescription('Importer des règles au format JSON')
        .addStringOption((opt) => opt.setName('donnees_json').setDescription('Contenu JSON').setRequired(true))
    ),
  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({
        content: '❌ Vous devez avoir la permission **Gérer le serveur** pour configurer les réponses automatiques.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const db = getDb();
    if (!db) {
      return await interaction.reply({
        content: '❌ Base de données temporairement inaccessible.',
        flags: MessageFlags.Ephemeral,
      });
    }
    if (sub === 'creer') {
      const declencheur = interaction.options.getString('declencheur').trim();
      const reponse = interaction.options.getString('reponse');
      const mode = interaction.options.getString('mode') || 'partial';
      const salon = interaction.options.getChannel('salon');
      const roleRequis = interaction.options.getRole('role_requis');
      const cooldownSec = interaction.options.getInteger('cooldown') || 5;
      const formatEmbed = interaction.options.getBoolean('format_embed') || false;
      const priorite = interaction.options.getInteger('priorite') || 5;
      if (mode === 'regex') {
        try {
          new RegExp(declencheur, 'i');
        } catch (e) {
          return await interaction.reply({
            content: `❌ L'expression régulière fournie est invalide : \`${e.message}\`.`,
            flags: MessageFlags.Ephemeral,
          });
        }
      }
      const ruleId = `rep_${crypto.randomBytes(4).toString('hex')}`;
      const actions = [
        formatEmbed
          ? {
              type: 'send_message',
              embed: {
                title: '💬 Réponse Automatique',
                description: reponse,
                color: 0x00e5ff,
              },
            }
          : {
              type: 'send_message',
              message: reponse,
            },
      ];
      const conditions = { logic: 'AND', rules: [] };
      if (salon) {
        conditions.rules.push({ type: 'channel', channel_id: salon.id });
      }
      if (roleRequis) {
        conditions.rules.push({ type: 'role', role_id: roleRequis.id });
      }
      const doc = {
        guild_id: guildId,
        autoId: ruleId,
        name: `Réponse: ${declencheur.slice(0, 30)}`,
        type: 'auto_reply',
        trigger: declencheur.toLowerCase(),
        reply: reponse,
        mode,
        channel_id: salon ? salon.id : null,
        role_id: roleRequis ? roleRequis.id : null,
        cooldown: cooldownSec,
        priority: Math.max(1, Math.min(10, priorite)),
        conditions,
        actions,
        enabled: true,
        paused: false,
        stats: { executionCount: 0, lastRun: null, errorCount: 0 },
        created_at: new Date(),
        updated_at: new Date(),
      };
      await db.collection('bot_automations').insertOne(doc);
      const embed = new EmbedBuilder()
        .setTitle('✅ Réponse Automatique Configurée')
        .setColor(0x00e5ff)
        .addFields(
          { name: '🆔 Identifiant', value: `\`${ruleId}\``, inline: true },
          { name: '🎯 Déclencheur', value: `\`${declencheur}\``, inline: true },
          { name: '⚙️ Mode', value: `\`${mode}\``, inline: true },
          { name: '⚡ Priorité', value: `${doc.priority}/10`, inline: true },
          { name: '⏳ Cooldown', value: `${cooldownSec}s`, inline: true },
          { name: '📍 Salon / Rôle', value: `${salon ? `<#${salon.id}>` : 'Tous'} | ${roleRequis ? `<@&${roleRequis.id}>` : 'Tous'}`, inline: true },
          { name: '💬 Réponse programmée', value: reponse.length > 200 ? reponse.slice(0, 197) + '...' : reponse, inline: false }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Variables supportées : {user}, {server}, {channel}, {date}, {time}' });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'liste') {
      const filtre = interaction.options.getString('filtre')?.toLowerCase();
      const query = {
        guild_id: guildId,
        $or: [{ type: 'auto_reply' }, { 'trigger.type': 'keyword' }],
      };
      const rules = await db.collection('bot_automations').find(query).sort({ priority: -1, created_at: -1 }).toArray();
      const filtered = filtre
        ? rules.filter((r) => (r.trigger || '').toLowerCase().includes(filtre) || (r.reply || '').toLowerCase().includes(filtre))
        : rules;
      const embed = new EmbedBuilder()
        .setTitle('📋 Réponses Automatiques Actives')
        .setColor(0x00e5ff)
        .setFooter({ text: `Codé avec ❤️ par Saez | ${filtered.length} règle(s) trouvée(s)` });
      if (filtered.length === 0) {
        embed.setDescription('Aucune réponse automatique enregistrée.\nUtilisez `/reponse creer` pour en configurer une.');
        return await interaction.reply({ embeds: [embed] });
      }
      const lines = filtered.slice(0, 15).map((r) => {
        const id = r.autoId || (r._id ? r._id.toString().slice(-6) : 'legacy');
        const status = r.enabled === false ? '🔴' : '🟢';
        const mode = r.mode || 'partiel';
        const trig = r.trigger || r.name;
        const rep = (r.reply || r.actions?.[0]?.message || 'Règle complexe').slice(0, 50);
        return `${status} \`[${id}]\` **${trig}** *(Prio: ${r.priority || 5})* [${mode}]\n  ↳ \`${rep}\``;
      });
      embed.setDescription(lines.join('\n\n'));
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'details') {
      const id = interaction.options.getString('id');
      const rule = await db.collection('bot_automations').findOne({
        guild_id: guildId,
        $or: [{ autoId: id }, { trigger: id }],
      });
      if (!rule) {
        return await interaction.reply({
          content: `❌ Règle introuvable pour \`${id}\`.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      const embed = new EmbedBuilder()
        .setTitle(`🔍 Détails : ${rule.name || rule.trigger}`)
        .setColor(0x00e5ff)
        .addFields(
          { name: '🆔 ID Règle', value: `\`${rule.autoId || rule._id}\``, inline: true },
          { name: '📌 Statut', value: rule.enabled === false ? '🔴 Désactivée' : '🟢 Activée', inline: true },
          { name: '⚡ Priorité', value: `${rule.priority || 5}/10`, inline: true },
          { name: '🎯 Déclencheur', value: `\`${rule.trigger}\` (Mode: ${rule.mode || 'partiel'})`, inline: true },
          { name: '⏳ Cooldown', value: `${rule.cooldown || 5}s`, inline: true },
          { name: '📍 Filtre Salon', value: rule.channel_id ? `<#${rule.channel_id}>` : 'Global (Tous)', inline: true },
          { name: '💬 Réponse', value: rule.reply || rule.actions?.[0]?.message || 'Personnalisée', inline: false }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'modifier') {
      const id = interaction.options.getString('id');
      const newRep = interaction.options.getString('nouvelle_reponse');
      const newPrio = interaction.options.getInteger('priorite');
      const updateFields = { updated_at: new Date() };
      if (newRep) {
        updateFields.reply = newRep;
        updateFields['actions.0.message'] = newRep;
      }
      if (newPrio) {
        updateFields.priority = Math.max(1, Math.min(10, newPrio));
      }
      const res = await db.collection('bot_automations').updateOne(
        { guild_id: guildId, $or: [{ autoId: id }, { trigger: id }] },
        { $set: updateFields }
      );
      if (res.matchedCount === 0) {
        return await interaction.reply({
          content: `❌ Règle \`${id}\` introuvable.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      return await interaction.reply({
        content: `✅ La réponse automatique \`${id}\` a été mise à jour.`,
      });
    }
    if (sub === 'supprimer') {
      const id = interaction.options.getString('id');
      const res = await db.collection('bot_automations').deleteOne({
        guild_id: guildId,
        $or: [{ autoId: id }, { trigger: id }],
      });
      if (res.deletedCount === 0) {
        return await interaction.reply({
          content: `❌ Règle \`${id}\` introuvable.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      return await interaction.reply({
        content: `🗑️ La réponse automatique \`${id}\` a été supprimée avec succès.`,
      });
    }
    if (sub === 'tester') {
      const testMsg = interaction.options.getString('message');
      const contentLower = testMsg.toLowerCase().trim();
      const rules = await db.collection('bot_automations')
        .find({
          guild_id: guildId,
          enabled: { $ne: false },
          $or: [{ type: 'auto_reply' }, { 'trigger.type': 'keyword' }, { 'trigger.type': 'regex' }],
        })
        .sort({ priority: -1 })
        .toArray();
      let matchedRule = null;
      for (const r of rules) {
        const trig = (r.trigger || '').toLowerCase();
        const mode = r.mode || 'partial';
        if (mode === 'exact' && contentLower === trig) {
          matchedRule = r;
          break;
        } else if (mode === 'regex') {
          try {
            const re = new RegExp(trig, 'i');
            if (re.test(testMsg)) {
              matchedRule = r;
              break;
            }
          } catch {}
        } else if (contentLower.includes(trig)) {
          matchedRule = r;
          break;
        }
      }
      const embed = new EmbedBuilder()
        .setTitle('🧪 Test de Détection de Réponse Automatique')
        .setColor(matchedRule ? 0x00ff88 : 0xff3366)
        .addFields({ name: 'Message testé', value: `\`${testMsg}\`` })
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (matchedRule) {
        const preview = resolveVariables(matchedRule.reply || matchedRule.actions?.[0]?.message || '', {
          user: interaction.user,
          member: interaction.member,
          guild: interaction.guild,
          channel: interaction.channel,
        });
        embed.addFields(
          { name: '🎯 Règle déclenchée', value: `\`[${matchedRule.autoId || 'id'}]\` ${matchedRule.name || matchedRule.trigger}`, inline: true },
          { name: '⚡ Priorité', value: `${matchedRule.priority || 5}/10`, inline: true },
          { name: '💬 Prévisualisation de la réponse', value: preview || '*(Vide)*', inline: false }
        );
      } else {
        embed.setDescription('❌ Aucune règle active ne correspond à ce message.');
      }
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'toggle') {
      const id = interaction.options.getString('id');
      const actif = interaction.options.getBoolean('actif');
      const res = await db.collection('bot_automations').updateOne(
        { guild_id: guildId, $or: [{ autoId: id }, { trigger: id }] },
        { $set: { enabled: actif, updated_at: new Date() } }
      );
      if (res.matchedCount === 0) {
        return await interaction.reply({
          content: `❌ Règle \`${id}\` introuvable.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      return await interaction.reply({
        content: `${actif ? '🟢' : '🔴'} La règle \`${id}\` est désormais **${actif ? 'activée' : 'désactivée'}**.`,
      });
    }
    if (sub === 'priorite') {
      const id = interaction.options.getString('id');
      const niveau = Math.max(1, Math.min(10, interaction.options.getInteger('niveau')));
      const res = await db.collection('bot_automations').updateOne(
        { guild_id: guildId, $or: [{ autoId: id }, { trigger: id }] },
        { $set: { priority: niveau, updated_at: new Date() } }
      );
      if (res.matchedCount === 0) {
        return await interaction.reply({
          content: `❌ Règle \`${id}\` introuvable.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      return await interaction.reply({
        content: `⚡ Priorité de la règle \`${id}\` ajustée à **${niveau}/10**.`,
      });
    }
    if (sub === 'dupliquer') {
      const id = interaction.options.getString('id');
      const newTrig = interaction.options.getString('nouveau_declencheur').toLowerCase().trim();
      const source = await db.collection('bot_automations').findOne({
        guild_id: guildId,
        $or: [{ autoId: id }, { trigger: id }],
      });
      if (!source) {
        return await interaction.reply({
          content: `❌ Règle source \`${id}\` introuvable.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      const newId = `rep_${crypto.randomBytes(4).toString('hex')}`;
      const copy = {
        ...source,
        _id: undefined,
        autoId: newId,
        name: `Réponse: ${newTrig}`,
        trigger: newTrig,
        enabled: false,
        stats: { executionCount: 0, lastRun: null, errorCount: 0 },
        created_at: new Date(),
        updated_at: new Date(),
      };
      await db.collection('bot_automations').insertOne(copy);
      return await interaction.reply({
        content: `📋 Règle dupliquée avec succès : \`${newId}\` déclenchée par \`${newTrig}\` (désactivée par défaut pour révision).`,
      });
    }
    if (sub === 'stats') {
      const id = interaction.options.getString('id');
      const query = {
        guild_id: guildId,
        $or: [{ type: 'auto_reply' }, { 'trigger.type': 'keyword' }],
      };
      if (id) query.$or = [{ autoId: id }, { trigger: id }];
      const rules = await db.collection('bot_automations').find(query).toArray();
      const totalRules = rules.length;
      const totalExecs = rules.reduce((acc, r) => acc + (r.stats?.executionCount || 0), 0);
      const totalErrors = rules.reduce((acc, r) => acc + (r.stats?.errorCount || 0), 0);
      const embed = new EmbedBuilder()
        .setTitle('📊 Statistiques des Réponses Automatiques')
        .setColor(0x00e5ff)
        .addFields(
          { name: 'Règles actives', value: `${rules.filter((r) => r.enabled !== false).length} / ${totalRules}`, inline: true },
          { name: 'Déclenchements totaux', value: `${totalExecs}`, inline: true },
          { name: 'Erreurs', value: `${totalErrors}`, inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (id && rules[0]) {
        const r = rules[0];
        embed.setDescription(`Détails pour la règle **${r.name || r.trigger}** (\`${r.autoId || id}\`)`);
      }
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'export') {
      const rules = await db.collection('bot_automations').find({
        guild_id: guildId,
        $or: [{ type: 'auto_reply' }, { 'trigger.type': 'keyword' }],
      }).toArray();
      const clean = rules.map(({ _id, guild_id, ...r }) => r);
      const json = JSON.stringify(clean, null, 2);
      return await interaction.reply({
        content: `📦 **Export des réponses automatiques (${clean.length}) :**\n\`\`\`json\n${json.slice(0, 1800)}\n\`\`\``,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (sub === 'import') {
      const jsonStr = interaction.options.getString('donnees_json');
      let data;
      try {
        data = JSON.parse(jsonStr);
      } catch {
        return await interaction.reply({
          content: '❌ Données JSON invalides.',
          flags: MessageFlags.Ephemeral,
        });
      }
      const arr = Array.isArray(data) ? data : [data];
      let count = 0;
      for (const item of arr) {
        if (!item.trigger) continue;
        const autoId = `rep_${crypto.randomBytes(4).toString('hex')}`;
        await db.collection('bot_automations').insertOne({
          ...item,
          _id: undefined,
          guild_id: guildId,
          autoId,
          enabled: false,
          created_at: new Date(),
          updated_at: new Date(),
        });
        count++;
      }
      return await interaction.reply({
        content: `✅ **${count}** réponse(s) automatique(s) importée(s) (désactivées par défaut).`,
      });
    }
  },
};
