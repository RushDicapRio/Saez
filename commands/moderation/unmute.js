import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { checkHierarchy, sendModerationLog } from '../../services/moderationService.js';
export const data = new SlashCommandBuilder()
  .setName('unmute')
  .setDescription('Lève l\'exclusion temporaire d\'un membre')
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption((opt) =>
    opt.setName('membre').setDescription('Le membre à rétablir').setRequired(true)
  )
  .addStringOption((opt) =>
    opt.setName('raison').setDescription('Raison de la levée').setRequired(false)
  );
export async function execute(interaction) {
  const targetUser = interaction.options.getUser('membre');
  const reason = interaction.options.getString('raison') || 'Levée de sanction accordée';
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
  try {
    await targetMember.timeout(null, `${reason} (Par ${interaction.user.tag})`);
    await sendModerationLog(interaction.guild, {
      action: 'Unmute',
      target: targetUser,
      moderator: interaction.user,
      reason,
    });
    return await interaction.reply({
      content: `🔊 L'exclusion de **${targetUser.tag}** a été levée avec succès.`,
    });
  } catch (err) {
    console.error('Erreur commande /unmute:', err);
    return await interaction.reply({
      content: `❌ Impossible de lever l'exclusion : ${err.message}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
