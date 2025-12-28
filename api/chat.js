import { GoogleGenAI } from '@google/genai';

const API_KEY = process.env.API_KEY;

const ai = new GoogleGenAI({ apiKey: API_KEY || 'dummy_key' });

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins for simplicity in this migration
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

  const { message, context } = req.body;
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

${context ? `以下是使用者的個人資料：\n${context}\n請根據以上資料提供個人化的建議。` : ''}

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
            }
          } else if (candidate.content.text) {
            replyText = candidate.content.text;
          }
        }
        
        // Check if candidate has text directly
        if (!replyText && candidate.text) {
          replyText = candidate.text;
        }
      }
      
      // If still no text but finishReason is MAX_TOKENS, try to get partial response
      if (!replyText && response.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
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
        details: 'The AI model did not generate any text.'
      });
    }
    
    res.json({ reply: replyText });
  } catch (error) {
    console.error("AI Chat Error:", error);
    
    if (error.message && error.message.includes('quota')) {
      res.status(429).json({ 
        error: 'API 配額已用盡', 
        details: '您已超出 Google Gemini API 的使用配額。'
      });
    } else {
      res.status(500).json({ error: 'AI Chat failed', details: error.message });
    }
  }
}

