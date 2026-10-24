import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { adjustBalance, getUserEconomy } from '../../services/economyService.js';
export default {
  data: new SlashCommandBuilder()
    .setName('eco-manage')
    .setDescription('Gestion administrative de l\'économie virtuelle Saez')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName('donner')
        .setDescription('Ajouter des Saez Coins à un membre')
        .addUserOption((opt) => opt.setName('membre').setDescription('Membre bénéficiaire').setRequired(true))
        .addIntegerOption((opt) => opt.setName('montant').setDescription('Montant de pièces').setMinValue(1).setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('retirer')
        .setDescription('Retirer des Saez Coins à un membre')
        .addUserOption((opt) => opt.setName('membre').setDescription('Membre ciblé').setRequired(true))
        .addIntegerOption((opt) => opt.setName('montant').setDescription('Montant de pièces à déduire').setMinValue(1).setRequired(true))
    ),
  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Vous devez être administrateur pour utiliser cette commande.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('membre');
    const amount = interaction.options.getInteger('montant');
    if (sub === 'donner') {
      const newBal = await adjustBalance(interaction.guild.id, target.id, amount);
      const embed = new EmbedBuilder()
        .setTitle('✅ Saez Coins Attribués')
        .setDescription(`**+${amount.toLocaleString()} Saez Coins** ont été ajoutés au compte de <@${target.id}>.\nNouveau solde : **${newBal.toLocaleString()} Coins**.`)
        .setColor(0x10b981)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'retirer') {
      const newBal = await adjustBalance(interaction.guild.id, target.id, -amount);
      const embed = new EmbedBuilder()
        .setTitle('⚠️ Saez Coins Retirés')
        .setDescription(`**-${amount.toLocaleString()} Saez Coins** ont été déduits du compte de <@${target.id}>.\nNouveau solde : **${newBal.toLocaleString()} Coins**.`)
        .setColor(0xef4444)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.reply({ embeds: [embed] });
    }
  },
};
