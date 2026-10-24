import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';
export default {
  data: new SlashCommandBuilder()
    .setName('tempchannel')
    .setDescription('Gestion des salons textuels temporaires et espaces de discussion privés')
    .addSubcommand((sub) =>
      sub
        .setName('creer')
        .setDescription('Créer un salon textuel temporaire éphémère')
        .addStringOption((opt) => opt.setName('nom').setDescription('Nom du salon textuel').setRequired(true))
        .addBooleanOption((opt) => opt.setName('prive').setDescription('Salon privé (accessible uniquement sur invitation)').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('inviter')
        .setDescription('Inviter un membre dans votre salon temporaire privé')
        .addUserOption((opt) => opt.setName('membre').setDescription('Membre à autoriser').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName('fermer').setDescription('Ferme et supprime immédiatement votre salon temporaire')
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;
    const member = interaction.member;
    if (sub === 'creer') {
      const name = interaction.options.getString('nom').toLowerCase().replace(/\s+/g, '-');
      const isPrivate = interaction.options.getBoolean('prive') || false;
      const permissionOverwrites = [
        {
          id: guild.roles.everyone.id,
          deny: isPrivate ? [PermissionFlagsBits.ViewChannel] : [],
          allow: isPrivate ? [] : [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        },
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.AttachFiles,
          ],
        },
      ];
      const newChannel = await guild.channels.create({
        name: `⏳-${name}`,
        type: ChannelType.GuildText,
        parent: interaction.channel.parentId || undefined,
        permissionOverwrites,
        topic: `Salon temporaire créé par ${member.user.username}. Tapez /tempchannel fermer pour clôturer.`,
      });
      const welcomeEmbed = new EmbedBuilder()
        .setTitle('⏳ Salon Textuel Éphémère')
        .setDescription(
          `Bienvenue dans votre salon temporaire <#${newChannel.id}> !\n` +
          `• **Statut :** ${isPrivate ? '🔒 Privé' : '🌐 Public'}\n` +
          `• **Propriétaire :** <@${member.id}>\n\n` +
          `Invitez des amis avec \`/tempchannel inviter\` ou supprimez-le avec \`/tempchannel fermer\`.`
        )
        .setColor(0x00e5ff)
        .setFooter({ text: 'Codé avec ❤️ par Saez' });
      await newChannel.send({ embeds: [welcomeEmbed] });
      return await interaction.reply({
        content: `✅ Votre salon temporaire a été créé : <#${newChannel.id}> !`,
        flags: MessageFlags.Ephemeral,
      });
    }
    if (sub === 'inviter') {
      const channel = interaction.channel;
      if (!channel.name.startsWith('⏳-')) {
        return await interaction.reply({
          content: '❌ Cette commande ne peut être utilisée que dans un salon temporaire (`⏳-...`).',
          flags: MessageFlags.Ephemeral,
        });
      }
      const target = interaction.options.getUser('membre');
      await channel.permissionOverwrites.edit(target.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      });
      return await interaction.reply({
        content: `✅ <@${target.id}> a été ajouté à ce salon temporaire !`,
      });
    }
    if (sub === 'fermer') {
      const channel = interaction.channel;
      if (!channel.name.startsWith('⏳-') && !member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return await interaction.reply({
          content: '❌ Vous ne pouvez fermer que vos propres salons temporaires créés via `/tempchannel creer`.',
          flags: MessageFlags.Ephemeral,
        });
      }
      await interaction.reply({ content: '🗑️ Suppression du salon temporaire dans 5 secondes...' });
      setTimeout(() => {
        channel.delete().catch(() => {});
      }, 5000);
    }
  },
};
