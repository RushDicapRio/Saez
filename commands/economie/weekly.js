import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { claimWeekly } from '../../services/economyService.js';
export default {
  data: new SlashCommandBuilder()
    .setName('weekly')
    .setDescription('Récupère votre méga récompense hebdomadaire de Saez Coins (tous les 7 jours)'),
  async execute(interaction) {
    const res = await claimWeekly(interaction.guild.id, interaction.user.id);
    if (!res.success) {
      return await interaction.reply({
        content: `⏳ Vous avez déjà réclamé votre bonus de la semaine !\nRevenez dans **${res.remainingText}**.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    const embed = new EmbedBuilder()
      .setTitle('🌟 Méga Bonus Hebdomadaire Récupéré !')
      .setDescription(`Félicitations ! Vous encaissez **+${res.reward} Saez Coins** pour cette semaine !`)
      .setColor(0x8b5cf6)
      .addFields({ name: '💰 Nouveau Solde', value: `**${res.balance.toLocaleString()}** Saez Coins` })
      .setFooter({ text: 'Codé avec ❤️ par Saez | Rendez-vous la semaine prochaine !' });
    return await interaction.reply({ embeds: [embed] });
  },
};
