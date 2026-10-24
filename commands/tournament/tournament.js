import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';
import {
  createTournament,
  joinTournament,
  getActiveTournaments,
  closeTournament,
} from '../../services/tournamentService.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('tournoi')
  .setDescription('Gestionnaire complet de tournois e-sport & compétitions sur le serveur')
  .addSubcommand((sub) =>
    sub
      .setName('creer')
      .setDescription('Créer un nouveau tournoi avec inscriptions ouvertes')
      .addStringOption((opt) =>
        opt.setName('titre').setDescription('Nom du tournoi (ex: Saez Smash Cup)').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('jeu').setDescription('Jeu ou discipline (ex: Valorant, Smash, Échecs, Rocket League)').setRequired(true)
      )
      .addIntegerOption((opt) =>
        opt.setName('max_joueurs').setDescription('Nombre max de participants (ex: 8, 16, 32)').setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('inscrire')
      .setDescription('S\'inscrire au tournoi en cours')
      .addStringOption((opt) =>
        opt.setName('tournoi_id').setDescription('ID du tournoi').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('liste')
      .setDescription('Afficher la liste des tournois actifs et leurs participants')
  )
  .addSubcommand((sub) =>
    sub
      .setName('cloturer')
      .setDescription('[Admin] Clôturer un tournoi et annoncer le grand vainqueur')
      .addStringOption((opt) =>
        opt.setName('tournoi_id').setDescription('ID du tournoi').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('vainqueur').setDescription('Pseudo ou mention du vainqueur').setRequired(true)
      )
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guildId;
  if (sub === 'creer') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageEvents) && !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({ content: '❌ Permission requise : Gérer les événements.', flags: MessageFlags.Ephemeral });
    }
    const titre = interaction.options.getString('titre');
    const jeu = interaction.options.getString('jeu');
    const max = interaction.options.getInteger('max_joueurs') || 16;
    const t = await createTournament({
      guildId,
      title: titre,
      game: jeu,
      maxParticipants: max,
      authorId: interaction.user.id,
    });
    if (!t) return await interaction.reply({ content: '❌ Erreur création tournoi.', flags: MessageFlags.Ephemeral });
    const embed = new EmbedBuilder()
      .setTitle(`🏆 Nouveau Tournoi Ouvert : ${titre}`)
      .setDescription(`Le tournoi sur **${jeu}** est officiellement ouvert aux inscriptions !\nPour participer : \`/tournoi inscrire tournoi_id:${t._id}\``)
      .setColor(config.colors.accent)
      .addFields(
        { name: '🎮 Jeu', value: jeu, inline: true },
        { name: '👥 Places', value: `0 / ${max}`, inline: true },
        { name: '🆔 ID du tournoi', value: `\`${t._id}\``, inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Tournois • Inscriptions ouvertes' })
      .setTimestamp();
    return await interaction.reply({ embeds: [embed] });
  }
  if (sub === 'inscrire') {
    const tournoiId = interaction.options.getString('tournoi_id');
    const res = await joinTournament(tournoiId, interaction.user.id, interaction.user.username);
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.message}`, flags: MessageFlags.Ephemeral });
    }
    return await interaction.reply({
      content: `🎉 Inscription confirmée pour **${interaction.user.username}** ! (${res.count} participant(s) inscrits)`,
    });
  }
  if (sub === 'liste') {
    await interaction.deferReply();
    const list = await getActiveTournaments(guildId);
    if (list.length === 0) {
      return await interaction.editReply({ content: 'Aucun tournoi actif pour le moment. Créez-en un avec `/tournoi creer` !' });
    }
    const embed = new EmbedBuilder()
      .setTitle('🏆 Tournois Actifs sur le Serveur')
      .setColor(config.colors.primary)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    for (const t of list) {
      const partList = t.participants.length > 0
        ? t.participants.map(p => `• ${p.username}`).slice(0, 10).join('\n')
        : '*Aucun inscrit pour le moment*';
      embed.addFields({
        name: `🎮 ${t.title} (${t.game})`,
        value: `**Places :** ${t.participants.length} / ${t.max_participants}\n**ID :** \`${t._id}\`\n**Inscrits :**\n${partList}`,
        inline: false,
      });
    }
    return await interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'cloturer') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({ content: '❌ Permission requise : Gérer le serveur.', flags: MessageFlags.Ephemeral });
    }
    const tournoiId = interaction.options.getString('tournoi_id');
    const vainqueur = interaction.options.getString('vainqueur');
    const ok = await closeTournament(tournoiId, vainqueur);
    if (ok) {
      return await interaction.reply({
        content: `🎉 Le tournoi a été clôturé avec succès ! Félicitations à **${vainqueur}** pour la victoire !`,
      });
    }
    return await interaction.reply({ content: '❌ Impossible de clôturer le tournoi.', flags: MessageFlags.Ephemeral });
  }
}
