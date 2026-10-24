import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  PermissionFlagsBits,
} from 'discord.js';
import {
  createDebate,
  getDebate,
  voteDebate,
  addDebateArgument,
  closeDebate,
  getActiveDebates,
  isCommunityEnabled,
} from '../../services/communityHubService.js';
export const data = new SlashCommandBuilder()
  .setName('debat')
  .setDescription('Organisation et animation de débats communautaires structurés et argumentés')
  .addSubcommand((sub) =>
    sub
      .setName('creer')
      .setDescription('Lancer un débat structuré avec vote interactif en temps réel')
      .addStringOption((opt) => opt.setName('sujet').setDescription('Sujet du débat (ex: Sub vs Dub, Shonen vs Seinen)').setRequired(true))
      .addStringOption((opt) => opt.setName('description').setDescription('Contexte ou règles du débat').setRequired(false))
      .addIntegerOption((opt) => opt.setName('duree').setDescription('Durée en heures avant clôture (défaut: 24h)').setMinValue(1).setMaxValue(168).setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('argumenter')
      .setDescription('Publier un argument formel lié à un débat existant')
      .addStringOption((opt) => opt.setName('debat_id').setDescription('Identifiant du débat (ex: deb_xxx)').setRequired(true))
      .addIntegerOption((opt) =>
        opt
          .setName('position')
          .setDescription('Votre position dans le débat')
          .setRequired(true)
          .addChoices(
            { name: 'Pour 👍', value: 0 },
            { name: 'Contre 👎', value: 1 },
            { name: 'Nuancé / Autre 🤔', value: 2 }
          )
      )
      .addStringOption((opt) => opt.setName('argument').setDescription('Votre raisonnement argumenté').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('resultats')
      .setDescription('Consulter les votes et arguments détaillés d\'un débat')
      .addStringOption((opt) => opt.setName('debat_id').setDescription('Identifiant du débat').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('cloturer')
      .setDescription('Clôturer un débat actif et figer le résultat définitif')
      .addStringOption((opt) => opt.setName('debat_id').setDescription('Identifiant du débat').setRequired(true))
  );
export async function execute(interaction) {
  const { guild, user, member, options } = interaction;
  const sub = options.getSubcommand();
  const enabled = await isCommunityEnabled(guild.id);
  if (!enabled) {
    return await interaction.reply({
      content: '🔒 Le module des débats est actuellement désactivé sur ce serveur.',
      flags: MessageFlags.Ephemeral,
    });
  }
  if (sub === 'creer') {
    const topic = options.getString('sujet');
    const desc = options.getString('description') || 'Partagez vos arguments et votez ci-dessous !';
    const hours = options.getInteger('duree') || 24;
    const debate = await createDebate({
      guildId: guild.id,
      authorId: user.id,
      authorName: user.username,
      topic,
      description: desc,
      options: ['Pour 👍', 'Contre 👎', 'Nuancé 🤔'],
      durationHours: hours,
    });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`deb_vote_${debate._id}_0`).setLabel('Pour 👍 (0 • 0%)').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`deb_vote_${debate._id}_1`).setLabel('Contre 👎 (0 • 0%)').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`deb_vote_${debate._id}_2`).setLabel('Nuancé 🤔 (0 • 0%)').setStyle(ButtonStyle.Secondary)
    );
    const embed = new EmbedBuilder()
      .setTitle('🎙️ Débat Communautaire Ouvert !')
      .setDescription(`### **${topic}**\n\n${desc}\n\n⏳ Clôture dans **${hours} heure(s)**.\nID : \`${debate._id}\``)
      .setColor(0x00e5ff)
      .setFooter({ text: `Codé avec ❤️ par Saez | Proposé par ${user.username} • Utilisez /debat argumenter pour détailler votre avis` })
      .setTimestamp();
    return await interaction.reply({ embeds: [embed], components: [row] });
  }
  if (sub === 'argumenter') {
    const debId = options.getString('debat_id');
    const pos = options.getInteger('position');
    const text = options.getString('argument');
    const res = await addDebateArgument(debId, {
      userId: user.id,
      username: user.username,
      optionIndex: pos,
      argumentText: text,
    });
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.error}`, flags: MessageFlags.Ephemeral });
    }
    const posLabel = pos === 0 ? 'Pour 👍' : pos === 1 ? 'Contre 👎' : 'Nuancé 🤔';
    const embed = new EmbedBuilder()
      .setTitle(`💬 Nouvel Argument • ${posLabel}`)
      .setDescription(`**<@${user.id}>** avance cet argument pour le débat \`${debId}\` :\n\n> *« ${text} »*`)
      .setColor(pos === 0 ? 0x10b981 : pos === 1 ? 0xf43f5e : 0x38bdf8)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return await interaction.reply({ embeds: [embed] });
  }
  if (sub === 'resultats') {
    const debId = options.getString('debat_id');
    const debate = await getDebate(debId);
    if (!debate || debate.guildId !== guild.id) {
      return await interaction.reply({ content: '❌ Débat introuvable sur ce serveur.', flags: MessageFlags.Ephemeral });
    }
    const totalVotes = Object.keys(debate.votes || {}).length;
    const counts = debate.options.map(() => 0);
    Object.values(debate.votes || {}).forEach((v) => {
      if (counts[v] !== undefined) counts[v]++;
    });
    const embed = new EmbedBuilder()
      .setTitle(`🎙️ Bilan du Débat : ${debate.topic}`)
      .setDescription(`Statut : **${debate.status === 'active' ? '🟢 En cours' : '🔒 Clos'}** • **${totalVotes}** votant(s) au total`)
      .setColor(0x00e5ff)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    debate.options.forEach((opt, idx) => {
      const cnt = counts[idx] || 0;
      const pct = totalVotes > 0 ? Math.round((cnt / totalVotes) * 100) : 0;
      const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
      embed.addFields({
        name: `${opt}`,
        value: `\`${bar}\` **${pct}%** (${cnt} votes)`,
        inline: false,
      });
    });
    if (debate.arguments && debate.arguments.length > 0) {
      const lastArgs = debate.arguments.slice(-3).map((a) => `• **${a.username}** (${debate.options[a.optionIndex] || 'Avis'}) : *« ${a.text.slice(0, 100)} »*`);
      embed.addFields({ name: '💭 Derniers arguments déposés', value: lastArgs.join('\n') });
    }
    return await interaction.reply({ embeds: [embed] });
  }
  if (sub === 'cloturer') {
    const debId = options.getString('debat_id');
    const debate = await getDebate(debId);
    if (!debate || debate.guildId !== guild.id) {
      return await interaction.reply({ content: '❌ Débat introuvable.', flags: MessageFlags.Ephemeral });
    }
    const isAuthor = debate.authorId === user.id;
    const isStaff = member.permissions.has(PermissionFlagsBits.ManageMessages);
    if (!isAuthor && !isStaff) {
      return await interaction.reply({ content: '❌ Seul l\'auteur du débat ou un modérateur peut le clôturer.', flags: MessageFlags.Ephemeral });
    }
    await closeDebate(debId, user.id);
    return await interaction.reply({
      content: `🔒 **Le débat \`${debId}\` (${debate.topic}) est désormais officiellement clos !** Les votes sont gelés.`,
    });
  }
}
