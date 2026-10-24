import { getDb } from '../database/mongo.js';
import { getUserEconomy, adjustBalance } from './economyService.js';
const ASSETS_BASE = {
  BTC: { name: 'Bitcoin', base: 68500, type: 'Crypto' },
  ETH: { name: 'Ethereum', base: 3500, type: 'Crypto' },
  SOL: { name: 'Solana', base: 180, type: 'Crypto' },
  AAPL: { name: 'Apple Inc.', base: 230, type: 'Action' },
  NVDA: { name: 'Nvidia Corp.', base: 135, type: 'Action' },
  NTDOY: { name: 'Nintendo Co.', base: 14, type: 'Action' },
  SONY: { name: 'Sony Group', base: 92, type: 'Action' },
};
export function getMarketPrice(symbol) {
  const sym = symbol.toUpperCase();
  const asset = ASSETS_BASE[sym];
  if (!asset) return null;
  const now = new Date();
  const seed = (now.getHours() * 60 + now.getMinutes()) * (sym.charCodeAt(0) + sym.charCodeAt(1));
  const variationPct = ((seed % 100) - 50) / 1000; 
  const currentPrice = Math.round(asset.base * (1 + variationPct) * 100) / 100;
  return {
    symbol: sym,
    name: asset.name,
    type: asset.type,
    price: currentPrice,
    change24h: Math.round(variationPct * 10000) / 100,
  };
}
export function getAllMarketPrices() {
  return Object.keys(ASSETS_BASE).map(getMarketPrice);
}
export async function getUserPortfolio(guildId, userId) {
  try {
    const db = getDb();
    const doc = await db.collection('user_portfolios').findOne({ guild_id: guildId, user_id: userId });
    return doc?.holdings || {};
  } catch {
    return {};
  }
}
export async function buyAsset(guildId, userId, symbol, amountCoins) {
  const asset = getMarketPrice(symbol);
  if (!asset) return { success: false, message: 'Actif financier introuvable.' };
  const userBal = await getUserEconomy(guildId, userId);
  if (userBal.balance < amountCoins) {
    return { success: false, message: `Fonds insuffisants ! Vous possédez \`${userBal.balance}\` pièces.` };
  }
  await adjustBalance(guildId, userId, -amountCoins);
  const unitsBought = amountCoins / asset.price;
  const db = getDb();
  await db.collection('user_portfolios').updateOne(
    { guild_id: guildId, user_id: userId },
    {
      $inc: { [`holdings.${asset.symbol}`]: unitsBought },
      $set: { updated_at: new Date() },
    },
    { upsert: true }
  );
  return {
    success: true,
    units: unitsBought.toFixed(4),
    asset: asset.name,
    price: asset.price,
  };
}
export async function sellAsset(guildId, userId, symbol, unitsToSell) {
  const asset = getMarketPrice(symbol);
  if (!asset) return { success: false, message: 'Actif introuvable.' };
  const db = getDb();
  const doc = await db.collection('user_portfolios').findOne({ guild_id: guildId, user_id: userId });
  const currentUnits = doc?.holdings?.[asset.symbol] || 0;
  if (currentUnits < unitsToSell) {
    return { success: false, message: `Vous ne possédez que \`${currentUnits.toFixed(4)}\` unités de ${asset.name}.` };
  }
  const revenueCoins = Math.round(unitsToSell * asset.price);
  await db.collection('user_portfolios').updateOne(
    { guild_id: guildId, user_id: userId },
    {
      $inc: { [`holdings.${asset.symbol}`]: -unitsToSell },
      $set: { updated_at: new Date() },
    }
  );
  await adjustBalance(guildId, userId, revenueCoins);
  return {
    success: true,
    revenue: revenueCoins,
    units: unitsToSell,
    asset: asset.name,
  };
}
