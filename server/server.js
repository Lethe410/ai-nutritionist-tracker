import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import { Buffer } from 'buffer';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const API_KEY = process.env.API_KEY;
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const spotifyTokenCache = {
  token: null,
  expiresAt: 0
};

if (!API_KEY) {
  // API_KEY not set
}

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: API_KEY || 'dummy_key' });

// CORS configuration - allow all origins in development, specific origins in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || [
        'https://lethe410.github.io',
        'https://lethe410.github.io/ai-nutritionist-tracker',
        'http://localhost:5173',
        'http://localhost:3000'
      ]
    : true, // Allow all origins in development
  credentials: true
};
app.use(cors(corsOptions));

// Explicitly handle OPTIONS requests for CORS preflight
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));

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


// Database Setup
let db;
(async () => {
  try {
    console.log('📦 Initializing database...');
  db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });
    console.log('✅ Database initialized successfully');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        nickname TEXT,
        gender TEXT,
        age INTEGER,
        height INTEGER,
        weight INTEGER,
        activityLevel TEXT,
        goal TEXT,
        tdee INTEGER,
        targetCalories INTEGER,
        healthFocus TEXT
      );

      CREATE TABLE IF NOT EXISTS diary_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        date TEXT,
        type TEXT,
        title TEXT,
        description TEXT,
        calories INTEGER,
        time TEXT,
        imageUrl TEXT,
        ingredients TEXT,
        FOREIGN KEY(userId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS mood_board_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        userNickname TEXT,
        emoji TEXT,
        content TEXT,
        likes INTEGER DEFAULT 0,
        likedBy TEXT,
        category TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
      );
    `);
    
    // Add missing columns if tables already exist (SQLite doesn't support IF NOT EXISTS in ALTER TABLE)
    try {
      await db.exec('ALTER TABLE users ADD COLUMN healthFocus TEXT');
    } catch (e) { /* ignore if column exists */ }
    
    try {
      await db.exec('ALTER TABLE mood_board_posts ADD COLUMN category TEXT');
    } catch (e) { /* ignore if column exists */ }

    console.log('✅ Database tables created/verified');
    
    // Start server after database is ready
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ CORS enabled for: ${process.env.NODE_ENV === 'production' ? (process.env.ALLOWED_ORIGINS || 'GitHub Pages domains') : 'all origins'}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', err);
        throw err;
      }
    });

    // Global error handlers to prevent crashes
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      console.error('Stack:', error.stack);
      // Don't exit immediately, let Railway handle it
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise);
      console.error('Reason:', reason);
      // Don't exit immediately, let Railway handle it
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => {
      console.log('📴 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        if (db) {
          db.close().then(() => {
            console.log('✅ Database closed');
            process.exit(0);
          }).catch(err => {
            console.error('❌ Error closing database:', err);
            process.exit(1);
          });
        } else {
          process.exit(0);
        }
      });
    });

    process.on('SIGINT', () => {
      console.log('📴 SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        if (db) {
          db.close().then(() => {
            console.log('✅ Database closed');
            process.exit(0);
          }).catch(err => {
            console.error('❌ Error closing database:', err);
            process.exit(1);
          });
        } else {
          process.exit(0);
        }
      });
    });

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();

// Middleware: Verify Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided', details: 'Please log in first' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token', details: 'Please log in again' });
    }
    req.user = user;
    next();
  });
};

// --- Routes ---

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'NutriAI API Server',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      auth: ['/api/register', '/api/login'],
      profile: ['/api/profile'],
      diary: ['/api/diary'],
      ai: ['/api/ai/analyze', '/api/ai/estimate', '/api/ai/chat'],
      music: ['/api/music/recommendations']
    }
  });
});

// Auth
// Add GET handler for testing
app.get('/api/login', (req, res) => {
  res.status(405).json({ 
    error: 'Method not allowed', 
    message: 'Please use POST method for login',
    allowedMethods: ['POST']
  });
});

app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );
    const token = jwt.sign({ id: result.lastID, email }, JWT_SECRET);
    res.json({ token });
  } catch (e) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

// Add GET handler for testing
app.get('/api/register', (req, res) => {
  res.status(405).json({ 
    error: 'Method not allowed', 
    message: 'Please use POST method for registration',
    allowedMethods: ['POST']
  });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// User Profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  const user = await db.get('SELECT nickname, gender, age, height, weight, activityLevel, goal, tdee, targetCalories, healthFocus FROM users WHERE id = ?', [req.user.id]);
  res.json(user || {});
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  const { nickname, gender, age, height, weight, activityLevel, goal, tdee, targetCalories, healthFocus } = req.body;
  await db.run(
    `UPDATE users SET nickname=?, gender=?, age=?, height=?, weight=?, activityLevel=?, goal=?, tdee=?, targetCalories=?, healthFocus=? WHERE id=?`,
    [nickname, gender, age, height, weight, activityLevel, goal, tdee, targetCalories, healthFocus, req.user.id]
  );
  res.json({ success: true });
});

// Diary
app.get('/api/diary', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      console.error('❌ Database not initialized');
      return res.status(500).json({ error: 'Database not available' });
    }

  const entries = await db.all('SELECT * FROM diary_entries WHERE userId = ? ORDER BY date DESC, time DESC', [req.user.id]);
  const parsedEntries = entries.map(e => ({
    ...e,
    id: e.id.toString(),
    ingredients: e.ingredients ? JSON.parse(e.ingredients) : []
  }));
  res.json(parsedEntries);
  } catch (error) {
    console.error('❌ Diary fetch error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch diary entries', 
      details: error.message 
    });
  }
});

app.post('/api/diary', authenticateToken, async (req, res) => {
  try {
  const { id, date, type, title, description, calories, time, imageUrl, ingredients } = req.body;
    
    if (!db) {
      console.error('❌ Database not initialized');
      return res.status(500).json({ error: 'Database not available' });
    }

    // 檢查圖片大小（如果圖片是 base64）
    if (imageUrl && imageUrl.startsWith('data:image')) {
      const imageSize = imageUrl.length;
      if (imageSize > 5000000) { // 約 5MB（SQLite TEXT 欄位理論上可以更大，但我們設定一個合理限制）
        console.warn(`圖片大小 ${(imageSize / 1024 / 1024).toFixed(2)}MB，可能導致儲存問題`);
        // 不直接拒絕，但記錄警告
      }
    }

  // Note: ID is auto-generated by DB, so we ignore the frontend generated temp ID
  const result = await db.run(
    `INSERT INTO diary_entries (userId, date, type, title, description, calories, time, imageUrl, ingredients) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, date, type, title || '', description || '', calories || 0, time || '', imageUrl || '', JSON.stringify(ingredients || [])]
  );
    
  res.json({ success: true, id: result.lastID });
  } catch (error) {
    console.error('❌ Diary save error:', error);
    console.error('Stack:', error.stack);
    
    // 提供更具體的錯誤訊息
    let errorMessage = error.message || 'Failed to save diary entry';
    
    if (error.message?.includes('too large') || error.message?.includes('size')) {
      errorMessage = '圖片檔案太大，請嘗試使用較小的圖片';
    } else if (error.message?.includes('SQLITE') || error.message?.includes('database')) {
      errorMessage = '資料庫錯誤，請稍後再試';
    }
    
    res.status(500).json({ 
      error: errorMessage, 
      details: error.message 
    });
  }
});

// AI
app.post('/api/ai/analyze', authenticateToken, async (req, res) => {
  const { image } = req.body; // Base64 string
  if (!image) return res.status(400).json({ error: 'No image provided' });

  try {
    const cleanBase64 = image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
            { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
            { text: `Analyze this food image. Identify all distinct food items.
                Return a STRICT JSON array. Do not use Markdown.
                Output format:
                [
                  {
                    "name": "Food Name (Traditional Chinese)",
                    "portion": "Estimated portion (e.g. 約100克)",
                    "calories": number (integer),
                    "protein": number (float),
                    "carbs": number (float),
                    "fat": number (float)
                  }
                ]
                If unable to identify, return an empty array.` }
        ]
      },
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || "[]";
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    res.json(JSON.parse(cleanJson));
  } catch (error) {
    console.error("AI Analyze Error:", error);
    console.error("Error details:", error.message, error.stack);
    
    // Handle quota exceeded error
    if (error.message && error.message.includes('quota')) {
      res.status(429).json({ 
        error: 'API 配額已用盡', 
        details: '您已超出 Google Gemini API 的使用配額。請檢查您的 API 配額或等待配額重置。',
        code: 429,
        helpUrl: 'https://ai.google.dev/gemini-api/docs/rate-limits',
        usageUrl: 'https://ai.dev/usage?tab=rate-limit'
      });
    } else {
      res.status(500).json({ error: 'AI Analysis failed', details: error.message });
    }
  }
});

app.post('/api/ai/estimate', authenticateToken, async (req, res) => {
  const { name, portion } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{
          text: `Estimate the nutrition facts for: Food: "${name}", Portion: "${portion}".
            Return a STRICT JSON object. Do not use Markdown.
            Output format: {"calories": int, "protein": float, "carbs": float, "fat": float}`
        }]
      },
      config: { responseMimeType: "application/json" }
    });
    const text = response.text || "{}";
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    res.json(JSON.parse(cleanJson));
  } catch (error) {
    console.error("AI Estimate Error:", error);
    console.error("Error details:", error.message, error.stack);
    
    // Handle quota exceeded error
    if (error.message && error.message.includes('quota')) {
      res.status(429).json({ 
        error: 'API 配額已用盡', 
        details: '您已超出 Google Gemini API 的使用配額。請檢查您的 API 配額或等待配額重置。',
        code: 429,
        helpUrl: 'https://ai.google.dev/gemini-api/docs/rate-limits',
        usageUrl: 'https://ai.dev/usage?tab=rate-limit'
      });
    } else {
      res.status(500).json({ error: 'AI Estimate failed', details: error.message });
    }
  }
});

app.post('/api/ai/chat', authenticateToken, async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
    // AI Chat request
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [{ 
              text: `你是一個友善、專業的 AI 營養助手，能夠提供飲食建議和營養資訊。

重要提醒：
- 回答要簡短、直接、重點明確，避免冗長說明
- 如果用戶問食譜，只給材料和步驟，不要過多描述
- 如果用戶說"好"、"嗯"等簡短回應，要理解上下文並提供具體、有用的資訊
- 避免重複問問題，要主動提供有價值的內容和具體建議
- 對於健康問題，要提供詳細、專業的指導和實用建議
- 回應要自然、完整，提供具體可執行的建議
- 不要只是問問題，要給出實質性的幫助和資訊
- 不要使用 Markdown 格式符號（如 **、## 等），使用純文字回答
- 用繁體中文回答

用戶問題：${message}` 
            }]
        },
        config: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
    });
    
    // Get full response text - try multiple methods
    let replyText = response.text;
    
    // If response.text is empty or too short, try to get from candidates
    if (!replyText || replyText.trim().length === 0) {
      // Response text is empty, checking candidates
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        
        // Check finishReason
        if (candidate.finishReason) {
          if (candidate.finishReason === 'MAX_TOKENS') {
            // Response was truncated due to MAX_TOKENS limit
          } else if (candidate.finishReason === 'SAFETY') {
            return res.status(400).json({ 
              error: '內容被安全過濾器阻止', 
              details: '回應因安全原因被阻止'
            });
          }
        }
        
        // Try different ways to extract text
        if (candidate.content) {
          if (typeof candidate.content === 'string') {
            replyText = candidate.content;
          } else if (candidate.content.parts && Array.isArray(candidate.content.parts)) {
            const textParts = candidate.content.parts
              .filter(part => part && part.text)
              .map(part => part.text)
              .join('');
            if (textParts) {
              replyText = textParts;
              // Extracted text from candidate.content.parts
            }
          } else if (candidate.content.text) {
            replyText = candidate.content.text;
            // Extracted text from candidate.content.text
          }
        }
        
        // Check if candidate has text directly
        if (!replyText && candidate.text) {
          replyText = candidate.text;
          // Extracted text from candidate.text
        }
      }
      
      // Check promptFeedback for safety blocks
      if (response.promptFeedback) {
        // Prompt feedback
        if (response.promptFeedback.blockReason) {
          return res.status(400).json({ 
            error: '內容被安全過濾器阻止', 
            details: `原因: ${response.promptFeedback.blockReason}`,
            blockReason: response.promptFeedback.blockReason
          });
        }
      }
      
      // If still no text but finishReason is MAX_TOKENS, try to get partial response
      if (!replyText && response.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
        // Try to get any available text even if truncated
        // Sometimes the text is in a different location, try to find it
        if (response.candidates?.[0]?.content?.parts) {
          const allParts = response.candidates[0].content.parts;
          for (const part of allParts) {
            if (part.text) {
              replyText = part.text;
              break;
        }
          }
        }
      }
    }
    
    // Remove Markdown formatting symbols
    if (replyText) {
      replyText = replyText
        .replace(/\*\*/g, '') // Remove bold markers
        .replace(/\*/g, '')   // Remove italic markers
        .replace(/##+/g, '')  // Remove heading markers
        .replace(/`/g, '')   // Remove code markers
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert links to plain text
        .trim();
    }
    
    if (!replyText || replyText.trim().length === 0) {
      return res.status(500).json({ 
        error: 'AI returned empty response', 
        details: 'The AI model did not generate any text. This might be due to content filtering or API issues.'
      });
    }
    
    res.json({ reply: replyText });
  } catch (error) {
    console.error("AI Chat Error:", error);
    console.error("Error details:", error.message, error.stack);
    
    // Handle quota exceeded error
    if (error.message && error.message.includes('quota')) {
      res.status(429).json({ 
        error: 'API 配額已用盡', 
        details: '您已超出 Google Gemini API 的使用配額。請檢查您的 API 配額或等待配額重置。',
        code: 429,
        helpUrl: 'https://ai.google.dev/gemini-api/docs/rate-limits',
        usageUrl: 'https://ai.dev/usage?tab=rate-limit'
      });
    } else {
      res.status(500).json({ error: 'AI Chat failed', details: error.message });
    }
  }
});

app.get('/api/music/recommendations', authenticateToken, async (req, res) => {
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
});

// Mood Board
app.get('/api/mood-board/posts', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const currentUserId = req.user.id.toString();
    const category = req.query.category || 'general';
    
    // Filter by category
    const posts = await db.all(
      'SELECT * FROM mood_board_posts WHERE category = ? ORDER BY createdAt DESC LIMIT 100',
      [category]
    );

    const formattedPosts = posts.map(post => {
      const likedBy = post.likedBy ? JSON.parse(post.likedBy) : [];
      return {
        id: post.id.toString(),
        userId: post.userId.toString(),
        userNickname: post.userNickname || '匿名',
        emoji: post.emoji,
        content: post.content,
        likes: post.likes || 0,
        likedBy: likedBy,
        isLiked: likedBy.includes(currentUserId), // 標記當前用戶是否已點讚
        isOwner: post.userId === req.user.id, // 標記是否為當前用戶的留言
        category: post.category,
        createdAt: post.createdAt
      };
    });

    res.json(formattedPosts);
  } catch (error) {
    console.error('❌ Mood board fetch error:', error);
    res.status(500).json({ error: '載入留言失敗', details: error.message });
  }
});

app.post('/api/mood-board/posts', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const { emoji, content, category } = req.body;

    if (!emoji || !content || !content.trim()) {
      return res.status(400).json({ error: '請提供情緒和內容' });
    }

    const postCategory = category || 'general';

    // 取得用戶資料
    const profile = await db.get('SELECT nickname FROM profiles WHERE user_id = ?', [req.user.id]);
    const userNickname = profile?.nickname || '匿名';

    const result = await db.run(
      'INSERT INTO mood_board_posts (userId, userNickname, emoji, content, likes, likedBy, category) VALUES (?, ?, ?, ?, 0, ?, ?)',
      [req.user.id, userNickname, emoji, content.trim(), JSON.stringify([]), postCategory]
    );

    res.json({ success: true, id: result.lastID });
  } catch (error) {
    console.error('❌ Mood board create error:', error);
    res.status(500).json({ error: '發布失敗', details: error.message });
  }
});

app.post('/api/mood-board/posts/:id/like', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const postId = parseInt(req.params.id);
    const userId = req.user.id;

    const post = await db.get('SELECT * FROM mood_board_posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: '留言不存在' });
    }

    const likedBy = post.likedBy ? JSON.parse(post.likedBy) : [];
    if (likedBy.includes(userId.toString())) {
      return res.json({ success: true, message: '已經點過讚' });
    }

    likedBy.push(userId.toString());
    await db.run(
      'UPDATE mood_board_posts SET likes = ?, likedBy = ? WHERE id = ?',
      [(post.likes || 0) + 1, JSON.stringify(likedBy), postId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Mood board like error:', error);
    res.status(500).json({ error: '點讚失敗', details: error.message });
  }
});

app.post('/api/mood-board/posts/:id/unlike', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const postId = parseInt(req.params.id);
    const userId = req.user.id;

    const post = await db.get('SELECT * FROM mood_board_posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: '留言不存在' });
    }

    const likedBy = post.likedBy ? JSON.parse(post.likedBy) : [];
    if (!likedBy.includes(userId.toString())) {
      return res.json({ success: true, message: '尚未點讚' });
    }

    const newLikedBy = likedBy.filter((id) => id !== userId.toString());
    await db.run(
      'UPDATE mood_board_posts SET likes = ?, likedBy = ? WHERE id = ?',
      [Math.max(0, (post.likes || 0) - 1), JSON.stringify(newLikedBy), postId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Mood board unlike error:', error);
    res.status(500).json({ error: '取消讚失敗', details: error.message });
  }
});

app.delete('/api/mood-board/posts/:id', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const postId = parseInt(req.params.id);
    const userId = req.user.id;

    const post = await db.get('SELECT * FROM mood_board_posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: '留言不存在' });
    }

    // 只允許作者刪除自己的留言
    if (post.userId !== userId) {
      return res.status(403).json({ error: '無權限刪除此留言' });
    }

    await db.run('DELETE FROM mood_board_posts WHERE id = ?', [postId]);

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Mood board delete error:', error);
    res.status(500).json({ error: '刪除失敗', details: error.message });
  }
});


// Server startup is handled inside the database initialization block above