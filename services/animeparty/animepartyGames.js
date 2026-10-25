import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ComponentType,
  MessageFlags,
} from 'discord.js';
import {
  BLINDTEST_DATA,
  DEVINE_PERSO_DATA,
  EMOJI_CHALLENGES,
  ANIME_PENDU_WORDS,
  VRAI_OU_FAUX_DATA,
  ASSOCIATION_SETS,
  ANAGRAMMES_DATA,
  INTRUS_DATA,
  MOT_INTERDIT_CARDS,
  SCENARIO_STORIES,
  EXTENDED_QUOTES,
  recordPartyGameResult,
} from '../animePartyService.js';
import { config } from '../../config.js';
import fs from 'node:fs';
import path from 'node:path';
let cachedCatalogue = [];
try {
  const catPath = path.resolve(process.cwd(), 'catalogue', 'catalogue_data.json');
  if (fs.existsSync(catPath)) {
    cachedCatalogue = JSON.parse(fs.readFileSync(catPath, 'utf8'));
  }
} catch (err) {
  console.warn('[AnimeParty] Catalogue JSON non disponible pour devine-anime :', err.message);
}
const PENDU_STAGES = [
  '```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========\n```',
  '```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========\n```',
  '```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========\n```',
  '```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========\n```',
  '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========\n```',
  '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========\n```',
  '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========\n```',
];
export async function handleCatalogue(interaction) {
  const families = [
    {
      id: 'culture',
      label: 'Culture & Connaissances Anime',
      emoji: '🧠',
      desc: 'Blindtest, Devine-Perso, Devine-Anime, Vrai ou Faux, Citations',
      games: ['blindtest', 'devine-anime', 'devine-personnage', 'devine-replique', 'vrai-ou-faux'],
    },
    {
      id: 'logique',
      label: 'Logique, Mémoire & Mots',
      emoji: '🧩',
      desc: 'Pendu, Emoji Challenge, Anagrammes, L\'Intrus, Associations',
      games: ['anime-pendu', 'emoji-challenge', 'anagramme', 'intrus', 'association'],
    },
    {
      id: 'rapides',
      label: 'Classiques & Duels Rapides',
      emoji: '⚡',
      desc: 'Morpion Anime, Puissance 4, Mode Arcade Survie',
      games: ['morpion', 'puissance4', 'arcade'],
    },
    {
      id: 'creatifs',
      label: 'Scénarios, Social & Rôles',
      emoji: '🎭',
      desc: 'Enquêtes Interactives, L\'Imposteur, Mot Interdit, Qui Suis-Je',
      games: ['scenario', 'imposteur', 'mot-interdit', 'qui-suis-je'],
    },
  ];
  let selectedFamily = families[0];
  function buildCatalogueEmbed(fam) {
    return new EmbedBuilder()
      .setTitle(`🎮 Hub des Mini-Jeux Anime Party — ${fam.emoji} ${fam.label}`)
      .setDescription(
        `Bienvenue dans le catalogue interactif d'Anime Party !\n\n` +
        `📂 **Famille active :** \`${fam.label}\`\n` +
        `📝 **Description :** *${fam.desc}*\n\n` +
        `👇 **Choisissez un jeu ci-dessous pour lancer une partie immédiate** ou utilisez le menu pour changer de famille.`
      )
      .addFields(
        {
          name: '🎯 Jeux disponibles dans cette catégorie',
          value: fam.games.map((g) => `• \`/animeparty jeu ${g}\``).join('\n'),
        },
        {
          name: '🏆 Récompenses',
          value: 'Chaque victoire rapporte entre **10 et 50 points Party** et de l\'XP pour votre niveau de serveur !',
        }
      )
      .setColor(config.colors.primary)
      .setThumbnail(config.assets.logoUrl)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Centre de Jeux Anime Party' })
      .setTimestamp();
  }
  function buildCategorySelectMenu() {
    return new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('cat_select_family')
        .setPlaceholder('Changer de famille de jeux...')
        .addOptions(
          families.map((f) => ({
            label: f.label,
            value: f.id,
            description: f.desc.slice(0, 50),
            emoji: f.emoji,
          }))
        )
    );
  }
  function buildQuickActionButtons(fam) {
    const row = new ActionRowBuilder();
    fam.games.slice(0, 4).forEach((g) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`launch_game_${g}`)
          .setLabel(`Jouer : ${g}`)
          .setStyle(ButtonStyle.Primary)
      );
    });
    return row;
  }
  const reply = await interaction.reply({
    embeds: [buildCatalogueEmbed(selectedFamily)],
    components: [buildCategorySelectMenu(), buildQuickActionButtons(selectedFamily)],
    fetchReply: true,
  });
  const collector = reply.createMessageComponentCollector({
    time: 60000,
  });
  collector.on('collect', async (i) => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({
        content: '❌ Ce menu interactif appartient à la personne ayant tapé la commande.',
        flags: MessageFlags.Ephemeral,
      });
    }
    if (i.isStringSelectMenu() && i.customId === 'cat_select_family') {
      const found = families.find((f) => f.id === i.values[0]) || families[0];
      selectedFamily = found;
      await i.update({
        embeds: [buildCatalogueEmbed(selectedFamily)],
        components: [buildCategorySelectMenu(), buildQuickActionButtons(selectedFamily)],
      });
      return;
    }
    if (i.isButton() && i.customId.startsWith('launch_game_')) {
      const gameName = i.customId.replace('launch_game_', '');
      collector.stop('launched');
      await i.update({
        content: `🚀 Lancement de **${gameName}**... Préparez-vous !`,
        components: [],
      });
      if (gameName === 'blindtest') return handleBlindtest(i);
      if (gameName === 'devine-anime') return handleDevineAnime(i);
      if (gameName === 'devine-personnage') return handleDevinePersonnage(i);
      if (gameName === 'devine-replique') return handleDevineReplique(i);
      if (gameName === 'emoji-challenge') return handleEmojiChallenge(i);
      if (gameName === 'anime-pendu') return handleAnimePendu(i);
      if (gameName === 'vrai-ou-faux') return handleVraiOuFaux(i);
      if (gameName === 'morpion') return handleMorpion(i);
      if (gameName === 'puissance4') return handlePuissance4(i);
      if (gameName === 'anagramme') return handleAnagramme(i);
      if (gameName === 'intrus') return handleIntrus(i);
      if (gameName === 'arcade') return handleArcade(i);
      if (gameName === 'scenario') return handleScenario(i);
      if (gameName === 'association') return handleAssociation(i);
      if (gameName === 'qui-suis-je') return handleQuiSuisJe(i);
      if (gameName === 'imposteur') return handleImposteur(i);
      if (gameName === 'mot-interdit') return handleMotInterdit(i);
    }
  });
}
export async function handleBlindtest(interaction) {
  const item = BLINDTEST_DATA[Math.floor(Math.random() * BLINDTEST_DATA.length)];
  const shuffledOptions = [...item.options].sort(() => Math.random() - 0.5);
  const embed = new EmbedBuilder()
    .setTitle('🎵 Blindtest Anime — Quel est cet Anime ?')
    .setDescription(
      `🎧 **Morceau :** *« ${item.title} »* par **${item.artist}** (${item.type})\n\n` +
      `💡 **Indice musical :**\n> *"${item.hint}"*\n\n` +
      `⏱️ *Cliquez sur la bonne réponse ci-dessous dans les 30 secondes !*`
    )
    .setColor(config.colors.primary)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Blindtest Audio & Opening' })
    .setTimestamp();
  const row = new ActionRowBuilder();
  const letters = ['A', 'B', 'C', 'D'];
  for (let i = 0; i < shuffledOptions.length; i++) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`bt_opt_${i}`)
        .setLabel(`${letters[i]}. ${shuffledOptions[i]}`)
        .setStyle(ButtonStyle.Primary)
    );
  }
  const reply = interaction.replied || interaction.deferred
    ? await interaction.followUp({ embeds: [embed], components: [row], fetchReply: true })
    : await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 30000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) {
      return btnInt.reply({
        content: '❌ Seule la personne ayant lancé le blindtest peut répondre ! Lancez le vôtre avec `/animeparty jeu blindtest`.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const selectedIdx = parseInt(btnInt.customId.replace('bt_opt_', ''), 10);
    const chosenAnime = shuffledOptions[selectedIdx];
    const isCorrect = chosenAnime === item.anime;
    collector.stop('answered');
    const resultEmbed = new EmbedBuilder()
      .setTitle(isCorrect ? '🎉 Bonne Réponse !' : '❌ Mauvaise Réponse !')
      .setDescription(
        isCorrect
          ? `Bravo ${btnInt.user} ! Il s'agissait bien de l'anime **${item.anime}** !\n` +
            `🎵 Morceau : *${item.title}* de ${item.artist} (${item.type})\n\n` +
            `⭐ **+15 points Anime Party** ajoutés à votre profil !`
          : `Dommage ${btnInt.user} ! Vous avez choisi **${chosenAnime}**.\n` +
            `👉 La bonne réponse était **${item.anime}** (*${item.title}* de ${item.artist}).`
      )
      .setColor(isCorrect ? config.colors.success : config.colors.accent)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Session terminée' })
      .setTimestamp();
    if (isCorrect) {
      await recordPartyGameResult(interaction.guildId, btnInt.user.id, btnInt.user.username, 15, true, 'Blindtest', {
        guild: interaction.guild,
        member: interaction.member,
      });
    }
    await btnInt.update({ embeds: [resultEmbed], components: [] });
  });
  collector.on('end', async (_, reason) => {
    if (reason !== 'answered') {
      const timeoutEmbed = new EmbedBuilder()
        .setTitle('⏰ Temps écoulé !')
        .setDescription(`Le temps est écoulé ! La bonne réponse était **${item.anime}** (*${item.title}*).`)
        .setColor(config.colors.warning)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      await interaction.editReply({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
    }
  });
}
export async function handleDevineAnime(interaction) {
  let item = null;
  if (cachedCatalogue.length >= 4) {
    const valid = cachedCatalogue.filter((a) => a.title && a.description && a.genres);
    const chosen = valid[Math.floor(Math.random() * valid.length)];
    const otherChoices = valid
      .filter((a) => a.title !== chosen.title)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((a) => a.title);
    item = {
      title: chosen.title,
      year: chosen.year || 'Récent',
      genres: chosen.genres,
      desc: chosen.description.length > 250 ? chosen.description.slice(0, 250) + '...' : chosen.description,
      options: [chosen.title, ...otherChoices].sort(() => Math.random() - 0.5),
    };
  } else {
    item = {
      title: 'Death Note',
      year: 2006,
      genres: 'Surnaturel, Thriller, Psychologique',
      desc: 'Un lycéen surdoué trouve un carnet capable de tuer toute personne dont le nom y est inscrit et s\'engage dans une guerre d\'esprits contre un détective mondialement réputé.',
      options: ['Death Note', 'Code Geass', 'Monster', 'Psycho-Pass'].sort(() => Math.random() - 0.5),
    };
  }
  const embed = new EmbedBuilder()
    .setTitle('🎬 Devine l\'Anime — Synopsis & Éléments Clés')
    .setDescription(
      `**Année de sortie :** \`${item.year}\`\n` +
      `**Genres :** \`${item.genres}\`\n\n` +
      `**Synopsis :**\n> *"${item.desc}"*\n\n` +
      `Quel est cet anime ? Faites votre choix ci-dessous !`
    )
    .setColor(config.colors.primary)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Devine l\'Anime' })
    .setTimestamp();
  const row = new ActionRowBuilder();
  const letters = ['A', 'B', 'C', 'D'];
  item.options.forEach((opt, idx) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`da_opt_${idx}`)
        .setLabel(`${letters[idx]}. ${opt.slice(0, 75)}`)
        .setStyle(ButtonStyle.Primary)
    );
  });
  const reply = interaction.replied || interaction.deferred
    ? await interaction.followUp({ embeds: [embed], components: [row], fetchReply: true })
    : await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 35000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) {
      return btnInt.reply({ content: '❌ Ce n\'est pas votre partie !', flags: MessageFlags.Ephemeral });
    }
    const selectedIdx = parseInt(btnInt.customId.replace('da_opt_', ''), 10);
    const chosen = item.options[selectedIdx];
    const isCorrect = chosen === item.title;
    collector.stop('answered');
    const result = new EmbedBuilder()
      .setTitle(isCorrect ? '🎉 Parfaitement deviné !' : '❌ Mauvaise réponse !')
      .setDescription(
        isCorrect
          ? `Félicitations ${btnInt.user} ! Il s'agissait bien de **${item.title}** !\n⭐ **+20 points Party** ajoutés à votre profil !`
          : `Ce n'était pas **${chosen}**. L'anime recherché était **${item.title}**.`
      )
      .setColor(isCorrect ? config.colors.success : config.colors.accent)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (isCorrect) {
      await recordPartyGameResult(interaction.guildId, btnInt.user.id, btnInt.user.username, 20, true, 'Devine-Anime', {
        guild: interaction.guild,
        member: interaction.member,
      });
    }
    await btnInt.update({ embeds: [result], components: [] });
  });
}
export async function handleDevinePersonnage(interaction) {
  const item = DEVINE_PERSO_DATA[Math.floor(Math.random() * DEVINE_PERSO_DATA.length)];
  let clueIndex = 1;
  function buildEmbed() {
    const revealedClues = item.clues.slice(0, clueIndex).join('\n');
    return new EmbedBuilder()
      .setTitle(`🕵️ Qui est ce Personnage d'Anime ? (Indice ${clueIndex}/${item.clues.length})`)
      .setDescription(
        `**Anime associé :** *« ${item.anime} »*\n\n` +
        `**Indices révélés :**\n${revealedClues}\n\n` +
        `💡 *Devinez avec le moins d'indices possible pour maximiser vos points !*\n` +
        `Points à gagner : **${30 - (clueIndex - 1) * 8} points**`
      )
      .setColor(config.colors.primary)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Reconnaissance de Héros' })
      .setTimestamp();
  }
  function buildButtons(disabled = false) {
    const row1 = new ActionRowBuilder();
    const letters = ['A', 'B', 'C', 'D'];
    item.options.forEach((opt, idx) => {
      row1.addComponents(
        new ButtonBuilder()
          .setCustomId(`dp_opt_${idx}`)
          .setLabel(`${letters[idx]}. ${opt}`)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(disabled)
      );
    });
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('dp_next_clue')
        .setLabel(`Révéler l'indice suivant (${clueIndex}/${item.clues.length})`)
        .setEmoji('🔍')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(clueIndex >= item.clues.length || disabled)
    );
    return [row1, row2];
  }
  const reply = interaction.replied || interaction.deferred
    ? await interaction.followUp({ embeds: [buildEmbed()], components: buildButtons(), fetchReply: true })
    : await interaction.reply({ embeds: [buildEmbed()], components: buildButtons(), fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 45000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) {
      return btnInt.reply({ content: '❌ Ce n\'est pas votre session !', flags: MessageFlags.Ephemeral });
    }
    if (btnInt.customId === 'dp_next_clue') {
      if (clueIndex < item.clues.length) clueIndex++;
      return btnInt.update({ embeds: [buildEmbed()], components: buildButtons() });
    }
    const selectedIdx = parseInt(btnInt.customId.replace('dp_opt_', ''), 10);
    const chosen = item.options[selectedIdx];
    const isCorrect = chosen === item.perso;
    collector.stop('answered');
    const points = Math.max(10, 30 - (clueIndex - 1) * 8);
    const resultEmbed = new EmbedBuilder()
      .setTitle(isCorrect ? '🎉 Excellent !' : '❌ Perdu !')
      .setDescription(
        isCorrect
          ? `Bravo ${btnInt.user} ! Il s'agissait bien de **${item.perso}** (*${item.anime}*) !\n` +
            `Vous avez trouvé avec **${clueIndex} indice(s)**.\n` +
            `⭐ **+${points} points Anime Party** ajoutés à votre profil !`
          : `Faux ! Vous avez choisi **${chosen}**.\n👉 Le personnage secret était **${item.perso}** (*${item.anime}*).`
      )
      .setColor(isCorrect ? config.colors.success : config.colors.accent)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (isCorrect) {
      await recordPartyGameResult(interaction.guildId, btnInt.user.id, btnInt.user.username, points, true, 'Devine-Perso', {
        guild: interaction.guild,
        member: interaction.member,
      });
    }
    await btnInt.update({ embeds: [resultEmbed], components: [] });
  });
}
export async function handleDevineReplique(interaction) {
  const quote = EXTENDED_QUOTES[Math.floor(Math.random() * EXTENDED_QUOTES.length)];
  const pool = Array.from(new Set(EXTENDED_QUOTES.map((q) => q.character))).filter((c) => c !== quote.character);
  const shuffledChoices = [quote.character, ...pool.sort(() => Math.random() - 0.5).slice(0, 3)].sort(
    () => Math.random() - 0.5
  );
  const embed = new EmbedBuilder()
    .setTitle('💬 Qui a dit cette Réplique Culte ?')
    .setDescription(
      `# *" ${quote.quote} "*\n\n` +
      `🎬 **Indice sur l'œuvre :** *« ${quote.anime} »*\n` +
      `📖 **Contexte :** ${quote.context || 'Moment légendaire'}\n\n` +
      `Quel personnage a prononcé ces mots inoubliables ?`
    )
    .setColor(config.colors.primary)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Devinette de Réplique' })
    .setTimestamp();
  const row = new ActionRowBuilder();
  const letters = ['A', 'B', 'C', 'D'];
  shuffledChoices.forEach((c, idx) => {
    row.addComponents(
      new ButtonBuilder().setCustomId(`dr_opt_${idx}`).setLabel(`${letters[idx]}. ${c}`).setStyle(ButtonStyle.Primary)
    );
  });
  const reply = interaction.replied || interaction.deferred
    ? await interaction.followUp({ embeds: [embed], components: [row], fetchReply: true })
    : await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 30000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) {
      return btnInt.reply({ content: '❌ Ce n\'est pas votre partie !', flags: MessageFlags.Ephemeral });
    }
    const selected = shuffledChoices[parseInt(btnInt.customId.replace('dr_opt_', ''), 10)];
    const isCorrect = selected === quote.character;
    collector.stop('answered');
    const result = new EmbedBuilder()
      .setTitle(isCorrect ? '🎉 Parfaite mémoire Otaku !' : '❌ Erreur !')
      .setDescription(
        isCorrect
          ? `Bien joué ${btnInt.user} ! C'est bien **${quote.character}** qui a prononcé cette citation dans *« ${quote.anime} »* !\n⭐ **+20 points Party** remportés !`
          : `Dommage ! Cette réplique appartient à **${quote.character}** (*${quote.anime}*).`
      )
      .setColor(isCorrect ? config.colors.success : config.colors.accent)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (isCorrect) {
      await recordPartyGameResult(interaction.guildId, btnInt.user.id, btnInt.user.username, 20, true, 'Devine-Réplique', {
        guild: interaction.guild,
        member: interaction.member,
      });
    }
    await btnInt.update({ embeds: [result], components: [] });
  });
}
export async function handleEmojiChallenge(interaction) {
  const item = EMOJI_CHALLENGES[Math.floor(Math.random() * EMOJI_CHALLENGES.length)];
  const shuffledOptions = [...item.options].sort(() => Math.random() - 0.5);
  const embed = new EmbedBuilder()
    .setTitle('🧩 Emoji Challenge Anime')
    .setDescription(
      `Déchiffrez l'anime caché derrière cette combinaison d'emojis :\n\n` +
      `# ${item.emojis}\n\n` +
      `Quel est cet anime culte ?`
    )
    .setColor(0xffaa00)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Épreuve des Emojis' })
    .setTimestamp();
  const row = new ActionRowBuilder();
  shuffledOptions.forEach((opt, idx) => {
    row.addComponents(
      new ButtonBuilder().setCustomId(`ec_opt_${idx}`).setLabel(opt).setStyle(ButtonStyle.Primary)
    );
  });
  const reply = interaction.replied || interaction.deferred
    ? await interaction.followUp({ embeds: [embed], components: [row], fetchReply: true })
    : await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 30000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) {
      return btnInt.reply({ content: '❌ Ce n\'est pas votre partie !', flags: MessageFlags.Ephemeral });
    }
    const chosen = shuffledOptions[parseInt(btnInt.customId.replace('ec_opt_', ''), 10)];
    const isCorrect = chosen === item.answer;
    collector.stop('answered');
    const result = new EmbedBuilder()
      .setTitle(isCorrect ? '🎉 Déchiffrage Réussi !' : '❌ Mauvaise Déduction !')
      .setDescription(
        isCorrect
          ? `Exactement ! Les emojis représentaient **${item.answer}** !\n⭐ **+15 points Party** crédités !`
          : `Faux ! La bonne réponse était **${item.answer}**.`
      )
      .setColor(isCorrect ? config.colors.success : config.colors.accent)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (isCorrect) {
      await recordPartyGameResult(interaction.guildId, btnInt.user.id, btnInt.user.username, 15, true, 'Emoji-Challenge', {
        guild: interaction.guild,
        member: interaction.member,
      });
    }
    await btnInt.update({ embeds: [result], components: [] });
  });
}
export async function handleAnimePendu(interaction) {
  const chosen = ANIME_PENDU_WORDS[Math.floor(Math.random() * ANIME_PENDU_WORDS.length)];
  const word = chosen.word.toUpperCase();
  const guessedLetters = new Set([' ', '-', '\'', ':']);
  let errors = 0;
  const maxErrors = 6;
  function getMaskedWord() {
    return word
      .split('')
      .map((letter) => (guessedLetters.has(letter) ? letter : '⬛'))
      .join(' ');
  }
  function isWon() {
    return word.split('').every((letter) => guessedLetters.has(letter));
  }
  function buildPenduEmbed() {
    const stage = PENDU_STAGES[Math.min(errors, PENDU_STAGES.length - 1)];
    return new EmbedBuilder()
      .setTitle('🪢 Jeu du Pendu Anime — Saurez-vous sauver le héros ?')
      .setDescription(
        `${stage}\n\n` +
        `**Titre à deviner :**\n# \`${getMaskedWord()}\`\n\n` +
        `💡 **Indice :** *${chosen.hint}*\n` +
        `❌ **Erreurs :** \`${errors}/${maxErrors}\` | **Lettres tentées :** \`${Array.from(guessedLetters).filter(l => ![' ', '-', '\'', ':'].includes(l)).join(', ') || 'Aucune'}\``
      )
      .setColor(errors >= 4 ? config.colors.danger : config.colors.primary)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Utilisez le menu pour proposer une lettre' })
      .setTimestamp();
  }
  function buildLetterSelectMenu() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const available = alphabet.filter((l) => !guessedLetters.has(l));
    if (available.length === 0) {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('pendu_none').setLabel('Toutes les lettres testées').setDisabled(true).setStyle(ButtonStyle.Secondary)
      );
    }
    return new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('pendu_letter_select')
        .setPlaceholder('Sélectionnez une lettre...')
        .addOptions(
          available.slice(0, 25).map((l) => ({
            label: `Lettre ${l}`,
            value: l,
          }))
        )
    );
  }
  const reply = interaction.replied || interaction.deferred
    ? await interaction.followUp({ embeds: [buildPenduEmbed()], components: [buildLetterSelectMenu()], fetchReply: true })
    : await interaction.reply({ embeds: [buildPenduEmbed()], components: [buildLetterSelectMenu()], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 60000,
  });
  collector.on('collect', async (selectInt) => {
    if (selectInt.user.id !== interaction.user.id) {
      return selectInt.reply({ content: '❌ Ce n\'est pas votre partie de pendu !', flags: MessageFlags.Ephemeral });
    }
    const letter = selectInt.values[0];
    guessedLetters.add(letter);
    if (!word.includes(letter)) {
      errors++;
    }
    if (isWon()) {
      collector.stop('won');
      const winEmbed = new EmbedBuilder()
        .setTitle('🎉 VICTOIRE ! Vous avez sauvé le Héros !')
        .setDescription(
          `Le titre complet était bien **${word}** !\n\n` +
          `Nombre d'erreurs commises : \`${errors}/${maxErrors}\`\n` +
          `⭐ **+25 points Anime Party** ajoutés à votre palmarès !`
        )
        .setColor(config.colors.success)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      await recordPartyGameResult(interaction.guildId, selectInt.user.id, selectInt.user.username, 25, true, 'Anime-Pendu', {
        guild: interaction.guild,
        member: interaction.member,
      });
      return selectInt.update({ embeds: [winEmbed], components: [] });
    }
    if (errors >= maxErrors) {
      collector.stop('lost');
      const loseEmbed = new EmbedBuilder()
        .setTitle('💀 PENDU ! Le Héros a succombé...')
        .setDescription(
          `${PENDU_STAGES[maxErrors]}\n\n` +
          `Le titre mystère était : **${word}** !\n` +
          `*Ne vous découragez pas et tentez une nouvelle manche !*`
        )
        .setColor(config.colors.danger)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      await recordPartyGameResult(interaction.guildId, selectInt.user.id, selectInt.user.username, 5, false, 'Anime-Pendu', {
        guild: interaction.guild,
        member: interaction.member,
      });
      return selectInt.update({ embeds: [loseEmbed], components: [] });
    }
    await selectInt.update({ embeds: [buildPenduEmbed()], components: [buildLetterSelectMenu()] });
  });
}
export async function handleVraiOuFaux(interaction) {
  const item = VRAI_OU_FAUX_DATA[Math.floor(Math.random() * VRAI_OU_FAUX_DATA.length)];
  const embed = new EmbedBuilder()
    .setTitle('⚖️ Vrai ou Faux Otaku — Piège ou Vérité ?')
    .setDescription(
      `# *« ${item.q} »*\n\n` +
      `Cette affirmation est-elle **Vraie** ou **Fausse** ?\n` +
      `⏱️ *Répondez en moins de 25 secondes !*`
    )
    .setColor(config.colors.primary)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Vérification de Faits' })
    .setTimestamp();
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('vof_true').setLabel('VRAI').setEmoji('✅').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('vof_false').setLabel('FAUX').setEmoji('❌').setStyle(ButtonStyle.Danger)
  );
  const reply = interaction.replied || interaction.deferred
    ? await interaction.followUp({ embeds: [embed], components: [row], fetchReply: true })
    : await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 25000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) {
      return btnInt.reply({ content: '❌ Ce n\'est pas votre question !', flags: MessageFlags.Ephemeral });
    }
    const answer = btnInt.customId === 'vof_true';
    const isCorrect = answer === item.ans;
    collector.stop('answered');
    const result = new EmbedBuilder()
      .setTitle(isCorrect ? '🎉 Excellente Réponse !' : '❌ Vous êtes tombé dans le piège !')
      .setDescription(
        `${item.expl}\n\n` +
        (isCorrect ? `⭐ **+10 points Anime Party** crédités !` : `💡 *Continuez d'enrichir votre culture Otaku !*`)
      )
      .setColor(isCorrect ? config.colors.success : config.colors.danger)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (isCorrect) {
      await recordPartyGameResult(interaction.guildId, btnInt.user.id, btnInt.user.username, 10, true, 'Vrai-Faux', {
        guild: interaction.guild,
        member: interaction.member,
      });
    }
    await btnInt.update({ embeds: [result], components: [] });
  });
}
export async function handleAnagramme(interaction) {
  const item = ANAGRAMMES_DATA[Math.floor(Math.random() * ANAGRAMMES_DATA.length)];
  const wrongPool = ANAGRAMMES_DATA.filter((a) => a.answer !== item.answer).map((a) => a.answer);
  const choices = [item.answer, ...wrongPool.sort(() => Math.random() - 0.5).slice(0, 3)].sort(
    () => Math.random() - 0.5
  );
  const embed = new EmbedBuilder()
    .setTitle('🔤 Anagramme Otaku — Remettez les lettres dans l\'ordre !')
    .setDescription(
      `Les lettres du nom suivant ont été complètement mélangées :\n\n` +
      `# \` ${item.scrambled} \`\n\n` +
      `💡 **Indice :** *${item.hint}*\n\n` +
      `Retrouvez le titre ou le personnage correspondant !`
    )
    .setColor(0x00bcd4)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Anagramme' })
    .setTimestamp();
  const row = new ActionRowBuilder();
  choices.forEach((c, idx) => {
    row.addComponents(
      new ButtonBuilder().setCustomId(`ana_opt_${idx}`).setLabel(c).setStyle(ButtonStyle.Primary)
    );
  });
  const reply = interaction.replied || interaction.deferred
    ? await interaction.followUp({ embeds: [embed], components: [row], fetchReply: true })
    : await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 30000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) {
      return btnInt.reply({ content: '❌ Ce n\'est pas votre partie !', flags: MessageFlags.Ephemeral });
    }
    const selected = choices[parseInt(btnInt.customId.replace('ana_opt_', ''), 10)];
    const isCorrect = selected === item.answer;
    collector.stop('answered');
    const result = new EmbedBuilder()
      .setTitle(isCorrect ? '🎉 Bravo ! Anagramme résolue !' : '❌ Mauvaise combinaison !')
      .setDescription(
        isCorrect
          ? `Parfait ! Il s'agissait bien de **${item.answer}** !\n⭐ **+15 points Party** remportés !`
          : `Faux ! L'anagramme formait **${item.answer}**.`
      )
      .setColor(isCorrect ? config.colors.success : config.colors.accent)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (isCorrect) {
      await recordPartyGameResult(interaction.guildId, btnInt.user.id, btnInt.user.username, 15, true, 'Anagramme', {
        guild: interaction.guild,
        member: interaction.member,
      });
    }
    await btnInt.update({ embeds: [result], components: [] });
  });
}
export async function handleIntrus(interaction) {
  const item = INTRUS_DATA[Math.floor(Math.random() * INTRUS_DATA.length)];
  const embed = new EmbedBuilder()
    .setTitle(`🕵️ L'Intrus Otaku — Thème : ${item.theme}`)
    .setDescription(
      `Parmi les 4 propositions ci-dessous, l'une d'entre elles ne partage pas la même caractéristique que les autres !\n\n` +
      `Trouvez **l'intrus** caché dans cette sélection.`
    )
    .setColor(0x9c27b0)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Épreuve de Déduction' })
    .setTimestamp();
  const row = new ActionRowBuilder();
  item.options.forEach((opt, idx) => {
    row.addComponents(
      new ButtonBuilder().setCustomId(`intrus_opt_${idx}`).setLabel(opt).setStyle(ButtonStyle.Primary)
    );
  });
  const reply = interaction.replied || interaction.deferred
    ? await interaction.followUp({ embeds: [embed], components: [row], fetchReply: true })
    : await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 30000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) {
      return btnInt.reply({ content: '❌ Ce n\'est pas votre manche !', flags: MessageFlags.Ephemeral });
    }
    const selected = item.options[parseInt(btnInt.customId.replace('intrus_opt_', ''), 10)];
    const isCorrect = selected === item.intrus;
    collector.stop('answered');
    const result = new EmbedBuilder()
      .setTitle(isCorrect ? '🎉 Parfaitement démasqué !' : '❌ Ce n\'était pas l\'intrus !')
      .setDescription(
        `L'intrus était bien **${item.intrus}** !\n\n` +
        `📖 **Explication :**\n> ${item.explanation}\n\n` +
        (isCorrect ? `⭐ **+20 points Party** ajoutés !` : `Ne baissez pas les bras !`)
      )
      .setColor(isCorrect ? config.colors.success : config.colors.danger)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (isCorrect) {
      await recordPartyGameResult(interaction.guildId, btnInt.user.id, btnInt.user.username, 20, true, 'Intrus', {
        guild: interaction.guild,
        member: interaction.member,
      });
    }
    await btnInt.update({ embeds: [result], components: [] });
  });
}
export async function handleMorpion(interaction) {
  const board = Array(9).fill(null);
  let isXTurn = true; 
  function renderButtons(disabled = false) {
    const rows = [];
    for (let r = 0; r < 3; r++) {
      const row = new ActionRowBuilder();
      for (let c = 0; c < 3; c++) {
        const idx = r * 3 + c;
        const val = board[idx];
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`ttt_${idx}`)
            .setLabel(val === 'X' ? '⚔️' : val === 'O' ? '🛡️' : '⬛')
            .setStyle(val === 'X' ? ButtonStyle.Danger : val === 'O' ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setDisabled(disabled || val !== null)
        );
      }
      rows.push(row);
    }
    return rows;
  }
  function checkWinner() {
    const wins = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (const [a, b, c] of wins) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    if (board.every((v) => v !== null)) return 'draw';
    return null;
  }
  const embed = new EmbedBuilder()
    .setTitle('⚔️ Duel Tactique Morpion — Vous (⚔️) vs Rival Anime (🛡️)')
    .setDescription(
      `Alignez 3 symboles d'attaque pour terrasser votre rival !\n` +
      `Cliquez sur une case de la grille pour poser votre coup.`
    )
    .setColor(config.colors.primary)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Morpion Otaku' });
  const reply = interaction.replied || interaction.deferred
    ? await interaction.followUp({ embeds: [embed], components: renderButtons(), fetchReply: true })
    : await interaction.reply({ embeds: [embed], components: renderButtons(), fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 45000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) {
      return btnInt.reply({ content: '❌ Ce duel ne vous appartient pas !', flags: MessageFlags.Ephemeral });
    }
    const idx = parseInt(btnInt.customId.replace('ttt_', ''), 10);
    if (board[idx] !== null) return;
    board[idx] = 'X';
    let winner = checkWinner();
    if (!winner) {
      const emptyIndices = board.map((v, i) => (v === null ? i : null)).filter((v) => v !== null);
      if (emptyIndices.length > 0) {
        const iaIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        board[iaIdx] = 'O';
        winner = checkWinner();
      }
    }
    if (winner) {
      collector.stop('game_over');
      const isWin = winner === 'X';
      const isDraw = winner === 'draw';
      const endEmbed = new EmbedBuilder()
        .setTitle(isWin ? '🏆 VICTOIRE ÉPIQUE !' : isDraw ? '🤝 ÉGALITÉ TACTIQUE !' : '💀 DÉFAITE FACE AU RIVAL !')
        .setDescription(
          isWin
            ? `Vous avez terrassé votre rival en alignant vos techniques !\n⭐ **+20 points Party** ajoutés !`
            : isDraw
            ? `Match nul parfait entre deux maîtres du combat ! (+5 points)`
            : `Votre rival a réussi son alignement en premier !`
        )
        .setColor(isWin ? config.colors.success : isDraw ? config.colors.warning : config.colors.danger)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      await recordPartyGameResult(
        interaction.guildId,
        btnInt.user.id,
        btnInt.user.username,
        isWin ? 20 : isDraw ? 5 : 2,
        isWin,
        'Morpion',
        { isDraw, guild: interaction.guild, member: interaction.member }
      );
      return btnInt.update({ embeds: [endEmbed], components: renderButtons(true) });
    }
    await btnInt.update({ components: renderButtons() });
  });
}
export async function handlePuissance4(interaction) {
  const rows = 6;
  const cols = 7;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
  function formatGrid() {
    return grid
      .map((r) => r.map((c) => (c === 'X' ? '🔴' : c === 'O' ? '🟡' : '⚪')).join(' '))
      .join('\n');
  }
  function dropPiece(col, symbol) {
    for (let r = rows - 1; r >= 0; r--) {
      if (grid[r][col] === null) {
        grid[r][col] = symbol;
        return r;
      }
    }
    return -1;
  }
  function checkWin(r, c, s) {
    const directions = [
      [[0, 1], [0, -1]], 
      [[1, 0], [-1, 0]], 
      [[1, 1], [-1, -1]],
      [[1, -1], [-1, 1]], 
    ];
    for (const [d1, d2] of directions) {
      let count = 1;
      for (const [dr, dc] of [d1, d2]) {
        let currR = r + dr;
        let currC = c + dc;
        while (currR >= 0 && currR < rows && currC >= 0 && currC < cols && grid[currR][currC] === s) {
          count++;
          currR += dr;
          currC += dc;
        }
      }
      if (count >= 4) return true;
    }
    return false;
  }
  function getButtons(disabled = false) {
    const row = new ActionRowBuilder();
    for (let c = 0; c < 7; c++) {
      const isFull = grid[0][c] !== null;
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`c4_col_${c}`)
          .setLabel(`${c + 1}`)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(disabled || isFull)
      );
    }
    return [row];
  }
  const embed = new EmbedBuilder()
    .setTitle('🔴 Puissance 4 Anime — Vous (🔴) vs Rival (🟡)')
    .setDescription(
      `Alignez 4 orbes d'énergie rouge pour remporter la partie !\n\n` +
      `${formatGrid()}\n\n` +
      `Choisissez une colonne (1 à 7) pour faire chuter votre orbe.`
    )
    .setColor(0xff2d7b)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Puissance 4 Otaku' });
  const reply = interaction.replied || interaction.deferred
    ? await interaction.followUp({ embeds: [embed], components: getButtons(), fetchReply: true })
    : await interaction.reply({ embeds: [embed], components: getButtons(), fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 50000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) {
      return btnInt.reply({ content: '❌ Ce n\'est pas votre duel !', flags: MessageFlags.Ephemeral });
    }
    const col = parseInt(btnInt.customId.replace('c4_col_', ''), 10);
    const placedRow = dropPiece(col, 'X');
    if (placedRow === -1) return;
    if (checkWin(placedRow, col, 'X')) {
      collector.stop('won');
      const winEmbed = new EmbedBuilder()
        .setTitle('🎉 PUISSANCE 4 ! Victoire écrasante !')
        .setDescription(
          `${formatGrid()}\n\n` +
          `Bravo ${btnInt.user} ! Vous avez aligné 4 orbes avec maestria !\n⭐ **+25 points Party** remportés !`
        )
        .setColor(config.colors.success)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      await recordPartyGameResult(interaction.guildId, btnInt.user.id, btnInt.user.username, 25, true, 'Puissance-4', {
        guild: interaction.guild,
        member: interaction.member,
      });
      return btnInt.update({ embeds: [winEmbed], components: getButtons(true) });
    }
    const validCols = [];
    for (let c = 0; c < 7; c++) {
      if (grid[0][c] === null) validCols.push(c);
    }
    if (validCols.length > 0) {
      const iaCol = validCols[Math.floor(Math.random() * validCols.length)];
      const iaRow = dropPiece(iaCol, 'O');
      if (checkWin(iaRow, iaCol, 'O')) {
        collector.stop('lost');
        const loseEmbed = new EmbedBuilder()
          .setTitle('💀 Le Rival a réussi son Puissance 4 !')
          .setDescription(`${formatGrid()}\n\nVotre rival a aligné 4 orbes jaunes ! Revanche disponible !`)
          .setColor(config.colors.danger)
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        return btnInt.update({ embeds: [loseEmbed], components: getButtons(true) });
      }
    }
    const updatedEmbed = new EmbedBuilder()
      .setTitle('🔴 Puissance 4 Anime en cours...')
      .setDescription(`${formatGrid()}\n\nÀ votre tour de choisir une colonne !`)
      .setColor(0xff2d7b)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    await btnInt.update({ embeds: [updatedEmbed], components: getButtons() });
  });
}
export async function handleArcade(interaction) {
  let score = 0;
  let lives = 3;
  let round = 1;
  async function nextRound(btnOrInt) {
    const item = VRAI_OU_FAUX_DATA[Math.floor(Math.random() * VRAI_OU_FAUX_DATA.length)];
    const hearts = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
    const embed = new EmbedBuilder()
      .setTitle(`🕹️ Mode Arcade Survie — Manche ${round}`)
      .setDescription(
        `Vies restantes : ${hearts} | Score actuel : **${score} pts**\n\n` +
        `# *« ${item.q} »*\n\n` +
        `Validez en moins de 15 secondes !`
      )
      .setColor(0x00e5ff)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Mode Survie Arcade' });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('arc_true').setLabel('VRAI').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('arc_false').setLabel('FAUX').setStyle(ButtonStyle.Danger)
    );
    const msg = await btnOrInt.update({ embeds: [embed], components: [row], fetchReply: true });
    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 15000,
    });
    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) return;
      collector.stop('answered');
      const ans = i.customId === 'arc_true';
      if (ans === item.ans) {
        score += 15;
        round++;
        if (round > 5) {
          const victoryEmbed = new EmbedBuilder()
            .setTitle('🌟 CHAMPION DU MODE ARCADE !')
            .setDescription(
              `Incroyable ! Vous avez survécu aux 5 manches du Mode Arcade !\n` +
              `Score final : **${score} points** !\n⭐ **Bonus de maîtrise +40 pts !**`
            )
            .setColor(config.colors.success)
            .setFooter({ text: 'Codé avec ❤️ par Saez' });
          await recordPartyGameResult(interaction.guildId, i.user.id, i.user.username, score + 40, true, 'Arcade', {
            guild: interaction.guild,
            member: interaction.member,
          });
          return i.update({ embeds: [victoryEmbed], components: [] });
        }
        await nextRound(i);
      } else {
        lives--;
        if (lives <= 0) {
          const overEmbed = new EmbedBuilder()
            .setTitle('💀 GAME OVER ARCADE !')
            .setDescription(`Vous avez perdu toutes vos vies à la manche ${round}.\nScore total : **${score} points** !`)
            .setColor(config.colors.danger)
            .setFooter({ text: 'Codé avec ❤️ par Saez' });
          await recordPartyGameResult(interaction.guildId, i.user.id, i.user.username, score, false, 'Arcade', {
            guild: interaction.guild,
            member: interaction.member,
          });
          return i.update({ embeds: [overEmbed], components: [] });
        }
        round++;
        await nextRound(i);
      }
    });
  }
  const startEmbed = new EmbedBuilder()
    .setTitle('🕹️ Bienvenue dans le Mode Arcade Survie')
    .setDescription(
      `Dans ce mode sans pitié, vous devez enchaîner les défis d'affilée avec **3 vies** !\n` +
      `Chaque bonne réponse rapporte des points et augmente votre score final.\n\n` +
      `Êtes-vous prêt à tenter l'épreuve ?`
    )
    .setColor(0x00e5ff)
    .setFooter({ text: 'Codé avec ❤️ par Saez' });
  const startRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('arc_start_btn').setLabel('Démarrer l\'Arcade').setEmoji('⚡').setStyle(ButtonStyle.Primary)
  );
  const reply = interaction.replied || interaction.deferred
    ? await interaction.followUp({ embeds: [startEmbed], components: [startRow], fetchReply: true })
    : await interaction.reply({ embeds: [startEmbed], components: [startRow], fetchReply: true });
  const col = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 25000,
  });
  col.on('collect', async (i) => {
    if (i.user.id !== interaction.user.id) return;
    col.stop('started');
    await nextRound(i);
  });
}
export async function handleScenario(interaction) {
  const story = SCENARIO_STORIES[Math.floor(Math.random() * SCENARIO_STORIES.length)];
  const embed = new EmbedBuilder()
    .setTitle(story.title)
    .setDescription(
      `${story.intro}\n\n` +
      `**Que décidez-vous de faire ?**\n` +
      story.choices.map((c, i) => `${i + 1}️⃣ *${c.text}*`).join('\n')
    )
    .setColor(0xff9800)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Aventure Narrative Otaku' })
    .setTimestamp();
  const row = new ActionRowBuilder();
  story.choices.forEach((c, idx) => {
    row.addComponents(
      new ButtonBuilder().setCustomId(`scen_opt_${idx}`).setLabel(`Choix ${idx + 1}`).setStyle(ButtonStyle.Primary)
    );
  });
  const reply = interaction.replied || interaction.deferred
    ? await interaction.followUp({ embeds: [embed], components: [row], fetchReply: true })
    : await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 40000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) {
      return btnInt.reply({ content: '❌ C\'est l\'aventure d\'un autre joueur !', flags: MessageFlags.Ephemeral });
    }
    const idx = parseInt(btnInt.customId.replace('scen_opt_', ''), 10);
    const chosen = story.choices[idx];
    collector.stop('chosen');
    const outcomeEmbed = new EmbedBuilder()
      .setTitle(`📜 Dénouement : ${chosen.outcome === 'heroic' ? 'Victoire Héroïque !' : chosen.outcome === 'safe' ? 'Mission Réussie !' : 'Péripétie Imprévue !'}`)
      .setDescription(
        `${chosen.msg}\n\n` +
        `⭐ **+${chosen.bonus} points Party** accordés pour votre décision stratégique !`
      )
      .setColor(chosen.outcome === 'heroic' ? config.colors.success : chosen.outcome === 'safe' ? config.colors.primary : config.colors.warning)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    await recordPartyGameResult(interaction.guildId, btnInt.user.id, btnInt.user.username, chosen.bonus, true, 'Scénario', {
      guild: interaction.guild,
      member: interaction.member,
    });
    await btnInt.update({ embeds: [outcomeEmbed], components: [] });
  });
}
export async function handleAssociation(interaction) {
  const set = ASSOCIATION_SETS[Math.floor(Math.random() * ASSOCIATION_SETS.length)];
  const item = set.items[Math.floor(Math.random() * set.items.length)];
  const pool = set.items.filter((i) => i.key !== item.key).map((i) => i.val);
  const options = [item.val, ...pool].sort(() => Math.random() - 0.5);
  const embed = new EmbedBuilder()
    .setTitle(`🔗 Association Otaku — ${set.title}`)
    .setDescription(
      `Quel élément correspond exactement à :\n# **${item.key}** ?\n\n` +
      `Faites la bonne liaison ci-dessous !`
    )
    .setColor(config.colors.primary)
    .setFooter({ text: 'Codé avec ❤️ par Saez' });
  const row = new ActionRowBuilder();
  options.forEach((opt, idx) => {
    row.addComponents(new ButtonBuilder().setCustomId(`ass_opt_${idx}`).setLabel(opt).setStyle(ButtonStyle.Primary));
  });
  const reply = interaction.replied || interaction.deferred
    ? await interaction.followUp({ embeds: [embed], components: [row], fetchReply: true })
    : await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 25000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) return;
    const selected = options[parseInt(btnInt.customId.replace('ass_opt_', ''), 10)];
    const isCorrect = selected === item.val;
    collector.stop('answered');
    const result = new EmbedBuilder()
      .setTitle(isCorrect ? '🎉 Association Parfaite !' : '❌ Mauvaise liaison !')
      .setDescription(
        isCorrect
          ? `Bravo ! **${item.key}** est bien associé à **${item.val}** !\n⭐ **+15 points Party** !`
          : `Non, **${item.key}** était associé à **${item.val}**.`
      )
      .setColor(isCorrect ? config.colors.success : config.colors.accent)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (isCorrect) {
      await recordPartyGameResult(interaction.guildId, btnInt.user.id, btnInt.user.username, 15, true, 'Association');
    }
    await btnInt.update({ embeds: [result], components: [] });
  });
}
export async function handleQuiSuisJe(interaction) {
  return handleDevinePersonnage(interaction);
}
export async function handleImposteur(interaction) {
  const secret = 'One Piece';
  const impostorSecret = 'Fairy Tail';
  const embed = new EmbedBuilder()
    .setTitle('🕵️ Jeu de l\'Imposteur Otaku')
    .setDescription(
      `Le jeu de l'imposteur teste votre capacité de bluff et de déduction !\n\n` +
      `• Tous les joueurs reçoivent le même mot secret d'anime.\n` +
      `• **Un seul joueur infiltré (l'imposteur)** reçoit un mot différent très proche !\n` +
      `• Chacun donne un indice tour à tour sans révéler son mot.\n` +
      `• Les joueurs votent ensuite pour éliminer le suspect !\n\n` +
      `Cliquez sur le bouton ci-dessous pour voir votre mot secret en privé.`
    )
    .setColor(0xe91e63)
    .setFooter({ text: 'Codé avec ❤️ par Saez' });
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('imp_reveal').setLabel('Voir mon mot secret (Éphémère)').setEmoji('🔒').setStyle(ButtonStyle.Primary)
  );
  const reply = interaction.replied || interaction.deferred
    ? await interaction.followUp({ embeds: [embed], components: [row], fetchReply: true })
    : await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60000,
  });
  collector.on('collect', async (btnInt) => {
    const isImpostor = Math.random() < 0.25;
    const word = isImpostor ? impostorSecret : secret;
    await btnInt.reply({
      content: `🔒 **Votre mot secret est :** \`${word}\`\n${isImpostor ? '⚠️ **VOUS ÊTES L\'IMPOSTEUR !** Bluffez pour ne pas vous faire démasquer !' : '✨ Vous êtes un membre légitime. Trouvez qui bluffe !'}`,
      flags: MessageFlags.Ephemeral,
    });
  });
}
export async function handleMotInterdit(interaction) {
  const card = MOT_INTERDIT_CARDS[Math.floor(Math.random() * MOT_INTERDIT_CARDS.length)];
  const embed = new EmbedBuilder()
    .setTitle('🚫 Défi du Mot Interdit (Taboo Anime)')
    .setDescription(
      `Faites deviner ce personnage à vos compagnons de salon **SANS JAMAIS PRONONCER** les 5 mots tabous !\n\n` +
      `🎯 **Personnage cible :** # **${card.target}**\n\n` +
      `⛔ **Mots strictement interdits :**\n` +
      card.forbidden.map((f) => `• ❌ \`${f}\``).join('\n') +
      `\n\n💡 **Indice pour le salon :** *"${card.hint}"*`
    )
    .setColor(config.colors.warning)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Jeu de Communication' });
  await interaction.reply({ embeds: [embed] });
}
export async function handleImageMystere(interaction) {
  return handleDevinePersonnage(interaction);
}
