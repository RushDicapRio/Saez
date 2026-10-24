import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import {
  checkHierarchy,
  sendModerationLog,
  sendUserSanctionNotice,
  addWarning,
} from '../../services/moderationService.js';
export const data = new SlashCommandBuilder()
  .setName('warn')
  .setDescription('Donne un avertissement officiel à un membre')
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption((opt) =>
    opt.setName('membre').setDescription('Le membre à avertir').setRequired(true)
  )
  .addStringOption((opt) =>
    opt.setName('raison').setDescription('Raison de l\'avertissement').setRequired(true)
  );
export async function execute(interaction) {
  const targetUser = interaction.options.getUser('membre');
  const reason = interaction.options.getString('raison');
  const targetMember = interaction.guild.members.cache.get(targetUser.id);
  const hierarchyCheck = checkHierarchy(interaction.member, targetMember);
  if (!hierarchyCheck.canAct) {
    return await interaction.reply({
      content: `❌ ${hierarchyCheck.message}`,
      flags: MessageFlags.Ephemeral,
    });
  }
  try {
    const totalWarns = await addWarning(
      interaction.guild.id,
      targetUser.id,
      targetUser.tag,
      interaction.user.id,
      interaction.user.tag,
      reason
    );
    await sendUserSanctionNotice(targetUser, interaction.guild.name, 'Avertissement officiel', reason);
    await sendModerationLog(interaction.guild, {
      action: 'Warn',
      target: targetUser,
      moderator: interaction.user,
      reason,
      fields: [{ name: '⚠️ Avertissements au total', value: `\`${totalWarns}\` avertissement(s)`, inline: true }],
    });
    return await interaction.reply({
      content: `⚠️ **${targetUser.tag}** a reçu un avertissement officiel ! (Total : **${totalWarns}**)\n**Raison :** ${reason}`,
    });
  } catch (err) {
    console.error('Erreur commande /warn:', err);
    return await interaction.reply({
      content: `❌ Impossible d'enregistrer l'avertissement : ${err.message}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
