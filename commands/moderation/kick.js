import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { checkHierarchy, sendModerationLog, sendUserSanctionNotice } from '../../services/moderationService.js';
export const data = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('Expulse un membre du serveur')
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
  .addUserOption((opt) =>
    opt.setName('membre').setDescription('Le membre à expulser').setRequired(true)
  )
  .addStringOption((opt) =>
    opt.setName('raison').setDescription('Raison de l\'expulsion').setRequired(false)
  );
export async function execute(interaction) {
  const targetUser = interaction.options.getUser('membre');
  const reason = interaction.options.getString('raison') || 'Comportement non conforme';
  const targetMember = interaction.guild.members.cache.get(targetUser.id);
  if (!targetMember) {
    return await interaction.reply({
      content: '❌ Ce membre n\'est pas présent sur le serveur.',
      flags: MessageFlags.Ephemeral,
    });
  }
  const hierarchyCheck = checkHierarchy(interaction.member, targetMember);
  if (!hierarchyCheck.canAct) {
    return await interaction.reply({
      content: `❌ ${hierarchyCheck.message}`,
      flags: MessageFlags.Ephemeral,
    });
  }
  await sendUserSanctionNotice(targetUser, interaction.guild.name, 'Expulsion (Kick)', reason);
  try {
    await targetMember.kick(`${reason} (Par ${interaction.user.tag})`);
    await sendModerationLog(interaction.guild, {
      action: 'Kick',
      target: targetUser,
      moderator: interaction.user,
      reason,
    });
    return await interaction.reply({
      content: `👢 **${targetUser.tag}** a été expulsé du serveur.\n**Raison :** ${reason}`,
    });
  } catch (err) {
    console.error('Erreur commande /kick:', err);
    return await interaction.reply({
      content: `❌ Impossible d'expulser ce membre : ${err.message}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
