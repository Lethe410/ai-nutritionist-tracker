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

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // API_KEY not set
}

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: API_KEY || 'dummy_key' });

// CORS configuration - allow all origins in development, specific origins in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://your-username.github.io']
    : true, // Allow all origins in development
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));

// Database Setup
let db;
(async () => {
  db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

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
      targetCalories INTEGER
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
  `);
  // Database initialized
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
      ai: ['/api/ai/analyze', '/api/ai/estimate', '/api/ai/chat']
    }
  });
});

// Auth
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
  const user = await db.get('SELECT nickname, gender, age, height, weight, activityLevel, goal, tdee, targetCalories FROM users WHERE id = ?', [req.user.id]);
  res.json(user || {});
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  const { nickname, gender, age, height, weight, activityLevel, goal, tdee, targetCalories } = req.body;
  await db.run(
    `UPDATE users SET nickname=?, gender=?, age=?, height=?, weight=?, activityLevel=?, goal=?, tdee=?, targetCalories=? WHERE id=?`,
    [nickname, gender, age, height, weight, activityLevel, goal, tdee, targetCalories, req.user.id]
  );
  res.json({ success: true });
});

// Diary
app.get('/api/diary', authenticateToken, async (req, res) => {
  const entries = await db.all('SELECT * FROM diary_entries WHERE userId = ? ORDER BY date DESC, time DESC', [req.user.id]);
  const parsedEntries = entries.map(e => ({
    ...e,
    id: e.id.toString(),
    ingredients: e.ingredients ? JSON.parse(e.ingredients) : []
  }));
  res.json(parsedEntries);
});

app.post('/api/diary', authenticateToken, async (req, res) => {
  const { id, date, type, title, description, calories, time, imageUrl, ingredients } = req.body;
  // Note: ID is auto-generated by DB, so we ignore the frontend generated temp ID
  const result = await db.run(
    `INSERT INTO diary_entries (userId, date, type, title, description, calories, time, imageUrl, ingredients) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, date, type, title, description, calories, time, imageUrl, JSON.stringify(ingredients)]
  );
  res.json({ success: true, id: result.lastID });
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

const server = app.listen(PORT, '0.0.0.0', () => {
  // Server running on http://0.0.0.0:${PORT}
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
    process.exit(1);
  } else {
    throw err;
  }
});