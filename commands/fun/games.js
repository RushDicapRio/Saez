import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('games')
  .setDescription('Centre d\'Arcade : Mini-jeux et divertissements Saez')
  .addSubcommand((sub) =>
    sub.setName('menu').setDescription('Affiche le menu interactif de tous les mini-jeux disponibles')
  )
  .addSubcommand((sub) =>
    sub.setName('quiz').setDescription('Lance directement le Quiz Animé Otaku')
  )
  .addSubcommand((sub) =>
    sub
      .setName('morpion')
      .setDescription('Lance une partie de Morpion (Tic-Tac-Toe)')
      .addUserOption((opt) => opt.setName('adversaire').setDescription('Le joueur à affronter').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('shifumi')
      .setDescription('Lance un Pierre, Feuille, Ciseaux (Chifoumi)')
      .addUserOption((opt) => opt.setName('adversaire').setDescription('Le joueur à affronter').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub.setName('guess').setDescription('Lance une partie du Juste Nombre (1 à 100)')
  )
  .addSubcommand((sub) =>
    sub
      .setName('8ball')
      .setDescription('Pose une question à la Boule Magique 8-Ball')
      .addStringOption((opt) => opt.setName('question').setDescription('Votre question').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub.setName('coinflip').setDescription('Lance une pièce de monnaie (Pile ou Face)')
  )
  .addSubcommand((sub) =>
    sub
      .setName('roll')
      .setDescription('Lance un dé aléatoire')
      .addIntegerOption((opt) => opt.setName('faces').setDescription('Nombre de faces (défaut : 6)').setRequired(false))
  );
export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand(false) || 'menu';
  if (subcommand === 'quiz') {
    const { execute: execQuiz } = await import('./quiz.js');
    return await execQuiz(interaction);
  }
  if (subcommand === 'morpion') {
    const { execute: execMorpion } = await import('./morpion.js');
    return await execMorpion(interaction);
  }
  if (subcommand === 'shifumi') {
    const { execute: execShifumi } = await import('./shifumi.js');
    return await execShifumi(interaction);
  }
  if (subcommand === 'guess') {
    const { execute: execGuess } = await import('./guess.js');
    return await execGuess(interaction);
  }
  if (subcommand === '8ball') {
    const { execute: exec8ball } = await import('./8ball.js');
    return await exec8ball(interaction);
  }
  if (subcommand === 'coinflip') {
    const { execute: execCoinflip } = await import('./coinflip.js');
    return await execCoinflip(interaction);
  }
  if (subcommand === 'roll') {
    const { execute: execRoll } = await import('./roll.js');
    return await execRoll(interaction);
  }
  const embed = new EmbedBuilder()
    .setTitle('🎮 Centre d\'Arcade & Mini-Jeux — Saez Animes')
    .setDescription(
      'Bienvenue dans l\'espace divertissement de **Saez Animes** ! 🎉\n\n' +
      'Choisissez un jeu ci-dessous pour lancer une partie immédiatement, ou tapez directement la commande associée :\n\n' +
      '• 🎌 **Quiz Animé** (`/quiz`) : Testez vos connaissances Otaku à choix multiples.\n' +
      '• ❌ **Morpion** (`/morpion`) : Grille 3x3 interactive contre le Bot ou un ami.\n' +
      '• ✂️ **Chifoumi** (`/shifumi`) : Pierre, Feuille, Ciseaux en solo ou en duel.\n' +
      '• 🔢 **Le Juste Nombre** (`/guess`) : Devinez le nombre secret entre 1 et 100.\n' +
      '• 🎱 **Boule Magique** (`/8ball`) : Interrogez l\'Oracle sur votre avenir.\n' +
      '• 🪙 **Pile ou Face** (`/coinflip`) & 🎲 **Lancer de Dé** (`/roll`)\n\n' +
      '*(Toutes ces activités sont réservées à ce salon)*'
    )
    .setColor(config.colors.accent)
    .setThumbnail(config.assets.logoUrl)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système de Jeux Interactifs' })
    .setTimestamp();
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('hub_launch_quiz').setLabel('Quiz Anime').setEmoji('🎌').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('hub_launch_morpion').setLabel('Morpion 3x3').setEmoji('❌').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('hub_launch_shifumi').setLabel('Chifoumi').setEmoji('✂️').setStyle(ButtonStyle.Primary)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('hub_launch_guess').setLabel('Juste Nombre').setEmoji('🔢').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('hub_launch_coinflip').setLabel('Pile ou Face').setEmoji('🪙').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('hub_launch_roll').setLabel('Lancer de Dé').setEmoji('🎲').setStyle(ButtonStyle.Secondary)
  );
  await interaction.reply({
    embeds: [embed],
    components: [row1, row2],
  });
}
