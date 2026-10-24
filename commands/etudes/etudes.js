import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { addFlashcard, getFlashcards } from '../../services/lifestyleHubService.js';
export const data = new SlashCommandBuilder()
  .setName('etudes')
  .setDescription('Scolaire, sciences & révisions : flashcards, examens, maths, géographie, sciences...')
  .addSubcommand((sub) =>
    sub
      .setName('flashcard')
      .setDescription('Créer une carte mémoire pour réviser')
      .addStringOption((opt) => opt.setName('question').setDescription('Question au recto').setRequired(true))
      .addStringOption((opt) => opt.setName('reponse').setDescription('Réponse au verso').setRequired(true))
      .addStringOption((opt) => opt.setName('paquet').setDescription('Matière ou paquet (ex: Histoire, Japonais)').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('reviser')
      .setDescription('Tirer une flashcard au sort pour s\'auto-évaluer')
      .addStringOption((opt) => opt.setName('paquet').setDescription('Matière (optionnel)').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('examen')
      .setDescription('Ajouter un compte à rebours d\'épreuve ou d\'examen')
      .addStringOption((opt) => opt.setName('nom').setDescription('Nom de l\'épreuve (ex: Bac Philo, Partiel Math)').setRequired(true))
      .addStringOption((opt) => opt.setName('date').setDescription('Date (ex: 2026-11-15)').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('maths')
      .setDescription('Résolution mathématique, trigonométrie et géométrie')
      .addStringOption((opt) =>
        opt
          .setName('operation')
          .setDescription('Type de calcul')
          .setRequired(true)
          .addChoices(
            { name: 'Racine carrée (√x)', value: 'sqrt' },
            { name: 'Puissance (x^y)', value: 'pow' },
            { name: 'Théorème de Pythagore (Hypoténuse √(a²+b²))', value: 'pythagore' },
            { name: 'Factorielle (n!)', value: 'fact' },
            { name: 'Pourcentage (x% de y)', value: 'pct' }
          )
      )
      .addNumberOption((opt) => opt.setName('valeur_a').setDescription('Premier nombre (x, a ou n)').setRequired(true))
      .addNumberOption((opt) => opt.setName('valeur_b').setDescription('Second nombre (y ou b si applicable)').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('geographie')
      .setDescription('Fiche ou quiz sur un pays du monde (capitale, continent, drapeau)')
      .addStringOption((opt) => opt.setName('pays').setDescription('Nom du pays en français ou anglais (ex: Japon, France, Canada)').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('sciences')
      .setDescription('Consulter les constantes fondamentales ou le tableau périodique')
      .addStringOption((opt) =>
        opt
          .setName('element')
          .setDescription('Élément chimique ou constante')
          .setRequired(true)
          .addChoices(
            { name: 'Vitesse de la lumière (c = 299 792 458 m/s)', value: 'c' },
            { name: 'Constante de Planck (h = 6.626 × 10⁻³⁴ J·s)', value: 'h' },
            { name: 'Constante gravitationnelle (G = 6.674 × 10⁻¹¹)', value: 'g' },
            { name: 'Nombre d\'Avogadro (Na = 6.022 × 10²³ mol⁻¹)', value: 'na' },
            { name: 'Hydrogène (H - N°1 - 1.008 u)', value: 'h_elem' },
            { name: 'Carbone (C - N°6 - 12.011 u)', value: 'c_elem' },
            { name: 'Or (Au - N°79 - 196.97 u)', value: 'au_elem' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('frappe')
      .setDescription('Mesurer votre vitesse de frappe au clavier (Typing Test WPM)')
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'flashcard') {
    const q = interaction.options.getString('question');
    const a = interaction.options.getString('reponse');
    const deck = interaction.options.getString('paquet') || 'Général';
    await addFlashcard(interaction.user.id, { question: q, answer: a, deckName: deck });
    const embed = new EmbedBuilder()
      .setTitle(`🗂️ Flashcard Enregistrée [${deck}]`)
      .setDescription(`**Recto (Question) :** ${q}\n**Verso (Réponse) :** ||${a}||`)
      .setColor(0x00e5ff)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Révisez avec /etudes reviser' });
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
  if (sub === 'reviser') {
    const deck = interaction.options.getString('paquet');
    const cards = await getFlashcards(interaction.user.id, deck);
    if (cards.length === 0) {
      return interaction.reply({ content: '❌ Aucune carte mémoire trouvée dans ce paquet. Créez-en une avec `/etudes flashcard` !', ephemeral: true });
    }
    const card = cards[Math.floor(Math.random() * cards.length)];
    const embed = new EmbedBuilder()
      .setTitle(`🗂️ Flashcard : Paquet [${card.deckName}]`)
      .setDescription(`**Question :**\n### ${card.question}\n\n*Cliquez sur le spoiler ci-dessous pour vérifier votre réponse :*\n||${card.answer}||`)
      .setColor(0x10b981)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Auto-évaluation Saez Flashcards' });
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'examen') {
    const name = interaction.options.getString('nom');
    const dateStr = interaction.options.getString('date');
    const targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) {
      return interaction.reply({ content: '❌ Format de date invalide. Utilisez AAAA-MM-JJ (ex: 2026-11-15).', ephemeral: true });
    }
    const ts = Math.floor(targetDate.getTime() / 1000);
    const embed = new EmbedBuilder()
      .setTitle(`🎯 Objectif Examen : ${name}`)
      .setDescription(`📅 Date de l'épreuve : <t:${ts}:D>\n⏳ Compte à rebours : **<t:${ts}:R>**`)
      .setColor(0xfbbf24)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Révisez régulièrement pour maximiser vos chances !' });
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'maths') {
    const op = interaction.options.getString('operation');
    const a = interaction.options.getNumber('valeur_a');
    const b = interaction.options.getNumber('valeur_b') || 0;
    let res = 0;
    let desc = '';
    if (op === 'sqrt') {
      res = Math.sqrt(a);
      desc = `√(${a}) = **${res.toFixed(4)}**`;
    } else if (op === 'pow') {
      res = Math.pow(a, b);
      desc = `${a}^${b} = **${res}**`;
    } else if (op === 'pythagore') {
      res = Math.sqrt(a * a + b * b);
      desc = `Hypoténuse pour les côtés ${a} et ${b} : √(${a}² + ${b}²) = **${res.toFixed(4)}**`;
    } else if (op === 'fact') {
      let f = 1;
      for (let i = 2; i <= Math.min(a, 150); i++) f *= i;
      desc = `${a}! = **${f.toLocaleString()}**`;
    } else if (op === 'pct') {
      res = (a / 100) * b;
      desc = `${a}% de ${b} = **${res.toFixed(2)}**`;
    }
    const embed = new EmbedBuilder()
      .setTitle('📐 Math Lab & Formules')
      .setDescription(desc)
      .setColor(0x00e5ff)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'geographie') {
    await interaction.deferReply();
    const query = interaction.options.getString('pays');
    try {
      const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(query)}?fullText=false`);
      const list = await res.json();
      if (!Array.isArray(list) || list.length === 0) {
        return interaction.editReply({ content: `❌ Aucun pays trouvé au nom de "${query}".` });
      }
      const p = list[0];
      const name = p.translations?.fra?.common || p.name?.common;
      const capital = p.capital ? p.capital.join(', ') : 'Aucune';
      const population = p.population ? p.population.toLocaleString('fr-FR') : 'Inconnue';
      const continent = p.continents ? p.continents.join(', ') : 'Inconnu';
      const flag = p.flag || '🏳️';
      const embed = new EmbedBuilder()
        .setTitle(`${flag} Fiche Pays : ${name}`)
        .setColor(0x00e5ff)
        .addFields(
          { name: '🏛️ Capitale', value: capital, inline: true },
          { name: '🌍 Continent', value: continent, inline: true },
          { name: '👥 Population', value: `${population} hab.`, inline: true },
          { name: '💰 Monnaie', value: p.currencies ? Object.values(p.currencies).map((c) => `${c.name} (${c.symbol})`).join(', ') : 'N/A', inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Données mondiales REST Countries' });
      if (p.flags?.png) embed.setThumbnail(p.flags.png);
      return interaction.editReply({ embeds: [embed] });
    } catch {
      return interaction.editReply({ content: '❌ Erreur lors de la récupération des données géographiques.' });
    }
  }
  if (sub === 'sciences') {
    const el = interaction.options.getString('element');
    const dataMap = {
      c: { name: 'Vitesse de la lumière dans le vide', val: '299 792 458 m/s', desc: 'Constante universelle de la relativité restreinte.' },
      h: { name: 'Constante de Planck', val: '6.62607015 × 10⁻³⁴ J·s', desc: 'Fondement de la physique quantique.' },
      g: { name: 'Constante de gravitation universelle', val: '6.67430 × 10⁻¹¹ N·m²/kg²', desc: 'Régit l\'attraction des corps célestes.' },
      na: { name: 'Constante d\'Avogadro', val: '6.02214076 × 10²³ mol⁻¹', desc: 'Nombre d\'entités élémentaires dans une mole.' },
      h_elem: { name: 'Hydrogène (H)', val: 'Numéro atomique : 1 | Masse : 1.008 u', desc: 'L\'élément le plus abondant de l\'univers.' },
      c_elem: { name: 'Carbone (C)', val: 'Numéro atomique : 6 | Masse : 12.011 u', desc: 'Pilier fondamental de la chimie organique et de la vie.' },
      au_elem: { name: 'Or (Au)', val: 'Numéro atomique : 79 | Masse : 196.97 u', desc: 'Métal noble inoxydable très conducteur.' },
    };
    const item = dataMap[el] || { name: 'Constante', val: 'Inconnu', desc: '' };
    const embed = new EmbedBuilder()
      .setTitle(`🔬 Science Lab : ${item.name}`)
      .setDescription(`**Valeur :** \`${item.val}\`\n\n${item.desc}`)
      .setColor(0x10b981)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Encyclopédie Scientifique Saez' });
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'frappe') {
    const textSample = "L'entraînement assidu et la concentration forge les plus grands héros.";
    const embed = new EmbedBuilder()
      .setTitle('⌨️ Test de Vitesse de Frappe (Typing Test)')
      .setDescription(`Tapez la phrase suivante le plus rapidement et sans faute dans ce salon :\n\n>>> **${textSample}**`)
      .setColor(0x00e5ff)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Envoyez votre message dès que vous êtes prêt !' });
    return interaction.reply({ embeds: [embed] });
  }
}
