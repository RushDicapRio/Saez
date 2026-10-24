import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export const data = new SlashCommandBuilder()
  .setName('news')
  .setDescription('Actualités et veille automatisée (Anime, Gaming, Tech et Recherche)')
  .addSubcommand((sub) =>
    sub
      .setName('anime')
      .setDescription('Dernières sorties et tendances de l\'animation japonaise via AniList')
  )
  .addSubcommand((sub) =>
    sub
      .setName('gaming')
      .setDescription('Grandes actualités des jeux vidéo et de l\'industrie gaming')
  )
  .addSubcommand((sub) =>
    sub
      .setName('tech')
      .setDescription('Actualités technologiques, informatique et intelligence artificielle')
  )
  .addSubcommand((sub) =>
    sub
      .setName('recherche')
      .setDescription('Rechercher les actualités récentes sur un sujet précis')
      .addStringOption((opt) =>
        opt.setName('sujet').setDescription('Mot-clé ou sujet à rechercher').setRequired(true)
      )
  );
export async function execute(interaction) {
  await interaction.deferReply();
  const sub = interaction.options.getSubcommand();
  if (sub === 'anime') {
    try {
      const query = `
        query {
          Page(page: 1, perPage: 5) {
            media(sort: TRENDING_DESC, type: ANIME) {
              id
              title {
                romaji
                english
              }
              coverImage {
                large
              }
              format
              episodes
              averageScore
              siteUrl
            }
          }
        }
      `;
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query }),
      });
      const json = await res.json();
      const list = json?.data?.Page?.media || [];
      const embed = new EmbedBuilder()
        .setTitle('🎌 Tendances Anime du Moment — AniList')
        .setColor(0x00e5ff)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Données en direct via AniList GraphQL' })
        .setTimestamp();
      if (list.length > 0 && list[0].coverImage?.large) {
        embed.setThumbnail(list[0].coverImage.large);
      }
      list.forEach((m, idx) => {
        const title = m.title.english || m.title.romaji;
        const score = m.averageScore ? `⭐ ${m.averageScore}%` : '⭐ N/A';
        const eps = m.episodes ? `${m.episodes} épisodes` : 'En cours';
        embed.addFields({
          name: `${idx + 1}. ${title}`,
          value: `Format : **${m.format}** • ${eps} • ${score}\n🔗 [Voir sur AniList](${m.siteUrl})`,
          inline: false,
        });
      });
      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      return interaction.editReply({ content: '❌ Impossible de récupérer les actualités anime.' });
    }
  }
  if (sub === 'gaming') {
    try {
      const res = await fetch('https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=730&count=4&maxlength=200&format=json');
      const json = await res.json();
      const items = json?.appnews?.newsitems || [];
      const embed = new EmbedBuilder()
        .setTitle('🎮 Actualités Gaming & Mises à Jour')
        .setColor(0xec4899)
        .setDescription('Dernières annonces et patchs majeurs de la scène gaming :')
        .setFooter({ text: 'Codé avec ❤️ par Saez | Flux officiel Valve & Partenaires' })
        .setTimestamp();
      items.forEach((item) => {
        const cleanContents = (item.contents || '')
          .replace(/\[.*?\]/g, '')
          .replace(/<.*?>/g, '')
          .slice(0, 140);
        embed.addFields({
          name: `📰 ${item.title}`,
          value: `${cleanContents}...\n🔗 [Lire l'article](${item.url})`,
          inline: false,
        });
      });
      return interaction.editReply({ embeds: [embed] });
    } catch {
      return interaction.editReply({ content: '❌ Erreur lors de la récupération des actualités gaming.' });
    }
  }
  if (sub === 'tech') {
    try {
      const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
      const ids = (await res.json()).slice(0, 5);
      const items = await Promise.all(
        ids.map((id) =>
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((r) => r.json())
        )
      );
      const embed = new EmbedBuilder()
        .setTitle('⚡ Tech & Intelligence Artificielle — À la Une')
        .setColor(0x10b981)
        .setDescription('Les sujets et innovations tech les plus populaires du moment :')
        .setFooter({ text: 'Codé avec ❤️ par Saez | Flux Hacker News & Tech Community' })
        .setTimestamp();
      items.forEach((item, idx) => {
        const link = item.url || `https://news.ycombinator.com/item?id=${item.id}`;
        embed.addFields({
          name: `${idx + 1}. ${item.title}`,
          value: `👍 **${item.score || 0}** points • 💬 **${item.descendants || 0}** commentaires\n🔗 [Lire la source](${link})`,
          inline: false,
        });
      });
      return interaction.editReply({ embeds: [embed] });
    } catch {
      return interaction.editReply({ content: '❌ Impossible de contacter les flux tech.' });
    }
  }
  if (sub === 'recherche') {
    const query = interaction.options.getString('sujet');
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=fr&gl=FR&ceid=FR:fr`;
      const res = await fetch(url);
      const text = await res.text();
      const items = [];
      const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>/g;
      let match;
      while ((match = itemRegex.exec(text)) !== null && items.length < 5) {
        items.push({
          title: match[1].replace(/<!\[CDATA\[(.*?)\]\]>/, '$1'),
          link: match[2],
        });
      }
      const embed = new EmbedBuilder()
        .setTitle(`🔍 Actualités Récentes : "${query}"`)
        .setColor(0x38bdf8)
        .setFooter({ text: 'Codé avec ❤️ par Saez | Google News France' })
        .setTimestamp();
      if (items.length === 0) {
        embed.setDescription(`Aucune actualité trouvée pour le sujet **${query}**.`);
      } else {
        items.forEach((item, idx) => {
          embed.addFields({
            name: `${idx + 1}. ${item.title}`,
            value: `🔗 [Lire l'article](${item.link})`,
            inline: false,
          });
        });
      }
      return interaction.editReply({ embeds: [embed] });
    } catch {
      return interaction.editReply({ content: '❌ Erreur lors de la recherche d\'actualités.' });
    }
  }
}
