import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
  EmbedBuilder,
} from 'discord.js';
import {
  getWelcomeConfig,
  saveWelcomeConfig,
  buildWelcomeEmbed,
  buildLeaveEmbed,
} from '../../services/welcomeService.js';
import { config } from '../../config.js';
function isValidHttpUrl(string) {
  if (!string || typeof string !== 'string') return false;
  try {
    const u = new URL(string);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (_) {
    return false;
  }
}
export const data = new SlashCommandBuilder()
  .setName('welcome')
  .setDescription('Configuration du système de Bienvenue et d’Au Revoir')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub
      .setName('config')
      .setDescription('Configure les salons de bienvenue et d\'au revoir')
      .addChannelOption((opt) =>
        opt
          .setName('salon_bienvenue')
          .setDescription('Salon où envoyer les messages de bienvenue')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false)
      )
      .addChannelOption((opt) =>
        opt
          .setName('salon_aurevoir')
          .setDescription('Salon où envoyer les messages d\'au revoir')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false)
      )
      .addBooleanOption((opt) =>
        opt
          .setName('actif_bienvenue')
          .setDescription('Activer ou désactiver les messages de bienvenue')
          .setRequired(false)
      )
      .addBooleanOption((opt) =>
        opt
          .setName('actif_aurevoir')
          .setDescription('Activer ou désactiver les messages d\'au revoir')
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('image')
      .setDescription('Personnalise l\'image/bannière du message de bienvenue ou d\'au revoir')
      .addStringOption((opt) =>
        opt
          .setName('type')
          .setDescription('Choisir entre Bienvenue ou Au revoir')
          .setRequired(true)
          .addChoices(
            { name: 'Bienvenue', value: 'welcome' },
            { name: 'Au revoir', value: 'leave' }
          )
      )
      .addStringOption((opt) =>
        opt
          .setName('url')
          .setDescription('URL directe de l\'image (http:// ou https://)')
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('message')
      .setDescription('Personnalise le texte du message')
      .addStringOption((opt) =>
        opt
          .setName('type')
          .setDescription('Choisir entre Bienvenue ou Au revoir')
          .setRequired(true)
          .addChoices(
            { name: 'Bienvenue', value: 'welcome' },
            { name: 'Au revoir', value: 'leave' }
          )
      )
      .addStringOption((opt) =>
        opt
          .setName('texte')
          .setDescription('Variables: {user}, {username}, {count}, {server}, {reglement}, {roles}')
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('test')
      .setDescription('Envoie un aperçu du message de bienvenue ou d\'au revoir dans ce salon')
      .addStringOption((opt) =>
        opt
          .setName('type')
          .setDescription('Type de message à tester')
          .setRequired(true)
          .addChoices(
            { name: 'Bienvenue', value: 'welcome' },
            { name: 'Au revoir', value: 'leave' }
          )
      )
  );
export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const cfg = await getWelcomeConfig();
  if (subcommand === 'config') {
    const welcomeCh = interaction.options.getChannel('salon_bienvenue');
    const leaveCh = interaction.options.getChannel('salon_aurevoir');
    const welcomeActive = interaction.options.getBoolean('actif_bienvenue');
    const leaveActive = interaction.options.getBoolean('actif_aurevoir');
    if (welcomeCh) cfg.welcome.channel_id = welcomeCh.id;
    if (leaveCh) cfg.leave.channel_id = leaveCh.id;
    if (welcomeActive !== null) cfg.welcome.enabled = welcomeActive;
    if (leaveActive !== null) cfg.leave.enabled = leaveActive;
    await saveWelcomeConfig(cfg);
    const embed = new EmbedBuilder()
      .setTitle('⚙️ Configuration Bienvenue / Au Revoir')
      .setColor(config.colors.primary)
      .addFields(
        {
          name: '🎉 Bienvenue',
          value: `Statut : ${cfg.welcome.enabled ? '🟢 Activé' : '🔴 Désactivé'}\nSalon : <#${cfg.welcome.channel_id}>`,
          inline: true,
        },
        {
          name: '👋 Au Revoir',
          value: `Statut : ${cfg.leave.enabled ? '🟢 Activé' : '🔴 Désactivé'}\nSalon : <#${cfg.leave.channel_id}>`,
          inline: true,
        }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système de Bienvenue' })
      .setTimestamp();
    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
  if (subcommand === 'image') {
    const type = interaction.options.getString('type');
    const url = interaction.options.getString('url').trim();
    if (!isValidHttpUrl(url)) {
      return await interaction.reply({
        content: '❌ L\'URL fournie est invalide ! Elle doit commencer par `http://` ou `https://`.',
        flags: MessageFlags.Ephemeral,
      });
    }
    if (type === 'welcome') {
      cfg.welcome.banner_url = url;
    } else {
      cfg.leave.banner_url = url;
    }
    await saveWelcomeConfig(cfg);
    const embed = new EmbedBuilder()
      .setTitle(`🖼️ Image de ${type === 'welcome' ? 'Bienvenue' : 'Départ'} Mise à Jour`)
      .setDescription(`La nouvelle image a été enregistrée avec succès :\n\`${url}\``)
      .setImage(url)
      .setColor(config.colors.success)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
  if (subcommand === 'message') {
    const type = interaction.options.getString('type');
    const texte = interaction.options.getString('texte');
    if (type === 'welcome') {
      cfg.welcome.message = texte;
    } else {
      cfg.leave.message = texte;
    }
    await saveWelcomeConfig(cfg);
    return await interaction.reply({
      content: `✅ Le message de **${type === 'welcome' ? 'Bienvenue' : 'Départ'}** a été modifié !\nUtilisez \`/welcome test type:${type}\` pour vérifier le rendu.`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (subcommand === 'test') {
    const type = interaction.options.getString('type');
    if (type === 'welcome') {
      const embed = buildWelcomeEmbed(interaction.member, cfg);
      await interaction.reply({
        content: `*Aperçu du message de bienvenue :* (Ping : ${interaction.member})`,
        embeds: [embed],
      });
    } else {
      const embed = buildLeaveEmbed(interaction.member, cfg);
      await interaction.reply({
        content: `*Aperçu du message d'au revoir :*`,
        embeds: [embed],
      });
    }
  }
}
