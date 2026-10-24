import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('roll')
  .setDescription('Lance un dé aléatoire (ex: dé à 6 faces, 20 faces ou 100 faces)')
  .addIntegerOption((opt) =>
    opt
      .setName('faces')
      .setDescription('Nombre de faces du dé (défaut : 6, max : 1000)')
      .setMinValue(2)
      .setMaxValue(1000)
      .setRequired(false)
  );
export async function execute(interaction) {
  const sides = (interaction.options?.getInteger ? interaction.options.getInteger('faces') : null) || 6;
  const roll = Math.floor(Math.random() * sides) + 1;
  const embed = new EmbedBuilder()
    .setTitle(`🎲 Lancer de Dé (D${sides})`)
    .setDescription(`Le dé roule sur la table...\n\n# 🎲 **${roll}** *(sur ${sides})*`)
    .setColor(roll === sides ? 0x10b981 : roll === 1 ? 0xef4444 : config.colors.primary)
    .setFooter({ text: `Codé avec ❤️ par Saez | Lancé par ${interaction.user.tag}` })
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
}
