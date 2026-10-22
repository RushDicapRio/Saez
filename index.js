import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import config from './config.js';
import { connectMongo } from './database/mongo.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});
client.commands = new Collection();
function getAllJsFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllJsFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.js')) {
      arrayOfFiles.push(fullPath);
    }
  }
  return arrayOfFiles;
}
async function loadCommands() {
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = getAllJsFiles(commandsPath);
  for (const filePath of commandFiles) {
    try {
      const fileUrl = pathToFileURL(filePath).href;
      const command = await import(fileUrl);
      const cmdData = command.default || command;
      if (cmdData && cmdData.data && typeof cmdData.execute === 'function') {
        const category = path.basename(path.dirname(filePath));
        const cmdWrapper = {
          data: cmdData.data,
          execute: cmdData.execute,
          category,
        };
        client.commands.set(cmdData.data.name, cmdWrapper);
        console.log(`[BOT] Commande chargée : /${cmdData.data.name} [${category}]`);
      } else {
        console.warn(`[BOT] Attention : la commande ${path.basename(filePath)} est incomplète.`);
      }
    } catch (err) {
      console.error(`[BOT] Erreur chargement commande ${path.basename(filePath)} :`, err);
    }
  }
}
async function loadEvents() {
  const eventsPath = path.join(__dirname, 'events');
  const eventFiles = getAllJsFiles(eventsPath);
  for (const filePath of eventFiles) {
    try {
      const fileUrl = pathToFileURL(filePath).href;
      const eventModule = await import(fileUrl);
      const event = eventModule.default || eventModule;
      if (event && event.name && typeof event.execute === 'function') {
        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args, client));
        } else {
          client.on(event.name, (...args) => event.execute(...args, client));
        }
        console.log(`[BOT] Événement enregistré : ${event.name} (${path.basename(filePath)})`);
      }
    } catch (err) {
      console.error(`[BOT] Erreur chargement événement ${path.basename(filePath)} :`, err);
    }
  }
}
async function main() {
  console.log('[BOT] Démarrage du bot Saez...');
  try {
    await connectMongo();
  } catch (dbErr) {
    console.error('[BOT] Impossible de se connecter à MongoDB. Vérifiez votre configuration .env :', dbErr.message);
  }
  await loadCommands();
  await loadEvents();
  let token = config.discordToken || config.discord?.token;
  if (!token) {
    try {
      const { getDb } = await import('./database/mongo.js');
      const db = getDb();
      const cfgDoc = await db.collection('config').findOne({ _id: 'discord_stats_config' });
      if (cfgDoc?.bot_token) {
        token = cfgDoc.bot_token;
        console.log('[BOT] 🔑 Token récupéré dynamiquement depuis MongoDB Atlas.');
      }
    } catch {
    }
  }
  if (!token) {
    console.error('❌ ERREUR CRITIQUE : Le jeton Discord (DISCORD_TOKEN) est manquant !');
    console.error('👉 Renseignez le token dans bot/.env ou dans l\'administration Saez.');
    process.exit(1);
  }
  try {
    await client.login(token);
  } catch (loginErr) {
    console.error('❌ Échec de la connexion à Discord :', loginErr.message);
    process.exit(1);
  }
}
process.on('unhandledRejection', (reason, promise) => {
  console.error('[BOT] Rejet non géré à :', promise, 'raison :', reason);
});
process.on('uncaughtException', (error) => {
  console.error('[BOT] Exception non gérée :', error);
});
main();
