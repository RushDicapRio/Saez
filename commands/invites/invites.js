import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export default {
  data: new SlashCommandBuilder()
    .setName('invites')
    .setDescription('Consulte les statistiques et le nombre d\'invitations d\'un membre')
    .addUserOption((opt) => opt.setName('membre').setDescription('Membre à consulter').setRequired(false)),
  async execute(interaction) {
    const targetUser = interaction.options.getUser('membre') || interaction.user;
    const guild = interaction.guild;
    await interaction.deferReply();
    try {
      const invites = await guild.invites.fetch();
      const userInvites = invites.filter((inv) => inv.inviter && inv.inviter.id === targetUser.id);
      const totalUses = userInvites.reduce((acc, inv) => acc + (inv.uses || 0), 0);
      const activeLinksCount = userInvites.size;
      const embed = new EmbedBuilder()
        .setTitle(`📨 Statistiques d'Invitations — ${targetUser.username}`)
        .setColor(0x00e5ff)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '👥 Membres invités (utilisations)', value: `**${totalUses}** membre(s)`, inline: true },
          { name: '🔗 Liens actifs créés', value: `**${activeLinksCount}** lien(s)`, inline: true },
          { name: '📊 Statut recruteur', value: totalUses >= 10 ? '👑 Recruteur VIP' : totalUses >= 3 ? '⭐ Membre Actif' : 'Novice', inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Données issues de l\'API officielle des invitations Discord' });
      return await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      return await interaction.editReply({
        content: '❌ Impossible de récupérer les invitations du serveur (permissions insuffisantes du bot pour voir les invitations).',
      });
    }
  },
};
