import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ComponentType,
  MessageFlags,
} from 'discord.js';
import {
  EXTENDED_QUOTES,
  SOUNDBOARD_TRACKS,
  CHARACTER_ROULETTE,
  POWER_ROULETTE,
  getAnimePartyProfile,
  getAnimePartyLeaderboard,
  recordPartyGameResult,
  addQuoteFavorite,
  getUserQuoteFavorites,
  getGuildAnimePartyConfig,
} from '../../services/animePartyService.js';
import { config } from '../../config.js';
import fs from 'node:fs';
import path from 'node:path';
let cachedAnimes = [];
try {
  const catPath = path.resolve(process.cwd(), 'catalogue', 'catalogue_data.json');
  if (fs.existsSync(catPath)) {
    cachedAnimes = JSON.parse(fs.readFileSync(catPath, 'utf8'));
  }
} catch {}
const SITUATIONS_ROULETTE = [
  'Tu te réveilles dans le corps d\'un Hunter sans Nen la veille de l\'examen suprême face à Hisoka.',
  'Tu viens d\'ingérer un doigt de Sukuna par accident lors d\'un concours de ramen avec Naruto.',
  'Tu as 24h pour convaincre Levi Ackerman que ta chambre est parfaitement nettoyée.',
  'Tu te retrouves propulsé dans un Isekai mais ton seul pouvoir est de faire pousser des fleurs magiques.',
  'Tu es le cuisinier officiel du Vogue Merry et Luffy a déjà faim après 5 minutes de navigation.',
  'Tu es convoqué au tribunal d\'Amestris par Roy Mustang pour alchimie non autorisée de crêpes.',
];
export const data = new SlashCommandBuilder()
  .setName('animeparty')
  .setDescription('Centre Ultime Anime Party — Jeux, Citations, Duels, Roulettes & Soirées Otaku')
  .addSubcommand((sub) =>
    sub
      .setName('citation')
      .setDescription('Citations cultes, citation du jour, favoris, duels et recherche')
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Mode d\'affichage ou d\'activité')
          .setRequired(false)
          .addChoices(
            { name: '🎲 Citation Aléatoire', value: 'aleatoire' },
            { name: '📅 Citation du Jour', value: 'jour' },
            { name: '🌟 Citation de la Semaine', value: 'semaine' },
            { name: '⚔️ Duel de Citations', value: 'duel' },
            { name: '❤️ Mes Favoris', value: 'favoris' },
            { name: '🕵️ Citation Mystère (Deviner le personnage)', value: 'mystere' }
          )
      )
      .addStringOption((opt) => opt.setName('recherche').setDescription('Recherche par mot-clé dans la réplique').setRequired(false))
      .addStringOption((opt) => opt.setName('personnage').setDescription('Filtrer par nom de personnage').setRequired(false))
      .addStringOption((opt) => opt.setName('anime').setDescription('Filtrer par nom d\'anime').setRequired(false))
      .addStringOption((opt) =>
        opt
          .setName('theme')
          .setDescription('Filtrer par thème')
          .setRequired(false)
          .addChoices(
            { name: 'Détermination', value: 'Détermination' },
            { name: 'Philosophie & Sagesse', value: 'Philosophie' },
            { name: 'Combat & Dépassement', value: 'Combat' },
            { name: 'Amitié & Liens', value: 'Amitié' },
            { name: 'Humour & Scènes Cultes', value: 'Humour' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('roulette')
      .setDescription('Tirage au sort Otaku : pépites animes, héros, pouvoirs ou défis')
      .addStringOption((opt) =>
        opt
          .setName('theme')
          .setDescription('Catégorie de tirage')
          .setRequired(false)
          .addChoices(
            { name: '🎬 Que regarder ce soir (Catalogue réel)', value: 'animes' },
            { name: '👤 Personnage Aléatoire & Rang', value: 'personnages' },
            { name: '⚡ Pouvoir & Capacité Suprême', value: 'pouvoirs' },
            { name: '🎯 Défi Otaku Express', value: 'defis' },
            { name: '🎭 Situation Humoristique Fictive', value: 'situations' },
            { name: '⚖️ Dilemme Cornélien (Choix entre 2 animes)', value: 'dilemme' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('scoreboard')
      .setDescription('Classement officiel des meilleurs joueurs Anime Party du serveur')
      .addStringOption((opt) =>
        opt
          .setName('filtre')
          .setDescription('Catégorie de classement')
          .setRequired(false)
          .addChoices(
            { name: '🏆 Top Global Serveur', value: 'global' },
            { name: '🎵 Maîtres du Blindtest', value: 'blindtest' },
            { name: '🪢 As du Pendu', value: 'pendu' },
            { name: '⚔️ Champions des Duels', value: 'duel' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('stat')
      .setDescription('Fiche détaillée de profil, victoires, séries, badges et historique')
      .addUserOption((opt) => opt.setName('membre').setDescription('Membre à inspecter (vous-même par défaut)').setRequired(false))
      .addUserOption((opt) => opt.setName('comparer_avec').setDescription('Comparer votre profil avec un autre membre').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('party')
      .setDescription('Organiser et animer une Soirée Anime Party complète en plusieurs manches')
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Action de la soirée')
          .setRequired(false)
          .addChoices(
            { name: '🎉 Créer une Soirée', value: 'creer' },
            { name: '📊 Consulter le Statut', value: 'statut' },
            { name: '🏆 Résumé & Podium', value: 'resume' },
            { name: '❌ Annuler la Soirée', value: 'annuler' }
          )
      )
      .addStringOption((opt) =>
        opt
          .setName('theme')
          .setDescription('Thématique de la soirée')
          .setRequired(false)
          .addChoices(
            { name: '🔥 Shōnen Hype & Combats Légendaires', value: 'shonen_hype' },
            { name: '🕵️ Mystère, Psychologie & Déduction', value: 'mystere_enquete' },
            { name: '📼 Rétro & Âge d\'Or (Années 90-2000)', value: 'retro_90_2000' },
            { name: '🎵 Soirée Grand Concert & Openings', value: 'musique_opening' },
            { name: '🧠 Culture Générale Anime & Manga', value: 'culture_generale' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('soundboard')
      .setDescription('Punchlines et répliques sonores japonaises cultes')
      .addStringOption((opt) =>
        opt
          .setName('replique')
          .setDescription('Choisir une réplique culte')
          .setRequired(false)
          .addChoices(
            { name: 'Omae wa mou shindeiru (Kenshiro)', value: 'omae' },
            { name: 'Ryoiki Tenkai : Muryokusho (Gojo)', value: 'gojo' },
            { name: 'Bankai ! Tensa Zangetsu (Ichigo)', value: 'bankai' },
            { name: 'Arise / Debout (Sung Jin-woo)', value: 'arise' },
            { name: 'Dattebayo ! (Naruto)', value: 'dattebayo' },
            { name: 'Za Warudo ! Toki yo Tomare (Dio)', value: 'za_warudo' },
            { name: 'Plus Ultra ! (All Might)', value: 'plus_ultra' },
            { name: 'Shinzo wo Sasageyo ! (Erwin)', value: 'sasageyo' },
            { name: 'El Psy Kongroo (Okabe)', value: 'el_psy_kongroo' },
            { name: 'Kaméhaméha ! (Son Goku)', value: 'kamehameha' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('contribution')
      .setDescription('Proposer une citation, une question, un défi ou signaler une erreur')
      .addStringOption((opt) =>
        opt
          .setName('type')
          .setDescription('Nature de votre proposition')
          .setRequired(true)
          .addChoices(
            { name: '💬 Citation Culte', value: 'citation' },
            { name: '❓ Question de Quiz', value: 'question' },
            { name: '🪢 Mot d\'Anime pour le Pendu', value: 'pendu_mot' },
            { name: '🎯 Défi Otaku', value: 'defi' },
            { name: '⚠️ Signaler une Erreur', value: 'signaler_erreur' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('config')
      .setDescription('Administration et configuration du module Anime Party sur ce serveur')
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Action de configuration')
          .setRequired(true)
          .addChoices(
            { name: '📊 Diagnostic & Statistiques', value: 'stats_module' },
            { name: '📍 Restreindre / Autoriser ce salon', value: 'salon' },
            { name: '🧹 Réinitialiser une partie bloquée', value: 'reset_partie' }
          )
      )
  )
  .addSubcommandGroup((grp) =>
    grp
      .setName('jeu')
      .setDescription('Jeux de reconnaissance, réflexion, mémoire et arcade anime')
      .addSubcommand((sub) => sub.setName('catalogue').setDescription('Ouvrir le Hub et catalogue interactif de tous les mini-jeux'))
      .addSubcommand((sub) => sub.setName('blindtest').setDescription('Deviner l\'anime à partir d\'un opening, ending ou indice sonore'))
      .addSubcommand((sub) => sub.setName('devine-anime').setDescription('Identifier le titre d\'un anime avec des indices progressifs'))
      .addSubcommand((sub) => sub.setName('devine-personnage').setDescription('Deviner un personnage avec des indices progressifs'))
      .addSubcommand((sub) => sub.setName('devine-replique').setDescription('Deviner qui a prononcé cette réplique légendaire'))
      .addSubcommand((sub) => sub.setName('emoji-challenge').setDescription('Deviner un anime culte à partir d\'une suite d\'emojis'))
      .addSubcommand((sub) => sub.setName('anime-pendu').setDescription('Jeu du pendu anime complet avec potence et sélection de lettres'))
      .addSubcommand((sub) => sub.setName('vrai-ou-faux').setDescription('Affirmation piège Otaku : Vrai ou Faux en 25 secondes'))
      .addSubcommand((sub) => sub.setName('morpion').setDescription('Morpion tactique 1v1 ou contre IA thématique Anime'))
      .addSubcommand((sub) => sub.setName('puissance4').setDescription('Puissance 4 anime interactif au tour par tour'))
      .addSubcommand((sub) => sub.setName('anagramme').setDescription('Déchiffrer un titre ou personnage dont les lettres sont mélangées'))
      .addSubcommand((sub) => sub.setName('intrus').setDescription('Démasquer l\'intrus qui ne partage pas la même caractéristique'))
      .addSubcommand((sub) => sub.setName('arcade').setDescription('Mode survie où les mini-jeux s\'enchaînent avec 3 vies'))
      .addSubcommand((sub) => sub.setName('scenario').setDescription('Enquête narrative interactive à embranchements et choix'))
      .addSubcommand((sub) => sub.setName('association').setDescription('Relier les personnages, pouvoirs, rivaux ou studios'))
      .addSubcommand((sub) => sub.setName('qui-suis-je').setDescription('Découvrir le héros secret par élimination d\'indices'))
      .addSubcommand((sub) => sub.setName('imposteur').setDescription('Jeu social de bluff : démasquez l\'infiltré dans le salon'))
      .addSubcommand((sub) => sub.setName('mot-interdit').setDescription('Faire deviner un héros sans prononcer les 5 mots tabous'))
      .addSubcommand((sub) => sub.setName('image-mystere').setDescription('Reconnaître un héros à partir d\'une description détaillée'))
  )
  .addSubcommandGroup((grp) =>
    grp
      .setName('multi')
      .setDescription('Parties multijoueurs, réflexes, duels et tournois')
      .addSubcommand((sub) =>
        sub
          .setName('partie')
          .setDescription('Créer, rejoindre ou gérer un lobby multijoueur')
          .addStringOption((opt) =>
            opt
              .setName('action')
              .setDescription('Action du lobby')
              .setRequired(false)
              .addChoices(
                { name: '🎮 Créer / Gérer la partie', value: 'creer' },
                { name: '🚪 Quitter', value: 'quitter' }
              )
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName('duel-anime')
          .setDescription('Défier un membre en 1v1 dans un duel de vitesse et connaissances')
          .addUserOption((opt) => opt.setName('adversaire').setDescription('Le membre à affronter').setRequired(true))
      )
      .addSubcommand((sub) => sub.setName('tournoi').setDescription('Arbre de tournoi d\'arène à élimination directe'))
      .addSubcommand((sub) => sub.setName('reflexe').setDescription('Duel de vitesse : le premier qui clique remporte le duel'))
      .addSubcommand((sub) => sub.setName('memoire').setDescription('Mémoriser et reproduire la séquence de symboles anime'))
      .addSubcommand((sub) => sub.setName('battle-royale').setDescription('Simulation de combat de titans avec votes de la communauté'))
      .addSubcommand((sub) => sub.setName('tier-list').setDescription('Créer un classement collaboratif en direct (Rang S, A, B, C, D)'))
      .addSubcommand((sub) => sub.setName('draft').setDescription('Composer son escouade de 3 héros pour un raid'))
      .addSubcommand((sub) => sub.setName('bingo-anime').setDescription('Grille de bingo interactive des clichés shonen'))
      .addSubcommand((sub) => sub.setName('marathon').setDescription('Défi communautaire de visionnage et watch-along légal'))
      .addSubcommand((sub) => sub.setName('defi-quotidien').setDescription('Consulter et accomplir la mission Otaku du jour'))
      .addSubcommand((sub) => sub.setName('jeu-rapide').setDescription('Lancer immédiatement un mini-jeu disponible au hasard'))
  );
export async function execute(interaction) {
  try {
    const guildCfg = await getGuildAnimePartyConfig(interaction.guildId);
    if (
      guildCfg?.allowedChannelIds?.length > 0 &&
      !guildCfg.allowedChannelIds.includes(interaction.channelId) &&
      interaction.options.getSubcommand() !== 'config'
    ) {
      const allowedList = guildCfg.allowedChannelIds.map((id) => `<#${id}>`).join(', ');
      return interaction.reply({
        content: `🎮 Les activités Anime Party sont réservées aux salons dédiés sur ce serveur : ${allowedList} ! Rendez-vous là-bas pour jouer. ✨`,
        flags: MessageFlags.Ephemeral,
      });
    }
  } catch {}
  const group = interaction.options.getSubcommandGroup(false);
  const sub = interaction.options.getSubcommand();
  if (group === 'jeu') {
    const games = await import('../../services/animeparty/animepartyGames.js');
    if (sub === 'catalogue') return games.handleCatalogue(interaction);
    if (sub === 'blindtest') return games.handleBlindtest(interaction);
    if (sub === 'devine-anime') return games.handleDevineAnime(interaction);
    if (sub === 'devine-personnage') return games.handleDevinePersonnage(interaction);
    if (sub === 'devine-replique') return games.handleDevineReplique(interaction);
    if (sub === 'emoji-challenge') return games.handleEmojiChallenge(interaction);
    if (sub === 'anime-pendu') return games.handleAnimePendu(interaction);
    if (sub === 'vrai-ou-faux') return games.handleVraiOuFaux(interaction);
    if (sub === 'morpion') return games.handleMorpion(interaction);
    if (sub === 'puissance4') return games.handlePuissance4(interaction);
    if (sub === 'anagramme') return games.handleAnagramme(interaction);
    if (sub === 'intrus') return games.handleIntrus(interaction);
    if (sub === 'arcade') return games.handleArcade(interaction);
    if (sub === 'scenario') return games.handleScenario(interaction);
    if (sub === 'association') return games.handleAssociation(interaction);
    if (sub === 'qui-suis-je') return games.handleQuiSuisJe(interaction);
    if (sub === 'imposteur') return games.handleImposteur(interaction);
    if (sub === 'mot-interdit') return games.handleMotInterdit(interaction);
    if (sub === 'image-mystere') return games.handleImageMystere(interaction);
  }
  if (group === 'multi') {
    const multi = await import('../../services/animeparty/animepartyMulti.js');
    if (sub === 'partie') return multi.handlePartie(interaction);
    if (sub === 'duel-anime') return multi.handleDuelAnime(interaction);
    if (sub === 'tournoi') return multi.handleTournoi(interaction);
    if (sub === 'reflexe') return multi.handleReflexe(interaction);
    if (sub === 'memoire') return multi.handleMemoire(interaction);
    if (sub === 'battle-royale') return multi.handleBattleRoyale(interaction);
    if (sub === 'tier-list') return multi.handleTierList(interaction);
    if (sub === 'draft') return multi.handleDraft(interaction);
    if (sub === 'bingo-anime') return multi.handleBingoAnime(interaction);
    if (sub === 'marathon') return multi.handleMarathon(interaction);
    if (sub === 'defi-quotidien') return multi.handleDefiQuotidien(interaction);
    if (sub === 'jeu-rapide') return multi.handleJeuRapide(interaction);
  }
  if (sub === 'party') {
    const { handleParty } = await import('../../services/animeparty/animepartyParty.js');
    return handleParty(interaction);
  }
  if (sub === 'contribution') {
    const { handleContribution } = await import('../../services/animeparty/animepartyAdmin.js');
    return handleContribution(interaction);
  }
  if (sub === 'config') {
    const { handleConfig } = await import('../../services/animeparty/animepartyAdmin.js');
    return handleConfig(interaction);
  }
  if (sub === 'scoreboard') {
    const filter = interaction.options.getString('filtre') || 'global';
    const leaderboard = await getAnimePartyLeaderboard(interaction.guildId, 10, filter);
    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const lines =
      leaderboard.length === 0
        ? '*Aucune partie enregistrée pour le moment. Soyez le premier en lançant `/animeparty jeu blindtest` !*'
        : leaderboard
            .map(
              (p, i) =>
                `${medals[i] || '▫️'} **${p.username}** — \`${p.points} pts\` | 🏆 \`${p.wins}V - ${p.losses || 0}D\` | 🔥 \`${p.streak || 0} streak\` | 🎖️ \`${p.badgesCount} badges\``
            )
            .join('\n');
    const embed = new EmbedBuilder()
      .setTitle(`🏆 Scoreboard Officiel Anime Party — Top Otaku (${filter.toUpperCase()})`)
      .setDescription(
        `Retrouvez les maîtres incontestés des mini-jeux et quiz anime sur **${interaction.guild.name}** :\n\n` +
        lines +
        `\n\n💡 *Gagnez des points dans tous les modes pour grimper dans le classement et débloquer des rôles !*`
      )
      .setColor(config.colors.primary)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Synchronisé avec le niveau général du serveur' })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'stat') {
    const targetUser = interaction.options.getUser('membre') || interaction.user;
    const compareUser = interaction.options.getUser('comparer_avec');
    const profile1 = await getAnimePartyProfile(interaction.guildId, targetUser.id, targetUser.username);
    if (compareUser) {
      const profile2 = await getAnimePartyProfile(interaction.guildId, compareUser.id, compareUser.username);
      const compareEmbed = new EmbedBuilder()
        .setTitle(`⚔️ Comparaison de Profil Otaku — ${profile1.username} VS ${profile2.username}`)
        .setDescription(
          `**⭐ Points Party :** \`${profile1.points} pts\` VS \`${profile2.points} pts\`\n` +
          `**🏆 Victoires :** \`${profile1.wins}\` VS \`${profile2.wins}\`\n` +
          `**🎮 Parties Jouées :** \`${profile1.gamesPlayed}\` VS \`${profile2.gamesPlayed}\`\n` +
          `**🔥 Meilleure Série :** \`${profile1.bestStreak || 0}\` VS \`${profile2.bestStreak || 0}\`\n` +
          `**🎖️ Badges Débloqués :** \`${(profile1.badges || []).length}\` VS \`${(profile2.badges || []).length}\`\n\n` +
          `**Verdict :** ${profile1.points >= profile2.points ? `👑 **${profile1.username}** mène la danse !` : `👑 **${profile2.username}** est en tête !`}`
        )
        .setColor(config.colors.primary)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Duel de Statistiques' })
        .setTimestamp();
      return interaction.reply({ embeds: [compareEmbed] });
    }
    const winrate = profile1.gamesPlayed > 0 ? Math.round((profile1.wins / profile1.gamesPlayed) * 100) : 0;
    const historyLines = (profile1.recentHistory || []).slice(0, 5).map(h => `• \`${h.date.slice(0, 10)}\` : **${h.game}** — ${h.outcome} (+${h.points} pts)`).join('\n') || '*Aucune partie récente*';
    const embed = new EmbedBuilder()
      .setTitle(`👤 Profil Otaku Anime Party — ${profile1.username}`)
      .setDescription(
        `⭐ **Points Party :** \`${profile1.points} pts\`\n` +
        `🏆 **Palmarès :** \`${profile1.wins} Victoires\` | \`${profile1.losses || 0} Défaites\` (\`${winrate}%\` de réussite)\n` +
        `🔥 **Série actuelle :** \`${profile1.streak || 0}\` (Record absolu : \`${profile1.bestStreak || 0}\`)\n` +
        `🎮 **Mini-jeu favori :** \`${profile1.favoriteGame || 'Blindtest'}\`\n\n` +
        `🎖️ **Badges & Titres Débloqués (${(profile1.badges || []).length}) :**\n` +
        (profile1.badges || ['Néophyte Otaku']).map((b) => `• 🏷️ **${b}**`).join('\n') +
        `\n\n📜 **Dernières activités :**\n${historyLines}`
      )
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setColor(config.colors.accent)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Profil Joueur' })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'citation') {
    const action = interaction.options.getString('action') || 'aleatoire';
    const query = interaction.options.getString('recherche')?.toLowerCase();
    const charFilter = interaction.options.getString('personnage')?.toLowerCase();
    const animeFilter = interaction.options.getString('anime')?.toLowerCase();
    const themeFilter = interaction.options.getString('theme');
    if (action === 'favoris') {
      const favs = await getUserQuoteFavorites(interaction.user.id);
      if (favs.length === 0) {
        return interaction.reply({
          content: '❤️ Vous n\'avez pas encore enregistré de citations favorites ! Cliquez sur le bouton ❤️ sous une citation pour l\'ajouter.',
          flags: MessageFlags.Ephemeral,
        });
      }
      const favLines = favs.slice(0, 8).map((q, i) => `**${i + 1}.** *" ${q.quote} "*\n— **${q.character}** (*${q.anime}*)`).join('\n\n');
      const favEmbed = new EmbedBuilder()
        .setTitle(`❤️ Vos Citations Favorites (${favs.length})`)
        .setDescription(favLines)
        .setColor(0xff2d7b)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Vos perles d\'animation' });
      return interaction.reply({ embeds: [favEmbed], flags: MessageFlags.Ephemeral });
    }
    if (action === 'duel') {
      const q1 = EXTENDED_QUOTES[Math.floor(Math.random() * EXTENDED_QUOTES.length)];
      let q2 = EXTENDED_QUOTES[Math.floor(Math.random() * EXTENDED_QUOTES.length)];
      while (q2.id === q1.id) {
        q2 = EXTENDED_QUOTES[Math.floor(Math.random() * EXTENDED_QUOTES.length)];
      }
      const duelEmbed = new EmbedBuilder()
        .setTitle('⚔️ Duel de Citations d\'Anime — Quelle est la plus inspirante ?')
        .setDescription(
          `Votez pour votre citation favorite :\n\n` +
          `🔴 **Citation 1 :**\n> *" ${q1.quote} "*\n— **${q1.character}** (*${q1.anime}*)\n\n` +
          `🔵 **Citation 2 :**\n> *" ${q2.quote} "*\n— **${q2.character}** (*${q2.anime}*)`
        )
        .setColor(config.colors.primary)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Vote communautaire de 45 secondes' })
        .setTimestamp();
      const votes = { q1: 0, q2: 0 };
      const voterIds = new Set();
      function getDuelButtons() {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('duel_vote_1').setLabel(`${q1.character} (${votes.q1})`).setEmoji('🔴').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('duel_vote_2').setLabel(`${q2.character} (${votes.q2})`).setEmoji('🔵').setStyle(ButtonStyle.Primary)
        );
      }
      const reply = await interaction.reply({ embeds: [duelEmbed], components: [getDuelButtons()], fetchReply: true });
      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 45000,
      });
      collector.on('collect', async (btnInt) => {
        if (voterIds.has(btnInt.user.id)) {
          return btnInt.reply({ content: '⚠️ Vous avez déjà voté pour ce duel !', flags: MessageFlags.Ephemeral });
        }
        voterIds.add(btnInt.user.id);
        if (btnInt.customId === 'duel_vote_1') votes.q1++;
        else votes.q2++;
        await btnInt.update({ components: [getDuelButtons()] });
      });
      return;
    }
    if (action === 'mystere') {
      const q = EXTENDED_QUOTES[Math.floor(Math.random() * EXTENDED_QUOTES.length)];
      const otherChars = Array.from(new Set(EXTENDED_QUOTES.map(x => x.character))).filter(c => c !== q.character).sort(() => Math.random() - 0.5).slice(0, 3);
      const choices = [q.character, ...otherChars].sort(() => Math.random() - 0.5);
      const mystEmbed = new EmbedBuilder()
        .setTitle('🕵️ Citation Mystère — Qui a dit ces mots ?')
        .setDescription(
          `# *" ${q.quote} "*\n\n` +
          `🎬 **Indice sur l'œuvre :** *« ${q.anime} »*\n\n` +
          `Retrouvez le personnage qui a prononcé cette réplique !`
        )
        .setColor(config.colors.primary)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      const mRow = new ActionRowBuilder();
      choices.forEach((c, idx) => {
        mRow.addComponents(new ButtonBuilder().setCustomId(`qm_opt_${idx}`).setLabel(c).setStyle(ButtonStyle.Primary));
      });
      const reply = await interaction.reply({ embeds: [mystEmbed], components: [mRow], fetchReply: true });
      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30000,
      });
      collector.on('collect', async (btnInt) => {
        if (btnInt.user.id !== interaction.user.id) return;
        const selected = choices[parseInt(btnInt.customId.replace('qm_opt_', ''), 10)];
        const isRight = selected === q.character;
        collector.stop('answered');
        const resEmbed = new EmbedBuilder()
          .setTitle(isRight ? '🎉 Excellente déduction !' : '❌ Ce n\'était pas lui !')
          .setDescription(
            isRight
              ? `Bravo ! C'est bien **${q.character}** dans *${q.anime}* !\n⭐ **+15 points Party** !`
              : `Non, c'était **${q.character}** (*${q.anime}*).`
          )
          .setColor(isRight ? config.colors.success : config.colors.danger)
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        if (isRight) {
          await recordPartyGameResult(interaction.guildId, btnInt.user.id, btnInt.user.username, 15, true, 'Citation-Mystere');
        }
        await btnInt.update({ embeds: [resEmbed], components: [] });
      });
      return;
    }
    let pool = EXTENDED_QUOTES;
    if (query) pool = pool.filter((q) => q.quote.toLowerCase().includes(query));
    if (charFilter) pool = pool.filter((q) => q.character.toLowerCase().includes(charFilter));
    if (animeFilter) pool = pool.filter((q) => q.anime.toLowerCase().includes(animeFilter));
    if (themeFilter) pool = pool.filter((q) => q.theme === themeFilter);
    if (pool.length === 0) {
      return interaction.reply({
        content: '🔍 Aucune citation trouvée avec ces critères. Retentez avec d\'autres mots-clés ou filtres !',
        flags: MessageFlags.Ephemeral,
      });
    }
    let q = pool[Math.floor(Math.random() * pool.length)];
    if (action === 'jour') {
      const today = new Date().toISOString().slice(0, 10);
      let hash = 0;
      for (let i = 0; i < today.length; i++) hash = (hash << 5) - hash + today.charCodeAt(i);
      q = EXTENDED_QUOTES[Math.abs(hash) % EXTENDED_QUOTES.length];
    } else if (action === 'semaine') {
      const now = new Date();
      const week = Math.ceil(((now - new Date(now.getFullYear(), 0, 1)) / 86400000 + 1) / 7);
      q = EXTENDED_QUOTES[week % EXTENDED_QUOTES.length];
    }
    const embed = new EmbedBuilder()
      .setTitle(
        action === 'jour'
          ? '📅 Citation Légendaire du Jour'
          : action === 'semaine'
          ? '🌟 Citation Phare de la Semaine'
          : '💬 Citation Culte d\'Anime'
      )
      .setDescription(`*" ${q.quote} "*`)
      .setColor(config.colors.primary)
      .addFields(
        { name: '👤 Personnage', value: `**${q.character}**`, inline: true },
        { name: '🎬 Œuvre', value: `*${q.anime}*`, inline: true },
        { name: '🏷️ Thème', value: `\`${q.theme || 'Général'}\``, inline: true },
        { name: '📖 Contexte', value: q.context || 'Scène mémorable', inline: false }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Cliquez sur ❤️ pour enregistrer dans vos favoris' })
      .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`quote_fav_${q.id}`).setLabel('Favori').setEmoji('❤️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`quote_upvote_${q.id}`).setLabel(`J'aime (${q.upvotes || 42})`).setEmoji('👍').setStyle(ButtonStyle.Primary)
    );
    const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
    });
    collector.on('collect', async (btnInt) => {
      if (btnInt.customId.startsWith('quote_fav_')) {
        await addQuoteFavorite(btnInt.user.id, q.id);
        return btnInt.reply({
          content: `❤️ La citation de **${q.character}** (*${q.anime}*) a été ajoutée à vos favoris personnels !`,
          flags: MessageFlags.Ephemeral,
        });
      }
      if (btnInt.customId.startsWith('quote_upvote_')) {
        q.upvotes = (q.upvotes || 42) + 1;
        const updatedRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`quote_fav_${q.id}`).setLabel('Favori').setEmoji('❤️').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`quote_upvote_${q.id}`).setLabel(`J'aime (${q.upvotes})`).setEmoji('👍').setStyle(ButtonStyle.Primary)
        );
        return btnInt.update({ components: [updatedRow] });
      }
    });
    return;
  }
  if (sub === 'roulette') {
    const theme = interaction.options.getString('theme') || 'animes';
    if (theme === 'personnages') {
      const char = CHARACTER_ROULETTE[Math.floor(Math.random() * CHARACTER_ROULETTE.length)];
      const embed = new EmbedBuilder()
        .setTitle(`🎲 Roulette des Héros : ${char.name}`)
        .setDescription(
          `**Titre :** \`${char.title}\`\n` +
          `**Anime :** *« ${char.anime} »*\n` +
          `**Rang de Puissance :** \`Rang ${char.tier}\`\n` +
          `**Technique Signature :** \`${char.power}\`\n\n` +
          `*Ce personnage est votre allié d'honneur pour la journée !*`
        )
        .setColor(0x00e5ff)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Tirage de Héros' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
    if (theme === 'pouvoirs') {
      const pow = POWER_ROULETTE[Math.floor(Math.random() * POWER_ROULETTE.length)];
      const embed = new EmbedBuilder()
        .setTitle(`⚡ Pouvoir Suprême Éveillé : ${pow.name}`)
        .setDescription(
          `**Univers :** *« ${pow.anime} »*\n\n` +
          `**Description du Pouvoir :**\n> *${pow.desc}*\n\n` +
          `🔥 *Vous maniez désormais cette capacité légendaire dans le métaverse Saez !*`
        )
        .setColor(0xff2d7b)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Éveil de Capacité' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
    if (theme === 'defis') {
      const DEFIS = [
        'Regarder le premier épisode d\'un anime sorti cette année sur Saez Animes.',
        'Écouter l\'opening de ton anime préféré à fond les ballons.',
        'Tester un mini-jeu Anime Party avec un ami (`/animeparty multi duel-anime`).',
        'Trouver un titre au pendu avec moins de 2 erreurs (`/animeparty jeu anime-pendu`).',
        'Citer 3 répliques cultes de ton personnage favori dans le salon général.',
      ];
      const d = DEFIS[Math.floor(Math.random() * DEFIS.length)];
      const embed = new EmbedBuilder()
        .setTitle('🎯 Défi Express Otaku')
        .setDescription(`Votre mission du jour :\n# *« ${d} »*\n\n*Relevez le défi et partagez votre réussite sur le serveur !*`)
        .setColor(config.colors.warning)
        .setFooter({ text: 'Codé avec ❤️ par Saez' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
    if (theme === 'situations') {
      const sit = SITUATIONS_ROULETTE[Math.floor(Math.random() * SITUATIONS_ROULETTE.length)];
      const embed = new EmbedBuilder()
        .setTitle('🎭 Situation Humoristique Fictive')
        .setDescription(`# *« ${sit} »*\n\n*Que fais-tu dans cette situation critique ? Raconte-le au salon !*`)
        .setColor(0xab47bc)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return interaction.reply({ embeds: [embed] });
    }
    if (theme === 'dilemme') {
      const pool = cachedAnimes.length >= 2 ? cachedAnimes : [{ title: 'One Piece' }, { title: 'Naruto' }];
      const a1 = pool[Math.floor(Math.random() * pool.length)];
      let a2 = pool[Math.floor(Math.random() * pool.length)];
      while (a2.title === a1.title) a2 = pool[Math.floor(Math.random() * pool.length)];
      const embed = new EmbedBuilder()
        .setTitle('⚖️ Dilemme Cornélien Anime — Tu ne peux en sauver qu\'un seul !')
        .setDescription(
          `Si l'un de ces deux animes devait être effacé de l'histoire, lequel sauves-tu ?\n\n` +
          `🔴 **Option A :** **${a1.title}**\n` +
          `🔵 **Option B :** **${a2.title}**`
        )
        .setColor(0xff9800)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return interaction.reply({ embeds: [embed] });
    }
    const animes = cachedAnimes.length > 0
      ? cachedAnimes
      : [
          { title: 'Frieren: Beyond Journey\'s End', genres: 'Aventure, Fantasy', year: 2023, description: 'Une elfe millénaire redécouvre la valeur du temps et des liens humains.' },
          { title: 'Solo Leveling', genres: 'Action, Fantasy', year: 2024, description: 'Le chasseur le plus faible du monde s\'éveille avec le pouvoir du Monarque des Ombres.' },
        ];
    const anime = animes[Math.floor(Math.random() * animes.length)];
    const embed = new EmbedBuilder()
      .setTitle(`🎲 Pépite Recommandée pour ce Soir : ${anime.title}`)
      .setDescription(
        `**Genres :** \`${anime.genres || 'Action, Aventure'}\` | **Année :** \`${anime.year || '2023'}\`\n\n` +
        `**Synopsis :**\n> *${(anime.description || anime.desc || 'Une œuvre incontournable disponible sur Saez Animes.').slice(0, 300)}...*\n\n` +
        `✨ *Disponible en streaming haute fidélité sur Saez Animes !*`
      )
      .setColor(0xff2d7b)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Bon visionnage sur Saez Animes !' })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'soundboard') {
    const repliqueCode = interaction.options.getString('replique') || 'gojo';
    const found = SOUNDBOARD_TRACKS.find((s) => s.id === repliqueCode) || SOUNDBOARD_TRACKS[0];
    const embed = new EmbedBuilder()
      .setTitle(`${found.emoji} Réplique Culte : ${found.title}`)
      .setDescription(
        `# ${found.line}\n\n` +
        `👤 **Personnage :** **${found.char}**\n` +
        `🎬 **Anime :** *« ${found.anime} »*\n\n` +
        `🔊 *L'aura résonne dans tout le serveur !*`
      )
      .setColor(config.colors.primary)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Soundboard & Punchlines' })
      .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('sb_replay').setLabel('Rejouer l\'aura').setEmoji('🔊').setStyle(ButtonStyle.Primary)
    );
    const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 45000,
    });
    collector.on('collect', async (btnInt) => {
      if (btnInt.customId === 'sb_replay') {
        return btnInt.reply({
          content: `🔊 **${btnInt.user.username}** relance l'écho légendaire de *« ${found.title} »* (${found.char}) ! ✨`,
        });
      }
    });
    return;
  }
}
