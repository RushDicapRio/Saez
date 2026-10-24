import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { getUserEconomy } from '../../services/economyService.js';
export default {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Consulte votre solde de Saez Coins ou celui d\'un autre membre')
    .addUserOption((opt) => opt.setName('membre').setDescription('Membre à consulter').setRequired(false)),
  async execute(interaction) {
    const targetUser = interaction.options.getUser('membre') || interaction.user;
    const wallet = await getUserEconomy(interaction.guild.id, targetUser.id);
    const embed = new EmbedBuilder()
      .setTitle(`💰 Portefeuille Virtuel — ${targetUser.username}`)
      .setColor(0xfbbf24)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🪙 Pièces en main', value: `**${(wallet.balance || 0).toLocaleString()}** Saez Coins`, inline: true },
        { name: '🏦 Banque Saez', value: `**${(wallet.bank || 0).toLocaleString()}** Coins`, inline: true },
        { name: '📦 Objets possédés', value: `${wallet.inventory?.length || 0} objet(s)`, inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Économie 100% fictive et communautaire' });
    return await interaction.reply({ embeds: [embed] });
  },
};
