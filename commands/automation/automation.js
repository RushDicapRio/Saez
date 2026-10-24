import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { getDb } from '../../database/mongo.js';
import {
  AUTOMATION_TEMPLATES,
  executeAutomation,
  getAutomationLogs,
  cleanOldLogs,
} from '../../services/automationService.js';
import crypto from 'crypto';
export default {
  data: new SlashCommandBuilder()
    .setName('automation')
    .setDescription('Moteur central et gestion des automatisations du serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('reponse')
        .setDescription('Créer une réponse automatique par mot-clé dans le chat (hérité)')
        .addStringOption((opt) => opt.setName('declencheur').setDescription('Mot-clé ou phrase déclencheuse').setRequired(true))
        .addStringOption((opt) => opt.setName('reponse').setDescription('Message que le bot répondra automatiquement').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('role-alert')
        .setDescription('Envoyer un message privé automatique à un membre recevant un rôle précis (hérité)')
        .addRoleOption((opt) => opt.setName('role').setDescription('Rôle déclencheur').setRequired(true))
        .addStringOption((opt) => opt.setName('message').setDescription('Message explicatif envoyé en MP').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName('liste').setDescription('Lister toutes les automatisations actives du serveur')
    )
    .addSubcommand((sub) =>
      sub
        .setName('creer')
        .setDescription('Créer un scénario d\'automatisation complet')
        .addStringOption((opt) => opt.setName('nom').setDescription('Nom de l\'automatisation').setRequired(true))
        .addStringOption((opt) =>
          opt
            .setName('declencheur')
            .setDescription('Type de déclencheur')
            .setRequired(true)
            .addChoices(
              { name: 'Mot-clé dans un message', value: 'keyword' },
              { name: 'Expression régulière (Regex)', value: 'regex' },
              { name: 'Arrivée d\'un membre', value: 'member_join' },
              { name: 'Attribution d\'un rôle', value: 'role_assigned' },
              { name: 'Déclenchement manuel', value: 'manual' }
            )
        )
        .addStringOption((opt) =>
          opt
            .setName('action')
            .setDescription('Action principale à exécuter')
            .setRequired(true)
            .addChoices(
              { name: 'Envoyer un message dans le salon', value: 'send_message' },
              { name: 'Envoyer un message privé (MP)', value: 'send_dm' },
              { name: 'Ajouter une réaction emoji', value: 'add_reaction' },
              { name: 'Déclencher une alerte staff', value: 'trigger_alert' }
            )
        )
        .addStringOption((opt) => opt.setName('valeur_declencheur').setDescription('Mot-clé, motif regex ou nom').setRequired(false))
        .addStringOption((opt) => opt.setName('contenu_action').setDescription('Message ou emoji à exécuter').setRequired(false))
        .addRoleOption((opt) => opt.setName('role_cible').setDescription('Rôle concerné (pour déclencheur rôle)').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('details')
        .setDescription('Afficher les détails et la configuration d\'une automatisation')
        .addStringOption((opt) => opt.setName('id').setDescription('ID de l\'automatisation').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('modifier')
        .setDescription('Modifier le nom ou la description d\'une règle')
        .addStringOption((opt) => opt.setName('id').setDescription('ID de l\'automatisation').setRequired(true))
        .addStringOption((opt) => opt.setName('nom').setDescription('Nouveau nom').setRequired(false))
        .addStringOption((opt) => opt.setName('description').setDescription('Nouvelle description').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('supprimer')
        .setDescription('Supprimer définitivement une automatisation')
        .addStringOption((opt) => opt.setName('id').setDescription('ID ou déclencheur de l\'automatisation').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('activer')
        .setDescription('Activer une automatisation')
        .addStringOption((opt) => opt.setName('id').setDescription('ID de l\'automatisation').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('desactiver')
        .setDescription('Désactiver temporairement une automatisation')
        .addStringOption((opt) => opt.setName('id').setDescription('ID de l\'automatisation').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('pause')
        .setDescription('Mettre en pause une automatisation')
        .addStringOption((opt) => opt.setName('id').setDescription('ID de l\'automatisation').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('reprendre')
        .setDescription('Reprendre l\'exécution d\'une automatisation en pause')
        .addStringOption((opt) => opt.setName('id').setDescription('ID de l\'automatisation').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('tester')
        .setDescription('Tester une automatisation en mode simulation (Dry-Run, sans action réelle)')
        .addStringOption((opt) => opt.setName('id').setDescription('ID de l\'automatisation à simuler').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('historique')
        .setDescription('Consulter l\'historique et les statistiques d\'exécution')
        .addStringOption((opt) => opt.setName('id').setDescription('Filtrer par ID d\'automatisation').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('dupliquer')
        .setDescription('Dupliquer une automatisation existante')
        .addStringOption((opt) => opt.setName('id').setDescription('ID de l\'automatisation source').setRequired(true))
        .addStringOption((opt) => opt.setName('nouveau_nom').setDescription('Nom de la copie').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('recherche')
        .setDescription('Rechercher une automatisation par nom ou mot-clé')
        .addStringOption((opt) => opt.setName('requete').setDescription('Terme de recherche').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('modeles')
        .setDescription('Consulter ou installer un modèle d\'automatisation prêt à l\'emploi')
        .addStringOption((opt) =>
          opt
            .setName('modele_id')
            .setDescription('ID du modèle à installer immédiatement')
            .setRequired(false)
            .addChoices(
              { name: 'Accueil MP pour nouveaux membres', value: 'tpl_welcome_dm' },
              { name: 'Guide automatique rôle VIP', value: 'tpl_role_guide' },
              { name: 'Réponse FAQ Installation', value: 'tpl_auto_faq' },
              { name: 'Alerte Urgence Staff (!urgent)', value: 'tpl_staff_alert' },
              { name: 'Salutation entrée vocal', value: 'tpl_voice_greeting' }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('export')
        .setDescription('Exporter la configuration des automatisations en format JSON')
        .addStringOption((opt) => opt.setName('id').setDescription('ID de l\'automatisation (laisser vide pour tout exporter)').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('import')
        .setDescription('Importer une configuration JSON validée')
        .addStringOption((opt) => opt.setName('donnees_json').setDescription('Contenu JSON valide d\'une automatisation').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('nettoyer')
        .setDescription('Purger les anciens logs d\'exécution')
        .addIntegerOption((opt) => opt.setName('jours').setDescription('Conserver uniquement les N derniers jours (défaut: 30)').setRequired(false))
    ),
  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({
        content: '❌ Vous devez avoir la permission **Gérer le serveur** pour administrer les automatisations.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const db = getDb();
    if (!db) {
      return await interaction.reply({
        content: '❌ Base de données temporairement indisponible. Veuillez réessayer plus tard.',
        flags: MessageFlags.Ephemeral,
      });
    }
    if (sub === 'reponse') {
      const trigger = interaction.options.getString('declencheur').toLowerCase().trim();
      const reply = interaction.options.getString('reponse');
      const autoId = `auto_${crypto.randomBytes(4).toString('hex')}`;
      await db.collection('bot_automations').updateOne(
        { guild_id: guildId, trigger },
        {
          $set: {
            guild_id: guildId,
            autoId,
            name: `Réponse: ${trigger}`,
            type: 'auto_reply',
            trigger,
            reply,
            enabled: true,
            paused: false,
            created_at: new Date(),
          },
        },
        { upsert: true }
      );
      const embed = new EmbedBuilder()
        .setTitle('⚡ Réponse Automatique Configurée')
        .setDescription('Le bot répondra automatiquement dès que le mot-clé suivant est détecté :')
        .setColor(0x00e5ff)
        .addFields(
          { name: '🎯 Déclencheur', value: `\`${trigger}\``, inline: true },
          { name: '💬 Réponse', value: reply, inline: true },
          { name: '🆔 ID Règle', value: `\`${autoId}\``, inline: false }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'role-alert') {
      const role = interaction.options.getRole('role');
      const message = interaction.options.getString('message');
      const autoId = `auto_${crypto.randomBytes(4).toString('hex')}`;
      await db.collection('bot_automations').updateOne(
        { guild_id: guildId, role_id: role.id },
        {
          $set: {
            guild_id: guildId,
            autoId,
            name: `Alerte Rôle: ${role.name}`,
            type: 'role_dm',
            role_id: role.id,
            role_name: role.name,
            message,
            enabled: true,
            paused: false,
            created_at: new Date(),
          },
        },
        { upsert: true }
      );
      const embed = new EmbedBuilder()
        .setTitle('📬 Notification de Rôle Automatisée')
        .setDescription(`Dès qu'un membre recevra le rôle **${role.name}**, le bot lui transmettra ce message en MP :`)
        .setColor(0x8b5cf6)
        .addFields(
          { name: '👑 Rôle', value: `<@&${role.id}>`, inline: true },
          { name: '🆔 ID Règle', value: `\`${autoId}\``, inline: true },
          { name: '💬 Message MP', value: message, inline: false }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'liste') {
      const rules = await db.collection('bot_automations')
        .find({ guild_id: guildId })
        .sort({ created_at: -1 })
        .toArray();
      const embed = new EmbedBuilder()
        .setTitle('⚡ Automatisations du Serveur')
        .setColor(0x00e5ff)
        .setFooter({ text: `Codé avec ❤️ par Saez | ${rules.length} automatisation(s) configurée(s)` });
      if (rules.length === 0) {
        embed.setDescription('Aucune automatisation configurée sur ce serveur.\nUtilisez `/automation creer` ou `/automation modeles` pour en ajouter.');
        return await interaction.reply({ embeds: [embed] });
      }
      const lines = rules.slice(0, 15).map((r) => {
        const id = r.autoId || (r._id ? r._id.toString().slice(-6) : 'legacy');
        let status = '🟢 Active';
        if (r.enabled === false) status = '🔴 Désactivée';
        else if (r.paused === true) status = '⏸️ En pause';
        let desc = '';
        if (r.type === 'auto_reply') {
          desc = `Mot-clé: \`${r.trigger}\` ➔ ${r.reply.slice(0, 40)}`;
        } else if (r.type === 'role_dm') {
          desc = `Rôle: **${r.role_name || r.role_id}** ➔ MP: ${r.message.slice(0, 40)}`;
        } else {
          const actCount = (r.actions || []).length;
          desc = `${r.name || 'Sans titre'} (${r.trigger?.type || 'manuel'}) ➔ ${actCount} action(s)`;
        }
        return `• \`[${id}]\` **${r.name || 'Règle'}** — ${status}\n  └ ${desc}`;
      });
      embed.setDescription(lines.join('\n\n'));
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'creer') {
      const nom = interaction.options.getString('nom');
      const declencheurType = interaction.options.getString('declencheur');
      const actionType = interaction.options.getString('action');
      const valDeclencheur = interaction.options.getString('valeur_declencheur') || '';
      const contenuAction = interaction.options.getString('contenu_action') || 'Action automatique exécutée avec succès.';
      const roleCible = interaction.options.getRole('role_cible');
      const autoId = `auto_${crypto.randomBytes(4).toString('hex')}`;
      const trigger = {
        type: declencheurType,
        keyword: declencheurType === 'keyword' ? valDeclencheur.toLowerCase() : undefined,
        pattern: declencheurType === 'regex' ? valDeclencheur : undefined,
        role_id: roleCible?.id,
        role_name: roleCible?.name,
      };
      const actions = [];
      if (actionType === 'send_message') {
        actions.push({ type: 'send_message', message: contenuAction });
      } else if (actionType === 'send_dm') {
        actions.push({ type: 'send_dm', message: contenuAction });
      } else if (actionType === 'add_reaction') {
        actions.push({ type: 'add_reaction', emoji: contenuAction.trim() || '⭐' });
      } else if (actionType === 'trigger_alert') {
        actions.push({
          type: 'trigger_alert',
          title: `Alerte: ${nom}`,
          message: contenuAction,
          priority: 'Moyenne',
        });
      }
      const doc = {
        guild_id: guildId,
        autoId,
        name: nom,
        description: `Automatisation ${declencheurType} ➔ ${actionType}`,
        enabled: true,
        paused: false,
        priority: 5,
        trigger,
        conditions: { logic: 'AND', rules: [] },
        actions,
        stats: { executionCount: 0, lastRun: null, errorCount: 0 },
        created_at: new Date(),
        updated_at: new Date(),
      };
      await db.collection('bot_automations').insertOne(doc);
      const embed = new EmbedBuilder()
        .setTitle('✅ Nouvelle Automatisation Créée')
        .setDescription(`L'automatisation **${nom}** a été enregistrée avec succès.`)
        .setColor(0x00e5ff)
        .addFields(
          { name: '🆔 Identifiant', value: `\`${autoId}\``, inline: true },
          { name: '🎯 Déclencheur', value: `\`${declencheurType}\` ${valDeclencheur ? `(${valDeclencheur})` : ''}`, inline: true },
          { name: '⚡ Action', value: `\`${actionType}\``, inline: true },
          { name: '💬 Contenu / Valeur', value: contenuAction.slice(0, 100), inline: false }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Pour tester sans risque : /automation tester id:' + autoId });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'details') {
      const id = interaction.options.getString('id');
      const rule = await db.collection('bot_automations').findOne({
        guild_id: guildId,
        $or: [{ autoId: id }, { trigger: id }, { name: id }],
      });
      if (!rule) {
        return await interaction.reply({
          content: `❌ Aucune automatisation trouvée pour l'identifiant ou nom \`${id}\`.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      const status = rule.enabled === false ? '🔴 Désactivée' : rule.paused ? '⏸️ En pause' : '🟢 Active';
      const stats = rule.stats || { executionCount: 0, errorCount: 0, lastRun: null };
      const embed = new EmbedBuilder()
        .setTitle(`⚙️ Automatisation : ${rule.name || rule.trigger || 'Détails'}`)
        .setColor(0x00e5ff)
        .addFields(
          { name: '🆔 ID', value: `\`${rule.autoId || rule._id}\``, inline: true },
          { name: '📌 Statut', value: status, inline: true },
          { name: '⚡ Priorité', value: `${rule.priority || 5}/10`, inline: true },
          {
            name: '🎯 Déclencheur',
            value: rule.trigger?.type ? `Type: \`${rule.trigger.type}\` ${rule.trigger.keyword ? `("${rule.trigger.keyword}")` : ''}` : `Mot-clé: \`${rule.trigger}\``,
            inline: false,
          },
          {
            name: '🎬 Actions',
            value: rule.actions && rule.actions.length > 0
              ? rule.actions.map((a, i) => `${i + 1}. \`${a.type}\`: ${(a.message || a.emoji || a.title || 'Paramétré').slice(0, 60)}`).join('\n')
              : (rule.reply ? `Réponse: ${rule.reply}` : (rule.message ? `MP: ${rule.message}` : 'Aucune action définie')),
            inline: false,
          },
          {
            name: '📊 Statistiques',
            value: `Exécutions: **${stats.executionCount || 0}** | Erreurs: **${stats.errorCount || 0}** | Dernière: ${stats.lastRun ? `<t:${Math.floor(new Date(stats.lastRun).getTime() / 1000)}:R>` : 'Jamais'}`,
            inline: false,
          }
        )
        .setTimestamp(rule.created_at || new Date())
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'modifier') {
      const id = interaction.options.getString('id');
      const nom = interaction.options.getString('nom');
      const description = interaction.options.getString('description');
      const updateFields = { updated_at: new Date() };
      if (nom) updateFields.name = nom;
      if (description) updateFields.description = description;
      const res = await db.collection('bot_automations').updateOne(
        { guild_id: guildId, $or: [{ autoId: id }, { trigger: id }] },
        { $set: updateFields }
      );
      if (res.matchedCount === 0) {
        return await interaction.reply({
          content: `❌ Automatisation introuvable pour l'identifiant \`${id}\`.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      return await interaction.reply({
        content: `✅ L'automatisation \`${id}\` a été mise à jour avec succès.`,
      });
    }
    if (sub === 'supprimer') {
      const id = interaction.options.getString('id');
      const res = await db.collection('bot_automations').deleteOne({
        guild_id: guildId,
        $or: [{ autoId: id }, { trigger: id }, { name: id }],
      });
      if (res.deletedCount === 0) {
        return await interaction.reply({
          content: `❌ Aucune automatisation trouvée correspondant à \`${id}\`.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      return await interaction.reply({
        content: `🗑️ L'automatisation \`${id}\` a été supprimée définitivement.`,
      });
    }
    if (sub === 'activer' || sub === 'desactiver' || sub === 'pause' || sub === 'reprendre') {
      const id = interaction.options.getString('id');
      let updateDoc = {};
      let msg = '';
      if (sub === 'activer') {
        updateDoc = { enabled: true, paused: false };
        msg = `🟢 L'automatisation \`${id}\` est désormais **activée**.`;
      } else if (sub === 'desactiver') {
        updateDoc = { enabled: false };
        msg = `🔴 L'automatisation \`${id}\` est désormais **désactivée**.`;
      } else if (sub === 'pause') {
        updateDoc = { paused: true };
        msg = `⏸️ L'automatisation \`${id}\` a été **mise en pause**.`;
      } else if (sub === 'reprendre') {
        updateDoc = { paused: false, enabled: true };
        msg = `▶️ L'automatisation \`${id}\` a été **reprise**.`;
      }
      const res = await db.collection('bot_automations').updateOne(
        { guild_id: guildId, $or: [{ autoId: id }, { trigger: id }] },
        { $set: { ...updateDoc, updated_at: new Date() } }
      );
      if (res.matchedCount === 0) {
        return await interaction.reply({
          content: `❌ Automatisation \`${id}\` introuvable.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      return await interaction.reply({ content: msg });
    }
    if (sub === 'tester') {
      const id = interaction.options.getString('id');
      const rule = await db.collection('bot_automations').findOne({
        guild_id: guildId,
        $or: [{ autoId: id }, { trigger: id }],
      });
      if (!rule) {
        return await interaction.reply({
          content: `❌ Impossible de trouver l'automatisation \`${id}\` pour le test.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      await interaction.deferReply();
      const simContext = {
        guild: interaction.guild,
        channel: interaction.channel,
        user: interaction.user,
        member: interaction.member,
      };
      const result = await executeAutomation(rule, simContext, { dryRun: true });
      const embed = new EmbedBuilder()
        .setTitle('🧪 Simulation d\'Automatisation (Dry-Run)')
        .setDescription(`Résultat du test en mode simulation pour **${rule.name || rule.trigger || id}** :`)
        .setColor(result.success ? 0x00ff88 : 0xff3366)
        .addFields(
          { name: 'Résultat', value: result.success ? '✅ Test réussi (Conditions et actions validées)' : '❌ Test échoué', inline: true },
          { name: 'Mode', value: '🛡️ Simulation (Aucune action réelle)', inline: true },
          {
            name: 'Actions simulées',
            value: (result.actions || result.actionsExecuted)?.length > 0
              ? (result.actions || result.actionsExecuted).map((a, i) => `${i + 1}. \`${a.type}\`: ${a.success ? '✅ Validée' : '❌ Échec'} ${a.details ? `(${a.details})` : ''}`).join('\n')
              : 'Aucune action exécutée',
            inline: false,
          }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (result.error) {
        embed.addFields({ name: '⚠️ Erreur rencontrée', value: `\`${result.error}\``, inline: false });
      }
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'historique') {
      const autoId = interaction.options.getString('id');
      const logs = await getAutomationLogs(guildId, autoId, 10);
      const embed = new EmbedBuilder()
        .setTitle('📜 Historique des Exécutions d\'Automatisation')
        .setColor(0x00e5ff)
        .setFooter({ text: `Codé avec ❤️ par Saez | ${logs.length} journalisation(s) récente(s)` });
      if (logs.length === 0) {
        embed.setDescription('Aucun journal d\'exécution trouvé pour le moment.');
        return await interaction.reply({ embeds: [embed] });
      }
      const lines = logs.map((log) => {
        const time = `<t:${Math.floor(new Date(log.timestamp).getTime() / 1000)}:R>`;
        const icon = log.status === 'success' ? '✅' : '❌';
        const sim = log.dryRun ? ' *(Simulation)*' : '';
        const user = log.userId ? `<@${log.userId}>` : 'Système';
        const actionsCount = log.actionsCount || 0;
        return `${icon} **${log.automationName || log.automationId}** ${time}${sim}\n  └ Déclenché par: ${user} | Actions: ${actionsCount} | Statut: \`${log.status}\`${log.error ? ` | Err: ${log.error}` : ''}`;
      });
      embed.setDescription(lines.join('\n\n'));
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'dupliquer') {
      const sourceId = interaction.options.getString('id');
      const nouveauNom = interaction.options.getString('nouveau_nom');
      const source = await db.collection('bot_automations').findOne({
        guild_id: guildId,
        $or: [{ autoId: sourceId }, { trigger: sourceId }],
      });
      if (!source) {
        return await interaction.reply({
          content: `❌ Automatisation source \`${sourceId}\` introuvable.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      const newId = `auto_${crypto.randomBytes(4).toString('hex')}`;
      const copy = {
        ...source,
        _id: undefined,
        autoId: newId,
        name: nouveauNom,
        enabled: false, 
        paused: false,
        stats: { executionCount: 0, lastRun: null, errorCount: 0 },
        created_at: new Date(),
        updated_at: new Date(),
      };
      await db.collection('bot_automations').insertOne(copy);
      return await interaction.reply({
        content: `📋 L'automatisation a été dupliquée avec succès sous l'identifiant \`${newId}\` (**${nouveauNom}**). Elle est initialement désactivée pour révision.`,
      });
    }
    if (sub === 'recherche') {
      const query = interaction.options.getString('requete').toLowerCase();
      const results = await db.collection('bot_automations')
        .find({
          guild_id: guildId,
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { trigger: { $regex: query, $options: 'i' } },
            { 'trigger.keyword': { $regex: query, $options: 'i' } },
            { autoId: { $regex: query, $options: 'i' } },
          ],
        })
        .limit(10)
        .toArray();
      const embed = new EmbedBuilder()
        .setTitle(`🔍 Recherche d'Automatisations : "${query}"`)
        .setColor(0x00e5ff)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (results.length === 0) {
        embed.setDescription('Aucun résultat trouvé correspondant à votre recherche.');
      } else {
        embed.setDescription(
          results.map((r) => `• \`[${r.autoId || 'legacy'}]\` **${r.name || r.trigger}** (${r.type || r.trigger?.type || 'standard'})`).join('\n')
        );
      }
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'modeles') {
      const modeleId = interaction.options.getString('modele_id');
      if (!modeleId) {
        const embed = new EmbedBuilder()
          .setTitle('📦 Modèles d\'Automatisation Prêts à l\'Emploi')
          .setDescription('Installez instantanément un scénario préconfiguré via `/automation modeles modele_id:<ID>` :')
          .setColor(0x8b5cf6)
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        for (const tpl of AUTOMATION_TEMPLATES) {
          embed.addFields({
            name: `🔹 ${tpl.name} (\`${tpl.id}\`)`,
            value: `${tpl.description}\n↳ Déclencheur : \`${tpl.trigger.type}\` | Actions : ${tpl.actions.length}`,
          });
        }
        return await interaction.reply({ embeds: [embed] });
      }
      const template = AUTOMATION_TEMPLATES.find((t) => t.id === modeleId);
      if (!template) {
        return await interaction.reply({
          content: `❌ Modèle inconnu \`${modeleId}\`.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      const newId = `auto_${crypto.randomBytes(4).toString('hex')}`;
      const doc = {
        guild_id: guildId,
        autoId: newId,
        name: template.name,
        description: template.description,
        enabled: true,
        paused: false,
        priority: 5,
        trigger: template.trigger,
        conditions: template.conditions,
        actions: template.actions,
        stats: { executionCount: 0, lastRun: null, errorCount: 0 },
        created_at: new Date(),
        updated_at: new Date(),
      };
      await db.collection('bot_automations').insertOne(doc);
      const embed = new EmbedBuilder()
        .setTitle('🎉 Modèle Installé avec Succès')
        .setDescription(`Le modèle **${template.name}** est désormais déployé et opérationnel.`)
        .setColor(0x00ff88)
        .addFields(
          { name: '🆔 ID Règle', value: `\`${newId}\``, inline: true },
          { name: '🎯 Déclencheur', value: `\`${template.trigger.type}\``, inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'export') {
      const autoId = interaction.options.getString('id');
      const query = { guild_id: guildId };
      if (autoId) query.$or = [{ autoId }, { trigger: autoId }];
      const rules = await db.collection('bot_automations').find(query).toArray();
      if (rules.length === 0) {
        return await interaction.reply({
          content: '❌ Aucune configuration trouvée à exporter.',
          flags: MessageFlags.Ephemeral,
        });
      }
      const cleanRules = rules.map((r) => {
        const { _id, guild_id, ...rest } = r;
        return rest;
      });
      const jsonStr = JSON.stringify(cleanRules, null, 2);
      if (jsonStr.length > 1900) {
        return await interaction.reply({
          content: '⚠️ L\'export dépasse la taille maximale d\'un message Discord. Voici un extrait compressé :\n```json\n' + jsonStr.slice(0, 1800) + '...\n```',
          flags: MessageFlags.Ephemeral,
        });
      }
      return await interaction.reply({
        content: `📦 **Export de configuration (${cleanRules.length} règle(s)) :**\n\`\`\`json\n${jsonStr}\n\`\`\``,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (sub === 'import') {
      const jsonRaw = interaction.options.getString('donnees_json');
      let data;
      try {
        data = JSON.parse(jsonRaw);
      } catch (e) {
        return await interaction.reply({
          content: '❌ Format JSON invalide. Veuillez vérifier vos données.',
          flags: MessageFlags.Ephemeral,
        });
      }
      const rulesToImport = Array.isArray(data) ? data : [data];
      let importedCount = 0;
      for (const r of rulesToImport) {
        if (!r.name && !r.trigger) continue;
        const autoId = `auto_${crypto.randomBytes(4).toString('hex')}`;
        await db.collection('bot_automations').insertOne({
          ...r,
          _id: undefined,
          guild_id: guildId,
          autoId,
          enabled: false, 
          created_at: new Date(),
          updated_at: new Date(),
        });
        importedCount++;
      }
      return await interaction.reply({
        content: `✅ **${importedCount}** automatisation(s) importée(s) avec succès (désactivées par défaut pour vérification).`,
      });
    }
    if (sub === 'nettoyer') {
      const jours = interaction.options.getInteger('jours') || 30;
      const count = await cleanOldLogs(guildId, jours);
      return await interaction.reply({
        content: `🧹 Nettoyage terminé : **${count}** ancien(s) journal(aux) d'exécution de plus de **${jours}** jours ont été purgés.`,
      });
    }
  },
};
