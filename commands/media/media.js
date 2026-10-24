import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder()
  .setName('media')
  .setDescription('Outils de recherche et de création de médias visuels')
  .addSubcommand((sub) =>
    sub
      .setName('image')
      .setDescription('Rechercher un fond d\'écran ou une illustration haute définition')
      .addStringOption((opt) =>
        opt.setName('sujet').setDescription('Thème ou personnage recherché (ex: Solo Leveling, Cyberpunk...)').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('gif')
      .setDescription('Rechercher une animation GIF')
      .addStringOption((opt) =>
        opt.setName('sujet').setDescription('Émotion, action ou anime (ex: dance, laugh, gojo...)').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('meme')
      .setDescription('Générer un mème avec du texte personnalisé')
      .addStringOption((opt) =>
        opt.setName('haut').setDescription('Texte du haut').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('bas').setDescription('Texte du bas').setRequired(false)
      )
      .addStringOption((opt) =>
        opt
          .setName('modele')
          .setDescription('Modèle de mème')
          .addChoices(
            { name: 'Drake Hotline Bling', value: 'drake' },
            { name: 'Distracted Boyfriend', value: 'distracted' },
            { name: 'Two Buttons', value: 'buttons' },
            { name: 'Change My Mind', value: 'changemymind' },
            { name: 'Disaster Girl', value: 'disastergirl' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('info')
      .setDescription('Analyser les métadonnées et dimensions d\'une image')
      .addAttachmentOption((opt) =>
        opt.setName('fichier').setDescription('Image à analyser').setRequired(true)
      )
  );
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'image') {
    await interaction.deferReply();
    const query = interaction.options.getString('sujet');
    try {
      const url = `https://wallhaven.cc/api/v1/search?q=${encodeURIComponent(query)}&sorting=random&categories=010&purity=100`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data?.data || data.data.length === 0) {
        return interaction.editReply({ content: `❌ Aucune illustration trouvée pour "${query}". Essayez un mot-clé plus générique.` });
      }
      const wallpaper = data.data[0];
      const embed = new EmbedBuilder()
        .setTitle(`🖼️ Illustration HD : ${query}`)
        .setImage(wallpaper.path)
        .setColor(0x00e5ff)
        .addFields(
          { name: '📐 Résolution', value: wallpaper.resolution || 'Inconnue', inline: true },
          { name: '👁️ Vues', value: `${wallpaper.views || 0}`, inline: true },
          { name: '❤️ Favoris', value: `${wallpaper.favorites || 0}`, inline: true }
        )
        .setFooter({ text: 'Codé avec ❤️ par Saez | Source : Wallhaven HD Archive' })
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    } catch {
      return interaction.editReply({ content: '❌ Erreur de connexion au service d\'images.' });
    }
  }
  if (sub === 'gif') {
    await interaction.deferReply();
    const query = interaction.options.getString('sujet');
    try {
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(query)}&limit=15&rating=g`);
      const data = await res.json();
      if (!data?.data || data.data.length === 0) {
        return interaction.editReply({ content: `❌ Aucun GIF trouvé pour "${query}".` });
      }
      const randomGif = data.data[Math.floor(Math.random() * data.data.length)];
      const gifUrl = randomGif.images?.original?.url || randomGif.images?.downsized?.url;
      const embed = new EmbedBuilder()
        .setTitle(`🎞️ Animation GIF : ${query}`)
        .setImage(gifUrl)
        .setColor(0xec4899)
        .setFooter({ text: 'Codé avec ❤️ par Saez | GIPHY Service' })
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    } catch {
      return interaction.editReply({ content: '❌ Impossible de contacter le service GIF.' });
    }
  }
  if (sub === 'meme') {
    await interaction.deferReply();
    const topText = interaction.options.getString('haut');
    const bottomText = interaction.options.getString('bas') || '';
    const template = interaction.options.getString('modele') || 'drake';
    function cleanMemeText(str) {
      return encodeURIComponent(
        str.replace(/_/g, '__').replace(/-/g, '--').replace(/\?/g, '~q').replace(/%/g, '~p').replace(/#/g, '~h').replace(/\//g, '~s')
      );
    }
    const memeUrl = `https://api.memegen.link/images/${template}/${cleanMemeText(topText)}/${cleanMemeText(bottomText || '_')}.png`;
    const embed = new EmbedBuilder()
      .setTitle('🎭 Mème Généré')
      .setImage(memeUrl)
      .setColor(0xfbbf24)
      .setFooter({ text: 'Codé avec ❤️ par Saez | Généré via Memegen Engine' })
      .setTimestamp();
    return interaction.editReply({ embeds: [embed] });
  }
  if (sub === 'info') {
    const attachment = interaction.options.getAttachment('fichier');
    if (!attachment.contentType || !attachment.contentType.startsWith('image/')) {
      return interaction.reply({ content: '❌ Le fichier envoyé n\'est pas une image valide.', ephemeral: true });
    }
    const embed = new EmbedBuilder()
      .setTitle('🔍 Analyse de l\'Image')
      .setColor(0x00e5ff)
      .setThumbnail(attachment.url)
      .addFields(
        { name: '📁 Nom du fichier', value: attachment.name, inline: true },
        { name: '💾 Poids', value: `${(attachment.size / 1024).toFixed(2)} Ko`, inline: true },
        { name: '📑 Type MIME', value: attachment.contentType, inline: true },
        { name: '📐 Dimensions', value: attachment.width && attachment.height ? `${attachment.width} × ${attachment.height} px` : 'Non détecté', inline: true },
        { name: '🔗 Lien Direct', value: `[Ouvrir l'image](${attachment.url})`, inline: false }
      )
      .setFooter({ text: 'Codé avec ❤️ par Saez | Outil d\'analyse visuelle Saez' })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
}
