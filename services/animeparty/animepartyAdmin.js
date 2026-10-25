import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  PermissionFlagsBits,
} from 'discord.js';
import {
  submitContribution,
  getGuildAnimePartyConfig,
  saveGuildAnimePartyConfig,
  activeParties,
} from '../animePartyService.js';
import { config } from '../../config.js';
export async function handleContribution(interaction) {
  const type = interaction.options.getString('type') || 'citation';
  const typeLabels = {
    citation: '💬 Citation Courte Culte',
    question: '❓ Question de Quiz Anime',
    pendu_mot: '🪢 Titre d\'Anime pour le Pendu',
    defi: '🎯 Défi Otaku Communautaire',
    signaler_erreur: '⚠️ Signalement d\'Erreur ou Doublon',
  };
  const embed = new EmbedBuilder()
    .setTitle(`📝 Contribution Communautaire — ${typeLabels[type]}`)
    .setDescription(
      `Participez à l'enrichissement d'Anime Party sur Saez Animes !\n\n` +
      `**Type de contribution :** \`${typeLabels[type]}\`\n\n` +
      `💡 **Règles importantes :**\n` +
      `• Pour une citation : indiquez la phrase exacte, le personnage et l'œuvre.\n` +
      `• Pour un quiz : indiquez la question, la bonne réponse et une explication courte.\n` +
      `• Ne soumettez aucun contenu inapproprié ou hors-sujet.\n\n` +
      `Cliquez sur le bouton ci-dessous pour enregistrer votre soumission !`
    )
    .setColor(config.colors.primary)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Validation par l\'équipe d\'animation' })
    .setTimestamp();
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`contrib_quick_submit_${type}`)
      .setLabel('Valider la proposition')
      .setEmoji('✨')
      .setStyle(ButtonStyle.Success)
  );
  const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
  const collector = reply.createMessageComponentCollector({
    time: 45000,
  });
  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) return;
    collector.stop('submitted');
    await submitContribution(
      interaction.guildId,
      btnInt.user.id,
      btnInt.user.username,
      type,
      `Proposition de type ${type} enregistrée par ${btnInt.user.tag}`
    );
    const successEmbed = new EmbedBuilder()
      .setTitle('✅ Contribution Enregistrée !')
      .setDescription(
        `Merci ${btnInt.user} pour votre contribution à **Anime Party** !\n` +
        `Votre proposition a été transmise aux animateurs du serveur pour validation.\n` +
        `⭐ **+10 points de participation communautaire** accordés !`
      )
      .setColor(config.colors.success)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    await btnInt.update({ embeds: [successEmbed], components: [] });
  });
}
export async function handleConfig(interaction) {
  const action = interaction.options.getString('action') || 'stats_module';
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({
      content: '❌ Vous devez disposer de la permission `Gérer le serveur` pour configurer le module Anime Party.',
      flags: MessageFlags.Ephemeral,
    });
  }
  const currentCfg = await getGuildAnimePartyConfig(interaction.guildId);
  if (action === 'stats_module') {
    const embed = new EmbedBuilder()
      .setTitle('⚙️ Diagnostic & Statistiques du Module Anime Party')
      .setDescription(
        `Configuration actuelle sur **${interaction.guild.name}** :\n\n` +
        `• **Salons autorisés :** ${currentCfg.allowedChannelIds?.length > 0 ? currentCfg.allowedChannelIds.map(id => `<#${id}>`).join(', ') : '`Tous les salons`'}\n` +
        `• **Cooldown mini-jeux :** \`${currentCfg.cooldownSeconds || 3} secondes\`\n` +
        `• **Jeux désactivés :** \`${currentCfg.disabledGames?.length > 0 ? currentCfg.disabledGames.join(', ') : 'Aucun (Tous activés)'}\`\n` +
        `• **Parties en mémoire dans le bot :** \`${activeParties.size} session(s) active(s)\`\n\n` +
        `💡 *Pour autoriser ce salon uniquement, utilisez \`/animeparty config action:salon\`.*`
      )
      .setColor(config.colors.primary)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Anime Party 2.0 Admin' })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
  if (action === 'salon') {
    const isCurrentlyRestricted = currentCfg.allowedChannelIds?.includes(interaction.channelId);
    let newChannels = currentCfg.allowedChannelIds || [];
    if (isCurrentlyRestricted) {
      newChannels = newChannels.filter((id) => id !== interaction.channelId);
    } else {
      newChannels.push(interaction.channelId);
    }
    await saveGuildAnimePartyConfig(interaction.guildId, {
      ...currentCfg,
      allowedChannelIds: newChannels,
    });
    const statusMsg = !isCurrentlyRestricted
      ? `✅ Le salon <#${interaction.channelId}> a été **ajouté** aux salons autorisés pour Anime Party.`
      : `ℹ️ Le salon <#${interaction.channelId}> a été **retiré** des salons autorisés.`;
    return interaction.reply({ content: statusMsg });
  }
  if (action === 'reset_partie') {
    const hadParty = activeParties.has(interaction.channelId);
    activeParties.delete(interaction.channelId);
    return interaction.reply({
      content: hadParty
        ? '🧹 **La partie bloquée dans ce salon a été réinitialisée avec succès !**'
        : 'ℹ️ Aucune partie n\'était enregistrée dans ce salon.',
      flags: MessageFlags.Ephemeral,
    });
  }
  return interaction.reply({ content: 'Option de configuration inconnue.', flags: MessageFlags.Ephemeral });
}
