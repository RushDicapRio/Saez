import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import {
  getActivityLeaderboard,
  getQuizLeaderboard,
  getGiveawayLeaderboard,
} from '../../services/communityLeaderboardService.js';
import { getTopTeams } from '../../services/teamService.js';
export const data = new SlashCommandBuilder()
  .setName('top')
  .setDescription('Consulter les classements communautaires du serveur')
  .addSubcommand((sub) =>
    sub
      .setName('activite')
      .setDescription('Classement des membres les plus actifs (messages et vocal)')
      .addIntegerOption((opt) =>
        opt
          .setName('limite')
          .setDescription('Nombre de membres à afficher (max 25)')
          .setMinValue(3)
          .setMaxValue(25)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('quiz')
      .setDescription('Classement des meilleurs joueurs aux quiz et mini-jeux')
      .addIntegerOption((opt) =>
        opt
          .setName('limite')
          .setDescription('Nombre de joueurs à afficher (max 25)')
          .setMinValue(3)
          .setMaxValue(25)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('concours')
      .setDescription('Classement des membres ayant remporté le plus de concours et giveaways')
      .addIntegerOption((opt) =>
        opt
          .setName('limite')
          .setDescription('Nombre de membres à afficher (max 25)')
          .setMinValue(3)
          .setMaxValue(25)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('equipes')
      .setDescription('Classement des équipes et clans du serveur')
      .addIntegerOption((opt) =>
        opt
          .setName('limite')
          .setDescription('Nombre d\'équipes à afficher (max 25)')
          .setMinValue(3)
          .setMaxValue(25)
      )
  );
export async function execute(interaction) {
  await interaction.deferReply();
  const sub = interaction.options.getSubcommand();
  const limit = interaction.options.getInteger('limite') || 10;
  const medals = ['🥇', '🥈', '🥉'];
  if (sub === 'activite') {
    const list = await getActivityLeaderboard(interaction.guild.id, limit);
    const embed = new EmbedBuilder()
      .setTitle('🏆 Classement de l\'Activité — Membres les plus Actifs')
      .setDescription(
        list.length === 0
          ? 'Aucune statistique d\'activité enregistrée pour le moment.'
          : list
              .map((item) => {
                const badge = medals[item.rank - 1] || `\`#${item.rank}\``;
                return `${badge} **${item.username}** • **${item.messagesCount}** messages • **${item.voiceMinutes}** min vocal (\`Score: ${item.totalScore} pts\`)`;
              })
              .join('\n\n')
      )
      .setColor(0x00e5ff)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système de Classements' })
      .setTimestamp();
    return interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'quiz') {
    const list = await getQuizLeaderboard(interaction.guild.id, limit);
    const embed = new EmbedBuilder()
      .setTitle('🧠 Classement des Meilleurs Joueurs — Quiz & Jeux')
      .setDescription(
        list.length === 0
          ? 'Aucun score de quiz enregistré pour l\'instant. Lancez une partie avec `/game quiz` !'
          : list
              .map((item) => {
                const badge = medals[item.rank - 1] || `\`#${item.rank}\``;
                return `${badge} **${item.username}** • **${item.quizScore}** pts (\`${item.quizGamesPlayed} parties | ${item.quizCorrectAnswers} bonnes réponses\`)`;
              })
              .join('\n\n')
      )
      .setColor(0xff2d7b)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système de Classements' })
      .setTimestamp();
    return interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'concours') {
    const list = await getGiveawayLeaderboard(interaction.guild.id, limit);
    const embed = new EmbedBuilder()
      .setTitle('🎁 Classement des Victoires — Concours & Giveaways')
      .setDescription(
        list.length === 0
          ? 'Aucun vainqueur de concours répertorié pour le moment.'
          : list
              .map((item) => {
                const badge = medals[item.rank - 1] || `\`#${item.rank}\``;
                return `${badge} **${item.username}** • **${item.giveawaysWon}** concours remporté(s) 🎉`;
              })
              .join('\n\n')
      )
      .setColor(0xfbbf24)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système de Classements' })
      .setTimestamp();
    return interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'equipes') {
    const list = await getTopTeams(interaction.guild.id, limit);
    const embed = new EmbedBuilder()
      .setTitle('⚔️ Classement des Équipes & Guildes du Serveur')
      .setDescription(
        list.length === 0
          ? 'Aucune équipe n\'a encore été fondée. Utilisez `/team creer` pour former votre guilde !'
          : list
              .map((team, idx) => {
                const badge = medals[idx] || `\`#${idx + 1}\``;
                return `${badge} **[${team.tag}] ${team.name}** — **${team.score}** pts (\`${team.wins} victoires | ${team.members.length} membres\`)`;
              })
              .join('\n\n')
      )
      .setColor(0xa855f7)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système d\'Équipes' })
      .setTimestamp();
    return interaction.editReply({ embeds: [embed] });
  }
}
