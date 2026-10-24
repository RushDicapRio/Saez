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
  .setName('morpion')
  .setDescription('Joue au Morpion (Tic-Tac-Toe) interactif avec des boutons')
  .addUserOption((opt) =>
    opt.setName('adversaire').setDescription('Le membre à défier (laisser vide pour jouer contre le Bot)').setRequired(false)
  );
export async function execute(interaction) {
  const opponent = interaction.options?.getUser ? interaction.options.getUser('adversaire') : null;
  const isVsBot = !opponent || opponent.id === interaction.user.id || opponent.bot;
  const playerX = interaction.user;
  const playerO = isVsBot ? interaction.client.user : opponent;
  const board = Array(9).fill(' ');
  let currentTurn = 'X'; 
  function renderComponents(disabled = false) {
    const rows = [];
    for (let r = 0; r < 3; r++) {
      const row = new ActionRowBuilder();
      for (let c = 0; c < 3; c++) {
        const idx = r * 3 + c;
        const val = board[idx];
        let label = '\u200B'; 
        let style = ButtonStyle.Secondary;
        if (val === 'X') {
          label = '❌';
          style = ButtonStyle.Danger;
        } else if (val === 'O') {
          label = '⭕';
          style = ButtonStyle.Primary;
        }
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`morpion_${idx}`)
            .setLabel(label)
            .setStyle(style)
            .setDisabled(disabled || val !== ' ')
        );
      }
      rows.push(row);
    }
    return rows;
  }
  function checkWinner() {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], 
      [0, 3, 6], [1, 4, 7], [2, 5, 8], 
      [0, 4, 8], [2, 4, 6],             
    ];
    for (const [a, b, c] of lines) {
      if (board[a] !== ' ' && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    if (!board.includes(' ')) return 'DRAW';
    return null;
  }
  function getEmbed(statusText, color = config.colors.primary) {
    return new EmbedBuilder()
      .setTitle('❌ Morpion Interactif ⭕')
      .setDescription(
        `• ❌ **Joueur X :** ${playerX}\n` +
        `• ⭕ **Joueur O :** ${playerO}\n\n` +
        `📢 **Statut :** ${statusText}`
      )
      .setColor(color)
      .setThumbnail(config.assets.logoUrl)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Mini-Jeux Fun' })
      .setTimestamp();
  }
  const payload = {
    embeds: [getEmbed(`Au tour de ${playerX} (❌) !`)],
    components: renderComponents(false),
  };
  const initialMsg = interaction.deferred
    ? await interaction.editReply(payload)
    : interaction.replied
    ? await interaction.followUp(payload)
    : await interaction.reply({ ...payload, fetchReply: true });
  const collector = initialMsg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 120000, 
  });
  collector.on('collect', async (btnInt) => {
    const expectedUser = currentTurn === 'X' ? playerX : playerO;
    if (btnInt.user.id !== expectedUser.id) {
      return await btnInt.reply({
        content: `⛔ Ce n'est pas votre tour ! Attendez que <@${expectedUser.id}> joue.`,
        ephemeral: true,
      });
    }
    const clickedIndex = parseInt(btnInt.customId.replace('morpion_', ''), 10);
    if (board[clickedIndex] !== ' ') {
      return await btnInt.reply({ content: 'Case déjà occupée !', ephemeral: true });
    }
    board[clickedIndex] = currentTurn;
    let winner = checkWinner();
    if (winner) {
      collector.stop('ended');
      let endText = '';
      let color = config.colors.accent;
      if (winner === 'DRAW') {
        endText = '🤝 **Match nul !** Bien joué aux deux joueurs.';
        color = 0x6b7280;
      } else {
        const winningUser = winner === 'X' ? playerX : playerO;
        endText = `🏆 **Victoire de ${winningUser} (${winner === 'X' ? '❌' : '⭕'}) !** Félicitations !`;
        color = 0x10b981;
      }
      return await btnInt.update({
        embeds: [getEmbed(endText, color)],
        components: renderComponents(true),
      });
    }
    currentTurn = currentTurn === 'X' ? 'O' : 'X';
    if (isVsBot && currentTurn === 'O') {
      await btnInt.update({
        embeds: [getEmbed(`🤖 Le Bot réfléchit...`, 0xf59e0b)],
        components: renderComponents(true),
      });
      setTimeout(async () => {
        const emptyIndices = board.map((v, i) => (v === ' ' ? i : null)).filter((v) => v !== null);
        if (emptyIndices.length > 0) {
          const botMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          board[botMove] = 'O';
        }
        winner = checkWinner();
        if (winner) {
          collector.stop('ended');
          let endText = winner === 'DRAW' ? '🤝 **Match nul !**' : `🏆 **${winner === 'X' ? playerX : 'Le Bot'}** a gagné !`;
          await interaction.editReply({
            embeds: [getEmbed(endText, winner === 'X' ? 0x10b981 : 0xef4444)],
            components: renderComponents(true),
          });
        } else {
          currentTurn = 'X';
          await interaction.editReply({
            embeds: [getEmbed(`À vous de jouer, ${playerX} (❌) !`)],
            components: renderComponents(false),
          });
        }
      }, 700);
      return;
    }
    const nextUser = currentTurn === 'X' ? playerX : playerO;
    await btnInt.update({
      embeds: [getEmbed(`Au tour de ${nextUser} (${currentTurn === 'X' ? '❌' : '⭕'}) !`)],
      components: renderComponents(false),
    });
  });
  collector.on('end', async (_, reason) => {
    if (reason === 'time') {
      await interaction.editReply({
        embeds: [getEmbed('⌛ **Partie abandonnée** (délai de 2 minutes dépassé).', 0xef4444)],
        components: renderComponents(true),
      }).catch(() => {});
    }
  });
}
