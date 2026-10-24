import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserEconomy } from '../../services/economyService.js';
import { getUserLevelData, getAnimeTitleForLevel } from '../../services/discordLevelService.js';
export default {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Affiche la fiche de profil anime complète d\'un membre avec badges et niveau')
    .addUserOption((opt) => opt.setName('membre').setDescription('Membre à consulter').setRequired(false)),
  async execute(interaction) {
    const member = interaction.options.getMember('membre') || interaction.member;
    const user = member.user;
    const [wallet, levelData] = await Promise.all([
      getUserEconomy(interaction.guild.id, user.id),
      getUserLevelData(interaction.guild.id, user.id),
    ]);
    const joinedDate = member.joinedAt
      ? member.joinedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'Inconnue';
    const badges = (wallet.inventory || [])
      .filter((i) => i.category === 'badges')
      .map((b) => `🎖️ ${b.name}`);
    const badgeDisplay = badges.length > 0 ? badges.slice(0, 5).join('\n') : '*Aucun badge de boutique débloqué*';
    const currentLevel = levelData?.levelInfo?.level || 1;
    const animeTitle = getAnimeTitleForLevel(currentLevel);
    const embed = new EmbedBuilder()
      .setTitle(`🌸 Fiche de Membre — ${user.username}`)
      .setDescription(`Statut communautaire sur **${interaction.guild.name}**`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setColor(0x00e5ff)
      .addFields(
        { name: '📅 Date d\'arrivée', value: joinedDate, inline: true },
        { name: '🏆 Niveau Anime', value: `Niveau **${currentLevel}** (${animeTitle.title})`, inline: true },
        { name: '💰 Fortune', value: `**${((wallet.wallet || 0) + (wallet.bank || 0)).toLocaleString()}** Saez Coins`, inline: true },
        { name: '💬 Messages envoyés', value: `${levelData.messagesCount || 0}`, inline: true },
        { name: '🎙️ Temps vocal', value: `${Math.round((levelData.voiceSeconds || 0) / 60)} min`, inline: true },
        { name: '🎖️ Badges Collector Possédés', value: badgeDisplay, inline: false }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes Profile Card', iconURL: interaction.guild.iconURL() || undefined });
    return await interaction.reply({ embeds: [embed] });
  },
};
