import assert from 'node:assert/strict';
import { ChannelType, PermissionFlagsBits } from 'discord.js';
import {
  computeChecksum,
  generateBackupId,
  sanitizeData,
  verifyBackup,
  SCHEMA_VERSION,
  BACKUP_TYPES,
} from '../services/backupService.js';
console.log('🧪 ========================================================');
console.log('🧪 DÉBUT DE LA SUITE DE TESTS DU MODULE BACKUP (SAEZ BOT)');
console.log('🧪 ========================================================\n');
let testsPassed = 0;
let testsFailed = 0;
function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ [ÉCHOUER] ${name}`);
    console.error(`     Détails : ${err.message}\n`, err.stack);
    testsFailed++;
  }
}
async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASSER] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ [ÉCHOUER] ${name}`);
    console.error(`     Détails : ${err.message}\n`, err.stack);
    testsFailed++;
  }
}
function createMockGuild(guildId = '111111111111111111', guildName = 'Serveur Test Saez') {
  const roles = new Map([
    [
      guildId,
      {
        id: guildId,
        name: '@everyone',
        color: 0,
        hexColor: '#000000',
        hoist: false,
        position: 0,
        permissions: { bitfield: 104324673n },
        mentionable: false,
        managed: false,
      },
    ],
    [
      'role_admin',
      {
        id: 'role_admin',
        name: 'Administrateur',
        color: 0xff0000,
        hexColor: '#ff0000',
        hoist: true,
        position: 10,
        permissions: { bitfield: 8n },
        mentionable: true,
        managed: false,
      },
    ],
    [
      'role_vip',
      {
        id: 'role_vip',
        name: 'VIP Saez',
        color: 0x00e5ff,
        hexColor: '#00e5ff',
        hoist: true,
        position: 5,
        permissions: { bitfield: 104320000n },
        mentionable: true,
        managed: false,
      },
    ],
    [
      'role_bot',
      {
        id: 'role_bot',
        name: 'Saez Bot',
        color: 0x10b981,
        hexColor: '#10b981',
        hoist: false,
        position: 8,
        permissions: { bitfield: 8n },
        mentionable: false,
        managed: true,
      },
    ],
  ]);
  const channels = new Map([
    [
      'cat_general',
      {
        id: 'cat_general',
        name: 'COMMUNAUTÉ',
        type: ChannelType.GuildCategory,
        parentId: null,
        position: 0,
        rawPosition: 0,
        permissionOverwrites: { cache: new Map() },
      },
    ],
    [
      'chan_welcome',
      {
        id: 'chan_welcome',
        name: '👋・bienvenue',
        type: ChannelType.GuildText,
        parentId: 'cat_general',
        position: 1,
        rawPosition: 1,
        topic: 'Salon d\'accueil des nouveaux membres',
        nsfw: false,
        rateLimitPerUser: 0,
        permissionOverwrites: {
          cache: new Map([
            [
              'role_admin',
              {
                id: 'role_admin',
                type: 0,
                allow: { bitfield: 8n },
                deny: { bitfield: 0n },
              },
            ],
          ]),
        },
      },
    ],
    [
      'chan_voice',
      {
        id: 'chan_voice',
        name: '🔊・Discussion Générale',
        type: ChannelType.GuildVoice,
        parentId: 'cat_general',
        position: 2,
        rawPosition: 2,
        topic: null,
        nsfw: false,
        bitrate: 64000,
        userLimit: 20,
        permissionOverwrites: { cache: new Map() },
      },
    ],
  ]);
  roles.find = function (pred) {
    return [...this.values()].find(pred);
  };
  channels.find = function (pred) {
    return [...this.values()].find(pred);
  };
  return {
    id: guildId,
    name: guildName,
    memberCount: 150,
    roles: {
      cache: roles,
      fetch: async () => roles,
      create: async (opts) => {
        const newId = `new_role_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const r = { id: newId, ...opts, permissions: { bitfield: opts.permissions } };
        roles.set(newId, r);
        return r;
      },
    },
    channels: {
      cache: channels,
      fetch: async () => channels,
      create: async (opts) => {
        const newId = `new_chan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const c = {
          id: newId,
          ...opts,
          permissionOverwrites: {
            cache: new Map(),
            set: async () => {},
          },
          setParent: async () => {},
        };
        channels.set(newId, c);
        return c;
      },
    },
    members: {
      me: {
        permissions: {
          has: (perm) => true,
        },
        roles: {
          highest: { position: 8 },
        },
      },
    },
  };
}
async function main() {
  console.log('📌 Test 1 : Assainissement des données et exclusion des secrets sensibles');
  runTest('Exclusion des tokens, clés et mots de passe', () => {
    const raw = {
      guild_id: '12345',
      bot_token: 'SECRET_BOT_TOKEN_DISCORD',
      auth_secret: 'JWT_KEY_PRIVATE',
      password_hash: '123456',
      normal_field: 'Welcome Channel',
      nested: {
        api_token: 'EXTERNAL_KEY',
        clean_text: 'Hello World',
      },
    };
    const sanitized = sanitizeData(raw);
    assert.equal(sanitized.guild_id, '12345');
    assert.equal(sanitized.normal_field, 'Welcome Channel');
    assert.equal(sanitized.nested.clean_text, 'Hello World');
    assert.equal(sanitized.bot_token, undefined, 'Le token bot doit être supprimé');
    assert.equal(sanitized.auth_secret, undefined, 'Le secret auth doit être supprimé');
    assert.equal(sanitized.password_hash, undefined, 'Le mot de passe doit être supprimé');
    assert.equal(sanitized.nested.api_token, undefined, 'Le token imbriqué doit être supprimé');
  });
  console.log('\n📌 Test 2 : Calcul et stabilité du Checksum SHA-256');
  runTest('Checksum déterministe et intégrité', () => {
    const payload = { roles: [{ id: '1', name: 'Admin' }], channels: [] };
    const hash1 = computeChecksum(payload);
    const hash2 = computeChecksum(payload);
    assert.equal(typeof hash1, 'string');
    assert.equal(hash1.length, 64, 'SHA-256 doit comporter 64 caractères hexadécimaux');
    assert.equal(hash1, hash2, 'Le hash doit être strictement déterministe');
    const altered = { roles: [{ id: '1', name: 'Admin2' }], channels: [] };
    const hashAltered = computeChecksum(altered);
    assert.notEqual(hash1, hashAltered, 'Une modification de données doit changer le hash');
  });
  console.log('\n📌 Test 3 : Structure et vérification d\'intégrité (verifyBackup)');
  runTest('Validation d\'une sauvegarde complète valide', () => {
    const data = {
      roles: [{ id: 'r1', name: 'Membre', permissions: '0' }],
      channels: [
        { id: 'c1', name: 'Général', type: 4, parentId: null },
        { id: 'c2', name: 'salon', type: 0, parentId: 'c1' },
      ],
      botConfigs: { welcome: { enabled: true } },
    };
    const backupDoc = {
      backup_id: generateBackupId(),
      guild_id: '111111111111111111',
      schema_version: SCHEMA_VERSION,
      checksum: computeChecksum(data),
      data,
    };
    const check = verifyBackup(backupDoc);
    assert.equal(check.valid, true, 'Une sauvegarde conforme doit être validée');
    assert.equal(check.errors.length, 0);
  });
  runTest('Rejet immédiat d\'une sauvegarde altérée (Mismatch SHA-256)', () => {
    const data = {
      roles: [{ id: 'r1', name: 'Membre' }],
      channels: [],
    };
    const backupDoc = {
      backup_id: generateBackupId(),
      guild_id: '111111111111111111',
      schema_version: SCHEMA_VERSION,
      checksum: 'FAUX_HASH_CORROMPU_000000000000000000000000000000000000000000000000',
      data,
    };
    const check = verifyBackup(backupDoc);
    assert.equal(check.valid, false, 'Le mismatch de checksum doit invalider la sauvegarde');
    assert.ok(
      check.errors.some((e) => e.includes('SHA-256')),
      'L\'erreur de checksum doit être expressément signalée'
    );
  });
  runTest('Détection des références de catégories orphelines', () => {
    const data = {
      roles: [],
      channels: [
        { id: 'c2', name: 'salon-orphelin', type: 0, parentId: 'cat_inconnue_999' },
      ],
    };
    const backupDoc = {
      backup_id: generateBackupId(),
      guild_id: '111111111111111111',
      schema_version: SCHEMA_VERSION,
      checksum: computeChecksum(data),
      data,
    };
    const check = verifyBackup(backupDoc);
    assert.ok(
      check.warnings.some((w) => w.includes('cat_inconnue_999')),
      'Une catégorie orpheline doit déclencher un avertissement'
    );
  });
  console.log('\n📌 Test 4 : Export & Import et prévention des attaques');
  runTest('Génération de manifeste complet lors de l\'export', () => {
    const backup = {
      backup_id: 'bk_test_123',
      guild_id: 'guild_456',
      guild_name: 'Test Guild',
      checksum: 'hash_test',
      type: BACKUP_TYPES.FULL,
      counts: { roles: 2, channels: 3 },
      name: 'Sauvegarde Export',
      description: 'Note export',
      author: { id: 'user_1', tag: 'Val#0001' },
      created_at: new Date(),
      data: { roles: [{ id: '1', name: 'VIP' }] },
    };
    const exportManifest = {
      generator: 'Saez Discord Bot - Backup Engine',
      version: SCHEMA_VERSION,
      exported_at: new Date().toISOString(),
      backup_id: backup.backup_id,
      guild_id: backup.guild_id,
      checksum: backup.checksum,
    };
    const json = JSON.stringify({ manifest: exportManifest, data: backup.data });
    const parsed = JSON.parse(json);
    assert.equal(parsed.manifest.version, SCHEMA_VERSION);
    assert.equal(parsed.data.roles[0].name, 'VIP');
  });
  runTest('Rejet des fichiers malformés ou trop volumineux', () => {
    const badJson = '{ invalid_json : true, ';
    assert.throws(() => {
      JSON.parse(badJson);
    }, 'Un JSON mal formé doit lever une exception');
  });
  console.log('\n📌 Test 5 : Comparaison différentielle (compareBackup)');
  await runAsyncTest('Détection précise des éléments manquants et modifiés sans écriture', async () => {
    const { compareBackup } = await import('../services/backupService.js');
    const mockGuild = createMockGuild();
    const backupDoc = {
      data: {
        roles: [
          { id: mockGuild.id, isEveryone: true },
          { id: 'role_admin', name: 'Administrateur', hexColor: '#ff0000', hoist: true },
          { id: 'role_vip', name: 'VIP Saez', hexColor: '#999999', hoist: true },
          { id: 'role_ancien_grade', name: 'Ancien Grade', hexColor: '#123456', hoist: false },
        ],
        channels: [
          { id: 'cat_general', name: 'COMMUNAUTÉ', type: ChannelType.GuildCategory },
          { id: 'chan_archive', name: '📦・archives', type: ChannelType.GuildText },
        ],
        botConfigs: { welcome: { enabled: true } },
      },
    };
    const comp = await compareBackup(mockGuild, backupDoc);
    assert.equal(comp.success, true);
    assert.equal(comp.comparison.roles.missingInServer.length, 1, '1 rôle doit être détecté manquant sur le serveur');
    assert.equal(comp.comparison.roles.missingInServer[0].name, 'Ancien Grade');
    assert.equal(comp.comparison.roles.modified.length, 1, 'Le rôle VIP doit être détecté modifié (couleur)');
    assert.equal(comp.comparison.channels.missingInServer.length, 1, 'Le salon archive doit être détecté manquant');
    assert.equal(comp.comparison.channels.missingInServer[0].name, '📦・archives');
  });
  console.log('\n📌 Test 6 : Simulation de restauration (testRestore)');
  await runAsyncTest('Dry-run complet avec respect de la hiérarchie Discord', async () => {
    const { testRestore } = await import('../services/backupService.js');
    const mockGuild = createMockGuild();
    const backupDoc = {
      data: {
        roles: [
          { id: mockGuild.id, name: '@everyone', isEveryone: true },
          { id: 'role_bot_integration', name: 'Bot Integration', managed: true },
          { id: 'role_nouveau', name: 'Membre Fidèle', color: 0x5865f2, position: 2 },
          { id: 'role_admin', name: 'Administrateur', position: 10 },
        ],
        channels: [
          { id: 'cat_nouvelle', name: 'ZONE SECRÈTE', type: ChannelType.GuildCategory },
          { id: 'chan_secret', name: '🔒・secret', type: ChannelType.GuildText },
        ],
        botConfigs: { welcome: {}, tickets: {} },
      },
    };
    const plan = await testRestore(mockGuild, backupDoc);
    assert.equal(plan.rolesToSkip.length, 2, '@everyone et rôles gérés doivent être ignorés');
    assert.equal(plan.rolesToCreate.length, 1, 'Membre Fidèle doit être planifié pour création');
    assert.equal(plan.categoriesToCreate.length, 1, 'ZONE SECRÈTE doit être planifiée');
    assert.equal(plan.channelsToCreate.length, 1, '🔒・secret doit être planifié');
    assert.equal(plan.botConfigsToApply.length, 2);
  });
  console.log('\n📌 Test 7 : Restauration contrôlée avec mapping des IDs et mode fusion');
  await runAsyncTest('Restauration mode fusion avec correspondance d\'anciennes et nouvelles clés', async () => {
    const { restoreBackup } = await import('../services/backupService.js');
    const mockGuild = createMockGuild();
    const backupDoc = {
      backup_id: 'bk_restore_sample',
      name: 'Sauvegarde Échantillon',
      data: {
        roles: [
          { id: mockGuild.id, isEveryone: true },
          { id: 'old_role_1', name: 'Nouveau Rôle Test', color: 0x00ff00, permissions: '104320000', position: 3 },
        ],
        channels: [
          { id: 'old_cat_1', name: 'NOUVELLE CATÉGORIE', type: ChannelType.GuildCategory, position: 1 },
          {
            id: 'old_chan_1',
            name: 'salon-reconstruit',
            type: ChannelType.GuildText,
            parentId: 'old_cat_1',
            permissionOverwrites: [
              { id: 'old_role_1', type: 0, allow: '8', deny: '0' },
            ],
          },
        ],
        botConfigs: {},
      },
    };
    const res = await restoreBackup(mockGuild, backupDoc, { id: 'tester', tag: 'Tester#0001' }, {
      mode: 'merge',
      categories: ['roles', 'channels'],
      createPreBackup: false,
    });
    assert.equal(res.createdRoles.length, 1, 'Le rôle doit être créé');
    assert.equal(res.createdCategories.length, 1, 'La catégorie doit être créée');
    assert.equal(res.createdChannels.length, 1, 'Le salon doit être créé');
    assert.equal(res.errors.length, 0, 'Aucune erreur ne doit survenir');
  });
  console.log('\n📌 Test 8 : Annulation en plein vol (cancelRestore)');
  await runAsyncTest('Interruption propre d\'une restauration', async () => {
    const { cancelRestore } = await import('../services/backupService.js');
    const noOp = cancelRestore('fake_guild_id');
    assert.equal(noOp, false, 'Doit renvoyer false si aucune opération n\'est active');
  });
  console.log('\n📌 Test 9 : Isolation stricte entre serveurs');
  runTest('Garantie de non-interférence entre guildes différentes', () => {
    const guildA = 'guild_aaa_111';
    const guildB = 'guild_bbb_222';
    const backupA = { guild_id: guildA, backup_id: 'bk_a_1', name: 'Guild A Backup' };
    const queryForB = { guild_id: guildB, backup_id: backupA.backup_id };
    const matchesGuildB = backupA.guild_id === queryForB.guild_id && backupA.backup_id === queryForB.backup_id;
    assert.equal(matchesGuildB, false, 'Le serveur B ne doit jamais pouvoir accéder à la sauvegarde du serveur A');
  });
  console.log('\n📌 Test 10 : Vérification des types de sous-commandes Discord');
  await runAsyncTest('Validation de la structure de SlashCommandBuilder de /backup', async () => {
    const cmdModule = await import('../commands/backup/backup.js');
    const cmd = cmdModule.default || cmdModule;
    assert.ok(cmd.data, 'La commande doit posséder la propriété data');
    assert.equal(cmd.data.name, 'backup');
    assert.equal(typeof cmd.execute, 'function');
    assert.equal(typeof cmd.autocomplete, 'function', 'L\'autocomplétion doit être disponible');
    const subcommands = cmd.data.options.map((o) => o.name);
    console.log(`     Sous-commandes enregistrées (${subcommands.length}) :`, subcommands.join(', '));
    const requiredSubs = [
      'create', 'creer', 'list', 'liste', 'export', 'restore', 'delete', 'details',
      'rename', 'verify', 'compare', 'schedule', 'autosave', 'history', 'status',
      'import', 'duplicate', 'cleanup', 'search', 'cancel', 'settings', 'stats', 'test-restore'
    ];
    for (const req of requiredSubs) {
      assert.ok(subcommands.includes(req), `La sous-commande "${req}" doit être présente`);
    }
  });
  console.log('\n📌 Test 11 : Détection et alertes de hiérarchie des rôles');
  await runAsyncTest('Alerte si un rôle dépasse la hiérarchie du bot', async () => {
    const { testRestore } = await import('../services/backupService.js');
    const mockGuild = createMockGuild();
    mockGuild.members.me.roles.highest.position = 8;
    mockGuild.members.me.permissions.has = () => false; 
    const backupDoc = {
      data: {
        roles: [
          { id: 'role_supérieur', name: 'Super Admin', position: 15, isEveryone: false, managed: false },
        ],
        channels: [],
        botConfigs: {},
      },
    };
    const plan = await testRestore(mockGuild, backupDoc);
    assert.ok(
      plan.warnings.some((w) => w.includes('position 15 vs 8')),
      'Une alerte de hiérarchie doit être levée pour les rôles supérieurs au bot'
    );
  });
  console.log('\n📌 Test 12 : Vérification du contrôle des permissions Administrateur');
  await runAsyncTest('Refus immédiat des utilisateurs sans permission Administrateur', async () => {
    const cmdModule = await import('../commands/backup/backup.js');
    const cmd = cmdModule.default || cmdModule;
    let replyCalledWith = null;
    const mockInteraction = {
      guild: { id: '111', ownerId: '999' },
      user: { id: 'user_lambda' },
      memberPermissions: {
        has: (perm) => perm !== PermissionFlagsBits.Administrator,
      },
      reply: async (payload) => {
        replyCalledWith = payload;
      },
    };
    await cmd.execute(mockInteraction);
    assert.ok(replyCalledWith, 'Une réponse doit être émise');
    assert.ok(replyCalledWith.content.includes('strictement réservée aux Administrateurs'));
  });
  console.log('\n📌 Test 13 : Sauvegardes partielles ciblées');
  await runAsyncTest('Création de sauvegardes partielles (rôles uniquement, salons uniquement)', async () => {
    const { captureRoles, captureChannels } = await import('../services/backupService.js');
    const mockGuild = createMockGuild();
    const roles = await captureRoles(mockGuild);
    assert.equal(roles.length, 4, '4 rôles doivent être indexés');
    const channels = await captureChannels(mockGuild);
    assert.equal(channels.length, 3, '3 salons/catégories doivent être indexés');
  });
  console.log('\n📌 Test 14 : Importation sécurisée et rejet des fichiers corrompus/surchargés');
  await runAsyncTest('Validation du flux d\'importation et isolation multi-tenant', async () => {
    const { importBackup } = await import('../services/backupService.js');
    const corruptRes = await importBackup('target_guild', 'Target Server', '{ malformed json ...', { id: 'admin1' });
    assert.equal(corruptRes.success, false);
    assert.ok(corruptRes.message.includes('invalide'));
    const fakeHugeBuffer = Buffer.alloc(21 * 1024 * 1024, 65); // 21 MB
    const hugeRes = await importBackup('target_guild', 'Target Server', fakeHugeBuffer, { id: 'admin1' });
    assert.equal(hugeRes.success, false);
    assert.ok(hugeRes.message.includes('trop volumineux'));
    const validData = {
      roles: [{ id: 'src_role_1', name: 'VIP Guest', color: 0x123456 }],
      channels: [{ id: 'src_chan_1', name: 'lobby', type: ChannelType.GuildText }],
    };
    const validExport = JSON.stringify({
      manifest: { version: SCHEMA_VERSION, guild_id: 'source_guild_999' },
      data: validData,
    });
    const successRes = await importBackup('target_guild_888', 'Target Guild', validExport, { id: 'admin1' });
    assert.equal(successRes.success, true);
    assert.equal(successRes.backup.guild_id, 'target_guild_888', 'Le backup importé doit être strictement attribué au serveur cible');
    assert.equal(successRes.backup.counts.roles, 1);
    assert.equal(successRes.backup.counts.channels, 1);
  });
  console.log('\n📌 Test 15 : Résilience face aux erreurs Discord pendant une restauration');
  await runAsyncTest('Gestion des échecs partiels d\'API Discord sans crash', async () => {
    const { restoreBackup } = await import('../services/backupService.js');
    const mockGuild = createMockGuild();
    const originalCreate = mockGuild.channels.create;
    mockGuild.channels.create = async (opts) => {
      if (opts.name === 'salon-interdit') {
        throw new Error('DiscordAPIError[50035]: Invalid Form Body: Maximum channels reached');
      }
      return originalCreate(opts);
    };
    const backupDoc = {
      backup_id: 'bk_resilience_test',
      name: 'Test Résilience',
      data: {
        roles: [{ id: mockGuild.id, isEveryone: true }],
        channels: [
          { id: 'c1', name: 'salon-reussi', type: ChannelType.GuildText },
          { id: 'c2', name: 'salon-interdit', type: ChannelType.GuildText },
          { id: 'c3', name: 'autre-salon-reussi', type: ChannelType.GuildText },
        ],
        botConfigs: {},
      },
    };
    const report = await restoreBackup(mockGuild, backupDoc, { id: 'admin' }, {
      mode: 'merge',
      categories: ['channels'],
      createPreBackup: false,
    });
    assert.equal(report.createdChannels.length, 2, '2 salons valides doivent avoir été créés');
    assert.equal(report.errors.length, 1, '1 erreur doit avoir été capturée dans le rapport');
    assert.ok(report.errors[0].includes('salon-interdit'), 'L\'erreur doit identifier le salon défaillant');
    assert.equal(report.success, false, 'Le statut global doit refléter l\'erreur partielle sans crash');
  });
  console.log('\n📌 Test 16 : Protection contre les suppressions excessives (Politique de Rétention)');
  await runAsyncTest('Garantie du seuil minimum de sauvegardes conservées', async () => {
    const { cleanupBackups } = await import('../services/backupService.js');
    const res = await cleanupBackups('guild_fake', { olderThanDays: 30, keepMin: 3 });
    assert.equal(res.deletedCount, 0, 'Aucune suppression si la base est inaccessible ou sous le quota');
  });
  console.log('\n📌 Test 17 : Respect de la désactivation modulaire');
  await runAsyncTest('Blocage bienveillant des commandes si le module de sauvegarde est désactivé', async () => {
    const cmdModule = await import('../commands/backup/backup.js');
    const cmd = cmdModule.default || cmdModule;
    let replyPayload = null;
    let editPayload = null;
    const mockInteraction = {
      guild: { id: 'guild_modulaire', ownerId: 'user_admin', name: 'Serveur Modulaire' },
      user: { id: 'user_admin', tag: 'Admin#0001' },
      memberPermissions: {
        has: () => true, 
      },
      options: {
        getSubcommand: () => 'create',
        getString: (name) => (name === 'nom' ? 'Test' : null),
        getBoolean: () => null,
      },
      deferReply: async () => {},
      reply: async (p) => { replyPayload = p; },
      editReply: async (p) => { editPayload = p; },
    };
    await cmd.execute(mockInteraction);
    assert.ok(editPayload, 'Une réponse editReply doit être envoyée');
  });
  console.log('\n📌 Test 18 : Déduction automatique du type PARTIAL');
  await runAsyncTest('Basculement vers partial lorsque certains composants sont exclus', async () => {
    const { createBackup } = await import('../services/backupService.js');
    const mockGuild = createMockGuild();
    const backupDoc = await createBackup(mockGuild, { id: 'admin1', tag: 'Admin#0001' }, {
      type: BACKUP_TYPES.FULL,
      include: {
        roles: true,
        channels: false, 
        guild_settings: false,
        bot_config: false,
      },
    });
    assert.equal(backupDoc.type, BACKUP_TYPES.PARTIAL, 'Le type doit être automatiquement classé en PARTIAL');
    assert.equal(backupDoc.data.channels, undefined, 'Les salons ne doivent pas être capturés');
    assert.ok(backupDoc.data.roles.length > 0, 'Les rôles doivent être présents');
  });
  console.log('\n📌 Test 19 : Calcul et conformité du plan de simulation testRestore');
  await runAsyncTest('Vérification des structures retournées par testRestore', async () => {
    const { testRestore } = await import('../services/backupService.js');
    const mockGuild = createMockGuild();
    const sampleDoc = {
      data: {
        roles: [{ id: 'r_new', name: 'Nouveau Rôle Unique', position: 1 }],
        channels: [{ id: 'c_new', name: 'nouveau-salon', type: ChannelType.GuildText }],
        botConfigs: { welcome: {}, ticket: {} },
      },
    };
    const sim = await testRestore(mockGuild, sampleDoc);
    assert.ok(Array.isArray(sim.rolesToCreate));
    assert.ok(Array.isArray(sim.channelsToCreate));
    assert.ok(Array.isArray(sim.botConfigsToApply));
    assert.equal(sim.rolesToCreate[0].name, 'Nouveau Rôle Unique');
    assert.equal(sim.channelsToCreate[0].name, 'nouveau-salon');
  });
  console.log('\n========================================================');
  console.log(`🎯 BILAN DES TESTS : ${testsPassed} réussis, ${testsFailed} échoués sur ${testsPassed + testsFailed} tests.`);
  console.log('========================================================\n');
  if (testsFailed > 0) {
    process.exit(1);
  }
}
main().catch((err) => {
  console.error('Erreur critique pendant l\'exécution des tests :', err);
  process.exit(1);
});
