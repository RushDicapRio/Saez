import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
  EmbedBuilder,
} from 'discord.js';
import {
  parseDuration,
  buildGiveawayEmbed,
  buildGiveawayComponents,
  createGiveaway,
  endGiveaway,
} from '../../services/giveawayService.js';
import { getDb } from '../../database/mongo.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('giveaway')
  .setDescription('Système complet de concours, tirages au sort et cadeaux')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub
      .setName('start')
      .setDescription('Lance un nouveau concours avec compte à rebours et bouton de participation')
      .addStringOption((opt) =>
        opt.setName('prix').setDescription('Le lot ou cadeau à gagner (ex: Nitro 1 Mois, Clé VIP)').setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName('duree')
          .setDescription('Durée du concours (ex: 10m, 1h, 24h, 3d, 7d)')
          .setRequired(true)
      )
      .addIntegerOption((opt) =>
        opt
          .setName('gagnants')
          .setDescription('Nombre de gagnants tirés au sort (défaut : 1)')
          .setMinValue(1)
          .setMaxValue(20)
          .setRequired(false)
      )
      .addChannelOption((opt) =>
        opt
          .setName('salon')
          .setDescription('Salon textuel où publier le concours (défaut : salon actuel)')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false)
      )
      .addStringOption((opt) =>
        opt.setName('description').setDescription('Détails supplémentaires ou conditions').setRequired(false)
      )
      .addRoleOption((opt) =>
        opt.setName('role_requis').setDescription('Rôle Discord obligatoire pour pouvoir participer').setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('end')
      .setDescription('Termine immédiatement un concours en cours et tire les gagnants')
      .addStringOption((opt) =>
        opt.setName('message_id').setDescription('ID du message Discord du giveaway (optionnel si dans le même salon)').setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('reroll')
      .setDescription('Tire au sort de nouveaux gagnants pour un concours déjà terminé')
      .addStringOption((opt) =>
        opt.setName('message_id').setDescription('ID du message Discord du giveaway (optionnel si dans le même salon)').setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub.setName('list').setDescription('Affiche la liste de tous les concours actifs sur ce serveur')
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const guild = interaction.guild;
  if (sub === 'start') {
    const prize = interaction.options.getString('prix');
    const durationStr = interaction.options.getString('duree');
    const winnersCount = interaction.options.getInteger('gagnants') || 1;
    const targetChannel = interaction.options.getChannel('salon') || interaction.channel;
    const description = interaction.options.getString('description') || null;
    const requiredRole = interaction.options.getRole('role_requis') || null;
    const durationMs = parseDuration(durationStr);
    if (!durationMs || durationMs < 10000) {
      return await interaction.reply({
        content: '❌ Durée invalide. Utilisez un format comme `10m`, `1h`, `24h`, `3d`, `7d` (minimum 10 secondes).',
        flags: MessageFlags.Ephemeral,
      });
    }
    const endsAt = new Date(Date.now() + durationMs);
    const draftData = {
      guild_id: guild.id,
      channel_id: targetChannel.id,
      prize,
      description,
      winners_count: winnersCount,
      hosted_by: interaction.user.id,
      required_role_id: requiredRole ? requiredRole.id : null,
      ends_at: endsAt,
      participants: [],
      ended: false,
      winners: [],
      created_at: new Date(),
    };
    const embed = buildGiveawayEmbed(draftData, false);
    const sentMessage = await targetChannel.send({ embeds: [embed] });
    draftData.message_id = sentMessage.id;
    const components = buildGiveawayComponents(draftData, false);
    await sentMessage.edit({ components });
    await createGiveaway(interaction.client, draftData);
    return await interaction.reply({
      content: `🎉 Concours pour **${prize}** lancé avec succès dans ${targetChannel} !`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (sub === 'end') {
    let messageId = interaction.options.getString('message_id')?.trim();
    if (!messageId) {
      const db = getDb();
      const col = db.collection('giveaways');
      const latest = await col.findOne(
        { channel_id: interaction.channelId, ended: { $ne: true } },
        { sort: { created_at: -1 } }
      );
      if (latest) {
        messageId = latest.message_id;
      } else {
        return await interaction.reply({
          content: '❌ Aucun concours en cours trouvé dans ce salon. Spécifiez l\'ID : `/giveaway end message_id:<ID>`',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const result = await endGiveaway(interaction.client, messageId, false);
    if (result.success) {
      return await interaction.editReply({
        content: `✅ Le concours pour **${result.prize}** a été clôturé avec succès ! (${result.winners.length} gagnant(s)). L'ancien message a été supprimé pour laisser place à l'annonce finale.`,
      });
    } else {
      return await interaction.editReply({
        content: `❌ ${result.message}`,
      });
    }
  }
  if (sub === 'reroll') {
    let messageId = interaction.options.getString('message_id')?.trim();
    if (!messageId) {
      const db = getDb();
      const col = db.collection('giveaways');
      const latest = await col.findOne(
        { channel_id: interaction.channelId, ended: true },
        { sort: { updated_at: -1 } }
      );
      if (latest) {
        messageId = latest.message_id;
      } else {
        return await interaction.reply({
          content: '❌ Aucun concours terminé trouvé dans ce salon. Spécifiez l\'ID : `/giveaway reroll message_id:<ID>`',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const result = await endGiveaway(interaction.client, messageId, true);
    if (result.success) {
      return await interaction.editReply({
        content: `🎲 Re-tirage au sort effectué pour **${result.prize}** ! (${result.winners.length} nouveau(x) gagnant(s)).`,
      });
    } else {
      return await interaction.editReply({
        content: `❌ ${result.message}`,
      });
    }
  }
  if (sub === 'list') {
    const db = getDb();
    const col = db.collection('giveaways');
    const active = await col.find({ guild_id: guild.id, ended: { $ne: true } }).toArray();
    if (active.length === 0) {
      return await interaction.reply({
        content: '📭 Aucun concours actif actuellement sur ce serveur. Lancez-en un avec `/giveaway start` !',
        flags: MessageFlags.Ephemeral,
      });
    }
    const embed = new EmbedBuilder()
      .setTitle(`🎉 Concours Actifs sur ${guild.name} (${active.length})`)
      .setColor(config.colors.accent)
      .setThumbnail(config.assets.logoUrl)
      .setDescription(
        active
          .map(
            (g, idx) =>
              `**${idx + 1}. [${g.prize}](https://discord.com/channels/${g.guild_id}/${g.channel_id}/${g.message_id})**\n` +
              `• 📍 Salon : <#${g.channel_id}>\n` +
              `• 👥 Participants : \`${g.participants?.length || 0}\`\n` +
              `• 🏆 Gagnants prévus : \`${g.winners_count}\`\n` +
              `• ⏳ Fin : <t:${Math.floor(new Date(g.ends_at).getTime() / 1000)}:R>`
          )
          .join('\n\n')
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Giveaways • Système de Concours' })
      .setTimestamp();
    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
}
