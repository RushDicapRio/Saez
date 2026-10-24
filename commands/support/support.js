import {
  SlashCommandBuilder,
  MessageFlags,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';
import {
  buildSupportHubEmbed,
  buildSupportHubComponents,
  runSaezDiagnostic,
} from '../../services/supportService.js';
import { config } from '../../config.js';
import { sendLog } from '../../services/logService.js';
export const data = new SlashCommandBuilder()
  .setName('support')
  .setDescription('Centre d\'assistance officiel et aide interactive Saez Animes')
  .addSubcommand((sub) =>
    sub
      .setName('hub')
      .setDescription('Affiche le centre d\'assistance interactif avec FAQ, Diagnostic et Tickets')
  )
  .addSubcommand((sub) =>
    sub
      .setName('panel')
      .setDescription('Déployer le panneau fixe d\'Assistance & Support (remplace le panneau de ticket)')
      .addChannelOption((opt) =>
        opt
          .setName('salon')
          .setDescription('Salon où poster le panneau fixe (par défaut le salon actuel)')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('diag')
      .setDescription('Effectue un diagnostic en direct de tous les services et serveurs Saez')
  )
  .addSubcommand((sub) =>
    sub
      .setName('contact')
      .setDescription('Envoyer une alerte d\'aide à l\'équipe de support et aux helpers')
      .addStringOption((opt) =>
        opt
          .setName('message')
          .setDescription('Décrivez brièvement votre problème ou demande')
          .setRequired(true)
          .setMaxLength(500)
      )
  )
  .addSubcommand((sub) =>
    sub.setName('help').setDescription('Affiche la liste des commandes et options du support')
  );
export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  if (subcommand === 'help') {
    const embed = new EmbedBuilder()
      .setTitle('🎫 Guide & Commandes — Support Saez Animes')
      .setDescription('Voici l\'ensemble des commandes disponibles pour contacter l\'équipe d\'assistance :')
      .setColor(0x00e5ff)
      .addFields(
        { name: '🌐 `/support hub`', value: 'Ouvre le hub complet d\'assistance interactif avec FAQ, Diagnostic et Tickets.' },
        { name: '📌 `/support panel [salon]` *(Mod/Admin)*', value: 'Déploie le panneau fixe interactif de tickets dans un salon.' },
        { name: '🩺 `/support diag`', value: 'Exécute un diagnostic direct de la passerelle, de la BDD et des services Saez.' },
        { name: '🚨 `/support contact <message>`', value: 'Envoie une alerte immédiate aux helpers et à l\'équipe de support.' },
        { name: '🎫 `/ticket creer [sujet]`', value: 'Ouvre un ticket privé avec salon dédié et transcript automatique.' },
        { name: '❓ `/faq [question]`', value: 'Consulte la Foire Aux Questions de l\'application et du bot.' },
        { name: '🐛 `/bug <description>`', value: 'Signale un bug ou problème technique aux développeurs.' }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Centre d\'Assistance', iconURL: interaction.guild?.iconURL() || undefined });
    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
  if (subcommand === 'hub') {
    const embed = buildSupportHubEmbed();
    const components = buildSupportHubComponents();
    return await interaction.reply({
      embeds: [embed],
      components,
    });
  }
  if (subcommand === 'panel') {
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) &&
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      return await interaction.reply({
        content: '❌ Vous devez avoir la permission **Gérer les salons** pour déployer ce panneau.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const targetChannel = interaction.options.getChannel('salon') || interaction.channel;
    const embed = buildSupportHubEmbed();
    const components = buildSupportHubComponents();
    await targetChannel.send({
      embeds: [embed],
      components,
    });
    return await interaction.reply({
      content: `✅ Le **Panneau d'Assistance & Support officiel** a été déployé dans ${targetChannel} !`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (subcommand === 'diag') {
    await interaction.deferReply();
    const embed = await runSaezDiagnostic(interaction.client);
    return await interaction.editReply({ embeds: [embed] });
  }
  if (subcommand === 'contact') {
    const msg = interaction.options.getString('message');
    const alertEmbed = new EmbedBuilder()
      .setTitle('🚨 Demande d\'Assistance Membre')
      .setDescription(`**${interaction.user}** demande de l'aide :\n\n> *« ${msg} »*`)
      .setColor(0xf59e0b)
      .addFields(
        { name: '👤 Utilisateur', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
        { name: '📍 Salon', value: `<#${interaction.channelId}>`, inline: true }
      )
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    await sendLog(interaction.guild, 'serveur', alertEmbed).catch(() => {});
    return await interaction.reply({
      content:
        `✅ **Votre demande d'aide a été transmise à notre équipe !**\n` +
        `Un membre du support ou un helper va vous répondre sous peu.\n` +
        `*Astuce : Vous pouvez également ouvrir un ticket privé avec \`/ticket\` ou consulter la \`/faq\`.*`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
