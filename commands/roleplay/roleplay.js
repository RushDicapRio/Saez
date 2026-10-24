import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder()
  .setName('roleplay')
  .setDescription('Système de Jeu de Rôle (JDR / RPG), lancers de dés et fiches d\'aventurier')
  .addSubcommand((sub) =>
    sub
      .setName('des')
      .setDescription('Lancer un ou plusieurs dés de jeu de rôle (ex: 1d20, 3d6, 1d100)')
      .addStringOption((opt) => opt.setName('formule').setDescription('Notation de dé (ex: 1d20, 2d6+3, 1d100)').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('fiche')
      .setDescription('Créer ou consulter votre fiche de personnage Roleplay')
      .addStringOption((opt) => opt.setName('nom').setDescription('Nom de votre héros').setRequired(true))
      .addStringOption((opt) =>
        opt
          .setName('classe')
          .setDescription('Classe anime')
          .setRequired(true)
          .addChoices(
            { name: '⚔️ Épéiste / Guerrier', value: 'Épéiste' },
            { name: '🧙‍♂️ Mage Élémentaire', value: 'Mage' },
            { name: '🥷 Assassin de l\'Ombre', value: 'Assassin' },
            { name: '🛡️ Paladin / Protecteur', value: 'Paladin' },
            { name: '🏹 Archer d\'Élite', value: 'Archer' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('action')
      .setDescription('Tenter une action risquée avec un jet de dé 20 sous tension')
      .addStringOption((opt) => opt.setName('description').setDescription('Ce que vous tentez d\'accomplir').setRequired(true))
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'des') {
    const raw = interaction.options.getString('formule').trim().toLowerCase();
    const regex = /^(\d+)?d(\d+)([+-]\d+)?$/;
    const match = raw.match(regex);
    if (!match) {
      return interaction.reply({
        content: '❌ Notation invalide. Utilisez le format standard du JDR : `1d20`, `2d6`, `3d10+4`, `1d100`...',
        ephemeral: true,
      });
    }
    const count = parseInt(match[1] || '1', 10);
    const faces = parseInt(match[2], 10);
    const mod = parseInt(match[3] || '0', 10);
    if (count > 20 || faces > 1000) {
      return interaction.reply({ content: '❌ Maximum 20 dés et 1000 faces par lancer.', ephemeral: true });
    }
    const rolls = [];
    let sum = 0;
    for (let i = 0; i < count; i++) {
      const roll = Math.floor(Math.random() * faces) + 1;
      rolls.push(roll);
      sum += roll;
    }
    const total = sum + mod;
    const isCrit = count === 1 && faces === 20 && rolls[0] === 20;
    const isFumble = count === 1 && faces === 20 && rolls[0] === 1;
    const embed = new EmbedBuilder()
      .setTitle('🎲 Lancer de Dés Roleplay')
      .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .setColor(isCrit ? 0xfbbf24 : isFumble ? 0xef4444 : 0x00e5ff)
      .setDescription(
        `Formule : \`${raw}\`\nRésultats : [${rolls.join(', ')}]${mod !== 0 ? ` + (${mod})` : ''}\n\n` +
        `### Résultat Total : **${total}**\n` +
        (isCrit ? '🌟 **RÉUSSITE CRITIQUE NATURELLE (20) !** 🌟' : isFumble ? '💀 **ÉCHEC CRITIQUE NATUREL (1) !** 💀' : '')
      )
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'fiche') {
    const name = interaction.options.getString('nom');
    const roleClass = interaction.options.getString('classe');
    const embed = new EmbedBuilder()
      .setTitle(`📜 Fiche de Personnage : ${name}`)
      .setDescription(`Aventurier incarné par <@${interaction.user.id}>\nClasse : **${roleClass}**`)
      .setColor(0xa855f7)
      .addFields(
        { name: '❤️ Points de Vie (PV)', value: '**100 / 100**', inline: true },
        { name: '⭐ Niveau', value: '**Niveau 1**', inline: true },
        { name: '🛡️ Armure', value: '**12 CA**', inline: true },
        { name: '⚔️ Caractéristiques', value: 'Force : `14` • Dextérité : `15` • Intelligence : `12` • Chance : `13`' }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Système JDR Saez Anime' });
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'action') {
    const act = interaction.options.getString('description');
    const roll = Math.floor(Math.random() * 20) + 1;
    let verdict = '';
    let color = 0x00e5ff;
    if (roll >= 18) {
      verdict = '🌟 **Succès Triomphal !** L\'action réussit au-delà de toute espérance !';
      color = 0x10b981;
    } else if (roll >= 10) {
      verdict = '✅ **Succès !** L\'action réussit convenablement.';
      color = 0x00e5ff;
    } else if (roll >= 4) {
      verdict = '⚠️ **Échec partiel ou avec complication.**';
      color = 0xf59e0b;
    } else {
      verdict = '💀 **Échec cuisant !** La situation se complique gravement...';
      color = 0xef4444;
    }
    const embed = new EmbedBuilder()
      .setTitle('⚔️ Tentative d\'Action Roleplay')
      .setDescription(`**<@${interaction.user.id}> tente :**\n*"${act}"*\n\n🎲 Jet de Dé : **${roll} / 20**\n${verdict}`)
      .setColor(color)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return interaction.reply({ embeds: [embed] });
  }
}
