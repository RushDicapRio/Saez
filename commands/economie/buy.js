import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { purchaseItem, SHOP_ITEMS } from '../../services/economyService.js';
export default {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Achète un objet, rôle ou booster dans la boutique Saez Animes')
    .addStringOption((opt) =>
      opt
        .setName('item_id')
        .setDescription('L\'identifiant de l\'objet (ex: role_otaku, badge_ramen, item_xp_boost_24h)')
        .setRequired(true)
        .setAutocomplete(true)
    ),
  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const filtered = SHOP_ITEMS.filter(
      (i) => i.id.toLowerCase().includes(focusedValue) || i.name.toLowerCase().includes(focusedValue)
    ).slice(0, 25);
    await interaction.respond(
      filtered.map((i) => ({ name: `${i.name} (🪙 ${i.price} coins)`, value: i.id }))
    );
  },
  async execute(interaction) {
    const itemId = interaction.options.getString('item_id');
    const res = await purchaseItem(interaction.guild.id, interaction.user.id, itemId);
    if (!res.success) {
      return await interaction.reply({
        content: `❌ ${res.message}`,
        flags: MessageFlags.Ephemeral,
      });
    }
    const embed = new EmbedBuilder()
      .setTitle('🎉 Achat Réussi !')
      .setDescription(`Vous venez d'acheter **${res.item.name}** pour **${res.item.price} Saez Coins** !`)
      .setColor(0x10b981)
      .addFields(
        { name: '📦 Objet ajouté à votre inventaire', value: `Tapez \`/inventory\` pour l'équiper ou le consulter.` },
        { name: '💰 Solde restant', value: `**${res.newBalance.toLocaleString()}** Saez Coins` }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Merci pour votre achat virtuel !' });
    return await interaction.reply({ embeds: [embed] });
  },
};
