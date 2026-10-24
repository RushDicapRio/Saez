import { Events } from 'discord.js';
import { sendWelcomeMessage } from '../services/welcomeService.js';
import { getSecurityConfig, sendSecurityAlert } from '../services/securityService.js';
import { config } from '../config.js';
const joinTracker = [];
export default {
  name: Events.GuildMemberAdd,
  async execute(member) {
    console.log(`[GuildMemberAdd] Nouveau membre : ${member.user?.tag} (${member.id})`);
    const now = Date.now();
    const cfg = await getSecurityConfig();
    if (cfg.antiraid?.enabled) {
      const windowMs = (cfg.antiraid.window_seconds || 10) * 1000;
      joinTracker.push(now);
      const recentCount = joinTracker.filter((t) => now - t < windowMs).length;
      if (recentCount >= (cfg.antiraid.max_joins || 5)) {
        console.warn(`[AntiRaid] 🚨 Vague de raid détectée ! (${recentCount} arrivées en ${cfg.antiraid.window_seconds}s)`);
        let actionTaken = 'Alerte transmise au staff';
        if (cfg.antiraid.action === 'kick') {
          await member.kick('Anti-Raid automatique Saez : vagues de joins suspects').catch(() => {});
          actionTaken = 'Membre expulsé automatiquement (Kick)';
        }
        await sendSecurityAlert(
          member.guild,
          '🚨 VAGUE DE RAID DÉTECTÉE !',
          `Une vague d'arrivées massives a été interceptée par le bouclier anti-raid.\n**Mesure appliquée :** ${actionTaken}`,
          [
            { name: '📊 Arrivées récentes', value: `${recentCount} membres en ${cfg.antiraid.window_seconds} secondes`, inline: true },
            { name: '👤 Dernier membre', value: `${member.user?.tag} (${member.id})`, inline: true },
            { name: '🛡️ Mode de protection', value: `\`${cfg.antiraid.action.toUpperCase()}\``, inline: true },
          ],
          config.colors.accent
        );
        if (cfg.antiraid.action === 'kick') {
          return; 
        }
      }
      const accountAgeHours = (now - member.user.createdTimestamp) / (1000 * 60 * 60);
      if (accountAgeHours < (cfg.antiraid.suspicious_account_age_hours || 24)) {
        await sendSecurityAlert(
          member.guild,
          'Compte Récent Suspect',
          `Un membre avec un compte Discord très récent vient de rejoindre le serveur.`,
          [
            { name: '👤 Membre', value: `${member.user?.tag} (${member.id})`, inline: true },
            { name: '⏳ Ancienneté du compte', value: `Créé il y a **${Math.round(accountAgeHours * 60)} minutes**`, inline: true },
          ],
          config.colors.warning
        );
      }
    }
    await sendWelcomeMessage(member);
    const { sendLog } = await import('../services/logService.js');
    const { EmbedBuilder } = await import('discord.js');
    const memberEmbed = new EmbedBuilder()
      .setTitle('📥 Arrivée d\'un membre')
      .setColor(0x10b981)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '👤 Membre', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
        { name: '🆔 Identifiant', value: `\`${member.id}\``, inline: true },
        { name: '📅 Création du compte', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    await sendLog(member.guild, 'members', memberEmbed);
    const { syncServerStatsChannels } = await import('../services/serverStatsService.js');
    await syncServerStatsChannels(member.guild).catch(() => {});
  },
};
