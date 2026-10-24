import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { sendModerationLog } from '../../services/moderationService.js';
export const data = new SlashCommandBuilder()
  .setName('lock')
  .setDescription('Verrouille un salon textuel (empêche les membres d’écrire)')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addChannelOption((opt) =>
    opt
      .setName('salon')
      .setDescription('Salon à verrouiller (défaut : salon actuel)')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  )
  .addStringOption((opt) =>
    opt.setName('raison').setDescription('Raison du verrouillage').setRequired(false)
  );
export async function execute(interaction) {
  const targetChannel = interaction.options.getChannel('salon') || interaction.channel;
  const reason = interaction.options.getString('raison') || 'Maintenance ou intervention de la modération';
  try {
    await targetChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: false,
    });
    await targetChannel.send({
      content: `🔒 **Ce salon a été temporairement verrouillé par la modération.**\n*Raison : ${reason}*`,
    });
    await sendModerationLog(interaction.guild, {
      action: 'Lock',
      target: { tag: `#${targetChannel.name}`, id: targetChannel.id },
      moderator: interaction.user,
      reason,
    });
    return await interaction.reply({
      content: `🔒 Le salon ${targetChannel} a été verrouillé avec succès.`,
      flags: MessageFlags.Ephemeral,
    });
  } catch (err) {
    console.error('Erreur commande /lock:', err);
    return await interaction.reply({
      content: `❌ Impossible de verrouiller le salon : ${err.message}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
