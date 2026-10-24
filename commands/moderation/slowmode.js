import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { sendModerationLog } from '../../services/moderationService.js';
export const data = new SlashCommandBuilder()
  .setName('slowmode')
  .setDescription('Définit le mode lent (délai entre les messages) d\'un salon')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addIntegerOption((opt) =>
    opt
      .setName('secondes')
      .setDescription('Délai en secondes (0 pour désactiver, max 21600 = 6h)')
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(21600)
  )
  .addChannelOption((opt) =>
    opt
      .setName('salon')
      .setDescription('Salon concerné (défaut : salon actuel)')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  )
  .addStringOption((opt) =>
    opt.setName('raison').setDescription('Raison du changement de mode lent').setRequired(false)
  );
export async function execute(interaction) {
  const seconds = interaction.options.getInteger('secondes');
  const targetChannel = interaction.options.getChannel('salon') || interaction.channel;
  const reason = interaction.options.getString('raison') || 'Ajustement de la cadence de discussion';
  try {
    await targetChannel.setRateLimitPerUser(seconds, reason);
    const statusText = seconds === 0
      ? 'désactivé'
      : `défini à **${seconds} seconde${seconds > 1 ? 's' : ''}**`;
    await sendModerationLog(interaction.guild, {
      action: 'Slowmode',
      target: { tag: `#${targetChannel.name}`, id: targetChannel.id },
      moderator: interaction.user,
      reason: `${reason} (${seconds}s)`,
    });
    return await interaction.reply({
      content: `⏱️ Le mode lent sur ${targetChannel} a été ${statusText}.`,
      flags: MessageFlags.Ephemeral,
    });
  } catch (err) {
    console.error('Erreur commande /slowmode:', err);
    return await interaction.reply({
      content: `❌ Impossible de modifier le mode lent : ${err.message}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
