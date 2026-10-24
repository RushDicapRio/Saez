import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { ANIME_QUIZ_QUESTIONS } from '../../services/funService.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('quiz')
  .setDescription('Lance une question de Quiz Animé avec choix multiples et boutons interactifs');
export async function execute(interaction) {
  const randomIndex = Math.floor(Math.random() * ANIME_QUIZ_QUESTIONS.length);
  const q = ANIME_QUIZ_QUESTIONS[randomIndex];
  const letters = ['A', 'B', 'C', 'D'];
  const emojis = ['🇦', '🇧', '🇨', '🇩'];
  const embed = new EmbedBuilder()
    .setTitle(`🎌 Quiz Animé — ${q.anime}`)
    .setDescription(
      `**${q.question}**\n\n` +
      q.answers.map((ans, i) => `${emojis[i]} **${letters[i]}.** ${ans}`).join('\n') +
      `\n\n⏱️ *Vous avez 30 secondes pour répondre ci-dessous !*`
    )
    .setColor(config.colors.accent)
    .setThumbnail(config.assets.logoUrl)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Quiz • Testez vos connaissances Otaku' })
    .setTimestamp();
  const row = new ActionRowBuilder();
  for (let i = 0; i < q.answers.length; i++) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`quiz_ans_${i}`)
        .setLabel(`${letters[i]}. ${q.answers[i]}`)
        .setStyle(ButtonStyle.Primary)
    );
  }
  const response = interaction.deferred
    ? await interaction.editReply({ embeds: [embed], components: [row] })
    : interaction.replied
    ? await interaction.followUp({ embeds: [embed], components: [row] })
    : await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 30000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) {
      return await btnInt.reply({
        content: `⛔ Seul ${interaction.user} peut répondre à cette question ! Lancez votre propre quiz avec \`/quiz\`.`,
        ephemeral: true,
      });
    }
    collector.stop('answered');
    const chosenIndex = parseInt(btnInt.customId.replace('quiz_ans_', ''), 10);
    const isCorrect = chosenIndex === q.correct;
    const disabledRow = new ActionRowBuilder();
    for (let i = 0; i < q.answers.length; i++) {
      let style = ButtonStyle.Secondary;
      if (i === q.correct) style = ButtonStyle.Success;
      else if (i === chosenIndex && !isCorrect) style = ButtonStyle.Danger;
      disabledRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`quiz_disabled_${i}`)
          .setLabel(`${letters[i]}. ${q.answers[i]}`)
          .setStyle(style)
          .setDisabled(true)
      );
    }
    const resultEmbed = new EmbedBuilder()
      .setTitle(isCorrect ? '🎉 Bonne Réponse !' : '❌ Mauvaise Réponse !')
      .setDescription(
        `**${q.question}**\n\n` +
        `• **Votre choix :** \`${letters[chosenIndex]}. ${q.answers[chosenIndex]}\`\n` +
        `• **Bonne réponse :** \`${letters[q.correct]}. ${q.answers[q.correct]}\`\n\n` +
        `💡 *${q.explanation}*`
      )
      .setColor(isCorrect ? 0x10b981 : 0xef4444)
      .setThumbnail(isCorrect ? 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif' : config.assets.logoUrl)
      .setFooter({ text: isCorrect ? 'Codé avec ❤️ par Saez | +50 XP accordés au profil Saez !' : 'Meilleure chance la prochaine fois !' })
      .setTimestamp();
    await btnInt.update({
      embeds: [resultEmbed],
      components: [disabledRow],
    });
  });
  collector.on('end', async (_, reason) => {
    if (reason === 'time') {
      const timeoutRow = new ActionRowBuilder();
      for (let i = 0; i < q.answers.length; i++) {
        timeoutRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`quiz_timed_${i}`)
            .setLabel(`${letters[i]}. ${q.answers[i]}`)
            .setStyle(i === q.correct ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setDisabled(true)
        );
      }
      const timeoutEmbed = new EmbedBuilder()
        .setTitle('⌛ Temps Écoulé !')
        .setDescription(
          `**${q.question}**\n\n` +
          `Le temps imparti (30 secondes) est terminé.\n` +
          `• **La bonne réponse était :** \`${letters[q.correct]}. ${q.answers[q.correct]}\`\n\n` +
          `💡 *${q.explanation}*`
        )
        .setColor(0xf59e0b)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Quiz' });
      await interaction.editReply({
        embeds: [timeoutEmbed],
        components: [timeoutRow],
      }).catch(() => {});
    }
  });
}
