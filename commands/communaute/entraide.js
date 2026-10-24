import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';
import {
  createHelpRequest,
  claimHelpRequest,
  resolveHelpRequest,
  getHelpRequests,
  isCommunityEnabled,
} from '../../services/communityHubService.js';
export const data = new SlashCommandBuilder()
  .setName('entraide')
  .setDescription('Espace d\'entraide communautaire, partage de compétences et dépannage entre membres')
  .addSubcommand((sub) =>
    sub
      .setName('demander')
      .setDescription('Publier une demande d\'aide à la communauté')
      .addStringOption((opt) => opt.setName('titre').setDescription('Sujet ou question principale').setRequired(true))
      .addStringOption((opt) => opt.setName('description').setDescription('Détails complets de votre problème ou blocage').setRequired(true))
      .addStringOption((opt) =>
        opt
          .setName('domaine')
          .setDescription('Domaine concerné')
          .setRequired(false)
          .addChoices(
            { name: '💻 Informatique & Programmation', value: 'Programmation' },
            { name: '🎨 Graphisme, Montage & Art', value: 'Graphisme' },
            { name: '🎌 Anime, Manga & Lore', value: 'Anime' },
            { name: '🎮 Gaming & Configuration', value: 'Gaming' },
            { name: '📚 Études, Devoirs & Langues', value: 'Études' },
            { name: '🌐 Discord & Technique', value: 'Discord' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('liste')
      .setDescription('Consulter la liste des demandes d\'entraide en cours')
      .addStringOption((opt) =>
        opt
          .setName('statut')
          .setDescription('Filtrer par statut')
          .setRequired(false)
          .addChoices(
            { name: '⏳ Ouvertes (en attente d\'aide)', value: 'open' },
            { name: '🤝 Prises en charge', value: 'assigned' },
            { name: '✅ Résolues', value: 'resolved' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('aider')
      .setDescription('Se porter volontaire pour aider sur une demande')
      .addStringOption((opt) => opt.setName('demande_id').setDescription('Identifiant de la demande (ex: help_xxx)').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('terminer')
      .setDescription('Marquer votre demande comme résolue')
      .addStringOption((opt) => opt.setName('demande_id').setDescription('Identifiant de votre demande').setRequired(true))
  );
export async function execute(interaction) {
  const { guild, user, options } = interaction;
  const sub = options.getSubcommand();
  const enabled = await isCommunityEnabled(guild.id);
  if (!enabled) {
    return await interaction.reply({
      content: '🔒 Le module d\'entraide est actuellement désactivé sur ce serveur.',
      flags: MessageFlags.Ephemeral,
    });
  }
  if (sub === 'demander') {
    const title = options.getString('titre');
    const desc = options.getString('description');
    const domain = options.getString('domaine') || 'Général';
    const req = await createHelpRequest({
      guildId: guild.id,
      authorId: user.id,
      authorName: user.username,
      title,
      domain,
      description: desc,
    });
    const embed = new EmbedBuilder()
      .setTitle(`🤝 Demande d'Entraide : ${title}`)
      .setDescription(`**Demandeur :** <@${user.id}>\n**Domaine :** \`${domain}\`\n\n**Description :**\n${desc}`)
      .setColor(0xf59e0b)
      .setFooter({ text: `Codé avec ❤️ par Saez | ID demande : ${req._id} • Utilisez /entraide aider pour la prendre en charge` })
      .setTimestamp();
    return await interaction.reply({ embeds: [embed] });
  }
  if (sub === 'liste') {
    await interaction.deferReply();
    const status = options.getString('statut') || 'open';
    const list = await getHelpRequests(guild.id, status, 8);
    const embed = new EmbedBuilder()
      .setTitle(`🤝 Demandes d'Entraide [${status.toUpperCase()}]`)
      .setColor(0x00e5ff)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (list.length === 0) {
      embed.setDescription('Aucune demande d\'aide trouvée dans cette catégorie.');
    } else {
      list.forEach((r) => {
        const helperText = r.helperId ? `\n🤝 Pris en charge par <@${r.helperId}>` : '';
        embed.addFields({
          name: `📌 ${r.title} (\`${r._id}\`)`,
          value: `👤 Demandeur: <@${r.authorId}> • Domaine: \`${r.domain}\`${helperText}\n💬 *${r.description.slice(0, 120)}...*`,
          inline: false,
        });
      });
    }
    return await interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'aider') {
    const reqId = options.getString('demande_id');
    const res = await claimHelpRequest(reqId, user.id, user.username);
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.error}`, flags: MessageFlags.Ephemeral });
    }
    const embed = new EmbedBuilder()
      .setTitle('🤝 Prise en Charge Enregistrée !')
      .setDescription(`**<@${user.id}>** a pris en charge la demande d'entraide \`${reqId}\` de <@${res.request.authorId}> !\nMerci pour votre esprit de solidarité. ✨`)
      .setColor(0x10b981)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return await interaction.reply({ embeds: [embed] });
  }
  if (sub === 'terminer') {
    const reqId = options.getString('demande_id');
    const res = await resolveHelpRequest(reqId, user.id);
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.error}`, flags: MessageFlags.Ephemeral });
    }
    const embed = new EmbedBuilder()
      .setTitle('✅ Demande d\'Entraide Résolue !')
      .setDescription(`La demande d'entraide \`${reqId}\` a été marquée comme résolue !\nN'hésitez pas à remercier votre bienfaiteur avec \`/communaute merci\` !`)
      .setColor(0x10b981)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return await interaction.reply({ embeds: [embed] });
  }
}
