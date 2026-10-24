/**
 * Module Counting Complet pour Saez Discord Bot
 * Commandes Slash : /counting (et /comptage en compatibilité directe)
 * Comptage communautaire, logique mathématique (25 énigmes), mini-jeux numériques,
 * scores, classements, profils, duels 1v1, configuration et reset sécurisé avec audit.
 */

import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} from 'discord.js';
import {
  getCountingConfig,
  saveCountingConfig,
  LogicEngine,
  MiniGamesEngine,
  StatsEngine,
  DuelEngine,
  AdminEngine,
  CountingEngine,
} from '../../services/countingService.js';
import { config } from '../../config.js';
const activeLogicSessions = new Map(); 
const activeMiniGames = new Map(); 
export const data = new SlashCommandBuilder()
  .setName('counting')
  .setDescription('Système complet de comptage communautaire, logique mathématique et mini-jeux')
  .addSubcommand((sub) =>
    sub
      .setName('actuel')
      .setDescription('Consulter rapidement le nombre en cours et le record du serveur')
  )
  .addSubcommand((sub) =>
    sub
      .setName('aide')
      .setDescription('Guide complet de tous les modes, règles et énigmes du module Counting')
  )
  .addSubcommandGroup((grp) =>
    grp
      .setName('partie')
      .setDescription('Gestion et consultation du comptage communautaire')
      .addSubcommand((sub) =>
        sub.setName('status').setDescription('Afficher l\'état complet de la partie de comptage')
      )
      .addSubcommand((sub) =>
        sub.setName('current').setDescription('Afficher le nombre actuel attendu')
      )
      .addSubcommand((sub) =>
        sub.setName('next').setDescription('Indiquer le prochain nombre ou mot attendu')
      )
      .addSubcommand((sub) =>
        sub.setName('rules').setDescription('Afficher les règles actives sur le serveur')
      )
      .addSubcommand((sub) =>
        sub.setName('start').setDescription('[Admin] Démarrer ou réactiver la partie')
      )
      .addSubcommand((sub) =>
        sub.setName('stop').setDescription('[Admin] Mettre en pause le comptage temporairement')
      )
      .addSubcommand((sub) =>
        sub.setName('resume').setDescription('[Admin] Reprendre une partie en pause')
      )
      .addSubcommand((sub) =>
        sub.setName('best').setDescription('Afficher le record historique du serveur')
      )
      .addSubcommand((sub) =>
        sub.setName('milestone').setDescription('Consulter les prochains paliers à franchir')
      )
      .addSubcommand((sub) =>
        sub.setName('validate').setDescription('Vérifier la validité des données de comptage')
      )
  )
  .addSubcommandGroup((grp) =>
    grp
      .setName('logique')
      .setDescription('Énigmes, suites et défis de logique mathématique')
      .addSubcommand((sub) =>
        sub
          .setName('start')
          .setDescription('Démarrer un défi de logique numérique')
          .addStringOption((opt) =>
            opt
              .setName('difficulte')
              .setDescription('Niveau de difficulté')
              .addChoices(
                { name: '🌱 Débutant', value: 'debutant' },
                { name: '🟢 Facile', value: 'facile' },
                { name: '🟡 Intermédiaire', value: 'intermediaire' },
                { name: '🔴 Difficile', value: 'difficile' },
                { name: '🟣 Expert', value: 'expert' }
              )
          )
      )
      .addSubcommand((sub) =>
        sub.setName('question').setDescription('Réafficher la question de votre défi actif')
      )
      .addSubcommand((sub) =>
        sub
          .setName('answer')
          .setDescription('Soumettre votre réponse au problème de logique')
          .addStringOption((opt) =>
            opt.setName('valeur').setDescription('Votre réponse (nombre ou mot)').setRequired(true)
          )
      )
      .addSubcommand((sub) =>
        sub.setName('hint').setDescription('Obtenir un indice progressif pour votre énigme')
      )
      .addSubcommand((sub) =>
        sub.setName('solution').setDescription('Afficher la solution expliquée (abandonne le défi)')
      )
      .addSubcommand((sub) =>
        sub.setName('next').setDescription('Passer à un autre problème de logique')
      )
      .addSubcommand((sub) =>
        sub.setName('stop').setDescription('Abandonner la session de logique en cours')
      )
      .addSubcommand((sub) =>
        sub.setName('daily').setDescription('Participer au Défi Quotidien (récompenses doublées)')
      )
      .addSubcommand((sub) =>
        sub.setName('practice').setDescription('Mode entraînement libre sans pénalité')
      )
  )
  .addSubcommandGroup((grp) =>
    grp
      .setName('jeu')
      .setDescription('Mini-jeux de calcul et de déduction rapide')
      .addSubcommand((sub) =>
        sub
          .setName('mystere')
          .setDescription('Lancer une partie de Nombre Mystère (Plus Grand / Plus Petit)')
          .addIntegerOption((opt) =>
            opt.setName('max').setDescription('Borne maximale (défaut : 100)').setMinValue(20).setMaxValue(1000)
          )
      )
      .addSubcommand((sub) =>
        sub.setName('calcul').setDescription('Calcul Éclair : sprint d\'opération en 30s')
      )
      .addSubcommand((sub) =>
        sub.setName('suite').setDescription('Suite Mystère : deviner le prochain terme')
      )
      .addSubcommand((sub) =>
        sub.setName('multiples').setDescription('Défi des Multiples : trouver l\'intrus')
      )
      .addSubcommand((sub) =>
        sub.setName('parite').setDescription('Pair ou Impair Express')
      )
      .addSubcommand((sub) =>
        sub.setName('code').setDescription('Crack the Code : déchiffrer la combinaison secrète')
      )
      .addSubcommand((sub) =>
        sub
          .setName('repondre')
          .setDescription('Proposer une réponse au mini-jeu actif du salon')
          .addStringOption((opt) =>
            opt.setName('reponse').setDescription('Votre réponse').setRequired(true)
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName('duel')
          .setDescription('Défier un autre membre en duel de calcul 1v1')
          .addUserOption((opt) =>
            opt.setName('adversaire').setDescription('Membre à défier').setRequired(true)
          )
          .addIntegerOption((opt) =>
            opt.setName('rounds').setDescription('Nombre de rounds (1 à 5)').setMinValue(1).setMaxValue(5)
          )
      )
  )
  .addSubcommandGroup((grp) =>
    grp
      .setName('score')
      .setDescription('Consulter les scores, profils et classements')
      .addSubcommand((sub) =>
        sub.setName('perso').setDescription('Afficher votre profil Counting et vos succès')
      )
      .addSubcommand((sub) =>
        sub
          .setName('membre')
          .setDescription('Consulter la fiche Counting d\'un autre membre')
          .addUserOption((opt) =>
            opt.setName('cible').setDescription('Membre ciblé').setRequired(true)
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName('classement')
          .setDescription('Classement des meilleurs compteurs du serveur')
          .addStringOption((opt) =>
            opt
              .setName('categorie')
              .setDescription('Type de classement')
              .addChoices(
                { name: '🏆 Points Globaux', value: 'global' },
                { name: '🔢 Nombres Validés', value: 'counts' },
                { name: '🌟 Meilleure Série (Streak)', value: 'streak' },
                { name: '🧠 Énigmes de Logique', value: 'logic' },
                { name: '🎮 Mini-Jeux Gagnés', value: 'minigames' }
              )
          )
      )
      .addSubcommand((sub) =>
        sub.setName('records').setDescription('Records individuels et historiques du serveur')
      )
      .addSubcommand((sub) =>
        sub
          .setName('comparer')
          .setDescription('Comparer vos statistiques avec celles d\'un autre membre')
          .addUserOption((opt) =>
            opt.setName('adversaire').setDescription('Membre à comparer').setRequired(true)
          )
      )
  )
  .addSubcommandGroup((grp) =>
    grp
      .setName('config')
      .setDescription('[Admin] Paramètres et options du module Counting')
      .addSubcommand((sub) =>
        sub
          .setName('salon')
          .setDescription('Définir le salon textuel dédié au jeu de comptage')
          .addChannelOption((opt) =>
            opt
              .setName('cible')
              .setDescription('Salon textuel')
              .addChannelTypes(ChannelType.GuildText)
              .setRequired(true)
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName('mode')
          .setDescription('Définir le mode de jeu de comptage')
          .addStringOption((opt) =>
            opt
              .setName('type')
              .setDescription('Mode de jeu')
              .setRequired(true)
              .addChoices(
                { name: '1️⃣ Classique (1, 2, 3...)', value: 'classique' },
                { name: '🔽 Inversé (Compte à rebours)', value: 'inverse' },
                { name: '👥 Sans Répétition consécutive', value: 'sans_repetition' },
                { name: '🏃 Marathon avec Checkpoints', value: 'marathon' },
                { name: '🎯 Objectif Cible', value: 'objectif' },
                { name: '🤫 Silencieux (aucun chat hors nombres)', value: 'silencieux' }
              )
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName('variante')
          .setDescription('Activer une variante spéciale')
          .addStringOption((opt) =>
            opt
              .setName('nom')
              .setDescription('Variante')
              .setRequired(true)
              .addChoices(
                { name: 'Aucune', value: 'none' },
                { name: 'FizzBuzz (3=fizz, 5=buzz, 15=fizzbuzz)', value: 'fizzbuzz' },
                { name: 'Chiffre 7 Interdit', value: 'banned_digit' }
              )
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName('regles')
          .setDescription('Configurer les règles de validation')
          .addBooleanOption((opt) =>
            opt.setName('strict').setDescription('Mode strict (interdire messages non-nombres)')
          )
          .addBooleanOption((opt) =>
            opt.setName('anti_repetition').setDescription('Interdire de compter 2 fois de suite')
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName('erreurs')
          .setDescription('Conséquence en cas d\'erreur de comptage')
          .addStringOption((opt) =>
            opt
              .setName('action')
              .setDescription('Action appliquée')
              .setRequired(true)
              .addChoices(
                { name: 'Réinitialisation à 0 (défaut)', value: 'reset' },
                { name: 'Retour au dernier Checkpoint (multiple de 50)', value: 'checkpoint' }
              )
          )
      )
      .addSubcommand((sub) =>
        sub.setName('diagnostic').setDescription('Vérifier les salons, permissions et intégrité')
      )
  )
  .addSubcommandGroup((grp) =>
    grp
      .setName('reset')
      .setDescription('[Admin] Réinitialisations granulaires avec audit et confirmation')
      .addSubcommand((sub) =>
        sub.setName('compteur').setDescription('Remettre le compteur à 0 (préserve le record historique)')
      )
      .addSubcommand((sub) =>
        sub.setName('record').setDescription('Réinitialiser le record historique du serveur')
      )
      .addSubcommand((sub) =>
        sub
          .setName('membre')
          .setDescription('Réinitialiser les statistiques d\'un membre')
          .addUserOption((opt) => opt.setName('cible').setDescription('Membre ciblé').setRequired(true))
      )
      .addSubcommand((sub) =>
        sub.setName('total').setDescription('Réinitialisation complète de toutes les données Counting')
      )
      .addSubcommand((sub) =>
        sub.setName('audit').setDescription('Consulter l\'historique d\'audit des réinitialisations')
      )
      .addSubcommand((sub) =>
        sub.setName('annuler').setDescription('Restaurer la dernière sauvegarde pré-reset (Undo)')
      )
  );
export async function execute(interaction) {
  const group = interaction.options.getSubcommandGroup(false);
  const sub = interaction.options.getSubcommand();
  const guild = interaction.guild;
  const user = interaction.user;
  const member = interaction.member;
  if (!group) {
    if (sub === 'actuel') {
      await interaction.deferReply();
      const cfg = await getCountingConfig(guild.id);
      const nextDisplay = CountingEngine.getExpectedDisplay(cfg);
      const embed = new EmbedBuilder()
        .setTitle('🔢 Comptage Actuel du Serveur')
        .setColor(config.colors.accent || '#38bdf8')
        .addFields(
          { name: '📍 Nombre Courant', value: `\`${cfg.current_count || 0}\``, inline: true },
          { name: '👉 Prochain Attendu', value: `\`${nextDisplay}\``, inline: true },
          { name: '🏆 Record Historique', value: `\`${cfg.high_score || 0}\``, inline: true },
          { name: '📺 Salon Officiel', value: cfg.channel_id ? `<#${cfg.channel_id}>` : '*Non configuré*', inline: true },
          { name: '⚙️ Mode Actif', value: `\`${cfg.mode || 'classique'}\``, inline: true },
          { name: '✨ Variante', value: `\`${cfg.variant || 'aucune'}\``, inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Règle : Une même personne ne peut pas compter deux fois de suite !' })
        .setTimestamp();
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'aide') {
      const helpEmbed = new EmbedBuilder()
        .setTitle('📚 Guide Complet du Module Counting')
        .setColor(config.colors.accent || '#38bdf8')
        .setDescription(
          `Le module Counting transforme votre serveur en un espace ludique et coopératif combinant comptage communautaire, énigmes logiques et mini-jeux !\n\n` +
          `**1. Comptage Communautaire dans le Chat :**\n` +
          `• Écrivez simplement \`1\`, \`2\`, \`3\`... dans le salon configuré.\n` +
          `• Interdiction de compter deux fois de suite.\n` +
          `• Récompenses en points, XP et Saez Coins à chaque palier !\n\n` +
          `**2. Défis de Logique Numérique :**\n` +
          `• \`/counting logique start\` : Lancer un défi parmi 25 catégories (suites arithmétiques, Fibonacci, équations, dénombrement, carrés magiques...).\n` +
          `• \`/counting logique answer <valeur>\` : Proposer votre réponse.\n` +
          `• \`/counting logique hint\` : Révéler un indice progressif.\n` +
          `• \`/counting logique daily\` : Relever le Défi Quotidien (points x2) !\n\n` +
          `**3. Mini-Jeux Rapides :**\n` +
          `• \`/counting jeu mystere\` : Trouver le nombre secret.\n` +
          `• \`/counting jeu calcul\` : Sprint de calcul mental en 30s.\n` +
          `• \`/counting jeu duel\` : Affronter un ami en 1 contre 1 !\n\n` +
          `**4. Statistiques & Records :**\n` +
          `• \`/counting score perso\` : Consulter votre profil et succès débloqués.\n` +
          `• \`/counting score classement\` : Découvrir le top 10 du serveur.`
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Propulsé par Saez Animes & Discord.js' });
      return await interaction.reply({ embeds: [helpEmbed] });
    }
  }
  if (group === 'partie') {
    const cfg = await getCountingConfig(guild.id);
    if (sub === 'status' || sub === 'current') {
      await interaction.deferReply();
      const nextDisplay = CountingEngine.getExpectedDisplay(cfg);
      const embed = new EmbedBuilder()
        .setTitle('📊 État de la Partie de Comptage')
        .setColor(cfg.is_paused ? '#f59e0b' : '#10b981')
        .addFields(
          { name: '📍 Compteur', value: `\`${cfg.current_count || 0}\``, inline: true },
          { name: '👉 Prochain Attendu', value: `\`${nextDisplay}\``, inline: true },
          { name: '🏆 Record Historique', value: `\`${cfg.high_score || 0}\``, inline: true },
          { name: '📺 Salon', value: cfg.channel_id ? `<#${cfg.channel_id}>` : '*Non configuré*', inline: true },
          { name: '🕹️ Statut', value: cfg.is_paused ? '⏸️ **En pause**' : '▶️ **En cours**', inline: true },
          { name: '🛡️ Mode Strict', value: cfg.strict_mode ? 'Activé' : 'Désactivé', inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'next') {
      const nextDisplay = CountingEngine.getExpectedDisplay(cfg);
      return await interaction.reply({
        content: `👉 Le prochain nombre ou mot attendu est : **\`${nextDisplay}\`** !`,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (sub === 'rules') {
      const embed = new EmbedBuilder()
        .setTitle('📜 Règles Officielles du Comptage')
        .setColor('#38bdf8')
        .setDescription(
          `• **Mode actuel :** \`${cfg.mode || 'classique'}\`\n` +
          `• **Variante active :** \`${cfg.variant || 'aucune'}\`\n` +
          `• **Anti-répétition :** ${cfg.prevent_consecutive !== false ? '✅ Activé (un membre ne peut pas compter 2 fois d\'affilée)' : '❌ Désactivé'}\n` +
          `• **Mode strict :** ${cfg.strict_mode ? '✅ Les messages non-numériques sont filtrés' : '❌ Chat libre autorisé'}\n` +
          `• **Gestion des erreurs :** ${cfg.error_handling === 'checkpoint' ? 'Sauvegarde au dernier checkpoint' : 'Retour à 0'}`
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'start' || sub === 'resume') {
      if (!member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return await interaction.reply({ content: '❌ Permission requise : Gérer le serveur.', flags: MessageFlags.Ephemeral });
      }
      cfg.is_paused = false;
      await saveCountingConfig(guild.id, cfg);
      return await interaction.reply({ content: '▶️ La partie de comptage est active ! Vous pouvez compter dans le salon dédié.' });
    }
    if (sub === 'stop') {
      if (!member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return await interaction.reply({ content: '❌ Permission requise : Gérer le serveur.', flags: MessageFlags.Ephemeral });
      }
      cfg.is_paused = true;
      await saveCountingConfig(guild.id, cfg);
      return await interaction.reply({ content: '⏸️ La partie de comptage a été mise en pause temporaire.' });
    }
    if (sub === 'best') {
      return await interaction.reply({
        content: `🏆 Le meilleur score jamais atteint sur le serveur est de **\`${cfg.high_score || 0}\`** !`,
      });
    }
    if (sub === 'milestone') {
      const milestones = cfg.milestones || CountingEngine.DEFAULT_MILESTONES;
      const current = cfg.current_count || 0;
      const nextMilestone = milestones.find(m => m > current) || 'Plus haut palier atteint !';
      const embed = new EmbedBuilder()
        .setTitle('🎯 Paliers de Comptage')
        .setColor('#f59e0b')
        .setDescription(
          `• **Score actuel :** \`${current}\`\n` +
          `• **Prochain palier à débloquer :** \`${nextMilestone}\`\n\n` +
          `Liste des paliers configurés : ${milestones.map(m => (m <= current ? `~~${m}~~ ✅` : `**${m}**`)).join(', ')}`
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'validate') {
      const diag = await AdminEngine.runCountingDiagnostic(guild, cfg.channel_id);
      const embed = new EmbedBuilder()
        .setTitle('🔍 Validation des Données de Comptage')
        .setColor(diag.allEssentialPermissions ? '#10b981' : '#f59e0b')
        .addFields(
          { name: 'Salon Vérifié', value: diag.channelFound ? `<#${cfg.channel_id}>` : '❌ Salon introuvable', inline: true },
          { name: 'Permissions Bot', value: diag.allEssentialPermissions ? '✅ Toutes permissions OK' : '⚠️ Permissions partielles', inline: true },
          { name: 'Compteur / Record', value: `Actuel: \`${cfg.current_count || 0}\` | Record: \`${cfg.high_score || 0}\``, inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  }
  if (group === 'logique') {
    const sessionKey = `${guild.id}_${user.id}`;
    if (sub === 'start' || sub === 'practice') {
      const diff = interaction.options.getString('difficulte') || 'facile';
      const puzzle = LogicEngine.generatePuzzle(null, diff);
      activeLogicSessions.set(sessionKey, {
        puzzle,
        hintsRevealed: 0,
        attempts: 0,
        isPractice: sub === 'practice',
        startedAt: Date.now(),
      });
      const embed = new EmbedBuilder()
        .setTitle(`💡 Défi Logique : ${puzzle.categoryName}`)
        .setColor(puzzle.color)
        .setDescription(
          `**Difficulté :** \`${puzzle.difficultyLabel}\` | **Récompense :** \`${puzzle.points} pts\` / \`${puzzle.xp} XP\`\n\n` +
          `**Énigme :**\n${puzzle.question}\n\n` +
          `👉 *Soumettez votre réponse avec :* \`/counting logique answer valeur:<votre réponse>\`\n` +
          `💡 *Besoin d'aide ? Utilisez :* \`/counting logique hint\``
        )
        .setFooter({ text: sub === 'practice' ? 'Codé avec ❤️ par Saez | Mode Entraînement (hors classement)' : 'Défi Classé' })
        .setTimestamp();
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'daily') {
      const puzzle = LogicEngine.getDailyLogicPuzzle();
      activeLogicSessions.set(sessionKey, {
        puzzle,
        hintsRevealed: 0,
        attempts: 0,
        isPractice: false,
        startedAt: Date.now(),
      });
      const embed = new EmbedBuilder()
        .setTitle(puzzle.title)
        .setColor('#f59e0b')
        .setDescription(
          `⭐ **DÉFI DU JOUR SAISONNIER (BONUS ×2 ACTIVÉ)**\n\n` +
          `**Catégorie :** \`${puzzle.categoryName}\` | **Points :** \`${puzzle.points} pts\`\n\n` +
          `**Énigme :**\n${puzzle.question}\n\n` +
          `👉 *Soumettez votre réponse avec :* \`/counting logique answer valeur:<réponse>\``
        )
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.reply({ embeds: [embed] });
    }
    const session = activeLogicSessions.get(sessionKey);
    if (sub === 'question') {
      if (!session) {
        return await interaction.reply({ content: '❌ Vous n\'avez aucun défi de logique actif. Lancez-en un avec `/counting logique start` !', flags: MessageFlags.Ephemeral });
      }
      const p = session.puzzle;
      const embed = new EmbedBuilder()
        .setTitle(`💡 Rappel du Défi : ${p.categoryName}`)
        .setColor(p.color)
        .setDescription(`${p.question}\n\n👉 Répondez avec \`/counting logique answer valeur:<réponse>\``)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'hint') {
      if (!session) {
        return await interaction.reply({ content: '❌ Aucun défi actif.', flags: MessageFlags.Ephemeral });
      }
      const p = session.puzzle;
      if (!p.hints || p.hints.length === 0) {
        return await interaction.reply({ content: 'Aucun indice disponible pour cette énigme.', flags: MessageFlags.Ephemeral });
      }
      session.hintsRevealed = Math.min(p.hints.length, (session.hintsRevealed || 0) + 1);
      const hintText = p.hints[session.hintsRevealed - 1];
      return await interaction.reply({
        content: `💡 **Indice ${session.hintsRevealed}/${p.hints.length} :**\n*${hintText}*`,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (sub === 'answer') {
      if (!session) {
        return await interaction.reply({ content: '❌ Vous n\'avez aucun défi en cours. Lancez-en un avec `/counting logique start` !', flags: MessageFlags.Ephemeral });
      }
      const val = interaction.options.getString('valeur');
      const isCorrect = LogicEngine.checkAnswer(session.puzzle, val);
      if (isCorrect) {
        activeLogicSessions.delete(sessionKey);

        if (!session.isPractice) {
          await StatsEngine.recordLogicSolution(guild, user, session.puzzle);
        }
        const embed = new EmbedBuilder()
          .setTitle('🎉 BONNE RÉPONSE ! Défi Résolu avec Succès !')
          .setColor('#10b981')
          .setDescription(
            `Félicitations ${user} ! Votre réponse était parfaitement exacte !\n\n` +
            `**Explication de la solution :**\n${session.puzzle.explanation}\n\n` +
            `🎁 **Gains :** +${session.puzzle.points} points Counting | +${session.puzzle.xp} XP | +${session.puzzle.coins} Saez Coins`
          )
          .setTimestamp()
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        return await interaction.reply({ embeds: [embed] });
      } else {
        session.attempts++;
        return await interaction.reply({
          content: `❌ Mauvaise réponse ! Réessayez ou demandez un indice avec \`/counting logique hint\`. (Essai ${session.attempts})`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
    if (sub === 'solution' || sub === 'stop') {
      if (!session) {
        return await interaction.reply({ content: '❌ Aucun défi actif à arrêter.', flags: MessageFlags.Ephemeral });
      }
      const p = session.puzzle;
      activeLogicSessions.delete(sessionKey);
      const embed = new EmbedBuilder()
        .setTitle('🏳️ Défi Terminé — Solution')
        .setColor('#94a3b8')
        .setDescription(
          `Vous avez arrêté le défi.\n\n` +
          `• **Réponse attendue :** \`${p.answer}\`\n` +
          `• **Explication :** ${p.explanation}`
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.reply({ embeds: [embed] });
    }
  }
  if (group === 'jeu') {
    const channelKey = `${guild.id}_${interaction.channelId}`;
    if (sub === 'mystere' || sub === 'calcul' || sub === 'suite' || sub === 'multiples' || sub === 'parite' || sub === 'code') {
      const typeMap = {
        mystere: MiniGamesEngine.MINI_GAMES.MYSTERE,
        calcul: MiniGamesEngine.MINI_GAMES.CALCUL,
        suite: MiniGamesEngine.MINI_GAMES.SUITE,
        multiples: MiniGamesEngine.MINI_GAMES.MULTIPLES,
        parite: MiniGamesEngine.MINI_GAMES.PARITE,
        code: MiniGamesEngine.MINI_GAMES.CODE_SECRET,
      };
      const gameType = typeMap[sub];
      const maxVal = interaction.options.getInteger('max') || 100;
      const game = MiniGamesEngine.createMiniGame(gameType, { max: maxVal });
      activeMiniGames.set(channelKey, game);
      const embed = new EmbedBuilder()
        .setTitle(`🎮 Mini-Jeu : ${game.title}`)
        .setColor('#a855f7')
        .setDescription(
          `${game.description}\n\n` +
          `👉 *Pour soumettre votre réponse, utilisez :*\n\`/counting jeu repondre reponse:<valeur>\``
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Mini-Jeu communautaire ouvert à tous les membres du salon' })
        .setTimestamp();
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'repondre') {
      const game = activeMiniGames.get(channelKey);
      if (!game || game.status !== 'active') {
        return await interaction.reply({ content: '❌ Aucun mini-jeu actif dans ce salon. Lancez-en un avec `/counting jeu <mode>` !', flags: MessageFlags.Ephemeral });
      }
      const rep = interaction.options.getString('reponse');
      const result = MiniGamesEngine.processMiniGameGuess(game, user.id, user.username, rep);
      if (result.status === 'won') {
        activeMiniGames.delete(channelKey);
        await StatsEngine.recordMiniGameWin(guild, user, game);

        const embed = new EmbedBuilder()
          .setTitle('🏆 VICTOIRE AU MINI-JEU !')
          .setColor('#10b981')
          .setDescription(
            `${result.message}\n\n` +
            `🎁 **Récompenses :** +${game.points} pts | +${game.xp} XP | +${game.coins} Saez Coins !`
          )
          .setTimestamp()
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        return await interaction.reply({ embeds: [embed] });
      }
      if (result.status === 'lost') {
        activeMiniGames.delete(channelKey);
        return await interaction.reply({ content: result.message });
      }
      return await interaction.reply({ content: result.message });
    }
    if (sub === 'duel') {
      const targetUser = interaction.options.getUser('adversaire');
      const rounds = interaction.options.getInteger('rounds') || 3;
      if (targetUser.id === user.id) {
        return await interaction.reply({ content: '❌ Vous ne pouvez pas vous défier vous-même !', flags: MessageFlags.Ephemeral });
      }
      if (targetUser.bot) {
        return await interaction.reply({ content: '❌ Vous ne pouvez pas défier un bot.', flags: MessageFlags.Ephemeral });
      }
      const duel = await DuelEngine.createDuelInvitation(guild.id, interaction.channelId, user, targetUser, rounds);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`cnt_duel_accept_${duel.id}`).setLabel('Accepter le Duel').setStyle(ButtonStyle.Success).setEmoji('⚔️'),
        new ButtonBuilder().setCustomId(`cnt_duel_decline_${duel.id}`).setLabel('Refuser').setStyle(ButtonStyle.Danger).setEmoji('🛑')
      );
      const embed = new EmbedBuilder()
        .setTitle('⚔️ INVITATION AU DUEL DE CALCUL !')
        .setColor('#f59e0b')
        .setDescription(
          `Hey ${targetUser} ! **${user.username}** vous défie dans un duel de rapidité arithmétique de **${rounds} round(s)** !\n\n` +
          `Acceptez-vous le défi ? Vous avez 2 minutes pour répondre.`
        )
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.reply({ content: `${targetUser}`, embeds: [embed], components: [row] });
    }
  }
  if (group === 'score') {
    if (sub === 'perso' || sub === 'membre') {
      await interaction.deferReply();
      const targetUser = sub === 'membre' ? interaction.options.getUser('cible') : user;
      const stats = await StatsEngine.getPlayerStats(guild.id, targetUser.id);
      const totalAttempts = (stats.counts_valid || 0) + (stats.counts_invalid || 0);
      const accuracy = totalAttempts > 0 ? Math.round(((stats.counts_valid || 0) / totalAttempts) * 100) : 100;
      const embed = new EmbedBuilder()
        .setTitle(`🔢 Profil Counting : ${targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL ? targetUser.displayAvatarURL({ dynamic: true }) : null)
        .setColor(config.colors.accent || '#38bdf8')
        .addFields(
          { name: '🏆 Points Counting', value: `\`${stats.points || 0} pts\``, inline: true },
          { name: '🔢 Nombres Validés', value: `\`${stats.counts_valid || 0}\``, inline: true },
          { name: '🎯 Précision', value: `\`${accuracy}%\``, inline: true },
          { name: '🔥 Série en Cours', value: `\`${stats.current_streak || 0}\``, inline: true },
          { name: '🌟 Meilleure Série', value: `\`${stats.best_streak || 0}\``, inline: true },
          { name: '📈 Plus Haut Nombre', value: `\`${stats.highest_count_reached || 0}\``, inline: true },
          { name: '💡 Énigmes Logique', value: `\`${stats.logic_solved || 0} résolues\``, inline: true },
          { name: '🎮 Mini-Jeux Gagnés', value: `\`${stats.minigames_won || 0} victoires\``, inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Continuez à compter pour débloquer de nouveaux badges !' })
        .setTimestamp();
      if (stats.achievements && stats.achievements.length > 0) {
        const badgesList = stats.achievements
          .map(aId => StatsEngine.ACHIEVEMENTS.find(a => a.id === aId)?.name || aId)
          .join(', ');
        embed.addFields({ name: '🎖️ Badges Débloqués', value: badgesList, inline: false });
      }
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'classement') {
      await interaction.deferReply();
      const category = interaction.options.getString('categorie') || 'global';
      const leaders = await StatsEngine.getCountingLeaderboard(guild.id, category, 10);
      const medals = ['🥇', '🥈', '🥉'];
      const lines = leaders.map(l => {
        const medal = medals[l.rank - 1] || `\`#${l.rank}\``;
        return `${medal} **${l.username}** — **${l.scoreValue}** (Points : ${l.points})`;
      });
      const embed = new EmbedBuilder()
        .setTitle(`🏆 Classement Counting — ${category.toUpperCase()}`)
        .setColor('#f59e0b')
        .setDescription(lines.length > 0 ? lines.join('\n') : '*Aucune donnée enregistrée pour le moment.*')
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.editReply({ embeds: [embed] });
    }
    if (sub === 'comparer') {
      await interaction.deferReply();
      const oppUser = interaction.options.getUser('adversaire');
      const comp = await StatsEngine.comparePlayers(guild.id, user, oppUser);
      const embed = new EmbedBuilder()
        .setTitle(`⚔️ Comparatif Counting : ${user.username} vs ${oppUser.username}`)
        .setColor('#38bdf8')
        .addFields(
          {
            name: `👤 ${user.username}`,
            value: `• Points : **${comp.player1.stats.points || 0}**\n• Nombres : **${comp.player1.stats.counts_valid || 0}**\n• Série : **${comp.player1.stats.best_streak || 0}**\n• Logique : **${comp.player1.stats.logic_solved || 0}**\n• Précision : **${comp.player1.accuracy}%**`,
            inline: true,
          },
          {
            name: `👤 ${oppUser.username}`,
            value: `• Points : **${comp.player2.stats.points || 0}**\n• Nombres : **${comp.player2.stats.counts_valid || 0}**\n• Série : **${comp.player2.stats.best_streak || 0}**\n• Logique : **${comp.player2.stats.logic_solved || 0}**\n• Précision : **${comp.player2.accuracy}%**`,
            inline: true,
          }
        )
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.editReply({ embeds: [embed] });
    }
  }
  if (group === 'config') {
    if (!member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({ content: '❌ Permission requise : Gérer le serveur.', flags: MessageFlags.Ephemeral });
    }
    const cfg = await getCountingConfig(guild.id);
    if (sub === 'salon') {
      const ch = interaction.options.getChannel('cible');
      cfg.channel_id = ch.id;
      await saveCountingConfig(guild.id, cfg);
      return await interaction.reply({
        content: `✅ Le salon officiel de comptage est désormais configuré sur <#${ch.id}> ! Les membres peuvent commencer à compter à partir de 1.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (sub === 'mode') {
      const mode = interaction.options.getString('type');
      cfg.mode = mode;
      await saveCountingConfig(guild.id, cfg);
      return await interaction.reply({
        content: `✅ Le mode de comptage a été configuré sur : **\`${mode}\`** !`,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (sub === 'variante') {
      const variant = interaction.options.getString('nom');
      cfg.variant = variant;
      await saveCountingConfig(guild.id, cfg);
      return await interaction.reply({
        content: `✅ La variante active a été configurée sur : **\`${variant}\`** !`,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (sub === 'regles') {
      const strict = interaction.options.getBoolean('strict');
      const antiRep = interaction.options.getBoolean('anti_repetition');
      if (strict !== null) cfg.strict_mode = strict;
      if (antiRep !== null) cfg.prevent_consecutive = antiRep;
      await saveCountingConfig(guild.id, cfg);
      return await interaction.reply({
        content: `✅ Règles mises à jour : Strict = \`${cfg.strict_mode}\`, Anti-Répétition = \`${cfg.prevent_consecutive}\`.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (sub === 'erreurs') {
      const act = interaction.options.getString('action');
      cfg.error_handling = act;
      await saveCountingConfig(guild.id, cfg);
      return await interaction.reply({
        content: `✅ Comportement en cas d'erreur configuré sur : **\`${act}\`** !`,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (sub === 'diagnostic') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const diag = await AdminEngine.runCountingDiagnostic(guild, cfg.channel_id);
      const embed = new EmbedBuilder()
        .setTitle('🩺 Diagnostic du Salon et Permissions Counting')
        .setColor(diag.allEssentialPermissions ? '#10b981' : '#f59e0b')
        .addFields(
          { name: 'Salon Configuré', value: diag.channelFound ? `<#${cfg.channel_id}> (\`#${diag.channelName}\`)` : '❌ Aucun salon valide', inline: false },
          {
            name: 'Permissions Discord du Bot',
            value:
              `• Voir le salon : ${diag.botPermissions.viewChannel ? '✅' : '❌'}\n` +
              `• Envoyer des messages : ${diag.botPermissions.sendMessages ? '✅' : '❌'}\n` +
              `• Intégrer des liens/embeds : ${diag.botPermissions.embedLinks ? '✅' : '❌'}\n` +
              `• Ajouter des réactions : ${diag.botPermissions.addReactions ? '✅' : '❌'}\n` +
              `• Gérer les messages : ${diag.botPermissions.manageMessages ? '✅' : '⚠️ (conseillé)'}`,
            inline: false,
          }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      if (diag.recommendations.length > 0) {
        embed.addFields({ name: '💡 Recommandations', value: diag.recommendations.join('\n'), inline: false });
      }
      return await interaction.editReply({ embeds: [embed] });
    }
  }
  if (group === 'reset') {
    if (!member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({ content: '❌ Permission requise : Gérer le serveur.', flags: MessageFlags.Ephemeral });
    }
    if (sub === 'audit') {
      const logs = await AdminEngine.getAuditLogs(guild.id, 10);
      const lines = logs.map(l => `• \`${new Date(l.timestamp).toLocaleTimeString()}\` par **${l.adminTag}** : \`${l.action}\``);
      const embed = new EmbedBuilder()
        .setTitle('📜 Journal d\'Audit des Réinitialisations')
        .setColor('#38bdf8')
        .setDescription(lines.length > 0 ? lines.join('\n') : '*Aucune action administrative enregistrée.*')
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
    if (sub === 'annuler') {
      const res = await AdminEngine.restoreLastSnapshot(guild.id, user);
      if (!res.success) {
        return await interaction.reply({ content: `❌ ${res.message}`, flags: MessageFlags.Ephemeral });
      }
      return await interaction.reply({
        content: `✅ **Sauvegarde restaurée avec succès !** Le compteur a été remis à **${res.restoredCount}**.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    const targetReset = sub;
    const targetMember = sub === 'membre' ? interaction.options.getUser('cible') : null;
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`cnt_reset_confirm_${targetReset}_${targetMember ? targetMember.id : 'all'}`)
        .setLabel('Confirmer la Réinitialisation')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('⚠️'),
      new ButtonBuilder()
        .setCustomId('cnt_reset_cancel')
        .setLabel('Annuler')
        .setStyle(ButtonStyle.Secondary)
    );
    const embed = new EmbedBuilder()
      .setTitle('⚠️ Confirmation Requise — Opération Destructive')
      .setColor('#ef4444')
      .setDescription(
        `Êtes-vous sûr(e) de vouloir réinitialiser : **${targetReset.toUpperCase()}** ${targetMember ? `pour ${targetMember}` : ''} ?\n\n` +
        `🛡️ *Une sauvegarde automatique (snapshot) sera créée et pourra être annulée avec \`/counting reset annuler\`.*`
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
  }
}
