import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';
import { config } from '../../config.js';
export default {
  data: new SlashCommandBuilder()
    .setName('fun')
    .setDescription('Centre de mini-jeux et divertissements communautaires Saez Animes')
    .addSubcommand((sub) =>
      sub
        .setName('roll')
        .setDescription('Lancer un dé aléatoire (ex: D6, D20, D100)')
        .addIntegerOption((opt) =>
          opt.setName('faces').setDescription('Nombre de faces (défaut : 6)').setMinValue(2).setMaxValue(1000).setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub.setName('coinflip').setDescription('Lancer une pièce de monnaie (Pile ou Face)')
    )
    .addSubcommand((sub) =>
      sub
        .setName('8ball')
        .setDescription('Poser une question à la Boule Magique 8-Ball')
        .addStringOption((opt) =>
          opt.setName('question').setDescription('Votre question pour la boule magique').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('shifumi')
        .setDescription('Pierre, Feuille, Ciseaux interactif contre le Bot ou un membre')
        .addUserOption((opt) =>
          opt.setName('adversaire').setDescription('Le membre à affronter (laisser vide pour jouer contre le Bot)').setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('morpion')
        .setDescription('Partie interactive de Morpion (Tic-Tac-Toe)')
        .addUserOption((opt) => opt.setName('adversaire').setDescription('Membre à défier').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub.setName('quiz').setDescription('Lancer un quiz anime instantané avec 4 propositions')
    )
    .addSubcommand((sub) =>
      sub.setName('guess').setDescription('Deviner l\'animé à partir d\'une silhouette ou d\'un indice')
    )
    .addSubcommand((sub) =>
      sub.setName('games').setDescription('Menu interactif de tous les jeux communautaires disponibles')
    )
    .addSubcommand((sub) =>
      sub
        .setName('channel')
        .setDescription('Configurer le salon officiel réservé aux mini-jeux (Admin)')
        .addChannelOption((opt) => opt.setName('salon').setDescription('Salon texte dédié aux jeux').setRequired(false))
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'roll') {
      const sides = interaction.options.getInteger('faces') || 6;
      const roll = Math.floor(Math.random() * sides) + 1;
      const embed = new EmbedBuilder()
        .setTitle(`🎲 Lancer de Dé (D${sides})`)
        .setDescription(`Le dé roule sur la table...\n\n# 🎲 **${roll}** *(sur ${sides})*`)
        .setColor(roll === sides ? 0x10b981 : roll === 1 ? 0xef4444 : config.colors.primary)
        .setFooter({ text: `Codé avec ❤️ par Saez | Lancé par ${interaction.user.tag}` })
        .setTimestamp();
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'coinflip') {
      const isHeads = Math.random() < 0.5;
      const result = isHeads ? 'Pile' : 'Face';
      const emoji = isHeads ? '🪙' : '🔘';
      const embed = new EmbedBuilder()
        .setTitle(`${emoji} Tirage Pile ou Face !`)
        .setDescription(`La pièce tourne dans les airs et atterrit sur...\n\n# **${emoji} ${result} !**`)
        .setColor(config.colors.accent)
        .setFooter({ text: `Codé avec ❤️ par Saez | Lancé par ${interaction.user.tag}` })
        .setTimestamp();
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === '8ball') {
      const question = interaction.options.getString('question') || 'Quel est mon avenir sur Saez ?';
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
      const answer = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
      const colors = { pos: 0x10b981, neu: 0xf59e0b, neg: 0xef4444 };
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
      return await interaction.reply({ embeds: [embed] });
    }
    if (sub === 'shifumi') {
      const mod = await import('./shifumi.js').catch(() => import('./_shifumi.js'));
      if (mod && mod.execute) return await mod.execute(interaction);
    }
    if (sub === 'morpion') {
      const mod = await import('./morpion.js').catch(() => import('./_morpion.js'));
      if (mod && mod.execute) return await mod.execute(interaction);
    }
    if (sub === 'quiz') {
      const mod = await import('./quiz.js').catch(() => import('./_quiz.js'));
      if (mod && mod.execute) return await mod.execute(interaction);
    }
    if (sub === 'guess') {
      const mod = await import('./guess.js').catch(() => import('./_guess.js'));
      if (mod && mod.execute) return await mod.execute(interaction);
    }
    if (sub === 'games') {
      const mod = await import('./games.js').catch(() => import('./_games.js'));
      if (mod && mod.execute) return await mod.execute(interaction);
    }
    if (sub === 'channel') {
      const mod = await import('./funchannel.js').catch(() => import('./_funchannel.js'));
      if (mod && mod.execute) return await mod.execute(interaction);
    }
  },
};
