import { MealEntry, MusicTrack, MoodType, UserProfile, MoodBoardPost, EmojiType } from '../types';

// Switch to TRUE when running the backend server
export const ENABLE_BACKEND = true;

// Switch to TRUE to use Firebase instead of Railway backend
export const USE_FIREBASE = true; // 設置為 true 以使用 Firebase

// Use relative path for Vercel Serverless Functions
const API_URL = '/api';

// Import Firebase API (will be used if USE_FIREBASE is true)
import { apiFirebase } from './apiFirebase';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      // Use Firebase if enabled
      if (USE_FIREBASE) {
        return apiFirebase.auth.login(email, password);
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
        return apiFirebase.auth.register(email, password);
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
        return apiFirebase.auth.loginWithGoogle();
      }
      throw new Error('Google 登入僅支持 Firebase 模式');
    },
    loginWithFacebook: async () => {
      if (USE_FIREBASE) {
        return apiFirebase.auth.loginWithFacebook();
      }
      throw new Error('Facebook 登入僅支持 Firebase 模式');
    },
    loginWithApple: async () => {
      if (USE_FIREBASE) {
        return apiFirebase.auth.loginWithApple();
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
      // Always call Vercel Serverless Function for AI analysis
      try {
        const res = await fetch(`${API_URL}/analyze`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ image: base64Image })
        });
        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
          try {
            const errorData = await res.json();
            if (res.status === 429 || errorData.code === 429) {
              errorMessage = errorData.error || 'API 配額已用盡';
            } else {
              errorMessage = errorData.error || errorData.details || errorMessage;
            }
          } catch (e) {
            // ignore
          }
          throw new Error(errorMessage);
        }
        return await res.json();
      } catch (error: any) {
        console.error('AI Analyze fetch error:', error);
        throw error;
      }
    },
    estimateNutrition: async (name: string, portion: string) => {
      // Always call Vercel Serverless Function for AI estimation
      try {
        const res = await fetch(`${API_URL}/estimate`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ name, portion })
        });
        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
          try {
            const errorData = await res.json();
            if (res.status === 429 || errorData.code === 429) {
              errorMessage = errorData.error || 'API 配額已用盡';
            } else {
              errorMessage = errorData.error || errorData.details || errorMessage;
            }
          } catch (e) {
            // ignore
          }
          throw new Error(errorMessage);
        }
        return await res.json();
      } catch (error: any) {
        console.error('AI Estimate fetch error:', error);
        throw error;
      }
    },
    chat: async (message: string, context?: string) => {
      // Always call Vercel Serverless Function for AI chat
      try {
        const res = await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ message, context })
        });
        
        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.details || errorMessage;
          } catch (e) {
            // ignore
          }
          return `錯誤：${errorMessage}`;
        }
        
        const data = await res.json();
        if (!data.reply) {
          return "抱歉，AI 沒有產生回應。";
        }
        return data.reply;
      } catch (error: any) {
        console.error('AI Chat fetch error:', error);
        return `錯誤：${error.message || '未知錯誤'}`;
      }
    }
  },

  music: {
    getRecommendations: async (mood: MoodType): Promise<MusicTrack[]> => {
      // Call Vercel Serverless Function
      const res = await fetch(`${API_URL}/music?mood=${mood}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        let errorMessage = '無法取得歌曲推薦';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // ignore
        }
        throw new Error(errorMessage);
      }
      return res.json();
    }
  },

  moodBoard: {
    getPosts: async (category: string = 'general'): Promise<MoodBoardPost[]> => {
      // Mood Board is now FULLY handled by Firebase
      return apiFirebase.moodBoard.getPosts(category);
    },
    createPost: async (post: { emoji: EmojiType; content: string; category?: string }) => {
      return apiFirebase.moodBoard.createPost(post);
    },
    likePost: async (postId: string) => {
      return apiFirebase.moodBoard.likePost(postId);
    },
    unlikePost: async (postId: string) => {
      return apiFirebase.moodBoard.unlikePost(postId);
    },
    deletePost: async (postId: string) => {
      return apiFirebase.moodBoard.deletePost(postId);
    }
  }
};
