import { EmbedBuilder } from 'discord.js';
import { getCountingConfig, saveCountingConfig } from '../countingService.js';
import { recordValidCount, recordInvalidCount } from './statsEngine.js';
import { config } from '../../config.js';
const channelQueues = new Map();
function getChannelQueue(channelKey) {
  if (!channelQueues.has(channelKey)) {
    channelQueues.set(channelKey, Promise.resolve());
  }
  return channelQueues.get(channelKey);
}
function setChannelQueue(channelKey, promise) {
  channelQueues.set(channelKey, promise);
}
export const COUNTING_MODES = {
  CLASSIQUE: 'classique',
  INVERSE: 'inverse',
  EQUIPE: 'equipe',
  SANS_REPETITION: 'sans_repetition',
  OBJECTIF: 'objectif',
  CHRONO: 'chrono',
  QUOTIDIEN: 'quotidien',
  HEBDOMADAIRE: 'hebdomadaire',
  MARATHON: 'marathon',
  RELAIS: 'relais',
  PALIERS: 'paliers',
  SILENCIEUX: 'silencieux',
};
export const COUNTING_VARIANTS = {
  NONE: 'none',
  FIZZBUZZ: 'fizzbuzz',
  PAIRS_ONLY: 'pairs_only',
  IMPAIRS_ONLY: 'impairs_only',
  STEP_CUSTOM: 'step_custom',
  BANNED_DIGIT: 'banned_digit',
};
export const DEFAULT_MILESTONES = [25, 50, 100, 250, 500, 750, 1000, 2000, 5000, 10000];
export function getExpectedDisplay(cfg) {
  const current = cfg.current_count || 0;
  const mode = cfg.mode || COUNTING_MODES.CLASSIQUE;
  const variant = cfg.variant || COUNTING_VARIANTS.NONE;
  const step = cfg.step || 1;
  let nextNum = mode === COUNTING_MODES.INVERSE ? current - step : current + step;
  if (variant === COUNTING_VARIANTS.FIZZBUZZ) {
    let expected = '';
    if (nextNum % 3 === 0) expected += 'fizz';
    if (nextNum % 5 === 0) expected += 'buzz';
    if (expected) return expected;
  }
  return String(nextNum);
}
export function validatePlayerInput(input, cfg) {
  const clean = String(input).trim().toLowerCase();
  const current = cfg.current_count || 0;
  const mode = cfg.mode || COUNTING_MODES.CLASSIQUE;
  const variant = cfg.variant || COUNTING_VARIANTS.NONE;
  const step = cfg.step || 1;
  let nextNum = mode === COUNTING_MODES.INVERSE ? current - step : current + step;
  if (variant === COUNTING_VARIANTS.FIZZBUZZ) {
    let expectedWord = '';
    if (nextNum % 3 === 0) expectedWord += 'fizz';
    if (nextNum % 5 === 0) expectedWord += 'buzz';
    if (expectedWord) {
      return {
        isValid: clean === expectedWord,
        expectedDisplay: expectedWord,
        nextCount: nextNum,
        isWord: true,
      };
    }
  }
  if (variant === COUNTING_VARIANTS.BANNED_DIGIT && cfg.banned_digit) {
    const bannedStr = String(cfg.banned_digit);
    if (String(nextNum).includes(bannedStr)) {
      const isSkip = clean === 'skip' || clean === 'pass';
      return {
        isValid: isSkip,
        expectedDisplay: 'skip',
        nextCount: nextNum,
        isWord: true,
      };
    }
  }
  const parsedNum = parseInt(clean, 10);
  if (isNaN(parsedNum)) {
    return {
      isValid: false,
      isNumeric: false,
      expectedDisplay: String(nextNum),
      nextCount: nextNum,
    };
  }
  const isValid = parsedNum === nextNum;
  return {
    isValid,
    isNumeric: true,
    expectedDisplay: String(nextNum),
    nextCount: nextNum,
    receivedNum: parsedNum,
  };
}
export async function handleCountingChatMessage(message) {
  if (!message.guild || message.author.bot) return false;
  const guildId = message.guild.id;
  const channelId = message.channel.id;
  const cfg = await getCountingConfig(guildId);
  const isOfficialChannel = cfg.channel_id === channelId;
  const isSecondaryChannel = Array.isArray(cfg.additional_channels) && cfg.additional_channels.includes(channelId);
  if (!isOfficialChannel && !isSecondaryChannel) {
    return false;
  }
  const channelKey = `${guildId}_${channelId}`;
  const previousPromise = getChannelQueue(channelKey);
  const currentTask = previousPromise.then(async () => {
    return await executeChatMessageLogic(message, cfg);
  }).catch((err) => {
    console.error('[CountingEngine] Erreur queue salon :', err);
    return false;
  });
  setChannelQueue(channelKey, currentTask);
  return await currentTask;
}
async function executeChatMessageLogic(message, cfg) {
  const freshCfg = await getCountingConfig(message.guild.id);
  if (freshCfg.is_paused) {
    return false;
  }
  const text = message.content.trim();
  const validation = validatePlayerInput(text, freshCfg);
  if (!validation.isNumeric && !validation.isWord) {
    if (freshCfg.strict_mode) {
      await message.react('⚠️').catch(() => {});
    }
    return false; 
  }
  const preventConsecutive = freshCfg.prevent_consecutive !== false;
  if (preventConsecutive && freshCfg.last_user_id === message.author.id) {
    await message.react('❌').catch(() => {});
    const warn = await message.channel.send({
      content: `🛑 ${message.author}, **vous ne pouvez pas compter deux fois de suite !** Laissez un autre membre participer.`,
    }).catch(() => null);
    if (warn) setTimeout(() => warn.delete().catch(() => {}), 5000);
    return true;
  }
  if (validation.isValid) {
    freshCfg.current_count = validation.nextCount;
    freshCfg.last_user_id = message.author.id;
    freshCfg.last_message_id = message.id;
    let isNewRecord = false;
    if (freshCfg.current_count > (freshCfg.high_score || 0)) {
      freshCfg.high_score = freshCfg.current_count;
      isNewRecord = true;
    }
    await message.react('✅').catch(() => {});
    if (isNewRecord && freshCfg.current_count > 10) {
      await message.react('🏆').catch(() => {});
    }
    await recordValidCount(message.guild, message.author, freshCfg.current_count);
    const milestones = freshCfg.milestones || DEFAULT_MILESTONES;
    if (milestones.includes(freshCfg.current_count)) {
      await message.react('🎉').catch(() => {});
      const milestoneEmbed = new EmbedBuilder()
        .setTitle('🎉 PALIER COMMUNAUTAIRE ATTEINT !')
        .setDescription(
          `Félicitations à toute la communauté ! Le palier des **${freshCfg.current_count}** vient d'être franchi grâce à ${message.author} !\n` +
          `✨ Continuez sur cette lancée pour établir un nouveau record historique !`
        )
        .setColor(config.colors.accent || '#38bdf8')
        .setFooter({ text: `Codé avec ❤️ par Saez | Prochain palier dans le salon de comptage` })
        .setTimestamp();
      await message.channel.send({ embeds: [milestoneEmbed] }).catch(() => {});
    }
    if (freshCfg.mode === COUNTING_MODES.OBJECTIF && freshCfg.target_number && freshCfg.current_count >= freshCfg.target_number) {
      const victoryEmbed = new EmbedBuilder()
        .setTitle('🏆 OBJECTIF DE COMPTAGE ATTEINT !')
        .setDescription(`Le nombre cible de **${freshCfg.target_number}** a été atteint par ${message.author} ! La partie est victorieuse !`)
        .setColor('#10b981')
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      await message.channel.send({ embeds: [victoryEmbed] }).catch(() => {});
      freshCfg.is_paused = true;
    }
    await saveCountingConfig(message.guild.id, freshCfg);
    return true;
  }
  await message.react('❌').catch(() => {});
  await recordInvalidCount(message.guild, message.author);
  const previousCount = freshCfg.current_count || 0;
  let penaltyText = 'Le compteur repart à **0** ! Prochain nombre : `1`.';
  if (freshCfg.error_handling === 'checkpoint') {
    const checkpoint = Math.floor(previousCount / 50) * 50;
    freshCfg.current_count = checkpoint;
    freshCfg.last_user_id = null;
    penaltyText = `Sauvegarde Marathon : Le compteur retombe au checkpoint de **${checkpoint}** !`;
  } else {
    freshCfg.current_count = 0;
    freshCfg.last_user_id = null;
  }
  await saveCountingConfig(message.guild.id, freshCfg);
  const errorEmbed = new EmbedBuilder()
    .setTitle('💥 ERREUR DE COMPTAGE !')
    .setDescription(
      `Oups ! ${message.author} s'est trompé(e) !\n` +
      `• Nombre envoyé : \`${text}\`\n` +
      `• Nombre attendu : \`${validation.expectedDisplay}\`\n` +
      `• ${penaltyText}`
    )
    .setColor(config.colors.warning || '#ef4444')
    .setFooter({ text: `Codé avec ❤️ par Saez | Record du serveur à battre : ${freshCfg.high_score || 0}` })
    .setTimestamp();
  await message.channel.send({ embeds: [errorEmbed] }).catch(() => {});
  return true;
}
