import { EmbedBuilder } from 'discord.js';
import { getDb } from '../database/mongo.js';
import { config } from '../config.js';
function isValidHttpUrl(string) {
  if (!string || typeof string !== 'string') return false;
  try {
    const u = new URL(string);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (_) {
    return false;
  }
}
export async function getWelcomeConfig() {
  const db = getDb();
  const col = db.collection('config');
  let doc = await col.findOne({ _id: 'welcome_config' });
  if (!doc) {
    doc = {
      _id: 'welcome_config',
      welcome: {
        enabled: true,
        channel_id: '1214631053243719774', // 🌿︱bienvenue
        title: '🎉 Bienvenue sur Saez Animes !',
        message:
          'Bienvenue {user} sur le serveur officiel **Saez Animes** !\n\n' +
          '• Prends connaissance des règles dans {reglement}\n' +
          '• Choisis tes rôles et notifications dans {roles}\n\n' +
          'Nous sommes désormais **{count}** membres dans la communauté !',
        banner_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80',
        color: config.colors.primary,
      },
      leave: {
        enabled: true,
        channel_id: '1214631539858608149', // 🌿︱aurevoir
        title: '👋 Au revoir...',
        message:
          '**{username}** vient de quitter le serveur **Saez Animes**.\n' +
          'Nous lui souhaitons une bonne continuation !\n\n' +
          'Il reste désormais **{count}** membres parmi nous.',
        banner_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
        color: config.colors.accent,
      },
      updated_at: new Date(),
    };
    await col.insertOne(doc);
  }
  return doc;
}
export async function saveWelcomeConfig(data) {
  const db = getDb();
  const col = db.collection('config');
  await col.updateOne(
    { _id: 'welcome_config' },
    { $set: { ...data, updated_at: new Date() } },
    { upsert: true }
  );
}
export function formatWelcomeText(template, member) {
  const guild = member.guild;
  const count = guild.memberCount || 0;
  const username = member.user?.username || member.displayName || 'Membre';
  const tag = member.user?.tag || username;
  const mention = `<@${member.id}>`;
  const reglementChannel = guild.channels.cache.find((c) => c.name.toLowerCase().includes('règlement')) || '<#1212848466024341625>';
  const rolesChannel = guild.channels.cache.find((c) => c.name.toLowerCase().includes('rôle')) || '<#1214635382331936798>';
  return (template || '')
    .replace(/{user}/g, mention)
    .replace(/{username}/g, username)
    .replace(/{tag}/g, tag)
    .replace(/{count}/g, count.toLocaleString('fr-FR'))
    .replace(/{server}/g, guild.name)
    .replace(/{reglement}/g, typeof reglementChannel === 'string' ? reglementChannel : `<#${reglementChannel.id}>`)
    .replace(/{roles}/g, typeof rolesChannel === 'string' ? rolesChannel : `<#${rolesChannel.id}>`);
}
export function buildWelcomeEmbed(member, cfg) {
  const w = cfg.welcome;
  const avatar = member.user?.displayAvatarURL({ dynamic: true, size: 256 }) || config.assets.logoUrl;
  const embed = new EmbedBuilder()
    .setTitle(w.title || '🎉 Bienvenue sur Saez Animes !')
    .setDescription(formatWelcomeText(w.message, member))
    .setColor(w.color || config.colors.primary)
    .setThumbnail(avatar)
    .setFooter({ text: `Codé avec ❤️ par Saez | ${member.guild.name} • Nouveau Membre #${member.guild.memberCount}` })
    .setTimestamp();

  if (isValidHttpUrl(w.banner_url)) {
    embed.setImage(w.banner_url);
  }
  return embed;
}
export function buildLeaveEmbed(member, cfg) {
  const l = cfg.leave;
  const avatar = member.user?.displayAvatarURL({ dynamic: true, size: 256 }) || config.assets.logoUrl;
  const embed = new EmbedBuilder()
    .setTitle(l.title || '👋 Au revoir...')
    .setDescription(formatWelcomeText(l.message, member))
    .setColor(l.color || config.colors.accent)
    .setThumbnail(avatar)
    .setFooter({ text: `Cod" avec ❤️ par Saez | ${member.guild.name} • Membres restants : ${member.guild.memberCount}` })
    .setTimestamp();
  if (isValidHttpUrl(l.banner_url)) {
    embed.setImage(l.banner_url);
  }
  return embed;
}
export async function sendWelcomeMessage(member) {
  try {
    const cfg = await getWelcomeConfig();
    if (!cfg.welcome?.enabled) return;
    const channelId = cfg.welcome.channel_id;
    const channel = member.guild.channels.cache.get(channelId) || (await member.guild.channels.fetch(channelId).catch(() => null));
    if (!channel) return;
    const embed = buildWelcomeEmbed(member, cfg);
    await channel.send({ content: `🎉 Bienvenue à toi ${member} !`, embeds: [embed] });
  } catch (err) {
    console.error('[WelcomeService] Erreur lors de l\'envoi du message de bienvenue :', err);
  }
}
export async function sendLeaveMessage(member) {
  try {
    const cfg = await getWelcomeConfig();
    if (!cfg.leave?.enabled) return;
    const channelId = cfg.leave.channel_id;
    const channel = member.guild.channels.cache.get(channelId) || (await member.guild.channels.fetch(channelId).catch(() => null));
    if (!channel) return;
    const embed = buildLeaveEmbed(member, cfg);
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[WelcomeService] Erreur lors de l\'envoi du message d\'au revoir :', err);
  }
}
