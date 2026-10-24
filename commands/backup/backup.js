import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  MessageFlags,
  AttachmentBuilder,
  ChannelType,
  ComponentType,
} from 'discord.js';
import {
  createBackup,
  getBackup,
  listBackups,
  deleteBackup,
  renameBackup,
  duplicateBackup,
  verifyBackup,
  compareBackup,
  testRestore,
  restoreBackup,
  cancelRestore,
  exportBackup,
  importBackup,
  cleanupBackups,
  getBackupStats,
  getBackupSettings,
  saveBackupSettings,
  getBackupHistory,
  BACKUP_TYPES,
} from '../../services/backupService.js';
import { config } from '../../config.js';
export default {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Système complet de sauvegarde, restauration et archivage du serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Créer une sauvegarde configurable du serveur')
        .addStringOption((opt) => opt.setName('nom').setDescription('Nom personnalisé de la sauvegarde').setRequired(false))
        .addStringOption((opt) => opt.setName('description').setDescription('Description ou note explicative').setRequired(false))
        .addStringOption((opt) =>
          opt
            .setName('type')
            .setDescription('Type de sauvegarde')
            .setRequired(false)
            .addChoices(
              { name: 'Complète (Rôles, Salons, Paramètres & Configs)', value: BACKUP_TYPES.FULL },
              { name: 'Rôles uniquement', value: BACKUP_TYPES.ROLES },
              { name: 'Salons & Catégories uniquement', value: BACKUP_TYPES.CHANNELS },
              { name: 'Configurations Bot uniquement (Tickets, Bienvenue...)', value: BACKUP_TYPES.BOT_CONFIG }
            )
        )
        .addBooleanOption((opt) => opt.setName('inclure_roles').setDescription('Inclure les rôles (Vrai/Faux)').setRequired(false))
        .addBooleanOption((opt) => opt.setName('inclure_salons').setDescription('Inclure les salons et catégories (Vrai/Faux)').setRequired(false))
        .addBooleanOption((opt) => opt.setName('inclure_configs').setDescription('Inclure les configurations du bot (Vrai/Faux)').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('creer')
        .setDescription('Alias français pour /backup create')
        .addStringOption((opt) => opt.setName('nom').setDescription('Nom personnalisé').setRequired(false))
        .addStringOption((opt) => opt.setName('description').setDescription('Description').setRequired(false))
        .addStringOption((opt) =>
          opt
            .setName('type')
            .setDescription('Type de sauvegarde')
            .setRequired(false)
            .addChoices(
              { name: 'Complète', value: BACKUP_TYPES.FULL },
              { name: 'Rôles uniquement', value: BACKUP_TYPES.ROLES },
              { name: 'Salons uniquement', value: BACKUP_TYPES.CHANNELS },
              { name: 'Configurations Bot', value: BACKUP_TYPES.BOT_CONFIG }
            )
        )
        .addBooleanOption((opt) => opt.setName('inclure_roles').setDescription('Inclure les rôles (Vrai/Faux)').setRequired(false))
        .addBooleanOption((opt) => opt.setName('inclure_salons').setDescription('Inclure les salons et catégories (Vrai/Faux)').setRequired(false))
        .addBooleanOption((opt) => opt.setName('inclure_configs').setDescription('Inclure les configurations du bot (Vrai/Faux)').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('Afficher la liste paginée des sauvegardes disponibles')
        .addStringOption((opt) =>
          opt
            .setName('type')
            .setDescription('Filtrer par type')
            .setRequired(false)
            .addChoices(
              { name: 'Tous les types', value: 'all' },
              { name: 'Complètes', value: BACKUP_TYPES.FULL },
              { name: 'Rôles', value: BACKUP_TYPES.ROLES },
              { name: 'Salons', value: BACKUP_TYPES.CHANNELS },
              { name: 'Configs Bot', value: BACKUP_TYPES.BOT_CONFIG },
              { name: 'Pré-restauration', value: BACKUP_TYPES.PRE_MODIFICATION }
            )
        )
        .addStringOption((opt) =>
          opt
            .setName('tri')
            .setDescription('Ordre de tri')
            .setRequired(false)
            .addChoices(
              { name: 'Plus récentes en premier', value: 'created_at' },
              { name: 'Taille du fichier', value: 'size_bytes' },
              { name: 'Nom alphabétique', value: 'name' }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('liste')
        .setDescription('Alias français pour /backup list')
        .addStringOption((opt) =>
          opt
            .setName('type')
            .setDescription('Filtrer par type')
            .setRequired(false)
            .addChoices(
              { name: 'Tous les types', value: 'all' },
              { name: 'Complètes', value: BACKUP_TYPES.FULL },
              { name: 'Rôles', value: BACKUP_TYPES.ROLES },
              { name: 'Salons', value: BACKUP_TYPES.CHANNELS },
              { name: 'Configs Bot', value: BACKUP_TYPES.BOT_CONFIG }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('export')
        .setDescription('Exporter une sauvegarde sous forme de fichier JSON certifié')
        .addStringOption((opt) =>
          opt.setName('id').setDescription('Identifiant de la sauvegarde à exporter').setRequired(true).setAutocomplete(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('restore')
        .setDescription('Restaurer une sauvegarde avec confirmation et sécurité')
        .addStringOption((opt) =>
          opt.setName('id').setDescription('Identifiant de la sauvegarde').setRequired(true).setAutocomplete(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('mode')
            .setDescription('Mode de restauration')
            .setRequired(false)
            .addChoices(
              { name: 'Fusion sécurisée (recommande - ajoute les éléments manquants)', value: 'merge' },
              { name: 'Sélectif (uniquement les catégories choisies)', value: 'selective' }
            )
        )
        .addStringOption((opt) =>
          opt
            .setName('categories')
            .setDescription('Catégories à restaurer (mode sélectif)')
            .setRequired(false)
            .addChoices(
              { name: 'Tout restaurer (Rôles, Salons, Configs)', value: 'all' },
              { name: 'Rôles uniquement', value: 'roles' },
              { name: 'Salons uniquement', value: 'channels' },
              { name: 'Configurations Bot uniquement', value: 'bot_config' }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('Supprimer définitivement une sauvegarde')
        .addStringOption((opt) =>
          opt.setName('id').setDescription('Identifiant de la sauvegarde à supprimer').setRequired(true).setAutocomplete(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('details')
        .setDescription('Afficher la fiche technique complète d\'une sauvegarde')
        .addStringOption((opt) =>
          opt.setName('id').setDescription('Identifiant de la sauvegarde').setRequired(true).setAutocomplete(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('rename')
        .setDescription('Renommer une sauvegarde existante')
        .addStringOption((opt) =>
          opt.setName('id').setDescription('Identifiant de la sauvegarde').setRequired(true).setAutocomplete(true)
        )
        .addStringOption((opt) => opt.setName('nouveau_nom').setDescription('Nouveau nom').setRequired(true))
        .addStringOption((opt) => opt.setName('description').setDescription('Nouvelle description').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('verify')
        .setDescription('Vérifier l\'intégrité cryptographique et la conformité d\'une sauvegarde')
        .addStringOption((opt) =>
          opt.setName('id').setDescription('Identifiant de la sauvegarde à vérifier').setRequired(true).setAutocomplete(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('compare')
        .setDescription('Comparer la sauvegarde avec l\'état actuel du serveur (lecture seule)')
        .addStringOption((opt) =>
          opt.setName('id').setDescription('Identifiant de la sauvegarde').setRequired(true).setAutocomplete(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('schedule')
        .setDescription('Configurer la fréquence des sauvegardes automatiques')
        .addStringOption((opt) =>
          opt
            .setName('frequence')
            .setDescription('Fréquence de sauvegarde')
            .setRequired(true)
            .addChoices(
              { name: 'Toutes les heures', value: 'hourly' },
              { name: 'Toutes les 12 heures', value: 'every_12h' },
              { name: 'Quotidienne (chaque jour)', value: 'daily' },
              { name: 'Hebdomadaire (chaque semaine)', value: 'weekly' }
            )
        )
        .addStringOption((opt) =>
          opt
            .setName('type')
            .setDescription('Type de sauvegarde planifiée')
            .setRequired(false)
            .addChoices(
              { name: 'Complète', value: BACKUP_TYPES.FULL },
              { name: 'Rôles uniquement', value: BACKUP_TYPES.ROLES },
              { name: 'Salons uniquement', value: BACKUP_TYPES.CHANNELS },
              { name: 'Configurations Bot', value: BACKUP_TYPES.BOT_CONFIG }
            )
        )
        .addChannelOption((opt) =>
          opt
            .setName('salon_logs')
            .setDescription('Salon textuel où envoyer les alertes de sauvegarde auto')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('autosave')
        .setDescription('Activer ou désactiver les sauvegardes automatiques')
        .addBooleanOption((opt) =>
          opt.setName('actif').setDescription('Activer (True) ou Désactiver (False)').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('history')
        .setDescription('Consulter l\'historique d\'audit des opérations de sauvegarde et restauration')
        .addIntegerOption((opt) => opt.setName('limite').setDescription('Nombre d\'entrées (1-25)').setMinValue(1).setMaxValue(25).setRequired(false))
    )
    .addSubcommand((sub) =>
      sub.setName('status').setDescription('Consulter l\'état opérationnel et de santé du module Backup')
    )
    .addSubcommand((sub) =>
      sub
        .setName('import')
        .setDescription('Importer une sauvegarde depuis un fichier JSON compatible')
        .addAttachmentOption((opt) =>
          opt.setName('fichier').setDescription('Fichier JSON de sauvegarde à importer').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('duplicate')
        .setDescription('Cloner une sauvegarde existante sous un nouvel identifiant')
        .addStringOption((opt) =>
          opt.setName('id').setDescription('Identifiant de la sauvegarde source').setRequired(true).setAutocomplete(true)
        )
        .addStringOption((opt) => opt.setName('nom_copie').setDescription('Nom de la nouvelle copie').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('cleanup')
        .setDescription('Nettoyer les anciennes sauvegardes selon une politique de conservation')
        .addIntegerOption((opt) =>
          opt.setName('jours').setDescription('Âge minimum des sauvegardes à purger en jours (défaut : 30)').setMinValue(1).setMaxValue(365).setRequired(false)
        )
        .addIntegerOption((opt) =>
          opt.setName('garder_minimum').setDescription('Nombre minimum de sauvegardes à conserver (défaut : 3)').setMinValue(1).setMaxValue(20).setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt.setName('uniquement_auto').setDescription('Purger uniquement les sauvegardes automatiques (défaut : Vrai)').setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('search')
        .setDescription('Rechercher une sauvegarde par mot-clé, date ou identifiant')
        .addStringOption((opt) => opt.setName('terme').setDescription('Terme de recherche').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName('cancel').setDescription('Interrompre immédiatement une opération de restauration en cours')
    )
    .addSubcommand((sub) =>
      sub
        .setName('settings')
        .setDescription('Configurer les paramètres généraux du système de sauvegarde')
        .addIntegerOption((opt) =>
          opt.setName('retention').setDescription('Nombre maximum de sauvegardes auto conservées (1-50)').setMinValue(1).setMaxValue(50).setRequired(false)
        )
        .addChannelOption((opt) =>
          opt
            .setName('salon_notif')
            .setDescription('Salon de notifications pour les rapports de sauvegarde')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt.setName('activer').setDescription('Activer ou désactiver complètement le module de sauvegarde').setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub.setName('stats').setDescription('Consulter les statistiques globales des sauvegardes du serveur')
    )
    .addSubcommand((sub) =>
      sub
        .setName('test-restore')
        .setDescription('Simuler une restauration sans apporter la moindre modification au serveur')
        .addStringOption((opt) =>
          opt.setName('id').setDescription('Identifiant de la sauvegarde à tester').setRequired(true).setAutocomplete(true)
        )
    ),
  async autocomplete(interaction) {
    try {
      const focused = interaction.options.getFocused(true);
      if (focused.name === 'id') {
        const query = focused.value?.toLowerCase() || '';
        const list = await listBackups(interaction.guildId, { limit: 25, sortBy: 'created_at', sortOrder: -1 });
        const filtered = list.backups.filter((b) => {
          return (
            b.backup_id.toLowerCase().includes(query) ||
            b.name.toLowerCase().includes(query) ||
            b.type.toLowerCase().includes(query)
          );
        });
        const choices = filtered.slice(0, 25).map((b) => {
          const dateStr = new Date(b.created_at).toLocaleDateString('fr-FR');
          const typeStr = b.is_auto ? '⏰ Auto' : '💾 Manuel';
          const label = `${b.name} (${dateStr} • ${typeStr})`;
          return {
            name: label.length > 100 ? label.slice(0, 97) + '...' : label,
            value: b.backup_id,
          };
        });
        await interaction.respond(choices);
      }
    } catch {}
  },
  async execute(interaction) {
    const isOwner = interaction.guild.ownerId === interaction.user.id;
    const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
    if (!isAdmin && !isOwner) {
      return await interaction.reply({
        content: '❌ Cette commande est strictement réservée aux Administrateurs du serveur.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;
    const author = interaction.user;
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const settings = await getBackupSettings(guild.id);
    if (!settings.enabled && sub !== 'settings' && sub !== 'status') {
      return await interaction.editReply({
        content:
          '⚠️ Le module de sauvegarde est actuellement **désactivé** sur ce serveur.\n' +
          '👉 Un administrateur peut le réactiver à tout moment avec `/backup settings activer:true`.',
      });
    }
    if (sub === 'create' || sub === 'creer') {
      const customName = interaction.options.getString('nom');
      const desc = interaction.options.getString('description') || '';
      const type = interaction.options.getString('type') || BACKUP_TYPES.FULL;
      const inclureRoles = interaction.options.getBoolean('inclure_roles');
      const inclureSalons = interaction.options.getBoolean('inclure_salons');
      const inclureConfigs = interaction.options.getBoolean('inclure_configs');
      const include = {
        roles: inclureRoles !== null ? inclureRoles : true,
        channels: inclureSalons !== null ? inclureSalons : true,
        guild_settings: true,
        bot_config: inclureConfigs !== null ? inclureConfigs : true,
      };
      const progressEmbed = new EmbedBuilder()
        .setTitle('⏳ Création de la Sauvegarde en cours...')
        .setDescription(`Indexation des éléments de **${guild.name}** en cours (Rôles, Salons, Paramètres, Configurations)...\nVeuillez patienter quelques instants.`)
        .setColor(config.colors?.primary || 0x00e5ff)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      await interaction.editReply({ embeds: [progressEmbed] });
      try {
        const backup = await createBackup(guild, author, {
          name: customName,
          description: desc,
          type,
          include,
          isAuto: false,
          reason: 'Création manuelle via commande slash',
        });
        const embed = new EmbedBuilder()
          .setTitle('💾 Sauvegarde Créée avec Succès')
          .setDescription(`Un instantané fidèle de **${guild.name}** a été enregistré et certifié.`)
          .setColor(config.colors?.success || 0x10b981)
          .addFields(
            { name: '🏷️ Nom', value: backup.name, inline: true },
            { name: '🆔 Identifiant', value: `\`${backup.backup_id}\``, inline: true },
            { name: '📦 Type', value: `\`${backup.type}\``, inline: true },
            { name: '📁 Salons & Catégories', value: `${backup.counts.channels} salons / ${backup.counts.categories} catégories`, inline: true },
            { name: '🏷️ Rôles indexés', value: `${backup.counts.roles} rôles`, inline: true },
            { name: '⚙️ Modules Bot', value: `${backup.counts.bot_modules} configurations`, inline: true },
            { name: '🔐 Empreinte SHA-256', value: `\`${backup.checksum.slice(0, 16)}...\``, inline: true },
            { name: '💾 Poids', value: `${(backup.size_bytes / 1024).toFixed(2)} Ko`, inline: true },
            { name: '🛡️ Intégrité', value: '✅ Valide', inline: true }
          )
          .setFooter({ text: `Codé avec ❤️ par Saez | Version schéma ${backup.schema_version} • Saez Backup Engine` })
          .setTimestamp();
        return await interaction.editReply({ embeds: [embed] });
      } catch (err) {
        return await interaction.editReply({
          content: `❌ Échec lors de la création de la sauvegarde : ${err.message}`,
          embeds: [],
        });
      }
    }
    if (sub === 'list' || sub === 'liste') {
      const typeFilter = interaction.options.getString('type') || null;
      const sortBy = interaction.options.getString('tri') || 'created_at';
      let currentPage = 1;
      const pageSize = 5;
      const fetchPage = async (page) => {
        return await listBackups(guild.id, {
          type: typeFilter,
          sortBy,
          sortOrder: sortBy === 'name' ? 1 : -1,
          page,
          limit: pageSize,
        });
      };
      const result = await fetchPage(currentPage);
      if (result.total === 0) {
        const emptyEmbed = new EmbedBuilder()
          .setTitle('📜 Historique des Sauvegardes Disponibles')
          .setDescription('Aucune sauvegarde ne correspond à vos critères.\nUtilisez `/backup create` pour générer votre première sauvegarde !')
          .setColor(config.colors?.primary || 0x00e5ff)
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        return await interaction.editReply({ embeds: [emptyEmbed] });
      }
      const buildListEmbed = (data, page) => {
        const embed = new EmbedBuilder()
          .setTitle(`📜 Sauvegardes Disponibles (${data.total})`)
          .setDescription(`Voici les sauvegardes enregistrées pour le serveur **${guild.name}**.\n*Page ${page}/${data.totalPages}*`)
          .setColor(config.colors?.primary || 0x00e5ff)
        for (let i = 0; i < data.backups.length; i++) {
          const b = data.backups[i];
          const dateStr = new Date(b.created_at).toLocaleString('fr-FR');
          const typeBadge = b.is_auto ? '⏰ [Auto]' : '💾 [Manuel]';
          const sizeKb = (b.size_bytes / 1024).toFixed(1);
          embed.addFields({
            name: `${typeBadge} ${b.name} — ${dateStr}`,
            value:
              `> 🆔 ID : \`${b.backup_id}\`\n` +
              `> 📊 Type : \`${b.type}\` • ${b.counts.roles} rôles • ${b.counts.channels} salons\n` +
              `> 💾 Poids : ${sizeKb} Ko • Auteur : ${b.author?.tag || 'Inconnu'}\n` +
              `> 💡 *Restaurer : \`/backup restore id:${b.backup_id}\`*`,
          });
        }
        embed.setFooter({ text: 'Codé avec ❤️ par Saez | Utilisez les boutons ci-dessous pour parcourir la liste' });
        return embed;
      };
      const buildButtons = (page, totalPages) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('btn_backup_prev')
            .setLabel('◀ Précédent')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page <= 1),
          new ButtonBuilder()
            .setCustomId('btn_backup_next')
            .setLabel('Suivant ▶')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages),
          new ButtonBuilder()
            .setCustomId('btn_backup_refresh')
            .setLabel('🔄 Actualiser')
            .setStyle(ButtonStyle.Primary)
        );
      };
      const response = await interaction.editReply({
        embeds: [buildListEmbed(result, currentPage)],
        components: result.totalPages > 1 ? [buildButtons(currentPage, result.totalPages)] : [],
      });
      if (result.totalPages > 1) {
        const collector = response.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 120000,
        });
        collector.on('collect', async (btnInt) => {
          if (btnInt.user.id !== author.id) {
            return await btnInt.reply({ content: '❌ Cette pagination ne vous appartient pas.', flags: MessageFlags.Ephemeral });
          }
          if (btnInt.customId === 'btn_backup_prev') {
            currentPage = Math.max(1, currentPage - 1);
          } else if (btnInt.customId === 'btn_backup_next') {
            currentPage = Math.min(result.totalPages, currentPage + 1);
          }
          const updated = await fetchPage(currentPage);
          await btnInt.update({
            embeds: [buildListEmbed(updated, currentPage)],
            components: [buildButtons(currentPage, updated.totalPages)],
          });
        });
        collector.on('end', async () => {
          await interaction.editReply({ components: [] }).catch(() => {});
        });
      }
      return;
    }
    if (sub === 'export') {
      const backupId = interaction.options.getString('id');
      const exportRes = await exportBackup(guild.id, backupId);
      if (!exportRes.success) {
        return await interaction.editReply({ content: `❌ ${exportRes.message}` });
      }
      const attachment = new AttachmentBuilder(exportRes.buffer, { name: exportRes.filename });
      const embed = new EmbedBuilder()
        .setTitle('📦 Export de Sauvegarde Certifié')
        .setDescription(
          `Voici le fichier JSON de la sauvegarde **${exportRes.backup.name}**.\n` +
          `Ce fichier contient le manifeste complet, la signature d'intégrité et l'ensemble des données structurées.`
        )
        .setColor(config.colors?.primary || 0x00e5ff)
        .addFields(
          { name: '🆔 Identifiant', value: `\`${exportRes.backup.backup_id}\``, inline: true },
          { name: '📁 Fichier', value: `\`${exportRes.filename}\``, inline: true },
          { name: '💾 Poids', value: `${(exportRes.sizeBytes / 1024).toFixed(2)} Ko`, inline: true },
          { name: '🔐 SHA-256', value: `\`${exportRes.backup.checksum.slice(0, 20)}...\``, inline: false }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Les identifiants sensibles et tokens ont été retirés par sécurité.' });
      return await interaction.editReply({
        embeds: [embed],
        files: [attachment],
      });
    }
    if (sub === 'details') {
      const backupId = interaction.options.getString('id');
      const backup = await getBackup(guild.id, backupId);
      if (!backup) {
        return await interaction.editReply({ content: '❌ Sauvegarde introuvable sur ce serveur.' });
      }
      const dateStr = new Date(backup.created_at).toLocaleString('fr-FR');
      const verification = verifyBackup(backup);
      const embed = new EmbedBuilder()
        .setTitle(`🔍 Détails de la Sauvegarde : ${backup.name}`)
        .setDescription(backup.description ? `*${backup.description}*` : '*Aucune description.*')
        .setColor(config.colors?.primary || 0x00e5ff)
        .addFields(
          { name: '🆔 Identifiant Unique', value: `\`${backup.backup_id}\``, inline: true },
          { name: '📅 Date de création', value: dateStr, inline: true },
          { name: '👤 Auteur', value: backup.author?.tag || 'Système', inline: true },
          { name: '📦 Type', value: `\`${backup.type}\``, inline: true },
          { name: '⏰ Automatique', value: backup.is_auto ? 'Oui' : 'Non', inline: true },
          { name: '💾 Taille disque', value: `${(backup.size_bytes / 1024).toFixed(2)} Ko`, inline: true },
          { name: '🏷️ Rôles indexés', value: `${backup.counts.roles}`, inline: true },
          { name: '💬 Salons indexés', value: `${backup.counts.channels}`, inline: true },
          { name: '📁 Catégories indexées', value: `${backup.counts.categories}`, inline: true },
          { name: '⚙️ Modules Bot inclus', value: `${backup.counts.bot_modules}`, inline: true },
          { name: '📋 Version Schéma', value: `v${backup.schema_version}`, inline: true },
          { name: '🛡️ Statut Intégrité', value: verification.valid ? '✅ Conforme (SHA-256 OK)' : '❌ Corrompu', inline: true },
          { name: '🔐 Empreinte Cryptographique', value: `\`${backup.checksum}\``, inline: false }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Pour tester sans risque : /backup test-restore' });
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'verify') {
      const backupId = interaction.options.getString('id');
      const backup = await getBackup(guild.id, backupId);
      if (!backup) {
        return await interaction.editReply({ content: '❌ Sauvegarde introuvable sur ce serveur.' });
      }
      const res = verifyBackup(backup);
      const embed = new EmbedBuilder()
        .setTitle(`🛡️ Vérification d'Intégrité : ${backup.name}`)
        .setDescription(`Analyse structurelle et cryptographique de la sauvegarde \`${backup.backup_id}\`.`)
        .setColor(res.valid ? (res.warnings.length ? 0xf59e0b : 0x10b981) : 0xef4444)
        .addFields(
          { name: '📊 Résultat global', value: res.valid ? (res.warnings.length ? '⚠️ Valide avec avertissements' : '✅ Intégrité Parfaite') : '❌ Échec Critique', inline: true },
          { name: '🔐 Checksum SHA-256', value: res.errors.some((e) => e.includes('SHA-256')) ? '❌ Non Conforme' : '✅ Vérifié et Conforme', inline: true },
          { name: '📋 Éléments vérifiés', value: `${res.stats.roles} rôles, ${res.stats.channels} salons, ${res.stats.botConfigs} configs bot`, inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (res.errors.length) {
        embed.addFields({ name: '❌ Erreurs bloquantes', value: res.errors.map((e) => `• ${e}`).join('\n') });
      }
      if (res.warnings.length) {
        embed.addFields({ name: '⚠️ Avertissements non bloquants', value: res.warnings.map((w) => `• ${w}`).join('\n') });
      }
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'compare') {
      const backupId = interaction.options.getString('id');
      const backup = await getBackup(guild.id, backupId);
      if (!backup) {
        return await interaction.editReply({ content: '❌ Sauvegarde introuvable.' });
      }
      const comp = await compareBackup(guild, backup);
      if (!comp.success) {
        return await interaction.editReply({ content: `❌ ${comp.message}` });
      }
      const { roles, channels, botConfigs } = comp.comparison;
      const embed = new EmbedBuilder()
        .setTitle(`⚖️ Comparaison : ${backup.name} vs État Actuel`)
        .setDescription(`Analyse différentielle en lecture seule entre la sauvegarde et le serveur en direct.`)
        .setColor(config.colors?.primary || 0x00e5ff)
        .addFields(
          {
            name: '🏷️ Différences Rôles',
            value:
              `> ➕ Manquants sur le serveur : **${roles.missingInServer.length}**\n` +
              `> ➖ En plus sur le serveur : **${roles.extraInServer.length}**\n` +
              `> ✏️ Propriétés modifiées : **${roles.modified.length}**\n` +
              `> 🟢 Identiques : **${roles.identical}**`,
            inline: false,
          },
          {
            name: '💬 Différences Salons & Catégories',
            value:
              `> ➕ Manquants sur le serveur : **${channels.missingInServer.length}**\n` +
              `> ➖ En plus sur le serveur : **${channels.extraInServer.length}**\n` +
              `> ✏️ Propriétés modifiées : **${channels.modified.length}**\n` +
              `> 🟢 Identiques : **${channels.identical}**`,
            inline: false,
          },
          {
            name: '⚙️ Modules Bot dans la sauvegarde',
            value: botConfigs.availableInBackup.length
              ? botConfigs.availableInBackup.map((m) => `\`${m}\``).join(', ')
              : '*Aucune config bot stockée*',
            inline: false,
          }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Cette comparaison n\'a apporté aucune modification au serveur.' });
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'test-restore') {
      const backupId = interaction.options.getString('id');
      const backup = await getBackup(guild.id, backupId);
      if (!backup) {
        return await interaction.editReply({ content: '❌ Sauvegarde introuvable.' });
      }
      const plan = await testRestore(guild, backup);
      const embed = new EmbedBuilder()
        .setTitle(`🧪 Simulation de Restauration : ${backup.name}`)
        .setDescription('**Mode simulation (Dry-Run)** : Aucune modification n\'a été appliquée au serveur.')
        .setColor(plan.warnings.length ? 0xf59e0b : 0x10b981)
        .addFields(
          {
            name: '🎭 Rôles',
            value: `• À créer : **${plan.rolesToCreate.length}**\n• À ajuster : **${plan.rolesToUpdate.length}**\n• Ignorés (système/bot) : **${plan.rolesToSkip.length}**`,
            inline: true,
          },
          {
            name: '📁 Salons & Catégories',
            value: `• Catégories à créer : **${plan.categoriesToCreate.length}**\n• Salons à créer : **${plan.channelsToCreate.length}**\n• Salons existants à associer : **${plan.channelsToUpdate.length}**`,
            inline: true,
          },
          {
            name: '⚙️ Configurations Bot',
            value: plan.botConfigsToApply.length ? plan.botConfigsToApply.map((c) => `\`${c}\``).join(', ') : 'Aucune',
            inline: true,
          }
        );
      if (plan.warnings.length > 0) {
        embed.addFields({
          name: '⚠️ Avertissements détectés',
          value: plan.warnings.slice(0, 5).join('\n'),
        });
      }
      embed.setFooter({ text: 'Codé avec ❤️ par Saez | Prêt pour la vraie restauration ? Utilisez /backup restore' });
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'restore') {
      const backupId = interaction.options.getString('id');
      const mode = interaction.options.getString('mode') || 'merge';
      const catChoice = interaction.options.getString('categories') || 'all';
      const backup = await getBackup(guild.id, backupId);
      if (!backup) {
        return await interaction.editReply({ content: '❌ Sauvegarde introuvable sur ce serveur.' });
      }
      const verification = verifyBackup(backup);
      if (!verification.valid) {
        return await interaction.editReply({
          content: `❌ Impossible de restaurer une sauvegarde corrompue : ${verification.errors.join(', ')}`,
        });
      }
      let selectedCategories = ['roles', 'channels', 'bot_config'];
      if (catChoice === 'roles') selectedCategories = ['roles'];
      if (catChoice === 'channels') selectedCategories = ['channels'];
      if (catChoice === 'bot_config') selectedCategories = ['bot_config'];
      const confirmEmbed = new EmbedBuilder()
        .setTitle('⚠️ Confirmation Obligatoire de Restauration')
        .setDescription(
          `Vous êtes sur le point de restaurer la sauvegarde **${backup.name}** sur **${guild.name}**.\n\n` +
          `• **Mode** : \`${mode === 'merge' ? 'Fusion sécurisée (recommandé)' : 'Sélectif'}\`\n` +
          `• **Catégories concernées** : ${selectedCategories.join(', ')}\n` +
          `• **Sécurité** : Une sauvegarde préalable automatique sera créée avant d'appliquer les changements.\n\n` +
          `*Cette opération demande une confirmation explicite.*`
        )
        .setColor(0xef4444)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Cette demande expire dans 60 secondes.' });
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_confirm_restore').setLabel('Confirmer la Restauration').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('btn_cancel_restore').setLabel('Annuler').setStyle(ButtonStyle.Secondary)
      );
      const msg = await interaction.editReply({
        embeds: [confirmEmbed],
        components: [row],
      });
      const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
      });
      collector.on('collect', async (btnInt) => {
        if (btnInt.user.id !== author.id) {
          return await btnInt.reply({ content: '❌ Vous n\'êtes pas l\'auteur de cette demande.', flags: MessageFlags.Ephemeral });
        }
        if (btnInt.customId === 'btn_cancel_restore') {
          await btnInt.update({
            content: '🛑 Restauration annulée. Aucune modification n\'a été apportée au serveur.',
            embeds: [],
            components: [],
          });
          collector.stop('cancelled');
          return;
        }
        if (btnInt.customId === 'btn_confirm_restore') {
          await btnInt.update({
            content: '⏳ **Restauration en cours...** Création de la sauvegarde de sécurité et reconstruction progressive du serveur...',
            embeds: [],
            components: [],
          });
          collector.stop('confirmed');
          try {
            const report = await restoreBackup(guild, backup, author, {
              mode,
              categories: selectedCategories,
              createPreBackup: true,
            });
            const resultEmbed = new EmbedBuilder()
              .setTitle(report.success ? '✅ Restauration Terminée avec Succès' : '⚠️ Restauration Terminée avec Alertes')
              .setDescription(`La sauvegarde **${backup.name}** a été appliquée sur **${guild.name}**.`)
              .setColor(report.success ? 0x10b981 : 0xf59e0b)
              .addFields(
                { name: '🏷️ Rôles créés / ajustés', value: `${report.createdRoles.length} créés • ${report.updatedRoles.length} ajustés`, inline: true },
                { name: '💬 Salons créés / ajustés', value: `${report.createdChannels.length} créés • ${report.updatedChannels.length} ajustés`, inline: true },
                { name: '⚙️ Configurations Bot', value: report.restoredConfigs.length ? report.restoredConfigs.join(', ') : 'Aucune', inline: false }
              );
            if (report.preBackupId) {
              resultEmbed.addFields({
                name: '🛡️ Sauvegarde de Sécurité Préalable',
                value: `ID : \`${report.preBackupId}\` *(utilisable pour annuler en cas de besoin)*`,
                inline: false,
              });
            }
            if (report.warnings.length) {
              resultEmbed.addFields({
                name: '⚠️ Avertissements',
                value: report.warnings.slice(0, 5).join('\n'),
                inline: false,
              });
            }
            if (report.errors.length) {
              resultEmbed.addFields({
                name: '❌ Erreurs rencontrées',
                value: report.errors.slice(0, 5).join('\n'),
                inline: false,
              });
            }
            resultEmbed.setFooter({ text: 'Codé avec ❤️ par Saez | Saez Backup Engine • Restauration contrôlée' });
            await interaction.followUp({ embeds: [resultEmbed], flags: MessageFlags.Ephemeral });
          } catch (restErr) {
            await interaction.followUp({
              content: `❌ Échec lors de la restauration : ${restErr.message}`,
              flags: MessageFlags.Ephemeral,
            });
          }
        }
      });
      collector.on('end', async (_, reason) => {
        if (reason === 'time') {
          await interaction.editReply({
            content: '⏱️ Délai de confirmation dépassé. Restauration annulée par sécurité.',
            embeds: [],
            components: [],
          }).catch(() => {});
        }
      });
      return;
    }
    if (sub === 'delete') {
      const backupId = interaction.options.getString('id');
      const backup = await getBackup(guild.id, backupId);
      if (!backup) {
        return await interaction.editReply({ content: '❌ Sauvegarde introuvable.' });
      }
      const confirmEmbed = new EmbedBuilder()
        .setTitle('🗑️ Confirmer la suppression')
        .setDescription(`Voulez-vous vraiment supprimer définitivement la sauvegarde **${backup.name}** (\`${backup.backup_id}\`) ?\nCette action est irréversible.`)
        .setColor(0xef4444)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_confirm_del').setLabel('Supprimer définitivement').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('btn_cancel_del').setLabel('Conserver').setStyle(ButtonStyle.Secondary)
      );
      const msg = await interaction.editReply({ embeds: [confirmEmbed], components: [row] });
      const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30000,
      });
      collector.on('collect', async (btnInt) => {
        if (btnInt.user.id !== author.id) return;
        if (btnInt.customId === 'btn_confirm_del') {
          await deleteBackup(guild.id, backupId, author);
          await btnInt.update({
            content: `✅ La sauvegarde **${backup.name}** a été définitivement supprimée.`,
            embeds: [],
            components: [],
          });
        } else {
          await btnInt.update({
            content: 'Considération annulée : la sauvegarde a été conservée.',
            embeds: [],
            components: [],
          });
        }
        collector.stop();
      });
      return;
    }
    if (sub === 'rename') {
      const backupId = interaction.options.getString('id');
      const newName = interaction.options.getString('nouveau_nom');
      const newDesc = interaction.options.getString('description');
      const res = await renameBackup(guild.id, backupId, newName, newDesc);
      if (!res.success) {
        return await interaction.editReply({ content: '❌ Sauvegarde introuvable.' });
      }
      return await interaction.editReply({
        content: `✅ La sauvegarde \`${backupId}\` a été renommée en **${newName}**.`,
      });
    }
    if (sub === 'duplicate') {
      const backupId = interaction.options.getString('id');
      const copyName = interaction.options.getString('nom_copie');
      const res = await duplicateBackup(guild.id, backupId, author, copyName);
      if (!res.success) {
        return await interaction.editReply({ content: `❌ ${res.message}` });
      }
      const embed = new EmbedBuilder()
        .setTitle('📋 Sauvegarde Dupliquée avec Succès')
        .setDescription(`La copie a été enregistrée sous le nom **${res.newBackup.name}**.`)
        .setColor(config.colors?.success || 0x10b981)
        .addFields(
          { name: '🆔 Nouvel Identifiant', value: `\`${res.newBackup.backup_id}\``, inline: true },
          { name: '📦 Source originale', value: `\`${backupId}\``, inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'import') {
      const attachment = interaction.options.getAttachment('fichier');
      if (!attachment.name.endsWith('.json')) {
        return await interaction.editReply({ content: '❌ Le fichier doit être au format JSON (.json).' });
      }
      try {
        const response = await fetch(attachment.url);
        const buffer = Buffer.from(await response.arrayBuffer());
        const importRes = await importBackup(guild.id, guild.name, buffer, author);
        if (!importRes.success) {
          return await interaction.editReply({ content: `❌ Échec de l'importation : ${importRes.message}` });
        }
        const b = importRes.backup;
        const embed = new EmbedBuilder()
          .setTitle('📥 Sauvegarde Importée et Certifiée')
          .setDescription(`Le fichier a été validé avec succès et enregistré dans votre bibliothèque.`)
          .setColor(config.colors?.success || 0x10b981)
          .addFields(
            { name: '🏷️ Nom', value: b.name, inline: true },
            { name: '🆔 Identifiant attribué', value: `\`${b.backup_id}\``, inline: true },
            { name: '📁 Éléments vérifiés', value: `${b.counts.roles} rôles • ${b.counts.channels} salons`, inline: true },
            { name: '🔐 SHA-256', value: `\`${b.checksum.slice(0, 16)}...\``, inline: true },
            { name: '💾 Poids', value: `${(b.size_bytes / 1024).toFixed(2)} Ko`, inline: true }
          )
          .setFooter({ text: 'Codé avec ❤️ par Saez | Prêt pour la restauration : /backup restore' });
        return await interaction.editReply({ embeds: [embed] });
      } catch (err) {
        return await interaction.editReply({ content: `❌ Erreur lors du téléchargement du fichier : ${err.message}` });
      }
    }
    if (sub === 'schedule') {
      const freq = interaction.options.getString('frequence');
      const defType = interaction.options.getString('type') || BACKUP_TYPES.FULL;
      const logChan = interaction.options.getChannel('salon_logs');
      await saveBackupSettings(guild.id, {
        auto_backup_enabled: true,
        auto_backup_frequency: freq,
        default_type: defType,
        ...(logChan ? { notify_channel_id: logChan.id } : {}),
      });
      const embed = new EmbedBuilder()
        .setTitle('⏰ Sauvegardes Automatiques Programmées')
        .setDescription(`Le planificateur automatique a été activé pour **${guild.name}**.`)
        .setColor(config.colors?.success || 0x10b981)
        .addFields(
          { name: '🔄 Fréquence', value: freq, inline: true },
          { name: '📦 Type par défaut', value: defType, inline: true },
          { name: '📢 Salon d\'alerte', value: logChan ? `<#${logChan.id}>` : '*Aucun*', inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Backup Scheduler • Persistant après redémarrage' });
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'autosave') {
      const active = interaction.options.getBoolean('actif');
      await saveBackupSettings(guild.id, { auto_backup_enabled: active });
      return await interaction.editReply({
        content: active
          ? '✅ Les sauvegardes automatiques sont désormais **activées** sur ce serveur.'
          : '🛑 Les sauvegardes automatiques sont désormais **désactivées** sur ce serveur.',
      });
    }
    if (sub === 'history') {
      const limit = interaction.options.getInteger('limite') || 10;
      const history = await getBackupHistory(guild.id, limit);
      const embed = new EmbedBuilder()
        .setTitle(`📜 Journal d'Audit des Sauvegardes (${history.length})`)
        .setColor(config.colors?.primary || 0x00e5ff)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (history.length === 0) {
        embed.setDescription('Aucune opération enregistrée dans le journal d\'audit.');
      } else {
        for (const h of history) {
          const dateStr = new Date(h.timestamp).toLocaleString('fr-FR');
          embed.addFields({
            name: `${h.action} — ${dateStr} (${h.author?.tag || 'Système'})`,
            value: `> ${h.details || 'Opération exécutée.'}\n> Sauvegarde : \`${h.backup_id || 'N/A'}\``,
          });
        }
      }
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'status') {
      const stats = await getBackupStats(guild.id);
      const settings = await getBackupSettings(guild.id);
      const botHasAdmin = guild.members.me?.permissions.has(PermissionFlagsBits.Administrator);
      const botHasManageRoles = guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles);
      const botHasManageChannels = guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels);
      const embed = new EmbedBuilder()
        .setTitle('📊 Statut du Système de Sauvegarde')
        .setDescription(`Diagnostic en temps réel pour le serveur **${guild.name}**.`)
        .setColor(config.colors?.primary || 0x00e5ff)
        .addFields(
          { name: '🟢 Module Actif', value: settings.enabled ? 'Oui' : 'Non (Désactivé)', inline: true },
          { name: '⏰ Auto-Backup', value: settings.auto_backup_enabled ? `Activé (${settings.auto_backup_frequency})` : 'Désactivé', inline: true },
          { name: '📦 Sauvegardes Totales', value: `${stats?.total || 0}`, inline: true },
          { name: '💾 Espace Utilisé', value: stats?.totalSizeReadable || '0 Ko', inline: true },
          { name: '🛡️ Rétention Max', value: `${settings.retention_count} sauvegardes`, inline: true },
          {
            name: '🤖 Permissions Discord du Bot',
            value:
              `• Administrateur : ${botHasAdmin ? '✅' : '❌'}\n` +
              `• Gérer les rôles : ${botHasManageRoles ? '✅' : '❌'}\n` +
              `• Gérer les salons : ${botHasManageChannels ? '✅' : '❌'}`,
            inline: false,
          }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'search') {
      const term = interaction.options.getString('terme');
      const list = await listBackups(guild.id, { search: term, limit: 10 });
      const embed = new EmbedBuilder()
        .setTitle(`🔍 Résultats de Recherche pour "${term}" (${list.total})`)
        .setColor(config.colors?.primary || 0x00e5ff)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (list.backups.length === 0) {
        embed.setDescription('Aucune sauvegarde ne correspond à ce critère.');
      } else {
        for (const b of list.backups) {
          const dateStr = new Date(b.created_at).toLocaleDateString('fr-FR');
          embed.addFields({
            name: `${b.name} (${dateStr})`,
            value: `> 🆔 \`${b.backup_id}\` • Type : \`${b.type}\` • ${b.counts.roles}r/${b.counts.channels}c`,
          });
        }
      }
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'cleanup') {
      const days = interaction.options.getInteger('jours') || 30;
      const keep = interaction.options.getInteger('garder_minimum') || 3;
      const onlyAuto = interaction.options.getBoolean('uniquement_auto') !== false;
      const res = await cleanupBackups(guild.id, { olderThanDays: days, keepMin: keep, onlyAuto });
      return await interaction.editReply({
        content: res.reason
          ? `ℹ️ ${res.reason}`
          : `🧹 Nettoyage terminé : **${res.deletedCount}** ancienne(s) sauvegarde(s) purgée(s) (plus de ${days} jours).`,
      });
    }
    if (sub === 'cancel') {
      const cancelled = cancelRestore(guild.id);
      return await interaction.editReply({
        content: cancelled
          ? '🛑 Signal d\'annulation envoyé ! La restauration s\'arrêtera à la fin de l\'étape en cours.'
          : 'ℹ️ Aucune opération de restauration n\'est actuellement active sur ce serveur.',
      });
    }
    if (sub === 'settings') {
      const retention = interaction.options.getInteger('retention');
      const notifyChan = interaction.options.getChannel('salon_notif');
      const active = interaction.options.getBoolean('activer');
      const updates = {};
      if (retention !== null) updates.retention_count = retention;
      if (notifyChan !== null) updates.notify_channel_id = notifyChan.id;
      if (active !== null) updates.enabled = active;
      if (Object.keys(updates).length === 0) {
        const current = await getBackupSettings(guild.id);
        const embed = new EmbedBuilder()
          .setTitle('⚙️ Paramètres du Système Backup')
          .setColor(config.colors?.primary || 0x00e5ff)
          .addFields(
            { name: 'Module Actif', value: current.enabled ? 'Oui' : 'Non', inline: true },
            { name: 'Auto-Sauvegarde', value: current.auto_backup_enabled ? `Oui (${current.auto_backup_frequency})` : 'Non', inline: true },
            { name: 'Rétention Max', value: `${current.retention_count} sauvegardes`, inline: true },
            { name: 'Salon Notifications', value: current.notify_channel_id ? `<#${current.notify_channel_id}>` : '*Non configuré*', inline: true }
          )
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        return await interaction.editReply({ embeds: [embed] });
      }
      await saveBackupSettings(guild.id, updates);
      return await interaction.editReply({ content: '✅ Paramètres de sauvegarde mis à jour avec succès.' });
    }
    if (sub === 'stats') {
      const stats = await getBackupStats(guild.id);
      const embed = new EmbedBuilder()
        .setTitle(`📈 Statistiques des Sauvegardes : ${guild.name}`)
        .setColor(config.colors?.primary || 0x00e5ff)
        .addFields(
          { name: '📦 Sauvegardes Totales', value: `${stats?.total || 0}`, inline: true },
          { name: '💾 Manuel vs Auto', value: `${stats?.manualCount || 0} manuelle(s) • ${stats?.autoCount || 0} auto`, inline: true },
          { name: '💾 Volume Total', value: stats?.totalSizeReadable || '0 Ko', inline: true },
          { name: '📅 Plus récente', value: stats?.lastBackup ? new Date(stats.lastBackup).toLocaleString('fr-FR') : 'Aucune', inline: true },
          { name: '⏳ Plus ancienne', value: stats?.oldestBackup ? new Date(stats.oldestBackup).toLocaleString('fr-FR') : 'Aucune', inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Backup Engine' });
      return await interaction.editReply({ embeds: [embed] });
    }
  },
};
