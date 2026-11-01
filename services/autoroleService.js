import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { getDb } from '../database/mongo.js';
import { config } from '../config.js';
export async function getAutoRoleConfig() {
  const db = getDb();
  const col = db.collection('config');
  let doc = await col.findOne({ _id: 'autorole_config' });
  if (!doc) {
    doc = {
      _id: 'autorole_config',
      channel_id: '1214635382331936798', 
      title: '🎭 Rôles & Notifications — Saez Animes',
      description:
        'Personnalisez votre expérience sur le serveur en choisissant vos rôles !\n' +
        'Cliquez sur les boutons ci-dessous pour activer ou désactiver vos notifications.\n\n' +
        'Cliquez une fois pour obtenir le rôle, recliquez pour le retirer.',
      roles: [
        {
          role_id: '1212831207537246339',
          label: 'Notifications Ajouts & Sorties',
          emoji: '🔔',
          description: 'Soyez averti dès qu’un nouvel épisode ou anime sort sur Saez',
          style: 'Primary',
        },
      ],
      updated_at: new Date(),
    };
    await col.insertOne(doc);
  }
  return doc;
}
export async function saveAutoRoleConfig(data) {
  const db = getDb();
  const col = db.collection('config');
  await col.updateOne(
    { _id: 'autorole_config' },
    { $set: { ...data, updated_at: new Date() } },
    { upsert: true }
  );
}
export function buildAutoRolePanel(cfg, guild) {
  const rolesList = Array.isArray(cfg.roles) ? cfg.roles : [];
  const mode = cfg.display_mode || 'select'; // 'select' | 'buttons' | 'both'
  let desc = cfg.description || (mode === 'select' ? 'Sélectionnez un ou plusieurs rôles dans le menu déroulant ci-dessous :' : 'Cliquez sur les boutons ci-dessous pour choisir vos rôles :');
  desc += '\n\n**Rôles disponibles :**\n';
  if (rolesList.length === 0) {
    desc += '*Aucun rôle n\'est encore configuré. Ajoutez-en depuis le Dashboard Saez ou avec `/autorole add`.*';
  } else {
    for (const r of rolesList) {
      const emojiStr = r.emoji ? `${r.emoji} ` : '';
      const descStr = r.description ? `\n> *${r.description}*` : '';
      desc += `\n• ${emojiStr}<@&${r.role_id}> — **${r.label}**${descStr}\n`;
    }
  }
  const embed = new EmbedBuilder()
    .setTitle(cfg.title || '🎭 Rôles & Notifications — Saez Animes')
    .setDescription(desc)
    .setColor(config.colors.primary)
    .setThumbnail(config.assets.logoUrl)
    .setImage(config.assets.bannerUrl)
    .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes • Système d’Auto-Rôles' })
    .setTimestamp();
  const components = [];
  if (rolesList.length > 0) {
    if (mode === 'select' || mode === 'both') {
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_autorole')
        .setPlaceholder('🎭 Sélectionnez vos rôles dans la liste...')
        .setMinValues(1)
        .setMaxValues(Math.min(rolesList.length, 25));
      rolesList.slice(0, 25).forEach((r) => {
        const option = new StringSelectMenuOptionBuilder()
          .setLabel((r.label || 'Rôle').slice(0, 100))
          .setValue(String(r.role_id));
        if (r.description && r.description.trim()) {
          option.setDescription(r.description.trim().slice(0, 100));
        } else {
          option.setDescription(`Activer / désactiver le rôle ${r.label}`);
        }
        if (r.emoji && r.emoji.trim()) {
          try {
            option.setEmoji(r.emoji.trim());
          } catch {}
        }
        selectMenu.addOptions(option);
      });
      components.push(new ActionRowBuilder().addComponents(selectMenu));
    }
    if (mode === 'buttons' || mode === 'both') {
      let currentRow = new ActionRowBuilder();
      rolesList.slice(0, 25).forEach((r, idx) => {
        const buttonStyle =
          r.style === 'Secondary'
            ? ButtonStyle.Secondary
            : r.style === 'Success'
            ? ButtonStyle.Success
            : r.style === 'Danger'
            ? ButtonStyle.Danger
            : ButtonStyle.Primary;
        const btn = new ButtonBuilder()
          .setCustomId(`btn_autorole_${r.role_id}`)
          .setLabel(r.label.slice(0, 80))
          .setStyle(buttonStyle);
        if (r.emoji) {
          try {
            btn.setEmoji(r.emoji);
          } catch {}
        }
        currentRow.addComponents(btn);
        if (currentRow.components.length === 5 || idx === rolesList.length - 1) {
          components.push(currentRow);
          currentRow = new ActionRowBuilder();
        }
      });
    }
  }
  return { embed, components };
}
export async function toggleMemberRole(guild, member, roleId) {
  const role = guild.roles.cache.get(roleId) || (await guild.roles.fetch(roleId).catch(() => null));
  if (!role) {
    return { success: false, message: 'Le rôle demandé est introuvable sur le serveur.' };
  }
  const botMember = guild.members.me;
  if (!botMember.permissions.has('ManageRoles')) {
    return { success: false, message: 'Le bot n\'a pas la permission **Gérer les rôles** (`ManageRoles`).' };
  }
  if (role.comparePositionTo(botMember.roles.highest) >= 0) {
    return {
      success: false,
      message: `Le rôle **${role.name}** est placé plus haut ou au même niveau que le rôle le plus élevé du bot dans les paramètres Discord. Déplacez le rôle du bot au-dessus de **${role.name}**.`,
    };
  }
  const hasRole = member.roles.cache.has(roleId);
  try {
    if (hasRole) {
      await member.roles.remove(roleId);
      return {
        success: true,
        action: 'removed',
        roleName: role.name,
        roleMention: `<@&${roleId}>`,
      };
    } else {
      await member.roles.add(roleId);
      return {
        success: true,
        action: 'added',
        roleName: role.name,
        roleMention: `<@&${roleId}>`,
      };
    }
  } catch (err) {
    return { success: false, message: `Erreur lors de la modification du rôle : ${err.message}` };
  }
}
