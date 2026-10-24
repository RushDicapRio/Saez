import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import {
  createTeam,
  joinTeam,
  leaveTeam,
  getTeamByName,
  getTopTeams,
} from '../../services/teamService.js';
export const data = new SlashCommandBuilder()
  .setName('team')
  .setDescription('Gestion des équipes et clans du serveur')
  .addSubcommand((sub) =>
    sub
      .setName('creer')
      .setDescription('Créer une nouvelle équipe ou guilde sur le serveur')
      .addStringOption((opt) =>
        opt.setName('nom').setDescription('Nom complet de votre équipe (ex: Straw Hats)').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('tag').setDescription('Tag court (2 à 5 caractères, ex: SH)').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('description').setDescription('Devise ou courte description').setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('rejoindre')
      .setDescription('Rejoindre une équipe existante sur le serveur')
      .addStringOption((opt) =>
        opt.setName('nom').setDescription('Nom de l\'équipe à rejoindre').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('quitter')
      .setDescription('Quitter votre équipe actuelle')
  )
  .addSubcommand((sub) =>
    sub
      .setName('info')
      .setDescription('Afficher les détails et statistiques d\'une équipe')
      .addStringOption((opt) =>
        opt.setName('nom').setDescription('Nom de l\'équipe').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('classement')
      .setDescription('Afficher le classement des équipes du serveur')
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'creer') {
    const name = interaction.options.getString('nom');
    const tag = interaction.options.getString('tag');
    const description = interaction.options.getString('description') || '';
    const res = await createTeam({
      guildId: interaction.guild.id,
      name,
      tag,
      description,
      leaderId: interaction.user.id,
    });
    if (!res.success) {
      return interaction.reply({ content: `❌ ${res.message || 'Impossible de créer l\'équipe.'}`, ephemeral: true });
    }
    const embed = new EmbedBuilder()
      .setTitle(`⚔️ Équipe Créée : [${res.team.tag}] ${res.team.name}`)
      .setDescription(description || 'Une nouvelle force s\'éveille sur le serveur !')
      .setColor(0x10b981)
      .addFields(
        { name: '👑 Leader', value: `<@${interaction.user.id}>`, inline: true },
        { name: '🏷️ Tag de Clan', value: `\`[${res.team.tag}]\``, inline: true },
        { name: '👥 Membres', value: '1', inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Invitez vos amis avec /team rejoindre ' + res.team.name })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'rejoindre') {
    const name = interaction.options.getString('nom');
    const res = await joinTeam(interaction.guild.id, name, interaction.user.id);
    if (!res.success) {
      return interaction.reply({ content: `❌ ${res.message || 'Impossible de rejoindre l\'équipe.'}`, ephemeral: true });
    }
    return interaction.reply({
      content: `🎉 Vous avez rejoint l'équipe **[${res.team.tag}] ${res.team.name}** ! L'équipe compte désormais **${res.team.members.length}** membre(s).`,
    });
  }
  if (sub === 'quitter') {
    const res = await leaveTeam(interaction.guild.id, interaction.user.id);
    if (!res.success) {
      return interaction.reply({ content: `❌ ${res.message || 'Erreur.'}`, ephemeral: true });
    }
    return interaction.reply({ content: `ℹ️ ${res.message}`, ephemeral: true });
  }
  if (sub === 'info') {
    await interaction.deferReply();
    const name = interaction.options.getString('nom');
    const team = await getTeamByName(interaction.guild.id, name);
    if (!team) {
      return interaction.editReply({ content: `❌ Aucune équipe trouvée au nom de "${name}".` });
    }
    const embed = new EmbedBuilder()
      .setTitle(`🛡️ Profil d'Équipe : [${team.tag}] ${team.name}`)
      .setDescription(team.description || '*Aucune devise définie.*')
      .setColor(0x00e5ff)
      .addFields(
        { name: '👑 Fondateur & Chef', value: `<@${team.leaderId}>`, inline: true },
        { name: '⭐ Score Total', value: `**${team.score}** pts`, inline: true },
        { name: '🏆 Victoires', value: `**${team.wins}** win(s)`, inline: true },
        { name: `👥 Membres (${team.members.length})`, value: team.members.map((id) => `<@${id}>`).join(', ') || 'Aucun membre' }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Système d\'Équipes Saez Animes' })
      .setTimestamp();
    return interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'classement') {
    await interaction.deferReply();
    const teams = await getTopTeams(interaction.guild.id, 10);
    const embed = new EmbedBuilder()
      .setTitle('⚔️ Classement des Meilleures Équipes & Clans')
      .setColor(0xa855f7)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système de Clans' })
      .setTimestamp();
    if (teams.length === 0) {
      embed.setDescription('Aucune équipe n\'a encore été créée sur le serveur. Utilisez `/team creer` pour fonder la première !');
    } else {
      const medals = ['🥇', '🥈', '🥉'];
      const lines = teams.map((t, idx) => {
        const medal = medals[idx] || `\`#${idx + 1}\``;
        return `${medal} **[${t.tag}] ${t.name}** — **${t.score}** pts (\`${t.wins} victoires | ${t.members.length} membres\`)`;
      });
      embed.setDescription(lines.join('\n\n'));
    }
    return interaction.editReply({ embeds: [embed] });
  }
}
