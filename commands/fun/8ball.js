import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { config } from '../../config.js';
const RESPONSES = [
  { text: "C'est une certitude absolue !", type: "pos" },
  { text: "Sans l'ombre d'un doute.", type: "pos" },
  { text: "Oui, assurément.", type: "pos" },
  { text: "Le destin est en ta faveur !", type: "pos" },
  { text: "Comme le dit le Roi des Pirates : Fonce !", type: "pos" },
  { text: "Les astres et le cosmos disent OUI.", type: "pos" },
  { text: "Repose ta question plus tard...", type: "neu" },
  { text: "Le futur est encore voilé par les brumes.", type: "neu" },
  { text: "Mieux vaut ne pas te le révéler maintenant.", type: "neu" },
  { text: "Concentration maximale et réessaye.", type: "neu" },
  { text: "Ne compte pas là-dessus.", type: "neg" },
  { text: "Ma réponse est un NON catégorique.", type: "neg" },
  { text: "Mes sources indiquent que c'est voué à l'échec.", type: "neg" },
  { text: "Même avec la volonté du D, c'est impossible.", type: "neg" },
  { text: "Les perspectives ne sont pas bonnes du tout.", type: "neg" },
];
export const data = new SlashCommandBuilder()
  .setName('8ball')
  .setDescription('Pose une question à la Boule Magique 8-Ball pour connaître ton avenir')
  .addStringOption((opt) =>
    opt.setName('question').setDescription('Votre question pour la boule magique').setRequired(true)
  );
export async function execute(interaction) {
  const question = (interaction.options?.getString ? interaction.options.getString('question') : null) || 'Quel est mon avenir sur Saez ?';
  const answer = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
  const colors = {
    pos: 0x10b981,
    neu: 0xf59e0b,
    neg: 0xef4444,
  };
  const embed = new EmbedBuilder()
    .setTitle('🎱 Boule Magique 8-Ball')
    .setColor(colors[answer.type] || config.colors.primary)
    .setThumbnail(config.assets.logoUrl)
    .addFields(
      { name: '❓ Question', value: `*${question}*`, inline: false },
      { name: '🔮 Réponse de l\'Oracle', value: `**${answer.text}**`, inline: false }
    )
    .setFooter({ text: `Codé avec ❤️ par Saez | Demandé par ${interaction.user.tag}` })
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
}
