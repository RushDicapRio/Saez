import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } from 'discord.js';
import { getUserWarnings } from '../../services/moderationService.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('warns')
  .setDescription('Consulte l’historique des avertissements d’un membre')
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption((opt) =>
    opt.setName('membre').setDescription('Le membre à inspecter').setRequired(true)
  );
export async function execute(interaction) {
  const targetUser = interaction.options.getUser('membre');
  try {
    const list = await getUserWarnings(interaction.guild.id, targetUser.id);
    const embed = new EmbedBuilder()
      .setTitle(`📋 Historique des Avertissements : ${targetUser.tag}`)
      .setColor(list.length > 0 ? config.colors.warning : config.colors.success)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Casier de Modération' })
      .setTimestamp();
    if (list.length === 0) {
      embed.setDescription(`Cet utilisateur a un casier vierge (aucun avertissement enregistré).`);
    } else {
      embed.setDescription(`Cet utilisateur cumule **${list.length}** avertissement(s) :\n`);
      list.slice(0, 10).forEach((w, idx) => {
        const dateStr = w.created_at ? new Date(w.created_at).toLocaleDateString('fr-FR') : 'Date inconnue';
        embed.addFields({
          name: `#${idx + 1} • Le ${dateStr} (Par ${w.moderator_tag || 'Staff'})`,
          value: `> *${w.reason}*`,
          inline: false,
        });
      });
      if (list.length > 10) {
        embed.addFields({
          name: '➕ Historique étendu',
          value: `*...et ${list.length - 10} autre(s) avertissement(s) plus ancien(s).*`,
        });
      }
    }
    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  } catch (err) {
    console.error('Erreur commande /warns:', err);
    return await interaction.reply({
      content: `❌ Impossible de récupérer le casier : ${err.message}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
