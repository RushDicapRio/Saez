import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { getUserEconomy } from '../../services/economyService.js';
export default {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Consulte l\'inventaire des objets, rôles et badges possédés')
    .addUserOption((opt) => opt.setName('membre').setDescription('Membre à consulter').setRequired(false)),
  async execute(interaction) {
    const target = interaction.options.getUser('membre') || interaction.user;
    const wallet = await getUserEconomy(interaction.guild.id, target.id);
    const items = wallet.inventory || [];
    const embed = new EmbedBuilder()
      .setTitle(`🎒 Inventaire Virtuel — ${target.username}`)
      .setColor(0x00e5ff)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `Codé avec ❤️ par Saez | ${items.length} objet(s) possédé(s) • Boutique accessible avec /shop` });
    if (items.length === 0) {
      embed.setDescription(
        target.id === interaction.user.id
          ? 'Votre inventaire est vide pour le moment ! Utilisez `/daily` et `/shop` pour obtenir vos premiers objets.'
          : `${target.username} ne possède aucun objet dans son inventaire pour le moment.`
      );
    } else {
      const itemsList = items
        .slice(0, 15)
        .map((it, idx) => `**${idx + 1}.** ${it.name} *(Catégorie: ${it.category || 'divers'})*`)
        .join('\n');
      embed.setDescription(itemsList + (items.length > 15 ? `\n*... et ${items.length - 15} autre(s) objet(s)*` : ''));
    }
    return await interaction.reply({ embeds: [embed] });
  },
};
