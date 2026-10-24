import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import {
  getUserTasks,
  addTask,
  completeTask,
  deleteTask,
} from '../../services/taskService.js';
export const data = new SlashCommandBuilder()
  .setName('task')
  .setDescription('Gestionnaire personnel de tâches et To-Do list')
  .addSubcommand((sub) =>
    sub
      .setName('ajouter')
      .setDescription('Ajouter une nouvelle tâche personnelle')
      .addStringOption((opt) =>
        opt.setName('titre').setDescription('Description ou titre de la tâche').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('liste')
      .setDescription('Afficher votre liste de tâches personnelles')
  )
  .addSubcommand((sub) =>
    sub
      .setName('terminer')
      .setDescription('Marquer une tâche comme terminée')
      .addStringOption((opt) =>
        opt.setName('id').setDescription('Identifiant de la tâche').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('supprimer')
      .setDescription('Supprimer définitivement une tâche')
      .addStringOption((opt) =>
        opt.setName('id').setDescription('Identifiant de la tâche').setRequired(true)
      )
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'ajouter') {
    const title = interaction.options.getString('titre');
    const task = await addTask(interaction.user.id, title);
    const embed = new EmbedBuilder()
      .setTitle('📝 Tâche Ajoutée !')
      .setDescription(`Votre tâche a été enregistrée avec succès.\n\n📌 **${task.title}**\nIdentifiant : \`${task._id}\``)
      .setColor(0x10b981)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Pour la marquer terminée : /task terminer ' + task._id })
      .setTimestamp();
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (sub === 'liste') {
    await interaction.deferReply({ ephemeral: true });
    const tasks = await getUserTasks(interaction.user.id);
    const embed = new EmbedBuilder()
      .setTitle(`📋 Vos Tâches Personnelles (${tasks.length})`)
      .setColor(0x00e5ff)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Productivité Personnelle' })
      .setTimestamp();
    if (tasks.length === 0) {
      embed.setDescription('Vous n\'avez aucune tâche enregistrée. Utilisez `/task ajouter` pour en ajouter une !');
    } else {
      const lines = tasks.map((t) => {
        const icon = t.completed ? '✅' : '⏳';
        const strike = t.completed ? `~~${t.title}~~` : `**${t.title}**`;
        return `${icon} ${strike} (ID: \`${t._id}\`)`;
      });
      embed.setDescription(lines.join('\n'));
    }
    return interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'terminer') {
    const taskId = interaction.options.getString('id');
    const res = await completeTask(interaction.user.id, taskId);
    if (!res) {
      return interaction.reply({ content: '❌ Tâche introuvable ou déjà terminée.', ephemeral: true });
    }
    return interaction.reply({
      content: `🎉 Tâche validée et marquée comme terminée : **${res.title}** !`,
      ephemeral: true,
    });
  }
  if (sub === 'supprimer') {
    const taskId = interaction.options.getString('id');
    const ok = await deleteTask(interaction.user.id, taskId);
    if (!ok) {
      return interaction.reply({ content: '❌ Tâche introuvable.', ephemeral: true });
    }
    return interaction.reply({
      content: `🗑️ La tâche \`${taskId}\` a été supprimée de votre liste.`,
      ephemeral: true,
    });
  }
}
