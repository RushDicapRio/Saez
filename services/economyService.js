import { getDb } from '../database/mongo.js';
export const SHOP_ITEMS = [
  { id: 'role_otaku', name: 'Rôle Otaku Confirmé', price: 200, category: 'roles', desc: 'Badge et rôle exclusif pour les passionnés d\'animation.' },
  { id: 'role_chunin', name: 'Rôle Ninja Chûnin', price: 450, category: 'roles', desc: 'Titre d\'honneur ninja avec accès au salon stratégique.' },
  { id: 'role_super_saiyan', name: 'Rôle Super Saiyan', price: 1000, category: 'roles', desc: 'Aura dorée scintillante sur votre profil de serveur.' },
  { id: 'role_hashira', name: 'Rôle Pilier Pourfendeur', price: 1500, category: 'roles', desc: 'Le grade suprême des pourfendeurs de démons.' },
  { id: 'role_hunter', name: 'Licence Hunter Élite', price: 2200, category: 'roles', desc: 'Licence officielle donnant accès aux salons VIP.' },
  { id: 'role_hokage', name: 'Titre d\'Hokage Suprême', price: 5000, category: 'roles', desc: 'Rôle légendaire réservé aux grands protecteurs du serveur.' },
  { id: 'role_yonko', name: 'Titre d\'Empereur des Mers', price: 6000, category: 'roles', desc: 'Commandez votre propre flotte sur Saez Animes.' },
  { id: 'role_shinigami', name: 'Rôle Shinigami Remplaçant', price: 1200, category: 'roles', desc: 'Pourfendez les creux dans les salons communautaires.' },
  { id: 'role_alchimiste', name: 'Titre d\'Alchimiste d\'État', price: 1800, category: 'roles', desc: 'La montre d\'argent officielle des alchimistes.' },
  { id: 'role_monarque', name: 'Rôle Monarque des Ombres', price: 7500, category: 'roles', desc: '« Lève-toi ! » — Rôle sombre et prestigieux.' },
  { id: 'role_ghoul', name: 'Rôle Goule Borgne', price: 2800, category: 'roles', desc: 'Masque exclusif et accès aux salons nocturnes.' },
  { id: 'role_stand', name: 'Éveilleur de Stand', price: 3200, category: 'roles', desc: 'Invoquez votre Stand dans les parties de jeux.' },
  { id: 'role_jujutsu', name: 'Exorciste Classe Spéciale', price: 4000, category: 'roles', desc: 'Dominez l\'énergie occulte sur le serveur.' },
  { id: 'role_pirate_king', name: 'Roi des Pirates', price: 10000, category: 'roles', desc: 'Le trophée ultime et le rôle le plus convoité.' },
  { id: 'role_esper', name: 'Esper Niveau 5', price: 3500, category: 'roles', desc: 'Contrôlez les ondes radio du lecteur vocal.' },
  { id: 'badge_ramen', name: 'Badge Bol de Ramen Ichiraku', price: 150, category: 'badges', desc: 'Un délicieux bol chaud affiché sur votre profil.' },
  { id: 'badge_kunai', name: 'Badge Kunaï Éclair Jaune', price: 250, category: 'badges', desc: 'Téléportez votre style au sommet.' },
  { id: 'badge_dragon_ball', name: 'Badge Boule à 4 Étoiles', price: 500, category: 'badges', desc: 'La précieuse relique de grand-père Son Gohan.' },
  { id: 'badge_chapeau_paille', name: 'Badge Chapeau de Paille', price: 800, category: 'badges', desc: 'Le symbole universel de la liberté et de l\'aventure.' },
  { id: 'badge_sharingan', name: 'Badge Sharingan 3 Tomoes', price: 1100, category: 'badges', desc: 'Percez à jour toutes les techniques secrètes.' },
  { id: 'badge_death_note', name: 'Badge Plume de Shinigami', price: 950, category: 'badges', desc: 'L\'instrument suprême du jugement.' },
  { id: 'badge_scouter', name: 'Badge Détecteur Scouter', price: 650, category: 'badges', desc: '« Sa puissance de streaming dépasse 9000 ! »' },
  { id: 'badge_geass', name: 'Badge Symbole du Geass', price: 1300, category: 'badges', desc: 'Le pouvoir de commander aux rois.' },
  { id: 'badge_bataillon', name: 'Badge Ailes de la Liberté', price: 1400, category: 'badges', desc: 'Pour l\'humanité ! Portez les ailes du bataillon d\'exploration.' },
  { id: 'badge_doigt_sukuna', name: 'Badge Relique Maudite', price: 2000, category: 'badges', desc: 'Une énergie sombre émane de votre fiche de membre.' },
  { id: 'badge_carte_greed', name: 'Badge Carte Greed Island', price: 1750, category: 'badges', desc: 'Carte collector SS-01 Souffle du Grand Ange.' },
  { id: 'badge_grimoire', name: 'Badge Trèfle à 5 Feuilles', price: 1600, category: 'badges', desc: 'Le démon réside dans la cinquième feuille.' },
  { id: 'badge_potion', name: 'Badge Potion de Mana', price: 300, category: 'badges', desc: 'Restaure 100% de concentration avant une nuit blanche.' },
  { id: 'badge_neon', name: 'Badge Logo Saez Cyberpunk', price: 3000, category: 'badges', desc: 'Hologramme cyan néon certifié Saez Animes.' },
  { id: 'badge_vip_diamond', name: 'Badge Diamant Éternel', price: 5000, category: 'badges', desc: 'Le badge suprême pour les bienfaiteurs du serveur.' },
  { id: 'item_xp_boost_24h', name: 'Booster d\'XP x2 (24h)', price: 600, category: 'boosters', desc: 'Double vos gains d\'XP textuel et vocal pendant 24 heures.' },
  { id: 'item_xp_boost_7d', name: 'Méga Booster d\'XP x2 (7j)', price: 2500, category: 'boosters', desc: 'Double vos gains d\'XP pendant une semaine entière.' },
  { id: 'item_ticket_loto', name: 'Ticket de Loterie Saez', price: 100, category: 'consommables', desc: 'Tentez de remporter le jackpot hebdomadaire de pièces.' },
  { id: 'item_color_pass', name: 'Passe Couleur Personnalisée', price: 1500, category: 'custom', desc: 'Permet de changer la couleur de son pseudo dans le chat.' },
  { id: 'item_voice_vip', name: 'Passe Salon Vocal Illimité', price: 2000, category: 'custom', desc: 'Débloque les salons vocaux permanents avec débit 384 kbps.' },
  { id: 'item_rename_tag', name: 'Ticket Renommage de Salon', price: 350, category: 'custom', desc: 'Personnalise le nom d\'un salon temporaire à volonté.' },
  { id: 'item_box_mystere', name: 'Boîte Mystère Légendaire', price: 1200, category: 'consommables', desc: 'Ouvre un coffre avec chance d\'obtenir un item ultra rare.' },
  { id: 'item_shield_warn', name: 'Bouclier Anti-Avertissement', price: 3000, category: 'protection', desc: 'Absorbe automatiquement un avertissement de modération mineur.' },
  { id: 'item_spotlight', name: 'Mise en Avant Message (24h)', price: 800, category: 'visibilité', desc: 'Épingle votre annonce anime dans le salon communautaire.' },
  { id: 'item_karaoke_priority', name: 'Pass Prioritaire Karaoké', price: 500, category: 'musique', desc: 'Passe en tête de file pour chanter en vocal.' },
  { id: 'cosm_aura_flamme', name: 'Aura Flamme Ardente', price: 900, category: 'auras', desc: 'Effet de flamme personnalisé sur votre carte de niveau.' },
  { id: 'cosm_aura_glace', name: 'Aura Zéro Absolu', price: 900, category: 'auras', desc: 'Flocons de cristal givrés autour de votre avatar.' },
  { id: 'cosm_aura_eclair', name: 'Aura Éclair Chidori', price: 1100, category: 'auras', desc: 'Arcs électriques entourant votre carte de profil.' },
  { id: 'cosm_banner_tokyo', name: 'Bannière Néo-Tokyo Nuit', price: 750, category: 'bannieres', desc: 'Fond cyberpunk exclusif pour votre profil de membre.' },
  { id: 'cosm_banner_sakura', name: 'Bannière Jardin de Sakura', price: 750, category: 'bannieres', desc: 'Pétales de cerisiers tombant doucement sur votre fiche.' },
  { id: 'cosm_banner_galaxy', name: 'Bannière Nébuleuse Cosmique', price: 850, category: 'bannieres', desc: 'Vue spatiale profonde aux teintes violettes et cyan.' },
  { id: 'cosm_title_senpai', name: 'Titre Flottant : Senpai', price: 400, category: 'titres', desc: 'Affiche « Senpai » sous votre nom de profil.' },
  { id: 'cosm_title_sensei', name: 'Titre Flottant : Sensei', price: 650, category: 'titres', desc: 'Le respect des élèves anime vous est acquis.' },
  { id: 'cosm_title_otaku_god', name: 'Titre Flottant : Dieu Anime', price: 4500, category: 'titres', desc: 'Pour ceux ayant regardé plus de 500 séries.' },
  { id: 'cosm_medaille_fondateur', name: 'Médaille d\'Honneur Saez', price: 8000, category: 'titres', desc: 'La distinction honorifique suprême de la communauté.' },
];
const localEconomyCache = new Map();
export async function getUserEconomy(guildId, userId) {
  const key = `${guildId}:${userId}`;
  try {
    const db = getDb();
    if (db) {
      const col = db.collection('bot_economy');
      const doc = await col.findOne({ guild_id: guildId, user_id: userId });
      if (doc) {
        localEconomyCache.set(key, doc);
        return doc;
      }
    }
  } catch (err) {}
  if (localEconomyCache.has(key)) {
    return localEconomyCache.get(key);
  }
  const defaultWallet = {
    guild_id: guildId,
    user_id: userId,
    balance: 100, 
    bank: 0,
    inventory: [],
    last_daily: 0,
    last_weekly: 0,
    created_at: new Date(),
    updated_at: new Date(),
  };
  localEconomyCache.set(key, defaultWallet);
  return defaultWallet;
}
export async function saveUserEconomy(wallet) {
  const key = `${wallet.guild_id}:${wallet.user_id}`;
  wallet.updated_at = new Date();
  localEconomyCache.set(key, wallet);
  try {
    const db = getDb();
    if (db) {
      const col = db.collection('bot_economy');
      await col.updateOne(
        { guild_id: wallet.guild_id, user_id: wallet.user_id },
        { $set: wallet },
        { upsert: true }
      );
    }
  } catch (err) {}
}
export async function adjustBalance(guildId, userId, amount) {
  const wallet = await getUserEconomy(guildId, userId);
  wallet.balance = Math.max(0, (wallet.balance || 0) + amount);
  await saveUserEconomy(wallet);
  return wallet.balance;
}
export async function claimDaily(guildId, userId) {
  const wallet = await getUserEconomy(guildId, userId);
  const now = Date.now();
  const cooldown = 24 * 60 * 60 * 1000; 
  if (wallet.last_daily && now - wallet.last_daily < cooldown) {
    const remainingMs = cooldown - (now - wallet.last_daily);
    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    const mins = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
    return { success: false, remainingText: `${hours}h ${mins}m`, balance: wallet.balance };
  }
  const reward = Math.floor(Math.random() * 80) + 120; 
  wallet.balance = (wallet.balance || 0) + reward;
  wallet.last_daily = now;
  await saveUserEconomy(wallet);
  return { success: true, reward, balance: wallet.balance };
}
export async function claimWeekly(guildId, userId) {
  const wallet = await getUserEconomy(guildId, userId);
  const now = Date.now();
  const cooldown = 7 * 24 * 60 * 60 * 1000; 
  if (wallet.last_weekly && now - wallet.last_weekly < cooldown) {
    const remainingMs = cooldown - (now - wallet.last_weekly);
    const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    return { success: false, remainingText: `${days}j ${hours}h`, balance: wallet.balance };
  }
  const reward = Math.floor(Math.random() * 300) + 700; 
  wallet.balance = (wallet.balance || 0) + reward;
  wallet.last_weekly = now;
  await saveUserEconomy(wallet);
  return { success: true, reward, balance: wallet.balance };
}
export async function purchaseItem(guildId, userId, itemId) {
  const item = SHOP_ITEMS.find((i) => i.id.toLowerCase() === itemId.toLowerCase());
  if (!item) {
    return { success: false, message: 'Cet objet n\'existe pas dans la boutique.' };
  }
  const wallet = await getUserEconomy(guildId, userId);
  if ((wallet.balance || 0) < item.price) {
    return {
      success: false,
      message: `Fonds insuffisants ! Il vous faut **${item.price} Saez Coins** (Solde actuel : ${wallet.balance || 0}).`,
    };
  }
  if (!Array.isArray(wallet.inventory)) wallet.inventory = [];
  wallet.balance -= item.price;
  wallet.inventory.push({
    id: item.id,
    name: item.name,
    category: item.category,
    bought_at: new Date(),
  });
  await saveUserEconomy(wallet);
  return { success: true, item, balance: wallet.balance, newBalance: wallet.balance };
}
export const buyItem = purchaseItem;
export async function getLeaderboardEco(guildId, limit = 10) {
  try {
    const db = getDb();
    if (db) {
      const col = db.collection('bot_economy');
      const docs = await col
        .find({ guild_id: guildId })
        .sort({ balance: -1 })
        .limit(limit)
        .toArray();
      if (docs.length > 0) return docs;
    }
  } catch (err) {}
  const list = [];
  for (const [key, val] of localEconomyCache) {
    if (key.startsWith(`${guildId}:`)) list.push(val);
  }
  return list.sort((a, b) => (b.balance || 0) - (a.balance || 0)).slice(0, limit);
}
