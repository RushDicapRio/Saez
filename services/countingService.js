import { getDb } from '../database/mongo.js';
import * as LogicEngine from './counting/logicEngine.js';
import * as MiniGamesEngine from './counting/miniGamesEngine.js';
import * as StatsEngine from './counting/statsEngine.js';
import * as DuelEngine from './counting/duelEngine.js';
import * as AdminEngine from './counting/adminEngine.js';
import * as CountingEngine from './counting/countingEngine.js';
export {
  LogicEngine,
  MiniGamesEngine,
  StatsEngine,
  DuelEngine,
  AdminEngine,
  CountingEngine,
};
let inMemoryCountingConfigs = new Map();
export function resetCountingMemoryStore() {
  inMemoryCountingConfigs = new Map();
  StatsEngine.resetStatsMemoryStore();
  DuelEngine.resetDuelsMemoryStore();
  AdminEngine.resetAdminMemoryStore();
}
export async function getCountingConfig(guildId) {
  const defaultCfg = {
    guild_id: guildId,
    channel_id: null,
    additional_channels: [],
    current_count: 0,
    high_score: 0,
    last_user_id: null,
    last_message_id: null,
    strict_mode: true,
    prevent_consecutive: true,
    mode: CountingEngine.COUNTING_MODES.CLASSIQUE,
    variant: CountingEngine.COUNTING_VARIANTS.NONE,
    step: 1,
    target_number: null,
    error_handling: 'reset',
    is_paused: false,
    milestones: CountingEngine.DEFAULT_MILESTONES,
    updated_at: new Date(),
  };
  try {
    const db = getDb();
    if (db) {
      const doc = await db.collection('server_counting').findOne({ guild_id: guildId });
      if (doc) return { ...defaultCfg, ...doc };
    }
  } catch {}
  if (inMemoryCountingConfigs.has(guildId)) {
    return { ...defaultCfg, ...inMemoryCountingConfigs.get(guildId) };
  }
  inMemoryCountingConfigs.set(guildId, defaultCfg);
  return defaultCfg;
}
export async function saveCountingConfig(guildId, data) {
  const current = inMemoryCountingConfigs.get(guildId) || {};
  const merged = { ...current, ...data, guild_id: guildId, updated_at: new Date() };
  inMemoryCountingConfigs.set(guildId, merged);
  try {
    const db = getDb();
    if (db) {
      await db.collection('server_counting').updateOne(
        { guild_id: guildId },
        { $set: merged },
        { upsert: true }
      );
      return true;
    }
  } catch {}
  return true;
}
export async function handleCountingMessage(message) {
  return await CountingEngine.handleCountingChatMessage(message);
}
