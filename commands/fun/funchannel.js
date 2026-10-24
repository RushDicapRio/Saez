import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} from 'discord.js';
import { getFunChannelId, setFunChannelId, DEFAULT_FUN_CHANNEL_ID } from '../../services/funService.js';
export const data = new SlashCommandBuilder()
  .setName('funchannel')
  .setDescription('Configure ou affiche le salon réservé aux mini-jeux et divertissements')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption((opt) =>
    opt
      .setName('salon')
      .setDescription('Nouveau salon textuel dédié aux jeux (laisser vide pour voir le salon actuel)')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  );
export async function execute(interaction) {
  const newChannel = interaction.options.getChannel('salon');
  if (newChannel) {
    await setFunChannelId(interaction.guildId, newChannel.id);
    return await interaction.reply({
      content: `✅ Le salon des jeux et divertissements est désormais défini sur ${newChannel}.`,
      flags: MessageFlags.Ephemeral,
    });
  }
  const currentId = await getFunChannelId(interaction.guildId);
  return await interaction.reply({
    content: `🎮 Le salon actuellement configuré pour les mini-jeux est : <#${currentId || DEFAULT_FUN_CHANNEL_ID}>.`,
    flags: MessageFlags.Ephemeral,
  });
}
