import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  AttachmentBuilder,
  MessageFlags,
} from 'discord.js';
export const data = new SlashCommandBuilder()
  .setName('transcript')
  .setDescription('Archivage et export textuel ou HTML des conversations de salon')
  .addSubcommand((sub) =>
    sub
      .setName('salon')
      .setDescription('Générer et télécharger l\'archive des messages récents du salon actuel')
      .addIntegerOption((opt) =>
        opt
          .setName('nombre')
          .setDescription('Nombre de messages à exporter (1 à 100, par défaut 50)')
          .setMinValue(1)
          .setMaxValue(100)
          .setRequired(false)
      )
  );
export async function execute(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
    return await interaction.reply({
      content: '❌ Vous devez avoir la permission **Gérer les messages** pour générer des transcripts.',
      flags: MessageFlags.Ephemeral,
    });
  }
  const limit = interaction.options.getInteger('nombre') || 50;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const messages = await interaction.channel.messages.fetch({ limit });
    const sorted = Array.from(messages.values()).reverse();
    const lines = sorted.map((m) => {
      const date = new Date(m.createdTimestamp).toLocaleString('fr-FR');
      const author = `${m.author.username} (${m.author.id})`;
      let content = m.content || '';
      if (m.attachments.size > 0) {
        content += ` [Pièce(s) jointe(s) : ${Array.from(m.attachments.values()).map(a => a.url).join(', ')}]`;
      }
      return `[${date}] ${author}: ${content}`;
    });
    const fileContent = `=== TRANSCRIPT OFFICIEL DU SALON #${interaction.channel.name} ===\nServeur : ${interaction.guild.name} (${interaction.guild.id})\nDate de génération : ${new Date().toLocaleString('fr-FR')}\nTotal messages : ${sorted.length}\n${'='.repeat(70)}\n\n${lines.join('\n')}`;
    const buffer = Buffer.from(fileContent, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, {
      name: `transcript-${interaction.channel.name}-${Date.now()}.txt`,
    });
    const embed = new EmbedBuilder()
      .setTitle(`📜 Transcript Généré — #${interaction.channel.name}`)
      .setDescription(`L'archive de **${sorted.length} messages** a été générée avec succès. Le fichier complet est joint ci-dessous.`)
      .setColor(0x38bdf8)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Archive & Audit Logs' })
      .setTimestamp();
    return await interaction.editReply({
      embeds: [embed],
      files: [attachment],
    });
  } catch (err) {
    return await interaction.editReply({
      content: `❌ Erreur lors de la génération du transcript : ${err.message}`,
    });
  }
}
