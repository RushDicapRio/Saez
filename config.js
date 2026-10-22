import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();
export const config = {
  discordToken: process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN || '',
  clientId: process.env.CLIENT_ID || process.env.DISCORD_CLIENT_ID || '',
  guildId: process.env.GUILD_ID || process.env.DISCORD_GUILD_ID || '',
  mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI || '',
  mongoDbName: process.env.MONGO_DB_NAME || process.env.MONGODB_DB_NAME || '',
  syncIntervalMinutes: parseInt(process.env.SYNC_INTERVAL_MINUTES || process.env.STATS_SYNC_INTERVAL_MINUTES || '10', 10),
  discord: {
    token: process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN || '',
    clientId: process.env.CLIENT_ID || process.env.DISCORD_CLIENT_ID || '',
    guildId: process.env.GUILD_ID || process.env.DISCORD_GUILD_ID || '',
  },
  colors: {
    primary: 0x00e5ff,   
    accent: 0xff2d7b,    
    success: 0x10b981,   
    warning: 0xf59e0b,   
    blurple: 0x5865f2,   
    dark: 0x0a0e17,      
  },
  assets: {
    logoUrl: 'https://i.imgur.com/1UxZCRG.jpeg',
    bannerUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1000&auto=format&fit=crop&q=80',
    websiteUrl: 'https://discord.gg/4djy4pesKd',
  },
};
export default config;
