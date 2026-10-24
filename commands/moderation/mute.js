import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { checkHierarchy, sendModerationLog, sendUserSanctionNotice } from '../../services/moderationService.js';
export const data = new SlashCommandBuilder()
  .setName('mute')
  .setDescription('Exclut temporairement un membre (Timeout)')
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption((opt) =>
    opt.setName('membre').setDescription('Le membre à exclure').setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName('duree')
      .setDescription('Durée de l\'exclusion')
      .setRequired(true)
      .addChoices(
        { name: '60 secondes', value: '60s' },
        { name: '5 minutes', value: '5m' },
        { name: '10 minutes', value: '10m' },
        { name: '1 heure', value: '1h' },
        { name: '1 jour', value: '1d' },
        { name: '7 jours', value: '7d' },
        { name: '28 jours (maximum)', value: '28d' }
      )
  )
  .addStringOption((opt) =>
    opt.setName('raison').setDescription('Raison de la mise en sourdine').setRequired(false)
  );
export async function execute(interaction) {
  const targetUser = interaction.options.getUser('membre');
  const durationChoice = interaction.options.getString('duree');
  const reason = interaction.options.getString('raison') || 'Comportement perturbateur ou spam';
  const durations = {
    '60s': { ms: 60 * 1000, label: '60 secondes' },
    '5m': { ms: 5 * 60 * 1000, label: '5 minutes' },
    '10m': { ms: 10 * 60 * 1000, label: '10 minutes' },
    '1h': { ms: 60 * 60 * 1000, label: '1 heure' },
    '1d': { ms: 24 * 60 * 60 * 1000, label: '1 jour' },
    '7d': { ms: 7 * 24 * 60 * 60 * 1000, label: '7 jours' },
    '28d': { ms: 28 * 24 * 60 * 60 * 1000, label: '28 jours' },
  };
  const selected = durations[durationChoice] || durations['5m'];
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
  await sendUserSanctionNotice(targetUser, interaction.guild.name, 'Mise en sourdine (Timeout)', reason, selected.label);
  try {
    await targetMember.timeout(selected.ms, `${reason} (Par ${interaction.user.tag})`);
    await sendModerationLog(interaction.guild, {
      action: 'Mute',
      target: targetUser,
      moderator: interaction.user,
      reason,
      duration: selected.label,
    });
    return await interaction.reply({
      content: `🔇 **${targetUser.tag}** a été exclu temporairement pendant **${selected.label}**.\n**Raison :** ${reason}`,
    });
  } catch (err) {
    console.error('Erreur commande /mute:', err);
    return await interaction.reply({
      content: `❌ Impossible d'exclure ce membre : ${err.message}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
