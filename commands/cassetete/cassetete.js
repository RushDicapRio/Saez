import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import * as Service from '../../services/casseteteService.js';
const { Chess, Sudoku, Puzzles } = Service;
export const data = new SlashCommandBuilder()
  .setName('cassetete')
  .setDescription('Casse-têtes, échecs, sudoku, énigmes et jeux de réflexion')
  .addSubcommand((sub) =>
    sub
      .setName('aide')
      .setDescription('Afficher le guide complet et les règles de tous les casse-têtes')
  )
  .addSubcommand((sub) =>
    sub
      .setName('liste')
      .setDescription('Consulter la liste de tous les jeux de réflexion disponibles')
  )
  .addSubcommand((sub) =>
    sub
      .setName('echecs')
      .setDescription('Jouer aux échecs (1v1 ou contre IA) ou résoudre un problème tactique')
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Action à effectuer')
          .addChoices(
            { name: 'Nouveau / Jouer', value: 'jouer' },
            { name: 'Solo contre IA', value: 'ia' },
            { name: 'Jouer un coup (ex: e2e4, Nf3, O-O)', value: 'coup' },
            { name: 'Afficher la position', value: 'position' },
            { name: 'Tactique du jour', value: 'tactique' },
            { name: 'Proposer nulle', value: 'nulle' },
            { name: 'Abandonner', value: 'abandonner' }
          )
          .setRequired(false)
      )
      .addUserOption((opt) => opt.setName('adversaire').setDescription('Joueur à défier').setRequired(false))
      .addStringOption((opt) => opt.setName('coup_texte').setDescription('Coup à jouer (ex: e2e4, g1f3, e7e8q, O-O)').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('sudoku')
      .setDescription('Jouer au Sudoku : générer, remplir, notes et indices')
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Action à réaliser')
          .addChoices(
            { name: 'Nouvelle grille', value: 'nouveau' },
            { name: 'Remplir une case', value: 'remplir' },
            { name: 'Effacer une case', value: 'effacer' },
            { name: 'Note candidate', value: 'note' },
            { name: 'Vérifier les erreurs', value: 'verifier' },
            { name: 'Obtenir un indice', value: 'indice' },
            { name: 'Afficher la solution', value: 'solution' },
            { name: 'Abandonner', value: 'abandonner' }
          )
          .setRequired(false)
      )
      .addStringOption((opt) =>
        opt
          .setName('difficulte')
          .setDescription('Niveau de difficulté pour une nouvelle grille')
          .addChoices(
            { name: 'Facile', value: 'facile' },
            { name: 'Moyen', value: 'moyen' },
            { name: 'Difficile', value: 'difficile' },
            { name: 'Expert', value: 'expert' }
          )
          .setRequired(false)
      )
      .addStringOption((opt) => opt.setName('coord').setDescription('Coordonnée de la case (ex: B5 ou E2)').setRequired(false))
      .addIntegerOption((opt) => opt.setName('valeur').setDescription('Chiffre de 1 à 9').setMinValue(1).setMaxValue(9).setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('mots')
      .setDescription('Jeux de lettres : anagrammes, mot mystère (motus) et pendu')
      .addStringOption((opt) =>
        opt
          .setName('mode')
          .setDescription('Mode de jeu de lettres')
          .addChoices(
            { name: 'Anagramme', value: 'anagramme' },
            { name: 'Mot Mystère (Wordle / Motus)', value: 'motus' },
            { name: 'Pendu', value: 'pendu' }
          )
          .setRequired(false)
      )
      .addStringOption((opt) => opt.setName('reponse').setDescription('Votre proposition de mot ou de lettre').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('logique')
      .setDescription('Énigmes et casse-têtes de logique avec indices et vérification')
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Action')
          .addChoices(
            { name: 'Tirer une nouvelle énigme', value: 'tirer' },
            { name: 'Proposer une réponse', value: 'repondre' },
            { name: 'Indice', value: 'indice' },
            { name: 'Solution', value: 'solution' }
          )
          .setRequired(false)
      )
      .addStringOption((opt) => opt.setName('reponse').setDescription('Votre réponse à l\'énigme').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('mastermind')
      .setDescription('Deviner la combinaison secrète de 4 pions avec indices')
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Action')
          .addChoices(
            { name: 'Nouvelle partie', value: 'nouveau' },
            { name: 'Faire une tentative', value: 'deviner' },
            { name: 'Abandonner', value: 'abandonner' }
          )
          .setRequired(false)
      )
      .addStringOption((opt) => opt.setName('proposition').setDescription('4 couleurs (ex: rouge bleu vert jaune ou 1 2 3 4)').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('demineur')
      .setDescription('Grille de démineur classique')
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Action')
          .addChoices(
            { name: 'Nouvelle grille', value: 'nouvelle' },
            { name: 'Révéler une case', value: 'reveler' },
            { name: 'Poser / Retirer drapeau', value: 'drapeau' },
            { name: 'Abandonner', value: 'abandonner' }
          )
          .setRequired(false)
      )
      .addStringOption((opt) => opt.setName('coord').setDescription('Case (ex: A1, C4, E6)').setRequired(false))
      .addStringOption((opt) =>
        opt
          .setName('difficulte')
          .setDescription('Taille et nombre de mines')
          .addChoices(
            { name: 'Facile (6x6 - 5 mines)', value: 'facile' },
            { name: 'Moyen (8x8 - 10 mines)', value: 'moyen' }
          )
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('puissance4')
      .setDescription('Jeu Puissance 4 interactif à boutons')
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Action')
          .addChoices(
            { name: 'Jouer contre IA', value: 'ia' },
            { name: 'Défier un membre', value: 'duel' },
            { name: 'Abandonner la partie en cours', value: 'abandonner' }
          )
          .setRequired(false)
      )
      .addUserOption((opt) => opt.setName('adversaire').setDescription('Membre à défier').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('morpion')
      .setDescription('Morpion interactif 3x3 à boutons (Solo IA ou 1v1)')
      .addUserOption((opt) => opt.setName('adversaire').setDescription('Membre à défier (laisser vide pour jouer contre l\'IA)').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('2048')
      .setDescription('Jeu 2048 interactif avec boutons directionnels')
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Action')
          .addChoices(
            { name: 'Nouvelle partie', value: 'nouvelle' },
            { name: 'Abandonner', value: 'abandonner' }
          )
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('hanoi')
      .setDescription('Résoudre la Tour de Hanoï en déplaçant les disques')
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Action')
          .addChoices(
            { name: 'Nouvelle partie', value: 'nouvelle' },
            { name: 'Déplacer un disque', value: 'deplacer' },
            { name: 'Abandonner', value: 'abandonner' }
          )
          .setRequired(false)
      )
      .addStringOption((opt) => opt.setName('source').setDescription('Piquet de départ (A, B ou C)').setRequired(false))
      .addStringOption((opt) => opt.setName('destination').setDescription('Piquet d\'arrivée (A, B ou C)').setRequired(false))
      .addIntegerOption((opt) => opt.setName('disques').setDescription('Nombre de disques (3 à 5)').setMinValue(3).setMaxValue(5).setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('calcul')
      .setDescription('Le Compte est Bon & Calcul mental chronométré')
      .addStringOption((opt) =>
        opt
          .setName('mode')
          .setDescription('Mode arithmétique')
          .addChoices(
            { name: 'Le Compte est Bon', value: 'compte' },
            { name: 'Calcul Mental', value: 'mental' }
          )
          .setRequired(false)
      )
      .addStringOption((opt) => opt.setName('formule').setDescription('Votre formule de calcul (ex: (25 + 5) * 8)').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('duel')
      .setDescription('Lancer ou gérer un duel de réflexion avec un autre membre')
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Action')
          .addChoices(
            { name: 'Inviter un membre', value: 'inviter' },
            { name: 'Annuler mon invitation', value: 'annuler' }
          )
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName('jeu')
          .setDescription('Jeu du duel')
          .addChoices(
            { name: 'Échecs', value: 'echecs' },
            { name: 'Morpion', value: 'morpion' },
            { name: 'Puissance 4', value: 'puissance4' }
          )
          .setRequired(true)
      )
      .addUserOption((opt) => opt.setName('adversaire').setDescription('Membre à défier').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('partie')
      .setDescription('Consulter, reprendre ou abandonner sa session de réflexion en cours')
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Action')
          .addChoices(
            { name: 'Voir la partie active', value: 'voir' },
            { name: 'Abandonner la partie', value: 'abandonner' }
          )
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('quotidien')
      .setDescription('Accéder au défi de réflexion du jour et remporter de l\'XP')
      .addStringOption((opt) => opt.setName('reponse').setDescription('Votre réponse au défi du jour').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('classement')
      .setDescription('Afficher les meilleurs stratèges et le classement Elo de réflexion')
  )
  .addSubcommand((sub) =>
    sub
      .setName('profil')
      .setDescription('Consulter ses statistiques de réflexion, ratio de victoires et séries')
      .addUserOption((opt) => opt.setName('membre').setDescription('Membre à inspecter (optionnel)').setRequired(false))
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const { user, guild, channelId } = interaction;
  if (sub === 'aide') {
    const embed = new EmbedBuilder()
      .setTitle('🧩 Guide Complet — Casse-Têtes & Jeux de Réflexion')
      .setColor(0x00e5ff)
      .setDescription(
        `Bienvenue sur la plateforme de jeux de réflexion de **Saez Animes** !\n` +
        `Affrontez vos amis en duel, défiez l'IA, résolvez des énigmes et hissez-vous au sommet du classement Elo !\n\n` +
        `**♟️ 1. Échecs :** \`/cassetete echecs\`\n` +
        `• 1v1 ou contre IA Minimax. Coups en coordonnées (ex: \`e2e4\`, \`Nf3\`, \`O-O\`).\n\n` +
        `**🔢 2. Sudoku :** \`/cassetete sudoku\`\n` +
        `• Grilles 9x9 générées avec solution unique. Remplissez avec \`coord:B5 valeur:7\`.\n\n` +
        `**🔤 3. Mots & Lettres :** \`/cassetete mots\`\n` +
        `• Anagrammes, Mot Mystère (Wordle) avec retours 🟩/🟨/⬛, et Pendu.\n\n` +
        `**💡 4. Énigmes Logiques :** \`/cassetete logique\`\n` +
        `• Mystères et raisonnements déductifs avec vérification intelligente.\n\n` +
        `**🔴 5. Puissance 4 & Morpion :** \`/cassetete puissance4\` / \`/cassetete morpion\`\n` +
        `• Jouables directement avec des boutons interactifs Discord !\n\n` +
        `**🕹️ 6. 2048, Hanoï, Démineur & Mastermind :**\n` +
        `• Mini-jeux cultes intégrés avec sauvegardes d'état en temps réel.\n\n` +
        `**🌟 7. Défi Quotidien & Elo :** \`/cassetete quotidien\` / \`/cassetete classement\`\n` +
        `• Même puzzle chaque jour pour tous les membres avec bonus d'XP et séries consécutives !`
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes Brain Games • Utilisez /cassetete liste pour voir tous les modes' });
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'liste') {
    const embed = new EmbedBuilder()
      .setTitle('📚 Liste des Jeux de Réflexion Disponibles')
      .setColor(0x38bdf8)
      .setDescription(
        `Découvrez tous les casse-têtes disponibles sur le serveur :\n\n` +
        `• ♟️ **Échecs** — Solo vs IA, Duel 1v1, Puzzles tactiques\n` +
        `• 🔢 **Sudoku** — 4 difficultés (Facile, Moyen, Difficile, Expert), Indices\n` +
        `• 🔤 **Anagrammes** — Remettre les lettres dans le bon ordre\n` +
        `• 🟩 **Mot Mystère (Wordle/Motus)** — Déduire le mot en 6 essais\n` +
        `• 🪢 **Pendu** — Trouver le mot lettre par lettre\n` +
        `• 💡 **Énigmes Logiques** — Épreuves de pensée latérale\n` +
        `• 🎯 **Mastermind** — Déchiffrer la combinaison secrète de couleurs\n` +
        `• 💣 **Démineur** — Révéler les cases sans faire sauter les mines\n` +
        `• 🔴 **Puissance 4** — Aligner 4 jetons avec boutons interactifs\n` +
        `• ❌ **Morpion** — Grille 3x3 à boutons, Solo IA ou 1v1\n` +
        `• 🕹️ **2048** — Fusionner les tuiles pour atteindre 2048\n` +
        `• 🗼 **Tour de Hanoï** — Transférer les disques selon les règles\n` +
        `• 🧮 **Le Compte est Bon** — Atteindre le nombre cible avec 6 plaques\n` +
        `• 📅 **Défi Quotidien** — Casse-tête du jour avec récompense d'XP`
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Lancez un jeu avec /cassetete <nom_du_jeu>' });
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'echecs') {
    const action = interaction.options.getString('action');
    const opp = interaction.options.getUser('adversaire');
    const moveText = interaction.options.getString('coup_texte');
    if (opp || action === 'jouer' && opp) {
      if (opp.id === user.id) {
        return interaction.reply({ content: '❌ Vous ne pouvez pas vous défier vous-même !', ephemeral: true });
      }
      const invRes = await Service.createDuelInvitation({
        guildId: guild.id,
        channelId,
        hostUser: user,
        targetUser: opp,
        gameType: 'echecs',
      });
      if (!invRes.success) {
        return interaction.reply({ content: `❌ ${invRes.reason}`, ephemeral: true });
      }
      const embed = new EmbedBuilder()
        .setTitle('♟️ Défi d\'Échecs Lancé !')
        .setDescription(`⚔️ **<@${user.id}>** défie **<@${opp.id}>** pour une partie d'échecs officielle !\n\n*Cliquez sur le bouton ci-dessous pour accepter le match.*`)
        .setColor(0x00e5ff)
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      const components = Service.buildDuelInvitationComponents(invRes.duel.id);
      return interaction.reply({ embeds: [embed], components });
    }
    if (action === 'tactique' || (!action && !opp && !moveText)) {
      const activeSession = await Service.getUserActiveSession(user.id, channelId);
      if (activeSession && activeSession.gameType === 'echecs') {
        const embed = Service.buildChessEmbed(activeSession);
        return interaction.reply({ embeds: [embed] });
      }
      const puzzle = Chess.TACTICAL_PUZZLES[0];
      const parsed = Chess.parseFen(puzzle.fen);
      const ascii = Chess.renderChessAscii(parsed.board, parsed.turn);
      const embed = new EmbedBuilder()
        .setTitle(`♟️ ${puzzle.title}`)
        .setDescription(
          `**Position actuelle :**\n\`\`\`\n${ascii}\n\`\`\`\n` +
          `💡 **Indice :** ||${puzzle.hint}||\n` +
          `🔍 **Solution :** ||${puzzle.solutionSan} (${puzzle.explanation})||`
        )
        .setColor(0xfbbf24)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Chess Tactics Master • Saez Animes' });
      return interaction.reply({ embeds: [embed] });
    }
    if (action === 'ia') {
      const existing = await Service.getUserActiveSession(user.id, channelId);
      if (existing) {
        return interaction.reply({
          content: '⚠️ Vous avez déjà une partie en cours dans ce salon ! Terminez-la ou utilisez `/cassetete partie action:abandonner`.',
          ephemeral: true,
        });
      }
      const gameState = Chess.createChessState();
      const session = await Service.createSession({
        gameType: 'echecs',
        guildId: guild.id,
        channelId,
        hostUserId: user.id,
        isVsAI: true,
        gameState,
      });
      const embed = Service.buildChessEmbed(session);
      return interaction.reply({
        content: '🤖 **Partie contre l\'IA lancée !** Vous avez les Blancs (⚪). Jouez votre premier coup !',
        embeds: [embed],
      });
    }
    if (action === 'coup' || moveText) {
      const session = await Service.getUserActiveSession(user.id, channelId);
      if (!session || session.gameType !== 'echecs') {
        return interaction.reply({ content: '❌ Aucune partie d\'échecs active trouvée dans ce salon. Lancez-en une avec `/cassetete echecs action:ia` !', ephemeral: true });
      }
      const state = session.gameState;
      const isWhiteTurn = state.turn === 'w';
      if (isWhiteTurn && user.id !== session.hostUserId) {
        return interaction.reply({ content: '⏳ Ce n\'est pas votre tour ! Les Blancs doivent jouer.', ephemeral: true });
      }
      if (!isWhiteTurn && !session.isVsAI && user.id !== session.opponentUserId) {
        return interaction.reply({ content: '⏳ Ce n\'est pas votre tour ! Les Noirs doivent jouer.', ephemeral: true });
      }
      const moveRes = Chess.makeMove(state, moveText);
      if (!moveRes.success) {
        return interaction.reply({ content: `❌ ${moveRes.reason}`, ephemeral: true });
      }
      let extraMsg = '';
      if (!state.isGameOver && session.isVsAI && state.turn === 'b') {
        const aiMove = Chess.getBestMoveAI(state, 2);
        if (aiMove) {
          const aiRes = Chess.makeMove(state, aiMove);
          extraMsg = `\n🤖 L'IA a riposté avec le coup **${aiMove}** !`;
        }
      }
      if (state.isGameOver) {
        session.status = 'finished';
        if (state.winner === 'w') {
          await Service.recordGameResult(session.hostUserId, 'echecs', 'win', 25, guild, user);
          if (session.opponentUserId) await Service.recordGameResult(session.opponentUserId, 'echecs', 'loss', 25);
        } else if (state.winner === 'b') {
          if (session.opponentUserId) await Service.recordGameResult(session.opponentUserId, 'echecs', 'win', 25);
          await Service.recordGameResult(session.hostUserId, 'echecs', 'loss', 25);
        } else {
          await Service.recordGameResult(session.hostUserId, 'echecs', 'draw', 10);
          if (session.opponentUserId) await Service.recordGameResult(session.opponentUserId, 'echecs', 'draw', 10);
        }
      }
      await Service.saveSession(session);
      const embed = Service.buildChessEmbed(session);
      return interaction.reply({ content: `♟️ Coup **${moveText}** validé !${extraMsg}`, embeds: [embed] });
    }
    if (action === 'position') {
      const session = await Service.getUserActiveSession(user.id, channelId);
      if (!session || session.gameType !== 'echecs') {
        return interaction.reply({ content: '❌ Aucune partie d\'échecs active.', ephemeral: true });
      }
      const embed = Service.buildChessEmbed(session);
      return interaction.reply({ embeds: [embed] });
    }
    if (action === 'abandonner') {
      const session = await Service.getUserActiveSession(user.id, channelId);
      if (!session || session.gameType !== 'echecs') {
        return interaction.reply({ content: '❌ Aucune partie active à abandonner.', ephemeral: true });
      }
      await Service.closeSession(session.id, 'abandoned');
      await Service.recordGameResult(user.id, 'echecs', 'loss', 15);
      return interaction.reply({ content: `🏳️ <@${user.id}> a abandonné sa partie d'échecs.` });
    }
    if (action === 'nulle') {
      return interaction.reply({ content: '🤝 Vous proposez la partie nulle à votre adversaire.' });
    }
  }
  if (sub === 'sudoku') {
    const action = interaction.options.getString('action');
    const diff = interaction.options.getString('difficulte') || 'facile';
    const coordStr = interaction.options.getString('coord');
    const val = interaction.options.getInteger('valeur');
    if (!action || action === 'nouveau') {
      const gameState = Sudoku.generateSudoku(diff);
      const session = await Service.createSession({
        gameType: 'sudoku',
        guildId: guild.id,
        channelId,
        hostUserId: user.id,
        difficulty: diff,
        gameState,
      });
      const embed = Service.buildSudokuEmbed(session);
      return interaction.reply({ embeds: [embed] });
    }
    const session = await Service.getUserActiveSession(user.id, channelId);
    if (!session || session.gameType !== 'sudoku') {
      return interaction.reply({
        content: '❌ Aucune grille de Sudoku active trouvée. Lancez-en une avec `/cassetete sudoku action:nouveau` !',
        ephemeral: true,
      });
    }
    if (action === 'remplir') {
      if (!coordStr || !val) {
        return interaction.reply({ content: '❌ Vous devez spécifier une case (ex: `coord:B5`) et un chiffre (ex: `valeur:7`).', ephemeral: true });
      }
      const parsed = Sudoku.parseSudokuCoord(coordStr);
      if (!parsed) {
        return interaction.reply({ content: '❌ Coordonnée invalide. Utilisez le format colonne-ligne (ex: `B5`, `A1`, `I9`).', ephemeral: true });
      }
      const fillRes = Sudoku.fillSudokuCell(session.gameState, parsed.row, parsed.col, val);
      if (!fillRes.success) {
        return interaction.reply({ content: `❌ ${fillRes.reason}`, ephemeral: true });
      }
      let extra = '';
      if (fillRes.isComplete) {
        session.status = 'finished';
        await Service.recordGameResult(user.id, 'sudoku', 'win', 30, guild, user);
        extra = '\n🎉 **Bravo ! Vous avez entièrement résolu la grille avec succès !**';
      }
      await Service.saveSession(session);
      const embed = Service.buildSudokuEmbed(session);
      return interaction.reply({ content: `✏️ Case **${parsed.coord}** remplie avec **${val}** !${extra}`, embeds: [embed] });
    }
    if (action === 'effacer') {
      if (!coordStr) {
        return interaction.reply({ content: '❌ Spécifiez la case à effacer (ex: `coord:B5`).', ephemeral: true });
      }
      const parsed = Sudoku.parseSudokuCoord(coordStr);
      if (!parsed) {
        return interaction.reply({ content: '❌ Coordonnée invalide.', ephemeral: true });
      }
      const clearRes = Sudoku.clearSudokuCell(session.gameState, parsed.row, parsed.col);
      if (!clearRes.success) {
        return interaction.reply({ content: `❌ ${clearRes.reason}`, ephemeral: true });
      }
      await Service.saveSession(session);
      const embed = Service.buildSudokuEmbed(session);
      return interaction.reply({ content: `🗑️ Chiffre de la case **${parsed.coord}** effacé !`, embeds: [embed] });
    }
    if (action === 'verifier') {
      const errors = Sudoku.checkSudokuErrors(session.gameState);
      await Service.saveSession(session);
      if (errors.length === 0) {
        return interaction.reply({ content: '✅ **Aucune erreur détectée !** Toutes vos cases remplies sont correctes pour l\'instant.' });
      }
      const errList = errors.map((e) => `• Case **${e.coord}** (${e.value})`).join('\n');
      return interaction.reply({ content: `⚠️ **${errors.length} erreur(s) trouvée(s) :**\n${errList}` });
    }
    if (action === 'indice') {
      const hint = Sudoku.getSudokuHint(session.gameState);
      if (hint.isComplete) {
        session.status = 'finished';
        await Service.recordGameResult(user.id, 'sudoku', 'win', 15, guild, user);
      }
      await Service.saveSession(session);
      const embed = Service.buildSudokuEmbed(session);
      return interaction.reply({ content: hint.message, embeds: [embed] });
    }
    if (action === 'solution') {
      session.status = 'finished';
      await Service.saveSession(session);
      const solAscii = Sudoku.renderSudokuAscii(session.gameState.solution);
      return interaction.reply({
        content: `🔍 **Solution complète de la grille :**\n\`\`\`\n${solAscii}\n\`\`\``,
        ephemeral: true,
      });
    }
    if (action === 'abandonner') {
      await Service.closeSession(session.id, 'abandoned');
      return interaction.reply({ content: '🏳️ Grille de Sudoku abandonnée.' });
    }
  }
  if (sub === 'mots') {
    const mode = interaction.options.getString('mode') || 'anagramme';
    const rep = interaction.options.getString('reponse');
    if (mode === 'anagramme') {
      if (rep) {
        const normalizedGuess = Puzzles.normalizeText(rep);
        const match = Puzzles.ANAGRAMS_DATA.find((a) => Puzzles.normalizeText(a.word) === normalizedGuess);
        if (match) {
          await Service.recordGameResult(user.id, 'mots', 'win', 15, guild, user);
          return interaction.reply({ content: `🎉 **Excellent !** Le mot était bien **${match.word}** ! (+15 points)` });
        } else {
          return interaction.reply({ content: `❌ Raté ! Ce n'est pas la bonne solution. Réessayez !`, ephemeral: true });
        }
      }
      const item = Puzzles.ANAGRAMS_DATA[Math.floor(Math.random() * Puzzles.ANAGRAMS_DATA.length)];
      const embed = new EmbedBuilder()
        .setTitle('🔤 Jeu d\'Anagramme')
        .setDescription(`Remettez les lettres suivantes dans le bon ordre :\n\n# \`${item.scrambled}\`\n\n💡 Indice : *${item.hint}*\nRéponse en spoiler : ||**${item.word}**||`)
        .setColor(0xec4899)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Répondez avec /cassetete mots mode:anagramme reponse:<votre_mot>' });
      return interaction.reply({ embeds: [embed] });
    }
    if (mode === 'motus') {
      const target = Puzzles.MOTUS_WORDS[Math.floor(Math.random() * Puzzles.MOTUS_WORDS.length)];
      if (rep) {
        const evalRes = Puzzles.evaluateWordleGuess(target.word, rep);
        if (!evalRes.valid) {
          return interaction.reply({ content: `❌ ${evalRes.reason}`, ephemeral: true });
        }
        if (evalRes.isWon) {
          await Service.recordGameResult(user.id, 'mots', 'win', 20, guild, user);
          return interaction.reply({ content: `🎉 **VICTOIRE !** Vous avez trouvé le Mot Mystère : **${target.word}** !\n${evalRes.feedback}` });
        }
        return interaction.reply({ content: `Tentative : **${evalRes.guess}**\nRésultat : ${evalRes.feedback}\n(🟩 Bien placé, 🟨 Mal placé, ⬛ Absent)` });
      }
      const embed = new EmbedBuilder()
        .setTitle('🟩 Mot Mystère (Wordle / Motus)')
        .setDescription(`Devinez le mot secret de **${target.word.length} lettres** !\n\n💡 Indice thématique : *${target.hint}*`)
        .setColor(0x10b981)
        .setFooter({ text: `Codé avec ❤️ par Saez | Proposez un mot avec /cassetete mots mode:motus reponse:<mot>` });
      return interaction.reply({ embeds: [embed] });
    }
    if (mode === 'pendu') {
      const embed = new EmbedBuilder()
        .setTitle('🪢 Jeu du Pendu')
        .setDescription('Mot à deviner : `_ _ _ _ _ _` (6 lettres)\n\nProposez une lettre ou le mot complet avec `/cassetete mots mode:pendu reponse:<lettre>` !')
        .setColor(0xf59e0b)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return interaction.reply({ embeds: [embed] });
    }
  }
  if (sub === 'logique') {
    const action = interaction.options.getString('action');
    const rep = interaction.options.getString('reponse');
    if (action === 'repondre' || rep) {
      const cleanGuess = Puzzles.normalizeText(rep);
      let matched = false;
      for (const r of Puzzles.LOGIC_RIDDLES) {
        if (r.acceptable.some((acc) => Puzzles.normalizeText(acc) === cleanGuess)) {
          matched = true;
          break;
        }
      }
      if (matched) {
        await Service.recordGameResult(user.id, 'logique', 'win', 20, guild, user);
        return interaction.reply({ content: `🎉 **Excellente déduction !** Votre réponse **"${rep}"** est exacte ! (+20 points)` });
      } else {
        return interaction.reply({ content: `❌ Votre réponse **"${rep}"** n'est pas correcte. Cherchez encore !`, ephemeral: true });
      }
    }
    const item = Puzzles.LOGIC_RIDDLES[Math.floor(Math.random() * Puzzles.LOGIC_RIDDLES.length)];
    const embed = new EmbedBuilder()
      .setTitle('💡 Énigme & Casse-Tête Logique')
      .setDescription(
        `**"${item.question}"**\n\n` +
        `*Indice :* ||${item.hint}||\n` +
        `*Solution :* ||**${item.answer}** (${item.explanation})||`
      )
      .setColor(0xfbbf24)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Répondez avec /cassetete logique action:repondre reponse:<texte>' });
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'mastermind') {
    const action = interaction.options.getString('action') || 'nouveau';
    const prop = interaction.options.getString('proposition');
    if (action === 'nouveau') {
      const game = Puzzles.createMastermindGame(4, 10);
      const session = await Service.createSession({
        gameType: 'mastermind',
        guildId: guild.id,
        channelId,
        hostUserId: user.id,
        gameState: game,
      });
      const embed = new EmbedBuilder()
        .setTitle('🎯 Mastermind — Décodez la combinaison')
        .setDescription(
          `J'ai choisi une combinaison secrète de **4 couleurs** parmi :\n` +
          `🔴 Rouge, 🔵 Bleu, 🟢 Vert, 🟡 Jaune, 🟣 Violet, 🟠 Orange.\n\n` +
          `Vous avez **10 essais** pour la retrouver !\n` +
          `Proposez une combinaison avec \`/cassetete mastermind action:deviner proposition:rouge bleu vert jaune\` ou \`1 2 3 4\`.`
        )
        .setColor(0x8b5cf6)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return interaction.reply({ embeds: [embed] });
    }
    const session = await Service.getUserActiveSession(user.id, channelId);
    if (!session || session.gameType !== 'mastermind') {
      return interaction.reply({ content: '❌ Aucune partie de Mastermind active. Lancez-en une avec `/cassetete mastermind action:nouveau` !', ephemeral: true });
    }
    if (action === 'deviner') {
      if (!prop) {
        return interaction.reply({ content: '❌ Spécifiez votre proposition de 4 couleurs (ex: `rouge bleu vert jaune` ou `1 2 3 4`).', ephemeral: true });
      }
      const tokens = prop.trim().toLowerCase().split(/\s+/);
      const guessColors = [];
      for (const t of tokens) {
        if (Puzzles.MASTERMIND_COLOR_NAMES[t]) {
          guessColors.push(Puzzles.MASTERMIND_COLOR_NAMES[t]);
        }
      }
      const evalRes = Puzzles.evaluateMastermindGuess(session.gameState.secret, guessColors);
      if (!evalRes.valid) {
        return interaction.reply({ content: `❌ ${evalRes.reason}`, ephemeral: true });
      }
      session.gameState.attempts.push({
        guess: guessColors,
        exact: evalRes.exact,
        misplaced: evalRes.misplaced,
      });
      let historyText = '';
      session.gameState.attempts.forEach((att, idx) => {
        historyText += `\`#${idx + 1}\` ${att.guess.join(' ')} ➔ 🎯 **${att.exact}** bien placé(s) • ⚪ **${att.misplaced}** mal placé(s)\n`;
      });
      if (evalRes.exact === session.gameState.secret.length) {
        session.status = 'finished';
        await Service.recordGameResult(user.id, 'mastermind', 'win', 25, guild, user);
        return interaction.reply({
          content: `🎉 **VICTOIRE !** Vous avez déchiffré la combinaison secrète ${session.gameState.secret.join(' ')} en **${session.gameState.attempts.length} coups** !\n\n${historyText}`,
        });
      }
      if (session.gameState.attempts.length >= session.gameState.maxAttempts) {
        session.status = 'finished';
        await Service.saveSession(session);
        return interaction.reply({
          content: `💀 **Perdu !** Vous avez épuisé vos 10 tentatives. La combinaison secrète était : ${session.gameState.secret.join(' ')}.\n\n${historyText}`,
        });
      }
      await Service.saveSession(session);
      return interaction.reply({
        content: `🎯 **Tentative enregistrée (${session.gameState.attempts.length}/10) :**\n\n${historyText}`,
      });
    }
    if (action === 'abandonner') {
      await Service.closeSession(session.id, 'abandoned');
      return interaction.reply({ content: `🏳️ Partie de Mastermind abandonnée. La combinaison était : ${session.gameState.secret.join(' ')}.` });
    }
  }
  if (sub === 'demineur') {
    const action = interaction.options.getString('action') || 'nouvelle';
    const coord = interaction.options.getString('coord');
    const diff = interaction.options.getString('difficulte') || 'facile';
    if (action === 'nouvelle') {
      const rows = diff === 'moyen' ? 8 : 6;
      const cols = diff === 'moyen' ? 8 : 6;
      const mines = diff === 'moyen' ? 10 : 5;
      const game = Puzzles.createDemineurGame(rows, cols, mines);
      const session = await Service.createSession({
        gameType: 'demineur',
        guildId: guild.id,
        channelId,
        hostUserId: user.id,
        difficulty: diff,
        gameState: game,
      });
      const embed = new EmbedBuilder()
        .setTitle(`💣 Démineur [${rows}x${cols} • ${mines} mines]`)
        .setDescription(
          `Une nouvelle grille est prête ! Révélez une première case en toute sécurité :\n` +
          `\`/cassetete demineur action:reveler coord:A1\``
        )
        .setColor(0x00e5ff)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return interaction.reply({ embeds: [embed] });
    }
    const session = await Service.getUserActiveSession(user.id, channelId);
    if (!session || session.gameType !== 'demineur') {
      return interaction.reply({ content: '❌ Aucune grille de démineur active trouvée.', ephemeral: true });
    }
    if (action === 'reveler') {
      if (!coord) return interaction.reply({ content: '❌ Indiquez une case (ex: `coord:B3`).', ephemeral: true });
      const col = coord[0].toUpperCase().charCodeAt(0) - 65;
      const row = parseInt(coord.slice(1), 10) - 1;
      const res = Puzzles.revealDemineurCell(session.gameState, row, col);
      if (!res.success) return interaction.reply({ content: `❌ ${res.reason}`, ephemeral: true });
      if (res.isLost) {
        session.status = 'finished';
        await Service.saveSession(session);
        return interaction.reply({ content: `💥 **BOOM !** Vous avez heurté une mine en **${coord.toUpperCase()}** ! Partie terminée.` });
      }
      if (res.isWon) {
        session.status = 'finished';
        await Service.recordGameResult(user.id, 'demineur', 'win', 25, guild, user);
        return interaction.reply({ content: `🎉 **FÉLICITATIONS !** Toutes les cases sûres ont été dégagées sans encombre ! (+25 points)` });
      }
      await Service.saveSession(session);
      return interaction.reply({ content: `⛏️ Case **${coord.toUpperCase()}** révélée avec succès !` });
    }
  }
  if (sub === 'puissance4') {
    const action = interaction.options.getString('action') || 'ia';
    const opp = interaction.options.getUser('adversaire');
    if (opp || action === 'duel') {
      if (!opp) return interaction.reply({ content: '❌ Veuillez mentionner un adversaire à défier !', ephemeral: true });
      const duelRes = await Service.createDuelInvitation({
        guildId: guild.id,
        channelId,
        hostUser: user,
        targetUser: opp,
        gameType: 'puissance4',
      });
      if (!duelRes.success) return interaction.reply({ content: `❌ ${duelRes.reason}`, ephemeral: true });
      const embed = new EmbedBuilder()
        .setTitle('🔴 Défi Puissance 4 🟡')
        .setDescription(`⚔️ **<@${user.id}>** défie **<@${opp.id}>** à une partie de Puissance 4 !`)
        .setColor(0xef4444)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      const components = Service.buildDuelInvitationComponents(duelRes.duel.id);
      return interaction.reply({ embeds: [embed], components });
    }
    const gameState = Puzzles.createPuissance4Game();
    const session = await Service.createSession({
      gameType: 'puissance4',
      guildId: guild.id,
      channelId,
      hostUserId: user.id,
      isVsAI: true,
      gameState,
    });
    const embed = Service.buildPuissance4Embed(session);
    const components = Service.buildPuissance4Components(session);
    return interaction.reply({ embeds: [embed], components });
  }
  if (sub === 'morpion') {
    const opp = interaction.options.getUser('adversaire');
    if (opp) {
      const duelRes = await Service.createDuelInvitation({
        guildId: guild.id,
        channelId,
        hostUser: user,
        targetUser: opp,
        gameType: 'morpion',
      });
      if (!duelRes.success) return interaction.reply({ content: `❌ ${duelRes.reason}`, ephemeral: true });
      const embed = new EmbedBuilder()
        .setTitle('❌ Défi Morpion (Tic-Tac-Toe) ⭕')
        .setDescription(`⚔️ **<@${user.id}>** défie **<@${opp.id}>** au Morpion !`)
        .setColor(0x00e5ff)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      const components = Service.buildDuelInvitationComponents(duelRes.duel.id);
      return interaction.reply({ embeds: [embed], components });
    }
    const gameState = Puzzles.createMorpionGame();
    const session = await Service.createSession({
      gameType: 'morpion',
      guildId: guild.id,
      channelId,
      hostUserId: user.id,
      isVsAI: true,
      gameState,
    });
    const embed = Service.buildMorpionEmbed(session);
    const components = Service.buildMorpionComponents(session);
    return interaction.reply({ embeds: [embed], components });
  }
  if (sub === '2048') {
    const action = interaction.options.getString('action') || 'nouvelle';
    if (action === 'nouvelle') {
      const gameState = Puzzles.create2048Game();
      const session = await Service.createSession({
        gameType: '2048',
        guildId: guild.id,
        channelId,
        hostUserId: user.id,
        gameState,
      });
      const embed = Service.build2048Embed(session);
      const components = Service.build2048Components(session);
      return interaction.reply({ embeds: [embed], components });
    }
  }
  if (sub === 'hanoi') {
    const action = interaction.options.getString('action') || 'nouvelle';
    const src = interaction.options.getString('source');
    const dst = interaction.options.getString('destination');
    const count = interaction.options.getInteger('disques') || 3;
    if (action === 'nouvelle') {
      const game = Puzzles.createHanoiGame(count);
      const session = await Service.createSession({
        gameType: 'hanoi',
        guildId: guild.id,
        channelId,
        hostUserId: user.id,
        gameState: game,
      });
      const ascii = Puzzles.renderHanoiAscii(game);
      const embed = new EmbedBuilder()
        .setTitle(`🗼 Tour de Hanoï [${count} disques]`)
        .setDescription(
          `Déplacez tous les disques du piquet A vers le piquet C sans jamais poser un disque sur un plus petit !\n\n` +
          `\`\`\`\n${ascii}\n\`\`\`\n` +
          `Objectif optimal : **${game.optimalMoves} coups**.\n` +
          `Déplacez un disque avec \`/cassetete hanoi action:deplacer source:A destination:C\``
        )
        .setColor(0xf59e0b)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return interaction.reply({ embeds: [embed] });
    }
    const session = await Service.getUserActiveSession(user.id, channelId);
    if (!session || session.gameType !== 'hanoi') {
      return interaction.reply({ content: '❌ Aucune partie de Tour de Hanoï en cours.', ephemeral: true });
    }
    if (action === 'deplacer') {
      if (!src || !dst) return interaction.reply({ content: '❌ Spécifiez la source (A/B/C) et la destination (A/B/C).', ephemeral: true });
      const moveRes = Puzzles.moveHanoiDisc(session.gameState, src, dst);
      if (!moveRes.success) return interaction.reply({ content: `❌ ${moveRes.reason}`, ephemeral: true });
      const ascii = Puzzles.renderHanoiAscii(session.gameState);
      if (moveRes.isWon) {
        session.status = 'finished';
        await Service.recordGameResult(user.id, 'hanoi', 'win', 30, guild, user);
        return interaction.reply({
          content: `🎉 **VICTOIRE !** Vous avez résolu la Tour de Hanoï en **${session.gameState.moves} coups** !\n\`\`\`\n${ascii}\n\`\`\``,
        });
      }
      await Service.saveSession(session);
      return interaction.reply({
        content: `Disque déplacé de **${src.toUpperCase()}** vers **${dst.toUpperCase()}** (Coups : ${session.gameState.moves}) :\n\`\`\`\n${ascii}\n\`\`\``,
      });
    }
  }
  if (sub === 'calcul') {
    const mode = interaction.options.getString('mode') || 'compte';
    const form = interaction.options.getString('formule');
    if (mode === 'compte') {
      if (form) {
        const session = await Service.getUserActiveSession(user.id, channelId);
        if (!session || session.gameType !== 'compte') {
          return interaction.reply({ content: '❌ Aucun tirage du Compte est Bon actif. Tirez-en un avec `/cassetete calcul mode:compte` !', ephemeral: true });
        }
        const evalRes = Puzzles.evaluateCompteSolution(session.gameState.plaques, form);
        if (!evalRes.valid) {
          return interaction.reply({ content: `❌ ${evalRes.reason}`, ephemeral: true });
        }
        const diff = Math.abs(evalRes.result - session.gameState.target);
        if (diff === 0) {
          session.status = 'finished';
          await Service.recordGameResult(user.id, 'compte', 'win', 30, guild, user);
          return interaction.reply({ content: `🎉 **LE COMPTE EST BON !** Votre calcul **${form} = ${evalRes.result}** atteint exactement la cible ! (+30 points)` });
        } else {
          return interaction.reply({ content: `📊 Votre calcul donne **${evalRes.result}** (écart de ${diff} par rapport à la cible ${session.gameState.target}). Cherchez encore !` });
        }
      }
      const draw = Puzzles.generateCompteEstBon();
      const session = await Service.createSession({
        gameType: 'compte',
        guildId: guild.id,
        channelId,
        hostUserId: user.id,
        gameState: draw,
      });
      const embed = new EmbedBuilder()
        .setTitle('🧮 Le Compte est Bon !')
        .setDescription(
          `🎯 **Nombre cible à atteindre :** # \`${draw.target}\`\n\n` +
          `🔢 **Plaques tirées :** ${draw.plaques.map((p) => `\`[ ${p} ]\``).join(' ')}\n\n` +
          `*Proposez votre solution avec :*\n\`/cassetete calcul mode:compte formule:(25 + 5) * 8\``
        )
        .setColor(0x00e5ff)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return interaction.reply({ embeds: [embed] });
    }
  }
  if (sub === 'duel') {
    const action = interaction.options.getString('action');
    const game = interaction.options.getString('jeu');
    const opp = interaction.options.getUser('adversaire');
    if (action === 'inviter') {
      const invRes = await Service.createDuelInvitation({
        guildId: guild.id,
        channelId,
        hostUser: user,
        targetUser: opp,
        gameType: game,
      });
      if (!invRes.success) return interaction.reply({ content: `❌ ${invRes.reason}`, ephemeral: true });
      const embed = new EmbedBuilder()
        .setTitle(`⚔️ Invitation de Duel — ${game.toUpperCase()}`)
        .setDescription(`**<@${user.id}>** défie **<@${opp.id}>** pour une partie de **${game}** !`)
        .setColor(0x10b981)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      const components = Service.buildDuelInvitationComponents(invRes.duel.id);
      return interaction.reply({ embeds: [embed], components });
    }
  }
  if (sub === 'partie') {
    const action = interaction.options.getString('action');
    const session = await Service.getUserActiveSession(user.id, channelId);
    if (!session) {
      return interaction.reply({ content: 'ℹ️ Vous n\'avez aucune session de réflexion active dans ce salon.', ephemeral: true });
    }
    if (action === 'abandonner') {
      await Service.closeSession(session.id, 'abandoned');
      return interaction.reply({ content: `🏳️ Partie de **${session.gameType}** abandonnée.` });
    }
    if (action === 'voir') {
      if (session.gameType === 'echecs') return interaction.reply({ embeds: [Service.buildChessEmbed(session)] });
      if (session.gameType === 'sudoku') return interaction.reply({ embeds: [Service.buildSudokuEmbed(session)] });
      if (session.gameType === 'puissance4') return interaction.reply({ embeds: [Service.buildPuissance4Embed(session)], components: Service.buildPuissance4Components(session) });
      if (session.gameType === 'morpion') return interaction.reply({ embeds: [Service.buildMorpionEmbed(session)], components: Service.buildMorpionComponents(session) });
      if (session.gameType === '2048') return interaction.reply({ embeds: [Service.build2048Embed(session)], components: Service.build2048Components(session) });
      return interaction.reply({ content: `ℹ️ Partie de **${session.gameType}** en cours (Créée le ${new Date(session.createdAt).toLocaleTimeString()}).` });
    }
  }
  if (sub === 'quotidien') {
    const rep = interaction.options.getString('reponse');
    const today = Service.getTodayDateString();
    const alreadyDone = await Service.hasCompletedDaily(user.id, today);
    if (alreadyDone) {
      return interaction.reply({ content: `✅ Vous avez déjà complété le Défi Quotidien d'aujourd'hui (**${today}**) ! Revenez demain pour prolonger votre série !`, ephemeral: true });
    }
    const daily = await Service.getDailyPuzzle(today);
    if (rep) {
      await Service.markDailyCompleted(user.id, today, guild, user);
      return interaction.reply({ content: `🎉 **FÉLICITATIONS !** Défi Quotidien réussi avec succès ! Vous gagnez **+50 XP** et **+25 Elo** !` });
    }
    const embed = new EmbedBuilder()
      .setTitle(`📅 Défi Quotidien du ${today} [Type : ${daily.type.toUpperCase()}]`)
      .setDescription(
        `Chaque jour, un casse-tête unique est proposé à l'ensemble de la communauté !\n\n` +
        `Résolvez-le et validez votre réponse avec \`/cassetete quotidien reponse:<votre_reponse>\` pour empocher **50 XP** et faire grimper votre série consécutive !`
      )
      .setColor(0xfbbf24)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Daily Brain Challenge • Saez Animes' });
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'classement') {
    const list = await Service.getLeaderboard(10);
    let desc = '';
    if (list.length === 0) {
      desc = '*Aucune partie enregistrée pour le moment. Soyez le premier à jouer !*';
    } else {
      list.forEach((item, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `\`#${idx + 1}\``;
        desc += `${medal} <@${item.userId}> — **${item.elo} Elo** • 🏆 ${item.gamesWon}V / ${item.gamesLost}D • 🔥 Série : ${item.dailyStreak}j\n`;
      });
    }
    const embed = new EmbedBuilder()
      .setTitle('🏆 Top 10 — Maîtres de la Réflexion')
      .setDescription(desc)
      .setColor(0xf59e0b)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Classement calculé selon le score Elo officiel Saez Animes' });
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'profil') {
    const target = interaction.options.getUser('membre') || user;
    const stats = await Service.getUserStats(target.id);
    const winrate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
    const embed = new EmbedBuilder()
      .setTitle(`🧠 Profil Stratégique — ${target.username}`)
      .setThumbnail(target.displayAvatarURL())
      .setColor(0x00e5ff)
      .addFields(
        { name: '⭐ Score Elo', value: `\`${stats.elo} Elo\``, inline: true },
        { name: '🔥 Série Quotidienne', value: `\`${stats.dailyStreak} jour(s)\``, inline: true },
        { name: '📊 Taux de Victoire', value: `\`${winrate}%\` (${stats.gamesWon}V / ${stats.gamesLost}D)`, inline: true },
        { name: '♟️ Échecs', value: `${stats.byGame.echecs?.won || 0} victoires (${stats.byGame.echecs?.played || 0} jouées)`, inline: true },
        { name: '🔢 Sudoku', value: `${stats.byGame.sudoku?.won || 0} résolus`, inline: true },
        { name: '🔴 Puissance 4 & Morpion', value: `${(stats.byGame.puissance4?.won || 0) + (stats.byGame.morpion?.won || 0)} victoires`, inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Statistiques persistées de la catégorie Casse-Tête' });
    return interaction.reply({ embeds: [embed] });
  }
}
