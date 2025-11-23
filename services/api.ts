import { MealEntry, UserProfile } from '../types';

// Switch to TRUE when running the backend server
export const ENABLE_BACKEND = true;

// Switch to TRUE to use Firebase instead of Railway backend
export const USE_FIREBASE = true; // 設置為 true 以使用 Firebase

// Use environment variable for API URL, fallback to relative path
const API_URL = (import.meta.env?.VITE_API_URL as string) || '/api';

// Import Firebase API (will be used if USE_FIREBASE is true)
import { apiFirebase } from './apiFirebase';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

// 當使用 Firebase 時，為 Railway 後端獲取/創建 token
const syncRailwayToken = async (email: string, password: string) => {
  if (!USE_FIREBASE || !ENABLE_BACKEND) return;
  
  try {
    // 嘗試在 Railway 登入
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('auth_token', data.token);
      return;
    }
    
    // 如果登入失敗，嘗試註冊
    if (res.status === 401) {
      const registerRes = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (registerRes.ok) {
        const registerData = await registerRes.json();
        localStorage.setItem('auth_token', registerData.token);
      }
    }
  } catch (error) {
    console.warn('同步 Railway token 失敗（AI 功能可能無法使用）:', error);
    // 不拋出錯誤，因為 Firebase 認證已經成功
  }
};

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      // Use Firebase if enabled
      if (USE_FIREBASE) {
        const result = await apiFirebase.auth.login(email, password);
        // 同步獲取 Railway token（用於 AI 功能）
        await syncRailwayToken(email, password);
        return result;
      }
      
      if (!ENABLE_BACKEND) {
        // Mock Logic
        const stored = JSON.parse(localStorage.getItem('nutriai_users') || '{}');
        if (stored[email] && stored[email].password === password) {
            localStorage.setItem('auth_token', 'mock_token');
            return { success: true };
        }
        throw new Error('Invalid credentials');
      }
      
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        let errorMessage = '登入失敗';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          const text = await res.text().catch(() => '');
          if (text) errorMessage += `: ${text.substring(0, 100)}`;
        }
        throw new Error(errorMessage);
      }
      const data = await res.json();
      localStorage.setItem('auth_token', data.token);
      return data;
    },
    register: async (email: string, password: string) => {
      // Use Firebase if enabled
      if (USE_FIREBASE) {
        const result = await apiFirebase.auth.register(email, password);
        // 同步獲取 Railway token（用於 AI 功能）
        await syncRailwayToken(email, password);
        return result;
      }
      
       if (!ENABLE_BACKEND) {
          const stored = JSON.parse(localStorage.getItem('nutriai_users') || '{}');
          if (stored[email]) throw new Error('Exists');
          stored[email] = { password };
          localStorage.setItem('nutriai_users', JSON.stringify(stored));
          localStorage.setItem('auth_token', 'mock_token');
          return { success: true };
       }

       const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        let errorMessage = '註冊失敗';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
          if (errorMessage.includes('already exists') || errorMessage.includes('Email already')) {
            errorMessage = '信箱可能已被使用';
          }
        } catch (e) {
          const text = await res.text().catch(() => '');
          if (text) errorMessage += `: ${text.substring(0, 100)}`;
        }
        throw new Error(errorMessage);
      }
      const data = await res.json();
      localStorage.setItem('auth_token', data.token);
      return data;
    },
    logout: async () => {
      if (USE_FIREBASE) {
        return apiFirebase.auth.logout();
      }
      localStorage.removeItem('auth_token');
    },
    loginWithGoogle: async () => {
      if (USE_FIREBASE) {
        const result = await apiFirebase.auth.loginWithGoogle();
        // 同步獲取 Railway token（用於 AI 功能）
        // 注意：社交登入沒有密碼，無法同步 Railway token
        // AI 功能可能需要用戶手動設置密碼或使用其他方式
        return result;
      }
      throw new Error('Google 登入僅支持 Firebase 模式');
    },
    loginWithFacebook: async () => {
      if (USE_FIREBASE) {
        const result = await apiFirebase.auth.loginWithFacebook();
        return result;
      }
      throw new Error('Facebook 登入僅支持 Firebase 模式');
    },
    loginWithApple: async () => {
      if (USE_FIREBASE) {
        const result = await apiFirebase.auth.loginWithApple();
        return result;
      }
      throw new Error('Apple 登入僅支持 Firebase 模式');
    },
    isAuthenticated: () => {
      if (USE_FIREBASE) {
        return apiFirebase.auth.isAuthenticated();
      }
      return !!localStorage.getItem('auth_token');
    }
  },

  user: {
    getProfile: async (): Promise<Partial<UserProfile>> => {
      if (USE_FIREBASE) {
        return apiFirebase.user.getProfile();
      }
      if (!ENABLE_BACKEND) {
         return JSON.parse(localStorage.getItem('nutriai_profile') || '{}');
      }
      const res = await fetch(`${API_URL}/profile`, { headers: getAuthHeaders() });
      return res.ok ? res.json() : {};
    },
    updateProfile: async (profile: UserProfile) => {
      if (USE_FIREBASE) {
        return apiFirebase.user.updateProfile(profile);
      }
      if (!ENABLE_BACKEND) {
         localStorage.setItem('nutriai_profile', JSON.stringify(profile));
         return;
      }
      await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profile)
      });
    }
  },

  diary: {
    getEntries: async (): Promise<MealEntry[]> => {
      if (USE_FIREBASE) {
        return apiFirebase.diary.getEntries();
      }
      if (!ENABLE_BACKEND) {
        return JSON.parse(localStorage.getItem('nutriai_diary') || '[]');
      }
      const res = await fetch(`${API_URL}/diary`, { headers: getAuthHeaders() });
      return res.ok ? res.json() : [];
    },
    addEntry: async (entry: MealEntry) => {
      if (USE_FIREBASE) {
        return apiFirebase.diary.addEntry(entry);
      }
      if (!ENABLE_BACKEND) {
         const entries = JSON.parse(localStorage.getItem('nutriai_diary') || '[]');
         entries.unshift(entry);
         localStorage.setItem('nutriai_diary', JSON.stringify(entries));
         return;
      }
      await fetch(`${API_URL}/diary`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(entry)
      });
    }
  },

  ai: {
    analyzeImage: async (base64Image: string) => {
      // AI 功能始終使用 Railway（因為 Cloud Functions 需要 Blaze 計劃）
      // 即使 USE_FIREBASE = true，認證和數據使用 Firebase，但 AI 使用 Railway
      if (!ENABLE_BACKEND) {
        return [];
      }
      try {
        const res = await fetch(`${API_URL}/ai/analyze`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ image: base64Image })
        });
        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
          try {
            const errorData = await res.json();
            // Handle quota exceeded error (429)
            if (res.status === 429 || errorData.code === 429) {
              errorMessage = errorData.error || 'API 配額已用盡';
              if (errorData.details) {
                errorMessage += `\n${errorData.details}`;
              }
            } else {
              errorMessage = errorData.error || errorData.details || errorMessage;
              if (errorData.details && errorData.error !== errorData.details) {
                errorMessage += ` - ${errorData.details}`;
              }
            }
          } catch (e) {
            const text = await res.text().catch(() => '');
            if (text) errorMessage += ` - ${text.substring(0, 100)}`;
          }
          console.error('AI Analyze error:', { status: res.status, message: errorMessage });
          throw new Error(errorMessage);
        }
        return await res.json();
      } catch (error: any) {
        console.error('AI Analyze fetch error:', error);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          throw new Error('無法連接到伺服器。請確認後端伺服器正在運行。');
        }
        throw error;
      }
    },
    estimateNutrition: async (name: string, portion: string) => {
      // AI 功能始終使用 Railway
      if (!ENABLE_BACKEND) {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      try {
        const res = await fetch(`${API_URL}/ai/estimate`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ name, portion })
        });
        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
          try {
            const errorData = await res.json();
            // Handle quota exceeded error (429)
            if (res.status === 429 || errorData.code === 429) {
              errorMessage = errorData.error || 'API 配額已用盡';
              if (errorData.details) {
                errorMessage += `\n${errorData.details}`;
              }
            } else {
              errorMessage = errorData.error || errorData.details || errorMessage;
              if (errorData.details && errorData.error !== errorData.details) {
                errorMessage += ` - ${errorData.details}`;
              }
            }
          } catch (e) {
            const text = await res.text().catch(() => '');
            if (text) errorMessage += ` - ${text.substring(0, 100)}`;
          }
          console.error('AI Estimate error:', { status: res.status, message: errorMessage });
          throw new Error(errorMessage);
        }
        return await res.json();
      } catch (error: any) {
        console.error('AI Estimate fetch error:', error);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          throw new Error('無法連接到伺服器。請確認後端伺服器正在運行。');
        }
        throw error;
      }
    },
    chat: async (message: string) => {
      // AI 功能始終使用 Railway
      if (!ENABLE_BACKEND) {
        return "抱歉，AI 功能需要後端支持";
      }
      try {
        const res = await fetch(`${API_URL}/ai/chat`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ message })
        });
        
        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.details || errorMessage;
            console.error('AI Chat API error:', errorData);
          } catch (e) {
            const text = await res.text().catch(() => '');
            console.error('AI Chat API error (non-JSON):', text);
          }
          return `錯誤：${errorMessage}`;
        }
        
        const data = await res.json();
        if (!data.reply || data.reply.trim().length === 0) {
          console.error('AI Chat: Empty reply in response');
          return "抱歉，AI 沒有產生回應，請稍後再試。";
        }
        return data.reply;
      } catch (error: any) {
        console.error('AI Chat fetch error:', error);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          return `錯誤：無法連接到伺服器。請確認後端伺服器正在運行。`;
        }
        return `錯誤：${error.message || '未知錯誤'}`;
      }
    }
  }
};