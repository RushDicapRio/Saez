import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ComponentType,
} from 'discord.js';
const activePolls = new Map();
export default {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Crée un sondage communautaire avancé avec votes en direct et statistiques')
    .addSubcommand((sub) =>
      sub
        .setName('creer')
        .setDescription('Créer un nouveau vote interactif')
        .addStringOption((opt) => opt.setName('question').setDescription('La question du sondage').setRequired(true))
        .addStringOption((opt) => opt.setName('option_1').setDescription('Première option de réponse').setRequired(true))
        .addStringOption((opt) => opt.setName('option_2').setDescription('Deuxième option de réponse').setRequired(true))
        .addStringOption((opt) => opt.setName('option_3').setDescription('Troisième option (optionnelle)').setRequired(false))
        .addStringOption((opt) => opt.setName('option_4').setDescription('Quatrième option (optionnelle)').setRequired(false))
        .addBooleanOption((opt) => opt.setName('anonyme').setDescription('Masquer les noms des votants').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub.setName('help').setDescription('Guide des fonctionnalités de sondage')
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'help') {
      const embed = new EmbedBuilder()
        .setTitle('📊 Guide des Sondages — Saez Animes')
        .setDescription('Organisez des votes communautaires interactifs avec mise à jour des pourcentages en temps réel !')
        .setColor(0x00e5ff)
        .addFields(
          { name: '🗳️ `/poll creer`', value: 'Lance un sondage avec 2 à 4 options et choix du mode anonyme ou public.' },
          { name: '✨ Caractéristiques', value: '• Votes uniques protégés anti-fraude\n• Barres de progression visuelles\n• Résultats archivables' }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
    if (sub === 'creer') {
      const question = interaction.options.getString('question');
      const opt1 = interaction.options.getString('option_1');
      const opt2 = interaction.options.getString('option_2');
      const opt3 = interaction.options.getString('option_3');
      const opt4 = interaction.options.getString('option_4');
      const isAnonymous = interaction.options.getBoolean('anonyme') || false;
      const pollOptions = [
        { id: '1', label: opt1, emoji: '1️⃣', votes: 0, voters: new Set() },
        { id: '2', label: opt2, emoji: '2️⃣', votes: 0, voters: new Set() },
      ];
      if (opt3) pollOptions.push({ id: '3', label: opt3, emoji: '3️⃣', votes: 0, voters: new Set() });
      if (opt4) pollOptions.push({ id: '4', label: opt4, emoji: '4️⃣', votes: 0, voters: new Set() });
      const pollId = `poll_${Date.now()}`;
      const buildPollEmbed = () => {
        const totalVotes = pollOptions.reduce((acc, o) => acc + o.votes, 0);
        const embed = new EmbedBuilder()
          .setTitle(`📊 Sondage : ${question}`)
          .setDescription(
            `Vote **${isAnonymous ? '🔒 Anonyme' : '👥 Public'}** • Organisé par <@${interaction.user.id}>\n` +
            `Total de votants : **${totalVotes} participant(s)**\n\n` +
            pollOptions
              .map((o) => {
                const pct = totalVotes > 0 ? Math.round((o.votes / totalVotes) * 100) : 0;
                const filled = Math.round(pct / 10);
                const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
                return `${o.emoji} **${o.label}**\n\`[${bar}]\` **${pct}%** (${o.votes} vote(s))\n`;
              })
              .join('\n')
          )
          .setColor(0x00e5ff)
          .setFooter({ text: 'Codé avec ❤️ par Saez | Cliquez sur un bouton ci-dessous pour voter ou modifier votre vote' });
        return embed;
      };
      const buttonsRow = new ActionRowBuilder();
      for (const opt of pollOptions) {
        buttonsRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`${pollId}_${opt.id}`)
            .setLabel(opt.label.substring(0, 40))
            .setEmoji(opt.emoji)
            .setStyle(ButtonStyle.Primary)
        );
      }
      const replyMsg = await interaction.reply({
        embeds: [buildPollEmbed()],
        components: [buttonsRow],
        fetchReply: true,
      });
      const collector = replyMsg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 86400_000,
      });
      collector.on('collect', async (btnInt) => {
        const selectedOptId = btnInt.customId.replace(`${pollId}_`, '');
        const userId = btnInt.user.id;
        for (const opt of pollOptions) {
          if (opt.voters.has(userId)) {
            opt.voters.delete(userId);
            opt.votes = Math.max(0, opt.votes - 1);
          }
        }
        const chosen = pollOptions.find((o) => o.id === selectedOptId);
        if (chosen) {
          chosen.voters.add(userId);
          chosen.votes++;
        }
        await btnInt.update({
          embeds: [buildPollEmbed()],
          components: [buttonsRow],
        });
      });
    }
  },
};
