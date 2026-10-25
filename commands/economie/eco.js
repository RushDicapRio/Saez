import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';
import {
  getUserEconomy,
  claimDaily,
  claimWeekly,
  buyItem,
  SHOP_ITEMS,
  getLeaderboardEco,
  adjustBalance,
} from '../../services/economyService.js';
export default {
  data: new SlashCommandBuilder()
    .setName('eco')
    .setDescription('Système complet d\'économie virtuelle communautaire Saez Coins')
    .addSubcommand((sub) =>
      sub
        .setName('balance')
        .setDescription('Consulter votre solde ou celui d\'un autre membre')
        .addUserOption((opt) => opt.setName('membre').setDescription('Membre à consulter').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub.setName('daily').setDescription('Récupérer votre récompense quotidienne (toutes les 24h)')
    )
    .addSubcommand((sub) =>
      sub.setName('weekly').setDescription('Récupérer votre récompense hebdomadaire (tous les 7 jours)')
    )
    .addSubcommand((sub) =>
      sub
        .setName('shop')
        .setDescription('Explorer la boutique officielle Saez (rôles, badges, boosters et cosmétiques)')
        .addStringOption((opt) =>
          opt
            .setName('categorie')
            .setDescription('Filtrer les articles')
            .setRequired(false)
            .addChoices(
              { name: '🎭 Rôles & Titres Anime', value: 'roles' },
              { name: '🎖️ Badges de Profil', value: 'badges' },
              { name: '⚡ Boosters & Objets Spéciaux', value: 'boosters' },
              { name: '✨ Cosmétiques & Auras', value: 'cosmetiques' }
            )
        )
        .addIntegerOption((opt) =>
          opt.setName('page').setDescription('Numéro de page (1 à 5)').setMinValue(1).setMaxValue(5).setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('buy')
        .setDescription('Acheter un article de la boutique')
        .addStringOption((opt) =>
          opt.setName('item_id').setDescription('Identifiant exact de l\'objet (ex: role_otaku)').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('inventaire')
        .setDescription('Afficher vos objets, rôles et badges achetés')
        .addUserOption((opt) => opt.setName('membre').setDescription('Membre à consulter').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('top')
        .setDescription('Classement des membres les plus riches du serveur')
        .addIntegerOption((opt) =>
          opt.setName('limite').setDescription('Nombre de membres affichés (défaut: 10)').setMinValue(3).setMaxValue(25).setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('manage')
        .setDescription('Administration : créditer ou débiter des pièces (Staff)')
        .addUserOption((opt) => opt.setName('membre').setDescription('Membre ciblé').setRequired(true))
        .addIntegerOption((opt) =>
          opt.setName('montant').setDescription('Montant (positif pour ajouter, négatif pour retirer)').setRequired(true)
        )
        .addStringOption((opt) => opt.setName('raison').setDescription('Raison de la transaction').setRequired(false))
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    if (sub === 'balance') {
      const targetUser = interaction.options.getUser('membre') || interaction.user;
      const wallet = await getUserEconomy(guildId, targetUser.id);
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
    }
    if (sub === 'daily') {
      const res = await claimDaily(guildId, interaction.user.id);
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
    }
    if (sub === 'weekly') {
      const res = await claimWeekly(guildId, interaction.user.id);
      if (!res.success) {
        return await interaction.reply({
          content: `⏳ Vous avez déjà récupéré votre récompense hebdomadaire !\nRevenez dans **${res.remainingText}**.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      const embed = new EmbedBuilder()
        .setTitle('🌟 Grosse Récompense Hebdomadaire Récupérée !')
        .setDescription(`Bravo pour votre activité cette semaine ! Vous recevez **+${res.reward} Saez Coins** !`)
        .setColor(0x8b5cf6)
        .addFields({ name: '💰 Nouveau Solde', value: `**${res.balance.toLocaleString()}** Saez Coins` })
        .setFooter({ text: 'Codé avec ❤️ par Saez | Revenez dans 7 jours pour le prochain jackpot !' });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'shop') {
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
      const start = (page - 1) * pageSize;
      const pageItems = items.slice(start, start + pageSize);
      const embed = new EmbedBuilder()
        .setTitle('🛒 Boutique Officielle — Saez Animes')
        .setDescription(
          `Découvrez nos **${items.length} articles virtuels** disponibles !\n` +
          'Achetez un article avec la commande : `/eco buy item_id:<id_article>`\n' +
          'Consultez votre solde avec : `/eco balance`\n'
        )
        .setColor(0x00e5ff)
        .setFooter({ text: `Codé avec ❤️ par Saez | Page ${page} / ${maxPages} • Saez Coins (Monnaie 100% fictive)` });
      for (const item of pageItems) {
        embed.addFields({
          name: `${item.name} — 🪙 ${item.price.toLocaleString()} Coins`,
          value: `> \`/eco buy item_id:${item.id}\`\n> *${item.desc}*`,
          inline: false,
        });
      }
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'buy') {
      const itemId = interaction.options.getString('item_id');
      const res = await buyItem(guildId, interaction.user.id, itemId);
      if (!res.success) {
        return await interaction.reply({ content: `❌ ${res.message}`, flags: MessageFlags.Ephemeral });
      }
      const embed = new EmbedBuilder()
        .setTitle('🛍️ Achat Effectué avec Succès !')
        .setDescription(`Félicitations ! Vous venez d'acquérir **${res.item.name}** pour **${res.item.price.toLocaleString()} Saez Coins** !`)
        .setColor(0x10b981)
        .addFields(
          { name: '📦 Objet Obtenu', value: `*${res.item.desc}*`, inline: false },
          { name: '💰 Solde Restant', value: `**${res.balance.toLocaleString()}** Saez Coins`, inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Utilisez /eco inventaire pour voir tous vos objets' });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'inventaire') {
      const targetUser = interaction.options.getUser('membre') || interaction.user;
      const wallet = await getUserEconomy(guildId, targetUser.id);
      const inventory = wallet.inventory || [];
      const embed = new EmbedBuilder()
        .setTitle(`🎒 Sac à Dos & Inventaire — ${targetUser.username}`)
        .setColor(0x38bdf8)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Codé avec ❤️ par Saez | ${inventory.length} article(s) dans la collection` });
      if (inventory.length === 0) {
        embed.setDescription('*Cet inventaire est actuellement vide.*\nVisitez la boutique avec `/eco shop` pour acheter votre premier article !');
      } else {
        const itemCounts = {};
        for (const id of inventory) {
          itemCounts[id] = (itemCounts[id] || 0) + 1;
        }
        for (const [id, count] of Object.entries(itemCounts)) {
          const itemDef = SHOP_ITEMS.find((i) => i.id === id);
          const name = itemDef ? itemDef.name : id;
          const desc = itemDef ? itemDef.desc : 'Objet collector spécial';
          embed.addFields({
            name: `${name} ${count > 1 ? `\`x${count}\`` : ''}`,
            value: `> *${desc}*`,
            inline: false,
          });
        }
      }
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'top') {
      const limit = interaction.options.getInteger('limite') || 10;
      const list = await getLeaderboardEco(guildId, limit);
      const embed = new EmbedBuilder()
        .setTitle('🏆 Panthéon des Membres les Plus Riches — Saez Coins')
        .setDescription('Découvrez les plus grands trésoriers et investisseurs du serveur :')
        .setColor(0xfbbf24)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Gagnez des pièces avec /eco daily et en participant au serveur !' });
      if (list.length === 0) {
        embed.setDescription('*Aucune donnée d\'économie enregistrée pour l\'instant.*');
      } else {
        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        const lines = list.map((user, idx) => {
          const rank = medals[idx] || `\`#${idx + 1}\``;
          const total = (user.balance || 0) + (user.bank || 0);
          return `${rank} <@${user.user_id}> — **${total.toLocaleString()}** Coins *(Poche: ${user.balance || 0} | Banque: ${user.bank || 0})*`;
        });
        embed.addFields({ name: 'Classement Général', value: lines.join('\n') });
      }
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'manage') {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        return await interaction.reply({
          content: '❌ Cette commande est réservée aux Administrateurs du serveur.',
          flags: MessageFlags.Ephemeral,
        });
      }
      const targetUser = interaction.options.getUser('membre');
      const amount = interaction.options.getInteger('montant');
      const reason = interaction.options.getString('raison') || 'Ajustement administratif';
      const newBalance = await adjustBalance(guildId, targetUser.id, amount);
      const isPositive = amount >= 0;
      const embed = new EmbedBuilder()
        .setTitle('⚖️ Ajustement Économique Effectué')
        .setColor(isPositive ? 0x10b981 : 0xef4444)
        .setDescription(
          `Le solde de ${targetUser} a été modifié de **${isPositive ? '+' : ''}${amount.toLocaleString()} Saez Coins**.\n\n` +
          `• **Nouveau solde :** **${newBalance.toLocaleString()}** Coins\n` +
          `• **Raison :** *${reason}*\n` +
          `• **Par :** ${interaction.user}`
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Journal de gestion économique' });
      return await interaction.reply({ embeds: [embed] });
    }
  },
};
