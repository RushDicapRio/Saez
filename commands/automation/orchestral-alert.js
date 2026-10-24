import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';
import { getDb } from '../../database/mongo.js';
import {
  triggerOrchestralAlert,
  acknowledgeAlert,
} from '../../services/automationService.js';
import crypto from 'crypto';
export default {
  data: new SlashCommandBuilder()
    .setName('orchestral-alert')
    .setDescription('Système orchestré d\'alertes staff, notifications d\'incidents et escalades')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('creer')
        .setDescription('Créer et enregistrer une alerte orchestrée réutilisable ou immédiate')
        .addStringOption((opt) => opt.setName('titre').setDescription('Titre explicite de l\'alerte').setRequired(true))
        .addStringOption((opt) => opt.setName('message').setDescription('Description ou contenu du message d\'alerte').setRequired(true))
        .addStringOption((opt) =>
          opt
            .setName('priorite')
            .setDescription('Niveau de criticité de l\'alerte')
            .setRequired(true)
            .addChoices(
              { name: '🟢 Basse (Information générale)', value: 'Basse' },
              { name: '🟡 Moyenne (Attention requise)', value: 'Moyenne' },
              { name: '🟠 Haute (Incident prioritaire)', value: 'Haute' },
              { name: '🔴 Critique (Urgence absolue, acquittement obligatoire)', value: 'Critique' }
            )
        )
        .addChannelOption((opt) => opt.setName('salon').setDescription('Salon de destination de l\'alerte').setRequired(false))
        .addRoleOption((opt) => opt.setName('role_cible').setDescription('Rôle notifié/autorisé à acquitter').setRequired(false))
        .addRoleOption((opt) => opt.setName('role_escalade').setDescription('Rôle recevant l\'escalade si non acquittée').setRequired(false))
        .addIntegerOption((opt) => opt.setName('delai_relance_min').setDescription('Délai de relance automatique en minutes').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('liste')
        .setDescription('Lister les alertes configurées et actives')
    )
    .addSubcommand((sub) =>
      sub
        .setName('details')
        .setDescription('Afficher les détails et l\'état d\'acquittement d\'une alerte')
        .addStringOption((opt) => opt.setName('id').setDescription('ID de l\'alerte').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('declencher')
        .setDescription('Déclencher immédiatement une alerte orchestrée enregistrée')
        .addStringOption((opt) => opt.setName('id').setDescription('ID de l\'alerte à émettre').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('acquitter')
        .setDescription('Acquitter une alerte en cours pour clore le cycle')
        .addStringOption((opt) => opt.setName('id').setDescription('ID de l\'alerte').setRequired(true))
        .addStringOption((opt) => opt.setName('note').setDescription('Note ou rapport de résolution').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('sourdine')
        .setDescription('Mettre en sourdine temporaire une alerte pour éviter les relances')
        .addStringOption((opt) => opt.setName('id').setDescription('ID de l\'alerte').setRequired(true))
        .addIntegerOption((opt) => opt.setName('minutes').setDescription('Durée de la sourdine en minutes (défaut: 30)').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('escalade')
        .setDescription('Déclencher manuellement l\'escalade vers le rôle supérieur')
        .addStringOption((opt) => opt.setName('id').setDescription('ID de l\'alerte').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('supprimer')
        .setDescription('Supprimer une alerte configurée')
        .addStringOption((opt) => opt.setName('id').setDescription('ID de l\'alerte').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('stats')
        .setDescription('Statistiques d\'envoi, d\'acquittement et temps moyen de réaction')
    )
    .addSubcommand((sub) =>
      sub
        .setName('modeles')
        .setDescription('Installer un modèle d\'alerte prédéfini (Panne, Raid, Maintenance)')
        .addStringOption((opt) =>
          opt
            .setName('modele')
            .setDescription('Modèle à déployer')
            .setRequired(true)
            .addChoices(
              { name: 'Panne Serveur / API Anime', value: 'incident_api' },
              { name: 'Alerte Raid / Anti-Spam', value: 'raid_alert' },
              { name: 'Maintenance Programmée', value: 'maintenance' }
            )
        )
    ),
  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({
        content: '❌ Vous devez avoir la permission **Gérer le serveur** pour administrer les alertes orchestrées.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const db = getDb();
    if (!db) {
      return await interaction.reply({
        content: '❌ Base de données temporairement indisponible.',
        flags: MessageFlags.Ephemeral,
      });
    }
    if (sub === 'creer') {
      const titre = interaction.options.getString('titre');
      const message = interaction.options.getString('message');
      const priorite = interaction.options.getString('priorite');
      const salon = interaction.options.getChannel('salon') || interaction.channel;
      const roleCible = interaction.options.getRole('role_cible');
      const roleEscalade = interaction.options.getRole('role_escalade');
      const relanceMin = interaction.options.getInteger('delai_relance_min') || 0;
      const alertId = `alt_${crypto.randomBytes(4).toString('hex')}`;
      const alertDoc = {
        alertId,
        guildId,
        title: titre,
        message,
        priority: priorite,
        channelId: salon.id,
        roleId: roleCible ? roleCible.id : null,
        escalationRoleId: roleEscalade ? roleEscalade.id : null,
        retryDelayMinutes: relanceMin,
        acknowledged: false,
        acknowledgedBy: null,
        acknowledgedAt: null,
        mutedUntil: null,
        escalated: false,
        deliveryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.collection('bot_alerts').insertOne(alertDoc);
      const embed = new EmbedBuilder()
        .setTitle('🚨 Nouvelle Alerte Orchestrée Configurée')
        .setDescription(`L'alerte **${titre}** a été enregistrée avec succès.`)
        .setColor(priorite === 'Critique' ? 0xff0033 : priorite === 'Haute' ? 0xff6600 : 0x00e5ff)
        .addFields(
          { name: '🆔 ID Alerte', value: `\`${alertId}\``, inline: true },
          { name: '⚡ Priorité', value: `**${priorite}**`, inline: true },
          { name: '📍 Salon', value: `<#${salon.id}>`, inline: true },
          { name: '👥 Rôle notifié', value: roleCible ? `<@&${roleCible.id}>` : 'Aucun (Général)', inline: true },
          { name: '🛡️ Escalade', value: roleEscalade ? `<@&${roleEscalade.id}>` : 'Désactivée', inline: true },
          { name: '🔄 Relance', value: relanceMin > 0 ? `${relanceMin} min` : 'Désactivée', inline: true },
          { name: '📝 Message', value: message, inline: false }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Pour la déclencher manuellement : /orchestral-alert declencher id:' + alertId });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'liste') {
      const alerts = await db.collection('bot_alerts')
        .find({ guildId })
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray();
      const embed = new EmbedBuilder()
        .setTitle('📋 Alertes Orchestrées du Serveur')
        .setColor(0x8b5cf6)
        .setFooter({ text: `Codé avec ❤️ par Saez | ${alerts.length} alerte(s) trouvée(s)` });
      if (alerts.length === 0) {
        embed.setDescription('Aucune alerte orchestrée enregistrée sur ce serveur.\nUtilisez `/orchestral-alert creer` ou `/orchestral-alert modeles` pour en définir une.');
        return await interaction.reply({ embeds: [embed] });
      }
      const lines = alerts.map((a) => {
        let status = '🟢 En attente';
        if (a.acknowledged) status = `✅ Acquittée (<@${a.acknowledgedBy}>)`;
        else if (a.mutedUntil && new Date(a.mutedUntil) > new Date()) status = '🔇 En sourdine';
        else if (a.escalated) status = '⚠️ Escaladée';
        return `• \`[${a.alertId}]\` **${a.title}** — **${a.priority}**\n  ↳ ${status} | Salon: <#${a.channelId}> | Envois: ${a.deliveryCount || 0}`;
      });
      embed.setDescription(lines.join('\n\n'));
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'details') {
      const alertId = interaction.options.getString('id');
      const a = await db.collection('bot_alerts').findOne({ guildId, alertId });
      if (!a) {
        return await interaction.reply({
          content: `❌ Alerte introuvable avec l'ID \`${alertId}\`.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      const embed = new EmbedBuilder()
        .setTitle(`🚨 Détails Alerte : ${a.title}`)
        .setColor(a.priority === 'Critique' ? 0xff0033 : 0x00e5ff)
        .addFields(
          { name: '🆔 ID', value: `\`${a.alertId}\``, inline: true },
          { name: '⚡ Priorité', value: a.priority, inline: true },
          { name: '📍 Salon', value: `<#${a.channelId}>`, inline: true },
          { name: '👥 Rôle notifié', value: a.roleId ? `<@&${a.roleId}>` : 'Aucun', inline: true },
          { name: '🛡️ Escalade', value: a.escalationRoleId ? `<@&${a.escalationRoleId}>` : 'Aucune', inline: true },
          { name: '📊 Nombre d\'émissions', value: `${a.deliveryCount || 0}`, inline: true },
          { name: '📝 Message', value: a.message, inline: false },
          {
            name: '✅ État d\'acquittement',
            value: a.acknowledged
              ? `Acquittée par <@${a.acknowledgedBy}> le <t:${Math.floor(new Date(a.acknowledgedAt).getTime() / 1000)}:f>${a.resolutionNote ? `\nNote : *${a.resolutionNote}*` : ''}`
              : 'Non acquittée (En cours)',
            inline: false,
          }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'declencher') {
      const alertId = interaction.options.getString('id');
      const a = await db.collection('bot_alerts').findOne({ guildId, alertId });
      if (!a) {
        return await interaction.reply({
          content: `❌ Alerte \`${alertId}\` introuvable.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const res = await triggerOrchestralAlert(interaction.guild, {
        alertId: a.alertId,
        title: a.title,
        message: a.message,
        priority: a.priority,
        channelId: a.channelId,
        roleId: a.roleId,
        escalationRoleId: a.escalationRoleId,
      });
      if (res.success) {
        return await interaction.editReply({
          content: `🚨 L'alerte **${a.title}** (\`${alertId}\`) a été diffusée avec succès dans le salon <#${a.channelId}>.`,
        });
      } else {
        return await interaction.editReply({
          content: `❌ Échec de la diffusion de l'alerte : \`${res.error}\`.`,
        });
      }
    }
    if (sub === 'acquitter') {
      const alertId = interaction.options.getString('id');
      const note = interaction.options.getString('note') || 'Acquitté via commande slash';
      const res = await acknowledgeAlert(alertId, interaction.user.id, note);
      if (res.success) {
        return await interaction.reply({
          content: `✅ L'alerte \`${alertId}\` a été acquittée par ${interaction.user}. Les relances sont arrêtées.`,
        });
      } else {
        return await interaction.reply({
          content: `❌ Impossible d'acquitter l'alerte : \`${res.error}\`.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
    if (sub === 'sourdine') {
      const alertId = interaction.options.getString('id');
      const minutes = interaction.options.getInteger('minutes') || 30;
      const until = new Date(Date.now() + minutes * 60 * 1000);
      const res = await db.collection('bot_alerts').updateOne(
        { guildId, alertId },
        { $set: { mutedUntil: until, updatedAt: new Date() } }
      );
      if (res.matchedCount === 0) {
        return await interaction.reply({
          content: `❌ Alerte \`${alertId}\` introuvable.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      return await interaction.reply({
        content: `🔇 L'alerte \`${alertId}\` a été mise en sourdine pour **${minutes} minutes** (jusqu'à <t:${Math.floor(until.getTime() / 1000)}:t>).`,
      });
    }
    if (sub === 'escalade') {
      const alertId = interaction.options.getString('id');
      const a = await db.collection('bot_alerts').findOne({ guildId, alertId });
      if (!a) {
        return await interaction.reply({
          content: `❌ Alerte \`${alertId}\` introuvable.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      if (!a.escalationRoleId) {
        return await interaction.reply({
          content: `⚠️ Aucun rôle d'escalade n'a été paramétré sur l'alerte \`${alertId}\`.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      const targetChannel = interaction.guild.channels.cache.get(a.channelId);
      if (targetChannel && targetChannel.isTextBased()) {
        await targetChannel.send({
          content: `⚠️ **ESCALADE D'ALERTE** — <@&${a.escalationRoleId}>\nL'alerte **${a.title}** (\`${alertId}\`) n'a pas été acquittée à temps ou requiert une intervention d'urgence !`,
        });
        await db.collection('bot_alerts').updateOne(
          { guildId, alertId },
          { $set: { escalated: true, updatedAt: new Date() } }
        );
        return await interaction.reply({
          content: `🛡️ Escalade transmise au rôle <@&${a.escalationRoleId}> dans <#${a.channelId}>.`,
        });
      } else {
        return await interaction.reply({
          content: `❌ Impossible d'accéder au salon cible <#${a.channelId}>.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
    if (sub === 'supprimer') {
      const alertId = interaction.options.getString('id');
      const res = await db.collection('bot_alerts').deleteOne({ guildId, alertId });
      if (res.deletedCount === 0) {
        return await interaction.reply({
          content: `❌ Alerte \`${alertId}\` introuvable.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      return await interaction.reply({
        content: `🗑️ L'alerte \`${alertId}\` a été définitivement supprimée.`,
      });
    }
    if (sub === 'stats') {
      const total = await db.collection('bot_alerts').countDocuments({ guildId });
      const ackCount = await db.collection('bot_alerts').countDocuments({ guildId, acknowledged: true });
      const activeCount = await db.collection('bot_alerts').countDocuments({ guildId, acknowledged: false });
      const embed = new EmbedBuilder()
        .setTitle('📊 Statistiques du Centre d\'Alertes Orchestrées')
        .setColor(0x8b5cf6)
        .addFields(
          { name: 'Total d\'alertes configurées', value: `${total}`, inline: true },
          { name: 'En cours (non acquittées)', value: `${activeCount}`, inline: true },
          { name: 'Résolues & Acquittées', value: `${ackCount}`, inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'modeles') {
      const mod = interaction.options.getString('modele');
      let title = '';
      let message = '';
      let priority = 'Haute';
      if (mod === 'incident_api') {
        title = 'Panne Source Vidéo / Scraping Anime';
        message = 'Une interruption a été signalée sur un des fournisseurs vidéo ou API streaming. Les développeurs ont été notifiés.';
        priority = 'Haute';
      } else if (mod === 'raid_alert') {
        title = 'Suspicion de Raid / Vague de Spam';
        message = 'Une forte activité anormale ou répétitive a été détectée sur le serveur. Passage du serveur sous vigilance modération.';
        priority = 'Critique';
      } else if (mod === 'maintenance') {
        title = 'Maintenance Système Programmée';
        message = 'Une mise à jour ou maintenance technique est en cours sur le bot Saez Animes. Le retour à la normale est prévu sous peu.';
        priority = 'Moyenne';
      }
      const alertId = `alt_${crypto.randomBytes(4).toString('hex')}`;
      await db.collection('bot_alerts').insertOne({
        alertId,
        guildId,
        title,
        message,
        priority,
        channelId: interaction.channelId,
        roleId: null,
        escalationRoleId: null,
        acknowledged: false,
        deliveryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return await interaction.reply({
        content: `🎉 Modèle déployé avec succès : **${title}** (\`${alertId}\`). Prêt à l'emploi via \`/orchestral-alert declencher id:${alertId}\`.`,
      });
    }
  },
};
