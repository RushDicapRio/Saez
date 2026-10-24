import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  MessageFlags,
  ComponentType,
} from 'discord.js';
export default {
  data: new SlashCommandBuilder()
    .setName('onboarding')
    .setDescription('Parcours d\'accueil et questionnaire interactif des nouveaux membres')
    .addSubcommand((sub) =>
      sub.setName('start').setDescription('Lancer votre questionnaire de bienvenue et choisir vos rôles d\'intérêt')
    )
    .addSubcommand((sub) =>
      sub.setName('panel').setDescription('Déployer le panneau interactif fixe de parcours de bienvenue (Mod/Admin)')
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const buildOnboardingEmbed = () => {
      return new EmbedBuilder()
        .setTitle('🌸 Bienvenue sur Saez Animes — Choisissez vos passions !')
        .setDescription(
          'Bienvenue dans notre communauté anime & gaming !\n' +
          'Sélectionnez ci-dessous vos **centres d\'intérêt** pour obtenir vos rôles personnalisés et débloquer les salons correspondants :'
        )
        .setColor(0x00e5ff)
        .addFields(
          { name: '⚔️ Shônen & Action', value: 'Discussions One Piece, JJK, Solo Leveling, MHA...', inline: true },
          { name: '🧠 Seinen & Psychologique', value: 'Berserk, Vinland Saga, Monster, Death Note...', inline: true },
          { name: '✨ Isekai & Fantasy', value: 'Slime, Re:Zero, Mushoku Tensei, Overlord...', inline: true },
          { name: '🎤 Karaoké & Musique', value: 'Openings, Endings, sessions chant en vocal...', inline: true },
          { name: '🎮 Gaming & PC', value: 'Recherche de joueurs, tournois et jeux anime...', inline: true },
          { name: '🎨 Création & Fanarts', value: 'Dessins, graphisme, montages vidéo AMV...', inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Sélectionnez vos rôles dans le menu déroulant ci-dessous' });
    };
    const buildOnboardingRow = () => {
      const select = new StringSelectMenuBuilder()
        .setCustomId('onboarding_interests_select')
        .setPlaceholder('🎯 Cliquez ici pour choisir vos rôles d\'intérêts...')
        .setMinValues(1)
        .setMaxValues(6)
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel('Shônen & Action').setValue('interet_shonen').setEmoji('⚔️'),
          new StringSelectMenuOptionBuilder().setLabel('Seinen & Psychologique').setValue('interet_seinen').setEmoji('🧠'),
          new StringSelectMenuOptionBuilder().setLabel('Isekai & Fantasy').setValue('interet_isekai').setEmoji('✨'),
          new StringSelectMenuOptionBuilder().setLabel('Karaoké & Musique').setValue('interet_karaoke').setEmoji('🎤'),
          new StringSelectMenuOptionBuilder().setLabel('Gaming & PC').setValue('interet_gaming').setEmoji('🎮'),
          new StringSelectMenuOptionBuilder().setLabel('Création & Fanarts').setValue('interet_fanarts').setEmoji('🎨')
        );
      return new ActionRowBuilder().addComponents(select);
    };
    if (sub === 'panel') {
      if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
        return await interaction.reply({ content: '❌ Permission requise : Gérer le serveur.', flags: MessageFlags.Ephemeral });
      }
      await interaction.channel.send({
        embeds: [buildOnboardingEmbed()],
        components: [buildOnboardingRow()],
      });
      return await interaction.reply({
        content: '✅ Le panneau de parcours de bienvenue a été déployé dans ce salon !',
        flags: MessageFlags.Ephemeral,
      });
    }
    if (sub === 'start') {
      const response = await interaction.reply({
        embeds: [buildOnboardingEmbed()],
        components: [buildOnboardingRow()],
        flags: MessageFlags.Ephemeral,
      });
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 120_000,
      });
      collector.on('collect', async (i) => {
        if (i.customId !== 'onboarding_interests_select') return;
        const selected = i.values;
        await i.reply({
          content: `✅ Vos centres d'intérêt (${selected.length} sélectionné(s)) ont été enregistrés ! Vos accès aux salons dédiés sont désormais activés.`,
          flags: MessageFlags.Ephemeral,
        });
      });
    }
  },
};
