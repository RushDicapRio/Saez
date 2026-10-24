import {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import {
  SAEZ_FAQ,
  buildFaqSelectMenu,
  buildFaqEmbed,
} from '../../services/supportService.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('faq')
  .setDescription('Base de connaissances et réponses instantanées Saez Animes')
  .addSubcommand((sub) =>
    sub
      .setName('list')
      .setDescription('Affiche le menu déroulant de toutes les questions fréquentes')
  )
  .addSubcommand((sub) =>
    sub
      .setName('search')
      .setDescription('Rechercher une solution dans la base de connaissances')
      .addStringOption((opt) =>
        opt
          .setName('recherche')
          .setDescription('Mot-clé (ex: écran noir, RPC, sous-titres, VIP, cache...)')
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('view')
      .setDescription('Consulter directement la réponse à une question précise')
      .addStringOption((opt) =>
        opt
          .setName('question')
          .setDescription('La question souhaitée')
          .setRequired(true)
          .addChoices(
            ...SAEZ_FAQ.map((item) => ({
              name: `${item.emoji} ${item.question}`.slice(0, 100),
              value: item.id,
            }))
          )
      )
  );
export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  if (subcommand === 'list') {
    const embed = new EmbedBuilder()
      .setTitle('❓ Foire Aux Questions (FAQ) — Saez Animes')
      .setDescription(
        'Retrouvez ici les réponses instantanées aux questions les plus fréquentes sur l\'application et le service.\n\n' +
        '**Choisissez votre question dans le menu déroulant ci-dessous :**'
      )
      .setColor(config.colors.primary)
      .setThumbnail(config.assets.logoUrl)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Sélectionnez une question pour afficher la réponse' });
    const menu = buildFaqSelectMenu();
    return await interaction.reply({
      embeds: [embed],
      components: [menu],
    });
  }
  if (subcommand === 'view') {
    const id = interaction.options.getString('question');
    const item = SAEZ_FAQ.find((f) => f.id === id);
    if (!item) {
      return await interaction.reply({
        content: '❌ Question introuvable dans la base FAQ.',
        flags: MessageFlags.Ephemeral,
      });
    }
    return await interaction.reply({
      embeds: [buildFaqEmbed(item)],
    });
  }
  if (subcommand === 'search') {
    const query = interaction.options.getString('recherche').toLowerCase().trim();
    const results = SAEZ_FAQ.filter(
      (f) =>
        f.question.toLowerCase().includes(query) ||
        f.answer.toLowerCase().includes(query) ||
        f.category.toLowerCase().includes(query)
    );
    if (results.length === 0) {
      return await interaction.reply({
        content: `🔍 Aucun résultat trouvé pour **« ${query} »**.\n*Vous pouvez ouvrir un ticket avec \`/ticket\` ou taper \`/faq list\` pour voir tous les sujets.*`,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (results.length === 1) {
      return await interaction.reply({
        embeds: [buildFaqEmbed(results[0])],
      });
    }
    const embed = new EmbedBuilder()
      .setTitle(`🔍 Résultats de recherche pour : « ${query} »`)
      .setDescription(
        `Nous avons trouvé **${results.length} sujet(s)** correspondant à votre recherche :\n\n` +
        results
          .map((r, i) => `**${i + 1}.** ${r.emoji} **${r.question}**\n> *${r.category}*`)
          .join('\n\n') +
        `\n\n*Utilisez \`/faq view\` pour lire la solution complète.*`
      )
      .setColor(config.colors.primary)
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return await interaction.reply({ embeds: [embed] });
  }
}
