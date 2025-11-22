import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'dummy_key' });

export const analyzeFoodImage = async (base64Image: string): Promise<any[]> => {
  try {
    // Remove data URL prefix if present to get raw base64
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: cleanBase64
                }
            },
            {
                text: `Analyze this food image. Identify all distinct food items.
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
                If unable to identify, return an empty array.`
            }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text || "[]";
    // Clean up any markdown code blocks if the model adds them despite instructions
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error analyzing food:", error);
    return [];
  }
};

export const estimateNutritionFromText = async (name: string, portion: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            text: `Estimate the nutrition facts for the following food item.
            Food: "${name}"
            Portion: "${portion}"
            
            Return a STRICT JSON object. Do not use Markdown.
            Output format:
            {
              "calories": number (integer),
              "protein": number (float),
              "carbs": number (float),
              "fat": number (float)
            }`
          }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error estimating nutrition:", error);
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }
};