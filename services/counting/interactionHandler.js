import { MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { DuelEngine, AdminEngine, LogicEngine } from '../countingService.js';
import { config } from '../../config.js';
export async function handleCountingButton(interaction) {
  const { customId, guild, user, member } = interaction;
  if (customId.startsWith('cnt_duel_accept_')) {
    const duelId = customId.replace('cnt_duel_accept_', '');
    const res = await DuelEngine.acceptDuel(duelId, user.id);
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.message}`, flags: MessageFlags.Ephemeral });
    }
    const firstQ = res.duel.questions[0];
    const embed = new EmbedBuilder()
      .setTitle('⚔️ DUEL DE CALCUL DÉMARRÉ !')
      .setDescription(
        `Le duel opposant **${res.duel.challenger.username}** et **${res.duel.opponent.username}** commence maintenant !\n\n` +
        `**Round 1 / ${res.duel.roundsCount}**\n` +
        `\`\`\`\n${firstQ.prompt}\n\`\`\`\n` +
        `👉 Le premier à soumettre la bonne réponse avec \`/counting duel repondre <valeur>\` marque le point !`
      )
      .setColor('#f59e0b')
      .setFooter({ text: 'Codé avec ❤️ par Saez' })
      .setTimestamp();
    return await interaction.update({ embeds: [embed], components: [] });
  }
  if (customId.startsWith('cnt_duel_decline_')) {
    const duelId = customId.replace('cnt_duel_decline_', '');
    const res = await DuelEngine.declineDuel(duelId, user.id);
    if (!res.success) {
      return await interaction.reply({ content: `❌ ${res.message}`, flags: MessageFlags.Ephemeral });
    }
    return await interaction.update({
      content: `❌ Le défi de duel a été décliné par ${user}.`,
      embeds: [],
      components: [],
    });
  }
  if (customId.startsWith('cnt_reset_confirm_')) {
    if (!member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({ content: '❌ Vous n\'avez pas la permission Gérer le Serveur.', flags: MessageFlags.Ephemeral });
    }
    const parts = customId.replace('cnt_reset_confirm_', '').split('_');
    const resetType = parts[0]; // 'compteur', 'record', 'total'
    let resultMsg = 'Réinitialisation effectuée avec succès.';
    if (resetType === 'compteur') {
      const res = await AdminEngine.resetCurrentCount(guild.id, user, 'Confirmation par bouton');
      resultMsg = `🔄 Compteur réinitialisé à **0** (précédent : ${res.previousCount}). Prochain nombre attendu : \`1\`.`;
    } else if (resetType === 'record') {
      const res = await AdminEngine.resetHighScore(guild.id, user);
      resultMsg = `🏆 Record historique réinitialisé à **0** (précédent : ${res.previousRecord}).`;
    } else if (resetType === 'total') {
      await AdminEngine.resetCurrentCount(guild.id, user, 'Reset total');
      await AdminEngine.resetHighScore(guild.id, user);
      resultMsg = `⚠️ **RÉINITIALISATION TOTALE DU COMPTEUR EFFECTUÉE.** Sauvegarde préalable enregistrée dans l'audit.`;
    }
    const embed = new EmbedBuilder()
      .setTitle('✅ Opération Confirmée')
      .setDescription(resultMsg)
      .setColor('#10b981')
      .setFooter({ text: `Codé avec ❤️ par Saez | Exécuté par ${user.tag}` })
      .setTimestamp();
    return await interaction.update({ embeds: [embed], components: [] });
  }
  if (customId === 'cnt_reset_cancel') {
    return await interaction.update({
      content: '🛡️ Réinitialisation annulée. Aucune donnée n\'a été modifiée.',
      embeds: [],
      components: [],
    });
  }
}
