import { Buffer } from 'buffer';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Simple in-memory cache for token (Note: Serverless functions are stateless, so this might not persist long, but helps for warm starts)
let spotifyTokenCache = {
  token: null,
  expiresAt: 0
};

const moodKeywordMap = {
  happy: {
    global: ['feel good pop', 'happy hits', 'good vibes playlist'],
    mandarin: ['快樂流行歌', '華語開心歌單', '台灣人氣流行'],
    japanese: ['j-pop happy upbeat', '日文快節奏', 'j-pop party'],
    korean: ['k-pop dance hits', 'k-pop party', 'k-pop new hits']
  },
  focus: {
    global: ['deep focus', 'instrumental beats', 'study beats'],
    mandarin: ['華語咖啡廳音樂', '中文專注音樂'],
    japanese: ['日文 lo-fi', 'japanese study beats'],
    korean: ['韓文專注音樂', 'korean piano focus']
  },
  relaxed: {
    global: ['lofi chill', 'acoustic chill', 'lazy sunday'],
    mandarin: ['療癒吉他', '華語 chillhop'],
    japanese: ['日文 chillhop', 'japanese cafe acoustic'],
    korean: ['korean cafe acoustic', '韓文慢歌放鬆']
  },
  calm: {
    global: ['ambient calm', 'night jazz calm', 'peaceful piano'],
    mandarin: ['睡前放鬆音樂', '華語冥想音樂'],
    japanese: ['jp ambient piano', 'japanese night calm'],
    korean: ['kr calm night', 'korean healing piano']
  },
  energetic: {
    global: ['workout motivation', 'beast mode', 'cardio mix'],
    mandarin: ['華語動感電音', '台灣健身歌單'],
    japanese: ['j-pop edm', 'japanese workout'],
    korean: ['k-pop workout', 'k-pop pump up']
  },
  sad: {
    global: ['rainy day songs', 'sad piano', 'healing ballad'],
    mandarin: ['華語抒情', '華語失戀歌單'],
    japanese: ['j-ballad 感傷', 'japanese sad ballad'],
    korean: ['k-ballad healing', 'korean sad songs']
  },
  default: {
    global: ['global top 50', 'top hits taiwan'],
    mandarin: ['mandopop hits', '華語人氣新歌'],
    japanese: ['j-pop hot hits'],
    korean: ['k-pop today hits']
  }
};

const languageBuckets = ['global', 'mandarin', 'japanese', 'korean'];

const getSpotifyToken = async () => {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Spotify credentials not configured');
  }
  if (spotifyTokenCache.token && Date.now() < spotifyTokenCache.expiresAt) {
    return spotifyTokenCache.token;
  }

  const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify token error: ${text}`);
  }

  const data = await response.json();
  spotifyTokenCache.token = data.access_token;
  spotifyTokenCache.expiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return spotifyTokenCache.token;
};

const fetchTracksByQuery = async (token, query) => {
  const url = `https://api.spotify.com/v1/search?type=track&limit=10&market=TW&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify search error (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data?.tracks?.items || [];
};

const searchSpotifyTracks = async (mood = 'happy') => {
  const token = await getSpotifyToken();
  const moodConfig = moodKeywordMap[mood] || moodKeywordMap.default;
  const collected = [];

  for (const bucket of languageBuckets) {
    const lists = moodConfig[bucket];
    if (!lists || !lists.length) continue;
    const query = lists[Math.floor(Math.random() * lists.length)];
    try {
      const tracks = await fetchTracksByQuery(token, query);
      collected.push(...tracks);
    } catch (error) {
      console.warn(`Spotify search failed for query "${query}":`, error.message);
    }
  }

  if (collected.length === 0) {
    collected.push(...await fetchTracksByQuery(token, 'top hits global'));
  }

  const uniqueTracks = Array.from(new Map(collected.map(track => [track.id, track])).values());

  return uniqueTracks
    .sort(() => Math.random() - 0.5)
    .slice(0, 5)
    .map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
      albumImage: track.album?.images?.[0]?.url || '',
      spotifyUrl: track.external_urls?.spotify || '',
      previewUrl: track.preview_url || null
    }));
};

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return res.status(500).json({ error: '尚未設定 Spotify 環境變數' });
    }
    const mood = (req.query.mood || 'happy').toString();
    const tracks = await searchSpotifyTracks(mood);
    return res.json(tracks);
  } catch (error) {
    console.error('Spotify recommendation error:', error);
    return res.status(500).json({ error: '無法從 Spotify 取得歌曲推薦', details: error.message });
  }
}

