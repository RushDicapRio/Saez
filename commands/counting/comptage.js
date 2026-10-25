import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} from 'discord.js';
import {
  getCountingConfig,
  saveCountingConfig,
  AdminEngine,
  CountingEngine,
} from '../../services/countingService.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('comptage')
  .setDescription('Jeu de comptage communautaire et défis de calcul')
  .addSubcommand((sub) =>
    sub
      .setName('salon')
      .setDescription('Définir le salon officiel dédié au jeu de comptage')
      .addChannelOption((opt) =>
        opt
          .setName('cible')
          .setDescription('Salon textuel')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('score')
      .setDescription('Afficher le nombre actuel et le record historique du serveur')
  )
  .addSubcommand((sub) =>
    sub
      .setName('reset')
      .setDescription('[Admin] Réinitialiser le compteur à 0 avec sauvegarde préalable')
  )
  .addSubcommand((sub) =>
    sub
      .setName('aide')
      .setDescription('Afficher l\'aide complète et la liste des commandes')
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guildId;
  const user = interaction.user;
  if (sub === 'salon') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({ content: '❌ Permission requise : Gérer le serveur.', flags: MessageFlags.Ephemeral });
    }
    const ch = interaction.options.getChannel('cible');
    const cfg = await getCountingConfig(guildId);
    cfg.channel_id = ch.id;
    await saveCountingConfig(guildId, cfg);
    return await interaction.reply({
      content: `✅ Le salon de comptage a été configuré sur <#${ch.id}> ! Les membres peuvent commencer à compter à partir de 1.`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (sub === 'score') {
    await interaction.deferReply();
    const cfg = await getCountingConfig(guildId);
    const nextDisplay = CountingEngine.getExpectedDisplay(cfg);
    const embed = new EmbedBuilder()
      .setTitle('🔢 Jeu de Comptage du Serveur')
      .setColor(config.colors.accent || '#38bdf8')
      .addFields(
        { name: '📍 Nombre Actuel', value: `\`${cfg.current_count || 0}\``, inline: true },
        { name: '👉 Prochain Attendu', value: `\`${nextDisplay}\``, inline: true },
        { name: '🏆 Record Historique', value: `\`${cfg.high_score || 0}\``, inline: true },
        { name: '📺 Salon Officiel', value: cfg.channel_id ? `<#${cfg.channel_id}>` : '*Non configuré*', inline: true },
        { name: '⚙️ Mode', value: `\`${cfg.mode || 'classique'}\``, inline: true },
        { name: '🛡️ Mode Strict', value: cfg.strict_mode ? 'Activé' : 'Désactivé', inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Règle : Une même personne ne peut pas compter deux fois de suite !' })
      .setTimestamp();
    return await interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'reset') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({ content: '❌ Permission requise : Gérer le serveur.', flags: MessageFlags.Ephemeral });
    }
    const res = await AdminEngine.resetCurrentCount(guildId, user, 'Commande /comptage reset');
    return await interaction.reply({
      content: `🔄 Le compteur a été réinitialisé à **0** (précédent : ${res.previousCount}) ! Prochain nombre : \`1\`.\n*(Une sauvegarde automatique a été créée. En cas d'erreur, utilisez \`/counting reset annuler\`)*`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (sub === 'aide') {
    const embed = new EmbedBuilder()
      .setTitle('🔢 Règles du Jeu de Comptage')
      .setColor(0x38bdf8)
      .setDescription(
        '**Comment jouer ?**\n' +
        '• Les membres doivent compter de 1 en 1 dans le salon dédié.\n' +
        '• Une même personne **ne peut pas** envoyer deux nombres à la suite !\n' +
        '• Si quelqu\'un se trompe ou brise la chaîne, le compteur retombe à zéro.\n\n' +
        '**Commandes utiles :**\n' +
        '`/comptage score` : Consulter le record et le nombre actuel\n' +
        '`/comptage salon [cible]` : Configurer le salon de jeu (Admin)'
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
}
