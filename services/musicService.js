import { spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { exec } from 'node:child_process';
const execPromise = promisify(exec);
let voiceModule = null;
try {
  voiceModule = await import('@discordjs/voice');
} catch (e) {
  console.warn('[MUSIC] @discordjs/voice non chargé ou dépendance native manquante.');
}
const queues = new Map();
export function detectPlatform(query) {
  const q = query.toLowerCase();
  if (q.includes('music.youtube.com')) return { name: 'YouTube Music', icon: '🎵', color: 0xff0000 };
  if (q.includes('youtube.com') || q.includes('youtu.be')) return { name: 'YouTube', icon: '▶️', color: 0xff0000 };
  if (q.includes('spotify.com')) return { name: 'Spotify', icon: '🟢', color: 0x1db954 };
  if (q.includes('deezer.com') || q.includes('deezer.page.link')) return { name: 'Deezer', icon: '🟣', color: 0x9333ea };
  if (q.includes('soundcloud.com')) return { name: 'SoundCloud', icon: '🟠', color: 0xff5500 };
  return { name: 'Recherche Saez Music', icon: '🔍', color: 0x00e5ff };
}
export async function resolveTrack(query, requestedBy) {
  const platform = detectPlatform(query);
  let title = query.trim();
  let artist = 'Artiste inconnu';
  let duration = '03:45';
  let url = query.startsWith('http') ? query : `ytsearch1:${query}`;
  let thumbnail = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80';
  try {
    const targetQuery = query.startsWith('http') ? query : `ytsearch1:${query}`;
    const { stdout } = await execPromise(
      `yt-dlp --no-warnings -q --print "%(title)s###%(uploader)s###%(duration_string)s###%(webpage_url)s###%(thumbnail)s" "${targetQuery.replace(/"/g, '\\"')}"`,
      { timeout: 8000 }
    );
    const parts = stdout.trim().split('###');
    if (parts.length >= 4) {
      title = parts[0]?.trim() || title;
      artist = parts[1]?.trim() || artist;
      duration = parts[2]?.trim() || duration;
      url = parts[3]?.trim() || url;
      if (parts[4]?.trim()) {
        thumbnail = parts[4].trim();
      }
    }
  } catch (err) {
    if (query.includes('spotify.com/track/')) {
      const match = query.match(/track\/([a-zA-Z0-9]+)/);
      title = `Titre Spotify (${match ? match[1] : 'Audio'})`;
      artist = 'Spotify Music';
      thumbnail = 'https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png';
    } else if (query.includes('deezer.com/track/')) {
      const match = query.match(/track\/([0-9]+)/);
      title = `Piste Deezer #${match ? match[1] : 'Audio'}`;
      artist = 'Deezer Audio Stream';
      thumbnail = 'https://e-cdns-images.dzcdn.net/images/misc/deezer-logo.png';
    } else if (query.includes('soundcloud.com/')) {
      title = query.split('/').filter(Boolean).pop().replace(/-/g, ' ');
      artist = 'SoundCloud Artist';
      thumbnail = 'https://a-v2.sndcdn.com/assets/images/brand/sound-cloud-logo.png';
    } else if (query.startsWith('http')) {
      title = 'Piste Audio en Streaming';
      artist = platform.name;
    } else {
      artist = 'Sélection Saez Music';
    }
  }
  return {
    title,
    artist,
    url,
    platform: platform.name,
    platformIcon: platform.icon,
    color: platform.color,
    duration,
    thumbnail,
    requestedBy: {
      id: requestedBy.id,
      username: requestedBy.username || requestedBy.tag || 'Membre',
      avatar: requestedBy.displayAvatarURL ? requestedBy.displayAvatarURL() : undefined,
    },
    addedAt: Date.now(),
  };
}
export function getGuildQueue(guildId) {
  if (!queues.has(guildId)) {
    queues.set(guildId, {
      guildId,
      voiceChannelId: null,
      textChannelId: null,
      connection: null,
      player: null,
      subscription: null,
      ytProcess: null,
      currentResource: null,
      tracks: [],
      currentTrack: null,
      isPlaying: false,
      isPaused: false,
      volume: 80,
      loopMode: 'off', 
      history: [],
    });
  }
  return queues.get(guildId);
}
export async function startPlayingTrack(guildId) {
  const queue = queues.get(guildId);
  if (!queue || !queue.currentTrack || !queue.connection) {
    return false;
  }
  if (!voiceModule) {
    console.warn('[MUSIC] Impossible de lancer l\'audio : @discordjs/voice absent');
    return false;
  }
  if (queue.ytProcess) {
    try {
      queue.ytProcess.kill('SIGKILL');
    } catch {}
    queue.ytProcess = null;
  }
  if (!queue.player) {
    queue.player = voiceModule.createAudioPlayer({
      behaviors: {
        noSubscriber: voiceModule.NoSubscriberBehavior.Play,
      },
    });
    queue.player.on(voiceModule.AudioPlayerStatus.Idle, () => {
      const next = playNextTrack(guildId);
      if (next) {
        startPlayingTrack(guildId);
      } else {
        queue.isPlaying = false;
        queue.isPaused = false;
        queue.currentTrack = null;
      }
    });
    queue.player.on('error', (error) => {
      console.warn(`[MUSIC] Erreur de lecture sur le serveur ${guildId} :`, error.message);
      const next = playNextTrack(guildId);
      if (next) {
        startPlayingTrack(guildId);
      } else {
        queue.isPlaying = false;
        queue.isPaused = false;
        queue.currentTrack = null;
      }
    });
    try {
      queue.subscription = queue.connection.subscribe(queue.player);
    } catch (err) {
      console.warn('[MUSIC] Erreur subscription connection -> player :', err.message);
    }
  }
  try {
    const ytProcess = spawn(
      'yt-dlp',
      [
        '-o', '-',
        '-q',
        '--no-warnings',
        '-f', 'bestaudio/best',
        '--buffer-size', '16K',
        queue.currentTrack.url,
      ],
      { stdio: ['ignore', 'pipe', 'ignore'] }
    );
    queue.ytProcess = ytProcess;
    const resource = voiceModule.createAudioResource(ytProcess.stdout, {
      inputType: voiceModule.StreamType.Arbitrary,
      inlineVolume: true,
    });
    if (resource.volume) {
      resource.volume.setVolume(Math.max(0, Math.min(100, queue.volume || 80)) / 100);
    }
    queue.currentResource = resource;
    queue.player.play(resource);
    queue.isPlaying = true;
    queue.isPaused = false;
    return true;
  } catch (err) {
    console.error(`[MUSIC] Échec du lancement audio pour ${queue.currentTrack.title} :`, err);
    return false;
  }
}
export function destroyGuildQueue(guildId) {
  const queue = queues.get(guildId);
  if (queue) {
    if (queue.ytProcess) {
      try { queue.ytProcess.kill('SIGKILL'); } catch {}
      queue.ytProcess = null;
    }
    if (queue.player && typeof queue.player.stop === 'function') {
      try { queue.player.stop(); } catch {}
    }
    if (queue.connection && typeof queue.connection.destroy === 'function') {
      try { queue.connection.destroy(); } catch {}
    }
    queues.delete(guildId);
  }
}
export function canControlMusic(member, queue) {
  if (!member) return false;
  if (member.permissions?.has('Administrator') || member.permissions?.has('ManageGuild') || member.permissions?.has('ManageMessages')) {
    return true;
  }
  if (queue?.currentTrack && queue.currentTrack.requestedBy.id === member.id) {
    return true;
  }
  if (member.voice?.channelId && queue?.voiceChannelId && member.voice.channelId === queue.voiceChannelId) {
    return true;
  }
  return false;
}
export async function connectToVoice(voiceChannel) {
  if (!voiceModule) return null;
  try {
    const connection = voiceModule.joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: false,
    });
    return connection;
  } catch (err) {
    console.warn('[MUSIC] Impossible de rejoindre le vocal:', err.message);
    return null;
  }
}
export function playNextTrack(guildId) {
  const queue = queues.get(guildId);
  if (!queue) return null;
  if (queue.loopMode === 'track' && queue.currentTrack) {
    queue.isPlaying = true;
    queue.isPaused = false;
    return queue.currentTrack;
  }
  if (queue.currentTrack) {
    queue.history.push(queue.currentTrack);
    if (queue.loopMode === 'queue') {
      queue.tracks.push(queue.currentTrack);
    }
  }
  if (queue.tracks.length === 0) {
    queue.currentTrack = null;
    queue.isPlaying = false;
    queue.isPaused = false;
    if (queue.player && typeof queue.player.stop === 'function') {
      try { queue.player.stop(); } catch {}
    }
    return null;
  }
  const next = queue.tracks.shift();
  queue.currentTrack = next;
  queue.isPlaying = true;
  queue.isPaused = false;
  return next;
}
