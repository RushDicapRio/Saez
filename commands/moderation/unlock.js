import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { sendModerationLog } from '../../services/moderationService.js';
export const data = new SlashCommandBuilder()
  .setName('unlock')
  .setDescription('Déverrouille un salon textuel (autorise à nouveau les membres à écrire)')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addChannelOption((opt) =>
    opt
      .setName('salon')
      .setDescription('Salon à déverrouiller (défaut : salon actuel)')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  )
  .addStringOption((opt) =>
    opt.setName('raison').setDescription('Raison du déverrouillage').setRequired(false)
  );
export async function execute(interaction) {
  const targetChannel = interaction.options.getChannel('salon') || interaction.channel;
  const reason = interaction.options.getString('raison') || 'Fin de l\'intervention de la modération';
  try {
    await targetChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: null,
    });
    await targetChannel.send({
      content: `🔓 **Ce salon a été déverrouillé.**\n*Raison : ${reason}*`,
    });
    await sendModerationLog(interaction.guild, {
      action: 'Unlock',
      target: { tag: `#${targetChannel.name}`, id: targetChannel.id },
      moderator: interaction.user,
      reason,
    });
    return await interaction.reply({
      content: `🔓 Le salon ${targetChannel} a été déverrouillé avec succès.`,
      flags: MessageFlags.Ephemeral,
    });
  } catch (err) {
    console.error('Erreur commande /unlock:', err);
    return await interaction.reply({
      content: `❌ Impossible de déverrouiller le salon : ${err.message}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
