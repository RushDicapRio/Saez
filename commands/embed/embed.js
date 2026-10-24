import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
  ComponentType,
} from 'discord.js';
const TEMPLATES = {
  annonce_anime: {
    title: '🎬 NOUVEL ÉPISODE DISPONIBLE ! — Saez Animes',
    description:
      'Un nouvel épisode vient d\'être ajouté au catalogue Saez Animes !\n\n' +
      '**Titre de l\'œuvre :** Solo Leveling - Saison 2\n' +
      '**Épisode :** Épisode 08 (VOSTFR & VF)\n' +
      '**Qualité :** 1080p Ultra HD • 60 FPS\n\n' +
      'Lancez votre application Saez Animes ou rendez-vous sur votre espace membre pour visionner l\'épisode sans aucune publicité !',
    color: 0x00e5ff,
    banner: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1000&q=80',
    thumbnail: 'https://raw.githubusercontent.com/saezanimes/assets/main/logo.png',
    footer: 'Saez Animes • Le streaming anime nouvelle génération',
  },
  reglement: {
    title: '📜 RÈGLEMENT OFFICIEL DU SERVEUR — Saez Animes',
    description:
      'Afin de garantir une ambiance conviviale et respectueuse pour tous les passionnés d\'anime, merci de respecter ces consignes :\n\n' +
      '1️⃣ **Respect & Bienveillance :** Aucun propos haineux, harcèlement ou discrimination ne sera toléré.\n' +
      '2️⃣ **Pas de Spoilers :** Utilisez obligatoirement les balises spoiler `||spoiler||` pour discuter des scans récents.\n' +
      '3️⃣ **Pas de Publicité sauvage :** La pub en MP ou dans les salons généraux est strictement interdite.\n' +
      '4️⃣ **Utilisation des Salons :** Merci de poster vos messages et commandes dans les salons appropriés.\n\n' +
      'L\'équipe de modération se réserve le droit de sanctionner tout manquement à ce règlement.',
    color: 0xff2d7b,
    banner: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1000&q=80',
    thumbnail: 'https://raw.githubusercontent.com/saezanimes/assets/main/logo.png',
    footer: 'L\'équipe de modération de Saez Animes',
  },
  evenement: {
    title: '🎉 SOIRÉE SPÉCIALE COMMUNAUTÉ — Saez Animes',
    description:
      'Rejoignez-nous ce week-end pour notre grande soirée animée !\n\n' +
      '🎮 **Au programme :**\n' +
      '• Visionnage collectif de longs-métrages anime\n' +
      '• Tournoi de blind test & karaoké en vocal\n' +
      '• Tirage au sort de rôles VIP et récompenses exclusives\n\n' +
      'Cliquez sur le bouton ci-dessous pour confirmer votre présence !',
    color: 0x8b5cf6,
    banner: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1000&q=80',
    thumbnail: 'https://raw.githubusercontent.com/saezanimes/assets/main/logo.png',
    footer: 'Saez Animes Community Events',
  },
};
export default {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Créateur avancé d\'embeds interactifs, bannières et modèles')
    .addSubcommand((sub) =>
      sub
        .setName('creer')
        .setDescription('Créer un embed sur-mesure avec prévisualisation avant publication')
        .addStringOption((opt) => opt.setName('titre').setDescription('Titre principal de l\'embed').setRequired(true))
        .addStringOption((opt) => opt.setName('description').setDescription('Contenu textuel de l\'embed').setRequired(true))
        .addStringOption((opt) =>
          opt
            .setName('couleur')
            .setDescription('Couleur hexadécimale (ex: #00e5ff, #ff2d7b, #8b5cf6) ou cyan, rose, violet')
            .setRequired(false)
        )
        .addStringOption((opt) => opt.setName('image_banniere').setDescription('URL de la grande image en bannière').setRequired(false))
        .addStringOption((opt) => opt.setName('miniature').setDescription('URL de la petite miniature en haut à droite').setRequired(false))
        .addStringOption((opt) => opt.setName('pied_de_page').setDescription('Texte du bas de page (footer)').setRequired(false))
        .addChannelOption((opt) =>
          opt
            .setName('salon')
            .setDescription('Salon de destination où publier le message (par défaut salon actuel)')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('modeles')
        .setDescription('Charge un modèle d\'embed pré-conçu avec mise en page professionnelle')
        .addStringOption((opt) =>
          opt
            .setName('type')
            .setDescription('Modèle à charger')
            .setRequired(true)
            .addChoices(
              { name: '🎬 Sortie d\'Anime & Épisode', value: 'annonce_anime' },
              { name: '📜 Règlement & Règles du Serveur', value: 'reglement' },
              { name: '🎉 Événement & Soirée Communautaire', value: 'evenement' }
            )
        )
        .addChannelOption((opt) =>
          opt
            .setName('salon')
            .setDescription('Salon où envoyer le modèle')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub.setName('help').setDescription('Guide d\'utilisation et astuces du constructeur d\'embeds')
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'help') {
      const helpEmbed = new EmbedBuilder()
        .setTitle('🎨 Guide — Créateur d\'Embeds Saez Animes')
        .setDescription(
          'Créez des annonces stylées, des fiches de règlement ou des messages d\'information enrichis avec mise en page responsive et boutons interactifs !'
        )
        .setColor(0x00e5ff)
        .addFields(
          {
            name: '✨ `/embed creer`',
            value:
              'Permet de personnaliser le titre, la description, la couleur (ex: `#00e5ff`), la grande bannière et la miniature. ' +
              'Une prévisualisation vous est d\'abord montrée avec des boutons pour **confirmer** ou **annuler**.',
          },
          {
            name: '📋 `/embed modeles`',
            value: 'Charge instantanément un modèle soigné (Sortie Anime, Règlement, Soirée communautaire) prêt à l\'envoi.',
          },
          {
            name: '💡 Couleurs suggérées',
            value: '• Cyan Saez : `#00e5ff`\n• Rose Vif : `#ff2d7b`\n• Violet Neon : `#8b5cf6`\n• Or VIP : `#fbbf24`',
          }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Saez Animes Embed Studio', iconURL: interaction.guild?.iconURL() || undefined });
      return await interaction.reply({ embeds: [helpEmbed], flags: MessageFlags.Ephemeral });
    }
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) &&
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      return await interaction.reply({
        content: '❌ Vous devez posséder la permission **Gérer les messages** ou être Administrateur pour créer et publier des embeds.',
        flags: MessageFlags.Ephemeral,
      });
    }
    if (sub === 'modeles') {
      const templateKey = interaction.options.getString('type');
      const targetChannel = interaction.options.getChannel('salon') || interaction.channel;
      const tpl = TEMPLATES[templateKey];
      if (!tpl) {
        return await interaction.reply({ content: '❌ Modèle introuvable.', flags: MessageFlags.Ephemeral });
      }
      const embed = new EmbedBuilder()
        .setTitle(tpl.title)
        .setDescription(tpl.description)
        .setColor(tpl.color)
        .setImage(tpl.banner)
        .setThumbnail(tpl.thumbnail)
        .setFooter({ text: 'Codé avec ❤️ par Saez' + tpl.footer, iconURL: interaction.guild?.iconURL() || undefined })
        .setTimestamp();
      const previewRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('embed_publish_confirm').setLabel('✅ Confirmer & Publier').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('embed_cancel').setLabel('❌ Annuler').setStyle(ButtonStyle.Secondary)
      );
      const replyMsg = await interaction.reply({
        content: `👁️ **Prévisualisation du modèle [${templateKey}]** avant publication dans ${targetChannel} :`,
        embeds: [embed],
        components: [previewRow],
        flags: MessageFlags.Ephemeral,
      });
      const collector = replyMsg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120_000,
      });
      collector.on('collect', async (btnInt) => {
        if (btnInt.customId === 'embed_publish_confirm') {
          await targetChannel.send({ embeds: [embed] });
          await btnInt.update({
            content: `✅ L'embed a été publié avec succès dans le salon ${targetChannel} !`,
            components: [],
          });
        } else if (btnInt.customId === 'embed_cancel') {
          await btnInt.update({
            content: '❌ Publication annulée.',
            embeds: [],
            components: [],
          });
        }
      });
      return;
    }
    if (sub === 'creer') {
      const title = interaction.options.getString('titre');
      const description = interaction.options.getString('description').replace(/\\n/g, '\n');
      const rawColor = interaction.options.getString('couleur') || '#00e5ff';
      const banner = interaction.options.getString('image_banniere');
      const thumbnail = interaction.options.getString('miniature');
      const footer = interaction.options.getString('pied_de_page') || 'Saez Animes';
      const targetChannel = interaction.options.getChannel('salon') || interaction.channel;
      let colorInt = 0x00e5ff;
      if (rawColor.toLowerCase() === 'rose') colorInt = 0xff2d7b;
      else if (rawColor.toLowerCase() === 'violet') colorInt = 0x8b5cf6;
      else if (rawColor.toLowerCase() === 'or') colorInt = 0xfbbf24;
      else if (rawColor.startsWith('#')) {
        const hex = parseInt(rawColor.replace('#', ''), 16);
        if (!isNaN(hex)) colorInt = hex;
      }
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(colorInt)
        .setFooter({ text: 'Codé avec ❤️ par Saez' + footer, iconURL: interaction.guild?.iconURL() || undefined })
        .setTimestamp();
      if (banner && (banner.startsWith('http://') || banner.startsWith('https://'))) {
        embed.setImage(banner);
      }
      if (thumbnail && (thumbnail.startsWith('http://') || thumbnail.startsWith('https://'))) {
        embed.setThumbnail(thumbnail);
      }
      const previewRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('embed_pub_go').setLabel(`🚀 Publier dans #${targetChannel.name}`).setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('embed_pub_cancel').setLabel('Annuler').setStyle(ButtonStyle.Secondary)
      );
      const reply = await interaction.reply({
        content: `👁️ **Aperçu en direct de votre Embed :**\n*(Destination : ${targetChannel})*`,
        embeds: [embed],
        components: [previewRow],
        flags: MessageFlags.Ephemeral,
      });
      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 180_000,
      });
      collector.on('collect', async (b) => {
        if (b.customId === 'embed_pub_go') {
          await targetChannel.send({ embeds: [embed] });
          await b.update({
            content: `🎉 Embed envoyé avec succès dans ${targetChannel} !`,
            components: [],
          });
        } else {
          await b.update({
            content: '❌ Création annulée.',
            embeds: [],
            components: [],
          });
        }
      });
    }
  },
};
