const functions = require('firebase-functions');
const { GoogleGenAI } = require('@google/genai');
const admin = require('firebase-admin');

admin.initializeApp();

// 初始化 Gemini AI
const ai = new GoogleGenAI({ 
  apiKey: functions.config().gemini?.api_key || process.env.GEMINI_API_KEY 
});

// 移除 Markdown 格式的輔助函數
function removeMarkdownFormatting(text) {
  if (!text) return '';
  return text
    .replace(/\*\*/g, '')      // Remove bold markers
    .replace(/\*/g, '')        // Remove italic markers
    .replace(/##+/g, '')       // Remove heading markers
    .replace(/`/g, '')         // Remove code markers
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert links to plain text
    .trim();
}

// AI 圖片分析
exports.analyzeImage = functions.https.onCall(async (data, context) => {
  // 驗證用戶已登入
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { image } = data;
  if (!image) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Image is required'
    );
  }

  try {
    // 清理 base64 字符串
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
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Analyze Error:", error);
    
    if (error.message && error.message.includes('quota')) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'API 配額已用盡',
        { code: 429, details: error.message }
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'AI Analysis failed',
      { details: error.message }
    );
  }
});

// AI 營養估算
exports.estimateNutrition = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { name, portion } = data;
  if (!name || !portion) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Name and portion are required'
    );
  }

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
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Estimate Error:", error);
    
    if (error.message && error.message.includes('quota')) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'API 配額已用盡',
        { code: 429, details: error.message }
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'AI Estimate failed',
      { details: error.message }
    );
  }
});

// AI 聊天
exports.chat = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { message } = data;
  if (!message) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Message is required'
    );
  }

  try {
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

    let replyText = response.text;
    
    // 處理空回應
    if (!replyText && response.candidates?.[0]?.content?.parts) {
      const parts = response.candidates[0].content.parts;
      for (const part of parts) {
        if (part.text) {
          replyText = part.text;
          break;
        }
      }
    }

    // 檢查安全過濾
    if (response.promptFeedback?.blockReason) {
      throw new functions.https.HttpsError(
        'permission-denied',
        '內容被安全過濾器阻止',
        { blockReason: response.promptFeedback.blockReason }
      );
    }

    if (!replyText || replyText.trim().length === 0) {
      throw new functions.https.HttpsError(
        'internal',
        'AI returned empty response'
      );
    }

    // 移除 Markdown 格式
    replyText = removeMarkdownFormatting(replyText);

    return { reply: replyText };
  } catch (error) {
    console.error("AI Chat Error:", error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'AI Chat failed',
      { details: error.message }
    );
  }
});

