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
  createParty,
  joinParty,
  leaveParty,
  cancelParty,
  getParty,
  getDailyChallenge,
  recordPartyGameResult,
  getAnimePartyProfile,
  activeParties,
} from '../animePartyService.js';
import { config } from '../../config.js';
export async function handleReflexe(interaction) {
  const readyEmbed = new EmbedBuilder()
    .setTitle('⚡ Épreuve de Réflexes : Concentration Otaku')
    .setDescription(
      `Tenez-vous prêts...\n` +
      `Ne cliquez sur aucun bouton tant que le signal d'attaque n'est pas apparu !\n\n` +
      `*Le signal apparaîtra dans quelques secondes aléatoires...*`
    )
    .setColor(config.colors.warning)
    .setFooter({ text: 'Codé avec ❤️ par Saez' })
    .setTimestamp();
  await interaction.reply({ embeds: [readyEmbed] });
  const delayMs = Math.floor(Math.random() * 3500) + 2500;
  setTimeout(async () => {
    const triggerEmbed = new EmbedBuilder()
      .setTitle('🔥 ATTAQUE ! CLIQUEZ MAINTENANT ! 🔥')
      .setDescription('⚡ **LE PREMIER JOUEUR À CLIQUER REMPORTE LE DUEL DE VITESSE !** ⚡')
      .setColor(0xff2d7b)
      .setFooter({ text: 'Codé avec ❤️ par Saez' })
      .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('reflexe_strike').setLabel('⚡ FRAPPE SUPRÊME !').setStyle(ButtonStyle.Danger)
    );
    const msg = await interaction.channel.send({ embeds: [triggerEmbed], components: [row] });
    const startTime = Date.now();
    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 15000,
    });
    collector.on('collect', async (btnInt) => {
      if (btnInt.customId === 'reflexe_strike') {
        const reactionTime = Date.now() - startTime;
        collector.stop('clicked');
        const winEmbed = new EmbedBuilder()
          .setTitle('🏆 VICTOIRE ÉCLAIR !')
          .setDescription(
            `Félicitations ${btnInt.user} ! Vous avez été le plus rapide !\n\n` +
            `⏱️ **Temps de réaction :** \`${reactionTime} ms\`\n` +
            `⭐ **+20 points Anime Party** crédités pour vos réflexes surhumains !`
          )
          .setColor(config.colors.success)
          .setFooter({ text: 'Codé avec ❤️ par Saez' })
          .setTimestamp();
        await recordPartyGameResult(interaction.guildId, btnInt.user.id, btnInt.user.username, 20, true, 'Réflexe', {
          guild: interaction.guild,
          member: interaction.member,
        });
        await btnInt.update({ embeds: [winEmbed], components: [] });
      }
    });
    collector.on('end', async (_, reason) => {
      if (reason !== 'clicked') {
        const timeoutEmbed = new EmbedBuilder()
          .setTitle('⌛ Personne n\'a réagi à temps !')
          .setDescription('Les réflexes se sont émoussés... Personne n\'a cliqué dans le temps imparti.')
          .setColor(config.colors.accent);
        await msg.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
      }
    });
  }, delayMs);
}
export async function handleMemoire(interaction) {
  const SYMBOLS = [
    { id: 'naruto', label: '🍥 Rasengan', emoji: '🍥' },
    { id: 'luffy', label: '🍖 Viande', emoji: '🍖' },
    { id: 'gojo', label: '👁️ Espace Infini', emoji: '👁️' },
    { id: 'zoro', label: '🗡️ Sabres', emoji: '🗡️' },
  ];
  const sequence = [];
  for (let i = 0; i < 4; i++) {
    sequence.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
  }
  const sequenceDisplay = sequence.map((s) => s.emoji).join('   ');
  const startEmbed = new EmbedBuilder()
    .setTitle('🧠 Défi de Mémoire Otaku — Mémorisez la Séquence !')
    .setDescription(
      `Retenez bien cet ordre de symboles anime :\n\n` +
      `# ${sequenceDisplay}\n\n` +
      `⚠️ *Cette séquence va disparaître dans 4 secondes ! Préparez-vous à la reproduire.*`
    )
    .setColor(config.colors.primary)
    .setFooter({ text: 'Codé avec ❤️ par Saez' })
    .setTimestamp();
  const reply = await interaction.reply({ embeds: [startEmbed], fetchReply: true });
  setTimeout(async () => {
    const hiddenEmbed = new EmbedBuilder()
      .setTitle('🧠 Reproduisez la Séquence en Cliquant sur les Boutons !')
      .setDescription(`Cliquez sur les 4 symboles dans le bon ordre !\n\nProgression : **0/4**`)
      .setColor(config.colors.warning)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    const row = new ActionRowBuilder();
    SYMBOLS.forEach((s) => {
      row.addComponents(new ButtonBuilder().setCustomId(`mem_${s.id}`).setLabel(s.label).setStyle(ButtonStyle.Primary));
    });
    await reply.edit({ embeds: [hiddenEmbed], components: [row] });
    let currentStep = 0;
    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000,
    });
    collector.on('collect', async (btnInt) => {
      if (btnInt.user.id !== interaction.user.id) {
        return btnInt.reply({ content: '❌ Seul le joueur actif peut répondre.', flags: MessageFlags.Ephemeral });
      }
      const clickedId = btnInt.customId.replace('mem_', '');
      const expectedId = sequence[currentStep].id;
      if (clickedId !== expectedId) {
        collector.stop('failed');
        const failEmbed = new EmbedBuilder()
          .setTitle('❌ Échec de la Mémoire !')
          .setDescription(`Vous avez cliqué sur le mauvais symbole à l'étape ${currentStep + 1} !\n\n👉 La séquence complète était : ${sequenceDisplay}`)
          .setColor(config.colors.accent)
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        return btnInt.update({ embeds: [failEmbed], components: [] });
      }
      currentStep++;
      if (currentStep === sequence.length) {
        collector.stop('won');
        const winEmbed = new EmbedBuilder()
          .setTitle('🎉 MÉMOIRE PARFAITE ! Séquence Validée !')
          .setDescription(
            `Impressionnant ${btnInt.user} ! Vous avez reproduit fidèlement la séquence :\n# ${sequenceDisplay}\n\n` +
            `⭐ **+25 points Anime Party** ajoutés à votre profil !`
          )
          .setColor(config.colors.success)
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        await recordPartyGameResult(interaction.guildId, btnInt.user.id, btnInt.user.username, 25, true, 'Mémoire', {
          guild: interaction.guild,
          member: interaction.member,
        });
        return btnInt.update({ embeds: [winEmbed], components: [] });
      }
      const progressEmbed = new EmbedBuilder()
        .setTitle('🧠 Reproduisez la Séquence')
        .setDescription(`Symbole correct ! Continuez...\n\nProgression : **${currentStep}/${sequence.length}** ✅`)
        .setColor(config.colors.warning)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      await btnInt.update({ embeds: [progressEmbed] });
    });
  }, 4000);
}
export async function handleDuelAnime(interaction) {
  const opponent = interaction.options.getUser('adversaire');
  if (!opponent) {
    return interaction.reply({ content: '❌ Veuillez mentionner un adversaire pour lancer un duel.', flags: MessageFlags.Ephemeral });
  }
  if (opponent.id === interaction.user.id || opponent.bot) {
    return interaction.reply({ content: '❌ Vous ne pouvez pas vous défier vous-même ou un bot !', flags: MessageFlags.Ephemeral });
  }
  const inviteEmbed = new EmbedBuilder()
    .setTitle('⚔️ Défi en Duel Anime !')
    .setDescription(
      `**${interaction.user}** défie officiellement **${opponent}** dans un duel de vitesse et de connaissances Anime !\n\n` +
      `👉 **${opponent}**, acceptez-vous le combat d'honneur en cliquant ci-dessous ?`
    )
    .setColor(config.colors.accent)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Expire dans 45 secondes' })
    .setTimestamp();
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('duel_accept').setLabel('⚔️ Accepter le Duel').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('duel_refuse').setLabel('🏳️ Décliner').setStyle(ButtonStyle.Secondary)
  );
  const reply = await interaction.reply({ embeds: [inviteEmbed], components: [row], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 45000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== opponent.id && btnInt.user.id !== interaction.user.id) {
      return btnInt.reply({ content: '❌ Vous ne participez pas à ce duel.', flags: MessageFlags.Ephemeral });
    }
    if (btnInt.customId === 'duel_refuse') {
      collector.stop('refused');
      return btnInt.update({
        content: `🏳️ Le duel a été décliné par **${btnInt.user.username}**.`,
        embeds: [],
        components: [],
      });
    }
    if (btnInt.customId === 'duel_accept') {
      collector.stop('accepted');
      const DUEL_QUESTIONS = [
        { q: 'Dans One Piece, quel est le premier navire offert aux Chapeaux de Paille par Kaya ?', a: ['Vogue Merry', 'Thousand Sunny', 'Moby Dick'], c: 0 },
        { q: 'Dans Naruto, qui élimine Jiraya lors de son infiltration à Ame ?', a: ['Pain (Nagato)', 'Itachi Uchiha', 'Orochimaru'], c: 0 },
        { q: 'Dans Jujutsu Kaisen, quel exorciste possède les Six Yeux ?', a: ['Satoru Gojo', 'Suguru Geto', 'Kento Nanami'], c: 0 },
        { q: 'Dans Solo Leveling, quel est le titre suprême hérité par Sung Jin-woo ?', a: ['Monarque des Ombres', 'Roi des Bêtes', 'Souverain Blanc'], c: 0 },
        { q: 'Dans L\'Attaque des Titans, combien de Titans primordiaux existent dans le monde ?', a: ['9 Titans', '7 Titans', '12 Titans'], c: 0 },
      ];
      const q = DUEL_QUESTIONS[Math.floor(Math.random() * DUEL_QUESTIONS.length)];
      const duelEmbed = new EmbedBuilder()
        .setTitle('⚔️ Duel Anime en Cours ! Vitesse & Savoir')
        .setDescription(
          `**Question décisive :**\n> *"${q.q}"*\n\n` +
          `Duellistes : **${interaction.user.username}** VS **${opponent.username}**\n` +
          `⏱️ *Le premier qui clique sur la bonne réponse remporte le duel !*`
        )
        .setColor(config.colors.primary)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      const qRow = new ActionRowBuilder();
      q.a.forEach((ans, idx) => {
        qRow.addComponents(new ButtonBuilder().setCustomId(`duel_ans_${idx}`).setLabel(ans).setStyle(ButtonStyle.Primary));
      });
      const duelMsg = await btnInt.update({ embeds: [duelEmbed], components: [qRow], fetchReply: true });
      const matchCollector = duelMsg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30000,
      });
      matchCollector.on('collect', async (qInt) => {
        if (qInt.user.id !== interaction.user.id && qInt.user.id !== opponent.id) {
          return qInt.reply({ content: '❌ Seuls les 2 duellistes peuvent répondre !', flags: MessageFlags.Ephemeral });
        }
        const chosenIdx = parseInt(qInt.customId.replace('duel_ans_', ''), 10);
        const isRight = chosenIdx === q.c;
        matchCollector.stop('resolved');
        const winner = isRight ? qInt.user : (qInt.user.id === interaction.user.id ? opponent : interaction.user);
        const loser = winner.id === interaction.user.id ? opponent : interaction.user;
        const endEmbed = new EmbedBuilder()
          .setTitle(`🏆 Victoire de ${winner.username} en Duel !`)
          .setDescription(
            `La bonne réponse était bien **${q.a[q.c]}** !\n\n` +
            `🥇 **Vainqueur :** ${winner} (+30 points Party)\n` +
            `🥈 **Valeureux adversaire :** ${loser} (+10 points de participation)\n\n` +
            `*Un affrontement mémorable gravé dans les annales du serveur !*`
          )
          .setColor(config.colors.success)
          .setTimestamp()
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        await recordPartyGameResult(interaction.guildId, winner.id, winner.username, 30, true, 'Duel', {
          guild: interaction.guild,
          member: interaction.member,
        });
        await recordPartyGameResult(interaction.guildId, loser.id, loser.username, 10, false, 'Duel');
        await qInt.update({ embeds: [endEmbed], components: [] });
      });
    }
  });
}
export async function handleTournoi(interaction) {
  const participants = new Set([interaction.user.id]);
  const userMap = new Map([[interaction.user.id, interaction.user.username]]);
  const embed = new EmbedBuilder()
    .setTitle('🏆 Grand Tournoi d\'Arène Anime Party — Inscriptions Ouvertes !')
    .setDescription(
      `L'arène suprême des Otakus ouvre ses portes !\n\n` +
      `**Organisateur :** ${interaction.user}\n` +
      `**Format :** Arbre à élimination directe (1v1 jusqu'au sacre final)\n\n` +
      `👥 **Participants inscrits (1/8) :**\n• <@${interaction.user.id}>\n\n` +
      `Cliquez sur **Participer** pour entrer dans l'arène avant le tirage au sort !`
    )
    .setColor(0xffd700)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Tournoi Anime Party' })
    .setTimestamp();
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tournoi_join').setLabel('⚔️ Participer').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('tournoi_start').setLabel('🚀 Lancer le Tournoi').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('tournoi_cancel').setLabel('❌ Annuler').setStyle(ButtonStyle.Danger)
  );
  const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 120000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.customId === 'tournoi_join') {
      if (participants.has(btnInt.user.id)) {
        return btnInt.reply({ content: '⚠️ Vous êtes déjà inscrit au tournoi !', flags: MessageFlags.Ephemeral });
      }
      if (participants.size >= 8) {
        return btnInt.reply({ content: '⚠️ L\'arbre de tournoi a atteint la limite de 8 combattants.', flags: MessageFlags.Ephemeral });
      }
      participants.add(btnInt.user.id);
      userMap.set(btnInt.user.id, btnInt.user.username);
      const pList = Array.from(participants).map((id) => `• <@${id}>`).join('\n');
      const updateEmbed = new EmbedBuilder()
        .setTitle('🏆 Grand Tournoi d\'Arène Anime Party — Inscriptions Ouvertes !')
        .setDescription(
          `👥 **Participants inscrits (${participants.size}/8) :**\n${pList}\n\n` +
          `Cliquez sur **Participer** pour entrer dans l'arène !`
        )
        .setColor(0xffd700)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return btnInt.update({ embeds: [updateEmbed] });
    }
    if (btnInt.customId === 'tournoi_cancel') {
      if (btnInt.user.id !== interaction.user.id) {
        return btnInt.reply({ content: '❌ Seul l\'organisateur peut annuler le tournoi.', flags: MessageFlags.Ephemeral });
      }
      collector.stop('cancelled');
      return btnInt.update({ content: '❌ Le tournoi a été annulé par son organisateur.', embeds: [], components: [] });
    }
    if (btnInt.customId === 'tournoi_start') {
      if (btnInt.user.id !== interaction.user.id) {
        return btnInt.reply({ content: '❌ Seul l\'organisateur peut lancer le tournoi.', flags: MessageFlags.Ephemeral });
      }
      collector.stop('started');
      const fighterIds = Array.from(participants).sort(() => Math.random() - 0.5);
      const startTournoiEmbed = new EmbedBuilder()
        .setTitle('⚔️ Arbre des Combats du Tournoi Généré !')
        .setDescription(
          `🔥 **${fighterIds.length} gladiateurs Otaku s'affrontent !**\n\n` +
          `**Premier choc de l'arbre :**\n` +
          `🔴 <@${fighterIds[0]}> **VS** 🔵 <@${fighterIds[1] || fighterIds[0]}>\n\n` +
          `*Les affrontements se déroulent manche par manche pour le titre de Champion Suprême !*`
        )
        .setColor(config.colors.success)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      await recordPartyGameResult(interaction.guildId, fighterIds[0], userMap.get(fighterIds[0]), 50, true, 'Tournoi', {
        guild: interaction.guild,
        member: interaction.member,
      });
      return btnInt.update({ embeds: [startTournoiEmbed], components: [] });
    }
  });
}
export async function handleBattleRoyale(interaction) {
  const FIGHTERS = [
    { name: 'Satoru Gojo', anime: 'Jujutsu Kaisen' },
    { name: 'Monkey D. Luffy (Gear 5)', anime: 'One Piece' },
    { name: 'Sung Jin-woo', anime: 'Solo Leveling' },
    { name: 'Son Goku (Ultra Instinct)', anime: 'Dragon Ball' },
  ];
  const shuffled = FIGHTERS.sort(() => Math.random() - 0.5);
  const f1 = shuffled[0];
  const f2 = shuffled[1];
  const votesA = new Set();
  const votesB = new Set();
  function buildVoteButtons() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('br_vote_a').setLabel(`${f1.name} (${votesA.size})`).setEmoji('🔴').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('br_vote_b').setLabel(`${f2.name} (${votesB.size})`).setEmoji('🔵').setStyle(ButtonStyle.Primary)
    );
  }
  const embed = new EmbedBuilder()
    .setTitle('⚔️ Battle Royale Anime — Choc des Titans')
    .setDescription(
      `Qui remporterait ce duel titanesque selon vous ?\n\n` +
      `🔴 **Combattant A :** **${f1.name}** (*${f1.anime}*)\n` +
      `🔵 **Combattant B :** **${f2.name}** (*${f2.anime}*)\n\n` +
      `🗳️ *Tous les membres du salon peuvent voter pendant 45 secondes !*`
    )
    .setColor(config.colors.primary)
    .setFooter({ text: 'Codé avec ❤️ par Saez' });
  const reply = await interaction.reply({ embeds: [embed], components: [buildVoteButtons()], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 45000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.customId === 'br_vote_a') {
      votesB.delete(btnInt.user.id);
      votesA.add(btnInt.user.id);
    } else {
      votesA.delete(btnInt.user.id);
      votesB.add(btnInt.user.id);
    }
    await btnInt.update({ components: [buildVoteButtons()] });
  });
  collector.on('end', async () => {
    const winner = votesA.size >= votesB.size ? f1 : f2;
    const endEmbed = new EmbedBuilder()
      .setTitle(`🏆 Résultat du Combat : ${winner.name} l'Emporte !`)
      .setDescription(
        `Au terme des délibérations de la communauté :\n\n` +
        `🔴 **${f1.name}** : \`${votesA.size} vote(s)\`\n` +
        `🔵 **${f2.name}** : \`${votesB.size} vote(s)\`\n\n` +
        `👉 **${winner.name}** s'impose triomphalement dans l'arène ! ✨`
      )
      .setColor(config.colors.success)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    await interaction.editReply({ embeds: [endEmbed], components: [] }).catch(() => {});
  });
}
export async function handleDefiQuotidien(interaction) {
  const challenge = getDailyChallenge();
  const profile = await getAnimePartyProfile(interaction.guildId, interaction.user.id, interaction.user.username);
  const embed = new EmbedBuilder()
    .setTitle(`📅 Défi Otaku du Jour — ${challenge.date}`)
    .setDescription(
      `🎯 **Mission :**\n# ${challenge.title}\n\n` +
      `📝 **Objectif :**\n> *${challenge.task}*\n\n` +
      `🎁 **Récompense :** \`${challenge.reward}\`\n\n` +
      `👤 **Votre profil :** **${profile.points} points Party** | **${profile.wins} victoires**`
    )
    .setColor(config.colors.accent)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Réinitialisé chaque nuit à minuit UTC' })
    .setTimestamp();
  return interaction.reply({ embeds: [embed] });
}
export async function handlePartie(interaction) {
  const action = interaction.options.getString('action') || 'creer';
  const chanId = interaction.channelId;
  if (action === 'creer') {
    const existing = getParty(chanId);
    if (existing && existing.status === 'lobby') {
      return interaction.reply({
        content: `⚠️ Un lobby est déjà ouvert dans ce salon par <@${existing.hostId}>. Rejoignez-le avec les boutons ci-dessous !`,
        flags: MessageFlags.Ephemeral,
      });
    }
    const party = createParty(chanId, interaction.user, 'party');
    const embed = new EmbedBuilder()
      .setTitle('🎮 Salon de Jeu Anime Party — Inscriptions Ouvertes !')
      .setDescription(
        `**Hôte :** ${interaction.user}\n` +
        `**Participants inscrits (1/12) :**\n• <@${interaction.user.id}>\n\n` +
        `Cliquez sur **Rejoindre** pour entrer dans la session avant le lancement !`
      )
      .setColor(config.colors.primary)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Session Multijoueur' })
      .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('party_join').setLabel('🙋 Rejoindre').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('party_leave').setLabel('🚪 Quitter').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('party_start').setLabel('🚀 Lancer la Partie').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('party_cancel').setLabel('❌ Annuler').setStyle(ButtonStyle.Danger)
    );
    const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000,
    });
    collector.on('collect', async (btnInt) => {
      const p = getParty(chanId);
      if (!p) return btnInt.reply({ content: '❌ Session expirée.', flags: MessageFlags.Ephemeral });
      if (btnInt.customId === 'party_join') {
        const res = joinParty(chanId, btnInt.user);
        if (!res.success) return btnInt.reply({ content: `❌ ${res.message}`, flags: MessageFlags.Ephemeral });
        const playerList = Array.from(p.players.values()).map((pl) => `• <@${pl.id}>`).join('\n');
        const updateEmbed = new EmbedBuilder()
          .setTitle('🎮 Salon de Jeu Anime Party — Inscriptions Ouvertes !')
          .setDescription(`**Hôte :** <@${p.hostId}>\n**Participants inscrits (${p.players.size}/12) :**\n${playerList}`)
          .setColor(config.colors.primary)
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        return btnInt.update({ embeds: [updateEmbed] });
      }
      if (btnInt.customId === 'party_leave') {
        const res = leaveParty(chanId, btnInt.user);
        if (!res.success) return btnInt.reply({ content: `❌ ${res.message}`, flags: MessageFlags.Ephemeral });
        if (res.cancelled) {
          collector.stop('cancelled');
          return btnInt.update({ content: '🚪 La partie a été annulée car tous les joueurs sont partis.', embeds: [], components: [] });
        }
        const playerList = Array.from(p.players.values()).map((pl) => `• <@${pl.id}>`).join('\n');
        const updateEmbed = new EmbedBuilder()
          .setTitle('🎮 Salon de Jeu Anime Party — Inscriptions Ouvertes !')
          .setDescription(`**Hôte :** <@${p.hostId}>\n**Participants inscrits (${p.players.size}/12) :**\n${playerList}`)
          .setColor(config.colors.primary)
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        return btnInt.update({ embeds: [updateEmbed] });
      }
      if (btnInt.customId === 'party_cancel') {
        if (btnInt.user.id !== p.hostId) {
          return btnInt.reply({ content: '❌ Seul l\'hôte peut annuler la partie.', flags: MessageFlags.Ephemeral });
        }
        cancelParty(chanId, btnInt.user);
        collector.stop('cancelled');
        return btnInt.update({ content: '❌ La session multijoueur a été annulée par l\'hôte.', embeds: [], components: [] });
      }
      if (btnInt.customId === 'party_start') {
        if (btnInt.user.id !== p.hostId) {
          return btnInt.reply({ content: '❌ Seul l\'hôte peut lancer la partie.', flags: MessageFlags.Ephemeral });
        }
        collector.stop('started');
        p.status = 'in_progress';
        const startEmbed = new EmbedBuilder()
          .setTitle('🚀 La Partie Anime Party Commence !')
          .setDescription(
            `🎮 **${p.players.size} combattants en lice !**\n\n` +
            `Que le meilleur Otaku l'emporte ! Lancez vos défis préférés pour marquer des points !`
          )
          .setColor(config.colors.success)
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        return btnInt.update({ embeds: [startEmbed], components: [] });
      }
    });
    return;
  }
  if (action === 'quitter') {
    const res = leaveParty(chanId, interaction.user);
    if (!res.success) return interaction.reply({ content: `❌ ${res.message}`, flags: MessageFlags.Ephemeral });
    return interaction.reply({ content: '🚪 Vous avez quitté la partie active avec succès.' });
  }
}
export async function handleTierList(interaction) {
  const CANDIDATES = [
    'Satoru Gojo (Jujutsu Kaisen)',
    'Roronoa Zoro (One Piece)',
    'Levi Ackerman (SnK)',
    'Sung Jin-woo (Solo Leveling)',
    'Itachi Uchiha (Naruto)',
  ];
  const currentHero = CANDIDATES[Math.floor(Math.random() * CANDIDATES.length)];
  const votes = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  const voterSet = new Set();
  function buildEmbed() {
    return new EmbedBuilder()
      .setTitle('📊 Tier List Anime Collaborative — Vote en Direct')
      .setDescription(
        `Dans quel rang classez-vous **${currentHero}** ?\n\n` +
        `🏆 **Rang S (Légendaire / Intouchable) :** \`${votes.S} vote(s)\`\n` +
        `🥇 **Rang A (Chef d'œuvre / Excellent) :** \`${votes.A} vote(s)\`\n` +
        `🥈 **Rang B (Très Bon / Solide) :** \`${votes.B} vote(s)\`\n` +
        `🥉 **Rang C (Moyen / Passable) :** \`${votes.C} vote(s)\`\n` +
        `🗑️ **Rang D (Surcôté / Oubliable) :** \`${votes.D} vote(s)\`\n\n` +
        `🗳️ *Cliquez sur votre rang ci-dessous pour voter (durée : 45 secondes) !*`
      )
      .setColor(config.colors.primary)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
  }
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tier_S').setLabel('Rang S').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('tier_A').setLabel('Rang A').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('tier_B').setLabel('Rang B').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('tier_C').setLabel('Rang C').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tier_D').setLabel('Rang D').setStyle(ButtonStyle.Secondary)
  );
  const reply = await interaction.reply({ embeds: [buildEmbed()], components: [row], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 45000,
  });
  collector.on('collect', async (btnInt) => {
    if (voterSet.has(btnInt.user.id)) {
      return btnInt.reply({ content: '⚠️ Vous avez déjà voté pour ce personnage !', flags: MessageFlags.Ephemeral });
    }
    const tier = btnInt.customId.replace('tier_', '');
    votes[tier]++;
    voterSet.add(btnInt.user.id);
    await btnInt.update({ embeds: [buildEmbed()] });
  });
  collector.on('end', async () => {
    let topTier = 'S';
    let max = -1;
    for (const [t, count] of Object.entries(votes)) {
      if (count > max) {
        max = count;
        topTier = t;
      }
    }
    const finalEmbed = new EmbedBuilder()
      .setTitle(`🏁 Résultat du Tier List pour ${currentHero}`)
      .setDescription(
        `Après délibération de la communauté avec **${voterSet.size} participant(s)** :\n\n` +
        `👑 **Rang Attribué : RANG ${topTier} !**\n\n` +
        `• S : ${votes.S} | A : ${votes.A} | B : ${votes.B} | C : ${votes.C} | D : ${votes.D}`
      )
      .setColor(topTier === 'S' ? 0xffd700 : config.colors.primary)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    await interaction.editReply({ embeds: [finalEmbed], components: [] }).catch(() => {});
  });
}
export async function handleDraft(interaction) {
  const POOL = [
    { name: 'Satoru Gojo', role: 'Stratège / Sensei', buff: '+100% Défense Magique' },
    { name: 'Son Goku', role: 'Capitaine / Tank', buff: '+80% Attaque Globale' },
    { name: 'Roronoa Zoro', role: 'DPS Tranchant', buff: '+90% Coups Critiques' },
    { name: 'Tsunade Senju', role: 'Support / Healer', buff: 'Régénération Divine' },
    { name: 'Killua Zoldyck', role: 'Assasin / Vitesse', buff: 'Vitesse Éclair' },
    { name: 'Erwin Smith', role: 'Commandant Suprême', buff: 'Motivation Absolue' },
  ];
  const embed = new EmbedBuilder()
    .setTitle('🛡️ Draft Tactique Anime — Composez Votre Escouade')
    .setDescription(
      `Sélectionnez 3 combattants d'élite parmi le vivier pour former votre escouade parfaite !\n\n` +
      `**Combattants disponibles :**\n` +
      POOL.map((p, idx) => `\`${idx + 1}.\` **${p.name}** [${p.role}] — *${p.buff}*`).join('\n')
    )
    .setColor(config.colors.primary)
    .setFooter({ text: 'Codé avec ❤️ par Saez' });
  const menu = new StringSelectMenuBuilder()
    .setCustomId('draft_select')
    .setPlaceholder('👉 Choisissez vos héros (jusqu\'à 3)...')
    .setMinValues(1)
    .setMaxValues(3)
    .addOptions(
      POOL.map((p, idx) => ({
        label: p.name,
        description: `${p.role} — ${p.buff}`,
        value: String(idx),
        emoji: '⚔️',
      }))
    );
  const row = new ActionRowBuilder().addComponents(menu);
  const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 45000,
  });
  collector.on('collect', async (selectInt) => {
    if (selectInt.user.id !== interaction.user.id) {
      return selectInt.reply({ content: '❌ Ce choix appartient au capitaine en charge de la draft.', flags: MessageFlags.Ephemeral });
    }
    const selectedHeroes = selectInt.values.map((v) => POOL[parseInt(v, 10)]);
    collector.stop('completed');
    const resultEmbed = new EmbedBuilder()
      .setTitle(`🏆 Escouade d'Élite Anime de ${selectInt.user.username}`)
      .setDescription(
        `Votre composition de combat a été validée avec succès :\n\n` +
        selectedHeroes.map((h, i) => `**${i + 1}. ${h.name}**\n> Rôle : \`${h.role}\` | Synergie : *${h.buff}*`).join('\n\n') +
        `\n\n⭐ **Puissance d'Équipe : 9 850 / 10 000** ⚡\n` +
        `⭐ **+15 points Anime Party** crédités pour votre sens tactique !`
      )
      .setColor(config.colors.success)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    await recordPartyGameResult(interaction.guildId, selectInt.user.id, selectInt.user.username, 15, true, 'Draft');
    await selectInt.update({ embeds: [resultEmbed], components: [] });
  });
}
export async function handleBingoAnime(interaction) {
  const TROPES = [
    'Pouvoir de l\'amitié',
    'Rival ténébreux aux cheveux noirs',
    'Repas gargantuesque englouti',
    'Entraînement sous cascade',
    'Épisode à la plage ou source chaude',
    'Monologue intérieur de 5 minutes',
    'Transformation de dernière seconde',
    'L\'ennemi juré devient un allié',
    'Le sensei masqué ou excentrique',
  ];
  const checked = new Set();
  function buildEmbed() {
    let gridStr = '';
    for (let i = 0; i < TROPES.length; i++) {
      const isChecked = checked.has(i);
      gridStr += `\`${i + 1}.\` ${isChecked ? '✅ ~~' + TROPES[i] + '~~' : '⬜ **' + TROPES[i] + '**'}\n`;
    }
    return new EmbedBuilder()
      .setTitle('🎯 Grille de Bingo Clichés Anime & Shōnen')
      .setDescription(
        `Cochez les clichés au fur et à mesure que vous les observez dans votre animé :\n\n` +
        `${gridStr}\n` +
        `Progression : **${checked.size}/9 clichés validés** ${checked.size >= 5 ? '🎉 BINGO EN VUE !' : ''}`
      )
      .setColor(checked.size >= 5 ? config.colors.success : config.colors.primary)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
  }
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('bingo_0').setLabel('Case 1').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('bingo_1').setLabel('Case 2').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('bingo_2').setLabel('Case 3').setStyle(ButtonStyle.Secondary)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('bingo_3').setLabel('Case 4').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('bingo_4').setLabel('Case 5').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('bingo_5').setLabel('Case 6').setStyle(ButtonStyle.Secondary)
  );
  const reply = await interaction.reply({ embeds: [buildEmbed()], components: [row1, row2], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) {
      return btnInt.reply({ content: '❌ Cette grille appartient à un autre membre.', flags: MessageFlags.Ephemeral });
    }
    const idx = parseInt(btnInt.customId.replace('bingo_', ''), 10);
    if (checked.has(idx)) {
      checked.delete(idx);
    } else {
      checked.add(idx);
    }
    await btnInt.update({ embeds: [buildEmbed()] });
  });
}
export async function handleMarathon(interaction) {
  const MARATHONS = [
    {
      title: '🏆 Le Défi des 3 Grands (Big Three Challenge)',
      desc: 'Découvrez ou revisionnez au moins 5 épisodes clés d\'une des œuvres majeures : One Piece, Naruto ou Bleach.',
      target: '5 épisodes',
      badge: 'Chasseur de Légendes',
    },
    {
      title: '🌑 Nuit Dark Fantasy & Seinen',
      desc: 'Plongez dans l\'univers sombre de Jujutsu Kaisen, Chainsaw Man ou Vinland Saga.',
      target: '1 saison complète',
      badge: 'Guerrier des Ombres',
    },
    {
      title: '✨ Pépites & Tranches de Vie',
      desc: 'Laissez-vous émouvoir par Frieren ou Bocchi the Rock!',
      target: '3 épisodes',
      badge: 'Cœur Sensible',
    },
  ];
  const chosen = MARATHONS[Math.floor(Math.random() * MARATHONS.length)];
  const embed = new EmbedBuilder()
    .setTitle(`📺 Marathon Communautaire : ${chosen.title}`)
    .setDescription(
      `**Mission du Défi :**\n> *${chosen.desc}*\n\n` +
      `🎯 **Objectif :** \`${chosen.target}\`\n` +
      `🎖️ **Badge exclusif à décrocher :** \`${chosen.badge}\`\n\n` +
      `📢 Partagez vos impressions et votre avancement avec la communauté Saez !`
    )
    .setColor(config.colors.primary)
    .setFooter({ text: 'Codé avec ❤️ par Saez' });
  return interaction.reply({ embeds: [embed] });
}
export async function handleJeuRapide(interaction) {
  const games = ['reflexe', 'memoire', 'emoji', 'vrai-faux', 'blindtest', 'pendu'];
  const picked = games[Math.floor(Math.random() * games.length)];
  if (picked === 'reflexe') return handleReflexe(interaction);
  if (picked === 'memoire') return handleMemoire(interaction);
  const { handleEmojiChallenge, handleVraiOuFaux, handleBlindtest, handleAnimePendu } = await import('./animepartyGames.js');
  if (picked === 'emoji') return handleEmojiChallenge(interaction);
  if (picked === 'vrai-faux') return handleVraiOuFaux(interaction);
  if (picked === 'blindtest') return handleBlindtest(interaction);
  if (picked === 'pendu') return handleAnimePendu(interaction);
}
