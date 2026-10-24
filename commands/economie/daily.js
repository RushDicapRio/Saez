import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { claimDaily } from '../../services/economyService.js';
export default {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Récupère votre récompense quotidienne de Saez Coins (toutes les 24h)'),
  async execute(interaction) {
    const res = await claimDaily(interaction.guild.id, interaction.user.id);
    if (!res.success) {
      return await interaction.reply({
        content: `⏳ Vous avez déjà récupéré votre récompense quotidienne aujourd'hui !\nRevenez dans **${res.remainingText}**.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    const embed = new EmbedBuilder()
      .setTitle('🎁 Récompense Quotidienne Récupérée !')
      .setDescription(`Vous venez de recevoir **+${res.reward} Saez Coins** pour votre fidélité sur Saez Animes !`)
      .setColor(0x10b981)
      .addFields({ name: '💰 Nouveau Solde', value: `**${res.balance.toLocaleString()}** Saez Coins` })
      .setFooter({ text: 'Codé avec ❤️ par Saez | Revenez demain pour une nouvelle récompense !' });
    return await interaction.reply({ embeds: [embed] });
  },
};
