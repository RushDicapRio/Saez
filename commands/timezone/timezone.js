import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { setUserTimezone, getUserTimezone } from '../../services/timezoneService.js';
import { config } from '../../config.js';
const AVAILABLE_ZONES = [
  { name: 'France, Belgique, Suisse (Europe/Paris - UTC+1/+2)', value: 'Europe/Paris' },
  { name: 'Québec, Montréal (America/Montreal - UTC-5/-4)', value: 'America/Montreal' },
  { name: 'Guadeloupe, Martinique (America/Guadeloupe - UTC-4)', value: 'America/Guadeloupe' },
  { name: 'La Réunion (Indian/Reunion - UTC+4)', value: 'Indian/Reunion' },
  { name: 'Nouvelle-Calédonie (Pacific/Noumea - UTC+11)', value: 'Pacific/Noumea' },
  { name: 'Polynésie (Pacific/Tahiti - UTC-10)', value: 'Pacific/Tahiti' },
  { name: 'Londres, Maroc (Europe/London - UTC+0/+1)', value: 'Europe/London' },
  { name: 'Tokyo, Japon (Asia/Tokyo - UTC+9)', value: 'Asia/Tokyo' },
  { name: 'New York (America/New_York - UTC-5/-4)', value: 'America/New_York' },
  { name: 'Los Angeles (America/Los_Angeles - UTC-8/-7)', value: 'America/Los_Angeles' },
];
export const data = new SlashCommandBuilder()
  .setName('fuseau')
  .setDescription('Gestion des fuseaux horaires mondiaux et horloge locale des membres')
  .addSubcommand((sub) =>
    sub
      .setName('definir')
      .setDescription('Enregistrer votre fuseau horaire personnel')
      .addStringOption((opt) =>
        opt
          .setName('zone')
          .setDescription('Votre zone horaire')
          .setRequired(true)
          .addChoices(...AVAILABLE_ZONES)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('heure')
      .setDescription('Afficher l\'heure locale actuelle d\'un membre')
      .addUserOption((opt) =>
        opt.setName('membre').setDescription('Membre à consulter').setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('timestamp')
      .setDescription('Générer des codes de date Discord dynamiques synchronisés (<t:...>)')
      .addStringOption((opt) =>
        opt.setName('date_heure').setDescription('Format JJ/MM/AAAA HH:mm (ex: 25/12/2026 20:00)').setRequired(true)
      )
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'definir') {
    const zone = interaction.options.getString('zone');
    await setUserTimezone(interaction.user.id, zone);
    const now = new Intl.DateTimeFormat('fr-FR', {
      timeZone: zone,
      timeStyle: 'medium',
      dateStyle: 'full',
    }).format(new Date());
    return await interaction.reply({
      content: `✅ Votre fuseau horaire a été configuré sur **${zone}** !\n🕒 Heure locale actuelle : **${now}**`,
      flags: MessageFlags.Ephemeral,
    });
  }
  if (sub === 'heure') {
    const user = interaction.options.getUser('membre') || interaction.user;
    const tz = await getUserTimezone(user.id);
    if (!tz) {
      return await interaction.reply({
        content: `❌ ${user.id === interaction.user.id ? 'Vous n\'avez pas' : `${user.username} n\'a pas`} encore configuré son fuseau horaire (\`/fuseau definir\`).`,
        flags: MessageFlags.Ephemeral,
      });
    }
    const timeString = new Intl.DateTimeFormat('fr-FR', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());
    const embed = new EmbedBuilder()
      .setTitle(`🕒 Heure Locale de ${user.username}`)
      .setDescription(`• **Fuseau :** \`${tz}\`\n• **Heure actuelle :** **${timeString}**`)
      .setColor(config.colors.primary)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return await interaction.reply({ embeds: [embed] });
  }
  if (sub === 'timestamp') {
    const input = interaction.options.getString('date_heure');
    const parts = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
    if (!parts) {
      return await interaction.reply({
        content: '❌ Format invalide ! Utilisez le format `JJ/MM/AAAA HH:mm` (ex: `25/12/2026 21:00`).',
        flags: MessageFlags.Ephemeral,
      });
    }
    const [, d, m, y, h, min] = parts;
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min));
    const unix = Math.floor(dateObj.getTime() / 1000);
    const embed = new EmbedBuilder()
      .setTitle('⏰ Générateur de Timestamps Discord')
      .setDescription('Voici les formats de temps dynamiques Discord qui s\'adaptent automatiquement à l\'heure de chaque membre :')
      .setColor(config.colors.accent)
      .addFields(
        { name: '📅 Date & Heure complète', value: `\`<t:${unix}:F>\` ➜ <t:${unix}:F>` },
        { name: '⏳ Compte à rebours relatif', value: `\`<t:${unix}:R>\` ➜ <t:${unix}:R>` },
        { name: '🕒 Heure seule', value: `\`<t:${unix}:t>\` ➜ <t:${unix}:t>` },
        { name: '📆 Date seule', value: `\`<t:${unix}:d>\` ➜ <t:${unix}:d>` }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Copiez simplement le code pour l\'insérer dans vos annonces' });
    return await interaction.reply({ embeds: [embed] });
  }
}
