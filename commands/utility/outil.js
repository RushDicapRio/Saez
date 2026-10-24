import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder()
  .setName('outil')
  .setDescription('Boîte à outils pratiques pour le serveur')
  .addSubcommand((sub) =>
    sub
      .setName('calculatrice')
      .setDescription('Évaluer une expression mathématique ou scientifique')
      .addStringOption((opt) =>
        opt.setName('calcul').setDescription('Expression à calculer (ex: (12 * 4) + 15 / 3)').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('convertir')
      .setDescription('Convertir des unités de mesure ou des devises courantes')
      .addNumberOption((opt) =>
        opt.setName('valeur').setDescription('Nombre ou montant à convertir').setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName('type')
          .setDescription('Type de conversion')
          .setRequired(true)
          .addChoices(
            { name: 'Température : Celsius vers Fahrenheit', value: 'c_to_f' },
            { name: 'Température : Fahrenheit vers Celsius', value: 'f_to_c' },
            { name: 'Distance : Kilomètres vers Miles', value: 'km_to_mi' },
            { name: 'Distance : Miles vers Kilomètres', value: 'mi_to_km' },
            { name: 'Poids : Kilogrammes vers Livres (lbs)', value: 'kg_to_lbs' },
            { name: 'Devise : Euros (€) vers Dollars ($)', value: 'eur_to_usd' },
            { name: 'Devise : Dollars ($) vers Euros (€)', value: 'usd_to_eur' },
            { name: 'Devise : Euros (€) vers Yen Japonais (¥)', value: 'eur_to_jpy' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('qrcode')
      .setDescription('Générer un QR code scannable instantané')
      .addStringOption((opt) =>
        opt.setName('contenu').setDescription('Lien URL ou texte à encoder').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('fuseau')
      .setDescription('Afficher l\'heure actuelle dans les grandes capitales')
      .addStringOption((opt) =>
        opt
          .setName('ville')
          .setDescription('Capitale ou métropole')
          .setRequired(false)
          .addChoices(
            { name: 'Paris (France) 🇫🇷', value: 'Europe/Paris' },
            { name: 'Tokyo (Japon) 🇯🇵', value: 'Asia/Tokyo' },
            { name: 'New York (USA) 🇺🇸', value: 'America/New_York' },
            { name: 'Londres (UK) 🇬🇧', value: 'Europe/London' },
            { name: 'Séoul (Corée du Sud) 🇰🇷', value: 'Asia/Seoul' },
            { name: 'Sydney (Australie) 🇦🇺', value: 'Australia/Sydney' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('motdepasse')
      .setDescription('Générer un mot de passe sécurisé et aléatoire')
      .addIntegerOption((opt) =>
        opt
          .setName('longueur')
          .setDescription('Nombre de caractères (8 à 64)')
          .setMinValue(8)
          .setMaxValue(64)
          .setRequired(false)
      )
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'calculatrice') {
    const rawExpr = interaction.options.getString('calcul').trim();
    const cleanExpr = rawExpr.replace(/\s+/g, '');
    if (!/^[0-9+\-*/().,%^]+$/.test(cleanExpr)) {
      return interaction.reply({
        content: '❌ Expression invalide. N\'utilisez que des chiffres et les opérateurs usuels (+, -, *, /, (), %)',
        ephemeral: true,
      });
    }
    try {
      const sanitized = cleanExpr.replace(/\^/g, '**');
      const result = Function(`"use strict"; return (${sanitized});`)();
      const embed = new EmbedBuilder()
        .setTitle('🧮 Calculatrice Rapide')
        .setColor(0x00e5ff)
        .addFields(
          { name: 'Expression', value: `\`${rawExpr}\``, inline: true },
          { name: 'Résultat', value: `\`${Number(result).toLocaleString('fr-FR', { maximumFractionDigits: 6 })}\``, inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Moteur de calcul Saez' });
      return interaction.reply({ embeds: [embed] });
    } catch {
      return interaction.reply({ content: '❌ Erreur de calcul : expression mathématique incorrecte.', ephemeral: true });
    }
  }
  if (sub === 'convertir') {
    const val = interaction.options.getNumber('valeur');
    const type = interaction.options.getString('type');
    let result = 0;
    let unitSrc = '';
    let unitTarget = '';
    switch (type) {
      case 'c_to_f':
        result = (val * 9) / 5 + 32;
        unitSrc = `${val} °C`;
        unitTarget = `${result.toFixed(2)} °F`;
        break;
      case 'f_to_c':
        result = ((val - 32) * 5) / 9;
        unitSrc = `${val} °F`;
        unitTarget = `${result.toFixed(2)} °C`;
        break;
      case 'km_to_mi':
        result = val * 0.621371;
        unitSrc = `${val} km`;
        unitTarget = `${result.toFixed(2)} miles`;
        break;
      case 'mi_to_km':
        result = val / 0.621371;
        unitSrc = `${val} miles`;
        unitTarget = `${result.toFixed(2)} km`;
        break;
      case 'kg_to_lbs':
        result = val * 2.20462;
        unitSrc = `${val} kg`;
        unitTarget = `${result.toFixed(2)} lbs`;
        break;
      case 'eur_to_usd':
        result = val * 1.09;
        unitSrc = `${val} €`;
        unitTarget = `${result.toFixed(2)} $`;
        break;
      case 'usd_to_eur':
        result = val * 0.92;
        unitSrc = `${val} $`;
        unitTarget = `${result.toFixed(2)} €`;
        break;
      case 'eur_to_jpy':
        result = val * 163.5;
        unitSrc = `${val} €`;
        unitTarget = `${result.toFixed(0)} ¥`;
        break;
    }
    const embed = new EmbedBuilder()
      .setTitle('🔄 Convertisseur Universel')
      .setColor(0x10b981)
      .addFields(
        { name: 'Valeur initiale', value: `**${unitSrc}**`, inline: true },
        { name: 'Résultat converti', value: `**${unitTarget}**`, inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Taux & mesures standards internationaux' });
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'qrcode') {
    const text = interaction.options.getString('contenu');
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
    const embed = new EmbedBuilder()
      .setTitle('📱 Votre QR Code est Prêt !')
      .setDescription(`Scanner ce code avec un smartphone pour ouvrir le lien ou lire le message :\n\`${text}\``)
      .setImage(qrUrl)
      .setColor(0x00e5ff)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Généré par Saez QR Engine' })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'fuseau') {
    const selectedZone = interaction.options.getString('ville');
    if (selectedZone) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('fr-FR', { timeZone: selectedZone, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = now.toLocaleDateString('fr-FR', { timeZone: selectedZone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const embed = new EmbedBuilder()
        .setTitle(`🕒 Heure Locale — ${selectedZone}`)
        .setColor(0x00e5ff)
        .addFields(
          { name: 'Heure', value: `**${timeStr}**`, inline: true },
          { name: 'Date', value: dateStr, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      return interaction.reply({ embeds: [embed] });
    }
    const zones = [
      { city: 'Paris 🇫🇷', tz: 'Europe/Paris' },
      { city: 'Tokyo 🇯🇵', tz: 'Asia/Tokyo' },
      { city: 'New York 🇺🇸', tz: 'America/New_York' },
      { city: 'Londres 🇬🇧', tz: 'Europe/London' },
      { city: 'Séoul 🇰🇷', tz: 'Asia/Seoul' },
      { city: 'Sydney 🇦🇺', tz: 'Australia/Sydney' },
    ];
    const embed = new EmbedBuilder()
      .setTitle('🌍 Horloge Mondiale — Fuseaux Horaires')
      .setColor(0x38bdf8)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    const now = new Date();
    zones.forEach((z) => {
      const timeStr = now.toLocaleTimeString('fr-FR', { timeZone: z.tz, hour: '2-digit', minute: '2-digit' });
      embed.addFields({ name: z.city, value: `**${timeStr}**`, inline: true });
    });
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'motdepasse') {
    const length = interaction.options.getInteger('longueur') || 16;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    const crypto = await import('node:crypto');
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      password += chars[bytes[i] % chars.length];
    }
    return interaction.reply({
      content: `🔐 **Votre mot de passe généré (${length} caractères) :**\n\`\`\`${password}\`\`\`\n⚠️ *Ce message n'est visible que par vous. Ne le partagez avec personne !*`,
      ephemeral: true,
    });
  }
}
