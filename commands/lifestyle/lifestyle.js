import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import {
  logFitnessSession,
  getUserFitnessHistory,
  logHabit,
  getUserHabits,
  savePetProfile,
  getUserPets,
  savePlant,
  waterPlant,
  getUserPlants,
  addWishlistItem,
  getUserWishlist,
} from '../../services/lifestyleHubService.js';
export const data = new SlashCommandBuilder()
  .setName('lifestyle')
  .setDescription('Organisation & vie quotidienne : sport, habitudes, animaux, plantes, voyages, wishlist...')
  .addSubcommand((sub) =>
    sub
      .setName('fitness')
      .setDescription('Enregistrer une séance de sport ou entraînement physique')
      .addStringOption((opt) =>
        opt
          .setName('activite')
          .setDescription('Type de sport')
          .setRequired(true)
          .addChoices(
            { name: '🏃 Course / Jogging', value: 'Course' },
            { name: '🏋️ Musculation / Fitness', value: 'Musculation' },
            { name: '🚴 Cyclisme / Vélo', value: 'Cyclisme' },
            { name: '🏊 Natation', value: 'Natation' },
            { name: '🧘 Yoga / Étirements', value: 'Yoga' }
          )
      )
      .addIntegerOption((opt) => opt.setName('duree').setDescription('Durée en minutes (ex: 45)').setRequired(true))
      .addIntegerOption((opt) => opt.setName('calories').setDescription('Calories brûlées estimées').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('habitude')
      .setDescription('Cocher votre habitude quotidienne et maintenir votre streak')
      .addStringOption((opt) => opt.setName('nom').setDescription('Nom de l\'habitude (ex: Méditation, Lecture, Hydratation)').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('mes-habitudes')
      .setDescription('Afficher vos habitudes et vos séries de jours consécutifs')
  )
  .addSubcommand((sub) =>
    sub
      .setName('focus')
      .setDescription('Lancer une session de travail ou révision Pomodoro')
      .addIntegerOption((opt) => opt.setName('minutes').setDescription('Durée de travail en minutes (ex: 25, 45, 60)').setMinValue(5).setMaxValue(120).setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('animal')
      .setDescription('Créer une fiche profil pour votre animal de compagnie')
      .addStringOption((opt) => opt.setName('nom').setDescription('Nom de l\'animal').setRequired(true))
      .addStringOption((opt) =>
        opt
          .setName('espece')
          .setDescription('Espèce')
          .setRequired(true)
          .addChoices(
            { name: '🐱 Chat', value: 'Chat' },
            { name: '🐶 Chien', value: 'Chien' },
            { name: '🐰 Lapin / Rongeur', value: 'Rongeur' },
            { name: '🦜 Oiseau', value: 'Oiseau' },
            { name: '🦎 Reptile / Poisson', value: 'Reptile' }
          )
      )
      .addStringOption((opt) => opt.setName('photo').setDescription('URL de la photo').setRequired(false))
      .addStringOption((opt) => opt.setName('description').setDescription('Petite anecdote ou caractère').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('plante')
      .setDescription('Ajouter une plante à soigner et surveiller son arrosage')
      .addStringOption((opt) => opt.setName('nom').setDescription('Nom de la plante (ex: Monstera)').setRequired(true))
      .addIntegerOption((opt) => opt.setName('frequence_jours').setDescription('Arrosage tous les X jours (ex: 7)').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('voyage')
      .setDescription('Créer un carnet d\'itinéraire ou voyage de rêve')
      .addStringOption((opt) => opt.setName('destination').setDescription('Ville ou pays (ex: Tokyo, Japon)').setRequired(true))
      .addStringOption((opt) => opt.setName('duree').setDescription('Durée du séjour (ex: 10 jours)').setRequired(true))
      .addStringOption((opt) => opt.setName('activites').setDescription('Activités et visites prévues').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('wishlist')
      .setDescription('Ajouter un souhait, cadeau ou manga à votre liste d\'envies')
      .addStringOption((opt) => opt.setName('article').setDescription('Nom de l\'article ou cadeau').setRequired(true))
      .addStringOption((opt) => opt.setName('prix').setDescription('Prix approximatif (ex: 35€)').setRequired(false))
      .addStringOption((opt) => opt.setName('lien').setDescription('Lien boutique en ligne').setRequired(false))
  )
  .addSubcommand((sub) =>
    sub
      .setName('journal')
      .setDescription('Écrire une entrée dans votre journal intime personnel privé (chiffré)')
      .addStringOption((opt) => opt.setName('texte').setDescription('Vos pensées ou résumé de la journée').setRequired(true))
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'fitness') {
    const act = interaction.options.getString('activite');
    const dur = interaction.options.getInteger('duree');
    const cal = interaction.options.getInteger('calories') || Math.round(dur * 7.5);
    await logFitnessSession(interaction.user.id, {
      activity: act,
      durationMinutes: dur,
      caloriesBurned: cal,
    });
    const embed = new EmbedBuilder()
      .setTitle(`💪 Séance Enregistrée : ${act}`)
      .setDescription(`Félicitations <@${interaction.user.id}> pour votre entraînement !\n\n⏱️ Durée : **${dur} minutes**\n🔥 Calories brûlées : **~${cal} kcal**`)
      .setColor(0x10b981)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Fitness Tracker' })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'habitude') {
    const habitName = interaction.options.getString('nom');
    const res = await logHabit(interaction.user.id, habitName);
    const embed = new EmbedBuilder()
      .setTitle('🎯 Habitude Validée !')
      .setDescription(
        res.alreadyDone
          ? `Vous aviez déjà validé **${habitName}** aujourd'hui ! Votre série reste de **${res.streak} jours consécutifs** 🔥`
          : `Bravo ! Vous avez validé **${habitName}** aujourd'hui !\n🔥 Série actuelle : **${res.streak} jour(s) consécutif(s)** !`
      )
      .setColor(0xfbbf24)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'mes-habitudes') {
    await interaction.deferReply({ ephemeral: true });
    const habits = await getUserHabits(interaction.user.id);
    const embed = new EmbedBuilder()
      .setTitle('📊 Vos Habitudes Quotidiennes')
      .setColor(0x00e5ff)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (habits.length === 0) {
      embed.setDescription('Aucune habitude suivie. Commencez dès aujourd\'hui avec `/lifestyle habitude <nom>` !');
    } else {
      const lines = habits.map((h) => `🔥 **${h.streak} jours** — **${h.habitName}** (Dernier check: ${h.lastChecked})`);
      embed.setDescription(lines.join('\n\n'));
    }
    return interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'focus') {
    const min = interaction.options.getInteger('minutes');
    const endTime = Math.floor((Date.now() + min * 60 * 1000) / 1000);
    const embed = new EmbedBuilder()
      .setTitle('⏳ Session de Focus Pomodoro Lancée')
      .setDescription(`Bon courage <@${interaction.user.id}> ! Concentrez-vous pleinement pendant **${min} minutes**.\n\n🔔 Fin de la session prévue à : <t:${endTime}:T> (<t:${endTime}:R>)`)
      .setColor(0x6366f1)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Éloignez les distractions et donnez le meilleur de vous-même !' });
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'animal') {
    const name = interaction.options.getString('nom');
    const species = interaction.options.getString('espece');
    const photo = interaction.options.getString('photo');
    const desc = interaction.options.getString('description') || 'Un adorable compagnon de vie.';
    await savePetProfile(interaction.user.id, {
      name,
      species,
      photoUrl: photo,
      bio: desc,
    });
    const embed = new EmbedBuilder()
      .setTitle(`🐾 Fiche Compagnon : ${name} (${species})`)
      .setDescription(`Propriétaire : <@${interaction.user.id}>\n\n*"${desc}"*`)
      .setColor(0xf472b6)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    if (photo && photo.startsWith('http')) {
      embed.setImage(photo);
    }
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'plante') {
    const name = interaction.options.getString('nom');
    const days = interaction.options.getInteger('frequence_jours');
    await savePlant(interaction.user.id, {
      name,
      waterIntervalDays: days,
    });
    const embed = new EmbedBuilder()
      .setTitle(`🌿 Plante Enregistrée : ${name}`)
      .setDescription(`Arrosage prévu tous les **${days} jours**.\nN'oubliez pas de prendre soin de vos plantes vertes !`)
      .setColor(0x10b981)
      .setTimestamp()
      .setFooter({ text: 'Codé avec ❤️ par Saez' });
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'voyage') {
    const dest = interaction.options.getString('destination');
    const dur = interaction.options.getString('duree');
    const acts = interaction.options.getString('activites') || 'Exploration, découverte de la culture et gastronomie locale.';
    const embed = new EmbedBuilder()
      .setTitle(`✈️ Carnet de Voyage : ${dest}`)
      .setDescription(`🗓️ Durée prévue : **${dur}**\n\n📌 **Visites & Itinéraire :**\n${acts}`)
      .setColor(0x00e5ff)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Bon voyage avec Saez Travel Planner' })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'wishlist') {
    const item = interaction.options.getString('article');
    const price = interaction.options.getString('prix') || 'Non précisé';
    const link = interaction.options.getString('lien') || '';
    await addWishlistItem(interaction.user.id, {
      title: item,
      price,
      link,
    });
    const embed = new EmbedBuilder()
      .setTitle('🎁 Souhait Ajouté à votre Wishlist')
      .setDescription(`**${item}** (${price})\n${link ? `🔗 [Voir l'article](${link})` : ''}`)
      .setColor(0xec4899)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Partagez votre wishlist avec vos amis !' });
    return interaction.reply({ embeds: [embed] });
  }
  if (sub === 'journal') {
    const text = interaction.options.getString('texte');
    const now = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const embed = new EmbedBuilder()
      .setTitle(`📖 Journal Intime — ${now}`)
      .setDescription(`*"${text}"*`)
      .setColor(0x8b5cf6)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Ce message n\'est visible que par vous.' });
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
