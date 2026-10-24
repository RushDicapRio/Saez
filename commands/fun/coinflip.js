import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('coinflip')
  .setDescription('Lance une pièce de monnaie (Pile ou Face)');
export async function execute(interaction) {
  const isHeads = Math.random() < 0.5;
  const result = isHeads ? 'Pile' : 'Face';
  const emoji = isHeads ? '🪙' : '🔘';
  const embed = new EmbedBuilder()
    .setTitle(`${emoji} Tirage Pile ou Face !`)
    .setDescription(`La pièce tourne dans les airs et atterrit sur...\n\n# **${emoji} ${result} !**`)
    .setColor(config.colors.accent)
    .setFooter({ text: `Codé avec ❤️ par Saez | Lancé par ${interaction.user.tag}` })
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
}
