import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { getDb } from '../database/mongo.js';
import { config } from '../config.js';
import { sendLog } from './logService.js';
const activeTimeouts = new Map();
export function parseDuration(durationStr) {
  if (!durationStr) return null;
  const match = durationStr.trim().toLowerCase().match(/^(\d+)\s*(s|sec|m|min|h|j|d)$/);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's':
    case 'sec':
      return value * 1000;
    case 'm':
    case 'min':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'j':
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}
export function buildGiveawayEmbed(giveaway, isEnded = false) {
  const endsTimestamp = Math.floor(new Date(giveaway.ends_at).getTime() / 1000);
  const participantsCount = giveaway.participants?.length || 0;
  if (isEnded) {
    const winnersDisplay =
      giveaway.winners?.length > 0
        ? giveaway.winners.map((id) => `<@${id}>`).join(', ')
        : '*Aucun participant valide.*';
    return new EmbedBuilder()
      .setTitle(`🎉 CONCOURS TERMINÉ : ${giveaway.prize}`)
      .setDescription(
        `${giveaway.description ? `*${giveaway.description}*\n\n` : ''}` +
        `🏆 **Gagnant(s) :** ${winnersDisplay}\n` +
        `👤 **Lancé par :** <@${giveaway.hosted_by}>\n` +
        `👥 **Participants totaux :** \`${participantsCount}\`\n` +
        `🏁 **Fin du concours :** <t:${endsTimestamp}:R>`
      )
      .setColor(0x6b7280) // Gris élégant pour concours terminé
      .setThumbnail(config.assets.logoUrl)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Giveaways • Tirage au sort terminé' })
      .setTimestamp();
  }
  return new EmbedBuilder()
    .setTitle(`🎉 CONCOURS : ${giveaway.prize}`)
    .setDescription(
      `${giveaway.description ? `*${giveaway.description}*\n\n` : ''}` +
      `Cliquez sur le bouton ci-dessous pour participer !\n\n` +
      `🏆 **Nombre de gagnants :** \`${giveaway.winners_count}\`\n` +
      `👤 **Lancé par :** <@${giveaway.hosted_by}>\n` +
      `👥 **Participants actuels :** \`${participantsCount}\`\n` +
      `${giveaway.required_role_id ? `🔒 **Rôle requis :** <@&${giveaway.required_role_id}>\n` : ''}` +
      `⏳ **Fin du concours :** <t:${endsTimestamp}:R> (<t:${endsTimestamp}:f>)`
    )
    .setColor(config.colors.accent)
    .setThumbnail(config.assets.logoUrl)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système de Tirage au Sort Automatique' })
    .setTimestamp(new Date(giveaway.ends_at));
}
export function buildGiveawayComponents(giveaway, isEnded = false) {
  const participantsCount = giveaway.participants?.length || 0;
  const joinBtn = new ButtonBuilder()
    .setCustomId(`giveaway_join_${giveaway.message_id}`)
    .setLabel(`Participer (${participantsCount})`)
    .setStyle(ButtonStyle.Success)
    .setEmoji('🎉')
    .setDisabled(isEnded);
  return [new ActionRowBuilder().addComponents(joinBtn)];
}
export async function createGiveaway(client, data) {
  const db = getDb();
  const col = db.collection('giveaways');
  await col.insertOne(data);
  scheduleGiveawayEnd(client, data);
}
export function scheduleGiveawayEnd(client, giveaway) {
  const delay = new Date(giveaway.ends_at).getTime() - Date.now();
  if (delay <= 0) {
    endGiveaway(client, giveaway.message_id);
    return;
  }
  if (activeTimeouts.has(giveaway.message_id)) {
    clearTimeout(activeTimeouts.get(giveaway.message_id));
  }
  const timeout = setTimeout(() => {
    endGiveaway(client, giveaway.message_id);
  }, delay);
  activeTimeouts.set(giveaway.message_id, timeout);
}
export async function endGiveaway(client, messageId, isReroll = false) {
  const db = getDb();
  const col = db.collection('giveaways');
  const giveaway = await col.findOne({ message_id: messageId });
  if (!giveaway) return { success: false, message: 'Concours introuvable en base de données.' };
  if (giveaway.ended && !isReroll) return { success: false, message: 'Ce concours est déjà terminé.' };
  const guild = client.guilds.cache.get(giveaway.guild_id);
  if (!guild) return { success: false, message: 'Serveur introuvable.' };
  const channel = guild.channels.cache.get(giveaway.channel_id);
  if (!channel) return { success: false, message: 'Salon introuvable.' };
  const message = await channel.messages.fetch(giveaway.message_id).catch(() => null);
  const participants = [...(giveaway.participants || [])];
  const winnersCount = Math.min(giveaway.winners_count || 1, participants.length);
  const winners = [];
  for (let i = 0; i < winnersCount; i++) {
    const randomIndex = Math.floor(Math.random() * participants.length);
    const winnerId = participants.splice(randomIndex, 1)[0];
    if (winnerId) winners.push(winnerId);
  }
  await col.updateOne(
    { message_id: messageId },
    { $set: { ended: true, winners, updated_at: new Date() } }
  );
  giveaway.ended = true;
  giveaway.winners = winners;
  if (message) {
    await message.delete().catch(() => {});
  }
  if (winners.length > 0) {
    const mentions = winners.map((id) => `<@${id}>`).join(', ');
    const winEmbed = new EmbedBuilder()
      .setTitle(`🎉 CONCOURS TERMINÉ : ${giveaway.prize}`)
      .setDescription(
        `${giveaway.description ? `*${giveaway.description}*\n\n` : ''}` +
        `🏆 **Gagnant(s) :** ${mentions}\n` +
        `👥 **Participants totaux :** \`${giveaway.participants?.length || 0}\`\n` +
        `👤 **Lancé par :** <@${giveaway.hosted_by}>`
      )
      .setColor(0x10b981)
      .setThumbnail(config.assets.logoUrl)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Giveaways • Tirage au sort officiel' })
      .setTimestamp();
    await channel.send({
      content: `🎊 **Félicitations ${mentions} !** Vous remportez le concours pour : **${giveaway.prize}** ! 🎁`,
      embeds: [winEmbed],
    });
  } else {
    const noWinEmbed = new EmbedBuilder()
      .setTitle(`⚠️ CONCOURS TERMINÉ : ${giveaway.prize}`)
      .setDescription(
        `${giveaway.description ? `*${giveaway.description}*\n\n` : ''}` +
        `Le concours s'est terminé sans participants suffisants. Aucun gagnant n'a été désigné.\n\n` +
        `👥 **Participants :** \`0\`\n` +
        `👤 **Lancé par :** <@${giveaway.hosted_by}>`
      )
      .setColor(0xef4444)
      .setThumbnail(config.assets.logoUrl)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Giveaways • Tirage sans participant' })
      .setTimestamp();
    await channel.send({
      content: `⚠️ Le concours pour **${giveaway.prize}** s'est terminé sans participants suffisants. Aucun gagnant désigné.`,
      embeds: [noWinEmbed],
    });
  }
  const logEmbed = new EmbedBuilder()
    .setTitle(`🎉 Résultat Concours : ${giveaway.prize}`)
    .setColor(0x10b981)
    .addFields(
      { name: '🏆 Gagnant(s)', value: winners.length > 0 ? winners.map((w) => `<@${w}>`).join(', ') : 'Aucun', inline: true },
      { name: '👥 Participants', value: `${giveaway.participants?.length || 0}`, inline: true },
      { name: '📍 Salon', value: `<#${giveaway.channel_id}>`, inline: true },
      { name: '👤 Hôte', value: `<@${giveaway.hosted_by}>`, inline: true }
    )
    .setFooter({ text: 'Codé avec ❤️ par Saez' });
  await sendLog(guild, 'moderation', logEmbed);
  return { success: true, winners, prize: giveaway.prize };
}
export async function handleGiveawayJoin(interaction) {
  let messageId = interaction.customId.replace('giveaway_join_', '');
  const db = getDb();
  const col = db.collection('giveaways');
  if (!messageId || messageId === 'undefined') {
    messageId = interaction.message.id;
  }
  let giveaway = await col.findOne({ message_id: messageId });
  if (!giveaway && interaction.message?.id) {
    giveaway = await col.findOne({ message_id: interaction.message.id });
    if (giveaway) messageId = interaction.message.id;
  }
  if (!giveaway) {
    giveaway = await col.findOne({ channel_id: interaction.channelId, ended: false });
    if (giveaway) {
      messageId = interaction.message.id;
      await col.updateOne({ _id: giveaway._id }, { $set: { message_id: interaction.message.id } });
      giveaway.message_id = interaction.message.id;
    }
  }
  if (!giveaway) {
    return await interaction.reply({
      content: '❌ Ce concours n\'existe plus dans la base de données.',
      flags: MessageFlags.Ephemeral,
    });
  }
  giveaway.message_id = interaction.message.id;
  if (giveaway.ended) {
    return await interaction.reply({
      content: '⌛ Ce concours est déjà terminé !',
      flags: MessageFlags.Ephemeral,
    });
  }
  if (giveaway.required_role_id) {
    const hasRole = interaction.member.roles.cache.has(giveaway.required_role_id);
    if (!hasRole) {
      return await interaction.reply({
        content: `🔒 Vous devez posséder le rôle <@&${giveaway.required_role_id}> pour participer à ce concours !`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
  const userId = interaction.user.id;
  const isAlreadyParticipating = (giveaway.participants || []).includes(userId);
  if (isAlreadyParticipating) {
    await col.updateOne({ _id: giveaway._id }, { $pull: { participants: userId }, $set: { message_id: giveaway.message_id } });
    giveaway.participants = giveaway.participants.filter((id) => id !== userId);
    const embed = buildGiveawayEmbed(giveaway, false);
    const components = buildGiveawayComponents(giveaway, false);
    await interaction.message.edit({ embeds: [embed], components }).catch(() => {});
    return await interaction.reply({
      content: '📤 Votre participation au concours a été **retirée**.',
      flags: MessageFlags.Ephemeral,
    });
  } else {
    await col.updateOne({ _id: giveaway._id }, { $addToSet: { participants: userId }, $set: { message_id: giveaway.message_id } });
    if (!giveaway.participants) giveaway.participants = [];
    giveaway.participants.push(userId);
    const embed = buildGiveawayEmbed(giveaway, false);
    const components = buildGiveawayComponents(giveaway, false);
    await interaction.message.edit({ embeds: [embed], components }).catch(() => {});
    return await interaction.reply({
      content: `🎉 **Félicitations !** Votre participation au concours pour **${giveaway.prize}** a été enregistrée. Bonne chance ! 🍀`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
export async function restoreActiveGiveaways(client) {
  try {
    const db = getDb();
    const col = db.collection('giveaways');
    const activeList = await col.find({ ended: { $ne: true } }).toArray();
    console.log(`[Giveaways] 🎁 Restauration de ${activeList.length} concours en cours...`);
    for (const g of activeList) {
      scheduleGiveawayEnd(client, g);
    }
  } catch (err) {
    console.error('[Giveaways] Erreur lors de la restauration des concours :', err);
  }
}
