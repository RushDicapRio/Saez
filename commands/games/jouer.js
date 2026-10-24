import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { addQuizScore } from '../../services/communityLeaderboardService.js';
const QUIZ_QUESTIONS = [
  {
    q: 'Dans "Jujutsu Kaisen", quel est le nom de l\'extension du territoire de Satoru Gojo ?',
    options: ['Sphère Authentique', 'Infini Vivant', 'Sphère de l\'Espace Infini', 'Jardin d\'Ombres Chimériques'],
    correct: 2,
    theme: 'Jujutsu Kaisen',
  },
  {
    q: 'Combien de formes de respiration de l\'eau Tanjiro maîtrise-t-il dans "Demon Slayer" ?',
    options: ['8', '10', '11', '12'],
    correct: 1,
    theme: 'Demon Slayer',
  },
  {
    q: 'Dans "One Piece", comment s\'appelle l\'épée légendaire noire de Mihawk ?',
    options: ['Shusui', 'Wado Ichimonji', 'Yoru', 'Enma'],
    correct: 2,
    theme: 'One Piece',
  },
  {
    q: 'Quel est le vrai nom de L dans "Death Note" ?',
    options: ['L Lawliet', 'Light Yagami', 'Near River', 'Mello Mihael'],
    correct: 0,
    theme: 'Death Note',
  },
  {
    q: 'Dans "Naruto", quel membre de l\'Akatsuki possède 5 cœurs ?',
    options: ['Sasori', 'Hidan', 'Kakuzu', 'Kisame'],
    correct: 2,
    theme: 'Naruto',
  },
  {
    q: 'Dans "L\'Attaque des Titans", quel titan possède le pouvoir de voir les souvenirs des futurs possesseurs ?',
    options: ['Le Titan Cuirassé', 'Le Titan Assaillant', 'Le Titan Marteau', 'Le Titan Colossal'],
    correct: 1,
    theme: 'SNK',
  },
  {
    q: 'Dans "Solo Leveling", quel est le nom du premier boss monarque affronté par Sung Jin-woo dans la double donjon ?',
    options: ['Igris', 'Statue de Dieu', 'Beru', 'Kamish'],
    correct: 1,
    theme: 'Solo Leveling',
  },
  {
    q: 'Dans "Fullmetal Alchemist: Brotherhood", quel est le nom du créateur des Homunculus ?',
    options: ['Van Hohenheim', 'Père (Father)', 'Roy Mustang', 'Bradley'],
    correct: 1,
    theme: 'Fullmetal Alchemist',
  },
];
const WORDS = [
  { word: 'SUKUNA', hint: 'Roi des Fléaux à 4 bras (Jujutsu Kaisen)' },
  { word: 'LUFFY', hint: 'Capitaine au chapeau de paille (One Piece)' },
  { word: 'GOKU', hint: 'Guerrier Saiyan protecteur de la Terre (Dragon Ball)' },
  { word: 'ITACHI', hint: 'Prodige du clan Uchiwa sacrifié pour son village (Naruto)' },
  { word: 'LEVI', hint: 'Caporal-chef invincible du Bataillon d\'exploration (SNK)' },
  { word: 'SAITAMA', hint: 'Héros chauve terrassant ses ennemis en un seul coup (OPM)' },
  { word: 'EREN', hint: 'Détenteur du Titan Assaillant en quête de liberté (SNK)' },
  { word: 'NEZUKO', hint: 'Démone voyageant dans une boîte en bois (Demon Slayer)' },
  { word: 'ZORO', hint: 'Épéiste maniant 3 sabres cherchant à devenir le n°1 (One Piece)' },
  { word: 'KILLUA', hint: 'Jeune assassin prodige maniant l\'électricité (HxH)' },
];
export const data = new SlashCommandBuilder()
  .setName('jouer')
  .setDescription('Jeux communautaires et mini-jeux interactifs en direct')
  .addSubcommand((sub) =>
    sub
      .setName('quiz')
      .setDescription('Partie interactive de quiz Otaku & Geek avec scoring en direct')
  )
  .addSubcommand((sub) =>
    sub
      .setName('duel')
      .setDescription('Duel tactique au tour par tour contre un autre membre (Attaque, Défense, Soin, Ultime)')
      .addUserOption((opt) => opt.setName('adversaire').setDescription('Le joueur défié').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('mot-mystere')
      .setDescription('Faites deviner un mot anime lettre par lettre dans le salon')
  )
  .addSubcommand((sub) =>
    sub
      .setName('justeprix')
      .setDescription('Trouver le nombre secret entre 1 et 500 dans le salon')
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'quiz') {
    const q = QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)];
    const row = new ActionRowBuilder().addComponents(
      q.options.map((opt, idx) =>
        new ButtonBuilder()
          .setCustomId(`quiz_opt_${idx}`)
          .setLabel(`${['A', 'B', 'C', 'D'][idx]}. ${opt}`)
          .setStyle(ButtonStyle.Secondary)
      )
    );
    const embed = new EmbedBuilder()
      .setTitle(`🧠 Quiz Otaku — Thème : ${q.theme}`)
      .setDescription(`**${q.q}**\n\n*Cliquez sur votre réponse ci-dessous ! Vous avez 20 secondes.*`)
      .setColor(0x00e5ff)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Système de Jeux Communautaires Saez' })
      .setTimestamp();
    const response = await interaction.reply({ embeds: [embed], components: [row] });
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 20000,
    });
    collector.on('collect', async (i) => {
      const selectedIdx = parseInt(i.customId.replace('quiz_opt_', ''), 10);
      const isCorrect = selectedIdx === q.correct;
      const points = isCorrect ? 50 : 0;
      if (isCorrect) {
        await addQuizScore(i.guild.id, i.user.id, i.user.username, points, true);
      } else {
        await addQuizScore(i.guild.id, i.user.id, i.user.username, 0, false);
      }
      const endRow = new ActionRowBuilder().addComponents(
        q.options.map((opt, idx) =>
          new ButtonBuilder()
            .setCustomId(`quiz_res_${idx}`)
            .setLabel(`${['A', 'B', 'C', 'D'][idx]}. ${opt}`)
            .setStyle(idx === q.correct ? ButtonStyle.Success : idx === selectedIdx ? ButtonStyle.Danger : ButtonStyle.Secondary)
            .setDisabled(true)
        )
      );
      const endEmbed = new EmbedBuilder()
        .setTitle(isCorrect ? '🎉 Bonne Réponse !' : '❌ Mauvaise Réponse !')
        .setDescription(
          isCorrect
            ? `<@${i.user.id}> a trouvé la bonne réponse : **${q.options[q.correct]}** !\n+${points} points ajoutés à son score de quiz !`
            : `<@${i.user.id}> a répondu **${q.options[selectedIdx]}**.\nLa bonne réponse était : **${q.options[q.correct]}**.`
        )
        .setColor(isCorrect ? 0x10b981 : 0xef4444)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Consultez le classement avec /top quiz' })
        .setTimestamp();
      await i.update({ embeds: [endEmbed], components: [endRow] });
      collector.stop('answered');
    });
    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        const timeoutEmbed = new EmbedBuilder()
          .setTitle('⏰ Temps Écoulé !')
          .setDescription(`Personne n'a répondu à temps.\nLa bonne réponse était : **${q.options[q.correct]}**.`)
          .setColor(0x64748b);
        await interaction.editReply({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
      }
    });
  }
  if (sub === 'duel') {
    const challenger = interaction.user;
    const opponent = interaction.options.getUser('adversaire');
    if (opponent.id === challenger.id) {
      return interaction.reply({ content: '❌ Vous ne pouvez pas vous défier vous-même en duel.', ephemeral: true });
    }
    if (opponent.bot) {
      return interaction.reply({ content: '❌ Vous ne pouvez pas défier un bot.', ephemeral: true });
    }
    let p1Hp = 100;
    let p2Hp = 100;
    let p1Shield = 0;
    let p2Shield = 0;
    let p1Ult = 0;
    let p2Ult = 0;
    let currentTurn = challenger.id;
    let battleLog = `⚔️ Le duel commence entre <@${challenger.id}> et <@${opponent.id}> !`;
    const makeRow = (turnId) =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('duel_attack').setLabel('⚔️ Attaque').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('duel_shield').setLabel('🛡️ Bouclier').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('duel_heal').setLabel('🧪 Soin (+20)').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('duel_ult').setLabel(`💥 Ultime (${turnId === challenger.id ? p1Ult : p2Ult}/100)`).setStyle(ButtonStyle.Danger).setDisabled((turnId === challenger.id ? p1Ult : p2Ult) < 100)
      );
    const makeEmbed = () =>
      new EmbedBuilder()
        .setTitle('⚔️ Duel Tactique en Direct')
        .setDescription(`${battleLog}\n\n👉 Tour actuel : <@${currentTurn}>`)
        .setColor(0xec4899)
        .addFields(
          { name: `🛡️ ${challenger.username}`, value: `❤️ PV : **${p1Hp}/100**\n🛡️ Armure : **${p1Shield}**\n⚡ Ultime : **${p1Ult}%**`, inline: true },
          { name: `⚔️ ${opponent.username}`, value: `❤️ PV : **${p2Hp}/100**\n🛡️ Armure : **${p2Shield}**\n⚡ Ultime : **${p2Ult}%**`, inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Duel tactique Saez Animes' });
    const response = await interaction.reply({ embeds: [makeEmbed()], components: [makeRow(currentTurn)] });
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 90000,
    });
    collector.on('collect', async (i) => {
      if (i.user.id !== currentTurn) {
        return i.reply({ content: '⏳ Ce n\'est pas votre tour d\'agir !', ephemeral: true });
      }
      const isP1 = currentTurn === challenger.id;
      const action = i.customId;
      if (action === 'duel_attack') {
        const dmg = Math.floor(Math.random() * 12) + 14;
        if (isP1) {
          const actualDmg = Math.max(1, dmg - p2Shield);
          p2Shield = Math.max(0, p2Shield - Math.floor(dmg / 2));
          p2Hp = Math.max(0, p2Hp - actualDmg);
          p1Ult = Math.min(100, p1Ult + 30);
          battleLog = `⚔️ **${challenger.username}** frappe et inflige **${actualDmg}** dégâts !`;
        } else {
          const actualDmg = Math.max(1, dmg - p1Shield);
          p1Shield = Math.max(0, p1Shield - Math.floor(dmg / 2));
          p1Hp = Math.max(0, p1Hp - actualDmg);
          p2Ult = Math.min(100, p2Ult + 30);
          battleLog = `⚔️ **${opponent.username}** contre-attaque et inflige **${actualDmg}** dégâts !`;
        }
      } else if (action === 'duel_shield') {
        if (isP1) {
          p1Shield += 15;
          battleLog = `🛡️ **${challenger.username}** renforce sa défense (+15 armure) !`;
        } else {
          p2Shield += 15;
          battleLog = `🛡️ **${opponent.username}** lève son bouclier (+15 armure) !`;
        }
      } else if (action === 'duel_heal') {
        if (isP1) {
          p1Hp = Math.min(100, p1Hp + 20);
          battleLog = `🧪 **${challenger.username}** utilise une potion (+20 PV) !`;
        } else {
          p2Hp = Math.min(100, p2Hp + 20);
          battleLog = `🧪 **${opponent.username}** boit un élixir (+20 PV) !`;
        }
      } else if (action === 'duel_ult') {
        const ultDmg = 40;
        if (isP1) {
          p2Hp = Math.max(0, p2Hp - ultDmg);
          p1Ult = 0;
          battleLog = `💥 **${challenger.username} DÉCHAÎNE SON ULTIME** (-40 PV) !`;
        } else {
          p1Hp = Math.max(0, p1Hp - ultDmg);
          p2Ult = 0;
          battleLog = `💥 **${opponent.username} DÉCHAÎNE SON ULTIME** (-40 PV) !`;
        }
      }
      if (p1Hp <= 0 || p2Hp <= 0) {
        const winner = p1Hp > 0 ? challenger : opponent;
        const victoryEmbed = new EmbedBuilder()
          .setTitle(`🏆 Victoire Écrasante de ${winner.username} !`)
          .setDescription(`${battleLog}\n\n🎉 <@${winner.id}> remporte ce duel avec panache !\n+100 points ajoutés au classement des jeux.`)
          .setColor(0xfbbf24)
          .setTimestamp()
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        await addQuizScore(i.guild.id, winner.id, winner.username, 100, true);
        await i.update({ embeds: [victoryEmbed], components: [] });
        return collector.stop('finished');
      }
      currentTurn = isP1 ? opponent.id : challenger.id;
      await i.update({ embeds: [makeEmbed()], components: [makeRow(currentTurn)] });
    });
  }
  if (sub === 'mot-mystere') {
    const item = WORDS[Math.floor(Math.random() * WORDS.length)];
    const word = item.word.toUpperCase();
    const guessedLetters = new Set();
    let attemptsLeft = 7;
    const getMasked = () =>
      word
        .split('')
        .map((l) => (guessedLetters.has(l) ? `\`${l}\`` : '`_`'))
        .join(' ');

    const embed = new EmbedBuilder()
      .setTitle('🧩 Jeu du Mot Mystère — Édition Anime')
      .setDescription(`Devinez le mot secret lettre par lettre ou proposez le mot entier directement dans le chat !\n\nIndice : **${item.hint}**\n\nMot : ${getMasked()}\nTentatives restantes : ❤️ **${attemptsLeft}**`)
      .setColor(0x00e5ff)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Tapez une lettre ou le mot complet dans ce salon' });
    await interaction.reply({ embeds: [embed] });
    const channel = interaction.channel;
    const filter = (m) => !m.author.bot;
    const collector = channel.createMessageCollector({ filter, time: 60000 });
    collector.on('collect', async (msg) => {
      const content = msg.content.trim().toUpperCase();
      if (content === word) {
        collector.stop('won');
        await addQuizScore(interaction.guild.id, msg.author.id, msg.author.username, 75, true);
        return channel.send(`🎉 **Incroyable !** <@${msg.author.id}> a deviné le mot entier : **${word}** ! (+75 pts)`);
      }
      if (content.length === 1 && /[A-Z]/.test(content)) {
        if (guessedLetters.has(content)) {
          return msg.react('⚠️').catch(() => {});
        }
        guessedLetters.add(content);
        if (word.includes(content)) {
          msg.react('✅').catch(() => {});
          const isComplete = word.split('').every((l) => guessedLetters.has(l));
          if (isComplete) {
            collector.stop('won');
            await addQuizScore(interaction.guild.id, msg.author.id, msg.author.username, 50, true);
            return channel.send(`🎉 **Félicitations !** Le mot était bien **${word}** ! Gagné par <@${msg.author.id}> ! (+50 pts)`);
          }
        } else {
          msg.react('❌').catch(() => {});
          attemptsLeft--;
          if (attemptsLeft <= 0) {
            collector.stop('lost');
            return channel.send(`💀 **Partie terminée !** Plus de tentatives restantes. Le mot secret était **${word}**.`);
          }
        }
      }
    });
  }
  if (sub === 'justeprix') {
    const secretNumber = Math.floor(Math.random() * 500) + 1;
    const embed = new EmbedBuilder()
      .setTitle('💰 Le Juste Prix — Spécial Communauté')
      .setDescription('J\'ai choisi un nombre secret entre **1 et 500** !\nTout le monde peut participer : envoyez vos nombres dans ce salon. Vous avez **45 secondes** !')
      .setColor(0xfbbf24)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Indicateurs : ⬆️ Plus grand | ⬇️ Plus petit' });
    await interaction.reply({ embeds: [embed] });
    const channel = interaction.channel;
    const collector = channel.createMessageCollector({ filter: (m) => !m.author.bot, time: 45000 });
    collector.on('collect', async (m) => {
      const guess = parseInt(m.content.trim(), 10);
      if (isNaN(guess)) return;
      if (guess === secretNumber) {
        collector.stop('won');
        await addQuizScore(interaction.guild.id, m.author.id, m.author.username, 80, true);
        return channel.send(`🎉 **BINGO !** <@${m.author.id}> a trouvé le Juste Prix : **${secretNumber}** ! (+80 pts)`);
      } else if (guess < secretNumber) {
        m.react('⬆️').catch(() => {});
      } else {
        m.react('⬇️').catch(() => {});
      }
    });
    collector.on('end', (_, reason) => {
      if (reason === 'time') {
        channel.send(`⏰ **Temps écoulé !** Personne n'a trouvé le juste prix. Le nombre secret était **${secretNumber}**.`);
      }
    });
  }
}
