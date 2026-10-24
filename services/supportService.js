import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  ChannelType,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { getDb } from '../database/mongo.js';
import { config } from '../config.js';
import { sendLog } from './logService.js';
export const SAEZ_FAQ = [
  {
    id: 'install_update',
    category: 'Application & Installation',
    emoji: '📥',
    question: 'Comment installer ou mettre à jour l\'application Saez ?',
    answer:
      'Pour installer ou mettre à jour **Saez Animes** :\n' +
      '1. Téléchargez la dernière version officielle (`Saez_Setup.exe` ou `.msi`) depuis les annonces Discord ou notre canal de release.\n' +
      '2. Exécutez l\'installateur. Si Windows Defender affiche un filtre SmartScreen, cliquez sur **« Informations complémentaires »** puis **« Exécuter quand même »**.\n' +
      '3. Lors d\'une mise à jour, l\'application télécharge les fichiers et remplace automatiquement les composants sans supprimer vos favoris ni votre historique.',
    tips: 'Conseil : Vos favoris et réglages sont conservés dans votre base SQLite locale et synchronisés avec MongoDB Atlas.',
  },
  {
    id: 'black_screen_player',
    category: 'Lecteur Vidéo & Streaming',
    emoji: '📺',
    question: 'Que faire en cas d\'écran noir ou de chargement infini sur un épisode ?',
    answer:
      'Si une vidéo refuse de se lancer ou reste bloquée :\n' +
      '1. **Changer de lecteur :** Dans la page de l\'épisode, utilisez le menu des lecteurs pour basculer sur un lecteur alternatif (Lecteur 1, Lecteur 2, Backup).\n' +
      '2. **Désactiver l\'accélération matérielle :** Rendez-vous dans les Paramètres Saez et essayez de basculer l\'option d\'accélération matérielle.\n' +
      '3. **Vider le cache temporaire :** Utilisez l\'outil intégré **Nettoyage Stockage C:** ou redémarrez l\'application pour purger les fichiers de pré-chargement.',
    tips: 'Si le problème persiste sur un épisode précis, utilisez `/bug` ou le bouton Signaler pour que notre équipe répare le lien.',
  },
  {
    id: 'discord_rpc',
    category: 'Discord Rich Presence',
    emoji: '🎮',
    question: 'Comment afficher mon animé en cours sur mon profil Discord (Rich Presence) ?',
    answer:
      'Saez Animes intègre un module Discord RPC automatique en direct :\n' +
      '1. Assurez-vous que Discord est ouvert sur votre PC.\n' +
      '2. Dans Discord, allez dans **Paramètres utilisateur > Confidentialité de l\'activité** et cochez **« Afficher l\'activité actuelle en tant que message de statut »**.\n' +
      '3. Lancez un animé sur Saez : votre profil affichera l\'animé, le titre de l\'épisode, la saison et le temps restant !',
    tips: 'Le module RPC Saez fonctionne en natif via le pont IPC de Discord sans nécessiter de configuration compliquée.',
  },
  {
    id: 'subtitles_audio',
    category: 'Langues & Sous-titres',
    emoji: '🎌',
    question: 'Comment basculer entre VF et VOSTFR ou ajuster les sous-titres ?',
    answer:
      'Chaque fiche d\'animé propose des saisons ou pistes distinctes :\n' +
      '• Cliquez sur le sélecteur **Langue (VOSTFR / VF)** en haut de la liste des épisodes.\n' +
      '• Dans le lecteur, le menu des réglages (icône engrenage) permet d\'ajuster la taille des sous-titres, la police et le décalage audio si nécessaire.',
    tips: 'Certains animes anciens ne possèdent pas de doublage français officiel et ne sont disponibles qu\'en VOSTFR.',
  },
  {
    id: 'premium_vip',
    category: 'Abonnement & VIP',
    emoji: '👑',
    question: 'Quels sont les avantages du statut VIP Premium et comment l\'obtenir ?',
    answer:
      'Le statut **Saez VIP Premium** débloque des fonctionnalités exclusives :\n' +
      '• 🚀 Débit de streaming prioritaire et débridé.\n' +
      '• 📥 Téléchargement haute vitesse pour visionnage hors-ligne.\n' +
      '• 🎨 Badges de profil exclusifs, thèmes cyberpunk et multi-profils.\n' +
      '• ⭐ Rôle VIP dédié sur le serveur Discord avec salon privé.',
    tips: 'Vous pouvez l\'obtenir via notre boutique intégrée ou en participant aux concours Discord réguliers (`/giveaway`) !',
  },
  {
    id: 'karaoke_games',
    category: 'Karaoké & Mini-Jeux',
    emoji: '🎤',
    question: 'Comment fonctionne l\'espace Karaoké Live et les mini-jeux ?',
    answer:
      'Saez Animes propose un espace détente intégré :\n' +
      '• **Karaoké Live :** Chantez sur les Openings/Endings avec synchronisation des paroles en temps réel (Romaji, Japonais, Traduction).\n' +
      '• **Piano Tiles & Jeux :** Gagnez de l\'XP et des pièces pour grimper dans le classement mondial (`/leaderboard`).\n' +
      '• **Cartes d\'Animés :** Collectionnez des cartes rares à chaque épisode regardé !',
    tips: 'Votre niveau et votre XP sont consultables en jeu et via la commande `/profil`.',
  },
  {
    id: 'storage_cleaner',
    category: 'Stockage & Cache',
    emoji: '🧹',
    question: 'Comment nettoyer le cache et libérer de l\'espace disque ?',
    answer:
      'Dans le menu latéral de Saez, cliquez sur **« Nettoyage Stockage C: »**.\n' +
      'L\'application analyse en toute sécurité les fichiers temporaires de visionnage, les vignettes obsolètes et le cache de streaming pour libérer plusieurs gigaoctets en 1 clic.',
    tips: 'Ce nettoyage ne touche jamais à vos épisodes téléchargés manuellement ni à votre historique.',
  },
  {
    id: 'cloud_sync',
    category: 'Sauvegarde Cloud & Multi-PC',
    emoji: '☁️',
    question: 'Mes données sont-elles synchronisées si je change d\'ordinateur ?',
    answer:
      'Oui ! Dès que vous êtes connecté à votre compte Saez, vos favoris, votre progression de visionnage et vos statistiques sont synchronisés en temps réel sur **MongoDB Atlas Cloud**.\n' +
      'Il vous suffit de vous reconnecter sur votre second PC pour tout retrouver instantanément.',
    tips: 'Les administrateurs peuvent également synchroniser l\'intégralité du catalogue depuis l\'onglet Administration.',
  },
];
export function buildSupportHubEmbed() {
  return new EmbedBuilder()
    .setTitle('🛡️ Centre d\'Assistance & Support Officiel — Saez Animes')
    .setDescription(
      'Bienvenue dans le centre d\'assistance de **Saez Animes** ! 🎉\n\n' +
      'Nous mettons à votre disposition plusieurs outils pour résoudre rapidement vos problèmes ou contacter notre équipe technique.\n\n' +
      '**Accès rapide aux services d\'aide :**\n' +
      '• ❓ **Base de Connaissances (FAQ) :** Réponses instantanées 24/7 aux questions courantes.\n' +
      '• 🔍 **Diagnostic Système :** Vérification de l\'état des serveurs et flux en direct.\n' +
      '• 🐛 **Signalement de Bug :** Déclarer un épisode manquant ou un problème de lecteur.\n' +
      '• 🎫 **Tickets d\'Assistance :** Discussion privée avec l\'équipe technique.\n' +
      '• 💡 **Boîte à Idées :** Demander un animé ou une amélioration (`/suggestion`).\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      '👉 *Sélectionnez une option dans le menu ci-dessous ou cliquez sur un bouton pour démarrer.*'
    )
    .setColor(config.colors.primary)
    .setThumbnail(config.assets.logoUrl)
    .setImage(config.assets.bannerUrl)
    .setFooter({
      text: 'Codé avec ❤️ par Saez | Saez Animes Support • Assistance 7j/7',
      iconURL: config.assets.logoUrl,
    })
    .setTimestamp();
}
export function buildSupportHubComponents() {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('support_hub_select')
    .setPlaceholder('Sélectionnez un sujet d\'assistance...')
    .addOptions([
      {
        label: 'Consulter la FAQ Interactive',
        description: 'Solutions instantanées : écran noir, RPC, installation, VIP...',
        value: 'faq_menu',
        emoji: '❓',
      },
      {
        label: 'Lancer un Diagnostic Système',
        description: 'Vérifier l\'état des serveurs, MongoDB, flux vidéo et du Bot',
        value: 'run_diag',
        emoji: '🔍',
      },
      {
        label: 'Signaler un Bug ou Épisode',
        description: 'Ouvrir le formulaire de rapport technique détaillé',
        value: 'report_bug',
        emoji: '🐛',
      },
      {
        label: 'Proposer un Animé ou une Idée',
        description: 'Boîte à suggestions synchronisée avec le logiciel Saez',
        value: 'go_suggestions',
        emoji: '💡',
      },
      {
        label: 'Contacter un Helper / Staff',
        description: 'Demander l\'intervention d\'un membre de l\'équipe disponible',
        value: 'contact_staff',
        emoji: '🙋',
      },
    ]);
  const menuRow = new ActionRowBuilder().addComponents(selectMenu);
  const buttonsRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('support_btn_faq')
      .setLabel('FAQ Rapide')
      .setEmoji('❓')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('support_btn_diag')
      .setLabel('Diagnostic')
      .setEmoji('🔍')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('support_btn_bug')
      .setLabel('Signaler un Bug')
      .setEmoji('🐛')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_open_ticket_support')
      .setLabel('Ouvrir un Ticket')
      .setEmoji('🎫')
      .setStyle(ButtonStyle.Success)
  );
  return [menuRow, buttonsRow];
}
export function buildFaqSelectMenu() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('faq_question_select')
    .setPlaceholder('Choisissez une question dans la FAQ...')
    .addOptions(
      SAEZ_FAQ.map((item) => ({
        label: item.question.slice(0, 100),
        description: item.category,
        value: item.id,
        emoji: item.emoji,
      }))
    );
  return new ActionRowBuilder().addComponents(menu);
}
export function buildFaqEmbed(faqItem) {
  return new EmbedBuilder()
    .setTitle(`${faqItem.emoji} ${faqItem.question}`)
    .setDescription(
      `**Catégorie :** \`${faqItem.category}\`\n\n` +
      `${faqItem.answer}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💡 *${faqItem.tips}*`
    )
    .setColor(config.colors.primary)
    .setThumbnail(config.assets.logoUrl)
    .setFooter({
      text: 'Codé avec ❤️ par Saez | Saez FAQ • Vous avez encore une question ? Ouvrez un ticket !',
      iconURL: config.assets.logoUrl,
    });
}
export async function runSaezDiagnostic(client) {
  const startTime = Date.now();
  let mongoStatus = { ok: false, pingMs: 0, error: null };
  let db = null;
  try {
    const mongoStart = Date.now();
    db = getDb();
    await db.command({ ping: 1 });
    mongoStatus = { ok: true, pingMs: Date.now() - mongoStart, error: null };
  } catch (err) {
    mongoStatus = { ok: false, pingMs: 0, error: err.message };
  }
  const wsPing = Math.round(client.ws.ping);
  let totalAnimes = 0;
  let totalTicketsOpen = 0;
  let totalSuggestions = 0;
  let onlineUsers = 0;
  if (db) {
    try {
      totalAnimes = await db.collection('catalogue').countDocuments().catch(() => 0);
      totalTicketsOpen = await db.collection('tickets').countDocuments({ status: 'open' }).catch(() => 0);
      totalSuggestions = await db.collection('suggestions').countDocuments().catch(() => 0);
      const socialDoc = await db.collection('social_hub').findOne({ _id: 'main_social_data' }).catch(() => null);
      if (socialDoc?.data?.presences) {
        const now = Date.now();
        onlineUsers = Object.values(socialDoc.data.presences).filter(
          (p) => p && p.status !== 'offline' && now - (p.lastSeen || 0) < 90 * 1000
        ).length;
      }
    } catch {}
  }
  const memoryUsageMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
  const uptimeHours = (process.uptime() / 3600).toFixed(1);
  const isAllGood = mongoStatus.ok && wsPing < 150;
  const statusColor = isAllGood ? config.colors.success : mongoStatus.ok ? config.colors.warning : 0xef4444;
  const embed = new EmbedBuilder()
    .setTitle('🔍 Diagnostic Système en Direct — Saez Animes')
    .setDescription(
      isAllGood
        ? '✅ **Tous les services Saez Animes fonctionnent de manière optimale !**'
        : '⚠️ **Des perturbations ou latences sont actuellement détectées sur certains services.**'
    )
    .setColor(statusColor)
    .setThumbnail(config.assets.logoUrl)
    .addFields(
      {
        name: '☁️ MongoDB Atlas Cloud',
        value: mongoStatus.ok
          ? `🟢 En ligne (\`${mongoStatus.pingMs} ms\`)\n*Base : \`${config.mongoDbName}\`*`
          : `🔴 Déconnecté (\`${mongoStatus.error}\`)`,
        inline: true,
      },
      {
        name: '🤖 Bot & Passerelle Discord',
        value: `🟢 Connecté (\`${wsPing} ms\`)\n*Uptime : \`${uptimeHours} h\`*`,
        inline: true,
      },
      {
        name: '💻 Mémoire Processus',
        value: `🟢 RAM : \`${memoryUsageMB} MB\`\n*Node : \`${process.version}\`*`,
        inline: true,
      },
      {
        name: '🎌 Catalogue d\'Animés',
        value: `📚 \`${totalAnimes}\` animés synchronisés\n*Streaming actif*`,
        inline: true,
      },
      {
        name: '👥 Sessions Logiciel Actives',
        value: `🟢 \`${Math.max(1, onlineUsers)}\` utilisateur(s) en ligne\n*Sur Saez Animes*`,
        inline: true,
      },
      {
        name: '🎫 Support & Tickets',
        value: `📂 \`${totalTicketsOpen}\` ticket(s) ouvert(s)\n💡 \`${totalSuggestions}\` suggestion(s)`,
        inline: true,
      }
    )
    .setFooter({
      text: `Codé avec ❤️ par Saez | Diagnostic effectué en ${Date.now() - startTime} ms • Saez Health Check`,
      iconURL: config.assets.logoUrl,
    })
    .setTimestamp();
  return embed;
}
export async function createBugReport({
  title,
  category = 'player',
  anime = null,
  description,
  system = 'Windows 11',
  user,
  guild,
  client,
}) {
  const db = getDb();
  const col = db.collection('bug_reports');
  const count = await col.countDocuments();
  const bugId = `BUG-${count + 1}`;
  const bugDoc = {
    bug_id: bugId,
    title: title.trim(),
    category,
    anime: anime ? anime.trim() : null,
    description: description.trim(),
    system,
    status: 'open', 
    user_id: user.id,
    user_tag: user.tag || user.username,
    user_avatar: user.displayAvatarURL ? user.displayAvatarURL({ dynamic: true }) : config.assets.logoUrl,
    staff_note: null,
    resolved_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };
  await col.insertOne(bugDoc);
  const embed = new EmbedBuilder()
    .setTitle(`🐛 Rapport de Bug #${bugId} : ${title}`)
    .setDescription(`**Description du problème :**\n${description}`)
    .setColor(0xef4444)
    .addFields(
      { name: '🏷️ Type', value: `\`${category}\``, inline: true },
      { name: '💻 Système OS', value: `\`${system}\``, inline: true },
      { name: '👤 Signalé par', value: `${user} (\`${user.tag || user.username}\`)`, inline: true },
      { name: '📌 Statut', value: '🔴 Ouvert (En attente d\'analyse)', inline: true }
    )
    .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Bug Tracker • Transmission immédiate aux développeurs' })
    .setTimestamp();
  if (anime) {
    embed.addFields({ name: '🎌 Animé concerné', value: `**${anime}**`, inline: true });
  }
  if (guild) {
    await sendLog(guild, 'serveur', embed).catch(() => {});
  }
  return bugDoc;
}
export async function generateTicketTranscript(channel) {
  try {
    const messages = await channel.messages.fetch({ limit: 100 });
    const sorted = Array.from(messages.values()).reverse();
    let textContent = `========================================================================\n`;
    textContent += `TRANSCRIPT OFFICIEL DU TICKET : #${channel.name}\n`;
    textContent += `Salon ID : ${channel.id}\n`;
    textContent += `Date d'export : ${new Date().toLocaleString('fr-FR')}\n`;
    textContent += `Total des messages : ${sorted.length}\n`;
    textContent += `========================================================================\n\n`;
    for (const msg of sorted) {
      const timeStr = new Date(msg.createdTimestamp).toLocaleTimeString('fr-FR');
      const authorStr = msg.author ? `${msg.author.tag} (${msg.author.id})` : 'Inconnu';
      textContent += `[${timeStr}] ${authorStr} :\n`;
      if (msg.content) {
        textContent += `  ${msg.content.replace(/\n/g, '\n  ')}\n`;
      }
      if (msg.attachments.size > 0) {
        for (const att of msg.attachments.values()) {
          textContent += `  [PIÈCE JOINTE] : ${att.url}\n`;
        }
      }
      if (msg.embeds.length > 0) {
        for (const emb of msg.embeds) {
          textContent += `  [EMBED] : ${emb.title || ''} - ${emb.description || ''}\n`;
        }
      }
      textContent += `\n`;
    }
    const buffer = Buffer.from(textContent, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: `transcript-${channel.name}.txt` });
    return { success: true, attachment, messageCount: sorted.length };
  } catch (err) {
    console.error('[Transcript] Erreur génération transcript:', err);
    return { success: false, error: err.message };
  }
}
export function createBugModal() {
  const modal = new ModalBuilder()
    .setCustomId('modal_bug_report')
    .setTitle('🐛 Signalement de Bug');
  const titleInput = new TextInputBuilder()
    .setCustomId('bug_title')
    .setLabel('Titre du problème')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ex: Écran noir sur l\'épisode 12 de Demon Slayer')
    .setMinLength(5)
    .setMaxLength(100)
    .setRequired(true);
  const animeInput = new TextInputBuilder()
    .setCustomId('bug_anime')
    .setLabel('Animé concerné (facultatif)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ex: Bleach, Demon Slayer, One Piece...')
    .setMaxLength(100)
    .setRequired(false);
  const descInput = new TextInputBuilder()
    .setCustomId('bug_desc')
    .setLabel('Détails et étapes pour reproduire')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Expliquez ce qui s\'affiche, le lecteur sélectionné, etc.')
    .setMinLength(10)
    .setMaxLength(1000)
    .setRequired(true);
  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(animeInput),
    new ActionRowBuilder().addComponents(descInput)
  );
  return modal;
}
export function createContactStaffModal() {
  const modal = new ModalBuilder()
    .setCustomId('modal_contact_staff')
    .setTitle('🙋 Contacter l\'Équipe Support');
  const msgInput = new TextInputBuilder()
    .setCustomId('contact_message')
    .setLabel('Votre message pour le Support')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Expliquez en détail votre demande ou votre souci...')
    .setMinLength(10)
    .setMaxLength(1000)
    .setRequired(true);
  modal.addComponents(new ActionRowBuilder().addComponents(msgInput));
  return modal;
}
