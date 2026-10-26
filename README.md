# 🤖 Saez Discord Bot (v14)

[![Discord.js](https://img.shields.io/badge/Discord.js-v14.16.3-5865F2?logo=discord&logoColor=white)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Commands](https://img.shields.io/badge/Commandes_Slash-80_commandes-blueviolet)](#-catalogue-exhaustif-des-commandes-slash)
[![Subcommands](https://img.shields.io/badge/Sous--commandes-380%2B-blue)](#-catalogue-exhaustif-des-commandes-slash)
[![Categories](https://img.shields.io/badge/Catégories-52_catégories-orange)](#-catalogue-exhaustif-des-commandes-slash)

Bot Discord officiel haut de gamme pour l'écosystème **Saez Animes**, propulsé par **Discord.js v14**, entièrement interconnecté à la base de données de production **MongoDB Atlas** de l'application de bureau et doté d'une infrastructure tout-en-un ultra-complète (Modération, Sécurité Anti-Raid, Statuts Vocaux 24/7, Musique & Web-Radios, Économie, RPG & Niveaux, Billetterie Support, Jeux Otaku, etc.).

---

## 📑 Sommaire

1. [🌟 Points Forts & Fonctionnalités Clés](#-points-forts--fonctionnalités-clés)
2. [📁 Architecture Modulaire du Projet](#-architecture-modulaire-du-projet)
3. [🚀 Guide de Démarrage Rapide](#-guide-de-démarrage-rapide)
   - [Prérequis](#prérequis)
   - [Configuration (`.env`)](#configuration-env)
   - [Installation & Lancement](#installation--lancement)
   - [Déploiement Intelligent des Slash Commands](#déploiement-intelligent-des-slash-commands)
4. [📚 Catalogue Exhaustif des Catégories & Commandes Slash](#-catalogue-exhaustif-des-catégories--commandes-slash)
   - [1. Écosystème Saez Animes & Streaming](#-1-écosystème-saez-animes--streaming)
   - [2. Modération, Sécurité & Protection du Serveur](#-2-modération-sécurité--protection-du-serveur)
   - [3. Gestion, Configuration & Infrastructure Serveur](#-3-gestion-configuration--infrastructure-serveur)
   - [4. Musique, Radio & Salons Vocaux Temporaires](#-4-musique-radio--salons-vocaux-temporaires)
   - [5. RPG, Niveaux, Économie & Profils](#-5-rpg-niveaux-économie--profils)
   - [6. Support, Assistance & Organisation](#-6-support-assistance--organisation)
   - [7. Jeux, Mini-Jeux & Tournois](#-7-jeux-mini-jeux--tournois)
   - [8. Vie Communautaire, Débats & Événements](#-8-vie-communautaire-débats--événements)
   - [9. Créativité, Médias, Études & Outils Utiles](#-9-créativité-médias-études--outils-utiles)
5. [📡 Gestionnaires d'Événements Discord (`events/`)](#-gestionnaires-dévénements-discord-events)
6. [⚙️ Services & Logique Métier (`services/`)](#-services--logique-métier-services)
7. [🛡️ Sécurité & Système Anti-Raid](#-sécurité--système-anti-raid)
8. [❓ Dépannage & FAQ](#-dépannage--faq)

---

## 🌟 Points Forts & Fonctionnalités Clés

- **🔗 Interconnexion Saez Animes & MongoDB Atlas :**
  - Synchronisation en direct avec le logiciel de bureau Saez Animes : consultation de catalogue, profils utilisateurs, stats de visionnage, dernières sorties et planning hebdomadaire.
  - Sauvegarde et récupération des configurations serveur, sanctions, suggestions et profils directement dans MongoDB Atlas.

- **📊 Statistiques 24/7 en Salons Vocaux (Anti-Rate-Limit) :**
  - Mise à jour autonome et continue des compteurs statistiques dans les noms de salons vocaux (Utilisateurs en ligne, Animes au catalogue, Épisodes, Films, OAV, Boosts, etc.).
  - Algorithme anti-rate-limit strict évitant les blocages API de Discord (limitation à 2 renommages par 10 minutes par salon).

- **🟣 Présence Streaming Dynamique :**
  - Statut Discord animé en violet (*Streaming*) diffusant en direct l'activité de l'application Saez (nombre d'utilisateurs en train de regarder des animes, titres en cours de visionnage, statistiques globales).

- **🛡️ Suite de Sécurité & Modération Entreprise :**
  - Bouclier Anti-Raid et Anti-Spam automatique.
  - Détection proactive des invitations Discord parasites (`discord.gg`, `dsc.gg`, liens obfusqués) avec suppression instantanée et journalisation.
  - Sanctions complètes avec messages privés (DMs) automatiques au joueur, purge optionnelle de messages, et journal d'audit centralisé.

- **🎧 Musique Haute Fidélité & 24/7 Web-Radios :**
  - Lecteur audio puissant supportant YouTube, Spotify, Deezer et SoundCloud avec file d'attente, volume, égaliseur et boucles.
  - Stations radio japonaises et lofi disponibles 24h/24 sans interruption.

- **🎫 Support & Billetterie Professionnelle :**
  - Panneaux fixes de création de tickets par boutons avec formulaires modaux.
  - Attribution de salons privés avec permissions adaptées, prise en charge par le staff (`claim`), et génération d'un transcript complet HTML ou texte lors de la fermeture.

- **🎉 Anime Party & Divertissement :**
  - Plus de 25 mini-jeux anime interactifs (Blind tests, Quiz, Morpion, Duels 1v1, Imposteur, Enquêtes, Tier lists collaboratives, Grilles de bingo, Pendu).

- **💰 Économie Virtuelle & Simulateur Boursier :**
  - Système complet de devises, travail, récompenses quotidiennes, magasin, portefeuilles et simulateur boursier (actions et cryptos).

---

## 📁 Architecture Modulaire du Projet

```
bot/
├── commands/               # 52 catégories de Slash Commands (80 commandes, 380+ sous-commandes)
│   ├── animeparty/         # Hub Anime Party (Blind tests, quiz, duels, soirées)
│   ├── automation/         # Moteur central de règles et scénarios automatisés
│   ├── backup/             # Système de sauvegarde & restauration du serveur Discord
│   ├── bookmarks/          # Gestionnaire de marque-pages et favoris
│   ├── cassetete/          # Échecs, sudoku, énigmes et réflexion
│   ├── communaute/         # Candidatures, confessions anonymes, débats, entraide, mentorat
│   ├── counting/           # Salon de comptage avec calculs et anti-triche
│   ├── creativite/         # Atelier créatif (fanarts, recettes, fanfictions)
│   ├── devlab/             # Partage de snippets colorés et outils dev
│   ├── economie/           # Système d'argent virtuel, daily, work, shop
│   ├── embed/              # Générateur visuel d'embeds sur-mesure
│   ├── etudes/             # Révisions, flashcards, maths, sciences, géographie
│   ├── evenements/         # Création et inscription aux événements communautaires
│   ├── fun/                # Jeux de société, 8ball, shifumi, pile ou face
│   ├── games/              # Mini-jeux d'arcade interactifs
│   ├── gamestats/          # Profils et statistiques jeux vidéo
│   ├── giveaways/          # Concours, tirages au sort avec boutons
│   ├── information/        # Fiches détaillées membres, serveur, bot, salons
│   ├── invites/            # Suivi des invitations et parrainages
│   ├── knowledge/          # Base de connaissances et documentation interne
│   ├── languages/          # Traducteur et apprentissage linguistique
│   ├── leaderboard/        # Classements généraux (XP, activité, économie)
│   ├── level/              # Système d'XP textuel/vocal et paliers de rôles anime
│   ├── lifestyle/          # Habitudes quotidiennes, sport, animaux, plantes
│   ├── logiciel/           # Intégration directe Saez Animes (stats, catalogue, profils)
│   ├── media/              # Bannières anime, gifs, memes et médias visuels
│   ├── moderation/         # Modération classique (/ban, /kick, /mute, /warn, /clear, etc.)
│   ├── musique/            # Lecteur audio riche (/play, /queue, /skip, /volume...)
│   ├── news/               # Flux d'actualités animes, mangas, tech
│   ├── onboarding/         # Questionnaire d'accueil et sélection de rôles
│   ├── polls/              # Sondages avancés multi-choix
│   ├── profil/             # Cartes de profil personnalisées et badges
│   ├── radio/              # Stations web-radio 24/7 (anime, lofi, j-pop)
│   ├── roleplay/           # Lancers de dés JDR (d20, d100) et profils RP
│   ├── roles/              # Auto-rôles par boutons et menus déroulants
│   ├── schedule/           # Emplois du temps et calendriers d'activités
│   ├── securite/           # Bouclier anti-raid, anti-spam, anti-liens, mots interdits
│   ├── servergrowth/       # Partenariats communautaires et rappels de bump
│   ├── serveur/            # Configuration unifiée, help, logs, serverstats, suggestions
│   ├── starboard/          # Mur d'étoiles (starboard) alimenté par réactions
│   ├── stockmarket/        # Marché boursier virtuel (actions & cryptomonnaies)
│   ├── support/            # Diagnostic des services et hub d'assistance
│   ├── tags/               # Réponses rapides et macros enregistrées
│   ├── tasks/              # To-do lists et gestionnaire de tâches personnel
│   ├── teams/              # Clans, guildes et classements d'équipes
│   ├── tempchannels/       # Salons textuels éphémères privés
│   ├── timezone/           # Fuseaux horaires mondiaux et horodates Discord
│   ├── tournament/         # Organisation de tournois e-sport
│   ├── transcripts/        # Exportation et archivage de conversations en HTML/texte
│   ├── utility/            # Boîte à outils : calculatrice, qrcode, météo, passwords
│   ├── voice/              # Salons vocaux temporaires dynamiques avec panneau proprio
│   └── welcome/            # Messages et bannières d'arrivée et de départ
├── events/                 # 13 gestionnaires d'événements Discord modulaires
├── database/               # Connecteur MongoDB Atlas natif
├── services/               # 48 services métier spécialisés
├── config.js               # Constantes graphiques, couleurs officielles et identifiants
├── deploy-commands.js      # Déployeur intelligent respectant les quotas Discord
├── index.js                # Point d'entrée principal du bot
└── package.json            # Dépendances du projet
```

---

## 🚀 Guide de Démarrage Rapide

### Prérequis
- **Node.js** version 18.0.0 ou supérieure.
- Un serveur Discord avec les droits administrateur pour inviter le bot.
- Une instance **MongoDB** (idéalement MongoDB Atlas).
- Une application Discord créée sur le [Discord Developer Portal](https://discord.com/developers/applications).
  > **Important :** Dans la section **Bot** du Developer Portal, activez les 3 **Privileged Gateway Intents** :
  > - `PRESENCE INTENT`
  > - `SERVER MEMBERS INTENT`
  > - `MESSAGE CONTENT INTENT`

---

### Configuration (`.env`)

Créez ou modifiez le fichier `.env` dans le dossier `bot/` :

```env
# Token d'authentification du bot Discord
DISCORD_TOKEN=votre_bot_token_ici

# Identifiant client de l'application Discord
CLIENT_ID=votre_client_id_ici

# Identifiant du serveur Discord principal (Guild ID)
GUILD_ID=votre_guild_id_ici

# URL de connexion MongoDB Atlas
MONGODB_URI=mongodb+srv://utilisateur:motdepasse@cluster.mongodb.net/anistream?retryWrites=true&w=majority
DB_NAME=anistream

# Port optionnel pour l'API interne du bot
PORT=3001
```

---

### Installation & Lancement

1. **Installer les dépendances :**
   ```bash
   cd bot
   npm install
   ```

2. **Déployer les Slash Commands auprès de Discord :**
   ```bash
   node deploy-commands.js
   ```

3. **Lancer le bot :**
   ```bash
   npm start
   # ou
   node index.js
   ```

---

### Déploiement Intelligent des Slash Commands

Discord impose une limite absolue stricte de **100 commandes Slash racines par serveur ou par application**.

Le script [deploy-commands.js](file:///d:/Saez/App%20Claude/anistream/bot/deploy-commands.js) inclut un système d'auto-priorisation et de sécurité anti-crash :
- Il analyse l'ensemble des 80 commandes disponibles.
- Il applique une matrice de priorité métier (Administration > Modération > Musique > Niveaux > Profils > Économie > Giveaways > Sécurité > Support > Logiciel...).
- Il déploie toutes les commandes sans jamais dépasser le plafond Discord de 100 commandes, éliminant ainsi toute erreur `30032 (Maximum number of application commands reached)`.

---

## 📚 Catalogue Exhaustif des Catégories & Commandes Slash

Ci-dessous se trouve l'inventaire complet de toutes les commandes et sous-commandes réparties par pôle d'activité.

---

### 🎬 1. Écosystème Saez Animes & Streaming

*Liaison directe avec l'application de bureau Saez Animes et la base MongoDB Atlas.*

#### 📂 Catégorie `logiciel` (1 commande)

##### `/logiciel`
Toutes les fonctionnalités connectées à votre logiciel Saez Animes

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/logiciel catalogue` | **titre** | Recherche un animé dans le catalogue officiel de Saez |
| `/logiciel profil` | **pseudo** | Consulte le profil d’un utilisateur Saez Animes (Niveau, XP, Rang, Statut) |
| `/logiciel stats` | - | Affiche les statistiques réelles du logiciel Saez Animes en direct |
| `/logiciel recent` | - | Affiche les dernières sorties et nouveautés ajoutées dans Saez Animes |
| `/logiciel planning` | *jour* | Consulte le planning des diffusions et sorties programmées sur Saez |
| `/logiciel online` | - | Affiche la liste des personnes actuellement en train d’utiliser Saez |
| `/logiciel sync` | - | [Admin] Force la synchronisation immédiate des salons de statistiques |
| `/logiciel version` | - | Vérifie la dernière version officielle disponible de Saez Animes |
| `/logiciel classement` | - | Affiche le classement des membres Saez les plus actifs (Niveaux & XP) |
| `/logiciel aide` | - | Guide et aide spécifique sur l'intégration du logiciel Saez Animes |

#### 📂 Catégorie `animeparty` (1 commande)

##### `/animeparty`
Centre Ultime Anime Party — Jeux, Citations, Duels, Roulettes & Soirées Otaku

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/animeparty citation` | *action*, *recherche*, *personnage*, *anime*, *theme* | Citations cultes, citation du jour, favoris, duels et recherche |
| `/animeparty roulette` | *theme* | Tirage au sort Otaku : pépites animes, héros, pouvoirs ou défis |
| `/animeparty scoreboard` | *filtre* | Classement officiel des meilleurs joueurs Anime Party du serveur |
| `/animeparty stat` | *membre*, *comparer_avec* | Fiche détaillée de profil, victoires, séries, badges et historique |
| `/animeparty party` | *action*, *theme* | Organiser et animer une Soirée Anime Party complète en plusieurs manches |
| `/animeparty soundboard` | *replique* | Punchlines et répliques sonores japonaises cultes |
| `/animeparty contribution` | **type** | Proposer une citation, une question, un défi ou signaler une erreur |
| `/animeparty config` | **action** | Administration et configuration du module Anime Party sur ce serveur |

**Groupe `jeu` :** Jeux de reconnaissance, réflexion, mémoire et arcade anime

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/animeparty jeu catalogue` | - | Ouvrir le Hub et catalogue interactif de tous les mini-jeux |
| `/animeparty jeu blindtest` | - | Deviner l'anime à partir d'un opening, ending ou indice sonore |
| `/animeparty jeu devine-anime` | - | Identifier le titre d'un anime avec des indices progressifs |
| `/animeparty jeu devine-personnage` | - | Deviner un personnage avec des indices progressifs |
| `/animeparty jeu devine-replique` | - | Deviner qui a prononcé cette réplique légendaire |
| `/animeparty jeu emoji-challenge` | - | Deviner un anime culte à partir d'une suite d'emojis |
| `/animeparty jeu anime-pendu` | - | Jeu du pendu anime complet avec potence et sélection de lettres |
| `/animeparty jeu vrai-ou-faux` | - | Affirmation piège Otaku : Vrai ou Faux en 25 secondes |
| `/animeparty jeu morpion` | - | Morpion tactique 1v1 ou contre IA thématique Anime |
| `/animeparty jeu puissance4` | - | Puissance 4 anime interactif au tour par tour |
| `/animeparty jeu anagramme` | - | Déchiffrer un titre ou personnage dont les lettres sont mélangées |
| `/animeparty jeu intrus` | - | Démasquer l'intrus qui ne partage pas la même caractéristique |
| `/animeparty jeu arcade` | - | Mode survie où les mini-jeux s'enchaînent avec 3 vies |
| `/animeparty jeu scenario` | - | Enquête narrative interactive à embranchements et choix |
| `/animeparty jeu association` | - | Relier les personnages, pouvoirs, rivaux ou studios |
| `/animeparty jeu qui-suis-je` | - | Découvrir le héros secret par élimination d'indices |
| `/animeparty jeu imposteur` | - | Jeu social de bluff : démasquez l'infiltré dans le salon |
| `/animeparty jeu mot-interdit` | - | Faire deviner un héros sans prononcer les 5 mots tabous |
| `/animeparty jeu image-mystere` | - | Reconnaître un héros à partir d'une description détaillée |

**Groupe `multi` :** Parties multijoueurs, réflexes, duels et tournois

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/animeparty multi partie` | *action* | Créer, rejoindre ou gérer un lobby multijoueur |
| `/animeparty multi duel-anime` | **adversaire** | Défier un membre en 1v1 dans un duel de vitesse et connaissances |
| `/animeparty multi tournoi` | - | Arbre de tournoi d'arène à élimination directe |
| `/animeparty multi reflexe` | - | Duel de vitesse : le premier qui clique remporte le duel |
| `/animeparty multi memoire` | - | Mémoriser et reproduire la séquence de symboles anime |
| `/animeparty multi battle-royale` | - | Simulation de combat de titans avec votes de la communauté |
| `/animeparty multi tier-list` | - | Créer un classement collaboratif en direct (Rang S, A, B, C, D) |
| `/animeparty multi draft` | - | Composer son escouade de 3 héros pour un raid |
| `/animeparty multi bingo-anime` | - | Grille de bingo interactive des clichés shonen |
| `/animeparty multi marathon` | - | Défi communautaire de visionnage et watch-along légal |
| `/animeparty multi defi-quotidien` | - | Consulter et accomplir la mission Otaku du jour |
| `/animeparty multi jeu-rapide` | - | Lancer immédiatement un mini-jeu disponible au hasard |

### 🛡️ 2. Modération, Sécurité & Protection du Serveur

*Suite complète de modération, bouclier anti-raid, filtrage en temps réel et archivage.*

#### 📂 Catégorie `moderation` (10 commandes)

##### `/ban` *(Permission requise : 4)*
Bannit un membre du serveur Discord

**Arguments :**
- `membre` (**[Requis]**) : Le membre à bannir
- `raison` (*[Optionnel]*) : Raison du bannissement
- `jours_purge` (*[Optionnel]*) : Nombre de jours de messages à effacer (0 à 7, défaut: 0)

##### `/clear` *(Permission requise : 8192)*
Supprime un nombre défini de messages dans le salon

**Arguments :**
- `nombre` (**[Requis]**) : Nombre de messages à supprimer (1 à 100)
- `membre` (*[Optionnel]*) : Filtrer les messages d'un utilisateur spécifique uniquement

##### `/kick` *(Permission requise : 2)*
Expulse un membre du serveur

**Arguments :**
- `membre` (**[Requis]**) : Le membre à expulser
- `raison` (*[Optionnel]*) : Raison de l'expulsion

##### `/lock` *(Permission requise : 16)*
Verrouille un salon textuel (empêche les membres d’écrire)

**Arguments :**
- `salon` (*[Optionnel]*) : Salon à verrouiller (défaut : salon actuel)
- `raison` (*[Optionnel]*) : Raison du verrouillage

##### `/mute` *(Permission requise : 1099511627776)*
Exclut temporairement un membre (Timeout)

**Arguments :**
- `membre` (**[Requis]**) : Le membre à exclure
- `duree` (**[Requis]**) : Durée de l'exclusion
- `raison` (*[Optionnel]*) : Raison de la mise en sourdine

##### `/slowmode` *(Permission requise : 16)*
Définit le mode lent (délai entre les messages) d'un salon

**Arguments :**
- `secondes` (**[Requis]**) : Délai en secondes (0 pour désactiver, max 21600 = 6h)
- `salon` (*[Optionnel]*) : Salon concerné (défaut : salon actuel)
- `raison` (*[Optionnel]*) : Raison du changement de mode lent

##### `/unban` *(Permission requise : 4)*
Débannit un utilisateur via son ID Discord

**Arguments :**
- `id` (**[Requis]**) : ID Discord de l'utilisateur à débannir
- `raison` (*[Optionnel]*) : Raison du débannissement

##### `/unlock` *(Permission requise : 16)*
Déverrouille un salon textuel (autorise à nouveau les membres à écrire)

**Arguments :**
- `salon` (*[Optionnel]*) : Salon à déverrouiller (défaut : salon actuel)
- `raison` (*[Optionnel]*) : Raison du déverrouillage

##### `/unmute` *(Permission requise : 1099511627776)*
Lève l'exclusion temporaire d'un membre

**Arguments :**
- `membre` (**[Requis]**) : Le membre à rétablir
- `raison` (*[Optionnel]*) : Raison de la levée

##### `/warn` *(Permission requise : 1099511627776)*
Gestion des avertissements officiels des membres

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/warn ajouter` | **membre**, **raison** | Donner un avertissement officiel à un membre |
| `/warn liste` | **membre** | Consulter l'historique des avertissements d'un membre |

#### 📂 Catégorie `securite` (1 commande)

##### `/security` *(Permission requise : 8)*
Système de sécurité, anti-raid, anti-spam et modération automatique

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/security status` | - | Affiche le statut et la configuration de tous les modules de protection |
| `/security antiraid` | **actif**, *action* | Active ou configure la protection anti-raid |
| `/security antispam` | **actif**, *max_messages*, *timeout_minutes* | Active ou configure la protection anti-spam et anti-flood |
| `/security words` | **action**, *mot* | Gère la liste des mots et insultes interdits |
| `/security links` | **mode** | Configure la protection contre les liens et invitations Discord |
| `/security logs` | **salon** | Définit le salon où envoyer les alertes de sécurité |

#### 📂 Catégorie `backup` (1 commande)

##### `/backup` *(Permission requise : 8)*
Système complet de sauvegarde, restauration et archivage du serveur

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/backup create` | *nom*, *description*, *type*, *inclure_roles*, *inclure_salons*, *inclure_configs* | Créer une sauvegarde configurable du serveur |
| `/backup creer` | *nom*, *description*, *type*, *inclure_roles*, *inclure_salons*, *inclure_configs* | Alias français pour /backup create |
| `/backup list` | *type*, *tri* | Afficher la liste paginée des sauvegardes disponibles |
| `/backup liste` | *type* | Alias français pour /backup list |
| `/backup export` | **id** | Exporter une sauvegarde sous forme de fichier JSON certifié |
| `/backup restore` | **id**, *mode*, *categories* | Restaurer une sauvegarde avec confirmation et sécurité |
| `/backup delete` | **id** | Supprimer définitivement une sauvegarde |
| `/backup details` | **id** | Afficher la fiche technique complète d'une sauvegarde |
| `/backup rename` | **id**, **nouveau_nom**, *description* | Renommer une sauvegarde existante |
| `/backup verify` | **id** | Vérifier l'intégrité cryptographique et la conformité d'une sauvegarde |
| `/backup compare` | **id** | Comparer la sauvegarde avec l'état actuel du serveur (lecture seule) |
| `/backup schedule` | **frequence**, *type*, *salon_logs* | Configurer la fréquence des sauvegardes automatiques |
| `/backup autosave` | **actif** | Activer ou désactiver les sauvegardes automatiques |
| `/backup history` | *limite* | Consulter l'historique d'audit des opérations de sauvegarde et restauration |
| `/backup status` | - | Consulter l'état opérationnel et de santé du module Backup |
| `/backup import` | **fichier** | Importer une sauvegarde depuis un fichier JSON compatible |
| `/backup duplicate` | **id**, *nom_copie* | Cloner une sauvegarde existante sous un nouvel identifiant |
| `/backup cleanup` | *jours*, *garder_minimum*, *uniquement_auto* | Nettoyer les anciennes sauvegardes selon une politique de conservation |
| `/backup search` | **terme** | Rechercher une sauvegarde par mot-clé, date ou identifiant |
| `/backup cancel` | - | Interrompre immédiatement une opération de restauration en cours |
| `/backup settings` | *retention*, *salon_notif*, *activer* | Configurer les paramètres généraux du système de sauvegarde |
| `/backup stats` | - | Consulter les statistiques globales des sauvegardes du serveur |
| `/backup test-restore` | **id** | Simuler une restauration sans apporter la moindre modification au serveur |

#### 📂 Catégorie `automation` (1 commande)

##### `/automation` *(Permission requise : 32)*
Moteur central et gestion des automatisations du serveur

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/automation reponse` | **declencheur**, **reponse** | Créer une réponse automatique par mot-clé dans le chat (hérité) |
| `/automation role-alert` | **role**, **message** | Envoyer un message privé automatique à un membre recevant un rôle précis (hérité) |
| `/automation liste` | - | Lister toutes les automatisations actives du serveur |
| `/automation creer` | **nom**, **declencheur**, **action**, *valeur_declencheur*, *contenu_action*, *role_cible* | Créer un scénario d'automatisation complet |
| `/automation details` | **id** | Afficher les détails et la configuration d'une automatisation |
| `/automation modifier` | **id**, *nom*, *description* | Modifier le nom ou la description d'une règle |
| `/automation supprimer` | **id** | Supprimer définitivement une automatisation |
| `/automation activer` | **id** | Activer une automatisation |
| `/automation desactiver` | **id** | Désactiver temporairement une automatisation |
| `/automation pause` | **id** | Mettre en pause une automatisation |
| `/automation reprendre` | **id** | Reprendre l'exécution d'une automatisation en pause |
| `/automation tester` | **id** | Tester une automatisation en mode simulation (Dry-Run, sans action réelle) |
| `/automation historique` | *id* | Consulter l'historique et les statistiques d'exécution |
| `/automation dupliquer` | **id**, **nouveau_nom** | Dupliquer une automatisation existante |
| `/automation recherche` | **requete** | Rechercher une automatisation par nom ou mot-clé |
| `/automation modeles` | *modele_id* | Consulter ou installer un modèle d'automatisation prêt à l'emploi |
| `/automation export` | *id* | Exporter la configuration des automatisations en format JSON |
| `/automation import` | **donnees_json** | Importer une configuration JSON validée |
| `/automation nettoyer` | *jours* | Purger les anciens logs d'exécution |

### ⚙️ 3. Gestion, Configuration & Infrastructure Serveur

*Panneaux de contrôle, statistiques en direct dans les salons vocaux, logs et onboarding.*

#### 📂 Catégorie `serveur` (5 commandes)

##### `/config` *(Permission requise : 8)*
Centre de configuration unifié de toutes les fonctionnalités du Bot Saez

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/config status` | - | Affiche le tableau de bord complet de toutes les configurations actives |
| `/config salon` | **module**, **salon** | Configurer le salon d'un module spécifique |
| `/config role` | **action**, **role** | Configurer un rôle pour un module |
| `/config tickets` | *categorie*, *role_support*, *salon_logs*, *anti_staff_ping*, *max_pings* | Configuration groupée du système de tickets |
| `/config panel` | **type**, *salon* | Déployer l'un des panneaux interactifs officiels dans un salon |
| `/config security` | **module**, **actif** | Activer ou désactiver les modules de sécurité |

##### `/help`
Centre d'aide interactif de toutes les commandes du bot

**Arguments :**
- `categorie` (*[Optionnel]*) : Catégorie spécifique à consulter directement

##### `/logs` *(Permission requise : 8)*
Configuration du journal d'audit et des salons de logs du serveur

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/logs status` | - | Affiche le statut et les salons assignés à chaque module de logs |
| `/logs channel` | **type**, **salon** | Définit le salon d'un type de logs spécifique |
| `/logs toggle` | **module**, **actif** | Active ou désactive un module de journalisation |

##### `/serverstats` *(Permission requise : 32)*
Gère les salons de statistiques automatiques du serveur Discord

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/serverstats setup` | - | Crée ou met en place les salons vocaux de stats automatiques (Membres, Humains, Bots, Boosts) |
| `/serverstats sync` | - | Force la mise à jour immédiate des compteurs des salons statistiques |
| `/serverstats status` | - | Affiche les statistiques en direct du serveur et l'état des salons |
| `/serverstats disable` | - | Désactive la mise à jour automatique des salons statistiques du serveur |

##### `/suggestion`
Système officiel de suggestions Saez (Synchronisé avec le logiciel)

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/suggestion submit` | **titre**, **description**, *categorie*, *langue*, *image* | Proposer une nouvelle suggestion ou demander un animé |
| `/suggestion panel` | *salon* | Envoyer le panneau interactif fixe de suggestions avec boutons et formulaires |
| `/suggestion channel` | **salon** | Définir le salon où seront publiées les suggestions (Admin) |
| `/suggestion status` | **id**, **statut**, *reponse* | Mettre à jour le statut d'une suggestion (Modération / Staff) |
| `/suggestion delete` | **id** | Supprimer définitivement une suggestion et son message Discord (Staff) |

#### 📂 Catégorie `roles` (1 commande)

##### `/autorole` *(Permission requise : 268435456)*
Système complet d’auto-rôles et rôles par réaction/bouton

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/autorole panel` | *salon*, *titre* | Envoie ou actualise le panneau interactif d'auto-rôles |
| `/autorole add` | **role**, **texte**, *emoji*, *description*, *couleur* | Ajoute un rôle sélectionnable avec un bouton au panneau |
| `/autorole remove` | **role** | Retire un rôle de la liste des auto-rôles |
| `/autorole list` | - | Affiche la liste de tous les auto-rôles actuellement configurés |

#### 📂 Catégorie `welcome` (1 commande)

##### `/welcome` *(Permission requise : 32)*
Configuration du système de Bienvenue et d’Au Revoir

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/welcome config` | *salon_bienvenue*, *salon_aurevoir*, *actif_bienvenue*, *actif_aurevoir* | Configure les salons de bienvenue et d'au revoir |
| `/welcome image` | **type**, **url** | Personnalise l'image/bannière du message de bienvenue ou d'au revoir |
| `/welcome message` | **type**, **texte** | Personnalise le texte du message |
| `/welcome test` | **type** | Envoie un aperçu du message de bienvenue ou d'au revoir dans ce salon |

#### 📂 Catégorie `onboarding` (1 commande)

##### `/onboarding`
Parcours d'accueil et questionnaire interactif des nouveaux membres

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/onboarding start` | - | Lancer votre questionnaire de bienvenue et choisir vos rôles d'intérêt |
| `/onboarding panel` | - | Déployer le panneau interactif fixe de parcours de bienvenue (Mod/Admin) |

#### 📂 Catégorie `servergrowth` (1 commande)

##### `/croissance`
Gestionnaire de partenariats, visibilité et rappels de bump

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/croissance partenariat-ajouter` | **nom**, **lien**, *description*, *representant* | Enregistrer un nouveau serveur Discord partenaire |
| `/croissance partenariats` | - | Consulter la liste de toutes les communautés partenaires officielles |
| `/croissance bump-rappel` | **salon** | Configurer le salon pour les rappels de vote et bump (Disboard/Top.gg) |

#### 📂 Catégorie `transcripts` (1 commande)

##### `/transcript`
Archivage et export textuel ou HTML des conversations de salon

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/transcript salon` | *nombre* | Générer et télécharger l'archive des messages récents du salon actuel |

### 🎧 4. Musique, Radio & Salons Vocaux Temporaires

*Lecteur audio haute performance, web-radios 24/7 et créateur de salons vocaux sur-mesure.*

#### 📂 Catégorie `musique` (10 commandes)

##### `/loop`
Active ou désactive la répétition du morceau ou de la file

**Arguments :**
- `mode` (**[Requis]**) : Mode de répétition souhaité

##### `/nowplaying`
Affiche les détails du morceau audio actuellement en cours de lecture

##### `/pause`
Met la lecture de la musique en pause

##### `/play`
Joue un morceau ou ajoute à la file (YouTube, Spotify, Deezer, SoundCloud)

**Arguments :**
- `recherche` (**[Requis]**) : Titre de la chanson ou lien direct (YouTube, Spotify, Deezer, SoundCloud)

##### `/queue`
Affiche la file d'attente musicale actuelle du serveur

##### `/resume`
Reprend la lecture de la musique mise en pause

##### `/shuffle`
Mélange aléatoirement les pistes dans la file d'attente

##### `/skip`
Passe à la piste audio suivante dans la file d'attente

##### `/stop`
Arrête la musique, vide la file et quitte le salon vocal

##### `/volume`
Règle le volume de sortie sonore du bot (1 à 150%)

**Arguments :**
- `pourcentage` (**[Requis]**) : Niveau du volume entre 1 et 150

#### 📂 Catégorie `radio` (1 commande)

##### `/radio`
Web-radios thématiques 24h/24 en streaming continu dans les salons vocaux

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/radio stations` | - | Consulter la liste de toutes les web-radios disponibles |
| `/radio ecouter` | **station** | Lancer une station radio dans votre salon vocal actuel |
| `/radio arreter` | - | Arrêter la radio et faire quitter le bot du vocal |

#### 📂 Catégorie `voice` (1 commande)

##### `/voice`
Gestion des salons vocaux temporaires et personnalisés

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/voice setup` | **salon_hub**, *categorie*, *format_nom*, *limite_par_defaut* | Configure le salon déclencheur "➕ Créer un salon" (Admin) |
| `/voice nom` | **nouveau_nom** | Renomme votre salon vocal temporaire actuel |
| `/voice limite` | **nombre** | Définit la limite maximale de participants de votre salon |
| `/voice verrouiller` | - | Verrouille votre salon (rend l'accès privé) |
| `/voice deverrouiller` | - | Déverrouille votre salon (ouvert à tous) |
| `/voice autoriser` | **membre** | Autorise un utilisateur spécifique à rejoindre votre salon verrouillé |
| `/voice bloquer` | **membre** | Bloque et expulse un utilisateur de votre salon |
| `/voice transferer` | **nouveau_proprio** | Transfère la propriété de votre salon à un autre membre |
| `/voice stats` | - | Affiche les statistiques globales d'utilisation vocale du serveur |
| `/voice help` | - | Affiche l'aide et le guide complet des salons vocaux |

#### 📂 Catégorie `tempchannels` (1 commande)

##### `/tempchannel`
Gestion des salons textuels temporaires et espaces de discussion privés

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/tempchannel creer` | **nom**, *prive* | Créer un salon textuel temporaire éphémère |
| `/tempchannel inviter` | **membre** | Inviter un membre dans votre salon temporaire privé |
| `/tempchannel fermer` | - | Ferme et supprime immédiatement votre salon temporaire |

### ⚔️ 5. RPG, Niveaux, Économie & Profils

*Système d'XP Discord & Saez, économie virtuelle complète, bourse d'actifs et clans.*

#### 📂 Catégorie `level` (1 commande)

##### `/level`
Système de niveaux, XP, classement et rôles de paliers Anime

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/level rang` | *membre* | Consulter son niveau, son XP et sa progression |
| `/level classement` | *limite* | Classement des membres les plus actifs (Niveaux & XP) |
| `/level roles` | - | Afficher la liste des rôles de palier (10 à 50) |
| `/level donner-xp` | **membre**, **xp** | Ajouter de l'XP à un membre (Staff) |
| `/level config` | *salon_annonces*, *annonces_actives*, *xp_min*, *xp_max*, *xp_vocal* | Consulter et modifier la configuration du système de niveaux et XP |

#### 📂 Catégorie `profil` (1 commande)

##### `/profile`
Affiche la fiche de profil anime complète d'un membre avec badges et niveau

**Arguments :**
- `membre` (*[Optionnel]*) : Membre à consulter

#### 📂 Catégorie `leaderboard` (1 commande)

##### `/top`
Consulter les classements communautaires du serveur

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/top activite` | *limite* | Classement des membres les plus actifs (messages et vocal) |
| `/top quiz` | *limite* | Classement des meilleurs joueurs aux quiz et mini-jeux |
| `/top concours` | *limite* | Classement des membres ayant remporté le plus de concours et giveaways |
| `/top equipes` | *limite* | Classement des équipes et clans du serveur |

#### 📂 Catégorie `economie` (1 commande)

##### `/eco`
Système complet d'économie virtuelle communautaire Saez Coins

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/eco balance` | *membre* | Consulter votre solde ou celui d'un autre membre |
| `/eco daily` | - | Récupérer votre récompense quotidienne (toutes les 24h) |
| `/eco weekly` | - | Récupérer votre récompense hebdomadaire (tous les 7 jours) |
| `/eco shop` | *categorie*, *page* | Explorer la boutique officielle Saez (rôles, badges, boosters et cosmétiques) |
| `/eco buy` | **item_id** | Acheter un article de la boutique |
| `/eco inventaire` | *membre* | Afficher vos objets, rôles et badges achetés |
| `/eco top` | *limite* | Classement des membres les plus riches du serveur |
| `/eco manage` | **membre**, **montant**, *raison* | Administration : créditer ou débiter des pièces (Staff) |

#### 📂 Catégorie `stockmarket` (1 commande)

##### `/bourse`
Simulateur boursier et investissement financier (Actions & Cryptos)

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/bourse cours` | *actif* | Consulter les cours actuels des actions et cryptomonnaies |
| `/bourse acheter` | **actif**, **montant_pieces** | Investir vos pièces Saez dans un actif financier |
| `/bourse vendre` | **actif**, **unites** | Revendre vos parts et encaisser des pièces sur votre solde |
| `/bourse portefeuille` | - | Consulter la valeur totale de votre portefeuille financier |

#### 📂 Catégorie `teams` (1 commande)

##### `/team`
Gestion des équipes et clans du serveur

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/team creer` | **nom**, **tag**, *description* | Créer une nouvelle équipe ou guilde sur le serveur |
| `/team rejoindre` | **nom** | Rejoindre une équipe existante sur le serveur |
| `/team quitter` | - | Quitter votre équipe actuelle |
| `/team info` | **nom** | Afficher les détails et statistiques d'une équipe |
| `/team classement` | - | Afficher le classement des équipes du serveur |

### 🎫 6. Support, Assistance & Organisation

*Gestion des tickets de support privés, base de connaissances et gestionnaire de tâches.*

#### 📂 Catégorie `support` (2 commandes)

##### `/support`
Centre d'assistance officiel et aide interactive Saez Animes

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/support hub` | - | Affiche le centre d'assistance interactif avec FAQ, Diagnostic et Tickets |
| `/support panel` | *salon* | Déployer le panneau fixe d'Assistance & Support (remplace le panneau de ticket) |
| `/support diag` | - | Effectue un diagnostic en direct de tous les services et serveurs Saez |
| `/support contact` | **message** | Envoyer une alerte d'aide à l'équipe de support et aux helpers |
| `/support help` | - | Affiche la liste des commandes et options du support |

##### `/ticket`
Système de gestion des tickets Saez Support avec transcripts et priorités

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/ticket panel` | *salon* | Envoie le panneau d'ouverture de ticket interactif |
| `/ticket close` | *raison* | Ferme le ticket actuel et génère un transcript archivé |
| `/ticket transcript` | - | Génère et télécharge le transcript complet des messages de ce ticket |
| `/ticket priority` | **niveau** | Définir le niveau d'urgence / priorité du ticket (Staff) |
| `/ticket add` | **membre** | Ajoute un utilisateur au ticket actuel |
| `/ticket remove` | **membre** | Retire un utilisateur du ticket actuel |
| `/ticket claim` | - | Prendre en charge le ticket actuel (Staff) |
| `/ticket config` | *categorie*, *role_support*, *anti_staff_ping*, *max_pings* | Configure la catégorie et le rôle staff pour les tickets |

#### 📂 Catégorie `tags` (1 commande)

##### `/tag`
Bibliothèque de macros et réponses pré-enregistrées du serveur

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/tag afficher` | **nom** | Afficher le contenu d'un tag |
| `/tag creer` | **nom**, **contenu** | Créer ou modifier une macro/tag d'entraide |
| `/tag liste` | - | Consulter la liste de tous les tags créés sur le serveur |
| `/tag supprimer` | **nom** | Supprimer un tag existant |

#### 📂 Catégorie `knowledge` (1 commande)

##### `/kb`
Base de connaissances officielle et centre d'aide Saez Animes

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/kb search` | **requete** | Recherche un article ou un guide par mot-clé |
| `/kb categories` | - | Lister toutes les rubriques de la base de connaissances |
| `/kb article` | **id** | Consulter directement un article par son identifiant |

#### 📂 Catégorie `schedule` (1 commande)

##### `/schedule`
Organisation et planning des activités du serveur

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/schedule planning` | - | Consulter le calendrier complet des activités prévues |
| `/schedule prochaines` | - | Aperçu rapide des prochaines activités à venir |
| `/schedule ajouter` | **titre**, **date**, **heure**, *description*, *salon* | Ajouter une nouvelle activité au calendrier |
| `/schedule participer` | **id** | S'inscrire ou se désinscrire d'une activité prévue |
| `/schedule annuler` | **id** | Annuler et supprimer une activité du planning |

#### 📂 Catégorie `tasks` (1 commande)

##### `/task`
Gestionnaire personnel de tâches et To-Do list

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/task ajouter` | **titre** | Ajouter une nouvelle tâche personnelle |
| `/task liste` | - | Afficher votre liste de tâches personnelles |
| `/task terminer` | **id** | Marquer une tâche comme terminée |
| `/task supprimer` | **id** | Supprimer définitivement une tâche |

### 🎲 7. Jeux, Mini-Jeux & Tournois

*Divertissements communautaires, casse-têtes, salon de comptage, stats de jeux et tournois.*

#### 📂 Catégorie `fun` (1 commande)

##### `/fun`
Centre de mini-jeux et divertissements communautaires Saez Animes

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/fun roll` | *faces* | Lancer un dé aléatoire (ex: D6, D20, D100) |
| `/fun coinflip` | - | Lancer une pièce de monnaie (Pile ou Face) |
| `/fun 8ball` | **question** | Poser une question à la Boule Magique 8-Ball |
| `/fun shifumi` | *adversaire* | Pierre, Feuille, Ciseaux interactif contre le Bot ou un membre |
| `/fun morpion` | *adversaire* | Partie interactive de Morpion (Tic-Tac-Toe) |
| `/fun quiz` | - | Lancer un quiz anime instantané avec 4 propositions |
| `/fun guess` | - | Deviner l'animé à partir d'une silhouette ou d'un indice |
| `/fun games` | - | Menu interactif de tous les jeux communautaires disponibles |
| `/fun channel` | *salon* | Configurer le salon officiel réservé aux mini-jeux (Admin) |

#### 📂 Catégorie `games` (1 commande)

##### `/jouer`
Jeux communautaires et mini-jeux interactifs en direct

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/jouer quiz` | - | Partie interactive de quiz Otaku & Geek avec scoring en direct |
| `/jouer duel` | **adversaire** | Duel tactique au tour par tour contre un autre membre (Attaque, Défense, Soin, Ultime) |
| `/jouer mot-mystere` | - | Faites deviner un mot anime lettre par lettre dans le salon |
| `/jouer justeprix` | - | Trouver le nombre secret entre 1 et 500 dans le salon |

#### 📂 Catégorie `cassetete` (1 commande)

##### `/cassetete`
Casse-têtes, échecs, sudoku, énigmes et jeux de réflexion

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/cassetete aide` | - | Afficher le guide complet et les règles de tous les casse-têtes |
| `/cassetete liste` | - | Consulter la liste de tous les jeux de réflexion disponibles |
| `/cassetete echecs` | *action*, *adversaire*, *coup_texte* | Jouer aux échecs (1v1 ou contre IA) ou résoudre un problème tactique |
| `/cassetete sudoku` | *action*, *difficulte*, *coord*, *valeur* | Jouer au Sudoku : générer, remplir, notes et indices |
| `/cassetete mots` | *mode*, *reponse* | Jeux de lettres : anagrammes, mot mystère (motus) et pendu |
| `/cassetete logique` | *action*, *reponse* | Énigmes et casse-têtes de logique avec indices et vérification |
| `/cassetete mastermind` | *action*, *proposition* | Deviner la combinaison secrète de 4 pions avec indices |
| `/cassetete demineur` | *action*, *coord*, *difficulte* | Grille de démineur classique |
| `/cassetete puissance4` | *action*, *adversaire* | Jeu Puissance 4 interactif à boutons |
| `/cassetete morpion` | *adversaire* | Morpion interactif 3x3 à boutons (Solo IA ou 1v1) |
| `/cassetete 2048` | *action* | Jeu 2048 interactif avec boutons directionnels |
| `/cassetete hanoi` | *action*, *source*, *destination*, *disques* | Résoudre la Tour de Hanoï en déplaçant les disques |
| `/cassetete calcul` | *mode*, *formule* | Le Compte est Bon & Calcul mental chronométré |
| `/cassetete duel` | **action**, **jeu**, **adversaire** | Lancer ou gérer un duel de réflexion avec un autre membre |
| `/cassetete partie` | **action** | Consulter, reprendre ou abandonner sa session de réflexion en cours |
| `/cassetete quotidien` | *reponse* | Accéder au défi de réflexion du jour et remporter de l'XP |
| `/cassetete classement` | - | Afficher les meilleurs stratèges et le classement Elo de réflexion |
| `/cassetete profil` | *membre* | Consulter ses statistiques de réflexion, ratio de victoires et séries |

#### 📂 Catégorie `counting` (1 commande)

##### `/comptage`
Jeu de comptage communautaire et défis de calcul

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/comptage salon` | **cible** | Définir le salon officiel dédié au jeu de comptage |
| `/comptage score` | - | Afficher le nombre actuel et le record historique du serveur |
| `/comptage reset` | - | [Admin] Réinitialiser le compteur à 0 avec sauvegarde préalable |
| `/comptage aide` | - | Afficher l'aide complète et la liste des commandes |

#### 📂 Catégorie `gamestats` (1 commande)

##### `/gamestats`
Profils de joueurs et statistiques compétitives de jeux vidéo

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/gamestats minecraft` | **pseudo** | Consulter la fiche Minecraft officielle d'un joueur (Skin, UUID, Historique) |
| `/gamestats valorant` | **pseudo**, *tag* | Statistiques et rang d'un joueur Valorant |
| `/gamestats apex` | **pseudo** | Statistiques d'un joueur Apex Legends |
| `/gamestats lier` | **jeu**, **pseudo_en_jeu** | Enregistrer vos pseudos de jeu sur votre profil Discord |

#### 📂 Catégorie `tournament` (1 commande)

##### `/tournoi`
Gestionnaire complet de tournois e-sport & compétitions sur le serveur

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/tournoi creer` | **titre**, **jeu**, *max_joueurs* | Créer un nouveau tournoi avec inscriptions ouvertes |
| `/tournoi inscrire` | **tournoi_id** | S'inscrire au tournoi en cours |
| `/tournoi liste` | - | Afficher la liste des tournois actifs et leurs participants |
| `/tournoi cloturer` | **tournoi_id**, **vainqueur** | [Admin] Clôturer un tournoi et annoncer le grand vainqueur |

#### 📂 Catégorie `roleplay` (1 commande)

##### `/roleplay`
Système de Jeu de Rôle (JDR / RPG), lancers de dés et fiches d'aventurier

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/roleplay des` | **formule** | Lancer un ou plusieurs dés de jeu de rôle (ex: 1d20, 3d6, 1d100) |
| `/roleplay fiche` | **nom**, **classe** | Créer ou consulter votre fiche de personnage Roleplay |
| `/roleplay action` | **description** | Tenter une action risquée avec un jet de dé 20 sous tension |

### 🤝 8. Vie Communautaire, Débats & Événements

*Espace d'expression et d'interaction pour la communauté Saez.*

#### 📂 Catégorie `communaute` (6 commandes)

##### `/candidature`
Gestion complète des candidatures et du recrutement communautaire

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/candidature deposer` | **role**, **motivation**, *experience*, *disponibilite* | Déposer une candidature formelle pour un rôle du serveur |
| `/candidature brouillon` | **role**, **motivation**, *experience*, *disponibilite* | Enregistrer un brouillon pour peaufiner votre candidature avant envoi |
| `/candidature mes-candidatures` | - | Consulter l'historique et le statut de vos candidatures personnelles |
| `/candidature statut` | **dossier** | Vérifier l'avancement d'une candidature via son numéro de dossier |
| `/candidature annuler` | **dossier** | Annuler une candidature en attente d'examen |
| `/candidature modeles` | **role** | Consulter les questions et attentes types pour chaque rôle |
| `/candidature examiner` | **dossier**, **decision**, *motif* | Prendre une décision sur une candidature (Staff) |
| `/candidature statistiques` | - | Consulter les indicateurs de recrutement et délais moyens de traitement (Staff) |

##### `/communaute`
Hub central de la vie communautaire Saez : entraide, débats, réputation, anniversaires...

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/communaute postuler` | **role**, **motivation**, *experience*, *disponibilite* | Déposer une candidature de recrutement (Modérateur, Animateur, Helper...) |
| `/communaute candidatures` | *statut* | Consulter et examiner les candidatures reçues sur le serveur (Staff) |
| `/communaute anniversaire` | **jour**, **mois**, *annee*, *afficher_age*, *visibilite* | Enregistrer ou mettre à jour votre date d'anniversaire |
| `/communaute anniversaires` | - | Afficher les anniversaires du jour et à venir de la communauté |
| `/communaute anniversaire-test` | *membre* | Tester la publication d'une annonce d'anniversaire (Staff / Admin) |
| `/communaute reputation` | **membre**, *raison* | Donner 1 point de réputation à un membre pour son aide ou sa bienveillance |
| `/communaute top-reputation` | *periode* | Classement des membres les plus réputés et recommandés |
| `/communaute confession` | *message*, *categorie*, *anonyme* | Envoyer une confession (anonyme ou signée) dans le salon dédié |
| `/communaute confessions` | - | Consulter les dernières confessions publiées sur le serveur |
| `/communaute debat` | **sujet**, *description*, *duree* | Lancer un débat structuré avec vote interactif en temps réel |
| `/communaute debats` | - | Afficher les débats actifs ou récents de la communauté |
| `/communaute mentorat` | **action**, *domaine* | Programme de parrainage et mentorat entre membres |
| `/communaute objectifs` | *action*, *titre*, *cible*, *unite* | Consulter ou contribuer aux objectifs collectifs du serveur |
| `/communaute merci` | **membre**, **message**, *categorie* | Remercier chaleureusement un membre de la communauté |
| `/communaute mur-merci` | - | Consulter les remerciements publics récents (Mur de la Gratitude) |
| `/communaute presentation` | *membre*, *bio*, *animes_favoris* | Créer, consulter ou modifier votre présentation personnelle |
| `/communaute interets` | **interet** | Rechercher des membres volontaires partageant vos centres d'intérêt |
| `/communaute compatibilite` | **membre** | Découvrir vos points communs et centres d'intérêt partagés avec un membre |
| `/communaute brise-glace` | - | Générer une question amusante ou profonde pour relancer les échanges |
| `/communaute entraide` | *action*, *titre*, *domaine*, *description* | Publier une demande d'entraide ou consulter les demandes ouvertes |
| `/communaute souvenirs` | - | Consulter la chronologie des moments forts et le livre d'or du serveur |
| `/communaute config` | *salon_anniversaires*, *salon_confessions*, *salon_candidatures*, *validation_confessions*, *module_actif* | Configurer les salons, rôles et options de la vie communautaire (Staff) |
| `/communaute statistiques` | - | Afficher les statistiques agrégées de la vie communautaire |
| `/communaute confidentialite` | *supprimer_mes_donnees* | Consulter vos données communautaires enregistrées ou les purger (Droit à l'oubli) |
| `/communaute aide` | - | Guide complet et interactif de toutes les fonctionnalités communautaires |

##### `/confession`
Système de confessions communautaires (anonymes ou signées) avec modération

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/confession envoyer` | *message*, *categorie*, *anonyme* | Publier une confession anonyme ou signée |
| `/confession supprimer` | **confession_id**, **cle_secrete** | Supprimer votre confession anonyme grâce à votre clé secrète |
| `/confession signaler` | **confession_id**, **motif** | Signaler une confession problématique aux modérateurs |
| `/confession moderer` | **confession_id**, **action**, *raison* | Valider ou rejeter une confession en attente de modération (Staff) |

##### `/debat`
Organisation et animation de débats communautaires structurés et argumentés

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/debat creer` | **sujet**, *description*, *duree* | Lancer un débat structuré avec vote interactif en temps réel |
| `/debat argumenter` | **debat_id**, **position**, **argument** | Publier un argument formel lié à un débat existant |
| `/debat resultats` | **debat_id** | Consulter les votes et arguments détaillés d'un débat |
| `/debat cloturer` | **debat_id** | Clôturer un débat actif et figer le résultat définitif |

##### `/entraide`
Espace d'entraide communautaire, partage de compétences et dépannage entre membres

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/entraide demander` | **titre**, **description**, *domaine* | Publier une demande d'aide à la communauté |
| `/entraide liste` | *statut* | Consulter la liste des demandes d'entraide en cours |
| `/entraide aider` | **demande_id** | Se porter volontaire pour aider sur une demande |
| `/entraide terminer` | **demande_id** | Marquer votre demande comme résolue |

##### `/mentorat`
Système approfondi de mentorat et d'accompagnement entre membres

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/mentorat devenir` | **domaine**, **bio**, *disponibilite*, *max_personnes* | S'inscrire en tant que mentor volontaire sur le serveur |
| `/mentorat chercher` | *domaine* | Rechercher des mentors disponibles selon vos besoins |
| `/mentorat demander` | **mentor**, **objectifs**, **domaine** | Envoyer une demande d'accompagnement à un mentor volontaire |
| `/mentorat mes-accompagnements` | - | Consulter vos parrainages actifs en cours (en tant que mentor ou mentoré) |
| `/mentorat note-privee` | **accompagnement**, **note** | Ajouter une note personnelle strictement confidentielle sur votre accompagnement |

#### 📂 Catégorie `evenements` (1 commande)

##### `/event`
Gestion des événements communautaires du serveur

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/event creer` | **titre**, **description**, **date**, *salon*, *max_participants*, *banniere* | Créer et annoncer un événement communautaire |
| `/event liste` | - | Afficher la liste des prochains événements programmés |
| `/event participants` | **id** | Afficher la liste complète des membres inscrits |
| `/event annuler` | **id**, *raison* | Annuler un événement programmé |
| `/event historique` | *limite* | Afficher l'historique des événements passés |
| `/event help` | - | Guide et aide du système d'événements |

#### 📂 Catégorie `giveaways` (1 commande)

##### `/giveaway` *(Permission requise : 32)*
Système complet de concours, tirages au sort et cadeaux

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/giveaway start` | **prix**, **duree**, *gagnants*, *salon*, *description*, *role_requis* | Lance un nouveau concours avec compte à rebours et bouton de participation |
| `/giveaway end` | *message_id* | Termine immédiatement un concours en cours et tire les gagnants |
| `/giveaway reroll` | *message_id* | Tire au sort de nouveaux gagnants pour un concours déjà terminé |
| `/giveaway list` | - | Affiche la liste de tous les concours actifs sur ce serveur |

#### 📂 Catégorie `polls` (1 commande)

##### `/poll`
Crée un sondage communautaire avancé avec votes en direct et statistiques

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/poll creer` | **question**, **option_1**, **option_2**, *option_3*, *option_4*, *anonyme* | Créer un nouveau vote interactif |
| `/poll help` | - | Guide des fonctionnalités de sondage |

#### 📂 Catégorie `starboard` (1 commande)

##### `/starboard`
Tableau d'honneur communautaire des messages cultes (Starboard)

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/starboard salon` | **cible** | Définir le salon où seront publiés les messages étoilés |
| `/starboard seuil` | **nombre** | Définir le nombre d'étoiles (réactions) requis pour être publié |
| `/starboard emoji` | **symbole** | Personnaliser l'emoji de vote (par défaut : ⭐) |
| `/starboard statut` | **actif** | Activer ou désactiver le Starboard sur le serveur |
| `/starboard infos` | - | Afficher la configuration actuelle et les meilleurs messages du Starboard |

#### 📂 Catégorie `invites` (1 commande)

##### `/invites`
Consulte les statistiques et le nombre d'invitations d'un membre

**Arguments :**
- `membre` (*[Optionnel]*) : Membre à consulter

### 🎨 9. Créativité, Médias, Études & Outils Utiles

*Boîte à outils avancée pour le quotidien, le développement, les études et les médias.*

#### 📂 Catégorie `creativite` (1 commande)

##### `/creativite`
Atelier de création Saez : livres, recettes, écriture, etc.

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/creativite hub` | - | Menu interactif principal de l'espace créatif |
| `/creativite explorer` | - | Découvrir tous les ateliers |
| `/creativite statistiques` | - | Bilan créatif personnel |
| `/creativite aide` | - | Guide d'utilisation interactif |
| `/creativite exporter` | *format* | Télécharger vos créations en JSON ou Markdown |
| `/creativite importer` | **fichier** | Importer des créations depuis un fichier JSON |
| `/creativite rechercher` | **terme** | Recherche transversale dans vos créations |

**Groupe `lecture` :** Bibliothèque personnelle et suivi de lecture

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/creativite lecture ajouter` | **titre**, *auteur*, *categorie*, *tome_actuel*, *total_tomes*, *note*, *tags* | Enregistrer un livre ou manga |
| `/creativite lecture liste` | *statut* | Liste de vos livres et mangas |
| `/creativite lecture session` | **id**, *tomes_lus*, *pages_lues*, *minutes*, *note* | Enregistrer une session de lecture |
| `/creativite lecture consulter` | **id** | Fiche détaillée d'un livre |
| `/creativite lecture supprimer` | **id** | Retirer un livre |
| `/creativite lecture club` | **action**, *nom_ou_titre* | Clubs de lecture |

**Groupe `recette` :** Livre de cuisine

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/creativite recette ajouter` | **titre**, **ingredients**, **etapes**, *categorie*, *portions*, *temps*, *difficulte* | Partager une nouvelle recette |
| `/creativite recette consulter` | **id** | Fiche d'une recette |
| `/creativite recette rechercher` | **terme** | Rechercher une recette |
| `/creativite recette portions` | **id**, **personnes** | Recalculer les portions |
| `/creativite recette courses` | **id** | Liste de courses depuis une recette |
| `/creativite recette aleatoire` | *categorie* | Recette aléatoire |

**Groupe `histoire` :** Atelier d'écriture et chapitres

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/creativite histoire creer` | **titre**, *genre*, *resume*, *objectif_mots* | Créer une histoire ou roman |
| `/creativite histoire chapitre` | **histoire_id**, **titre_chapitre**, **contenu**, *numero* | Ajouter un chapitre |
| `/creativite histoire lire` | **histoire_id**, *chapitre* | Lire les chapitres d'une histoire |
| `/creativite histoire ecrire` | **phrase** | Ajouter une phrase au conte collectif |
| `/creativite histoire personnage` | **histoire_id**, **nom**, **role**, **description** | Ajouter un personnage |

**Groupe `lettre` :** Rédaction de lettres cachetées

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/creativite lettre rediger` | **titre**, **contenu**, *destinataire*, *tonalite* | Rédiger une lettre |
| `/creativite lettre consulter` | **id** | Consulter une lettre |
| `/creativite lettre modeles` | - | Modèles de lettres prédéfinis |
| `/creativite lettre liste` | - | Vos lettres et brouillons |

**Groupe `poesie` :** Atelier poésie

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/creativite poesie creer` | **titre**, **texte**, *forme*, *theme* | Composer un poème ou haïku |
| `/creativite poesie rimes` | **mot** | Dictionnaire de suggestions de rimes |
| `/creativite poesie syllabes` | **vers** | Compteur de syllabes d'un vers |
| `/creativite poesie liste` | - | Consulter vos poèmes |

**Groupe `worldbuilding` :** Conception d'univers fictifs

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/creativite worldbuilding univers` | **nom**, **genre**, **description** | Créer un univers fictif |
| `/creativite worldbuilding element` | **titre**, **categorie**, **description**, *univers_id* | Ajouter une faction, magie ou lieu |
| `/creativite worldbuilding liste` | *univers_id* | Explorer les éléments d'un univers |
| `/creativite worldbuilding coherence` | **univers_id** | Cohérence de votre univers |

**Groupe `collection` :** Gestionnaire d'inventaire de collectionneur

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/creativite collection ajouter` | **nom**, **categorie**, *rarete*, *etat*, *valeur* | Ajouter un objet à votre collection |
| `/creativite collection liste` | *categorie* | Consulter votre collection |
| `/creativite collection stats` | - | Statistiques d'inventaire |
| `/creativite collection supprimer` | **id** | Retirer un objet |

**Groupe `inspiration` :** Générateurs d'idées et défis

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/creativite inspiration aleatoire` | *domaine* | Générer une idée créative |
| `/creativite inspiration defi` | *frequence* | Défi créatif du jour |
| `/creativite inspiration carnet` | *texte*, *domaine* | Consulter ou ajouter au carnet d'idées |

**Groupe `projet` :** Projets créatifs en équipe

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/creativite projet creer` | **titre**, *type*, *description* | Lancer un projet collaboratif |
| `/creativite projet liste` | - | Consulter les projets créatifs actifs |
| `/creativite projet rejoindre` | **id**, *role* | Rejoindre un projet créatif |
| `/creativite projet tache` | **id**, **titre**, *assigne_a* | Ajouter une tâche à un projet |

**Groupe `galerie` :** Galerie de partage des œuvres

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/creativite galerie explorer` | *type* | Parcourir les créations partagées |
| `/creativite galerie publier` | **type**, **id**, **titre**, *description* | Publier une création dans la galerie |

#### 📂 Catégorie `media` (1 commande)

##### `/media`
Outils de recherche et de création de médias visuels

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/media image` | **sujet** | Rechercher un fond d'écran ou une illustration haute définition |
| `/media gif` | **sujet** | Rechercher une animation GIF |
| `/media meme` | **haut**, *bas*, *modele* | Générer un mème avec du texte personnalisé |
| `/media info` | **fichier** | Analyser les métadonnées et dimensions d'une image |

#### 📂 Catégorie `devlab` (1 commande)

##### `/devlab`
Outils développeur, tests d'API, snippets, regex, couleurs et données

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/devlab snippet` | **langage**, **code** | Partager un extrait de code propre avec syntaxe colorée |
| `/devlab regex` | **motif**, **texte** | Tester une expression régulière sur une chaîne de caractères |
| `/devlab api` | **url** | Tester une requête HTTP GET vers une API publique |
| `/devlab hash` | **texte** | Générer les empreintes cryptographiques SHA256 et MD5 d'un texte |
| `/devlab couleur` | **hex** | Générer une palette de couleurs ou convertir HEX en RGB / HSL |
| `/devlab qrstudio` | **ssid**, **motdepasse** | Générer un QR code de connexion WiFi sécurisé ou vCard |
| `/devlab convertisseur` | **json** | Valider et formater du code JSON ou convertir en aperçu de table |

#### 📂 Catégorie `etudes` (1 commande)

##### `/etudes`
Scolaire, sciences & révisions : flashcards, examens, maths, géographie, sciences...

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/etudes flashcard` | **question**, **reponse**, *paquet* | Créer une carte mémoire pour réviser |
| `/etudes reviser` | *paquet* | Tirer une flashcard au sort pour s'auto-évaluer |
| `/etudes examen` | **nom**, **date** | Ajouter un compte à rebours d'épreuve ou d'examen |
| `/etudes maths` | **operation**, **valeur_a**, *valeur_b* | Résolution mathématique, trigonométrie et géométrie |
| `/etudes geographie` | **pays** | Fiche ou quiz sur un pays du monde (capitale, continent, drapeau) |
| `/etudes sciences` | **element** | Consulter les constantes fondamentales ou le tableau périodique |
| `/etudes frappe` | - | Mesurer votre vitesse de frappe au clavier (Typing Test WPM) |

#### 📂 Catégorie `lifestyle` (1 commande)

##### `/lifestyle`
Organisation & vie quotidienne : sport, habitudes, animaux, plantes, voyages, wishlist...

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/lifestyle fitness` | **activite**, **duree**, *calories* | Enregistrer une séance de sport ou entraînement physique |
| `/lifestyle habitude` | **nom** | Cocher votre habitude quotidienne et maintenir votre streak |
| `/lifestyle mes-habitudes` | - | Afficher vos habitudes et vos séries de jours consécutifs |
| `/lifestyle focus` | **minutes** | Lancer une session de travail ou révision Pomodoro |
| `/lifestyle animal` | **nom**, **espece**, *photo*, *description* | Créer une fiche profil pour votre animal de compagnie |
| `/lifestyle plante` | **nom**, **frequence_jours** | Ajouter une plante à soigner et surveiller son arrosage |
| `/lifestyle voyage` | **destination**, **duree**, *activites* | Créer un carnet d'itinéraire ou voyage de rêve |
| `/lifestyle wishlist` | **article**, *prix*, *lien* | Ajouter un souhait, cadeau ou manga à votre liste d'envies |
| `/lifestyle journal` | **texte** | Écrire une entrée dans votre journal intime personnel privé (chiffré) |

#### 📂 Catégorie `languages` (1 commande)

##### `/langue`
Outils linguistiques, traduction et compréhension des langues

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/langue traduire` | **texte**, **vers** | Traduire un texte dans une autre langue |
| `/langue detecter` | **texte** | Détecter automatiquement la langue d'un texte |
| `/langue dictionnaire` | **mot** | Définition, synonymes et phonétique d'un mot |
| `/langue liste` | - | Afficher la liste des langues prises en charge |

#### 📂 Catégorie `timezone` (1 commande)

##### `/fuseau`
Gestion des fuseaux horaires mondiaux et horloge locale des membres

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/fuseau definir` | **zone** | Enregistrer votre fuseau horaire personnel |
| `/fuseau heure` | *membre* | Afficher l'heure locale actuelle d'un membre |
| `/fuseau timestamp` | **date_heure** | Générer des codes de date Discord dynamiques synchronisés (<t:...>) |

#### 📂 Catégorie `bookmarks` (1 commande)

##### `/bookmark`
Système complet de marque-pages, collections, favoris et partage

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/bookmark ajouter` | **titre**, **url**, *collection*, *tags*, *note*, *favori*, *prive* | Enregistrer un nouveau marque-page ou lien utile |
| `/bookmark liste` | *collection*, *filtre*, *tri*, *page* | Afficher la liste de vos marque-pages et favoris |
| `/bookmark partager` | **id**, *membre* | Partager publiquement un de vos favoris dans le salon |
| `/bookmark supprimer` | **id** | Supprimer définitivement un marque-page de vos favoris |
| `/bookmark modifier` | **id**, *titre*, *url*, *description*, *collection*, *tags*, *note* | Modifier les informations d'un marque-page |
| `/bookmark details` | **id** | Afficher la fiche technique complète d'un marque-page |
| `/bookmark rechercher` | **terme**, *collection* | Recherche multi-critères parmi vos marque-pages |
| `/bookmark ouvrir` | **id** | Accéder directement au lien et incrémenter le compteur de visites |
| `/bookmark favori` | **id**, *action* | Gérer le statut de favori prioritaire ⭐ |
| `/bookmark archiver` | **id**, *action* | Archiver ou restaurer un marque-page sans le supprimer |
| `/bookmark epingler` | **id**, *action* | Épingler ou désépingler un marque-page important |
| `/bookmark deplacer` | **id**, **collection**, *mode* | Déplacer ou copier un marque-page vers une collection |
| `/bookmark dupliquer` | **id**, *nouveau_titre* | Créer un doublon volontaire d'un marque-page |
| `/bookmark aleatoire` | *nombre*, *collection* | Tirer au sort un ou plusieurs marque-pages de votre collection |
| `/bookmark note` | **id**, *texte* | Consulter, ajouter ou modifier une note personnelle privée |
| `/bookmark exporter` | *format*, *uniquement_favoris* | Exporter tous vos marque-pages en fichier JSON ou CSV |
| `/bookmark importer` | **fichier**, *doublons* | Importer des marque-pages depuis un fichier JSON |
| `/bookmark statistiques` | - | Consulter vos statistiques complètes d'utilisation des marque-pages |
| `/bookmark verifier` | **id** | Tester la disponibilité HTTP/HTTPS d'un marque-page |
| `/bookmark doublons` | - | Rechercher les liens et URLs en double dans votre collection |
| `/bookmark historique` | *limite* | Consulter l'historique d'audit de vos actions sur les marque-pages |
| `/bookmark parametres` | *action* | Consulter vos quotas de stockage et préférences personnelles |
| `/bookmark aide` | - | Guide d'utilisation complet et documentation du module Bookmark |

**Groupe `collection` :** Organisation et gestion de vos collections thématiques

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/bookmark collection creer` | **nom**, *description*, *emoji* | Créer une nouvelle collection de marque-pages |
| `/bookmark collection liste` | - | Afficher la liste de vos collections et leur contenu |
| `/bookmark collection modifier` | **id**, *nom*, *description*, *emoji* | Modifier une collection existante |
| `/bookmark collection supprimer` | **id**, *supprimer_liens* | Supprimer une collection |
| `/bookmark collection ajouter` | **id**, **collection_id** | Ajouter un marque-page à une collection |
| `/bookmark collection retirer` | **id** | Retirer un marque-page de sa collection actuelle |

**Groupe `tag` :** Classement et filtrage par tags et mots-clés

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/bookmark tag liste` | - | Afficher tous vos tags avec le nombre de liens associés |
| `/bookmark tag ajouter` | **id**, **tag** | Ajouter un tag à un marque-page existant |
| `/bookmark tag retirer` | **id**, **tag** | Retirer un tag d'un marque-page |
| `/bookmark tag filtrer` | **tag** | Afficher tous les marque-pages associés à un tag |

#### 📂 Catégorie `news` (1 commande)

##### `/news`
Actualités et veille automatisée (Anime, Gaming, Tech et Recherche)

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/news anime` | - | Dernières sorties et tendances de l'animation japonaise via AniList |
| `/news gaming` | - | Grandes actualités des jeux vidéo et de l'industrie gaming |
| `/news tech` | - | Actualités technologiques, informatique et intelligence artificielle |
| `/news recherche` | **sujet** | Rechercher les actualités récentes sur un sujet précis |

#### 📂 Catégorie `embed` (1 commande)

##### `/embed`
Créateur avancé d'embeds interactifs, bannières et modèles

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/embed creer` | **titre**, **description**, *couleur*, *image_banniere*, *miniature*, *pied_de_page*, *salon* | Créer un embed sur-mesure avec prévisualisation avant publication |
| `/embed modeles` | **type**, *salon* | Charge un modèle d'embed pré-conçu avec mise en page professionnelle |
| `/embed help` | - | Guide d'utilisation et astuces du constructeur d'embeds |

#### 📂 Catégorie `utility` (1 commande)

##### `/outil`
Boîte à outils pratiques pour le serveur

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/outil calculatrice` | **calcul** | Évaluer une expression mathématique ou scientifique |
| `/outil convertir` | **valeur**, **type** | Convertir des unités de mesure ou des devises courantes |
| `/outil qrcode` | **contenu** | Générer un QR code scannable instantané |
| `/outil fuseau` | *ville* | Afficher l'heure actuelle dans les grandes capitales |
| `/outil motdepasse` | *longueur* | Générer un mot de passe sécurisé et aléatoire |

#### 📂 Catégorie `information` (1 commande)

##### `/info`
Informations détaillées sur les membres, le serveur, le bot, les salons et rôles

| Sous-commande | Arguments | Description |
| :--- | :--- | :--- |
| `/info user` | *membre* | Fiche détaillée d'un membre (rôles, date d'arrivée, avatar, badges) |
| `/info serveur` | - | Statistiques complètes du serveur (membres, salons, sécurité) |
| `/info bot` | - | État technique, latence, uptime et mémoire du bot Saez |
| `/info salon` | *salon* | Informations sur un salon textuel, vocal ou forum |
| `/info role` | **role** | Permissions, couleur et membres d'un rôle Discord |
| `/info avatar` | *membre* | Afficher l'avatar HD d'un membre |
| `/info banniere` | *membre* | Afficher la bannière personnalisée d'un membre |



---

## 📡 Gestionnaires d'Événements Discord (`events/`)

Le bot écoute et réagit en temps réel aux événements de l'API Discord :

| Événement | Fichier | Description |
| :--- | :--- | :--- |
| **`ready`** | `clientReady.js` | Connexion, démarrage de la présence streaming violette, initialisation des salons de stats et tâches de fond. |
| **`interactionCreate`** | `interactionCreate.js` | Routage des commandes slash, exécution des boutons interactifs, menus déroulants et formulaires modaux. |
| **`messageCreate`** | `messageCreate.js` | Bouclier temps réel : anti-liens/invites Discord, anti-insultes, anti-spam, gain d'XP et trigger de comptage. |
| **`messageUpdate`** | `messageUpdate.js` | Journal d'audit des messages modifiés (avant/après) et re-filtrage de sécurité sur le nouveau contenu. |
| **`messageDelete`** | `messageDelete.js` | Journal d'audit des suppressions de messages avec auteur, salon et contenu d'origine. |
| **`guildMemberAdd`** | `guildMemberAdd.js` | Accueil des nouveaux membres, assignation des auto-rôles, notification de bienvenue, anti-raid et mise à jour des compteurs. |
| **`guildMemberRemove`** | `guildMemberRemove.js` | Notification de départ, journal d'audit et actualisation instantanée des statistiques du serveur. |
| **`guildMemberUpdate`** | `guildMemberUpdate.js` | Suivi des changements de pseudo, surnom, ajouts et retraits de rôles dans les logs. |
| **`voiceStateUpdate`** | `voiceStateUpdate.js` | Création et suppression dynamique de salons vocaux temporaires, suivi de l'XP vocal et logs vocaux. |
| **`channelCreate`** | `channelCreate.js` | Enregistrement de la création de salons textuels, vocaux ou catégories dans les logs du serveur. |
| **`channelDelete`** | `channelDelete.js` | Enregistrement de la suppression de salons avec archivage. |
| **`roleCreate`** | `roleCreate.js` | Journalisation de la création de nouveaux rôles. |
| **`roleDelete`** | `roleDelete.js` | Journalisation de la suppression de rôles. |

---

## ⚙️ Services & Logique Métier (`services/`)

L'application repose sur une couche de services indépendants et modulaires :

- **`channelSyncService.js`** : Synchronisation continue des compteurs des salons vocaux statistiques avec l'API Discord et MongoDB.
- **`presenceService.js`** : Statut d'activité streaming cyclique reflétant l'usage en direct de Saez Animes.
- **`securityService.js`** : Analyse des expressions régulières anti-liens d'invitations (`discord.gg`, `dsc.gg`, etc.), détection du flood et gestion des mots bannis.
- **`moderationService.js`** : Gestion des sanctions, envoi de notifications DM personnalisées aux membres et historisation des warns.
- **`backupService.js` & `backupSchedulerService.js`** : Capture complète des rôles, permissions et salons du serveur, stockage JSON chiffré et restauration assistée.
- **`musicService.js`** : Moteur de streaming musical multi-plateformes avec décodage audio temps réel et égalisation.
- **`ticketService.js`** : Cycle de vie complet des salons de support (création, droits d'accès, priorités, transcript, clôture).
- **`discordLevelService.js`** : Calcul d'expérience textuelle/vocale avec cooldown, courbes de niveau et attribution automatique de rôles.
- **`economyService.js` & `stockMarketService.js`** : Banques virtuelles, transactions de pièces, inventaire et cours d'actions boursières évolutifs.
- **`animePartyService.js` & `creativeHubService.js`** : Moteurs de jeu Otaku, gestion des lobbies multijoueurs, scores et créations communautaires.
- **`suggestionService.js`** : Système de feedback bidirectionnel reliant le serveur Discord aux développeurs de Saez Animes.

---

## 🛡️ Sécurité & Système Anti-Raid

1. **Bouclier Anti-Invitations & Liens :**
   - Interception immédiate des formats `discord.gg/code`, `discord.com/invite/code`, `discordapp.com/invite/code`, `dsc.gg/code`, `invite.gg/code`, `discord.me/code` et des graphies obfusquées (`discord(dot)gg`, `discord,gg`).
   - Suppression du message, avertissement automatique et journalisation dans le salon de logs configuré.

2. **Protection Anti-Spam & Anti-Flood :**
   - Suivi temporel des messages par utilisateur. En cas de dépassement du seuil configuré, mise en sourdine temporaire automatique (Timeout).

3. **Protection Anti-Raid :**
   - Détection des vagues d'arrivées massives anormales de nouveaux membres en un court laps de temps, avec verrouillage automatique ou notification d'alerte urgente au staff.

---

## ❓ Dépannage & FAQ

<details>
<summary><b>1. Pourquoi les salons de statistiques vocaux ne se renomment pas immédiatement ?</b></summary>

Discord applique un **rate-limit strict** de 2 modifications de nom de salon par période de 10 minutes par salon. Le bot utilise une file d'attente intelligente et synchronise les salons selon une cadence respectant scrupuleusement les quotas de l'API Discord sans bloquer le bot.
</details>

<details>
<summary><b>2. Pourquoi certaines commandes ne répondent pas "Application n'a pas répondu" ?</b></summary>

Vérifiez que le bot est bien connecté et que les permissions de salon permettent au bot de lire et d'écrire des messages. Si vous venez de déployer de nouvelles commandes, Discord peut mettre quelques secondes à synchroniser les commandes de serveur (ou jusqu'à 1 heure pour les commandes globales).
</details>

<details>
<summary><b>3. Erreur "Missing Access" ou "Missing Permissions" lors d'un ban ou mute ?</b></summary>

Dans les paramètres de votre serveur Discord (**Paramètres du serveur > Rôles**), assurez-vous que le rôle du bot Saez est positionné **au-dessus** des rôles des membres que vous souhaitez modérer (règle de la hiérarchie des rôles de Discord).
</details>

---

<div align="center">

**Saez Discord Bot** — Conçu pour sublimer votre communauté **Saez Animes** 🌸

</div>
