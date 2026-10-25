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
      } else if (file.endsWith('.js')) {
        arrayOfFiles.push(fullPath);
      }
    }
    return arrayOfFiles;
  }
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = getAllJsFiles(commandsPath);
  for (const filePath of commandFiles) {
    try {
      const fileUrl = pathToFileURL(filePath).href;
      const commandModule = await import(fileUrl);
      const command = commandModule.default || commandModule;
      if (command && 'data' in command && 'execute' in command) {
        const category = path.basename(path.dirname(filePath));
        commands.push(command.data.toJSON());
        console.log(`📦 Commande chargée : /${command.data.name} [${category}]`);
      } else {
        console.warn(`[AVERTISSEMENT] La commande ${path.basename(filePath)} est incomplète.`);
      }
    } catch (cmdErr) {
      console.warn(`[AVERTISSEMENT] Erreur chargement commande ${path.basename(filePath)} :`, cmdErr.message);
    }
  }
  const rest = new REST().setToken(token);
  try {
    console.log(`📡 Enregistrement de ${commands.length} commande(s) auprès de Discord...`);
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log(`✅ Succès ! ${commands.length} commandes enregistrées sur le serveur (${guildId}) !`);
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
