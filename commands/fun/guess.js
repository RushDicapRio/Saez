import {
  SlashCommandBuilder,
  EmbedBuilder,
  ComponentType,
} from 'discord.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('guess')
  .setDescription('Lance une partie du Juste Prix (Devine le nombre secret entre 1 et 100)');
export async function execute(interaction) {
  const secretNumber = Math.floor(Math.random() * 100) + 1;
  let attempts = 0;
  const embed = new EmbedBuilder()
    .setTitle('🔢 Le Juste Nombre ! (1 à 100)')
    .setDescription(
      `J'ai choisi un nombre secret entre **1** et **100** !\n\n` +
      `Écrivez simplement votre proposition dans ce salon pour tenter votre chance.\n` +
      `⏱️ *Vous avez 60 secondes !*`
    )
    .setColor(config.colors.accent)
    .setThumbnail(config.assets.logoUrl)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Écrivez un chiffre dans le chat !' });
  await interaction.reply({ embeds: [embed] });
  const filter = (m) => !m.author.bot && /^\d+$/.test(m.content.trim());
  const collector = interaction.channel.createMessageCollector({
    filter,
    time: 60000,
  });
  collector.on('collect', async (msg) => {
    const val = parseInt(msg.content.trim(), 10);
    if (val < 1 || val > 100) return;
    attempts++;
    if (val === secretNumber) {
      collector.stop('won');
      const winEmbed = new EmbedBuilder()
        .setTitle('🎯 NOMBRE TROUVÉ !')
        .setDescription(
          `🎉 **Félicitations ${msg.author} !** Tu as deviné le nombre secret **${secretNumber}** !\n\n` +
          `• 🔢 Nombre total d'essais : \`${attempts}\`\n` +
          `• 🏆 Bravo pour ta perspicacité !`
        )
        .setColor(0x10b981)
        .setThumbnail('https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif')
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await msg.reply({ embeds: [winEmbed] });
    } else if (val < secretNumber) {
      await msg.react('⬆️').catch(() => {});
      await msg.reply({
        content: `📈 C'est **plus grand** que **${val}** ! (Essai #${attempts})`,
      }).catch(() => {});
    } else {
      await msg.react('⬇️').catch(() => {});
      await msg.reply({
        content: `📉 C'est **plus petit** que **${val}** ! (Essai #${attempts})`,
      }).catch(() => {});
    }
  });
  collector.on('end', async (_, reason) => {
    if (reason === 'time') {
      const endEmbed = new EmbedBuilder()
        .setTitle('⌛ Temps Écoulé !')
        .setDescription(
          `Personne n'a trouvé le nombre secret à temps !\n` +
          `• **Le nombre secret était :** \`${secretNumber}\`\n` +
          `• **Nombre d'essais tentés :** \`${attempts}\``
        )
        .setColor(0xef4444)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      await interaction.followUp({ embeds: [endEmbed] }).catch(() => {});
    }
  });
}
