import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { sendModerationLog } from '../../services/moderationService.js';
export const data = new SlashCommandBuilder()
  .setName('unban')
  .setDescription('Débannit un utilisateur via son ID Discord')
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  .addStringOption((opt) =>
    opt.setName('id').setDescription('ID Discord de l\'utilisateur à débannir').setRequired(true)
  )
  .addStringOption((opt) =>
    opt.setName('raison').setDescription('Raison du débannissement').setRequired(false)
  );
export async function execute(interaction) {
  const targetId = interaction.options.getString('id').trim();
  const reason = interaction.options.getString('raison') || 'Pardon accordé par la modération';
  try {
    const banInfo = await interaction.guild.bans.fetch(targetId).catch(() => null);
    if (!banInfo) {
      return await interaction.reply({
        content: `❌ Aucun bannissement trouvé pour l'ID \`${targetId}\`.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    await interaction.guild.bans.remove(targetId, `${reason} (Par ${interaction.user.tag})`);
    await sendModerationLog(interaction.guild, {
      action: 'Unban',
      target: banInfo.user,
      moderator: interaction.user,
      reason,
    });
    return await interaction.reply({
      content: `✅ **${banInfo.user.tag}** a été débanni du serveur avec succès.`,
    });
  } catch (err) {
    console.error('Erreur commande /unban:', err);
    return await interaction.reply({
      content: `❌ Impossible de débannir cet utilisateur : ${err.message}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
