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
  getAnimePartyProfile,
  getAnimePartyLeaderboard,
  recordPartyGameResult,
} from '../../services/animePartyService.js';
import { config } from '../../config.js';
const ANIME_ROULETTE = [
  { title: 'Frieren: Beyond Journey\'s End', genre: 'Aventure, Fantasy', eps: 28, desc: 'Une elfe millénaire redécouvre la valeur du temps et des liens humains.' },
  { title: 'Jujutsu Kaisen', genre: 'Action, Surnaturel', eps: 47, desc: 'Des exorcistes manient l\'énergie occulte face aux fléaux millénaires.' },
  { title: 'Solo Leveling', genre: 'Action, Fantasy Moderne', eps: 12, desc: 'Le chasseur le plus faible du monde s\'éveille avec le pouvoir du Monarque des Ombres.' },
  { title: 'Vinland Saga', genre: 'Historique, Drame, Action', eps: 48, desc: 'L\'épopée viking d\'un jeune guerrier cherchant la rédemption.' },
  { title: 'Steins;Gate', genre: 'Sci-Fi, Mystère', eps: 24, desc: 'Des étudiants découvrent par hasard le voyage dans le temps.' },
  { title: 'Bocchi the Rock!', genre: 'Comédie, Musique', eps: 12, desc: 'Une guitariste ultra-timide intègre un groupe de rock.' },
  { title: 'Cyberpunk: Edgerunners', genre: 'Action, Sci-Fi', eps: 10, desc: 'Une plongée fulgurante dans les bas-fonds futuristes de Night City.' },
  { title: 'Chainsaw Man', genre: 'Action, Dark Fantasy', eps: 12, desc: 'Denji et son chien-tronçonneuse Pochita intègrent la Sécurité Publique.' },
  { title: 'Demon Slayer (Kimetsu no Yaiba)', genre: 'Action, Shonen', eps: 55, desc: 'Tanjiro fend les démons pour rendre à sa sœur Nezuko son humanité.' },
  { title: 'Bleach: Thousand-Year Blood War', genre: 'Action, Surnaturel', eps: 26, desc: 'Le retour des Quincy et l\'affrontement millénaire de la Soul Society.' },
];
const CHARACTER_ROULETTE = [
  { name: 'Satoru Gojo', anime: 'Jujutsu Kaisen', title: 'L\'Exorciste Suprême' },
  { name: 'Monkey D. Luffy', anime: 'One Piece', title: 'Le Futur Roi des Pirates' },
  { name: 'Sung Jin-woo', anime: 'Solo Leveling', title: 'Le Monarque des Ombres' },
  { name: 'Levi Ackerman', anime: 'L\'Attaque des Titans', title: 'L\'Invincible du Bataillon' },
  { name: 'Roronoa Zoro', anime: 'One Piece', title: 'Le Roi des Enfers' },
  { name: 'Killua Zoldyck', anime: 'Hunter x Hunter', title: 'L\'Éclair Assassin' },
  { name: 'Itachi Uchiha', anime: 'Naruto Shippuden', title: 'L\'Ombre Protectrice de Konoha' },
];
const POWER_ROULETTE = [
  { name: 'Infini & Muryōkūsho', anime: 'Jujutsu Kaisen', desc: 'Ralentit la matière à l\'infini et sature le cerveau d\'informations.' },
  { name: 'Fruit de l\'Humain modèle Nika (Gear 5)', anime: 'One Piece', desc: 'Donne au corps les propriétés du caoutchouc et la liberté totale du Guerrier Libérateur.' },
  { name: 'Extraction des Ombres (Arise)', anime: 'Solo Leveling', desc: 'Réanime les ennemis défunts sous forme d\'escouades de soldats d\'ombres invincibles.' },
  { name: 'Mangekyo Sharingan & Kamui', anime: 'Naruto', desc: 'Manipule l\'espace-temps et téléporte toute cible dans une dimension parallèle.' },
  { name: 'Respiration du Soleil', anime: 'Demon Slayer', desc: 'La forme originelle et suprême de toutes les techniques de souffle.' },
];
export const data = new SlashCommandBuilder()
  .setName('animeparty')
  .setDescription('Citations, roulette, soundboard, mini-jeux et ambiance Otaku')
  .addSubcommand((sub) =>
    sub
      .setName('citation')
      .setDescription('Citations cultes, citation du jour, favoris et duels')
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Mode d\'affichage')
          .setRequired(false)
          .addChoices(
            { name: '🎲 Citation Aléatoire', value: 'aleatoire' },
            { name: '📅 Citation du Jour', value: 'jour' },
            { name: '⚔️ Duel de Citations', value: 'duel' },
            { name: '❤️ Mes Favoris', value: 'favoris' }
          )
      )
      .addStringOption((opt) => opt.setName('recherche').setDescription('Recherche par mot-clé dans la réplique').setRequired(false))
      .addStringOption((opt) => opt.setName('personnage').setDescription('Filtrer par nom de personnage').setRequired(false))
      .addStringOption((opt) => opt.setName('anime').setDescription('Filtrer par nom d\'anime').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('roulette')
      .setDescription('Tirage au sort : animes, personnages, pouvoirs ou défis')
      .addStringOption((opt) =>
        opt
          .setName('theme')
          .setDescription('Catégorie de tirage')
          .setRequired(false)
          .addChoices(
            { name: '🎬 Que regarder ce soir (Animes)', value: 'animes' },
            { name: '👤 Personnage Aléatoire', value: 'personnages' },
            { name: '⚡ Pouvoir & Capacité Suprême', value: 'pouvoirs' },
            { name: '🎯 Défi Otaku Express', value: 'defis' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('soundboard')
      .setDescription('Punchlines et répliques cultes d\'animes')
      .addStringOption((opt) =>
        opt
          .setName('replique')
          .setDescription('Choisir une réplique culte')
          .setRequired(false)
          .addChoices(
            { name: 'Omae wa mou shindeiru (Ken)', value: 'omae' },
            { name: 'Ryoiki Tenkai : Muryokusho (Gojo)', value: 'gojo' },
            { name: 'Bankai ! (Bleach)', value: 'bankai' },
            { name: 'Arise / Debout (Sung Jin-woo)', value: 'arise' },
            { name: 'Dattebayo ! (Naruto)', value: 'dattebayo' },
            { name: 'Za Warudo ! Toki yo Tomare (Dio)', value: 'za_warudo' },
            { name: 'Plus Ultra ! (All Might)', value: 'plus_ultra' },
            { name: 'Shinzo wo Sasageyo ! (Erwin)', value: 'sasageyo' }
          )
      )
  )
  .addSubcommandGroup((grp) =>
    grp
      .setName('jeu')
      .setDescription('Jeux interactifs de reconnaissance anime')
      .addSubcommand((sub) => sub.setName('blindtest').setDescription('Deviner l\'anime à partir d\'un opening, ending ou son culte'))
      .addSubcommand((sub) => sub.setName('devine-anime').setDescription('Deviner le titre d\'un anime avec des indices progressifs'))
      .addSubcommand((sub) => sub.setName('devine-personnage').setDescription('Deviner un personnage d\'anime avec des indices'))
      .addSubcommand((sub) => sub.setName('devine-replique').setDescription('Deviner qui a prononcé cette réplique légendaire'))
      .addSubcommand((sub) => sub.setName('emoji-challenge').setDescription('Deviner un anime à partir d\'une suite d\'emojis'))
      .addSubcommand((sub) => sub.setName('image-mystere').setDescription('Identifier un personnage à partir d\'une image ou silhouette'))
      .addSubcommand((sub) => sub.setName('anime-pendu').setDescription('Jeu du pendu anime lettre par lettre avec potence'))
      .addSubcommand((sub) => sub.setName('vrai-ou-faux').setDescription('Affirmation piège anime : Vrai ou Faux ?'))
      .addSubcommand((sub) => sub.setName('qui-suis-je').setDescription('Découvrir le personnage secret assigné au salon'))
      .addSubcommand((sub) => sub.setName('imposteur').setDescription('Jeu social de bluff : démasquez l\'imposteur infiltré'))
      .addSubcommand((sub) => sub.setName('mot-interdit').setDescription('Faire deviner un anime sans employer les 5 mots tabous'))
      .addSubcommand((sub) => sub.setName('association').setDescription('Relier les personnages, pouvoirs ou studios correspondants'))
  )
  .addSubcommandGroup((grp) =>
    grp
      .setName('multi')
      .setDescription('Jeux multijoueurs, réflexes et tournois Anime')
      .addSubcommand((sub) => sub.setName('memoire').setDescription('Mémoriser et reproduire la séquence de symboles anime'))
      .addSubcommand((sub) => sub.setName('reflexe').setDescription('Le premier qui clique sur l\'attaque remporte le duel de vitesse'))
      .addSubcommand((sub) =>
        sub
          .setName('duel-anime')
          .setDescription('Organiser un duel de connaissances 1v1 contre un autre membre')
          .addUserOption((opt) => opt.setName('adversaire').setDescription('Le membre à affronter').setRequired(true))
      )
      .addSubcommand((sub) => sub.setName('battle-royale').setDescription('Simulation de tournoi de combat avec votes de la communauté'))
      .addSubcommand((sub) => sub.setName('tier-list').setDescription('Créer un classement collaboratif en direct (Rang S, A, B, C, D)'))
      .addSubcommand((sub) => sub.setName('draft').setDescription('Composer son escouade de 3 héros anime pour un raid'))
      .addSubcommand((sub) => sub.setName('bingo-anime').setDescription('Grille de bingo interactive des clichés shonen'))
      .addSubcommand((sub) => sub.setName('marathon').setDescription('Défi communautaire de visionnage et watch-along légal'))
      .addSubcommand((sub) => sub.setName('defi-quotidien').setDescription('Consulter et accomplir le défi Otaku du jour (+50 pts)'))
      .addSubcommand((sub) => sub.setName('jeu-rapide').setDescription('Lancer immédiatement un mini-jeu disponible au hasard'))
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
                { name: '🎮 Créer une partie', value: 'creer' },
                { name: '🚪 Quitter', value: 'quitter' }
              )
          )
      )
  )
  .addSubcommandGroup((grp) =>
    grp
      .setName('stats')
      .setDescription('Classements, profil de jeu, règles et aide')
      .addSubcommand((sub) => sub.setName('classement').setDescription('Afficher le Top 10 des meilleurs joueurs Anime Party du serveur'))
      .addSubcommand((sub) =>
        sub
          .setName('profil-party')
          .setDescription('Afficher la fiche de statistiques et badges Anime Party d\'un membre')
          .addUserOption((opt) => opt.setName('membre').setDescription('Membre à inspecter').setRequired(false))
      )
      .addSubcommand((sub) => sub.setName('regles').setDescription('Guide complet des règles et astuces de chaque mini-jeu'))
      .addSubcommand((sub) => sub.setName('aide').setDescription('Menu d\'aide et liste des commandes Anime Party'))
  );
export async function execute(interaction) {
  const group = interaction.options.getSubcommandGroup(false);
  const sub = interaction.options.getSubcommand();
  if (group === 'jeu') {
    const {
      handleBlindtest,
      handleDevineAnime,
      handleDevinePersonnage,
      handleDevineReplique,
      handleEmojiChallenge,
      handleImageMystere,
      handleAnimePendu,
      handleVraiOuFaux,
      handleQuiSuisJe,
      handleImposteur,
      handleMotInterdit,
      handleAssociation,
    } = await import('../../services/animeparty/animepartyGames.js');
    if (sub === 'blindtest') return handleBlindtest(interaction);
    if (sub === 'devine-anime') return handleDevineAnime(interaction);
    if (sub === 'devine-personnage') return handleDevinePersonnage(interaction);
    if (sub === 'devine-replique') return handleDevineReplique(interaction);
    if (sub === 'emoji-challenge') return handleEmojiChallenge(interaction);
    if (sub === 'image-mystere') return handleImageMystere(interaction);
    if (sub === 'anime-pendu') return handleAnimePendu(interaction);
    if (sub === 'vrai-ou-faux') return handleVraiOuFaux(interaction);
    if (sub === 'qui-suis-je') return handleQuiSuisJe(interaction);
    if (sub === 'imposteur') return handleImposteur(interaction);
    if (sub === 'mot-interdit') return handleMotInterdit(interaction);
    if (sub === 'association') return handleAssociation(interaction);
  }
  if (group === 'multi') {
    const {
      handleMemoire,
      handleReflexe,
      handleDuelAnime,
      handleBattleRoyale,
      handleTierList,
      handleDraft,
      handleBingoAnime,
      handleMarathon,
      handleDefiQuotidien,
      handleJeuRapide,
      handlePartie,
    } = await import('../../services/animeparty/animepartyMulti.js');
    if (sub === 'memoire') return handleMemoire(interaction);
    if (sub === 'reflexe') return handleReflexe(interaction);
    if (sub === 'duel-anime') return handleDuelAnime(interaction);
    if (sub === 'battle-royale') return handleBattleRoyale(interaction);
    if (sub === 'tier-list') return handleTierList(interaction);
    if (sub === 'draft') return handleDraft(interaction);
    if (sub === 'bingo-anime') return handleBingoAnime(interaction);
    if (sub === 'marathon') return handleMarathon(interaction);
    if (sub === 'defi-quotidien') return handleDefiQuotidien(interaction);
    if (sub === 'jeu-rapide') return handleJeuRapide(interaction);
    if (sub === 'partie') return handlePartie(interaction);
  }
  if (group === 'stats') {
    if (sub === 'classement') {
      const leaderboard = await getAnimePartyLeaderboard(interaction.guildId, 10);
      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
      const lines = leaderboard.length === 0
        ? '*Aucune partie enregistrée pour le moment. Soyez le premier en lançant `/animeparty jeu blindtest` !*'
        : leaderboard
            .map(
              (p, i) =>
                `${medals[i] || '▫️'} **${p.username}** — \`${p.points} pts\` | 🏆 \`${p.wins} victoires\` | 🎖️ \`${p.badgesCount} badges\``
            )
            .join('\n');
      const embed = new EmbedBuilder()
        .setTitle('🏆 Classement Officiel Anime Party — Top Otaku')
        .setDescription(
          `Retrouvez les maîtres incontestés des mini-jeux et quiz anime sur **${interaction.guild.name}** :\n\n` +
          lines +
          `\n\n💡 *Gagnez des points dans tous les modes pour grimper dans le classement !*`
        )
        .setColor(config.colors.primary)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Synchronisé avec le classement général du serveur' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
    if (sub === 'profil-party') {
      const targetUser = interaction.options.getUser('membre') || interaction.user;
      const profile = await getAnimePartyProfile(interaction.guildId, targetUser.id, targetUser.username);
      const embed = new EmbedBuilder()
        .setTitle(`👤 Profil Otaku Anime Party — ${profile.username}`)
        .setDescription(
          `⭐ **Points Party :** \`${profile.points} pts\`\n` +
          `🏆 **Victoires :** \`${profile.wins}\` (sur ${profile.gamesPlayed} parties jouées)\n` +
          `🔥 **Série de victoires actuelle :** \`${profile.streak || 0}\` (Record : \`${profile.bestStreak || 0}\`)\n` +
          `🎮 **Mini-jeu favori :** \`${profile.favoriteGame || 'Blindtest'}\`\n\n` +
          `🎖️ **Badges & Titres Débloqués (${(profile.badges || []).length}) :**\n` +
          (profile.badges || ['Néophyte Otaku']).map((b) => `• 🏷️ **${b}**`).join('\n')
        )
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setColor(config.colors.accent)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Profil Joueur' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
    if (sub === 'regles') {
      const embed = new EmbedBuilder()
        .setTitle('📜 Guide et Règles des Mini-Jeux Anime Party')
        .setDescription(
          '**Bienvenue dans le guide officiel d\'Anime Party !**\n\n' +
          '• **🎵 Blindtest :** Devinez l\'anime en écoutant ou analysant les indices sur l\'opening. (+15 pts)\n' +
          '• **🕵️ Devine-Perso :** Révélez les indices un par un. Moins vous en utilisez, plus vous marquez ! (+30 pts max)\n' +
          '• **🧩 Emoji-Challenge :** 5 emojis décrivent un anime culte. Trouvez le bon titre ! (+15 pts)\n' +
          '• **🪢 Anime-Pendu :** Proposez des lettres avec le menu déroulant. 6 erreurs maximum autorisées. (+25 pts)\n' +
          '• **⚖️ Vrai ou Faux :** Validez ou réfutez l\'anecdote Otaku en 30 secondes. (+10 pts)\n' +
          '• **⚔️ Duel Anime :** Affrontez un membre en 1v1 sur des questions rapides. (+30 pts au vainqueur)\n' +
          '• **⚡ Réflexe :** Le premier à cliquer dès l\'apparition de l\'attaque remporte le duel. (+20 pts)\n' +
          '• **🧠 Mémoire :** Reproduisez la séquence exacte de symboles anime. (+25 pts)\n' +
          '• **📅 Défi Quotidien :** Une mission spéciale chaque jour pour empocher +50 pts !'
        )
        .setColor(config.colors.primary)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Règles certifiées' });
      return interaction.reply({ embeds: [embed] });
    }
    if (sub === 'aide') {
      const embed = new EmbedBuilder()
        .setTitle('🎉 Centre d\'Assistance Anime Party — Commandes Disponibles')
        .setDescription(
          'Retrouvez ci-dessous toutes les fonctionnalités de la catégorie **Anime Party** :\n\n' +
          '**💬 Ambiance & Découverte :**\n' +
          '• `/animeparty citation` : Citations cultes, recherche par personnage, duel et favoris.\n' +
          '• `/animeparty roulette` : Recommandations d\'animes, personnages et pouvoirs au hasard.\n' +
          '• `/animeparty soundboard` : Punchlines sonores japonaises cultes et répliques légendaires.\n\n' +
          '**🧩 Jeux de Reconnaissance :**\n' +
          '• `/animeparty jeu blindtest` | `devine-anime` | `devine-personnage` | `devine-replique`\n' +
          '• `/animeparty jeu emoji-challenge` | `image-mystere` | `anime-pendu` | `vrai-ou-faux`\n' +
          '• `/animeparty jeu qui-suis-je` | `imposteur` | `mot-interdit` | `association`\n\n' +
          '**⚔️ Multijoueur & Compétitions :**\n' +
          '• `/animeparty multi reflexe` | `memoire` | `duel-anime` | `battle-royale`\n' +
          '• `/animeparty multi tier-list` | `draft` | `bingo-anime` | `marathon`\n' +
          '• `/animeparty multi defi-quotidien` | `jeu-rapide` | `partie`\n\n' +
          '**📊 Classements & Profils :**\n' +
          '• `/animeparty stats classement` | `profil-party` | `regles` | `aide`'
        )
        .setColor(config.colors.primary)
        .setThumbnail(config.assets.logoUrl)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système Anime Party 2.0' });
      return interaction.reply({ embeds: [embed] });
    }
  }
  if (sub === 'citation') {
    const action = interaction.options.getString('action') || 'aleatoire';
    const query = interaction.options.getString('recherche')?.toLowerCase();
    const charFilter = interaction.options.getString('personnage')?.toLowerCase();
    const animeFilter = interaction.options.getString('anime')?.toLowerCase();
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
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
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
    let pool = EXTENDED_QUOTES;
    if (query) {
      pool = pool.filter((q) => q.quote.toLowerCase().includes(query));
    }
    if (charFilter) {
      pool = pool.filter((q) => q.character.toLowerCase().includes(charFilter));
    }
    if (animeFilter) {
      pool = pool.filter((q) => q.anime.toLowerCase().includes(animeFilter));
    }
    if (pool.length === 0) {
      return interaction.reply({
        content: '🔍 Aucune citation trouvée avec ces critères. Retentez avec d\'autres mots-clés !',
        flags: MessageFlags.Ephemeral,
      });
    }
    let q = pool[Math.floor(Math.random() * pool.length)];
    if (action === 'jour') {
      const today = new Date().toISOString().slice(0, 10);
      let hash = 0;
      for (let i = 0; i < today.length; i++) hash = (hash << 5) - hash + today.charCodeAt(i);
      q = EXTENDED_QUOTES[Math.abs(hash) % EXTENDED_QUOTES.length];
    }
    const embed = new EmbedBuilder()
      .setTitle(action === 'jour' ? '📅 Citation Légendaire du Jour' : '💬 Citation Culte d\'Anime')
      .setDescription(`*" ${q.quote} "*`)
      .setColor(config.colors.primary)
      .addFields(
        { name: '👤 Personnage', value: `**${q.character}**`, inline: true },
        { name: '🎬 Œuvre', value: `*${q.anime}*`, inline: true },
        { name: '📖 Contexte', value: q.context || 'Scène mémorable', inline: false }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Inspirations Anime Saez • Cliquez sur ❤️ pour enregistrer' })
      .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('quote_fav').setLabel('Favori').setEmoji('❤️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('quote_upvote').setLabel(`J'aime (${q.upvotes || 42})`).setEmoji('👍').setStyle(ButtonStyle.Primary)
    );
    const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
    });
    collector.on('collect', async (btnInt) => {
      if (btnInt.customId === 'quote_fav') {
        return btnInt.reply({
          content: `❤️ La citation de **${q.character}** (*${q.anime}*) a été ajoutée à vos favoris personnels !`,
          flags: MessageFlags.Ephemeral,
        });
      }
      if (btnInt.customId === 'quote_upvote') {
        q.upvotes = (q.upvotes || 42) + 1;
        const updatedRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('quote_fav').setLabel('Favori').setEmoji('❤️').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('quote_upvote').setLabel(`J'aime (${q.upvotes})`).setEmoji('👍').setStyle(ButtonStyle.Primary)
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
          `**Anime :** *« ${char.anime} »*\n\n` +
          `*Ce personnage est votre allié d'honneur pour la journée !*`
        )
        .setColor(0x00e5ff)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Tirage de Héros' })
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
        .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Éveil de Capacité' })
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
    if (theme === 'defis') {
      const DEFIS = [
        'Regarder le premier épisode d\'un anime sorti cette année.',
        'Écouter l\'opening de ton anime préféré à fond les ballons.',
        'Tester un mini-jeu Anime Party avec un ami (`/animeparty multi duel-anime`).',
        'Trouver un titre au pendu avec moins de 2 erreurs (`/animeparty jeu anime-pendu`).',
      ];
      const d = DEFIS[Math.floor(Math.random() * DEFIS.length)];
      const embed = new EmbedBuilder()
        .setTitle('🎯 Défi Express Otaku')
        .setDescription(`Votre mission du jour :\n# *« ${d} »*\n\n*Relevez le défi et partagez votre réussite sur le serveur !*`)
        .setColor(config.colors.warning)
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return interaction.reply({ embeds: [embed] });
    }
    const anime = ANIME_ROULETTE[Math.floor(Math.random() * ANIME_ROULETTE.length)];
    const embed = new EmbedBuilder()
      .setTitle(`🎲 Pépite Recommandée pour ce Soir : ${anime.title}`)
      .setDescription(
        `**Genres :** \`${anime.genre}\` | **Format :** \`${anime.eps} épisodes\`\n\n` +
        `**Synopsis :**\n> *${anime.desc}*\n\n` +
        `✨ *Disponible en streaming haute fidélité sur Saez Animes !*`
      )
      .setColor(0xff2d7b)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Bon visionnage sur Saez Animes !' })
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
          content: `🔊 **${btnInt.user.username}** relance l'écho de *« ${found.title} »* (${found.char}) ! ✨`,
        });
      }
    });
    return;
  }
}
