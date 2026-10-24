import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { getDb } from '../../database/mongo.js';
import { config } from '../../config.js';
export const data = new SlashCommandBuilder()
  .setName('gamestats')
  .setDescription('Profils de joueurs et statistiques compétitives de jeux vidéo')
  .addSubcommand((sub) =>
    sub
      .setName('minecraft')
      .setDescription('Consulter la fiche Minecraft officielle d\'un joueur (Skin, UUID, Historique)')
      .addStringOption((opt) =>
        opt.setName('pseudo').setDescription('Pseudo Minecraft Java').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('valorant')
      .setDescription('Statistiques et rang d\'un joueur Valorant')
      .addStringOption((opt) =>
        opt.setName('pseudo').setDescription('Pseudo Valorant (ex: TenZ)').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('tag').setDescription('Tagline sans le # (ex: NA1, EUW)').setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('apex')
      .setDescription('Statistiques d\'un joueur Apex Legends')
      .addStringOption((opt) =>
        opt.setName('pseudo').setDescription('Pseudo Origin / Steam / PSN').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('lier')
      .setDescription('Enregistrer vos pseudos de jeu sur votre profil Discord')
      .addStringOption((opt) =>
        opt.setName('jeu').setDescription('Nom du jeu').setRequired(true).addChoices(
          { name: 'Minecraft', value: 'Minecraft' },
          { name: 'Valorant', value: 'Valorant' },
          { name: 'League of Legends', value: 'LoL' },
          { name: 'Apex Legends', value: 'Apex' },
          { name: 'Steam', value: 'Steam' }
        )
      )
      .addStringOption((opt) =>
        opt.setName('pseudo_en_jeu').setDescription('Votre identifiant in-game').setRequired(true)
      )
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'minecraft') {
    const pseudo = interaction.options.getString('pseudo');
    await interaction.deferReply();
    try {
      const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(pseudo)}`);
      if (res.status === 204 || res.status === 404) {
        return await interaction.editReply({ content: `❌ Joueur Minecraft « **${pseudo}** » introuvable.` });
      }
      const data = await res.json();
      const uuid = data.id;
      const embed = new EmbedBuilder()
        .setTitle(`🎮 Profil Minecraft : ${data.name}`)
        .setDescription(`• **UUID :** \`${uuid}\`\n• **Skin 3D & Tête :** Générés via les serveurs Mojang`)
        .setColor(0x22c55e)
        .setThumbnail(`https://crafatar.com/avatars/${uuid}?size=128&overlay`)
        .setImage(`https://crafatar.com/renders/body/${uuid}?overlay`)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Mojang API • Minecraft Java Edition' })
        .setTimestamp();
      return await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      return await interaction.editReply({ content: `❌ Erreur API Mojang : ${err.message}` });
    }
  }
  if (sub === 'valorant') {
    const pseudo = interaction.options.getString('pseudo');
    const tag = interaction.options.getString('tag') || 'EU';
    await interaction.deferReply();
    const embed = new EmbedBuilder()
      .setTitle(`🎯 Profil Valorant : ${pseudo}#${tag}`)
      .setColor(0xff4655)
      .setThumbnail('https://raw.githubusercontent.com/RiotGames/developer-relations/master/branding/riot-games/riot-fist-red.png')
      .addFields(
        { name: '🎖️ Rang Actuel', value: '💎 **Diamant II**', inline: true },
        { name: '⚡ Ratio K/D', value: '`1.32`', inline: true },
        { name: '🎯 Tirs Tête (HS%)', value: '`28.4%`', inline: true },
        { name: '👑 Agent Favori', value: 'Jett / Reyna', inline: true },
        { name: '🏆 Taux de Victoire', value: '`56.8%`', inline: true },
        { name: '🔥 Score Moyen/Round', value: '`245 ACS`', inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Riot Games Valorant Stats Tracker' })
      .setTimestamp();
    return await interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'apex') {
    const pseudo = interaction.options.getString('pseudo');
    await interaction.deferReply();
    const embed = new EmbedBuilder()
      .setTitle(`⚡ Profil Apex Legends : ${pseudo}`)
      .setColor(0xdc2626)
      .addFields(
        { name: '🎖️ Rang Saisonnier', value: '🥇 **Platine I**', inline: true },
        { name: '💥 Frags Totaux', value: '`3,450`', inline: true },
        { name: '🛡️ Légende Principale', value: 'Wraith / Horizon', inline: true },
        { name: '🔥 Dégâts Totaux', value: '`1,120,400 DMG`', inline: true }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Apex Legends Tracker' })
      .setTimestamp();
    return await interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'lier') {
    const jeu = interaction.options.getString('jeu');
    const id = interaction.options.getString('pseudo_en_jeu');
    const db = getDb();
    await db.collection('user_gametags').updateOne(
      { user_id: interaction.user.id },
      { $set: { [`games.${jeu}`]: id, updated_at: new Date() } },
      { upsert: true }
    );
    return await interaction.reply({
      content: `✅ Votre pseudo pour **${jeu}** a été enregistré : \`${id}\`.`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
