import {
  Events,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { createTicketChannel, closeTicketChannel } from '../services/ticketService.js';
import { getDb } from '../database/mongo.js';
import { config } from '../config.js';
export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isAutocomplete()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (command && typeof command.autocomplete === 'function') {
        try {
          await command.autocomplete(interaction);
        } catch (err) {
          console.error(`[BOT] Erreur autocomplétion /${interaction.commandName} :`, err);
        }
      }
      return;
    }
    if (interaction.isChatInputCommand()) {
      let command = interaction.client.commands.get(interaction.commandName);
      if (!command) {
        try {
          const fs = await import('node:fs');
          const path = await import('node:path');
          const { pathToFileURL } = await import('node:url');
          const commandsPath = path.resolve(process.cwd(), 'bot', 'commands');
          async function findAndLoadCmd(dir) {
            if (!fs.existsSync(dir)) return null;
            const entries = fs.readdirSync(dir);
            for (const file of entries) {
              const full = path.join(dir, file);
              if (fs.statSync(full).isDirectory()) {
                const res = await findAndLoadCmd(full);
                if (res) return res;
              } else if (file.endsWith('.js')) {
                try {
                  const mod = await import(`${pathToFileURL(full).href}?v=${Date.now()}`);
                  const loaded = mod.default || mod;
                  if (loaded?.data?.name === interaction.commandName && typeof loaded.execute === 'function') {
                    return {
                      data: loaded.data,
                      execute: loaded.execute,
                      category: path.basename(path.dirname(full)),
                    };
                  }
                } catch {}
              }
            }
            return null;
          }
          const foundCmd = await findAndLoadCmd(commandsPath);
          if (foundCmd) {
            interaction.client.commands.set(foundCmd.data.name, foundCmd);
            command = foundCmd;
            console.log(`[BOT] ⚡ Commande /${foundCmd.data.name} [${foundCmd.category}] chargée dynamiquement !`);
          }
        } catch (hotErr) {
          console.error('[BOT] Erreur rechargement dynamique commande :', hotErr);
        }
      }
      if (!command) {
        console.warn(`[BOT] Commande inconnue : ${interaction.commandName}`);
        return await interaction.reply({
          content: `❌ La commande **/${interaction.commandName}** n'est pas reconnue ou est en cours de synchronisation.\n` +
                   `💡 *Si vous venez de l'ajouter, lancez \`npm run bot:deploy\` sur votre terminal pour l'enregistrer auprès de Discord.*`,
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      }
      if (command.category === 'fun') {
        const { getFunChannelId } = await import('../services/funService.js');
        const allowedChannelId = await getFunChannelId(interaction.guildId);
        if (interaction.channelId !== allowedChannelId) {
          return await interaction.reply({
            content: `🎮 Les commandes de divertissement et mini-jeux ne peuvent être exécutées que dans le salon <#${allowedChannelId}> ! Rendez-vous là-bas pour jouer. ✨`,
            flags: MessageFlags.Ephemeral,
          });
        }
      }
      try {
        await command.execute(interaction);
        const { recordLog } = await import('../services/discordLogService.js');
        recordLog({
          client: interaction.client,
          guildId: interaction.guildId,
          type: 'COMMAND',
          action: `Commande /${interaction.commandName}`,
          user: interaction.user,
          details: `Exécutée dans <#${interaction.channelId}>`,
          channelId: interaction.channelId,
          status: 'SUCCESS',
        }).catch(() => {});
      } catch (error) {
        console.error(`[BOT] Erreur lors de l'exécution de /${interaction.commandName} :`, error);
        const { recordLog } = await import('../services/discordLogService.js');
        recordLog({
          client: interaction.client,
          guildId: interaction.guildId,
          type: 'COMMAND',
          action: `Erreur /${interaction.commandName}`,
          user: interaction.user,
          details: `Erreur : ${error.message || error}`,
          channelId: interaction.channelId,
          status: 'ERROR',
        }).catch(() => {});
        const errorMsg = {
          content: '❌ Une erreur est survenue lors de l’exécution de cette commande.',
          flags: MessageFlags.Ephemeral,
        };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMsg).catch(() => {});
        } else {
          await interaction.reply(errorMsg).catch(() => {});
        }
      }
      return;
    }
    if (interaction.isButton()) {
      const { customId, guild, user, channel } = interaction;
      if (
        customId.startsWith('deb_vote_') ||
        customId.startsWith('conf_react_') ||
        customId.startsWith('conf_approve_') ||
        customId.startsWith('conf_reject_') ||
        customId.startsWith('bday_wish_') ||
        customId.startsWith('goal_contrib_') ||
        customId.startsWith('thx_react_') ||
        customId.startsWith('app_action_')
      ) {
        const { handleCommunityButton } = await import('../services/communityInteractionHandler.js');
        return await handleCommunityButton(interaction);
      }
      if (customId.startsWith('cnt_')) {
        const { handleCountingButton } = await import('../services/counting/interactionHandler.js');
        return await handleCountingButton(interaction);
      }
      if (customId.startsWith('creativite_')) {
        const { handleCreativiteInteraction } = await import('../services/creativiteInteractionHandler.js');
        return await handleCreativiteInteraction(interaction);
      }
      if (customId.startsWith('btn_autorole_')) {
        const roleId = customId.replace('btn_autorole_', '');
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const { toggleMemberRole } = await import('../services/autoroleService.js');
        const res = await toggleMemberRole(guild, interaction.member, roleId);
        if (!res.success) {
          return await interaction.editReply({
            content: `❌ ${res.message}`,
          });
        }
        if (res.action === 'added') {
          return await interaction.editReply({
            content: `🎉 Vous avez reçu le rôle ${res.roleMention} !`,
          });
        } else {
          return await interaction.editReply({
            content: `🗑️ Le rôle ${res.roleMention} vous a été retiré.`,
          });
        }
      }
      if (customId.startsWith('alert_ack_')) {
        const alertId = customId.replace('alert_ack_', '');
        const { acknowledgeAlert } = await import('../services/automationService.js');
        await acknowledgeAlert(alertId, user);
        return await interaction.reply({
          content: `✅ Alerte \`${alertId}\` acquittée avec succès par ${user}. Prise en charge enregistrée !`,
        });
      }
      if (customId.startsWith('alert_mute_')) {
        const alertId = customId.replace('alert_mute_', '');
        return await interaction.reply({
          content: `🔇 L'alerte \`${alertId}\` a été mise en sourdine temporaire par ${user}.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      if (customId.startsWith('music_')) {
        const { getGuildQueue, canControlMusic, startPlayingTrack, playNextTrack, destroyGuildQueue } = await import('../services/musicService.js');
        const queue = getGuildQueue(guild.id);
        if (!queue || (!queue.currentTrack && queue.tracks.length === 0)) {
          return await interaction.reply({
            content: '❌ Aucune musique n\'est actuellement active sur ce serveur.',
            flags: MessageFlags.Ephemeral,
          });
        }
        if (!canControlMusic(interaction.member, queue)) {
          return await interaction.reply({
            content: '❌ Vous devez être dans le même salon vocal que le bot pour contrôler la lecture.',
            flags: MessageFlags.Ephemeral,
          });
        }
        if (customId === 'music_pause') {
          if (queue.isPaused) {
            queue.isPaused = false;
            queue.isPlaying = true;
            if (queue.player && typeof queue.player.unpause === 'function') {
              try { queue.player.unpause(); } catch (e) {}
            }
            return await interaction.reply({ content: '▶️ La lecture a été reprise !' });
          } else {
            queue.isPaused = true;
            queue.isPlaying = false;
            if (queue.player && typeof queue.player.pause === 'function') {
              try { queue.player.pause(); } catch (e) {}
            }
            return await interaction.reply({ content: '⏸️ La lecture a été mise en pause !' });
          }
        }
        if (customId === 'music_skip') {
          const prev = queue.currentTrack?.title;
          const next = playNextTrack(guild.id);
          if (next) {
            await startPlayingTrack(guild.id);
            return await interaction.reply({ content: `⏭️ Morceau **${prev || 'actuel'}** passé ! Enchaînement sur **${next.title}**.` });
          } else {
            return await interaction.reply({ content: `⏭️ Morceau **${prev || 'actuel'}** passé. La file d'attente est désormais vide.` });
          }
        }
        if (customId === 'music_queue') {
          const embed = new EmbedBuilder()
            .setTitle(`📜 File d'attente — ${guild.name}`)
            .setColor(0x00e5ff)
            .setDescription(
              queue.currentTrack
                ? `**En cours :** [${queue.currentTrack.title}](${queue.currentTrack.url}) (${queue.currentTrack.duration})\n\n` +
                  (queue.tracks.length > 0
                    ? '**À suivre :**\n' + queue.tracks.slice(0, 10).map((t, i) => `\`${i + 1}.\` [${t.title}](${t.url}) (${t.duration})`).join('\n')
                    : '*Aucun autre titre en attente dans la file.*')
                : '*Aucun morceau en cours.*'
            )
            .setFooter({ text: `Codé avec ❤️ par Saez | ${queue.tracks.length} morceau(x) dans la file d'attente` });
          return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
        if (customId === 'music_shuffle') {
          if (queue.tracks.length <= 1) {
            return await interaction.reply({ content: '❌ Il faut au moins 2 morceaux dans la file d\'attente pour mélanger.', flags: MessageFlags.Ephemeral });
          }
          for (let i = queue.tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [queue.tracks[i], queue.tracks[j]] = [queue.tracks[j], queue.tracks[i]];
          }
          return await interaction.reply({ content: `🔀 La file d'attente a été mélangée (${queue.tracks.length} morceaux) !` });
        }
        if (customId === 'music_stop') {
          destroyGuildQueue(guild.id);
          return await interaction.reply({ content: '⏹️ Lecture arrêtée et bot déconnecté du salon vocal.' });
        }
      }
      if (customId.startsWith('giveaway_join_')) {
        const { handleGiveawayJoin } = await import(`../services/giveawayService.js?v=${Date.now()}`);
        return await handleGiveawayJoin(interaction);
      }
      if (customId.startsWith('sugg_upvote_') || customId.startsWith('sugg_downvote_') || customId.startsWith('sugg_info_')) {
        const { handleSuggestionVote } = await import(`../services/suggestionService.js?v=${Date.now()}`);
        return await handleSuggestionVote(interaction);
      }
      if (customId.startsWith('event_join_')) {
        const eventId = customId.replace('event_join_', '');
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const { joinEvent } = await import('../services/eventService.js');
        const res = await joinEvent(eventId, user, interaction.client);
        return await interaction.editReply({ content: res.message });
      }
      if (customId.startsWith('event_leave_')) {
        const eventId = customId.replace('event_leave_', '');
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const { leaveEvent } = await import('../services/eventService.js');
        const res = await leaveEvent(eventId, user, interaction.client);
        return await interaction.editReply({ content: res.message });
      }
      if (customId.startsWith('event_list_')) {
        const eventId = customId.replace('event_list_', '');
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const { getEventById } = await import('../services/eventService.js');
        const event = await getEventById(eventId);
        if (!event) {
          return await interaction.editReply({ content: '❌ Événement introuvable.' });
        }
        const participants = event.participants || [];
        const lines = participants.length === 0
          ? 'Aucun inscrit pour le moment.'
          : participants.map((p, idx) => `\`${idx + 1}.\` <@${p.user_id}> (${p.username})`).join('\n');
        return await interaction.editReply({
          content: `👥 **Participants à « ${event.title} » (${participants.length}) :**\n\n${lines}`,
        });
      }
      if (customId.startsWith('tempvoice_')) {
        const parts = customId.split('_');
        const action = parts[1];
        const channelId = parts.slice(2).join('_');
        const voiceChannel = guild.channels.cache.get(channelId);
        if (!voiceChannel) {
          return await interaction.reply({
            content: '❌ Ce salon vocal temporaire n\'existe plus.',
            flags: MessageFlags.Ephemeral,
          });
        }
        const {
          getTempChannelRecord,
          toggleLockTempChannel,
          setTempChannelLimit,
          setTempChannelName,
        } = await import('../services/tempVoiceService.js');
        const rec = await getTempChannelRecord(channelId);
        if (!rec) {
          return await interaction.reply({
            content: '❌ Ce salon vocal n\'est pas un salon temporaire actif.',
            flags: MessageFlags.Ephemeral,
          });
        }
        if (rec.owner_id !== user.id && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return await interaction.reply({
            content: `❌ Seul le propriétaire du salon (<@${rec.owner_id}>) peut utiliser ces boutons.`,
            flags: MessageFlags.Ephemeral,
          });
        }
        if (action === 'lock') {
          await toggleLockTempChannel(voiceChannel, user.id, true);
          return await interaction.reply({
            content: '🔒 **Salon verrouillé !** Les autres membres ne peuvent plus le rejoindre.',
            flags: MessageFlags.Ephemeral,
          });
        }
        if (action === 'unlock') {
          await toggleLockTempChannel(voiceChannel, user.id, false);
          return await interaction.reply({
            content: '🔓 **Salon déverrouillé !** Tout le monde peut désormais le rejoindre.',
            flags: MessageFlags.Ephemeral,
          });
        }
        if (action === 'rename') {
          const modal = new ModalBuilder()
            .setCustomId(`modal_tempvoice_rename_${channelId}`)
            .setTitle('Renommer votre salon vocal');
          const input = new TextInputBuilder()
            .setCustomId('new_name')
            .setLabel('Nouveau nom du salon')
            .setStyle(TextInputStyle.Short)
            .setValue(voiceChannel.name)
            .setMaxLength(32)
            .setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          return await interaction.showModal(modal);
        }
        if (action === 'limit') {
          const modal = new ModalBuilder()
            .setCustomId(`modal_tempvoice_limit_${channelId}`)
            .setTitle('Limite de participants');
          const input = new TextInputBuilder()
            .setCustomId('new_limit')
            .setLabel('Nombre max (0 = illimité, 1 à 99)')
            .setStyle(TextInputStyle.Short)
            .setValue(String(voiceChannel.userLimit || 0))
            .setMaxLength(2)
            .setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          return await interaction.showModal(modal);
        }
        if (action === 'block') {
          return await interaction.reply({
            content: '💡 Pour bloquer ou expulser un membre précis, utilisez la commande : `/voice bloquer @Membre`.',
            flags: MessageFlags.Ephemeral,
          });
        }
        if (action === 'permit') {
          return await interaction.reply({
            content: '💡 Pour autoriser un membre sur votre salon privé, utilisez la commande : `/voice autoriser @Membre`.',
            flags: MessageFlags.Ephemeral,
          });
        }
        if (action === 'stats') {
          const joinedMembers = voiceChannel.members.size;
          const createdAt = rec.created_at ? new Date(rec.created_at) : new Date();
          const elapsedMins = Math.floor((Date.now() - createdAt.getTime()) / 60000);
          return await interaction.reply({
            content: `📊 **Statistiques de votre salon :**\n` +
                     `• 👑 Propriétaire : <@${rec.owner_id}>\n` +
                     `• 👥 Participants actuels : **${joinedMembers}**\n` +
                     `• ⏱️ Durée de la session : **${elapsedMins} minute(s)**\n` +
                     `• 🔒 Accès : ${rec.is_locked ? 'Verrouillé 🔒' : 'Ouvert 🔓'}`,
            flags: MessageFlags.Ephemeral,
          });
        }
      }
      if (customId.startsWith('btn_sugg_create_')) {
        const catKey = customId.replace('btn_sugg_create_', '');
        const { createSuggestionModal } = await import(`../services/suggestionService.js?v=${Date.now()}`);
        const modal = createSuggestionModal(catKey);
        return await interaction.showModal(modal);
      }
      if (customId.startsWith('hub_launch_')) {
        const gameType = customId.replace('hub_launch_', '');
        try {
          const { getFunChannelId } = await import(`../services/funService.js?v=${Date.now()}`);
          const allowedChannelId = await getFunChannelId(interaction.guildId);
          if (interaction.channelId !== allowedChannelId) {
            return await interaction.reply({
              content: `🎮 Les mini-jeux ne peuvent être joués que dans le salon <#${allowedChannelId}> ! Rendez-vous là-bas pour lancer une partie. ✨`,
              flags: MessageFlags.Ephemeral,
            });
          }
          if (gameType === 'quiz') {
            const { execute: execQuiz } = await import(`../commands/fun/quiz.js?v=${Date.now()}`);
            return await execQuiz(interaction);
          }
          if (gameType === 'morpion') {
            const { execute: execMorpion } = await import(`../commands/fun/morpion.js?v=${Date.now()}`);
            return await execMorpion(interaction);
          }
          if (gameType === 'shifumi') {
            const { execute: execShifumi } = await import(`../commands/fun/shifumi.js?v=${Date.now()}`);
            return await execShifumi(interaction);
          }
          if (gameType === 'guess') {
            const { execute: execGuess } = await import(`../commands/fun/guess.js?v=${Date.now()}`);
            return await execGuess(interaction);
          }
          if (gameType === 'coinflip') {
            const { execute: execCoinflip } = await import(`../commands/fun/coinflip.js?v=${Date.now()}`);
            return await execCoinflip(interaction);
          }
          if (gameType === 'roll') {
            const { execute: execRoll } = await import(`../commands/fun/roll.js?v=${Date.now()}`);
            return await execRoll(interaction);
          }
        } catch (err) {
          console.error(`[BOT] Erreur lors du lancement rapide du jeu ${gameType} :`, err);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: `❌ Impossible de lancer le jeu : ${err.message}`,
              flags: MessageFlags.Ephemeral,
            }).catch(() => {});
          } else {
            await interaction.followUp({
              content: `❌ Impossible de lancer le jeu : ${err.message}`,
              flags: MessageFlags.Ephemeral,
            }).catch(() => {});
          }
        }
        return;
      }
      if (customId.startsWith('cassetete_')) {
        const { handleCasseteteButton } = await import('../services/casseteteService.js');
        return await handleCasseteteButton(interaction);
      }
      if (customId === 'support_btn_faq') {
        const { buildFaqSelectMenu } = await import('../services/supportService.js');
        const embed = new EmbedBuilder()
          .setTitle('❓ Foire Aux Questions (FAQ) — Saez Animes')
          .setDescription('Choisissez une question dans le menu déroulant ci-dessous pour afficher la solution :')
          .setColor(config.colors.primary)
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        const menu = buildFaqSelectMenu();
        return await interaction.reply({
          embeds: [embed],
          components: [menu],
          flags: MessageFlags.Ephemeral,
        });
      }
      if (customId === 'support_btn_diag') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const { runSaezDiagnostic } = await import('../services/supportService.js');
        const embed = await runSaezDiagnostic(interaction.client);
        return await interaction.editReply({ embeds: [embed] });
      }
      if (customId === 'support_btn_bug') {
        const { createBugModal } = await import('../services/supportService.js');
        const modal = createBugModal();
        return await interaction.showModal(modal);
      }
      if (customId.startsWith('btn_open_ticket_')) {
        let type = 'Support';
        let placeholder = 'Décrivez votre problème technique avec le logiciel...';
        if (customId === 'btn_open_ticket_bug') {
          type = 'Signalement';
          placeholder = 'Nom de l\'animé, numéro d\'épisode, lecteur ou lien défectueux...';
        } else if (customId === 'btn_open_ticket_other') {
          type = 'Autre';
          placeholder = 'Expliquez votre demande ou suggestion pour Saez...';
        }
        const modal = new ModalBuilder()
          .setCustomId(`modal_ticket_${type}`)
          .setTitle(`Ouverture Ticket — ${type}`);
        const subjectInput = new TextInputBuilder()
          .setCustomId('ticket_subject')
          .setLabel('Sujet de votre demande')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ex: Épisode 3 manquant sur Bleach')
          .setMinLength(3)
          .setMaxLength(100)
          .setRequired(true);
        const descInput = new TextInputBuilder()
          .setCustomId('ticket_desc')
          .setLabel('Détails supplémentaires')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder(placeholder)
          .setMinLength(5)
          .setMaxLength(1000)
          .setRequired(true);
        modal.addComponents(
          new ActionRowBuilder().addComponents(subjectInput),
          new ActionRowBuilder().addComponents(descInput)
        );
        return await interaction.showModal(modal);
      }
      if (customId.startsWith('ticket_close_')) {
        await interaction.reply({
          content: '⏳ Fermeture du ticket demandée...',
          flags: MessageFlags.Ephemeral,
        });
        await closeTicketChannel(channel, user, 'Fermé via bouton interactif');
        return;
      }
      if (customId.startsWith('ticket_claim_')) {
        const db = getDb();
        const ticketCol = db.collection('tickets');
        const doc = await ticketCol.findOne({ channel_id: channel.id });
        if (doc && doc.user_id === user.id) {
          return await interaction.reply({
            content: '❌ Vous ne pouvez pas prendre en charge votre propre ticket !',
            flags: MessageFlags.Ephemeral,
          });
        }
        const cfgCol = db.collection('config');
        const ticketCfg = await cfgCol.findOne({ _id: 'ticket_config' });
        const isStaff =
          interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) ||
          interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
          (ticketCfg?.support_role_id && interaction.member?.roles?.cache?.has(ticketCfg.support_role_id));
        if (!isStaff) {
          return await interaction.reply({
            content: '❌ Seuls les membres de l\'équipe Support ou Administrateurs peuvent prendre en charge ce ticket.',
            flags: MessageFlags.Ephemeral,
          });
        }
        if (doc?.claimed_by) {
          return await interaction.reply({
            content: `⚠️ Ce ticket est déjà pris en charge par <@${doc.claimed_by}>.`,
            flags: MessageFlags.Ephemeral,
          });
        }
        await ticketCol.updateOne(
          { channel_id: channel.id },
          { $set: { claimed_by: user.id, claimed_at: new Date() } }
        );
        const embed = new EmbedBuilder()
          .setTitle('🙋 Ticket pris en charge')
          .setDescription(`Ce ticket est désormais géré par ${user}.\n*L'équipe va vous répondre dans les plus brefs délais.*`)
          .setColor(config.colors.success)
          .setTimestamp()
          .setFooter({ text: 'Codé avec ❤️ par Saez' });
        return await interaction.reply({ embeds: [embed] });
      }
    }
    if (interaction.isStringSelectMenu()) {
      const { customId, values } = interaction;
      if (customId.startsWith('creativite_select_')) {
        const { handleCreativiteSelect } = await import('../services/creativiteInteractionHandler.js');
        return await handleCreativiteSelect(interaction);
      }
      if (customId === 'support_hub_select') {
        const selected = values[0];
        const {
          buildFaqSelectMenu,
          runSaezDiagnostic,
          createBugModal,
          createContactStaffModal,
        } = await import('../services/supportService.js');
        if (selected === 'faq_menu') {
          const embed = new EmbedBuilder()
            .setTitle('❓ Foire Aux Questions (FAQ) — Saez Animes')
            .setDescription('Sélectionnez une question ci-dessous pour afficher immédiatement la solution :')
            .setColor(config.colors.primary)
            .setFooter({ text: 'Codé avec ❤️ par Saez' });
          const menu = buildFaqSelectMenu();
          return await interaction.reply({
            embeds: [embed],
            components: [menu],
            flags: MessageFlags.Ephemeral,
          });
        }
        if (selected === 'run_diag') {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          const embed = await runSaezDiagnostic(interaction.client);
          return await interaction.editReply({ embeds: [embed] });
        }
        if (selected === 'report_bug') {
          const modal = createBugModal();
          return await interaction.showModal(modal);
        }
        if (selected === 'go_suggestions') {
          return await interaction.reply({
            content:
              '💡 **Boîte à suggestions Saez Animes :**\n' +
              'Vous avez une idée de fonctionnalité ou un animé à proposer ? Utilisez la commande `/suggestion` ou rendez-vous sur le salon dédié pour ouvrir un sondage officiel synchronisé avec le logiciel ! ✨',
            flags: MessageFlags.Ephemeral,
          });
        }
        if (selected === 'contact_staff') {
          const modal = createContactStaffModal();
          return await interaction.showModal(modal);
        }
      }
      if (customId === 'faq_question_select') {
        const questionId = values[0];
        const { SAEZ_FAQ, buildFaqEmbed } = await import('../services/supportService.js');
        const item = SAEZ_FAQ.find((f) => f.id === questionId);
        if (!item) {
          return await interaction.reply({
            content: '❌ Question introuvable dans la base de connaissances.',
            flags: MessageFlags.Ephemeral,
          });
        }
        return await interaction.reply({
          embeds: [buildFaqEmbed(item)],
          flags: MessageFlags.Ephemeral,
        });
      }
    }
    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('modal_confession_')) {
        const { handleCommunityModal } = await import('../services/communityInteractionHandler.js');
        return await handleCommunityModal(interaction);
      }
      if (interaction.customId.startsWith('modal_ticket_')) {
        const type = interaction.customId.replace('modal_ticket_', '');
        const subject = interaction.fields.getTextInputValue('ticket_subject');
        const desc = interaction.fields.getTextInputValue('ticket_desc');
        const fullReason = `${subject}\n${desc}`;
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        try {
          const { channel: ticketChannel } = await createTicketChannel(
            interaction.guild,
            interaction.user,
            fullReason,
            type
          );
          await interaction.editReply({
            content: `✅ Votre ticket a été créé avec succès : ${ticketChannel} !`,
          });
        } catch (err) {
          console.error('[TicketModal] Erreur création ticket:', err);
          await interaction.editReply({
            content: `❌ Impossible d'ouvrir le ticket : ${err.message}`,
          });
        }
      }
      if (interaction.customId.startsWith('modal_sugg_submit_')) {
        const catKey = interaction.customId.replace('modal_sugg_submit_', '');
        const title = interaction.fields.getTextInputValue('sugg_title');
        const desc = interaction.fields.getTextInputValue('sugg_desc');
        const link = interaction.fields.getTextInputValue('sugg_link')?.trim();
        const fullDesc = link ? `${desc}\n\n🔗 **Référence :** ${link}` : desc;
        let language = 'VOSTFR & VF';
        try {
          const l = interaction.fields.getTextInputValue('sugg_lang')?.trim();
          if (l) language = l;
        } catch {}
        let imageUrl = null;
        try {
          const img = interaction.fields.getTextInputValue('sugg_image')?.trim();
          if (img) imageUrl = img;
        } catch {}
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        try {
          const { createSuggestion, SUGGESTION_CATEGORIES } = await import(`../services/suggestionService.js?v=${Date.now()}`);
          const sugg = await createSuggestion({
            title,
            description: fullDesc,
            category: catKey === 'discord' ? 'improvement' : catKey,
            language,
            imageUrl,
            author: {
              id: interaction.user.id,
              username: interaction.user.username,
              avatar: interaction.user.displayAvatarURL({ dynamic: true }),
              source: 'discord',
            },
            guildId: interaction.guildId,
            client: interaction.client,
          });
          const channelMention = sugg.channel_id ? `<#${sugg.channel_id}>` : 'le salon des suggestions';
          await interaction.editReply({
            content: `🎉 **Votre demande #${sugg.sugg_id} a été publiée avec succès dans ${channelMention} !**\n\n` +
              `• 💡 **Titre :** ${sugg.title}\n` +
              `• 🏷️ **Catégorie :** ${SUGGESTION_CATEGORIES[sugg.category]?.label || sugg.category}\n` +
              `• 🔄 **Synchronisation :** Votre demande est maintenant visible en direct dans le logiciel **Saez Animes** !`,
          });
        } catch (err) {
          console.error('[SuggModal] Erreur création suggestion:', err);
          await interaction.editReply({
            content: `❌ Une erreur est survenue lors de l'enregistrement de votre demande : ${err.message}`,
          });
        }
      }
      if (interaction.customId === 'modal_bug_report') {
        const title = interaction.fields.getTextInputValue('bug_title');
        const anime = interaction.fields.getTextInputValue('bug_anime')?.trim() || null;
        const description = interaction.fields.getTextInputValue('bug_desc');
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        try {
          const { createBugReport } = await import('../services/supportService.js');
          const bug = await createBugReport({
            title,
            category: anime ? 'episode' : 'player',
            anime,
            description,
            system: 'Windows 11',
            user: interaction.user,
            guild: interaction.guild,
            client: interaction.client,
          });
          return await interaction.editReply({
            content:
              `✅ **Rapport d'anomalie #${bug.bug_id} enregistré avec succès !**\n\n` +
              `• 🐛 **Titre :** ${bug.title}\n` +
              (anime ? `• 🎌 **Animé :** ${anime}\n` : '') +
              `• 📌 **Statut :** 🔴 Transmis directement à l'équipe technique Saez.\n\n` +
              `Merci pour votre retour précieux pour l'amélioration de **Saez Animes** ! 🛡️`,
          });
        } catch (err) {
          console.error('[BugModal] Erreur soumission bug:', err);
          return await interaction.editReply({
            content: `❌ Impossible d'enregistrer le bug : ${err.message}`,
          });
        }
      }
      if (interaction.customId === 'modal_contact_staff') {
        const message = interaction.fields.getTextInputValue('contact_message');
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        try {
          const { sendLog } = await import('../services/logService.js');
          const alertEmbed = new EmbedBuilder()
            .setTitle('🚨 Alerte Support Membre (Hub Interactif)')
            .setDescription(`**${interaction.user}** sollicite l'assistance d'un helper :\n\n> *« ${message} »*`)
            .setColor(0xf59e0b)
            .addFields(
              { name: '👤 Demandeur', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
              { name: '📍 Salon', value: `<#${interaction.channelId}>`, inline: true }
            )
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: 'Codé avec ❤️ par Saez' });
          await sendLog(interaction.guild, 'serveur', alertEmbed).catch(() => {});
          return await interaction.editReply({
            content:
              `✅ **Votre message a été transmis directement aux helpers et au staff !**\n` +
              `Un membre de l'équipe prendra contact avec vous dès que possible.`,
          });
        } catch (err) {
          console.error('[ContactModal] Erreur transmission alerte:', err);
          return await interaction.editReply({
            content: `❌ Impossible de transmettre le message : ${err.message}`,
          });
        }
      }
      if (interaction.customId.startsWith('modal_tempvoice_rename_')) {
        const channelId = interaction.customId.replace('modal_tempvoice_rename_', '');
        const newName = interaction.fields.getTextInputValue('new_name').trim();
        const voiceChannel = interaction.guild?.channels.cache.get(channelId);
        if (!voiceChannel) {
          return await interaction.reply({ content: '❌ Ce salon vocal n\'existe plus.', flags: MessageFlags.Ephemeral });
        }
        const { setTempChannelName } = await import('../services/tempVoiceService.js');
        await setTempChannelName(voiceChannel, newName, interaction.user.id);
        return await interaction.reply({
          content: `✅ Votre salon vocal a été renommé en **${newName}** !`,
          flags: MessageFlags.Ephemeral,
        });
      }
      if (interaction.customId.startsWith('modal_tempvoice_limit_')) {
        const channelId = interaction.customId.replace('modal_tempvoice_limit_', '');
        const rawLimit = interaction.fields.getTextInputValue('new_limit').trim();
        const numLimit = parseInt(rawLimit, 10);
        const voiceChannel = interaction.guild?.channels.cache.get(channelId);
        if (!voiceChannel) {
          return await interaction.reply({ content: '❌ Ce salon vocal n\'existe plus.', flags: MessageFlags.Ephemeral });
        }
        const { setTempChannelLimit } = await import('../services/tempVoiceService.js');
        await setTempChannelLimit(voiceChannel, isNaN(numLimit) ? 0 : numLimit, interaction.user.id);
        return await interaction.reply({
          content: isNaN(numLimit) || numLimit === 0
            ? '✅ La limite de participants a été supprimée (illimité) !'
            : `✅ La limite a été fixée à **${numLimit} participants** !`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
