import { SlashCommandBuilder } from 'discord.js';
import { runSaezDiagnostic } from '../../services/supportService.js';
export const data = new SlashCommandBuilder()
  .setName('diagnostic')
  .setDescription('Bilan de santé et statut en temps réel des serveurs et services Saez Animes');
export async function execute(interaction) {
  await interaction.deferReply();
  const embed = await runSaezDiagnostic(interaction.client);
  return await interaction.editReply({ embeds: [embed] });
}
