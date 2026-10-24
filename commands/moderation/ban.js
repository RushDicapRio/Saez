import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { checkHierarchy, sendModerationLog, sendUserSanctionNotice } from '../../services/moderationService.js';
export const data = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Bannit un membre du serveur Discord')
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  .addUserOption((opt) =>
    opt.setName('membre').setDescription('Le membre à bannir').setRequired(true)
  )
  .addStringOption((opt) =>
    opt.setName('raison').setDescription('Raison du bannissement').setRequired(false)
  )
  .addIntegerOption((opt) =>
    opt
      .setName('jours_purge')
      .setDescription('Nombre de jours de messages à effacer (0 à 7, défaut: 0)')
      .setMinValue(0)
      .setMaxValue(7)
      .setRequired(false)
  );
export async function execute(interaction) {
  const targetUser = interaction.options.getUser('membre');
  const reason = interaction.options.getString('raison') || 'Infraction aux règles de la communauté';
  const purgeDays = interaction.options.getInteger('jours_purge') || 0;
  const targetMember = interaction.guild.members.cache.get(targetUser.id);
  const hierarchyCheck = checkHierarchy(interaction.member, targetMember);
  if (!hierarchyCheck.canAct) {
    return await interaction.reply({
      content: `❌ ${hierarchyCheck.message}`,
      flags: MessageFlags.Ephemeral,
    });
  }
  await sendUserSanctionNotice(targetUser, interaction.guild.name, 'Bannissement permanent', reason);
  try {
    await interaction.guild.members.ban(targetUser.id, {
      reason: `${reason} (Par ${interaction.user.tag})`,
      deleteMessageSeconds: purgeDays * 24 * 60 * 60,
    });
    await sendModerationLog(interaction.guild, {
      action: 'Ban',
      target: targetUser,
      moderator: interaction.user,
      reason,
      fields: [{ name: '🗑️ Messages purgés', value: `${purgeDays} jour(s)`, inline: true }],
    });
    return await interaction.reply({
      content: `🔨 **${targetUser.tag}** a été banni du serveur !\n**Raison :** ${reason}`,
    });
  } catch (err) {
    console.error('Erreur commande /ban:', err);
    return await interaction.reply({
      content: `❌ Impossible de bannir ce membre : ${err.message}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
