import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
  PermissionFlagsBits,
} from 'discord.js';
import {
  voteDebate,
  getDebate,
  reactToConfession,
  getConfessionById,
  reviewConfession,
  deleteConfessionBySecret,
  sendBirthdayWish,
  getBirthdayWishes,
  contributeGoal,
  reactToThankYou,
  updateApplicationStatus,
  getApplicationById,
  submitApplication,
  submitConfession,
  CONFESSION_CATEGORIES,
} from './communityHubService.js';
import { config } from '../config.js';
export async function handleCommunityButton(interaction) {
  const { customId, guild, user, member } = interaction;
  if (customId.startsWith('deb_vote_')) {
    const parts = customId.split('_');
    const debateId = parts[2];
    const optIdx = parts[3];
    const res = await voteDebate(debateId, user.id, optIdx);
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.error}`, flags: MessageFlags.Ephemeral });
    }
    const { debate, counts, totalVotes } = res;
    const rows = [];
    const mainRow = new ActionRowBuilder();
    debate.options.slice(0, 5).forEach((opt, idx) => {
      const cnt = counts[idx] || 0;
      const pct = totalVotes > 0 ? Math.round((cnt / totalVotes) * 100) : 0;
      const style = idx === 0 ? ButtonStyle.Success : idx === 1 ? ButtonStyle.Danger : ButtonStyle.Secondary;
      mainRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`deb_vote_${debate._id}_${idx}`)
          .setLabel(`${opt} (${cnt} • ${pct}%)`)
          .setStyle(style)
      );
    });
    rows.push(mainRow);
    await interaction.update({ components: rows }).catch(() => {});
    return await interaction.followUp({
      content: `🗳️ Votre vote pour **${debate.options[optIdx]}** a bien été enregistré !`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (customId.startsWith('conf_react_')) {
    const parts = customId.split('_');
    const confId = parts[2];
    const reactType = parts[3]; 
    const res = await reactToConfession(confId, user.id, reactType);
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.error}`, flags: MessageFlags.Ephemeral });
    }
    const conf = await getConfessionById(confId);
    if (!conf) return;
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`conf_react_${confId}_love`).setEmoji('❤️').setLabel(`Soutien (${conf.reactions.love || 0})`).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`conf_react_${confId}_hug`).setEmoji('🫂').setLabel(`Câlin (${conf.reactions.hug || 0})`).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`conf_react_${confId}_funny`).setEmoji('😂').setLabel(`Drôle (${conf.reactions.funny || 0})`).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`conf_react_${confId}_deep`).setEmoji('💭').setLabel(`Profond (${conf.reactions.deep || 0})`).setStyle(ButtonStyle.Secondary)
    );
    await interaction.update({ components: [row] }).catch(() => {});
    return await interaction.followUp({
      content: res.userReaction ? `✨ Réaction enregistrée !` : `🗑️ Réaction retirée.`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (customId.startsWith('conf_approve_') || customId.startsWith('conf_reject_')) {
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return await interaction.reply({ content: '❌ Réservé au staff de modération.', flags: MessageFlags.Ephemeral });
    }
    const isApprove = customId.startsWith('conf_approve_');
    const confId = customId.replace(isApprove ? 'conf_approve_' : 'conf_reject_', '');
    const res = await reviewConfession(confId, isApprove ? 'approve' : 'reject', user.id, 'Vérification Staff');
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.error}`, flags: MessageFlags.Ephemeral });
    }
    if (isApprove) {
      const conf = res.confession;
      const pubEmbed = new EmbedBuilder()
        .setTitle(`🤫 Confession #${conf.number} • ${CONFESSION_CATEGORIES[conf.category] || 'Libre'}`)
        .setDescription(`*"${conf.text}"*`)
        .setColor(0x8b5cf6)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Publiée après validation • Saez Confessions' })
        .setTimestamp();
      const reactRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`conf_react_${conf._id}_love`).setEmoji('❤️').setLabel('0').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`conf_react_${conf._id}_hug`).setEmoji('🫂').setLabel('0').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`conf_react_${conf._id}_funny`).setEmoji('😂').setLabel('0').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`conf_react_${conf._id}_deep`).setEmoji('💭').setLabel('0').setStyle(ButtonStyle.Secondary)
      );
      const targetChan = guild.channels.cache.get(conf.channelId);
      if (targetChan) {
        await targetChan.send({ embeds: [pubEmbed], components: [reactRow] }).catch(() => {});
      }
    }
    return await interaction.update({
      content: isApprove ? `✅ **Confession validée et publiée dans le salon public par ${user}.**` : `❌ **Confession rejetée par ${user}.**`,
      components: [],
    });
  }
  if (customId.startsWith('bday_wish_')) {
    const targetUserId = customId.replace('bday_wish_', '');
    const res = await sendBirthdayWish(guild.id, targetUserId, user.id, 'Joyeux anniversaire ! 🎂');
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.error}`, flags: MessageFlags.Ephemeral });
    }
    return await interaction.reply({
      content: `🎉 Vos vœux chaleureux ont été envoyés à <@${targetUserId}> ! (Total : **${res.count}** vœux reçus)`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (customId.startsWith('goal_contrib_')) {
    const parts = customId.split('_');
    const goalId = parts[2];
    const amount = parseInt(parts[3], 10) || 1;
    const res = await contributeGoal(goalId, amount, user.id, user.username);
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.error}`, flags: MessageFlags.Ephemeral });
    }
    const { goal, isCompleted } = res;
    const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
    return await interaction.reply({
      content: `🎯 Merci <@${user.id}> ! Vous avez ajouté **+${amount}** à l'objectif **${goal.title}** ! Avancement : **${pct}%** (${goal.current}/${goal.target} ${goal.unit})${isCompleted ? ' 🏆 **OBJECTIF ATTEINT ! Félicitations à toute la communauté !**' : ''}`,
    });
  }
  if (customId.startsWith('thx_react_')) {
    const thankId = customId.replace('thx_react_', '');
    const res = await reactToThankYou(thankId, user.id);
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.error}`, flags: MessageFlags.Ephemeral });
    }
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`thx_react_${thankId}`)
        .setEmoji('💖')
        .setLabel(`Soutiens (${res.count})`)
        .setStyle(res.hasReacted ? ButtonStyle.Primary : ButtonStyle.Secondary)
    );
    await interaction.update({ components: [row] }).catch(() => {});
    return;
  }
  if (customId.startsWith('app_action_')) {
    if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({ content: '❌ Action réservée au staff.', flags: MessageFlags.Ephemeral });
    }
    const parts = customId.split('_');
    const appId = parts[2];
    const targetStatus = parts[3];
    const app = await getApplicationById(appId);
    if (!app) {
      return await interaction.reply({ content: '❌ Candidature introuvable.', flags: MessageFlags.Ephemeral });
    }
    const res = await updateApplicationStatus(appId, targetStatus, user, {
      note: `Action directe par ${user.username}`,
    });
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.error}`, flags: MessageFlags.Ephemeral });
    }
    try {
      const candidateUser = await interaction.client.users.fetch(app.userId);
      if (candidateUser) {
        const notifEmbed = new EmbedBuilder()
          .setTitle(`📋 Mise à jour de votre candidature — ${guild.name}`)
          .setDescription(
            targetStatus === 'accepted'
              ? `🎉 **Félicitations !** Votre candidature pour le poste de **${app.role}** a été **ACCEPTÉE** par l'équipe !`
              : targetStatus === 'interview'
              ? `📅 **Entretien :** Votre candidature pour **${app.role}** a retenu notre attention. Un responsable va prendre contact avec vous.`
              : `Votre candidature pour le poste de **${app.role}** n'a pas été retenue cette fois-ci.`
          )
          .setColor(targetStatus === 'accepted' ? 0x10b981 : targetStatus === 'interview' ? 0x38bdf8 : 0xf43f5e)
          .setFooter({ text: 'Codé avec ❤️ par Saez' })
          .setTimestamp();
        await candidateUser.send({ embeds: [notifEmbed] }).catch(() => {});
      }
    } catch {}
    const statusLabel = targetStatus === 'accepted' ? '✅ Acceptée' : targetStatus === 'interview' ? '📅 Entretien planifié' : '❌ Refusée';
    return await interaction.reply({
      content: `👌 Statut de la candidature \`${appId}\` mis à jour en **${statusLabel}** par ${user}.`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
export async function handleCommunityModal(interaction) {
  const { customId, guild, user } = interaction;
  if (customId === 'modal_confession_submit') {
    const text = interaction.fields.getTextInputValue('conf_text');
    const isAnon = interaction.fields.getTextInputValue('conf_anon')?.toLowerCase() !== 'non';
    const cat = interaction.fields.getTextInputValue('conf_cat')?.trim().toLowerCase() || 'anecdote';
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const res = await submitConfession(guild.id, text, interaction.channelId, {
      isAnonymous: isAnon,
      authorId: user.id,
      authorName: user.username,
      category: cat,
    });
    const { confession, secretKey, requiresApproval } = res;
    if (requiresApproval) {
      return await interaction.editReply({
        content:
          `✅ **Votre confession a été enregistrée avec succès !**\n\n` +
          `• ⏳ **Validation :** Elle a été soumise à la modération avant publication dans le salon public.\n` +
          `• 🔑 **Clé secrète de suppression :** \`${secretKey}\` *(Conservez ce code pour pouvoir supprimer votre confession plus tard sans révéler votre identité !)*`,
      });
    }
    const embed = new EmbedBuilder()
      .setTitle(`🤫 Confession #${confession.number} • ${CONFESSION_CATEGORIES[confession.category] || 'Libre'}`)
      .setDescription(`*"${text}"*`)
      .setColor(0x8b5cf6)
      .setFooter({ text: isAnon ? 'Codé avec ❤️ par Saez | Envoyée anonymement • Saez Confessions' : `Par ${user.username}` })
      .setTimestamp();
    const reactRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`conf_react_${confession._id}_love`).setEmoji('❤️').setLabel('0').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`conf_react_${confession._id}_hug`).setEmoji('🫂').setLabel('0').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`conf_react_${confession._id}_funny`).setEmoji('😂').setLabel('0').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`conf_react_${confession._id}_deep`).setEmoji('💭').setLabel('0').setStyle(ButtonStyle.Secondary)
    );
    await interaction.channel.send({ embeds: [embed], components: [reactRow] });
    return await interaction.editReply({
      content:
        `✅ **Votre confession #${confession.number} est en ligne !**\n` +
        `🔑 Clé de suppression : \`${secretKey}\``,
    });
  }
}
