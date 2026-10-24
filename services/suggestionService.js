import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ChannelType,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { getDb } from '../database/mongo.js';
import { ObjectId } from 'mongodb';
import { config } from '../config.js';
import { sendLog } from './logService.js';
export function buildSuggestionPanelEmbed() {
  return new EmbedBuilder()
    .setTitle('💡 Boîte à Suggestions & Demandes — Saez Animes')
    .setDescription(
      'Bienvenue dans l\'espace communautaire de **Saez Animes** ! 🎉\n\n' +
      'Vous souhaitez proposer un animé, suggérer une nouvelle option logicielle ou donner une idée pour le serveur ?\n\n' +
      '**Cliquez sur le bouton de votre choix ci-dessous pour ouvrir le formulaire instantané :**\n\n' +
      '• 🎌 **Demander un Animé :** Nouvel animé, saison suivante, film ou OAV (VF / VOSTFR).\n' +
      '• 💻 **Fonctionnalité Logiciel :** Idée d\'amélioration pour le lecteur, l\'application ou le streaming.\n' +
      '• ⚡ **Amélioration Serveur :** Proposition pour animer ou organiser le Discord.\n' +
      '• 💡 **Boîte à Idées Générale :** Toute autre proposition ou retour d\'expérience.\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      '🔄 *Chaque demande est automatiquement synchronisée avec l\'application Saez et soumise au vote des membres.*'
    )
    .setColor(config.colors.primary)
    .setThumbnail(config.assets.logoUrl)
    .setImage(config.assets.bannerUrl)
    .setFooter({
      text: 'Codé avec ❤️ par Saez | Saez Animes • Système de Suggestions & Demandes Officiel',
      iconURL: config.assets.logoUrl,
    });
}
export function buildSuggestionPanelButtons() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_sugg_create_anime')
      .setLabel('Demander un Animé')
      .setEmoji('🎌')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('btn_sugg_create_feature')
      .setLabel('Fonctionnalité Logiciel')
      .setEmoji('💻')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_sugg_create_discord')
      .setLabel('Amélioration Serveur')
      .setEmoji('⚡')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_sugg_create_other')
      .setLabel('Boîte à Idées')
      .setEmoji('💡')
      .setStyle(ButtonStyle.Success)
  );
  return [row];
}
export async function fetchAnimeCover(animeTitle) {
  if (!animeTitle || typeof animeTitle !== 'string') return null;
  const cleanTitle = animeTitle
    .replace(/\b(saison|season|s)\s*\d+/gi, '')
    .replace(/\b(vf|vostfr|vost)\b/gi, '')
    .replace(/[()[\]{}]/g, '')
    .trim() || animeTitle.trim();
  try {
    const query = `
      query ($search: String) {
        Media(search: $search, type: ANIME) {
          coverImage {
            extraLarge
            large
          }
        }
      }
    `;
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query, variables: { search: cleanTitle } }),
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data = await res.json();
      return (
        data?.data?.Media?.coverImage?.extraLarge ||
        data?.data?.Media?.coverImage?.large ||
        null
      );
    }
  } catch (err) {
    console.debug('[AniList] Recherche affiche ignorée:', err.message);
  }
  return null;
}
export function createSuggestionModal(categoryKey = 'anime') {
  const titles = {
    anime: '🎌 Demande d\'Animé — Saez',
    feature: '💻 Fonctionnalité Logiciel — Saez',
    discord: '⚡ Amélioration Serveur — Saez',
    other: '💡 Boîte à Idées — Saez',
  };
  const placeholders = {
    anime: {
      title: 'Ex: Solo Leveling Saison 2, DanDaDan...',
      desc: 'Précisez la saison, les épisodes souhaités ou autres infos...',
      link: 'Lien Nautiljon, MyAnimeList ou streaming de référence (Optionnel)',
    },
    feature: {
      title: 'Ex: Mode Picture-in-Picture dans le lecteur',
      desc: 'Expliquez comment fonctionne cette fonctionnalité et son utilité...',
      link: 'Lien d\'exemple ou capture d\'écran (Optionnel)',
    },
    discord: {
      title: 'Ex: Ajout d\'un salon vocal karaoké le week-end',
      desc: 'Décrivez votre proposition pour améliorer le serveur Discord...',
      link: 'Lien ou idée (Optionnel)',
    },
    other: {
      title: 'Ex: Partenariat ou tournoi communautaire',
      desc: 'Expliquez en détails votre idée...',
      link: 'Lien ou référence (Optionnel)',
    },
  };
  const currentTexts = placeholders[categoryKey] || placeholders.other;
  const modal = new ModalBuilder()
    .setCustomId(`modal_sugg_submit_${categoryKey}`)
    .setTitle(titles[categoryKey] || '💡 Nouvelle Suggestion');
  const titleInput = new TextInputBuilder()
    .setCustomId('sugg_title')
    .setLabel(categoryKey === 'anime' ? 'Nom de l\'animé demandé' : 'Titre de votre demande')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(currentTexts.title)
    .setMinLength(2)
    .setMaxLength(100)
    .setRequired(true);
  const descInput = new TextInputBuilder()
    .setCustomId('sugg_desc')
    .setLabel('Description et précisions')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder(currentTexts.desc)
    .setMinLength(5)
    .setMaxLength(1000)
    .setRequired(true);
  const linkInput = new TextInputBuilder()
    .setCustomId('sugg_link')
    .setLabel('Lien ou référence (Optionnel)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(currentTexts.link)
    .setRequired(false);
  if (categoryKey === 'anime') {
    const langInput = new TextInputBuilder()
      .setCustomId('sugg_lang')
      .setLabel('Langue souhaitée (VF, VOSTFR, les deux)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: VOSTFR, VF, ou VF & VOSTFR')
      .setValue('VOSTFR & VF')
      .setMaxLength(40)
      .setRequired(false);
    const imageInput = new TextInputBuilder()
      .setCustomId('sugg_image')
      .setLabel('Affiche / Image URL (Optionnel / Auto)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('https://... ou laissez vide pour auto-détection')
      .setMaxLength(300)
      .setRequired(false);
    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(langInput),
      new ActionRowBuilder().addComponents(descInput),
      new ActionRowBuilder().addComponents(imageInput),
      new ActionRowBuilder().addComponents(linkInput)
    );
  } else {
    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(descInput),
      new ActionRowBuilder().addComponents(linkInput)
    );
  }
  return modal;
}
export const SUGGESTION_STATUSES = {
  pending: {
    key: 'pending',
    label: 'En attente d\'avis',
    badge: '🟡 EN ATTENTE',
    emoji: '🟡',
    color: 0xf59e0b, 
  },
  in_progress: {
    key: 'in_progress',
    label: 'En cours d\'étude',
    badge: '🟣 EN COURS D\'ÉTUDE',
    emoji: '🟣',
    color: 0x8b5cf6, 
  },
  accepted: {
    key: 'accepted',
    label: 'Acceptée / Validée',
    badge: '🟢 ACCEPTÉE',
    emoji: '🟢',
    color: 0x10b981, 
  },
  rejected: {
    key: 'rejected',
    label: 'Refusée',
    badge: '🔴 REFUSÉE',
    emoji: '🔴',
    color: 0xef4444,
  },
};
export const SUGGESTION_CATEGORIES = {
  anime: { key: 'anime', label: 'Animé demandé', emoji: '🎌' },
  feature: { key: 'feature', label: 'Fonctionnalité logicielle', emoji: '💻' },
  improvement: { key: 'improvement', label: 'Amélioration', emoji: '⚡' },
  bug: { key: 'bug', label: 'Signalement / Correctif', emoji: '🐛' },
  other: { key: 'other', label: 'Autre idée', emoji: '💡' },
};
export async function getSuggestionChannelId(guildId) {
  try {
    const db = getDb();
    const doc = await db.collection('config').findOne({ _id: `suggestion_config_${guildId}` });
    return doc?.channel_id || null;
  } catch {
    return null;
  }
}
export async function ensureSuggestionChannelPermissions(channel) {
  if (!channel || !channel.guild) return;
  try {
    const everyoneRole = channel.guild.roles.everyone;
    await channel.permissionOverwrites.edit(everyoneRole.id, {
      ViewChannel: true,
      ReadMessageHistory: true,
      SendMessages: false, 
      SendMessagesInThreads: true, 
      CreatePublicThreads: false, 
      CreatePrivateThreads: false,
      AddReactions: true,
      AttachFiles: true,
      EmbedLinks: true,
    });
    console.log(`[SUGGESTIONS] ✅ Permissions du salon #${channel.name} configurées : fils de discussion ouverts à TOUT LE MONDE.`);
  } catch (err) {
    console.warn(`[SUGGESTIONS] Impossible d'ajuster les permissions de #${channel?.name} :`, err.message);
  }
}
export async function setSuggestionChannelId(guildId, channelId, client = null) {
  const db = getDb();
  await db.collection('config').updateOne(
    { _id: `suggestion_config_${guildId}` },
    { $set: { channel_id: channelId, updated_at: new Date() } },
    { upsert: true }
  );
  if (client) {
    try {
      const ch = client.channels.cache.get(channelId) || (await client.channels.fetch(channelId).catch(() => null));
      if (ch) {
        await ensureSuggestionChannelPermissions(ch);
      }
    } catch {}
  }
}
export function buildSuggestionEmbed(sugg) {
  const statusInfo = SUGGESTION_STATUSES[sugg.status] || SUGGESTION_STATUSES.pending;
  const categoryInfo = SUGGESTION_CATEGORIES[sugg.category] || SUGGESTION_CATEGORIES.other;
  const upvotesCount = Array.isArray(sugg.upvotes) ? sugg.upvotes.length : 0;
  const downvotesCount = Array.isArray(sugg.downvotes) ? sugg.downvotes.length : 0;
  const totalVotes = upvotesCount + downvotesCount;
  const ratio = totalVotes > 0 ? Math.round((upvotesCount / totalVotes) * 100) : 50;
  const greenBars = Math.round((ratio / 100) * 8);
  const redBars = 8 - greenBars;
  const voteBar = totalVotes > 0 ? `${'🟩'.repeat(greenBars)}${'🟥'.repeat(redBars)} (${ratio}%)` : '*(Aucun vote pour l\'instant)*';
  const embed = new EmbedBuilder()
    .setTitle(`${categoryInfo.emoji} ${sugg.title}`)
    .setDescription(
      `**Description :**\n${sugg.description}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📊 **Approbation de la communauté :**\n` +
      `👍 **Pour :** \`${upvotesCount}\`  •  👎 **Contre :** \`${downvotesCount}\`\n` +
      `${voteBar}\n\n` +
      `📌 **Statut :** ${statusInfo.badge}`
    )
    .setColor(statusInfo.color)
    .addFields(
      { name: '🏷️ Catégorie', value: `${categoryInfo.emoji} ${categoryInfo.label}`, inline: true }
    );
  if (sugg.language) {
    embed.addFields({ name: '🎌 Langue souhaitée', value: `\`${sugg.language}\``, inline: true });
  }
  embed.addFields(
    { name: '👤 Proposé par', value: sugg.author?.username ? `${sugg.author.username} ${sugg.author.source === 'software' ? '*(Depuis le Logiciel)*' : '*(Discord)*'}` : 'Membre Saez', inline: true },
    { name: '🆔 Référence', value: `\`#${sugg.sugg_id || sugg._id}\``, inline: true }
  )
  .setFooter({
    text: `Codé avec ❤️ par Saez | Saez Animes • Synchronisé avec le Logiciel • Statut : ${statusInfo.label}`,
    iconURL: config.assets.logoUrl,
  })
  .setTimestamp(sugg.created_at ? new Date(sugg.created_at) : new Date());
  if (sugg.image_url) {
    embed.setImage(sugg.image_url);
  }
  if (sugg.author?.avatar) {
    embed.setAuthor({
      name: `Suggestion de ${sugg.author.username}`,
      iconURL: sugg.author.avatar,
    });
  }
  if (sugg.admin_comment) {
    embed.addFields({
      name: `💬 Mot de l'équipe (${sugg.admin_by || 'Staff Saez'})`,
      value: `> *« ${sugg.admin_comment} »*`,
      inline: false,
    });
  }
  return embed;
}
export function buildSuggestionButtons(sugg) {
  const upCount = Array.isArray(sugg.upvotes) ? sugg.upvotes.length : 0;
  const downCount = Array.isArray(sugg.downvotes) ? sugg.downvotes.length : 0;
  const isLocked = sugg.status === 'accepted' || sugg.status === 'rejected';
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`sugg_upvote_${sugg.sugg_id || sugg._id}`)
      .setLabel(`Pour (${upCount})`)
      .setEmoji('👍')
      .setStyle(ButtonStyle.Success)
      .setDisabled(isLocked),
    new ButtonBuilder()
      .setCustomId(`sugg_downvote_${sugg.sugg_id || sugg._id}`)
      .setLabel(`Contre (${downCount})`)
      .setEmoji('👎')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(isLocked),
    new ButtonBuilder()
      .setCustomId(`sugg_info_${sugg.sugg_id || sugg._id}`)
      .setLabel('Détails')
      .setEmoji('ℹ️')
      .setStyle(ButtonStyle.Secondary)
  );
  return [row];
}
export async function createSuggestion({
  title,
  description,
  category = 'anime',
  language = 'VOSTFR & VF',
  imageUrl = null,
  author,
  guildId,
  client,
}) {
  const db = getDb();
  const col = db.collection('suggestions');
  if (category === 'anime' && !imageUrl) {
    try {
      imageUrl = await fetchAnimeCover(title);
    } catch {}
  }
  const count = await col.countDocuments();
  const suggId = `S-${count + 1}`;
  const suggestionDoc = {
    sugg_id: suggId,
    guild_id: guildId,
    title: title.trim(),
    description: description.trim(),
    category,
    language: language || (category === 'anime' ? 'VOSTFR & VF' : null),
    image_url: imageUrl || null,
    status: 'pending',
    author: {
      id: author.id || 'software_user',
      username: author.username || 'Utilisateur Saez',
      avatar: author.avatar || config.assets.logoUrl,
      source: author.source || 'discord',
    },
    upvotes: [author.id || 'author'],
    downvotes: [],
    admin_comment: null,
    admin_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };
  let channelId = await getSuggestionChannelId(guildId);
  let channel = null;
  if (client && guildId) {
    const guild = client.guilds.cache.get(guildId) || (await client.guilds.fetch(guildId).catch(() => null));
    if (guild) {
      if (channelId) {
        channel = guild.channels.cache.get(channelId) || (await guild.channels.fetch(channelId).catch(() => null));
      }
      if (!channel) {
        channel = guild.channels.cache.find(
          (c) => c.type === ChannelType.GuildText && (c.name.includes('suggest') || c.name.includes('demande') || c.name.includes('idee'))
        );
      }
      if (!channel) {
        try {
          channel = await guild.channels.create({
            name: '💡︱suggestions',
            type: ChannelType.GuildText,
            topic: '💡 Boîte à suggestions Saez Animes • Synchronisée en temps réel avec le logiciel',
            permissionOverwrites: [
              {
                id: guild.roles.everyone.id,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.ReadMessageHistory,
                  PermissionFlagsBits.SendMessagesInThreads,
                  PermissionFlagsBits.AddReactions,
                  PermissionFlagsBits.AttachFiles,
                  PermissionFlagsBits.EmbedLinks,
                ],
                deny: [
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.CreatePublicThreads,
                  PermissionFlagsBits.CreatePrivateThreads,
                ],
              },
              {
                id: client.user.id,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.EmbedLinks,
                  PermissionFlagsBits.AttachFiles,
                  PermissionFlagsBits.ManageMessages,
                  PermissionFlagsBits.ManageThreads,
                ],
              },
            ],
          });
          await setSuggestionChannelId(guildId, channel.id);
          console.log(`[SUGGESTIONS] ✅ Salon créé automatiquement : ${channel.name} (${channel.id})`);
        } catch (createErr) {
          console.warn('[SUGGESTIONS] Impossible de créer automatiquement le salon :', createErr.message);
        }
      }
    }
  }
  if (channel) {
    try {
      await ensureSuggestionChannelPermissions(channel);
      const embed = buildSuggestionEmbed(suggestionDoc);
      const components = buildSuggestionButtons(suggestionDoc);
      const sentMsg = await channel.send({
        embeds: [embed],
        components,
      });
      suggestionDoc.channel_id = channel.id;
      suggestionDoc.message_id = sentMsg.id;
      try {
        const thread = await sentMsg.startThread({
          name: `Discussion : ${title.slice(0, 80)}`,
          autoArchiveDuration: 1440, // 24h
        });
        if (thread) {
          await thread.send({
            content: `👋 **Espace de discussion ouvert à tous !**\n` +
              `N'hésitez pas à donner votre avis, poser vos questions ou argumenter sur cette demande d'ajout (**${title}**).\n` +
              `*N'oubliez pas de voter 👍 **Pour** ou 👎 **Contre** sur le message ci-dessus !*`,
          }).catch(() => {});
        }
      } catch (threadErr) {
        console.debug('[SUGGESTIONS] Fil de discussion non créé:', threadErr.message);
      }
    } catch (sendErr) {
      console.error('[SUGGESTIONS] Erreur lors de l\'envoi du message Discord :', sendErr);
    }
  }
  const result = await col.insertOne(suggestionDoc);
  suggestionDoc._id = result.insertedId;
  if (client && guildId) {
    const guild = client.guilds.cache.get(guildId);
    if (guild) {
      const logEmbed = new EmbedBuilder()
        .setTitle(`💡 Nouvelle Suggestion : ${suggId}`)
        .setDescription(`**${title}**\n${description}`)
        .setColor(config.colors.primary)
        .addFields(
          { name: '👤 Auteur', value: `${suggestionDoc.author.username} (${suggestionDoc.author.source})`, inline: true },
          { name: '🏷️ Catégorie', value: category, inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      await sendLog(guild, 'serveur', logEmbed).catch(() => {});
    }
  }
  return suggestionDoc;
}
export async function handleSuggestionVote(interaction) {
  const isUpvote = interaction.customId.startsWith('sugg_upvote_');
  const isDownvote = interaction.customId.startsWith('sugg_downvote_');
  const isInfo = interaction.customId.startsWith('sugg_info_');
  const suggId = interaction.customId
    .replace('sugg_upvote_', '')
    .replace('sugg_downvote_', '')
    .replace('sugg_info_', '');
  const db = getDb();
  const col = db.collection('suggestions');
  const sugg = await col.findOne({
    $or: [{ sugg_id: suggId }, { message_id: interaction.message.id }],
  });
  if (!sugg) {
    return await interaction.reply({
      content: '❌ Cette suggestion est introuvable dans la base de données.',
      flags: MessageFlags.Ephemeral,
    });
  }
  if (isInfo) {
    const statusInfo = SUGGESTION_STATUSES[sugg.status] || SUGGESTION_STATUSES.pending;
    return await interaction.reply({
      content:
        `📌 **Détails de la suggestion #${sugg.sugg_id}**\n` +
        `• **Statut actuel :** ${statusInfo.badge} (${statusInfo.label})\n` +
        `• **Auteur :** ${sugg.author?.username || 'Anonyme'}\n` +
        `• **Date :** <t:${Math.floor(new Date(sugg.created_at).getTime() / 1000)}:F>\n` +
        `• **Total Pour :** ${sugg.upvotes?.length || 0} vote(s)\n` +
        `• **Total Contre :** ${sugg.downvotes?.length || 0} vote(s)\n` +
        (sugg.admin_comment ? `• **Note du Staff :** *« ${sugg.admin_comment} »*\n` : '') +
        `\n*Les suggestions sont synchronisées en direct avec le logiciel Saez Animes.* ✨`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (sugg.status === 'accepted' || sugg.status === 'rejected') {
    return await interaction.reply({
      content: `🔒 Les votes sont clos pour cette suggestion car elle a déjà été marquée comme **${SUGGESTION_STATUSES[sugg.status]?.label}**.`,
      flags: MessageFlags.Ephemeral,
    });
  }
  const userId = interaction.user.id;
  let upvotes = Array.isArray(sugg.upvotes) ? [...sugg.upvotes] : [];
  let downvotes = Array.isArray(sugg.downvotes) ? [...sugg.downvotes] : [];
  let actionMessage = '';
  if (isUpvote) {
    if (upvotes.includes(userId)) {
      upvotes = upvotes.filter((id) => id !== userId);
      actionMessage = '🗑️ Votre vote **Pour** a été retiré.';
    } else {
      upvotes.push(userId);
      downvotes = downvotes.filter((id) => id !== userId);
      actionMessage = '👍 Votre vote **Pour** a été pris en compte !';
    }
  } else if (isDownvote) {
    if (downvotes.includes(userId)) {
      downvotes = downvotes.filter((id) => id !== userId);
      actionMessage = '🗑️ Votre vote **Contre** a été retiré.';
    } else {
      downvotes.push(userId);
      upvotes = upvotes.filter((id) => id !== userId);
      actionMessage = '👎 Votre vote **Contre** a été pris en compte !';
    }
  }
  await col.updateOne(
    { _id: sugg._id },
    {
      $set: {
        upvotes,
        downvotes,
        updated_at: new Date(),
      },
    }
  );
  sugg.upvotes = upvotes;
  sugg.downvotes = downvotes;
  try {
    const embed = buildSuggestionEmbed(sugg);
    const components = buildSuggestionButtons(sugg);
    await interaction.update({
      embeds: [embed],
      components,
    });
  } catch {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: actionMessage, flags: MessageFlags.Ephemeral }).catch(() => {});
    }
  }
}
export async function updateSuggestionStatus({
  suggestionId,
  status,
  comment = null,
  adminUser = 'Staff',
  client,
}) {
  const db = getDb();
  const col = db.collection('suggestions');
  let idFilter;
  if (ObjectId.isValid(suggestionId)) {
    idFilter = { $or: [{ sugg_id: suggestionId }, { message_id: suggestionId }, { _id: new ObjectId(suggestionId) }] };
  } else {
    idFilter = { $or: [{ sugg_id: suggestionId }, { message_id: suggestionId }] };
  }
  const sugg = await col.findOne(idFilter);
  if (!sugg) {
    return { success: false, message: 'Suggestion introuvable.' };
  }
  const updateFields = {
    status,
    updated_at: new Date(),
    admin_by: adminUser,
  };
  if (comment !== null && comment !== undefined) {
    updateFields.admin_comment = comment;
  }
  await col.updateOne({ _id: sugg._id }, { $set: updateFields });
  Object.assign(sugg, updateFields);
  if (client && sugg.channel_id && sugg.message_id) {
    try {
      const channel = await client.channels.fetch(sugg.channel_id).catch(() => null);
      if (channel) {
        const msg = await channel.messages.fetch(sugg.message_id).catch(() => null);
        if (msg) {
          const embed = buildSuggestionEmbed(sugg);
          const components = buildSuggestionButtons(sugg);
          await msg.edit({
            embeds: [embed],
            components,
          }).catch((err) => console.warn('[SUGGESTIONS] Erreur modification message Discord :', err.message));
          let thread = msg.thread;
          if (!thread) {
            try {
              thread = await channel.threads.fetch(msg.id).catch(() => null);
            } catch {}
          }
          if (!thread) {
            try {
              thread = await client.channels.fetch(msg.id).catch(() => null);
            } catch {}
          }
          if (thread) {
            if (thread.archived) {
              await thread.setArchived(false).catch(() => {});
            }
            const statusInfo = SUGGESTION_STATUSES[status] || SUGGESTION_STATUSES.pending;
            const prefixMap = {
              accepted: '🟢 [ACCEPTÉE]',
              rejected: '🔴 [REFUSÉE]',
              in_progress: '🟣 [EN COURS]',
              pending: '🟡 [EN ATTENTE]',
            };
            let threadText = `📢 **Mise à jour officielle de la demande**\n\n` +
              `• **Nouveau statut :** ${statusInfo.badge} (*${statusInfo.label}*)\n` +
              `• **Modifié par :** **${adminUser}**`;
            if (comment && comment.trim().length > 0) {
              threadText += `\n• 💬 **Note de l'équipe :**\n> *« ${comment.trim()} »*`;
            }
            if (status === 'accepted') {
              threadText += `\n\n🎉 **Cette proposition a été acceptée et planifiée !** Merci pour votre contribution.`;
            } else if (status === 'rejected') {
              threadText += `\n\n🔴 **Cette proposition a été refusée.** Merci d'avoir partagé votre idée.`;
            } else if (status === 'in_progress') {
              threadText += `\n\n🟣 **Cette demande est actuellement en cours d'étude par l'équipe.**`;
            } else if (status === 'pending') {
              threadText += `\n\n🟡 **Cette demande est remise en attente d'avis.**`;
            }
            await thread.send({ content: threadText }).catch((err) =>
              console.warn('[SUGGESTION THREAD] Erreur envoi message fil :', err.message)
            );
            try {
              const baseTitle = sugg.title.slice(0, 65);
              const prefix = prefixMap[status] || '💡';
              await thread.setName(`${prefix} ${baseTitle}`.slice(0, 100)).catch(() => {});
            } catch {}
          }
        }
      }
    } catch (err) {
      console.warn('[SUGGESTIONS] Erreur lors de la mise à jour Discord :', err.message);
    }
  }
  return { success: true, suggestion: sugg };
}
export async function deleteSuggestion({
  suggestionId,
  client,
}) {
  const db = getDb();
  const col = db.collection('suggestions');
  let idFilter;
  if (ObjectId.isValid(suggestionId)) {
    idFilter = { $or: [{ sugg_id: suggestionId }, { message_id: suggestionId }, { _id: new ObjectId(suggestionId) }] };
  } else {
    idFilter = { $or: [{ sugg_id: suggestionId }, { message_id: suggestionId }, { _id: suggestionId }] };
  }
  const sugg = await col.findOne(idFilter);
  if (!sugg) {
    return { success: false, message: 'Suggestion introuvable.' };
  }
  if (client && sugg.channel_id && sugg.message_id) {
    try {
      const channel = await client.channels.fetch(sugg.channel_id).catch(() => null);
      if (channel) {
        try {
          let thread = await client.channels.fetch(sugg.message_id).catch(() => null);
          if (!thread) {
            thread = await channel.threads.fetch(sugg.message_id).catch(() => null);
          }
          if (thread && thread.isThread()) {
            await thread.delete('Suggestion supprimée').catch(() => {});
          }
        } catch (threadDelErr) {
          console.debug('[SUGGESTIONS] Thread delete ignore:', threadDelErr.message);
        }
        const msg = await channel.messages.fetch(sugg.message_id).catch(() => null);
        if (msg) {
          await msg.delete().catch(() => {});
          console.log(`[SUGGESTIONS] 🗑️ Message Discord ${sugg.message_id} supprimé.`);
        }
      }
    } catch (err) {
      console.warn('[SUGGESTIONS] Erreur suppression message Discord :', err.message);
    }
  }
  await col.deleteOne({ _id: sugg._id });
  console.log(`[SUGGESTIONS] 🗑️ Suggestion #${sugg.sugg_id} supprimée de MongoDB.`);
  return { success: true, suggestion: sugg };
}
export async function getAllSuggestions(filter = {}) {
  try {
    const db = getDb();
    const list = await db
      .collection('suggestions')
      .find(filter)
      .sort({ created_at: -1 })
      .toArray();
    return list;
  } catch (err) {
    console.error('[SUGGESTIONS] Erreur getAllSuggestions :', err);
    return [];
  }
}
export async function getSuggestionThreadMessages({ suggestionId, client }) {
  const db = getDb();
  const col = db.collection('suggestions');
  let idFilter;
  if (ObjectId.isValid(suggestionId)) {
    idFilter = { $or: [{ sugg_id: suggestionId }, { message_id: suggestionId }, { _id: new ObjectId(suggestionId) }] };
  } else {
    idFilter = { $or: [{ sugg_id: suggestionId }, { message_id: suggestionId }] };
  }
  const sugg = await col.findOne(idFilter);
  if (!sugg) {
    return { success: false, message: 'Suggestion introuvable.' };
  }
  if (!client || !sugg.channel_id || !sugg.message_id) {
    return { success: true, messages: [], threadName: null, threadId: null };
  }
  try {
    let thread = client.channels.cache.get(sugg.message_id) || (await client.channels.fetch(sugg.message_id).catch(() => null));
    if (!thread || !thread.isThread()) {
      const channel = await client.channels.fetch(sugg.channel_id).catch(() => null);
      if (channel) {
        const msg = await channel.messages.fetch(sugg.message_id).catch(() => null);
        thread = msg?.thread || (await channel.threads.fetch(msg?.id).catch(() => null));
      }
    }
    if (!thread) {
      return { success: true, messages: [], threadName: null, threadId: null };
    }
    const fetched = await thread.messages.fetch({ limit: 50 });
    const messages = Array.from(fetched.values())
      .map((m) => ({
        id: m.id,
        author: {
          id: m.author.id,
          username: m.member?.displayName || m.author.displayName || m.author.username,
          avatar: m.author.displayAvatarURL({ dynamic: true }),
          isBot: m.author.bot,
        },
        content: m.content,
        created_at: m.createdAt.toISOString(),
        attachments: Array.from(m.attachments.values()).map((att) => ({
          url: att.url,
          name: att.name,
          contentType: att.contentType,
        })),
      }))
      .reverse(); 
    return {
      success: true,
      threadId: thread.id,
      threadName: thread.name,
      messages,
    };
  } catch (err) {
    console.warn('[SUGGESTION THREAD] Erreur lecture messages :', err.message);
    return { success: false, message: err.message, messages: [] };
  }
}
export async function sendSuggestionThreadMessage({
  suggestionId,
  content,
  authorName = 'Staff Saez',
  client,
}) {
  if (!content || !content.trim()) {
    return { success: false, message: 'Le contenu du message ne peut pas être vide.' };
  }
  const db = getDb();
  const col = db.collection('suggestions');
  let idFilter;
  if (ObjectId.isValid(suggestionId)) {
    idFilter = { $or: [{ sugg_id: suggestionId }, { message_id: suggestionId }, { _id: new ObjectId(suggestionId) }] };
  } else {
    idFilter = { $or: [{ sugg_id: suggestionId }, { message_id: suggestionId }] };
  }
  const sugg = await col.findOne(idFilter);
  if (!sugg) {
    return { success: false, message: 'Suggestion introuvable.' };
  }
  if (!client || !sugg.channel_id || !sugg.message_id) {
    return { success: false, message: 'Salon ou message Discord introuvable.' };
  }
  try {
    let thread = client.channels.cache.get(sugg.message_id) || (await client.channels.fetch(sugg.message_id).catch(() => null));
    if (!thread || !thread.isThread()) {
      const channel = await client.channels.fetch(sugg.channel_id).catch(() => null);
      if (channel) {
        const msg = await channel.messages.fetch(sugg.message_id).catch(() => null);
        thread = msg?.thread || (await channel.threads.fetch(msg?.id).catch(() => null));
        if (!thread && msg) {
          thread = await msg.startThread({
            name: `Discussion : ${sugg.title.slice(0, 80)}`,
            autoArchiveDuration: 1440,
          }).catch(() => null);
        }
      }
    }
    if (!thread) {
      return { success: false, message: 'Impossible d\'accéder au fil Discord.' };
    }
    if (thread.archived) {
      await thread.setArchived(false).catch(() => {});
    }
    const sent = await thread.send({
      content: `💬 **[${authorName}]** : ${content.trim()}`,
    });
    return {
      success: true,
      message: {
        id: sent.id,
        author: {
          id: client.user.id,
          username: authorName,
          avatar: client.user.displayAvatarURL(),
          isBot: true,
        },
        content: `💬 **[${authorName}]** : ${content.trim()}`,
        created_at: sent.createdAt.toISOString(),
      },
    };
  } catch (err) {
    console.warn('[SUGGESTION THREAD] Erreur envoi message :', err.message);
    return { success: false, message: err.message };
  }
}
