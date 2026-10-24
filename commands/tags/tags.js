import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';
import { createTag, getTag, deleteTag, listTags } from '../../services/tagService.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('tag')
  .setDescription('Bibliothèque de macros et réponses pré-enregistrées du serveur')
  .addSubcommand((sub) =>
    sub
      .setName('afficher')
      .setDescription('Afficher le contenu d\'un tag')
      .addStringOption((opt) =>
        opt.setName('nom').setDescription('Nom du tag').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('creer')
      .setDescription('Créer ou modifier une macro/tag d\'entraide')
      .addStringOption((opt) =>
        opt.setName('nom').setDescription('Identifiant du tag (ex: regles, rpc, vip)').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('contenu').setDescription('Texte complet du message à envoyer').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('liste')
      .setDescription('Consulter la liste de tous les tags créés sur le serveur')
  )
  .addSubcommand((sub) =>
    sub
      .setName('supprimer')
      .setDescription('Supprimer un tag existant')
      .addStringOption((opt) =>
        opt.setName('nom').setDescription('Nom du tag à supprimer').setRequired(true)
      )
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guildId;
  if (sub === 'afficher') {
    const nom = interaction.options.getString('nom');
    const tag = await getTag(guildId, nom);
    if (!tag) {
      return await interaction.reply({
        content: `❌ Le tag « **${nom}** » n'existe pas. Utilisez \`/tag liste\` pour voir les tags disponibles.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    return await interaction.reply({ content: tag.content });
  }
  if (sub === 'creer') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
      return await interaction.reply({
        content: '❌ Vous devez avoir la permission **Gérer les messages** pour créer des tags.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const nom = interaction.options.getString('nom');
    const contenu = interaction.options.getString('contenu');
    const ok = await createTag(guildId, nom, contenu, interaction.user.id);
    if (ok) {
      return await interaction.reply({
        content: `✅ Le tag « **${nom}** » a été enregistré ! Invoquez-le avec \`/tag afficher nom:${nom}\`.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    return await interaction.reply({ content: '❌ Erreur enregistrement tag.', flags: MessageFlags.Ephemeral });
  }
  if (sub === 'supprimer') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
      return await interaction.reply({
        content: '❌ Permission requise : Gérer les messages.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const nom = interaction.options.getString('nom');
    const ok = await deleteTag(guildId, nom);
    if (ok) {
      return await interaction.reply({
        content: `✅ Le tag « **${nom}** » a été supprimé.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    return await interaction.reply({ content: `❌ Tag « **${nom}** » introuvable.`, flags: MessageFlags.Ephemeral });
  }
  if (sub === 'liste') {
    await interaction.deferReply();
    const tags = await listTags(guildId, 25);
    if (tags.length === 0) {
      return await interaction.editReply({
        content: 'Aucun tag n\'est encore enregistré sur ce serveur. Créez-en un avec `/tag creer` !',
      });
    }
    const embed = new EmbedBuilder()
      .setTitle('📚 Annuaire des Tags & Macros du Serveur')
      .setDescription(tags.map(t => `• **${t.name}** (${t.uses || 0} utilisations)`).join('\n'))
      .setColor(config.colors.primary)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Invoquez un tag avec /tag afficher <nom>' });
    return await interaction.editReply({ embeds: [embed] });
  }
}
