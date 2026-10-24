import {
  SlashCommandBuilder,
  MessageFlags,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { createBugReport } from '../../services/supportService.js';
import { getDb } from '../../database/mongo.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('bug')
  .setDescription('Centre officiel de signalement de bugs et problèmes techniques Saez')
  .addSubcommand((sub) =>
    sub
      .setName('report')
      .setDescription('Signaler un bug technique, épisode manquant ou erreur du lecteur')
      .addStringOption((opt) =>
        opt
          .setName('titre')
          .setDescription('Titre concis du problème (ex: Épisode 4 ne démarre pas sur Bleach)')
          .setRequired(true)
          .setMaxLength(100)
      )
      .addStringOption((opt) =>
        opt
          .setName('description')
          .setDescription('Détails précis, étapes pour reproduire le bug ou message d\'erreur affiché')
          .setRequired(true)
          .setMaxLength(1000)
      )
      .addStringOption((opt) =>
        opt
          .setName('categorie')
          .setDescription('Type de problème rencontré')
          .setRequired(false)
          .addChoices(
            { name: '📺 Lecteur Vidéo & Streaming', value: 'player' },
            { name: '🐛 Épisode manquant / Lien mort', value: 'episode' },
            { name: '💻 Interface du Logiciel', value: 'ui' },
            { name: '💥 Crash / Fermeture inopinée', value: 'crash' },
            { name: '🌐 Connexion & Authentification', value: 'auth' },
            { name: '🔧 Autre anomalie', value: 'other' }
          )
      )
      .addStringOption((opt) =>
        opt
          .setName('anime')
          .setDescription('Nom de l\'animé concerné (si applicable)')
          .setRequired(false)
      )
      .addStringOption((opt) =>
        opt
          .setName('systeme')
          .setDescription('Votre système d\'exploitation')
          .setRequired(false)
          .addChoices(
            { name: 'Windows 11', value: 'Windows 11' },
            { name: 'Windows 10', value: 'Windows 10' },
            { name: 'Autre', value: 'Autre' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('status')
      .setDescription('Mettre à jour le statut d\'un bug (Modérateurs / Développeurs)')
      .addStringOption((opt) =>
        opt
          .setName('id')
          .setDescription('L\'ID du rapport (ex: BUG-1)')
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName('statut')
          .setDescription('Nouveau statut du rapport')
          .setRequired(true)
          .addChoices(
            { name: '🟡 En cours d\'analyse', value: 'investigating' },
            { name: '🟢 Résolu / Corrigé', value: 'resolved' },
            { name: '⚪ Non reproductible', value: 'cannot_reproduce' },
            { name: '🔴 Rejeté (Pas un bug)', value: 'rejected' }
          )
      )
      .addStringOption((opt) =>
        opt
          .setName('note')
          .setDescription('Commentaire ou mot des développeurs')
          .setRequired(false)
      )
  );
export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  if (subcommand === 'report') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const title = interaction.options.getString('titre');
    const description = interaction.options.getString('description');
    const category = interaction.options.getString('categorie') || 'player';
    const anime = interaction.options.getString('anime');
    const system = interaction.options.getString('systeme') || 'Windows 11';
    try {
      const bugDoc = await createBugReport({
        title,
        category,
        anime,
        description,
        system,
        user: interaction.user,
        guild: interaction.guild,
        client: interaction.client,
      });
      return await interaction.editReply({
        content:
          `✅ **Rapport de bug enregistré avec succès sous l'identifiant \`#${bugDoc.bug_id}\` !**\n\n` +
          `• **Titre :** ${bugDoc.title}\n` +
          `• **Catégorie :** \`${category}\`\n` +
          (anime ? `• **Animé :** ${anime}\n` : '') +
          `• **Statut :** 🔴 En attente d'analyse par l'équipe technique.\n\n` +
          `*Merci de nous aider à perfectionner l'expérience Saez Animes !* ✨`,
      });
    } catch (err) {
      console.error('[BugReport] Erreur :', err);
      return await interaction.editReply({
        content: `❌ Une erreur est survenue lors de l'enregistrement de votre rapport : ${err.message}`,
      });
    }
  }
  if (subcommand === 'status') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
      return await interaction.reply({
        content: '⛔ Vous devez avoir la permission **Gérer les messages** pour modifier le statut d\'un bug.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const bugId = interaction.options.getString('id').toUpperCase();
    const newStatus = interaction.options.getString('statut');
    const note = interaction.options.getString('note');
    const db = getDb();
    const col = db.collection('bug_reports');
    const bug = await col.findOne({ bug_id: bugId });
    if (!bug) {
      return await interaction.reply({
        content: `❌ Aucun rapport de bug trouvé avec l'identifiant \`${bugId}\`.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    const statusLabels = {
      investigating: '🟡 En cours d\'analyse',
      resolved: '🟢 Résolu / Corrigé',
      cannot_reproduce: '⚪ Non reproductible',
      rejected: '🔴 Rejeté',
    };
    await col.updateOne(
      { bug_id: bugId },
      {
        $set: {
          status: newStatus,
          staff_note: note || null,
          resolved_by: interaction.user.tag,
          updated_at: new Date(),
        },
      }
    );
    return await interaction.reply({
      content:
        `✅ **Le statut du rapport \`#${bugId}\` a été mis à jour avec succès !**\n` +
        `• **Nouveau statut :** ${statusLabels[newStatus] || newStatus}\n` +
        (note ? `• **Note du Staff :** *« ${note} »*\n` : '') +
        `• **Responsable :** ${interaction.user}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
