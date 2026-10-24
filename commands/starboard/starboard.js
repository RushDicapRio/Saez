import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
  MessageFlags,
} from 'discord.js';
import {
  getStarboardConfig,
  saveStarboardConfig,
  getTopStarredMessages,
} from '../../services/starboardService.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('starboard')
  .setDescription('Tableau d\'honneur communautaire des messages cultes (Starboard)')
  .addSubcommand((sub) =>
    sub
      .setName('salon')
      .setDescription('Définir le salon où seront publiés les messages étoilés')
      .addChannelOption((opt) =>
        opt
          .setName('cible')
          .setDescription('Salon du Starboard')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('seuil')
      .setDescription('Définir le nombre d\'étoiles (réactions) requis pour être publié')
      .addIntegerOption((opt) =>
        opt
          .setName('nombre')
          .setDescription('Nombre minimum d\'étoiles (1 à 25)')
          .setMinValue(1)
          .setMaxValue(25)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('emoji')
      .setDescription('Personnaliser l\'emoji de vote (par défaut : ⭐)')
      .addStringOption((opt) =>
        opt.setName('symbole').setDescription('Emoji de vote (ex: ⭐, 🌟, ❤️, 🏆)').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('statut')
      .setDescription('Activer ou désactiver le Starboard sur le serveur')
      .addBooleanOption((opt) =>
        opt.setName('actif').setDescription('Activer le Starboard').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('infos')
      .setDescription('Afficher la configuration actuelle et les meilleurs messages du Starboard')
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guildId;
  if (sub === 'infos') {
    await interaction.deferReply();
    const cfg = await getStarboardConfig(guildId);
    const top = await getTopStarredMessages(guildId, 5);
    const embed = new EmbedBuilder()
      .setTitle('⭐ Configuration du Starboard')
      .setColor(0xfbbf24)
      .addFields(
        { name: '📡 État', value: cfg.enabled ? '🟢 Actif' : '🔴 Désactivé', inline: true },
        { name: '📺 Salon', value: cfg.channel_id ? `<#${cfg.channel_id}>` : '*Non défini*', inline: true },
        { name: '🎯 Seuil requis', value: `${cfg.threshold || 3} ${cfg.emoji || '⭐'}`, inline: true },
        { name: '🌟 Emoji', value: cfg.emoji || '⭐', inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Tableau d\'honneur' })
      .setTimestamp();
    if (top.length > 0) {
      embed.addFields({
        name: '🏆 Top des messages étoilés',
        value: top.map((m, i) => `**#${i + 1}** : [Voir le message](https://discord.com/channels/${guildId}/${cfg.channel_id}/${m.starboard_message_id}) (${m.star_count} ⭐)`).join('\n'),
      });
    }
    return await interaction.editReply({ embeds: [embed] });
  }
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return await interaction.reply({
      content: '❌ Vous devez avoir la permission **Gérer le serveur** pour configurer le Starboard.',
      flags: MessageFlags.Ephemeral,
    });
  }
  if (sub === 'salon') {
    const ch = interaction.options.getChannel('cible');
    await saveStarboardConfig(guildId, { channel_id: ch.id, enabled: true });
    return await interaction.reply({
      content: `✅ Le salon du Starboard a été défini sur <#${ch.id}> (Starboard activé).`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (sub === 'seuil') {
    const seuil = interaction.options.getInteger('nombre');
    await saveStarboardConfig(guildId, { threshold: seuil });
    return await interaction.reply({
      content: `✅ Le seuil du Starboard est désormais de **${seuil} réactions**.`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (sub === 'emoji') {
    const emo = interaction.options.getString('symbole');
    await saveStarboardConfig(guildId, { emoji: emo });
    return await interaction.reply({
      content: `✅ L'emoji de vote du Starboard est désormais **${emo}**.`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (sub === 'statut') {
    const actif = interaction.options.getBoolean('actif');
    await saveStarboardConfig(guildId, { enabled: actif });
    return await interaction.reply({
      content: `✅ Le Starboard est désormais **${actif ? 'activé' : 'désactivé'}**.`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
