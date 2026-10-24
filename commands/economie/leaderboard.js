import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getLeaderboardEco } from '../../services/economyService.js';
export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard-eco')
    .setDescription('Affiche le classement des membres les plus riches en Saez Coins'),
  async execute(interaction) {
    const topMembers = await getLeaderboardEco(interaction.guild.id, 10);
    const embed = new EmbedBuilder()
      .setTitle('👑 Classement des Fortunes — Saez Coins')
      .setDescription('Voici les 10 membres possédant la plus grande fortune virtuelle sur le serveur :\n*(Monnaie 100% fictive)*')
      .setColor(0xfbbf24)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Économie Communautaire' });
    if (topMembers.length === 0) {
      embed.setDescription('Aucun membre n\'est encore enregistré dans le classement économique.');
    } else {
      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
      for (let i = 0; i < topMembers.length; i++) {
        const mem = topMembers[i];
        embed.addFields({
          name: `${medals[i]} Top #${i + 1}`,
          value: `<@${mem.user_id}> : **${(mem.balance || 0).toLocaleString()}** Saez Coins`,
          inline: false,
        });
      }
    }
    return await interaction.reply({ embeds: [embed] });
  },
};
