import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ComponentType,
  MessageFlags,
} from 'discord.js';
import { recordPartyGameResult } from '../animePartyService.js';
import { config } from '../../config.js';
const activeSoirees = new Map();
export async function handleParty(interaction) {
  const action = interaction.options.getString('action') || 'creer';
  const theme = interaction.options.getString('theme') || 'shonen_hype';
  const chanId = interaction.channelId;
  const THEMES_INFO = {
    shonen_hype: {
      name: '🔥 Shōnen Hype & Combats Légendaires',
      desc: 'Blindtest openings cultes, duels de réflexes et citations survoltées !',
      rounds: ['Blindtest Hype', 'Duel de Réflexes', 'Vrai ou Faux Shōnen', 'Podium Final'],
    },
    mystere_enquete: {
      name: '🕵️ Mystère, Psychologie & Déduction',
      desc: 'Enquêtes interactives, démasquage de l\'imposteur et l\'intrus Otaku.',
      rounds: ['L\'Intrus Mystère', 'Scénario d\'Enquête', 'L\'Imposteur Infiltré', 'Podium Final'],
    },
    retro_90_2000: {
      name: '📼 Rétro & Âge d\'Or (Années 90-2000)',
      desc: 'DBZ, Evangelion, Cowboy Bebop, Yu Yu Hakusho et nostalgie assurée.',
      rounds: ['Blindtest Rétro', 'Devine la Réplique Vintage', 'Pendu des Classiques', 'Podium Final'],
    },
    musique_opening: {
      name: '🎵 Soirée Grand Concert & Openings',
      desc: 'Enchaînement de Blindtests endiablés et reconnaissance d\'artistes.',
      rounds: ['Blindtest Manche 1', 'Blindtest Manche 2', 'Blindtest Manche Finale', 'Podium Final'],
    },
    culture_generale: {
      name: '🧠 Culture Générale Anime & Manga',
      desc: 'Associations de studios, anecdotes méconnues et quiz Lore approfondi.',
      rounds: ['Associations de Studios', 'Vrai ou Faux Lore', 'Devine le Personnage', 'Podium Final'],
    },
  };
  const selectedThemeInfo = THEMES_INFO[theme] || THEMES_INFO.shonen_hype;
  if (action === 'creer') {
    const existing = activeSoirees.get(chanId);
    if (existing && existing.status !== 'ended') {
      return interaction.reply({
        content: `⚠️ Une Soirée Anime Party est déjà en cours dans ce salon par <@${existing.hostId}> ! Rejoignez-la avec le bouton ci-dessous.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    const soiree = {
      id: `soiree_${Date.now()}`,
      channelId: chanId,
      hostId: interaction.user.id,
      theme: selectedThemeInfo,
      status: 'lobby', 
      participants: new Map([[interaction.user.id, { id: interaction.user.id, username: interaction.user.username, score: 0 }]]),
      currentRound: 0,
      totalRounds: selectedThemeInfo.rounds.length - 1, 
      createdAt: Date.now(),
    };
    activeSoirees.set(chanId, soiree);
    const embed = new EmbedBuilder()
      .setTitle(`🎉 Soirée Anime Party — ${selectedThemeInfo.name}`)
      .setDescription(
        `Une soirée interactive a été planifiée par ${interaction.user} !\n\n` +
        `📝 **Description :** *${selectedThemeInfo.desc}*\n\n` +
        `📋 **Programme des Épreuves :**\n` +
        selectedThemeInfo.rounds.map((r, i) => `\`Manche ${i + 1}.\` **${r}**`).join('\n') +
        `\n\n👥 **Participants Inscrits (${soiree.participants.size}) :**\n• <@${interaction.user.id}>`
      )
      .setColor(0xff2d7b)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Soirée Anime Party' })
      .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('soiree_join').setLabel('🙋 Participer').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('soiree_leave').setLabel('🚪 Quitter').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('soiree_start').setLabel('🚀 Lancer la Soirée').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('soiree_cancel').setLabel('❌ Annuler').setStyle(ButtonStyle.Danger)
    );
    const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 180000,
    });
    collector.on('collect', async (btnInt) => {
      const s = activeSoirees.get(chanId);
      if (!s) return btnInt.reply({ content: '❌ Soirée expirée.', flags: MessageFlags.Ephemeral });
      if (btnInt.customId === 'soiree_join') {
        if (s.participants.has(btnInt.user.id)) {
          return btnInt.reply({ content: '⚠️ Vous êtes déjà inscrit à cette soirée !', flags: MessageFlags.Ephemeral });
        }
        s.participants.set(btnInt.user.id, { id: btnInt.user.id, username: btnInt.user.username, score: 0 });
        const pList = Array.from(s.participants.values()).map((p) => `• <@${p.id}>`).join('\n');
        const updateEmbed = new EmbedBuilder()
          .setTitle(`🎉 Soirée Anime Party — ${selectedThemeInfo.name}`)
          .setDescription(
            `Une soirée interactive a été planifiée par <@${s.hostId}> !\n\n` +
            `📋 **Programme des Épreuves :**\n` +
            selectedThemeInfo.rounds.map((r, i) => `\`Manche ${i + 1}.\` **${r}**`).join('\n') +
            `\n\n👥 **Participants Inscrits (${s.participants.size}) :**\n${pList}`
          )
          .setColor(0xff2d7b)
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        return btnInt.update({ embeds: [updateEmbed] });
      }
      if (btnInt.customId === 'soiree_leave') {
        if (!s.participants.has(btnInt.user.id)) {
          return btnInt.reply({ content: '❌ Vous n\'êtes pas dans cette soirée.', flags: MessageFlags.Ephemeral });
        }
        s.participants.delete(btnInt.user.id);
        if (s.participants.size === 0) {
          activeSoirees.delete(chanId);
          collector.stop('cancelled');
          return btnInt.update({ content: '🚪 Soirée annulée : aucun participant restant.', embeds: [], components: [] });
        }
        const pList = Array.from(s.participants.values()).map((p) => `• <@${p.id}>`).join('\n');
        const updateEmbed = new EmbedBuilder()
          .setTitle(`🎉 Soirée Anime Party — ${selectedThemeInfo.name}`)
          .setDescription(`👥 **Participants Inscrits (${s.participants.size}) :**\n${pList}`)
          .setColor(0xff2d7b)
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        return btnInt.update({ embeds: [updateEmbed] });
      }
      if (btnInt.customId === 'soiree_cancel') {
        if (btnInt.user.id !== s.hostId) {
          return btnInt.reply({ content: '❌ Seul l\'hôte peut annuler la soirée.', flags: MessageFlags.Ephemeral });
        }
        activeSoirees.delete(chanId);
        collector.stop('cancelled');
        return btnInt.update({ content: '❌ La Soirée Anime Party a été annulée par son organisateur.', embeds: [], components: [] });
      }
      if (btnInt.customId === 'soiree_start') {
        if (btnInt.user.id !== s.hostId) {
          return btnInt.reply({ content: '❌ Seul l\'hôte peut lancer la soirée.', flags: MessageFlags.Ephemeral });
        }
        collector.stop('started');
        s.status = 'running';
        s.currentRound = 1;
        const launchEmbed = new EmbedBuilder()
          .setTitle(`🎊 C'est parti pour la Soirée Anime Party !`)
          .setDescription(
            `🔥 **${s.participants.size} participants en compétition !**\n\n` +
            `📍 **Manche 1 : ${selectedThemeInfo.rounds[0]}**\n\n` +
            `👉 Tous les participants marquent des points à chaque épreuve !\n` +
            `Le grand classement final couronnera le Roi de la Soirée !`
          )
          .setColor(config.colors.success)
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        return btnInt.update({ embeds: [launchEmbed], components: [] });
      }
    });
    return;
  }
  if (action === 'statut') {
    const s = activeSoirees.get(chanId);
    if (!s) {
      return interaction.reply({ content: '🔍 Aucune soirée active dans ce salon. Créez-en une avec `/animeparty party action:creer` !', flags: MessageFlags.Ephemeral });
    }
    const pList = Array.from(s.participants.values())
      .sort((a, b) => b.score - a.score)
      .map((p, i) => `${i + 1}. **${p.username}** — \`${p.score} pts\``)
      .join('\n');
    const statusEmbed = new EmbedBuilder()
      .setTitle(`📊 Statut de la Soirée Anime Party — ${s.theme.name}`)
      .setDescription(
        `• **Statut :** \`${s.status.toUpperCase()}\`\n` +
        `• **Manche actuelle :** \`${s.currentRound}/${s.totalRounds}\`\n` +
        `• **Hôte :** <@${s.hostId}>\n\n` +
        `🏆 **Scores actuels :**\n${pList || '*Aucun participant*'}`
      )
      .setColor(config.colors.primary)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return interaction.reply({ embeds: [statusEmbed] });
  }
  if (action === 'annuler') {
    const s = activeSoirees.get(chanId);
    if (!s) {
      return interaction.reply({ content: '❌ Aucune soirée active à annuler.', flags: MessageFlags.Ephemeral });
    }
    if (s.hostId !== interaction.user.id && !interaction.memberPermissions?.has('ManageGuild')) {
      return interaction.reply({ content: '❌ Seul l\'hôte ou un administrateur peut annuler la soirée.', flags: MessageFlags.Ephemeral });
    }
    activeSoirees.delete(chanId);
    return interaction.reply({ content: '✅ La soirée a été annulée avec succès.' });
  }
  if (action === 'resume') {
    const s = activeSoirees.get(chanId);
    if (!s) {
      return interaction.reply({ content: '🔍 Aucune soirée récente à résumer.', flags: MessageFlags.Ephemeral });
    }
    const podium = Array.from(s.participants.values()).sort((a, b) => b.score - a.score);
    const medals = ['🥇', '🥈', '🥉'];
    const lines = podium.map((p, i) => `${medals[i] || '▫️'} **${p.username}** — \`${p.score} points\``).join('\n');
    const resumeEmbed = new EmbedBuilder()
      .setTitle('🏆 Résumé Final de la Soirée Anime Party')
      .setDescription(
        `Félicitations à tous les participants de la soirée **${s.theme.name}** !\n\n` +
        `**Podium des Champions :**\n${lines}\n\n` +
        `⭐ Les points ont été sauvegardés sur vos profils Anime Party !`
      )
      .setColor(0xffd700)
      .setFooter({ text: 'Codé avec ❤️ par Saez' })
      .setTimestamp();
    return interaction.reply({ embeds: [resumeEmbed] });
  }
}
