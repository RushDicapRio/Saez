import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { SHOP_ITEMS } from '../../services/economyService.js';
export default {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Parcourez la boutique officielle Saez Animes (50 objets, rôles et boosters)')
    .addStringOption((opt) =>
      opt
        .setName('categorie')
        .setDescription('Filtrer les articles par catégorie')
        .setRequired(false)
        .addChoices(
          { name: '🎭 Rôles & Titres Anime', value: 'roles' },
          { name: '🎖️ Badges de Profil', value: 'badges' },
          { name: '⚡ Boosters & Objets Spéciaux', value: 'boosters' },
          { name: '✨ Cosmétiques & Auras', value: 'cosmetiques' }
        )
    )
    .addIntegerOption((opt) =>
      opt.setName('page').setDescription('Numéro de la page (1 à 5)').setMinValue(1).setMaxValue(5).setRequired(false)
    ),
  async execute(interaction) {
    const selectedCat = interaction.options.getString('categorie');
    let page = interaction.options.getInteger('page') || 1;
    let items = SHOP_ITEMS;
    if (selectedCat) {
      if (selectedCat === 'cosmetiques') {
        items = SHOP_ITEMS.filter((i) => ['auras', 'bannieres', 'titres'].includes(i.category));
      } else if (selectedCat === 'boosters') {
        items = SHOP_ITEMS.filter((i) => ['boosters', 'consommables', 'custom', 'protection', 'visibilité', 'musique'].includes(i.category));
      } else {
        items = SHOP_ITEMS.filter((i) => i.category === selectedCat);
      }
    }
    const pageSize = 10;
    const maxPages = Math.ceil(items.length / pageSize) || 1;
    if (page > maxPages) page = maxPages;
    const generateEmbed = (currPage) => {
      const start = (currPage - 1) * pageSize;
      const pageItems = items.slice(start, start + pageSize);
      const embed = new EmbedBuilder()
        .setTitle('🛒 Boutique Officielle — Saez Animes')
        .setDescription(
          `Découvrez nos **${items.length} articles virtuels** disponibles !\n` +
          'Achetez un article avec la commande : `/buy <id_article>`\n' +
          'Consultez votre solde avec : `/balance`\n'
        )
        .setColor(0x00e5ff)
        .setFooter({ text: `Codé avec ❤️ par Saez | Page ${currPage} / ${maxPages} • Saez Coins (Monnaie 100% fictive)` });
      for (const item of pageItems) {
        embed.addFields({
          name: `${item.name} — 🪙 ${item.price.toLocaleString()} Coins`,
          value: `> \`/buy item_id:${item.id}\`\n> *${item.desc}*`,
          inline: false,
        });
      }
      return embed;
    };
    return await interaction.reply({ embeds: [generateEmbed(page)] });
  },
};
