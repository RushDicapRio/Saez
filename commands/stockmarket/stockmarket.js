import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import {
  getAllMarketPrices,
  getMarketPrice,
  getUserPortfolio,
  buyAsset,
  sellAsset,
} from '../../services/stockMarketService.js';
import { getUserEconomy } from '../../services/economyService.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('bourse')
  .setDescription('Simulateur boursier et investissement financier (Actions & Cryptos)')
  .addSubcommand((sub) =>
    sub
      .setName('cours')
      .setDescription('Consulter les cours actuels des actions et cryptomonnaies')
      .addStringOption((opt) =>
        opt
          .setName('actif')
          .setDescription('Symbole de l\'actif')
          .setRequired(false)
          .addChoices(
            { name: 'Bitcoin (BTC)', value: 'BTC' },
            { name: 'Ethereum (ETH)', value: 'ETH' },
            { name: 'Solana (SOL)', value: 'SOL' },
            { name: 'Apple (AAPL)', value: 'AAPL' },
            { name: 'Nvidia (NVDA)', value: 'NVDA' },
            { name: 'Nintendo (NTDOY)', value: 'NTDOY' },
            { name: 'Sony (SONY)', value: 'SONY' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('acheter')
      .setDescription('Investir vos pièces Saez dans un actif financier')
      .addStringOption((opt) =>
        opt
          .setName('actif')
          .setDescription('Symbole')
          .setRequired(true)
          .addChoices(
            { name: 'Bitcoin (BTC)', value: 'BTC' },
            { name: 'Ethereum (ETH)', value: 'ETH' },
            { name: 'Solana (SOL)', value: 'SOL' },
            { name: 'Apple (AAPL)', value: 'AAPL' },
            { name: 'Nvidia (NVDA)', value: 'NVDA' },
            { name: 'Nintendo (NTDOY)', value: 'NTDOY' },
            { name: 'Sony (SONY)', value: 'SONY' }
          )
      )
      .addIntegerOption((opt) =>
        opt.setName('montant_pieces').setDescription('Montant de pièces du bot à investir').setMinValue(10).setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('vendre')
      .setDescription('Revendre vos parts et encaisser des pièces sur votre solde')
      .addStringOption((opt) =>
        opt
          .setName('actif')
          .setDescription('Symbole')
          .setRequired(true)
          .addChoices(
            { name: 'Bitcoin (BTC)', value: 'BTC' },
            { name: 'Ethereum (ETH)', value: 'ETH' },
            { name: 'Solana (SOL)', value: 'SOL' },
            { name: 'Apple (AAPL)', value: 'AAPL' },
            { name: 'Nvidia (NVDA)', value: 'NVDA' },
            { name: 'Nintendo (NTDOY)', value: 'NTDOY' },
            { name: 'Sony (SONY)', value: 'SONY' }
          )
      )
      .addNumberOption((opt) =>
        opt.setName('unites').setDescription('Nombre d\'unités à revendre (ex: 0.05)').setMinValue(0.0001).setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('portefeuille')
      .setDescription('Consulter la valeur totale de votre portefeuille financier')
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guildId;
  if (sub === 'cours') {
    const symbol = interaction.options.getString('actif');
    if (symbol) {
      const asset = getMarketPrice(symbol);
      const trend = asset.change24h >= 0 ? '🟢 +' : '🔴 ';
      const embed = new EmbedBuilder()
        .setTitle(`📈 Cours en Direct : ${asset.name} (${asset.symbol})`)
        .setDescription(`• **Type :** \`${asset.type}\`\n• **Prix unitaire :** **${asset.price.toLocaleString('fr-FR')} 🪙**\n• **Tendance 24h :** ${trend}${asset.change24h}%`)
        .setColor(asset.change24h >= 0 ? 0x22c55e : 0xef4444)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Marché virtuel Saez Bourse' })
        .setTimestamp();
      return await interaction.reply({ embeds: [embed] });
    }
    const all = getAllMarketPrices();
    const embed = new EmbedBuilder()
      .setTitle('📊 Marché Financier Saez — Cours en Direct')
      .setDescription('Voici les cotations actuelles du marché. Investissez vos pièces avec `/bourse acheter` !')
      .setColor(config.colors.primary)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Prix calculés dynamiquement' })
      .setTimestamp();
    for (const a of all) {
      const trend = a.change24h >= 0 ? '🟢 +' : '🔴 ';
      embed.addFields({
        name: `${a.name} (${a.symbol}) [${a.type}]`,
        value: `**${a.price.toLocaleString('fr-FR')} 🪙** (${trend}${a.change24h}%)`,
        inline: true,
      });
    }
    return await interaction.reply({ embeds: [embed] });
  }
  if (sub === 'acheter') {
    const sym = interaction.options.getString('actif');
    const amt = interaction.options.getInteger('montant_pieces');
    const res = await buyAsset(guildId, interaction.user.id, sym, amt);
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.message}`, flags: MessageFlags.Ephemeral });
    }
    return await interaction.reply({
      content: `🎉 Félicitations ! Vous avez investi **${amt} 🪙** et acquis **${res.units} ${sym}** (${res.asset}) au cours unitaire de \`${res.price} 🪙\`.`,
    });
  }
  if (sub === 'vendre') {
    const sym = interaction.options.getString('actif');
    const units = interaction.options.getNumber('unites');
    const res = await sellAsset(guildId, interaction.user.id, sym, units);
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.message}`, flags: MessageFlags.Ephemeral });
    }
    return await interaction.reply({
      content: `💰 Vente exécutée avec succès ! Vous avez revendu **${res.units} ${sym}** et encaissé **+${res.revenue} 🪙** sur votre solde !`,
    });
  }
  if (sub === 'portefeuille') {
    await interaction.deferReply();
    const holdings = await getUserPortfolio(guildId, interaction.user.id);
    const bal = await getUserEconomy(guildId, interaction.user.id);
    let totalVal = 0;
    const lines = [];
    for (const [sym, units] of Object.entries(holdings)) {
      if (units > 0.00001) {
        const p = getMarketPrice(sym);
        const val = Math.round(units * (p?.price || 0));
        totalVal += val;
        lines.push(`• **${p?.name || sym}** (${sym}) : \`${units.toFixed(4)}\` parts ➜ **${val.toLocaleString('fr-FR')} 🪙**`);
      }
    }
    const embed = new EmbedBuilder()
      .setTitle(`💼 Portefeuille Financier de ${interaction.user.username}`)
      .setDescription(
        lines.length > 0
          ? lines.join('\n')
          : '*Aucun investissement en cours. Utilisez `/bourse acheter` pour investir !*'
      )
      .setColor(config.colors.accent)
      .addFields(
        { name: '💰 Liquidités en poche', value: `\`${bal.balance.toLocaleString('fr-FR')}\` 🪙`, inline: true },
        { name: '📈 Valeur du portefeuille', value: `\`${totalVal.toLocaleString('fr-FR')}\` 🪙`, inline: true },
        { name: '💎 Patrimoine Net Total', value: `\`${(bal.balance + totalVal).toLocaleString('fr-FR')}\` 🪙`, inline: false }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Finance & Investissement' })
      .setTimestamp();
    return await interaction.editReply({ embeds: [embed] });
  }
}
