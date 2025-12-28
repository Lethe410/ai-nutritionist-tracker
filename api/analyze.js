import { GoogleGenAI } from '@google/genai';

const API_KEY = process.env.API_KEY;

const ai = new GoogleGenAI({ apiKey: API_KEY || 'dummy_key' });

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    
    if (error.message && error.message.includes('quota')) {
      res.status(429).json({ 
        error: 'API 配額已用盡', 
        details: '您已超出 Google Gemini API 的使用配額。'
      });
    } else {
      res.status(500).json({ error: 'AI Analysis failed', details: error.message });
    }
  }
}

