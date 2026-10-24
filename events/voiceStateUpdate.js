import { Events } from 'discord.js';
import { handleVoiceStateUpdate as handleLevelVoiceUpdate } from '../services/discordLevelService.js';
import { handleTempVoiceStateUpdate } from '../services/tempVoiceService.js';
import { recordLog } from '../services/discordLogService.js';
export default {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState, client) {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;
    const guild = newState.guild || oldState.guild;
    const botClient = client || newState.client || oldState.client;
    try {
      if (!oldState.channelId && newState.channelId) {
        await recordLog({
          client: botClient,
          guildId: guild?.id,
          type: 'VOICE',
          action: 'Connexion Vocale',
          user: member.user,
          target: { id: newState.channelId, name: newState.channel?.name || 'Salon vocal', type: 'VoiceChannel' },
          details: `**${member.displayName}** s'est connecté au salon vocal <#${newState.channelId}>.`,
          channelId: newState.channelId,
          status: 'SUCCESS',
        });
      } else if (oldState.channelId && !newState.channelId) {
        await recordLog({
          client: botClient,
          guildId: guild?.id,
          type: 'VOICE',
          action: 'Déconnexion Vocale',
          user: member.user,
          target: { id: oldState.channelId, name: oldState.channel?.name || 'Salon vocal', type: 'VoiceChannel' },
          details: `**${member.displayName}** a quitté le salon vocal <#${oldState.channelId}>.`,
          channelId: oldState.channelId,
          status: 'INFO',
        });
      } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        await recordLog({
          client: botClient,
          guildId: guild?.id,
          type: 'VOICE',
          action: 'Déplacement Vocal',
          user: member.user,
          target: { id: newState.channelId, name: newState.channel?.name || 'Salon vocal', type: 'VoiceChannel' },
          details: `**${member.displayName}** a changé de salon : <#${oldState.channelId}> ➔ <#${newState.channelId}>.`,
          channelId: newState.channelId,
          status: 'INFO',
        });
      }
    } catch (logErr) {
      console.error('[VoiceStateUpdate] Erreur recordLog :', logErr);
    }
    try {
      await handleTempVoiceStateUpdate(oldState, newState, botClient);
    } catch (tempErr) {
      console.error('[VoiceStateUpdate] Erreur handleTempVoiceStateUpdate :', tempErr);
    }
    try {
      await handleLevelVoiceUpdate(oldState, newState);
    } catch (lvlErr) {
      console.error('[VoiceStateUpdate] Erreur handleLevelVoiceUpdate :', lvlErr);
    }
  },
};
