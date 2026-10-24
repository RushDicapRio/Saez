import { ActivityType } from 'discord.js';
import { getSaezRealStats } from './statsService.js';
let presenceIndex = 0;
let cachedStats = null;
let lastStatsFetch = 0;
export async function updateBotPresence(client) {
  if (!client?.user) return;
  try {
    const now = Date.now();
    if (!cachedStats || now - lastStatsFetch > 60 * 1000) {
      cachedStats = await getSaezRealStats().catch(() => null);
      lastStatsFetch = now;
    }
    const online = (cachedStats?.onlineUsers ?? 1).toLocaleString('fr-FR');
    const animes = (cachedStats?.totalAnimes ?? 235).toLocaleString('fr-FR');
    const episodes = (cachedStats?.totalEpisodes ?? 6794).toLocaleString('fr-FR');
    const films = (cachedStats?.totalFilms ?? 22).toLocaleString('fr-FR');
    const oav = (cachedStats?.totalOav ?? 82).toLocaleString('fr-FR');
    const statuses = [
      `🟢 Saez : ${online} en ligne`,
      `📺 ${episodes} Épisodes • ${animes} Animes`,
      `🎬 ${films} Films & ${oav} OAV • Saez`,
      `🍿 Saez Animes • Regardez en HD`,
    ];
    const currentText = statuses[presenceIndex % statuses.length];
    presenceIndex++;
    client.user.setPresence({
      activities: [
        {
          name: currentText,
          type: ActivityType.Streaming,
          url: 'https://twitch.tv/saez924', 
        },
      ],
      status: 'online',
    });
  } catch (err) {
    console.warn('[Presence] Erreur lors de la mise à jour du statut :', err.message);
  }
}
export function startStreamingPresence(client, intervalSeconds = 15) {
  updateBotPresence(client);
  setInterval(() => {
    updateBotPresence(client);
  }, intervalSeconds * 1000);
}
