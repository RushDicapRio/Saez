import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('shifumi')
  .setDescription('Joue à Pierre, Feuille, Ciseaux (Chifoumi) avec des boutons interactifs')
  .addUserOption((opt) =>
    opt.setName('adversaire').setDescription('Le membre à affronter (laisser vide pour jouer contre le Bot)').setRequired(false)
  );
export async function execute(interaction) {
  const opponent = interaction.options?.getUser ? interaction.options.getUser('adversaire') : null;
  const isVsBot = !opponent || opponent.id === interaction.user.id || opponent.bot;
  const choices = [
    { id: 'rock', name: 'Pierre', emoji: '🪨' },
    { id: 'paper', name: 'Feuille', emoji: '📄' },
    { id: 'scissors', name: 'Ciseaux', emoji: '✂️' },
  ];
  const row = new ActionRowBuilder().addComponents(
    choices.map((c) =>
      new ButtonBuilder()
        .setCustomId(`shifumi_${c.id}`)
        .setLabel(c.name)
        .setEmoji(c.emoji)
        .setStyle(ButtonStyle.Primary)
    )
  );
  if (isVsBot) {
    const embed = new EmbedBuilder()
      .setTitle('🪨 Pierre, Feuille, Ciseaux ✂️')
      .setDescription(
        `Faites votre choix ci-dessous contre **Saez Bot** !\n\n` +
        `• 🪨 **Pierre** bat Ciseaux\n` +
        `• 📄 **Feuille** bat Pierre\n` +
        `• ✂️ **Ciseaux** bat Feuille`
      )
      .setColor(config.colors.accent)
      .setThumbnail(config.assets.logoUrl)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Cliquez pour jouer !' });
    const reply = interaction.deferred
      ? await interaction.editReply({ embeds: [embed], components: [row] })
      : interaction.replied
      ? await interaction.followUp({ embeds: [embed], components: [row] })
      : await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000,
    });
    collector.on('collect', async (btnInt) => {
      if (btnInt.user.id !== interaction.user.id) {
        return await btnInt.reply({
          content: '⛔ Lancez votre propre partie avec `/shifumi` !',
          ephemeral: true,
        });
      }
      collector.stop('played');
      const userChoiceId = btnInt.customId.replace('shifumi_', '');
      const userChoice = choices.find((c) => c.id === userChoiceId);
      const botChoice = choices[Math.floor(Math.random() * choices.length)];
      let resultText = '';
      let resultColor = config.colors.primary;
      if (userChoice.id === botChoice.id) {
        resultText = '🤝 **Égalité parfaite !** Même coup joué.';
        resultColor = 0x6b7280;
      } else if (
        (userChoice.id === 'rock' && botChoice.id === 'scissors') ||
        (userChoice.id === 'paper' && botChoice.id === 'rock') ||
        (userChoice.id === 'scissors' && botChoice.id === 'paper')
      ) {
        resultText = `🎉 **Victoire de ${interaction.user} !** ${userChoice.emoji} bat ${botChoice.emoji}.`;
        resultColor = 0x10b981;
      } else {
        resultText = `💀 **Le Bot gagne !** ${botChoice.emoji} bat ${userChoice.emoji}.`;
        resultColor = 0xef4444;
      }
      const resultEmbed = new EmbedBuilder()
        .setTitle('⚔️ Résultat du Chifoumi !')
        .setDescription(
          `• 👤 **Vous :** ${userChoice.emoji} ${userChoice.name}\n` +
          `• 🤖 **Bot :** ${botChoice.emoji} ${botChoice.name}\n\n` +
          `📢 ${resultText}`
        )
        .setColor(resultColor)
        .setThumbnail(config.assets.logoUrl)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Mini-Jeux' })
        .setTimestamp();
      const disabledRow = new ActionRowBuilder().addComponents(
        choices.map((c) =>
          new ButtonBuilder()
            .setCustomId(`shifumi_dis_${c.id}`)
            .setLabel(c.name)
            .setEmoji(c.emoji)
            .setStyle(c.id === userChoice.id ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setDisabled(true)
        )
      );
      await btnInt.update({
        embeds: [resultEmbed],
        components: [disabledRow],
      });
    });
    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        await interaction.editReply({
          content: '⌛ Temps écoulé pour choisir votre coup !',
          components: [],
        }).catch(() => {});
      }
    });
    return;
  }
  let p1Choice = null;
  let p2Choice = null;
  const duelEmbed = new EmbedBuilder()
    .setTitle('⚔️ Duel Chifoumi : Joueur vs Joueur !')
    .setDescription(
      `Duel entre **${interaction.user}** et **${opponent}** !\n\n` +
      `Cliquez sur votre coup secret ci-dessous. Vos choix restent cachés jusqu'au duel final !`
    )
    .setColor(config.colors.accent)
    .setFooter({ text: 'Codé avec ❤️ par Saez' });
  const reply = interaction.deferred
    ? await interaction.editReply({ embeds: [duelEmbed], components: [row] })
    : interaction.replied
    ? await interaction.followUp({ embeds: [duelEmbed], components: [row] })
    : await interaction.reply({ embeds: [duelEmbed], components: [row], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 45000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id && btnInt.user.id !== opponent.id) {
      return await btnInt.reply({ content: '⛔ Ce duel ne vous concerne pas !', ephemeral: true });
    }
    const choiceId = btnInt.customId.replace('shifumi_', '');
    const chosen = choices.find((c) => c.id === choiceId);
    if (btnInt.user.id === interaction.user.id) {
      if (p1Choice) return await btnInt.reply({ content: 'Vous avez déjà fait votre choix !', ephemeral: true });
      p1Choice = chosen;
      await btnInt.reply({ content: `✅ Votre choix (${chosen.emoji} ${chosen.name}) est enregistré !`, ephemeral: true });
    } else {
      if (p2Choice) return await btnInt.reply({ content: 'Vous avez déjà fait votre choix !', ephemeral: true });
      p2Choice = chosen;
      await btnInt.reply({ content: `✅ Votre choix (${chosen.emoji} ${chosen.name}) est enregistré !`, ephemeral: true });
    }
    if (p1Choice && p2Choice) {
      collector.stop('duel_finished');
      let winnerText = '';
      let winColor = config.colors.primary;
      if (p1Choice.id === p2Choice.id) {
        winnerText = '🤝 **Égalité parfaite !**';
        winColor = 0x6b7280;
      } else if (
        (p1Choice.id === 'rock' && p2Choice.id === 'scissors') ||
        (p1Choice.id === 'paper' && p2Choice.id === 'rock') ||
        (p1Choice.id === 'scissors' && p2Choice.id === 'paper')
      ) {
        winnerText = `🏆 **Victoire de ${interaction.user} !** (${p1Choice.emoji} bat ${p2Choice.emoji})`;
        winColor = 0x10b981;
      } else {
        winnerText = `🏆 **Victoire de ${opponent} !** (${p2Choice.emoji} bat ${p1Choice.emoji})`;
        winColor = 0x10b981;
      }
      const endEmbed = new EmbedBuilder()
        .setTitle('⚔️ Résultat du Duel !')
        .setDescription(
          `• ${interaction.user} a choisi : **${p1Choice.emoji} ${p1Choice.name}**\n` +
          `• ${opponent} a choisi : **${p2Choice.emoji} ${p2Choice.name}**\n\n` +
          `📢 ${winnerText}`
        )
        .setColor(winColor)
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      await interaction.editReply({
        embeds: [endEmbed],
        components: [],
      });
    }
  });
  collector.on('end', async (_, reason) => {
    if (reason === 'time') {
      await interaction.editReply({
        content: '⌛ Le temps imparti est écoulé. Duel annulé.',
        components: [],
      }).catch(() => {});
    }
  });
}
