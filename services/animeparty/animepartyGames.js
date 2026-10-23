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
  MOT_INTERDIT_CARDS,
  EXTENDED_QUOTES,
  recordPartyGameResult,
} from '../animePartyService.js';
import { config } from '../../config.js';
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
  const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
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
        (isCorrect
          ? `Bravo ${btnInt.user} ! Il s'agissait bien de l'anime **${item.anime}** !\n` +
            `🎵 Morceau : *${item.title}* de ${item.artist} (${item.type})\n\n` +
            `⭐ **+15 points Anime Party** ajoutés à votre profil !`
          : `Dommage ${btnInt.user} ! Vous avez choisi **${chosenAnime}**.\n` +
            `👉 La bonne réponse était **${item.anime}** (*${item.title}* de ${item.artist}).`)
      )
      .setColor(isCorrect ? config.colors.success : config.colors.accent)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Session terminée' })
      .setTimestamp();
    if (isCorrect) {
      await recordPartyGameResult(interaction.guildId, btnInt.user.id, btnInt.user.username, 15, true, 'Blindtest');
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
export async function handleDevinePersonnage(interaction) {
  const item = DEVINE_PERSO_DATA[Math.floor(Math.random() * DEVINE_PERSO_DATA.length)];
  let clueIndex = 1;
  function buildEmbed() {
    const revealedClues = item.clues.slice(0, clueIndex).join('\n');
    return new EmbedBuilder()
      .setTitle(`🕵️ Qui est ce Personnage d'Anime ? (Indice ${clueIndex}/${item.clues.length})`)
      .setDescription(
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
        .setLabel('🔍 Indice suivant')
        .setEmoji('💡')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled || clueIndex >= item.clues.length)
    );
    return [row1, row2];
  }
  const reply = await interaction.reply({
    embeds: [buildEmbed()],
    components: buildButtons(),
    fetchReply: true,
  });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 45000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) {
      return btnInt.reply({
        content: '❌ Seul l\'auteur de la commande peut jouer cette session.',
        flags: MessageFlags.Ephemeral,
      });
    }
    if (btnInt.customId === 'dp_next_clue') {
      if (clueIndex < item.clues.length) clueIndex++;
      return btnInt.update({ embeds: [buildEmbed()], components: buildButtons() });
    }
    const selectedIdx = parseInt(btnInt.customId.replace('dp_opt_', ''), 10);
    const chosenPerso = item.options[selectedIdx];
    const isCorrect = chosenPerso === item.perso;
    const points = Math.max(10, 30 - (clueIndex - 1) * 8);
    collector.stop('answered');
    const resultEmbed = new EmbedBuilder()
      .setTitle(isCorrect ? '🎉 Félicitations, vous avez trouvé !' : '❌ Perdu !')
      .setDescription(
        isCorrect
          ? `C'était bien **${item.perso}** de l'anime *« ${item.anime} »* !\n` +
            `🎯 Trouvé en **${clueIndex} indice(s)**.\n` +
            `⭐ **+${points} points Anime Party** ajoutés à votre profil !`
          : `Ce n'était pas ${chosenPerso} !\n👉 Le personnage mystère était **${item.perso}** (*${item.anime}*).`
      )
      .setColor(isCorrect ? config.colors.success : config.colors.accent)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Fiche personnage' })
      .setTimestamp();
    if (isCorrect) {
      await recordPartyGameResult(interaction.guildId, btnInt.user.id, btnInt.user.username, points, true, 'Devine-Perso');
    }
    await btnInt.update({ embeds: [resultEmbed], components: [] });
  });
}
export async function handleEmojiChallenge(interaction) {
  const item = EMOJI_CHALLENGES[Math.floor(Math.random() * EMOJI_CHALLENGES.length)];
  const shuffled = [...item.options].sort(() => Math.random() - 0.5);
  const embed = new EmbedBuilder()
    .setTitle('🧩 Emoji Challenge Anime — Quel Anime se cache ici ?')
    .setDescription(
      `Analysez la combinaison d'emojis suivante :\n\n` +
      `# ${item.emojis}\n\n` +
      `⏱️ *Cliquez sur le bon anime dans les 30 secondes !*`
    )
    .setColor(config.colors.primary)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Emoji Challenge' })
    .setTimestamp();
  const row = new ActionRowBuilder();
  const letters = ['A', 'B', 'C', 'D'];
  shuffled.forEach((opt, idx) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`ec_opt_${idx}`)
        .setLabel(`${letters[idx]}. ${opt}`)
        .setStyle(ButtonStyle.Primary)
    );
  });
  const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 30000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) {
      return btnInt.reply({
        content: '❌ Lancez votre propre partie avec `/animeparty jeu emoji-challenge` !',
        flags: MessageFlags.Ephemeral,
      });
    }
    const selectedIdx = parseInt(btnInt.customId.replace('ec_opt_', ''), 10);
    const chosen = shuffled[selectedIdx];
    const isCorrect = chosen === item.answer;
    collector.stop('answered');
    const resultEmbed = new EmbedBuilder()
      .setTitle(isCorrect ? '🎉 Bravo, vision d\'aigle !' : '❌ Raté !')
      .setDescription(
        isCorrect
          ? `Exactement ! Les emojis ${item.emojis} représentaient bien **${item.answer}** !\n` +
            `⭐ **+15 points Anime Party** gagnés !`
          : `Faux ! Vous avez choisi **${chosen}**.\n👉 Les emojis ${item.emojis} décrivaient **${item.answer}**.`
      )
      .setColor(isCorrect ? config.colors.success : config.colors.accent)
      .setFooter({ text: 'Codé avec ❤️ par Saez' })
      .setTimestamp();
    if (isCorrect) {
      await recordPartyGameResult(interaction.guildId, btnInt.user.id, btnInt.user.username, 15, true, 'Emoji-Challenge');
    }
    await btnInt.update({ embeds: [resultEmbed], components: [] });
  });
}
export async function handleAnimePendu(interaction) {
  const chosen = ANIME_PENDU_WORDS[Math.floor(Math.random() * ANIME_PENDU_WORDS.length)];
  const rawWord = chosen.word.toUpperCase();
  const lettersGuessed = new Set();
  let mistakes = 0;
  const maxMistakes = 6;
  const HANGMAN_ASCII = [
    '```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========\n```',
    '```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========\n```',
    '```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========\n```',
    '```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========\n```',
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========\n```',
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========\n```',
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========\n```',
  ];
  function getMaskedDisplay() {
    let masked = '';
    for (const char of rawWord) {
      if (char === ' ' || char === '\'' || char === '-' || char === ':') {
        masked += '   ';
      } else if (lettersGuessed.has(char)) {
        masked += `${char} `;
      } else {
        masked += '_ ';
      }
    }
    return masked.trim();
  }
  function isWordComplete() {
    for (const char of rawWord) {
      if (/[A-Z]/.test(char) && !lettersGuessed.has(char)) {
        return false;
      }
    }
    return true;
  }
  function buildEmbed() {
    return new EmbedBuilder()
      .setTitle('🪢 Anime Pendu — Retrouvez le Titre Mystère')
      .setDescription(
        `${HANGMAN_ASCII[mistakes]}\n\n` +
        `**Titre à deviner :**\n# \`${getMaskedDisplay()}\`\n\n` +
        `💡 **Indice thématique :** *${chosen.hint}*\n\n` +
        `❤️ **Erreurs :** ${mistakes}/${maxMistakes} | **Lettres essayées :** ${Array.from(lettersGuessed).join(', ') || '*Aucune*'}\n` +
        `📝 *Utilisez le menu déroulant ci-dessous pour proposer une lettre !*`
      )
      .setColor(mistakes >= 5 ? config.colors.accent : config.colors.primary)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Pendu Otaku' })
      .setTimestamp();
  }
  function buildSelectRow() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const available = alphabet.filter((l) => !lettersGuessed.has(l));
    const options = available.slice(0, 25).map((l) => ({
      label: `Lettre ${l}`,
      value: l,
      emoji: '🔤',
    }));
    const menu = new StringSelectMenuBuilder()
      .setCustomId('pendu_select_letter')
      .setPlaceholder(available.length > 0 ? '👉 Choisissez une lettre...' : 'Plus de lettres disponibles')
      .setDisabled(available.length === 0 || mistakes >= maxMistakes)
      .addOptions(options);
    return new ActionRowBuilder().addComponents(menu);
  }
  const reply = await interaction.reply({
    embeds: [buildEmbed()],
    components: [buildSelectRow()],
    fetchReply: true,
  });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 90000,
  });
  collector.on('collect', async (selectInt) => {
    if (selectInt.user.id !== interaction.user.id) {
      return selectInt.reply({
        content: '❌ Cette partie de pendu appartient à quelqu\'un d\'autre.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const chosenLetter = selectInt.values[0];
    lettersGuessed.add(chosenLetter);
    if (!rawWord.includes(chosenLetter)) {
      mistakes++;
    }
    if (isWordComplete()) {
      collector.stop('won');
      const winEmbed = new EmbedBuilder()
        .setTitle('🎉 VICTOIRE ! Vous avez sauvé le personnage !')
        .setDescription(
          `Vous avez brillamment deviné le titre : **${rawWord}** !\n` +
          `❤️ Erreurs commises : ${mistakes}/${maxMistakes}\n\n` +
          `⭐ **+25 points Anime Party** crédités sur votre profil !`
        )
        .setColor(config.colors.success)
        .setFooter({ text: 'Codé avec ❤️ par Saez' })
        .setTimestamp();
      await recordPartyGameResult(interaction.guildId, selectInt.user.id, selectInt.user.username, 25, true, 'Pendu');
      return selectInt.update({ embeds: [winEmbed], components: [] });
    }
    if (mistakes >= maxMistakes) {
      collector.stop('lost');
      const loseEmbed = new EmbedBuilder()
        .setTitle('💀 PENDU ! Vous avez manqué d\'essais.')
        .setDescription(
          `${HANGMAN_ASCII[6]}\n\n` +
          `Le titre complet à deviner était : **${rawWord}**.\n` +
          `*Ne baissez pas les bras, retentez votre chance !*`
        )
        .setColor(config.colors.accent)
        .setFooter({ text: 'Codé avec ❤️ par Saez' })
        .setTimestamp();
      return selectInt.update({ embeds: [loseEmbed], components: [] });
    }
    await selectInt.update({ embeds: [buildEmbed()], components: [buildSelectRow()] });
  });
}
export async function handleVraiOuFaux(interaction) {
  const item = VRAI_OU_FAUX_DATA[Math.floor(Math.random() * VRAI_OU_FAUX_DATA.length)];
  const embed = new EmbedBuilder()
    .setTitle('⚖️ Vrai ou Faux Anime — Testez votre Culture Otaku')
    .setDescription(
      `**Affirmation :**\n> *" ${item.q} "*\n\n` +
      `*Pensez-vous que cette affirmation est vraie ou fausse ?*\n` +
      `⏱️ *30 secondes pour voter avec les boutons ci-dessous.*`
    )
    .setColor(config.colors.primary)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Vrai ou Faux' })
    .setTimestamp();
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('vof_true').setLabel('🟢 VRAI').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('vof_false').setLabel('🔴 FAUX').setStyle(ButtonStyle.Danger)
  );
  const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 30000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) {
      return btnInt.reply({
        content: '❌ Lancez votre propre affirmation avec `/animeparty jeu vrai-ou-faux` !',
        flags: MessageFlags.Ephemeral,
      });
    }
    const userAns = btnInt.customId === 'vof_true';
    const isCorrect = userAns === item.ans;
    collector.stop('answered');
    const resultEmbed = new EmbedBuilder()
      .setTitle(isCorrect ? '✅ Réponse Exacte !' : '❌ Faux pas !')
      .setDescription(
        `**Votre réponse :** ${userAns ? '🟢 VRAI' : '🔴 FAUX'}\n\n` +
        `**Explication officielle :**\n${item.expl}\n\n` +
        (isCorrect ? `⭐ **+10 points Anime Party** crédités !` : `*Aucun point remporté pour cette question.*`)
      )
      .setColor(isCorrect ? config.colors.success : config.colors.accent)
      .setFooter({ text: 'Codé avec ❤️ par Saez' })
      .setTimestamp();
    if (isCorrect) {
      await recordPartyGameResult(interaction.guildId, btnInt.user.id, btnInt.user.username, 10, true, 'Vrai-Faux');
    }
    await btnInt.update({ embeds: [resultEmbed], components: [] });
  });
}
export async function handleDevineReplique(interaction) {
  const item = EXTENDED_QUOTES[Math.floor(Math.random() * EXTENDED_QUOTES.length)];
  const pool = Array.from(new Set(EXTENDED_QUOTES.map((q) => q.character))).filter((c) => c !== item.character);
  const shuffledChoices = [item.character, ...pool.slice(0, 3)].sort(() => Math.random() - 0.5);
  const embed = new EmbedBuilder()
    .setTitle('🗣️ Devine la Réplique — Qui a prononcé cette phrase ?')
    .setDescription(
      `💬 **Citation culte :**\n> *« ${item.quote} »*\n\n` +
      `🎬 **Indice (Anime) :** *${item.anime}*\n\n` +
      `*Sélectionnez l'auteur de cette réplique ci-dessous :*`
    )
    .setColor(config.colors.primary)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Citations Légendaires' })
    .setTimestamp();
  const row = new ActionRowBuilder();
  const letters = ['A', 'B', 'C', 'D'];
  shuffledChoices.forEach((char, idx) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`dr_opt_${idx}`)
        .setLabel(`${letters[idx]}. ${char}`)
        .setStyle(ButtonStyle.Primary)
    );
  });
  const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 30000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) {
      return btnInt.reply({ content: '❌ Cette session appartient à un autre joueur.', flags: MessageFlags.Ephemeral });
    }
    const selected = shuffledChoices[parseInt(btnInt.customId.replace('dr_opt_', ''), 10)];
    const isCorrect = selected === item.character;
    collector.stop('answered');
    const resEmbed = new EmbedBuilder()
      .setTitle(isCorrect ? '🎉 Parfaite Maîtrise des Répliques !' : '❌ Mauvaise Déduction !')
      .setDescription(
        isCorrect
          ? `C'est bien **${item.character}** dans *« ${item.anime} »* !\n` +
            `📖 Contexte : *${item.context}*\n\n` +
            `⭐ **+15 points Anime Party** crédités !`
          : `Ce n'était pas ${selected} !\n👉 Cette phrase mythique a été prononcée par **${item.character}** (*${item.anime}*).`
      )
      .setColor(isCorrect ? config.colors.success : config.colors.accent)
      .setFooter({ text: 'Codé avec ❤️ par Saez' })
      .setTimestamp();
    if (isCorrect) {
      await recordPartyGameResult(interaction.guildId, btnInt.user.id, btnInt.user.username, 15, true, 'Devine-Replique');
    }
    await btnInt.update({ embeds: [resEmbed], components: [] });
  });
}
export async function handleMotInterdit(interaction) {
  const card = MOT_INTERDIT_CARDS[Math.floor(Math.random() * MOT_INTERDIT_CARDS.length)];
  const publicEmbed = new EmbedBuilder()
    .setTitle('🚫 Défi Mot Interdit (Taboo Anime) Lancé !')
    .setDescription(
      `🎯 **${interaction.user}** a reçu en secret le personnage mystère et ses mots interdits !\n\n` +
      `💡 **Indice public pour les participants :**\n> *"${card.hint}"*\n\n` +
      `📢 **Règles :** ${interaction.user} doit faire deviner le personnage dans ce salon SANS JAMAIS utiliser les 5 mots tabous reçus dans son message secret !`
    )
    .setColor(config.colors.warning)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Taboo Anime Social' })
    .setTimestamp();
  await interaction.reply({ embeds: [publicEmbed] });
  const privateEmbed = new EmbedBuilder()
    .setTitle('🤫 Vos Informations Secrètes (Ne montrez à personne !)')
    .setDescription(
      `🎯 **Personnage à faire deviner :**\n# **${card.target}**\n\n` +
      `🚫 **MOTS STRICTEMENT INTERDITS (Pénalité si prononcés) :**\n` +
      card.forbidden.map((w) => `• ❌ \`${w}\``).join('\n') +
      `\n\n💬 *Envoyez vos explications dans le salon textuel en évitant ces mots à tout prix !*`
    )
    .setColor(config.colors.accent)
    .setFooter({ text: 'Codé avec ❤️ par Saez' });
  await interaction.followUp({ embeds: [privateEmbed], flags: MessageFlags.Ephemeral });
}
export async function handleAssociation(interaction) {
  const set = ASSOCIATION_SETS[Math.floor(Math.random() * ASSOCIATION_SETS.length)];
  const correctPairs = set.items;
  const shuffledValues = [...correctPairs.map((p) => p.val)].sort(() => Math.random() - 0.5);
  const embed = new EmbedBuilder()
    .setTitle(`🔗 Mini-Jeu Association : ${set.title}`)
    .setDescription(
      `Pour remporter cette épreuve, associez correctement le premier élément : **${correctPairs[0].key}** !\n\n` +
      `*Quel est le bon élément correspondant dans la liste ci-dessous ?*`
    )
    .setColor(config.colors.primary)
    .setFooter({ text: 'Codé avec ❤️ par Saez' })
    .setTimestamp();
  const row = new ActionRowBuilder();
  shuffledValues.forEach((val, idx) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`assoc_opt_${idx}`)
        .setLabel(val)
        .setStyle(ButtonStyle.Primary)
    );
  });
  const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 30000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) {
      return btnInt.reply({ content: '❌ Session réservée à l\'auteur.', flags: MessageFlags.Ephemeral });
    }
    const selectedVal = shuffledValues[parseInt(btnInt.customId.replace('assoc_opt_', ''), 10)];
    const isCorrect = selectedVal === correctPairs[0].val;
    collector.stop('answered');
    const resEmbed = new EmbedBuilder()
      .setTitle(isCorrect ? '🎉 Association Parfaite !' : '❌ Erreur de Liaison !')
      .setDescription(
        isCorrect
          ? `Exact ! **${correctPairs[0].key}** correspond bien à **${correctPairs[0].val}** !\n\n` +
            `⭐ **+15 points Anime Party** crédités !`
          : `Faux ! L'élément correct pour **${correctPairs[0].key}** était **${correctPairs[0].val}**.`
      )
      .setColor(isCorrect ? config.colors.success : config.colors.accent)
      .setFooter({ text: 'Codé avec ❤️ par Saez' })
      .setTimestamp();
    if (isCorrect) {
      await recordPartyGameResult(interaction.guildId, btnInt.user.id, btnInt.user.username, 15, true, 'Association');
    }
    await btnInt.update({ embeds: [resEmbed], components: [] });
  });
}
export async function handleDevineAnime(interaction) {
  const ANIME_CLUES_DATA = [
    {
      title: 'Steins;Gate',
      year: 2011,
      studio: 'White Fox',
      genre: 'Sci-Fi, Thriller Psychologique',
      clues: [
        '1️⃣ Cet anime met en scène un micro-ondes modifié et des bananes gélatineuses.',
        '2️⃣ Le protagoniste se fait appeler un "savant fou" nommé Kyoma Hououin.',
        '3️⃣ L\'histoire explore la ligne d\'univers Alpha, Beta et la machine à envoyer des D-Mails dans le passé.',
      ],
      options: ['Steins;Gate', 'Erased', 'Serial Experiments Lain', 'Psycho-Pass'],
    },
    {
      title: 'Frieren: Beyond Journey\'s End',
      year: 2023,
      studio: 'Madhouse',
      genre: 'Fantasy, Tranche de vie, Aventure',
      clues: [
        '1️⃣ L\'histoire commence APRÈS la défaite du Roi Démon par le groupe de héros.',
        '2️⃣ L\'héroïne est une magicienne elfe qui vit des milliers d\'années et regrette de ne pas avoir appris à connaître ses compagnons.',
        '3️⃣ Elle voyage vers le nord avec Fern et Stark pour atteindre le paradis des âmes.',
      ],
      options: ['Frieren: Beyond Journey\'s End', 'Mushoku Tensei', 'Sousou no Frieren', 'Made in Abyss'],
    },
    {
      title: 'Chainsaw Man',
      year: 2022,
      studio: 'MAPPA',
      genre: 'Action, Horreur, Dark Fantasy',
      clues: [
        '1️⃣ Le protagoniste vend ses organes et vit dans la misère pour rembourser les dettes de son père envers les yakuzas.',
        '2️⃣ Il a fusionné avec son chien démon qui possède une lame sur le museau.',
        '3️⃣ Son rêve le plus cher est simplement de manger des tartines avec de la confiture et de serrer une femme dans ses bras.',
      ],
      options: ['Chainsaw Man', 'Jujutsu Kaisen', 'Dorohedoro', 'Tokyo Ghoul'],
    },
  ];
  const item = ANIME_CLUES_DATA[Math.floor(Math.random() * ANIME_CLUES_DATA.length)];
  let clueStep = 1;
  function buildEmbed() {
    return new EmbedBuilder()
      .setTitle(`🎬 Devine l'Anime — Indice ${clueStep}/${item.clues.length}`)
      .setDescription(
        `**Genres :** \`${item.genre}\` | **Année :** \`${item.year}\`\n\n` +
        `**Indices découverts :**\n${item.clues.slice(0, clueStep).join('\n\n')}\n\n` +
        `💡 *Répondez correctement pour remporter jusqu'à 30 points !*`
      )
      .setColor(config.colors.primary)
      .setFooter({ text: 'Codé avec ❤️ par Saez' })
      .setTimestamp();
  }
  function buildRows(disabled = false) {
    const row1 = new ActionRowBuilder();
    item.options.forEach((opt, idx) => {
      row1.addComponents(
        new ButtonBuilder()
          .setCustomId(`da_opt_${idx}`)
          .setLabel(opt)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(disabled)
      );
    });
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('da_next')
        .setLabel('🔍 Indice suivant')
        .setEmoji('💡')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled || clueStep >= item.clues.length)
    );
    return [row1, row2];
  }
  const reply = await interaction.reply({ embeds: [buildEmbed()], components: buildRows(), fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 45000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) {
      return btnInt.reply({ content: '❌ Session réservée à l\'auteur.', flags: MessageFlags.Ephemeral });
    }
    if (btnInt.customId === 'da_next') {
      clueStep++;
      return btnInt.update({ embeds: [buildEmbed()], components: buildRows() });
    }
    const selectedIdx = parseInt(btnInt.customId.replace('da_opt_', ''), 10);
    const chosen = item.options[selectedIdx];
    const isCorrect = chosen === item.title;
    const points = Math.max(10, 30 - (clueStep - 1) * 10);
    collector.stop('answered');
    const resultEmbed = new EmbedBuilder()
      .setTitle(isCorrect ? '🎉 Trouvé ! Quelle Culture Anime !' : '❌ Dommage !')
      .setDescription(
        isCorrect
          ? `L'anime mystère était bien **${item.title}** (${item.studio}, ${item.year}) !\n` +
            `⭐ **+${points} points Anime Party** crédités !`
          : `Ce n'était pas ${chosen} !\n👉 La bonne réponse était **${item.title}**.`
      )
      .setColor(isCorrect ? config.colors.success : config.colors.accent)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (isCorrect) {
      await recordPartyGameResult(interaction.guildId, btnInt.user.id, btnInt.user.username, points, true, 'Devine-Anime');
    }
    await btnInt.update({ embeds: [resultEmbed], components: [] });
  });
}
export async function handleImageMystere(interaction) {
  const IMAGES_DATA = [
    {
      perso: 'Goku (Dragon Ball)',
      imgUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
      hint: 'Guerrier Saiyan envoyé sur Terre enfant, friand de combat et de festins gargantuesques.',
      options: ['Goku', 'Vegeta', 'Gohan', 'Bardock'],
    },
    {
      perso: 'Luffy (One Piece)',
      imgUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
      hint: 'Capitaine aux mille facettes ayant éveillé le légendaire guerrier de la libération Nika.',
      options: ['Luffy', 'Ace', 'Sabo', 'Zoro'],
    },
  ];
  const item = IMAGES_DATA[Math.floor(Math.random() * IMAGES_DATA.length)];
  const embed = new EmbedBuilder()
    .setTitle('🖼️ Image Mystère — Qui est ce Personnage ?')
    .setDescription(
      `💡 **Indice descriptif :**\n> *"${item.hint}"*\n\n` +
      `⏱️ *Choisissez votre réponse parmi les options ci-dessous dans les 30 secondes !*`
    )
    .setImage(item.imgUrl)
    .setColor(config.colors.primary)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Image & Silhouette Challenge' })
    .setTimestamp();
  const row = new ActionRowBuilder();
  item.options.forEach((opt, idx) => {
    row.addComponents(
      new ButtonBuilder().setCustomId(`im_opt_${idx}`).setLabel(opt).setStyle(ButtonStyle.Primary)
    );
  });
  const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 30000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) {
      return btnInt.reply({ content: '❌ Session réservée à l\'auteur.', flags: MessageFlags.Ephemeral });
    }
    const chosen = item.options[parseInt(btnInt.customId.replace('im_opt_', ''), 10)];
    const isCorrect = item.perso.startsWith(chosen);
    collector.stop('answered');
    const resEmbed = new EmbedBuilder()
      .setTitle(isCorrect ? '🎉 Image Identifiée avec Succès !' : '❌ Erreur d\'Analyse !')
      .setDescription(
        isCorrect
          ? `Bravo ! Il s'agissait bien de **${item.perso}** !\n\n⭐ **+15 points Anime Party** crédités !`
          : `Mauvaise pioche ! Le personnage mystère était **${item.perso}**.`
      )
      .setColor(isCorrect ? config.colors.success : config.colors.accent)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (isCorrect) {
      await recordPartyGameResult(interaction.guildId, btnInt.user.id, btnInt.user.username, 15, true, 'Image-Mystere');
    }
    await btnInt.update({ embeds: [resEmbed], components: [] });
  });
}
export async function handleQuiSuisJe(interaction) {
  const SECRET_CHARACTERS = [
    { name: 'Dracule Mihawk', clues: ['Plus grand épéiste du monde', 'Yeux de faucon dorés', 'Ancien Grand Corsaire'] },
    { name: 'Toji Fushiguro', clues: ['Tueur d\'exorcistes sans énergie occulte', 'Père de Megumi', 'Restriction céleste pure'] },
    { name: 'Roy Mustang', clues: ['Alchimiste de Flammes', 'Gant pyrogène spécial', 'Colonel cherchant à devenir Führer'] },
    { name: 'Kurapika', clues: ['Dernier survivant du clan Kurta', 'Chaînes de Nen spécialisées', 'Yeux écarlates'] },
  ];
  const chosen = SECRET_CHARACTERS[Math.floor(Math.random() * SECRET_CHARACTERS.length)];
  const embed = new EmbedBuilder()
    .setTitle('🎭 Qui Suis-Je ? — Devinez le Personnage Secret !')
    .setDescription(
      `Un personnage mystère a été assigné au salon !\n\n` +
      `🔍 **Indices connus :**\n` +
      chosen.clues.map((c, i) => `• Indice ${i + 1} : *${c}*`).join('\n') +
      `\n\n💬 *Posez vos questions ou tapez votre déduction directement dans ce salon !*`
    )
    .setColor(config.colors.primary)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party • Enquête Collective' })
    .setTimestamp();
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('qsj_reveal').setLabel('👁️ Révéler la Solution').setStyle(ButtonStyle.Secondary)
  );
  const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.customId === 'qsj_reveal') {
      const solutionEmbed = new EmbedBuilder()
        .setTitle('🎭 Solution du Qui Suis-Je')
        .setDescription(`Le personnage mystère était : **${chosen.name}** !\n\n*Merci d'avoir joué !*`)
        .setColor(config.colors.success)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      await btnInt.update({ embeds: [solutionEmbed], components: [] });
      collector.stop('revealed');
    }
  });
}
export async function handleImposteur(interaction) {
  const WORD_PAIRS = [
    { regular: 'One Piece', impostor: 'Fairy Tail', hint: 'Pirates et Magie' },
    { regular: 'Jujutsu Kaisen', impostor: 'Bleach', hint: 'Fléaux et Shinigamis' },
    { regular: 'Naruto', impostor: 'Hunter x Hunter', hint: 'Ninjas et Chasseurs' },
  ];
  const pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
  const startEmbed = new EmbedBuilder()
    .setTitle('🕵️ L\'Imposteur Otaku — Inscription des Joueurs (Min 3)')
    .setDescription(
      `Dans ce jeu social :\n` +
      `• Tous les participants recevront en message secret le **même anime**.\n` +
      `• Mais un **IMPOSTEUR** secret recevra un anime différent !\n\n` +
      `Chacun donnera à tour de rôle un mot-clé pour décrire son œuvre sans se faire griller !\n\n` +
      `**Cliquez sur "Rejoindre l\'Infiltration" (3 à 8 joueurs requis).**`
    )
    .setColor(config.colors.warning)
    .setFooter({ text: 'Codé avec ❤️ par Saez' })
    .setTimestamp();
  const players = new Set([interaction.user.id]);
  function getButtons() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('imp_join').setLabel(`Rejoindre (${players.size}/8)`).setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('imp_start').setLabel('🚀 Distribuer les rôles').setStyle(ButtonStyle.Primary)
    );
  }
  const reply = await interaction.reply({ embeds: [startEmbed], components: [getButtons()], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.customId === 'imp_join') {
      players.add(btnInt.user.id);
      return btnInt.update({ components: [getButtons()] });
    }
    if (btnInt.customId === 'imp_start') {
      if (btnInt.user.id !== interaction.user.id) {
        return btnInt.reply({ content: '❌ Seul l\'hôte peut démarrer la distribution.', flags: MessageFlags.Ephemeral });
      }
      if (players.size < 3) {
        return btnInt.reply({ content: '⚠️ Il faut au moins 3 joueurs pour lancer l\'Imposteur !', flags: MessageFlags.Ephemeral });
      }
      collector.stop('started');
      const playerArr = Array.from(players);
      const impostorId = playerArr[Math.floor(Math.random() * playerArr.length)];
      const startedEmbed = new EmbedBuilder()
        .setTitle('🕵️ Rôles Distribués ! La Traque Commence !')
        .setDescription(
          `Les **${playerArr.length} joueurs** ont reçu leur consigne secrète en message privé !\n\n` +
          `🗣️ **Débat :** Chaque joueur donne à son tour un mot lié à son œuvre.\n` +
          `🗳️ À la fin du tour, votez pour démasquer l'imposteur !`
        )
        .setColor(config.colors.accent)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      await btnInt.update({ embeds: [startedEmbed], components: [] });
      for (const pId of playerArr) {
        try {
          const user = await interaction.client.users.fetch(pId);
          const isImpostor = pId === impostorId;
          const secretWord = isImpostor ? pair.impostor : pair.regular;
          await user.send({
            embeds: [
              new EmbedBuilder()
                .setTitle(isImpostor ? '😈 VOUS ÊTES L\'IMPOSTEUR !' : '🛡️ Vous êtes un Détective Innocent !')
                .setDescription(
                  `Votre mot anime secret : **« ${secretWord} »**\n\n` +
                  (isImpostor
                    ? `⚠️ *Vous avez un mot différent des autres ! Bluffez et devinez le mot des innocents sans éveiller les soupçons !*`
                    : `Démasquez l'imposteur parmi vous sans révéler directement votre mot !`)
                )
                .setColor(isImpostor ? 0xff0044 : 0x00e5ff)
                .setFooter({ text: 'Codé avec ❤️ par Saez' })
            ],
          }).catch(() => {});
        } catch {}
      }
    }
  });
}
