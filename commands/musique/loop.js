import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { getGuildQueue, canControlMusic } from '../../services/musicService.js';
export default {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Active ou désactive la répétition du morceau ou de la file')
    .addStringOption((opt) =>
      opt
        .setName('mode')
        .setDescription('Mode de répétition souhaité')
        .setRequired(true)
        .addChoices(
          { name: '❌ Désactivé', value: 'off' },
          { name: '🔂 Répéter la piste actuelle', value: 'track' },
          { name: '🔁 Répéter toute la file d\'attente', value: 'queue' }
        )
    ),
  async execute(interaction) {
    const queue = getGuildQueue(interaction.guild.id);
    if (!queue || !queue.currentTrack) {
      return await interaction.reply({
        content: '❌ Aucune musique n\'est actuellement en cours de lecture.',
        flags: MessageFlags.Ephemeral,
      });
    }
    if (!canControlMusic(interaction.member, queue)) {
      return await interaction.reply({
        content: '❌ Vous devez être dans le salon vocal pour changer le mode de répétition.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const mode = interaction.options.getString('mode');
    queue.loopMode = mode;
    const labelMap = {
      off: 'Désactivé',
      track: '🔂 Répétition de la piste en cours',
      queue: '🔁 Répétition de la file entière',
    };
    const embed = new EmbedBuilder()
      .setTitle('🔁 Mode de répétition mis à jour')
      .setDescription(`Le mode de lecture est maintenant : **${labelMap[mode]}**.`)
      .setColor(0x00e5ff)
      .setFooter({ text: `Codé avec ❤️ par Saez | Modifié par ${interaction.user.username}` });
    return await interaction.reply({ embeds: [embed] });
  },
};
