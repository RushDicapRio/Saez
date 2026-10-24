import { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getDb } from '../database/mongo.js';
import { config } from '../config.js';
export async function getTicketConfig() {
  const db = getDb();
  const col = db.collection('config');
  let doc = await col.findOne({ _id: 'ticket_config' });
  if (!doc) {
    doc = {
      _id: 'ticket_config',
      category_id: null,
      support_role_id: null,
      log_channel_id: null,
      ticket_counter: 0,
      anti_staff_ping: true,
      max_staff_pings: 2,
    };
    await col.insertOne(doc);
  } else {
    if (doc.anti_staff_ping === undefined) doc.anti_staff_ping = true;
    if (doc.max_staff_pings === undefined) doc.max_staff_pings = 2;
  }
  return doc;
}
export async function saveTicketConfig(newConfig) {
  const db = getDb();
  const col = db.collection('config');
  await col.updateOne(
    { _id: 'ticket_config' },
    { $set: { ...newConfig, updated_at: new Date() } },
    { upsert: true }
  );
}
export async function createTicketChannel(guild, user, reason = 'Assistance générale', categoryType = 'Support') {
  const db = getDb();
  const ticketCfg = await getTicketConfig();
  const ticketCol = db.collection('tickets');
  const count = (await ticketCol.countDocuments()) + 1;
  const ticketNumber = String(count).padStart(4, '0');
  const channelName = `ticket-${ticketNumber}-${user.username}`.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);
  let category = ticketCfg.category_id ? guild.channels.cache.get(ticketCfg.category_id) : null;
  if (!category) {
    category = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('ticket')
    );
    if (!category) {
      category = await guild.channels.create({
        name: '📂・TICKETS SAEZ',
        type: ChannelType.GuildCategory,
      });
      await saveTicketConfig({ ...ticketCfg, category_id: category.id });
    }
  }
  const permissionOverwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
    {
      id: guild.members.me.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
  ];
  if (ticketCfg.support_role_id) {
    permissionOverwrites.push({
      id: ticketCfg.support_role_id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    });
  }
  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: category.id,
    topic: `Ticket #${ticketNumber} | Utilisateur : ${user.tag} (${user.id}) | Motif : ${reason}`,
    permissionOverwrites,
  });
  const ticketDoc = {
    ticket_id: ticketNumber,
    channel_id: channel.id,
    guild_id: guild.id,
    user_id: user.id,
    user_tag: user.tag,
    user_username: user.username,
    reason,
    category_type: categoryType,
    status: 'open',
    claimed_by: null,
    created_at: new Date(),
    closed_at: null,
  };
  await ticketCol.insertOne(ticketDoc);
  const embed = new EmbedBuilder()
    .setTitle(`🎫 Ticket #${ticketNumber} — ${categoryType}`)
    .setDescription(
      `Bonjour ${user}, bienvenue dans votre ticket d'assistance !\n\n` +
      `**Motif de la demande :**\n> ${reason}\n\n` +
      `Un membre de l'équipe **Saez** prendra en charge votre demande sous peu.\n` +
      `Vous pouvez dès à présent détailler votre problème ou joindre des captures d'écran.`
    )
    .setColor(config.colors.primary)
    .setThumbnail(config.assets.logoUrl)
    .addFields(
      { name: '👤 Utilisateur', value: `${user.tag} (<@${user.id}>)`, inline: true },
      { name: '📂 Catégorie', value: `\`${categoryType}\``, inline: true },
      { name: '📌 Statut', value: '🟢 Ouvert', inline: true }
    )
    .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système de Support' })
    .setTimestamp();
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket_claim_${channel.id}`)
      .setLabel('Prendre en charge')
      .setEmoji('🙋')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`ticket_close_${channel.id}`)
      .setLabel('Fermer le ticket')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger)
  );
  await channel.send({
    content: `${user} | <@&${ticketCfg.support_role_id || guild.roles.everyone.id}>`,
    embeds: [embed],
    components: [row],
  });
  return { channel, ticketDoc };
}
export async function closeTicketChannel(channel, closedByUser, reason = 'Résolu', transcriptAttachment = null) {
  const db = getDb();
  const ticketCol = db.collection('tickets');
  const ticketDoc = await ticketCol.findOne({ channel_id: channel.id });
  if (ticketDoc) {
    await ticketCol.updateOne(
      { channel_id: channel.id },
      {
        $set: {
          status: 'closed',
          closed_by: closedByUser.id,
          closed_by_tag: closedByUser.tag || closedByUser.username,
          close_reason: reason,
          closed_at: new Date(),
        },
      }
    );
  }
  let finalAttachment = transcriptAttachment;
  if (!finalAttachment) {
    try {
      const { generateTicketTranscript } = await import('./supportService.js');
      const res = await generateTicketTranscript(channel);
      if (res.success) finalAttachment = res.attachment;
    } catch {}
  }
  if (ticketDoc?.user_id) {
    try {
      const authorMember = await channel.guild.members.fetch(ticketDoc.user_id).catch(() => null);
      if (authorMember) {
        const dmEmbed = new EmbedBuilder()
          .setTitle(`🔒 Votre ticket #${ticketDoc.ticket_id || channel.name} a été fermé`)
          .setDescription(
            `Votre demande a été traitée et fermée par **${closedByUser.tag || closedByUser.username}**.\n\n` +
            `• **Motif de fermeture :** ${reason}\n` +
            `• **Date :** <t:${Math.floor(Date.now() / 1000)}:f>\n\n` +
            `*Vous trouverez ci-joint le transcript complet de votre conversation avec notre équipe.*`
          )
          .setColor(config.colors.primary)
          .setThumbnail(config.assets.logoUrl)
          .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes Support • Merci de votre confiance !' });
        const sendOptions = { embeds: [dmEmbed] };
        if (finalAttachment) sendOptions.files = [finalAttachment];
        await authorMember.send(sendOptions).catch(() => {});
      }
    } catch (dmErr) {
      console.debug('[TicketService] Impossible d\'envoyer le DM de transcript:', dmErr.message);
    }
  }
  const logEmbed = new EmbedBuilder()
    .setTitle(`📂 Ticket Fermé : #${ticketDoc?.ticket_id || channel.name}`)
    .setDescription(`Ticket fermé par ${closedByUser}.\n**Raison :** ${reason}`)
    .setColor(config.colors.accent)
    .addFields(
      { name: '👤 Demandeur', value: ticketDoc ? `<@${ticketDoc.user_id}>` : 'Inconnu', inline: true },
      { name: '📂 Catégorie', value: `\`${ticketDoc?.category_type || 'Support'}\``, inline: true }
    )
    .setFooter({ text: 'Codé avec ❤️ par Saez' })
    .setTimestamp();
  try {
    const { sendLog } = await import('./logService.js');
    await sendLog(channel.guild, 'serveur', logEmbed);
  } catch {}
  const embed = new EmbedBuilder()
    .setTitle('🔒 Ticket Fermé & Archivé')
    .setDescription(`Ce ticket a été fermé par ${closedByUser}.\n**Raison :** ${reason}\n\n*Suppression automatique du salon dans 5 secondes...*`)
    .setColor(config.colors.accent)
    .setTimestamp()
    .setFooter({ text: 'Codé avec ❤️ par Saez' });
  await channel.send({ embeds: [embed] }).catch(() => {});
  setTimeout(async () => {
    try {
      await channel.delete(`Fermé par ${closedByUser.tag || closedByUser.username}`);
    } catch (err) {
      console.error('[TicketService] Erreur suppression salon:', err.message);
    }
  }, 5000);
  return true;
}
export function isStaffRole(role, ticketCfg = null) {
  if (!role) return false;
  if (ticketCfg?.support_role_id && role.id === ticketCfg.support_role_id) return true;
  const name = role.name.toLowerCase();
  return (
    name.includes('staff') ||
    name.includes('support') ||
    name.includes('mod') ||
    name.includes('admin') ||
    name.includes('fondat') ||
    name.includes('responsable')
  );
}
export function isStaffMember(member, ticketCfg = null) {
  if (!member) return false;
  if (member.user?.bot) return false;
  if (ticketCfg?.support_role_id && member.roles?.cache?.has(ticketCfg.support_role_id)) {
    return true;
  }
  if (
    member.permissions?.has(PermissionFlagsBits.Administrator) ||
    member.permissions?.has(PermissionFlagsBits.ManageGuild) ||
    member.permissions?.has(PermissionFlagsBits.ManageChannels) ||
    member.permissions?.has(PermissionFlagsBits.ModerateMembers) ||
    member.permissions?.has(PermissionFlagsBits.KickMembers) ||
    member.permissions?.has(PermissionFlagsBits.BanMembers) ||
    member.permissions?.has(PermissionFlagsBits.ManageMessages)
  ) {
    return true;
  }
  const hasStaffRole = member.roles?.cache?.some((r) => isStaffRole(r, ticketCfg));
  return Boolean(hasStaffRole);
}
/**
 * @param {import('discord.js').Message} message
 * @returns {Promise<boolean>} 
 */
export async function handleTicketStaffPing(message) {
  if (!message.guild || message.author.bot) return false;
  if (!message.channel.name?.startsWith('ticket-')) return false;
  const hasUserMentions = message.mentions.users.size > 0;
  const hasRoleMentions = message.mentions.roles.size > 0;
  if (!hasUserMentions && !hasRoleMentions) return false;
  const db = getDb();
  if (!db) return false;
  const ticketCol = db.collection('tickets');
  const ticketDoc = await ticketCol.findOne({ channel_id: message.channel.id, status: 'open' });
  if (!ticketDoc || ticketDoc.is_closing) return false;
  const ticketCfg = await getTicketConfig();
  if (ticketCfg.anti_staff_ping === false) return false;
  if (isStaffMember(message.member, ticketCfg)) return false;
  let pingedStaff = false;
  if (hasRoleMentions) {
    for (const [, role] of message.mentions.roles) {
      if (isStaffRole(role, ticketCfg)) {
        pingedStaff = true;
        break;
      }
    }
  }
  if (!pingedStaff && hasUserMentions) {
    for (const [userId, user] of message.mentions.users) {
      if (user.bot) continue;
      let member = message.mentions.members?.get(userId);
      if (!member) {
        try {
          member = await message.guild.members.fetch(userId);
        } catch {
          member = null;
        }
      }
      if (member && isStaffMember(member, ticketCfg)) {
        pingedStaff = true;
        break;
      }
    }
  }
  if (!pingedStaff) return false;
  const maxPings = ticketCfg.max_staff_pings || 2;
  const currentCount = ticketDoc.staff_pings_count || 0;
  const newCount = currentCount + 1;
  if (newCount < maxPings) {
    await ticketCol.updateOne(
      { channel_id: message.channel.id },
      {
        $set: { staff_pings_count: newCount },
        $push: {
          staff_pings: {
            user_id: message.author.id,
            timestamp: new Date(),
            content: message.content.slice(0, 500),
          },
        },
      }
    );
    const warnEmbed = new EmbedBuilder()
      .setTitle('⚠️ Avertissement — Mention du Personnel')
      .setDescription(
        `Bonjour ${message.author},\n\n` +
        `**Merci de ne pas mentionner les personnes du staff, ils vous répondront quand ils seront disponibles.**\n\n` +
        `🚨 **Avertissement (${newCount}/${maxPings}) :** Si vous mentionnez à nouveau un membre du staff, ce ticket sera **automatiquement fermé**.`
      )
      .setColor(config.colors.warning || 0xf59e0b)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système de Support' })
      .setTimestamp();
    await message.reply({ embeds: [warnEmbed] }).catch(async () => {
      await message.channel.send({ embeds: [warnEmbed] }).catch(() => {});
    });
    return true;
  } else {
    await ticketCol.updateOne(
      { channel_id: message.channel.id },
      {
        $set: {
          staff_pings_count: newCount,
          is_closing: true,
        },
        $push: {
          staff_pings: {
            user_id: message.author.id,
            timestamp: new Date(),
            content: message.content.slice(0, 500),
          },
        },
      }
    );
    const closeEmbed = new EmbedBuilder()
      .setTitle('🚫 Fermeture Automatique du Ticket')
      .setDescription(
        `Bonjour ${message.author},\n\n` +
        `Vous avez mentionné un membre du staff à plusieurs reprises (${newCount}/${maxPings}) malgré l'avertissement précédent.\n\n` +
        `🔒 **Ce ticket est fermé automatiquement.**`
      )
      .setColor(config.colors.accent || 0xff2d7b)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Support' })
      .setTimestamp();
    await message.channel.send({ embeds: [closeEmbed] }).catch(() => {});
    await closeTicketChannel(
      message.channel,
      message.client.user,
      `Fermeture automatique : mentions répétées du personnel du staff (${newCount}/${maxPings})`
    );
    return true;
  }
}
