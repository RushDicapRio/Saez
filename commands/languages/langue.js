import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder()
  .setName('langue')
  .setDescription('Outils linguistiques, traduction et compréhension des langues')
  .addSubcommand((sub) =>
    sub
      .setName('traduire')
      .setDescription('Traduire un texte dans une autre langue')
      .addStringOption((opt) =>
        opt.setName('texte').setDescription('Texte ou phrase à traduire').setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName('vers')
          .setDescription('Langue de destination')
          .setRequired(true)
          .addChoices(
            { name: 'Français (FR)', value: 'fr' },
            { name: 'Anglais (EN)', value: 'en' },
            { name: 'Japonais (JA)', value: 'ja' },
            { name: 'Espagnol (ES)', value: 'es' },
            { name: 'Allemand (DE)', value: 'de' },
            { name: 'Italien (IT)', value: 'it' },
            { name: 'Russe (RU)', value: 'ru' },
            { name: 'Coréen (KO)', value: 'ko' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('detecter')
      .setDescription('Détecter automatiquement la langue d\'un texte')
      .addStringOption((opt) =>
        opt.setName('texte').setDescription('Texte dont vous souhaitez identifier la langue').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('dictionnaire')
      .setDescription('Définition, synonymes et phonétique d\'un mot')
      .addStringOption((opt) =>
        opt.setName('mot').setDescription('Mot à rechercher').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('liste')
      .setDescription('Afficher la liste des langues prises en charge')
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'traduire') {
    await interaction.deferReply();
    const text = interaction.options.getString('texte');
    const targetLang = interaction.options.getString('vers');
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${targetLang}`;
      const res = await fetch(url);
      const json = await res.json();
      const translated = json?.responseData?.translatedText || 'Traduction impossible.';
      const detectedSource = json?.responseData?.match ? 'Automatique' : 'Inconnue';
      const embed = new EmbedBuilder()
        .setTitle('🌐 Traduction Multilingue')
        .setColor(0x00e5ff)
        .addFields(
          { name: '📝 Texte original', value: text },
          { name: `✨ Traduction (${targetLang.toUpperCase()})`, value: `**${translated}**` }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Moteur MyMemory Translation Engine' })
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    } catch {
      return interaction.editReply({ content: '❌ Erreur de connexion au service de traduction.' });
    }
  }
  if (sub === 'detecter') {
    await interaction.deferReply();
    const text = interaction.options.getString('texte');
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|en`;
      const res = await fetch(url);
      const json = await res.json();
      const langMap = {
        fr: 'Français 🇫🇷',
        en: 'Anglais 🇬🇧',
        ja: 'Japonais 🇯🇵',
        es: 'Espagnol 🇪🇸',
        de: 'Allemand 🇩🇪',
        it: 'Italien 🇮🇹',
        ru: 'Russe 🇷🇺',
        ko: 'Coréen 🇰🇷',
        zh: 'Chinois 🇨🇳',
        pt: 'Portugais 🇵🇹',
      };
      const detected = (json?.responseData?.detectedLanguage || 'fr').toLowerCase();
      const langName = langMap[detected] || `Code langue : ${detected.toUpperCase()}`;
      const embed = new EmbedBuilder()
        .setTitle('🔍 Détection de Langue')
        .setColor(0x10b981)
        .addFields(
          { name: '📝 Échantillon', value: `"${text}"` },
          { name: '🌐 Langue identifiée', value: `**${langName}**` }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Outil Linguistique Saez' })
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    } catch {
      return interaction.editReply({ content: '❌ Impossible de détecter la langue.' });
    }
  }
  if (sub === 'dictionnaire') {
    await interaction.deferReply();
    const word = interaction.options.getString('mot').trim().toLowerCase();
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/fr/${encodeURIComponent(word)}`);
      let json = await res.json();
      if (!Array.isArray(json)) {
        const enRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
        json = await enRes.json();
      }
      if (!Array.isArray(json) || json.length === 0) {
        return interaction.editReply({ content: `❌ Aucune définition trouvée pour le mot "**${word}**".` });
      }
      const entry = json[0];
      const phonetic = entry.phonetic || entry.phonetics?.find((p) => p.text)?.text || '';
      const meaning = entry.meanings?.[0];
      const def = meaning?.definitions?.[0]?.definition || 'Définition non disponible.';
      const example = meaning?.definitions?.[0]?.example;
      const embed = new EmbedBuilder()
        .setTitle(`📖 Dictionnaire : ${entry.word}`)
        .setColor(0x00e5ff)
        .setDescription(phonetic ? `*Phonétique : [${phonetic}]*` : '')
        .addFields(
          { name: '📚 Nature / Catégorie', value: meaning?.partOfSpeech || 'Nom commun', inline: true },
          { name: '💡 Définition', value: def, inline: false }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Free Dictionary Database' })
        .setTimestamp();
      if (example) {
        embed.addFields({ name: '💬 Exemple', value: `*"${example}"*`, inline: false });
      }
      return interaction.editReply({ embeds: [embed] });
    } catch {
      return interaction.editReply({ content: '❌ Erreur lors de la recherche dans le dictionnaire.' });
    }
  }
  if (sub === 'liste') {
    const embed = new EmbedBuilder()
      .setTitle('🌐 Langues Prises en Charge')
      .setDescription('Voici les langues internationales supportées pour la traduction et la détection :')
      .setColor(0x00e5ff)
      .addFields(
        { name: '🇫🇷 Français (FR)', value: 'Traduction directe & Dictionnaire', inline: true },
        { name: '🇬🇧 Anglais (EN)', value: 'Traduction directe & Dictionnaire', inline: true },
        { name: '🇯🇵 Japonais (JA)', value: 'Traduction directe & Romaji', inline: true },
        { name: '🇪🇸 Espagnol (ES)', value: 'Traduction directe', inline: true },
        { name: '🇩🇪 Allemand (DE)', value: 'Traduction directe', inline: true },
        { name: '🇮🇹 Italien (IT)', value: 'Traduction directe', inline: true },
        { name: '🇰🇷 Coréen (KO)', value: 'Traduction directe', inline: true },
        { name: '🇷🇺 Russe (RU)', value: 'Traduction directe', inline: true },
        { name: '🇨🇳 Chinois (ZH)', value: 'Traduction directe', inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Utilisez /langue traduire pour démarrer une traduction' })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
}
