import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
  EmbedBuilder,
} from 'discord.js';
import {
  getSecurityConfig,
  saveSecurityConfig,
  DEFAULT_BLACKLISTED_PATTERNS,
} from '../../services/securityService.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('security')
  .setDescription('Système de sécurité, anti-raid, anti-spam et modération automatique')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((sub) =>
    sub
      .setName('status')
      .setDescription('Affiche le statut et la configuration de tous les modules de protection')
  )
  .addSubcommand((sub) =>
    sub
      .setName('antiraid')
      .setDescription('Active ou configure la protection anti-raid')
      .addBooleanOption((opt) =>
        opt
          .setName('actif')
          .setDescription('Activer ou désactiver l\'anti-raid')
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Action en cas de détection d\'attaque raid')
          .setRequired(false)
          .addChoices(
            { name: 'Alerte uniquement dans les logs', value: 'alert' },
            { name: 'Expulser immédiatement les suspects (Kick)', value: 'kick' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('antispam')
      .setDescription('Active ou configure la protection anti-spam et anti-flood')
      .addBooleanOption((opt) =>
        opt
          .setName('actif')
          .setDescription('Activer ou désactiver l\'anti-spam')
          .setRequired(true)
      )
      .addIntegerOption((opt) =>
        opt
          .setName('max_messages')
          .setDescription('Nombre de messages max en 4 secondes (défaut : 5)')
          .setRequired(false)
          .setMinValue(2)
          .setMaxValue(15)
      )
      .addIntegerOption((opt) =>
        opt
          .setName('timeout_minutes')
          .setDescription('Durée de l\'exclusion temporaire en minutes (défaut : 5)')
          .setRequired(false)
          .setMinValue(1)
          .setMaxValue(60)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('words')
      .setDescription('Gère la liste des mots et insultes interdits')
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Action à effectuer')
          .setRequired(true)
          .addChoices(
            { name: 'Ajouter un mot / insulte', value: 'add' },
            { name: 'Retirer un mot personnalisé', value: 'remove' },
            { name: 'Lister les mots interdits', value: 'list' }
          )
      )
      .addStringOption((opt) =>
        opt
          .setName('mot')
          .setDescription('Le mot ou l\'expression à bloquer ou retirer')
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('links')
      .setDescription('Configure la protection contre les liens et invitations Discord')
      .addStringOption((opt) =>
        opt
          .setName('mode')
          .setDescription('Politique sur les liens')
          .setRequired(true)
          .addChoices(
            { name: 'Bloquer uniquement les invitations Discord (discord.gg)', value: 'invites' },
            { name: 'Bloquer TOUS les liens web', value: 'all' },
            { name: 'Autoriser les liens', value: 'none' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('logs')
      .setDescription('Définit le salon où envoyer les alertes de sécurité')
      .addChannelOption((opt) =>
        opt
          .setName('salon')
          .setDescription('Salon textuel des logs de sécurité')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  );
export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const cfg = await getSecurityConfig();
  if (subcommand === 'status') {
    const embed = new EmbedBuilder()
      .setTitle('🛡️ Tableau de Bord Sécurité & Protection — Saez')
      .setDescription('Voici l\'état en temps réel de tous les boucliers de protection actifs sur le serveur :')
      .setColor(config.colors.primary)
      .setThumbnail(config.assets.logoUrl)
      .addFields(
        {
          name: '⚔️ Anti-Raid & Attaques',
          value: `Statut : ${cfg.antiraid.enabled ? '🟢 **Actif**' : '🔴 Inactif'}\nSensibilité : \`${cfg.antiraid.max_joins} joins / ${cfg.antiraid.window_seconds}s\`\nAction : \`${cfg.antiraid.action.toUpperCase()}\``,
          inline: true,
        },
        {
          name: '🛑 Anti-Spam & Flood',
          value: `Statut : ${cfg.antispam.enabled ? '🟢 **Actif**' : '🔴 Inactif'}\nSeuil : \`${cfg.antispam.max_messages} msgs / ${cfg.antispam.window_seconds}s\`\nSanction : Exclusion \`${cfg.antispam.timeout_minutes}m\``,
          inline: true,
        },
        {
          name: '🔗 Anti-Liens & Pub',
          value: `Statut : ${cfg.antilink.enabled ? '🟢 **Actif**' : '🔴 Inactif'}\nBlocage : \`${cfg.antilink.block_all_links ? 'Tous les liens' : cfg.antilink.block_discord_invites ? 'Invitations Discord' : 'Aucun'}\``,
          inline: true,
        },
        {
          name: '🤬 Filtre Mots Interdits & Haine',
          value: `Statut : ${cfg.word_filter.enabled ? '🟢 **Actif**' : '🔴 Inactif'}\nBase par défaut : \`${DEFAULT_BLACKLISTED_PATTERNS.length} mots (Racisme, Homophobie, etc.)\`\nMots personnalisés : \`${cfg.word_filter.custom_words?.length || 0} mots\``,
          inline: true,
        },
        {
          name: '📂 Salon des Logs Sécurité',
          value: `<#${cfg.log_channel_id || '1214631699401408602'}>`,
          inline: true,
        }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système de Protection Avancée' })
      .setTimestamp();
    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
  if (subcommand === 'antiraid') {
    const actif = interaction.options.getBoolean('actif');
    const action = interaction.options.getString('action');
    cfg.antiraid.enabled = actif;
    if (action) cfg.antiraid.action = action;
    await saveSecurityConfig(cfg);
    return await interaction.reply({
      content: `✅ Module **Anti-Raid** ${actif ? '🟢 **activé**' : '🔴 **désactivé**'} (Action : \`${cfg.antiraid.action}\`).`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (subcommand === 'antispam') {
    const actif = interaction.options.getBoolean('actif');
    const max = interaction.options.getInteger('max_messages');
    const timeout = interaction.options.getInteger('timeout_minutes');
    cfg.antispam.enabled = actif;
    if (max) cfg.antispam.max_messages = max;
    if (timeout) cfg.antispam.timeout_minutes = timeout;
    await saveSecurityConfig(cfg);
    return await interaction.reply({
      content: `✅ Module **Anti-Spam** ${actif ? '🟢 **activé**' : '🔴 **désactivé**'} (Seuil : ${cfg.antispam.max_messages} msgs, Mute : ${cfg.antispam.timeout_minutes}m).`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (subcommand === 'words') {
    const action = interaction.options.getString('action');
    const mot = interaction.options.getString('mot');
    if (!cfg.word_filter.custom_words) {
      cfg.word_filter.custom_words = [];
    }
    if (action === 'add') {
      if (!mot) {
        return await interaction.reply({
          content: '❌ Veuillez préciser le mot à ajouter : `/security words action:add mot:<mot>`',
          flags: MessageFlags.Ephemeral,
        });
      }
      const cleanMot = mot.toLowerCase().trim();
      if (!cfg.word_filter.custom_words.includes(cleanMot)) {
        cfg.word_filter.custom_words.push(cleanMot);
        await saveSecurityConfig(cfg);
      }
      return await interaction.reply({
        content: `✅ Le mot/expression « **${cleanMot}** » a été ajouté à la liste noire. Tout message le contenant sera automatiquement supprimé.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (action === 'remove') {
      if (!mot) {
        return await interaction.reply({
          content: '❌ Veuillez préciser le mot à retirer.',
          flags: MessageFlags.Ephemeral,
        });
      }
      const cleanMot = mot.toLowerCase().trim();
      cfg.word_filter.custom_words = cfg.word_filter.custom_words.filter((w) => w !== cleanMot);
      await saveSecurityConfig(cfg);
      return await interaction.reply({
        content: `🗑️ Le mot « **${cleanMot}** » a été retiré de votre liste noire personnalisée.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (action === 'list') {
      const customs = cfg.word_filter.custom_words || [];
      const embed = new EmbedBuilder()
        .setTitle('🤬 Filtre Mots Interdits & Insultes')
        .setDescription(
          `• **Base par défaut protégée :** ${DEFAULT_BLACKLISTED_PATTERNS.length} termes (racisme, homophobie, haine, insultes graves).\n\n` +
          `• **Mots personnalisés ajoutés (${customs.length}) :**\n` +
          (customs.length > 0 ? customs.map((w) => `• \`${w}\``).join(', ') : '*Aucun mot personnalisé.*')
        )
        .setColor(config.colors.accent)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Les messages détectés sont supprimés avec alerte dans les logs.' });
      return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  }
  if (subcommand === 'links') {
    const mode = interaction.options.getString('mode');
    if (mode === 'none') {
      cfg.antilink.enabled = false;
      cfg.antilink.block_discord_invites = false;
      cfg.antilink.block_all_links = false;
    } else if (mode === 'invites') {
      cfg.antilink.enabled = true;
      cfg.antilink.block_discord_invites = true;
      cfg.antilink.block_all_links = false;
    } else if (mode === 'all') {
      cfg.antilink.enabled = true;
      cfg.antilink.block_discord_invites = true;
      cfg.antilink.block_all_links = true;
    }
    await saveSecurityConfig(cfg);
    return await interaction.reply({
      content: `✅ Protection contre les liens mise à jour sur : **${mode === 'all' ? 'Bloquer TOUS les liens' : mode === 'invites' ? 'Bloquer invitations Discord' : 'Autoriser'}**.`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (subcommand === 'logs') {
    const salon = interaction.options.getChannel('salon');
    cfg.log_channel_id = salon.id;
    await saveSecurityConfig(cfg);
    return await interaction.reply({
      content: `✅ Le salon de logs de sécurité est désormais : ${salon}.`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
