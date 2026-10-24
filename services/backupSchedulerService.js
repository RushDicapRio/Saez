import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { getDb } from '../database/mongo.js';
import { createBackup, getBackupSettings, enforceRetentionPolicy } from './backupService.js';
import { config } from '../config.js';
let schedulerInterval = null;
const isGuildBackingUp = new Map(); 
function getFrequencyMs(freq) {
  switch (freq) {
    case 'hourly':
      return 60 * 60 * 1000;
    case 'every_12h':
      return 12 * 60 * 60 * 1000;
    case 'weekly':
      return 7 * 24 * 60 * 60 * 1000;
    case 'daily':
    default:
      return 24 * 60 * 60 * 1000;
  }
}
async function processGuildAutoBackup(client, guild) {
  if (isGuildBackingUp.get(guild.id)) return;
  try {
    const settings = await getBackupSettings(guild.id);
    if (!settings.enabled || !settings.auto_backup_enabled) {
      return;
    }
    const db = getDb();
    if (!db) return;
    const lastAuto = await db
      .collection('server_backups')
      .findOne({ guild_id: guild.id, is_auto: true }, { sort: { created_at: -1 } });
    const requiredInterval = getFrequencyMs(settings.auto_backup_frequency);
    const now = Date.now();
    if (lastAuto && lastAuto.created_at) {
      const elapsed = now - new Date(lastAuto.created_at).getTime();
      if (elapsed < requiredInterval) {
        return; 
      }
    }
    isGuildBackingUp.set(guild.id, true);
    console.log(`[BackupScheduler] 🔄 Démarrage de la sauvegarde automatique pour le serveur ${guild.name} (${guild.id})...`);
    const result = await createBackup(
      guild,
      { id: 'AUTO_SCHEDULER', tag: 'Planificateur Auto' },
      {
        name: `AutoBackup-${new Date().toISOString().slice(0, 10)}`,
        description: `Sauvegarde programmée (${settings.auto_backup_frequency})`,
        type: settings.default_type || 'full',
        isAuto: true,
        reason: 'Planification automatique récurrente',
      }
    );
    console.log(`[BackupScheduler] ✅ Sauvegarde automatique réussie pour ${guild.name} (ID: ${result.backup_id})`);
    if (settings.notify_channel_id) {
      try {
        const channel =
          guild.channels.cache.get(settings.notify_channel_id) ||
          (await guild.channels.fetch(settings.notify_channel_id).catch(() => null));
        if (channel && channel.isTextBased()) {
          const embed = new EmbedBuilder()
            .setTitle('⏰ Sauvegarde Automatique Réussie')
            .setDescription(`Le planificateur automatique a généré un nouvel instantané de sécurité pour **${guild.name}**.`)
            .setColor(config.colors?.success || 0x10b981)
            .addFields(
              { name: '🏷️ Nom', value: result.name, inline: true },
              { name: '🆔 Identifiant', value: `\`${result.backup_id}\``, inline: true },
              { name: '📁 Éléments', value: `${result.counts.roles} rôles • ${result.counts.channels} salons`, inline: true },
              { name: '💾 Poids', value: `${(result.size_bytes / 1024).toFixed(1)} Ko`, inline: true },
              { name: '🔄 Fréquence', value: settings.auto_backup_frequency, inline: true }
            )
            .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Backup Engine • Gestionnaire automatique' })
            .setTimestamp();
          await channel.send({ embeds: [embed] }).catch(() => {});
        }
      } catch (notifyErr) {
        console.warn(`[BackupScheduler] Notification échouée pour ${guild.name} :`, notifyErr.message);
      }
    }
  } catch (err) {
    console.error(`[BackupScheduler] ❌ Erreur lors de la sauvegarde automatique de ${guild.name} :`, err);
  } finally {
    isGuildBackingUp.delete(guild.id);
  }
}
export function startBackupScheduler(client, checkIntervalMinutes = 10) {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }
  console.log(`[BackupScheduler] ⏰ Planificateur de sauvegardes initialisé (cycle de contrôle : ${checkIntervalMinutes} min).`);
  const runCheck = async () => {
    if (!client.isReady()) return;
    for (const [, guild] of client.guilds.cache) {
      await processGuildAutoBackup(client, guild).catch((err) => {
        console.error(`[BackupScheduler] Erreur tick pour guild ${guild.id} :`, err);
      });
    }
  };
  setTimeout(runCheck, 45000);
  schedulerInterval = setInterval(runCheck, checkIntervalMinutes * 60 * 1000);
}
export function stopBackupScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[BackupScheduler] 🛑 Planificateur de sauvegardes arrêté.');
  }
}
