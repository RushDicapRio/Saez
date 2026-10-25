import { Events, ActivityType } from 'discord.js';
import { startPeriodicChannelSync } from '../services/channelSyncService.js';
export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`\n========================================`);
    console.log(`🚀 Saez Discord Bot en ligne !`);
    console.log(`🤖 Connecté en tant que : ${client.user.tag}`);
    console.log(`👥 Présent sur ${client.guilds.cache.size} serveur(s)`);
    console.log(`========================================\n`);
    try {
      const { startStreamingPresence } = await import('../services/presenceService.js');
      startStreamingPresence(client, 15);
    } catch (presErr) {
      console.error('[BOT] Erreur lors de l\'activation de la présence streaming :', presErr);
    }
    try {
      startPeriodicChannelSync(client);
    } catch (syncErr) {
      console.error('[BOT] Erreur lors du lancement de la synchronisation des salons :', syncErr);
    }
    try {
      const { startPeriodicServerStatsSync } = await import('../services/serverStatsService.js');
      startPeriodicServerStatsSync(client);
    } catch (sStatsErr) {
      console.error('[BOT] Erreur lors du lancement des stats serveur :', sStatsErr);
    }
    try {
      const { restoreActiveGiveaways } = await import('../services/giveawayService.js');
      await restoreActiveGiveaways(client);
    } catch (gErr) {
      console.error('[BOT] Erreur lors de la restauration des giveaways :', gErr);
    }
    try {
      const { startApiServer } = await import('../services/apiServer.js');
      startApiServer(client);
    } catch (apiErr) {
      console.error('[BOT] Erreur lors du lancement de l\'API Server :', apiErr);
    }
    try {
      const { getSuggestionChannelId, ensureSuggestionChannelPermissions } = await import('../services/suggestionService.js');
      for (const [, guild] of client.guilds.cache) {
        const channelId = await getSuggestionChannelId(guild.id);
        if (channelId) {
          const ch = guild.channels.cache.get(channelId) || (await guild.channels.fetch(channelId).catch(() => null));
          if (ch) {
            await ensureSuggestionChannelPermissions(ch);
          }
        }
      }
    } catch (permErr) {
      console.error('[BOT] Erreur lors de la configuration des permissions suggestions :', permErr);
    }
    try {
      const { startVoiceXpTracking } = await import('../services/discordLevelService.js');
      startVoiceXpTracking(client);
    } catch (lvlErr) {
      console.error('[BOT] Erreur lors du lancement du tracking vocal XP :', lvlErr);
    }
    try {
      const { startEventReminderLoop } = await import('../services/eventService.js');
      startEventReminderLoop(client);
    } catch (evtErr) {
      console.error('[BOT] Erreur lors du lancement de la boucle de rappels événements :', evtErr);
    }
    try {
      const { initTempVoice } = await import('../services/tempVoiceService.js');
      await initTempVoice(client);
    } catch (tvErr) {
      console.error('[BOT] Erreur lors de l\'initialisation des salons vocaux temporaires :', tvErr);
    }
    try {
      const { startBackupScheduler } = await import('../services/backupSchedulerService.js');
      startBackupScheduler(client);
    } catch (bkErr) {
      console.error('[BOT] Erreur lors du lancement du planificateur de sauvegarde :', bkErr);
    }
    try {
      const { startCloudRelayService } = await import('../services/cloudRelayService.js');
      startCloudRelayService(client);
    } catch (cloudErr) {
      console.error('[BOT] Erreur lors du lancement de la passerelle Cloud Relay :', cloudErr);
    }
  },
};
