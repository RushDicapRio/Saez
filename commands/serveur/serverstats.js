import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';
import {
  getServerStatsConfig,
  saveServerStatsConfig,
  syncServerStatsChannels,
  computeServerMetrics,
} from '../../services/serverStatsService.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('serverstats')
  .setDescription('Gère les salons de statistiques automatiques du serveur Discord')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub
      .setName('setup')
      .setDescription('Crée ou met en place les salons vocaux de stats automatiques (Membres, Humains, Bots, Boosts)')
  )
  .addSubcommand((sub) =>
    sub
      .setName('sync')
      .setDescription('Force la mise à jour immédiate des compteurs des salons statistiques')
  )
  .addSubcommand((sub) =>
    sub
      .setName('status')
      .setDescription('Affiche les statistiques en direct du serveur et l\'état des salons')
  )
  .addSubcommand((sub) =>
    sub
      .setName('disable')
      .setDescription('Désactive la mise à jour automatique des salons statistiques du serveur')
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const guild = interaction.guild;
  if (sub === 'setup') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const result = await syncServerStatsChannels(guild, true);
    if (result.success) {
      const embed = new EmbedBuilder()
        .setTitle('📈 Salons Statistiques Serveur Activés !')
        .setDescription(
          'Les salons vocaux verrouillés de statistiques du serveur ont été créés et configurés avec succès !\n' +
          'Ils se mettent à jour automatiquement en temps réel (arrivées, départs, boosts) et toutes les 10 minutes.'
        )
        .setColor(config.colors.primary)
        .addFields(
          { name: '👥 Total Membres', value: `${result.metrics.total}`, inline: true },
          { name: '👤 Membres Humains', value: `${result.metrics.humans}`, inline: true },
          { name: '🤖 Bots', value: `${result.metrics.bots}`, inline: true },
          { name: '🟢 En Ligne', value: `${result.metrics.online}`, inline: true },
          { name: '🚀 Boosts', value: `${result.metrics.boosts} (Niveau ${result.metrics.boostTier})`, inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Compteurs Dynamiques' })
        .setTimestamp();
      return await interaction.editReply({ embeds: [embed] });
    } else {
      return await interaction.editReply({
        content: `❌ Une erreur est survenue lors de la création des salons : ${result.error || result.message}`,
      });
    }
  }
  if (sub === 'sync') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const result = await syncServerStatsChannels(guild, true);
    if (result.success) {
      return await interaction.editReply({
        content: `✅ Salons statistiques actualisés avec succès ! (${result.updatedCount} mis à jour, ${result.createdCount} créés).`,
      });
    } else {
      return await interaction.editReply({
        content: `❌ Échec de la synchronisation : ${result.error || result.message}`,
      });
    }
  }
  if (sub === 'status') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const metrics = await computeServerMetrics(guild);
    const cfg = await getServerStatsConfig(guild.id);
    const embed = new EmbedBuilder()
      .setTitle('📊 Métriques en Direct du Serveur Discord')
      .setDescription(`Statut du module automatique : ${cfg.enabled ? '🟢 **Actif**' : '🔴 **Inactif**'}`)
      .setColor(config.colors.primary)
      .setThumbnail(guild.iconURL({ dynamic: true }) || config.assets.logoUrl)
      .addFields(
        { name: '👥 Total Membres', value: `\`${metrics.total}\``, inline: true },
        { name: '👤 Humains', value: `\`${metrics.humans}\``, inline: true },
        { name: '🤖 Bots', value: `\`${metrics.bots}\``, inline: true },
        { name: '🟢 En Ligne', value: `\`${metrics.online}\``, inline: true },
        { name: '🚀 Boosts', value: `\`${metrics.boosts}\` (Tier ${metrics.boostTier})`, inline: true },
        { name: '📁 Catégorie', value: cfg.category_id ? `<#${cfg.category_id}>` : '*Non assignée*', inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système de Métriques' })
      .setTimestamp();
    return await interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'disable') {
    const cfg = await getServerStatsConfig(guild.id);
    cfg.enabled = false;
    await saveServerStatsConfig(guild.id, cfg);
    return await interaction.reply({
      content: '⏹️ La mise à jour automatique des salons de statistiques du serveur est maintenant **désactivée**.',
      flags: MessageFlags.Ephemeral,
    });
  }
}
