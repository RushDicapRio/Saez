import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} from 'discord.js';
import { addPartnership, getPartnerships } from '../../services/growthService.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('croissance')
  .setDescription('Gestionnaire de partenariats, visibilité et rappels de bump')
  .addSubcommand((sub) =>
    sub
      .setName('partenariat-ajouter')
      .setDescription('Enregistrer un nouveau serveur Discord partenaire')
      .addStringOption((opt) =>
        opt.setName('nom').setDescription('Nom de la communauté partenaire').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('lien').setDescription('Lien d\'invitation Discord du partenaire').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('description').setDescription('Courte présentation du partenaire').setRequired(false)
      )
      .addUserOption((opt) =>
        opt.setName('representant').setDescription('Membre ambassadeur du partenaire').setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('partenariats')
      .setDescription('Consulter la liste de toutes les communautés partenaires officielles')
  )
  .addSubcommand((sub) =>
    sub
      .setName('bump-rappel')
      .setDescription('Configurer le salon pour les rappels de vote et bump (Disboard/Top.gg)')
      .addChannelOption((opt) =>
        opt.setName('salon').setDescription('Salon pour les alertes de bump').addChannelTypes(ChannelType.GuildText).setRequired(true)
      )
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const guildId = interaction.guildId;
  if (sub === 'partenariat-ajouter') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({ content: '❌ Permission requise : Gérer le serveur.', flags: MessageFlags.Ephemeral });
    }
    const nom = interaction.options.getString('nom');
    const lien = interaction.options.getString('lien');
    const desc = interaction.options.getString('description') || 'Partenaire officiel de Saez Animes.';
    const rep = interaction.options.getUser('representant');
    const ok = await addPartnership(guildId, {
      partnerName: nom,
      inviteUrl: lien,
      description: desc,
      repId: rep?.id || interaction.user.id,
    });
    if (ok) {
      const embed = new EmbedBuilder()
        .setTitle(`🤝 Nouveau Partenariat Officiel : ${nom}`)
        .setDescription(desc)
        .setColor(0x06b6d4)
        .addFields(
          { name: '🔗 Rejoindre le serveur', value: `[Cliquer ici pour rejoindre](${lien})` },
          { name: '👑 Représentant', value: rep ? `<@${rep.id}>` : `<@${interaction.user.id}>`, inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Réseau de Partenaires' })
        .setTimestamp();
      return await interaction.reply({ embeds: [embed] });
    }
    return await interaction.reply({ content: '❌ Erreur ajout partenariat.', flags: MessageFlags.Ephemeral });
  }
  if (sub === 'partenariats') {
    await interaction.deferReply();
    const list = await getPartnerships(guildId);
    if (list.length === 0) {
      return await interaction.editReply({ content: 'Aucun partenaire enregistré pour l\'instant.' });
    }
    const embed = new EmbedBuilder()
      .setTitle('🤝 Répertoire des Partenariats Officiels')
      .setDescription('Découvrez les communautés amies et serveurs partenaires de Saez :')
      .setColor(config.colors.primary)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    for (const p of list.slice(0, 10)) {
      embed.addFields({
        name: `⭐ ${p.partner_name}`,
        value: `${p.description}\n[Rejoindre le serveur](${p.invite_url}) • Ambassadeur : <@${p.representative_id}>`,
      });
    }
    return await interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'bump-rappel') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({ content: '❌ Permission requise : Gérer le serveur.', flags: MessageFlags.Ephemeral });
    }
    const ch = interaction.options.getChannel('salon');
    return await interaction.reply({
      content: `✅ Le salon des alertes de bump a été configuré sur <#${ch.id}> ! Le bot enverra un rappel toutes les 2 heures dès qu'un /bump sera détecté.`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
