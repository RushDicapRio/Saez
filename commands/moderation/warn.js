import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } from 'discord.js';
import {
  checkHierarchy,
  sendModerationLog,
  sendUserSanctionNotice,
  addWarning,
  getUserWarnings,
} from '../../services/moderationService.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('warn')
  .setDescription('Gestion des avertissements officiels des membres')
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addSubcommand((sub) =>
    sub
      .setName('ajouter')
      .setDescription('Donner un avertissement officiel à un membre')
      .addUserOption((opt) => opt.setName('membre').setDescription('Le membre à avertir').setRequired(true))
      .addStringOption((opt) => opt.setName('raison').setDescription('Raison de l\'avertissement').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('liste')
      .setDescription('Consulter l\'historique des avertissements d\'un membre')
      .addUserOption((opt) => opt.setName('membre').setDescription('Le membre à inspecter').setRequired(true))
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const targetUser = interaction.options.getUser('membre');
  if (sub === 'ajouter') {
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
      console.error('Erreur commande /warn ajouter:', err);
      return await interaction.reply({
        content: `❌ Impossible d'enregistrer l'avertissement : ${err.message}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
  if (sub === 'liste') {
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
      }
      return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('Erreur commande /warn liste:', err);
      return await interaction.reply({
        content: `❌ Impossible de récupérer le casier : ${err.message}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
