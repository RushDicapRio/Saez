import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { sendModerationLog } from '../../services/moderationService.js';
export const data = new SlashCommandBuilder()
  .setName('clear')
  .setDescription('Supprime un nombre défini de messages dans le salon')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addIntegerOption((opt) =>
    opt
      .setName('nombre')
      .setDescription('Nombre de messages à supprimer (1 à 100)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100)
  )
  .addUserOption((opt) =>
    opt
      .setName('membre')
      .setDescription('Filtrer les messages d\'un utilisateur spécifique uniquement')
      .setRequired(false)
  );
export async function execute(interaction) {
  const amount = interaction.options.getInteger('nombre');
  const targetUser = interaction.options.getUser('membre');
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const fetched = await interaction.channel.messages.fetch({ limit: targetUser ? 100 : amount });
    let toDelete = fetched;
    if (targetUser) {
      toDelete = fetched.filter((m) => m.author.id === targetUser.id).first(amount);
    }
    const deleted = await interaction.channel.bulkDelete(toDelete, true);
    await sendModerationLog(interaction.guild, {
      action: 'Clear',
      target: targetUser || { tag: 'Tous les membres', id: interaction.channel.id },
      moderator: interaction.user,
      reason: `Nettoyage du salon #${interaction.channel.name}`,
      fields: [
        { name: '📍 Salon', value: `<#${interaction.channel.id}>`, inline: true },
        { name: '🗑️ Messages supprimés', value: `${deleted.size}`, inline: true },
      ],
    });
    return await interaction.editReply({
      content: `🧹 **${deleted.size}** message(s) ont été supprimés avec succès${targetUser ? ` de **${targetUser.tag}**` : ''} !`,
    });
  } catch (err) {
    console.error('Erreur commande /clear:', err);
    return await interaction.editReply({
      content: `❌ Impossible d'effacer les messages : ${err.message} (Note : Discord refuse de supprimer en masse les messages datant de plus de 14 jours).`,
    });
  }
}
