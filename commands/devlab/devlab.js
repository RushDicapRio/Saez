import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import crypto from 'node:crypto';
export const data = new SlashCommandBuilder()
  .setName('devlab')
  .setDescription('Outils développeur, tests d\'API, snippets, regex, couleurs et données')
  .addSubcommand((sub) =>
    sub
      .setName('snippet')
      .setDescription('Partager un extrait de code propre avec syntaxe colorée')
      .addStringOption((opt) =>
        opt
          .setName('langage')
          .setDescription('Langage de programmation')
          .setRequired(true)
          .addChoices(
            { name: 'JavaScript / TypeScript', value: 'javascript' },
            { name: 'Python', value: 'python' },
            { name: 'Rust', value: 'rust' },
            { name: 'HTML / CSS', value: 'html' },
            { name: 'SQL', value: 'sql' },
            { name: 'JSON', value: 'json' }
          )
      )
      .addStringOption((opt) => opt.setName('code').setDescription('Votre code à formater').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('regex')
      .setDescription('Tester une expression régulière sur une chaîne de caractères')
      .addStringOption((opt) => opt.setName('motif').setDescription('Pattern regex (ex: ^[a-z0-9_]+$)').setRequired(true))
      .addStringOption((opt) => opt.setName('texte').setDescription('Texte de test').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('api')
      .setDescription('Tester une requête HTTP GET vers une API publique')
      .addStringOption((opt) => opt.setName('url').setDescription('URL HTTP/HTTPS à tester').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('hash')
      .setDescription('Générer les empreintes cryptographiques SHA256 et MD5 d\'un texte')
      .addStringOption((opt) => opt.setName('texte').setDescription('Texte à hasher').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('couleur')
      .setDescription('Générer une palette de couleurs ou convertir HEX en RGB / HSL')
      .addStringOption((opt) => opt.setName('hex').setDescription('Code hexadécimal (ex: #00E5FF)').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('qrstudio')
      .setDescription('Générer un QR code de connexion WiFi sécurisé ou vCard')
      .addStringOption((opt) => opt.setName('ssid').setDescription('Nom du réseau WiFi').setRequired(true))
      .addStringOption((opt) => opt.setName('motdepasse').setDescription('Clé de sécurité du WiFi').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('convertisseur')
      .setDescription('Valider et formater du code JSON ou convertir en aperçu de table')
      .addStringOption((opt) => opt.setName('json').setDescription('Chaîne JSON à formater').setRequired(true))
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'snippet') {
    const lang = interaction.options.getString('langage');
    const code = interaction.options.getString('code');
    const embed = new EmbedBuilder()
      .setTitle(`💻 Extrait de Code [${lang.toUpperCase()}]`)
      .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .setDescription(`\`\`\`${lang}\n${code}\n\`\`\``)
      .setColor(0x00e5ff)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Snippet Library' })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'regex') {
    const pattern = interaction.options.getString('motif');
    const text = interaction.options.getString('texte');
    try {
      const reg = new RegExp(pattern, 'g');
      const matches = text.match(reg);
      const isMatch = reg.test(text);
      const embed = new EmbedBuilder()
        .setTitle('🔬 Regex Lab — Testeur d\'Expression Régulière')
        .setColor(isMatch ? 0x10b981 : 0xef4444)
        .addFields(
          { name: 'Motif (Regex)', value: `\`/${pattern}/g\``, inline: true },
          { name: 'Résultat', value: isMatch ? '✅ **Correspondance trouvée (Match)**' : '❌ **Aucune correspondance**', inline: true },
          { name: 'Texte testé', value: `\`${text}\``, inline: false },
          { name: 'Correspondances', value: matches ? `\`${matches.join('`, `')}\`` : '*Aucune*', inline: false }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Moteur Regex JavaScript v8' });
      return interaction.reply({ embeds: [embed] });
    } catch (err) {
      return interaction.reply({ content: `❌ Erreur de syntaxe Regex : \`${err.message}\``, ephemeral: true });
    }
  }
  if (sub === 'api') {
    await interaction.deferReply();
    const url = interaction.options.getString('url');
    try {
      const start = performance.now();
      const res = await fetch(url, { headers: { 'User-Agent': 'SaezBot-ApiTester/1.0' }, signal: AbortSignal.timeout(5000) });
      const latency = Math.round(performance.now() - start);
      const statusEmoji = res.ok ? '🟢' : '🔴';
      const text = await res.text();
      const preview = text.slice(0, 500);
      const embed = new EmbedBuilder()
        .setTitle('🌐 API Explorer — Test de Requête HTTP')
        .setColor(res.ok ? 0x10b981 : 0xef4444)
        .addFields(
          { name: 'URL Cible', value: `\`${url}\``, inline: false },
          { name: 'Statut HTTP', value: `${statusEmoji} **${res.status} ${res.statusText}**`, inline: true },
          { name: 'Temps de réponse', value: `\`${latency} ms\``, inline: true },
          { name: 'Aperçu du corps (Response)', value: `\`\`\`json\n${preview}${text.length > 500 ? '...' : ''}\n\`\`\``, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      return interaction.editReply({ content: `❌ Échec de la requête vers l'API : ${err.message}` });
    }
  }
  if (sub === 'hash') {
    const text = interaction.options.getString('texte');
    const sha256 = crypto.createHash('sha256').update(text).digest('hex');
    const md5 = crypto.createHash('md5').update(text).digest('hex');
    const embed = new EmbedBuilder()
      .setTitle('🔒 Calculateur d\'Empreintes Cryptographiques')
      .setColor(0x00e5ff)
      .addFields(
        { name: '📝 Texte source', value: `\`${text}\`` },
        { name: '🔑 Empreinte SHA-256', value: `\`${sha256}\`` },
        { name: '🔑 Empreinte MD5', value: `\`${md5}\`` }
      )
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'couleur') {
    let hex = interaction.options.getString('hex').trim();
    if (!hex.startsWith('#')) hex = `#${hex}`;
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      return interaction.reply({ content: '❌ Format HEX invalide. Utilisez un format comme `#00E5FF` ou `#FF2D7B`.', ephemeral: true });
    }
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const embed = new EmbedBuilder()
      .setTitle(`🎨 Color Lab : ${hex.toUpperCase()}`)
      .setColor(parseInt(hex.slice(1), 16))
      .addFields(
        { name: 'Format HEX', value: `\`${hex.toUpperCase()}\``, inline: true },
        { name: 'Format RGB', value: `\`rgb(${r}, ${g}, ${b})\``, inline: true },
        { name: 'Aperçu Discord', value: `Intensité : R:${r} V:${g} B:${b}`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'qrstudio') {
    const ssid = interaction.options.getString('ssid');
    const pass = interaction.options.getString('motdepasse');
    const wifiString = `WIFI:T:WPA;S:${ssid};P:${pass};;`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(wifiString)}`;
    const embed = new EmbedBuilder()
      .setTitle('📶 QR Code de Connexion WiFi Automatique')
      .setDescription(`Scannez ce code avec votre smartphone pour vous connecter instantanément au réseau :\n**SSID :** \`${ssid}\``)
      .setImage(qrUrl)
      .setColor(0x00e5ff)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Généré par Saez QR Studio' });
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (sub === 'convertisseur') {
    const raw = interaction.options.getString('json');
    try {
      const parsed = JSON.parse(raw);
      const pretty = JSON.stringify(parsed, null, 2);
      const embed = new EmbedBuilder()
        .setTitle('✅ Validation & Formatage JSON Réussi')
        .setDescription(`\`\`\`json\n${pretty.slice(0, 1500)}\n\`\`\``)
        .setColor(0x10b981)
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return interaction.reply({ embeds: [embed] });
    } catch (err) {
      return interaction.reply({ content: `❌ JSON invalide : \`${err.message}\``, ephemeral: true });
    }
  }
}
