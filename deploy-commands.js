import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { config } from './config.js';
import { connectMongo, getDb } from './database/mongo.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export async function deployCommands({ exitOnFinish = false } = {}) {
  console.log('🚀 Déploiement des Slash Commands Discord en cours...');
  let token = config.discordToken || config.discord?.token;
  let guildId = config.guildId || config.discord?.guildId;
  let clientId = config.clientId || config.discord?.clientId;
  if (!token || !guildId) {
    try {
      const { connectMongo, getDb } = await import('./database/mongo.js');
      await connectMongo();
      const db = getDb();
      const cfgCol = db.collection('config');
      const doc = await cfgCol.findOne({ _id: 'discord_stats_config' });
      if (doc?.bot_token && !token) {
        token = doc.bot_token;
        console.log('🔑 Token de bot récupéré depuis MongoDB Atlas.');
      }
      if (doc?.guild_id && !guildId) {
        guildId = doc.guild_id;
      }
    } catch (err) {
      console.warn('Note : Connexion MongoDB non disponible pour deploy-commands, utilisation du .env.');
    }
  }
  if (!token) {
    console.error('❌ ERREUR : Aucun DISCORD_TOKEN trouvé dans .env ou MongoDB !');
    if (exitOnFinish) process.exit(1);
    return false;
  }
  if (!clientId || clientId === '') {
    try {
      const extracted = Buffer.from(token.split('.')[0], 'base64').toString('ascii');
      if (extracted && /^\d+$/.test(extracted)) {
        clientId = extracted;
      }
    } catch {}
  }
  function getAllJsFiles(dirPath, arrayOfFiles = []) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        arrayOfFiles = getAllJsFiles(fullPath, arrayOfFiles);
      } else if (file.endsWith('.js') && !file.startsWith('_')) {
        arrayOfFiles.push(fullPath);
      }
    }
    return arrayOfFiles;
  }
  const commandsMap = new Map();
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = getAllJsFiles(commandsPath);
  const CATEGORY_PRIORITY = {
    serveur: 100,
    moderation: 95,
    musique: 90,
    level: 85,
    profil: 80,
    economie: 75,
    giveaways: 70,
    evenements: 65,
    securite: 60,
    support: 55,
    logiciel: 50,
    information: 45,
    games: 40,
    fun: 35,
    communaute: 30,
    devlab: 25,
  };
  for (const filePath of commandFiles) {
    try {
      const fileUrl = pathToFileURL(filePath).href;
      const commandModule = await import(fileUrl);
      const command = commandModule.default || commandModule;
      if (command && 'data' in command && 'execute' in command && command.data?.name) {
        const cmdName = command.data.name;
        const category = path.basename(path.dirname(filePath)).toLowerCase();
        if (commandsMap.has(cmdName)) {
          console.warn(`[DÉDOUBLONNAGE] Commande /${cmdName} déjà chargée. Version doublon ignorée (${path.basename(filePath)}).`);
          continue;
        }
        commandsMap.set(cmdName, {
          data: command.data.toJSON(),
          category,
          name: cmdName,
          priority: CATEGORY_PRIORITY[category] || 20,
        });
        console.log(`📦 Commande chargée : /${cmdName} [${category}]`);
      } else {
        console.warn(`[AVERTISSEMENT] La commande ${path.basename(filePath)} est incomplète.`);
      }
    } catch (cmdErr) {
      console.warn(`[AVERTISSEMENT] Erreur chargement commande ${path.basename(filePath)} :`, cmdErr.message);
    }
  }
  let allCommands = Array.from(commandsMap.values()).sort((a, b) => b.priority - a.priority);
  const MAX_DISCORD_COMMANDS = 100;
  if (allCommands.length > MAX_DISCORD_COMMANDS) {
    const omittedCount = allCommands.length - MAX_DISCORD_COMMANDS;
    console.warn(`\n⚠️ [QUOTA DISCORD] Discord autorise un maximum absolu de 100 commandes par serveur.`);
    console.warn(`🛡️ Sécurité active : ${allCommands.length} commandes détectées ➔ Seules les 100 commandes prioritaires sont déployées pour empêcher le crash 30032.`);
    console.warn(`ℹ️ ${omittedCount} commande(s) secondaire(s) omise(s) pour respecter le quota Discord.\n`);
    allCommands = allCommands.slice(0, MAX_DISCORD_COMMANDS);
  }
  const commands = allCommands.map((c) => c.data);
  const rest = new REST().setToken(token);
  try {
    console.log(`📡 Enregistrement de ${commands.length} commande(s) auprès de Discord...`);
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log(`✅ Succès ! ${commands.length} commandes enregistrées sur le serveur (${guildId}) sans dépassement de quota !`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log(`✅ Succès ! ${commands.length} commandes enregistrées globalement !`);
    }
    return true;
  } catch (error) {
    console.error('❌ Erreur lors du déploiement des commandes :', error);
    if (error.rawError) {
      console.error('Détails rawError :', JSON.stringify(error.rawError, null, 2));
    }
    return false;
  } finally {
    if (exitOnFinish) {
      process.exit(0);
    }
  }
}
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
  deployCommands({ exitOnFinish: true });
}
