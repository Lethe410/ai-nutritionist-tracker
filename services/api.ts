import { MealEntry, UserProfile } from '../types';

// Switch to TRUE when running the backend server
export const ENABLE_BACKEND = true;
// Use environment variable for API URL, fallback to relative path
const API_URL = (import.meta.env?.VITE_API_URL as string) || '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export const api = {
  auth: {
    login: async (email: string, password: string) => {
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
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      localStorage.setItem('auth_token', data.token);
      return data;
    },
    register: async (email: string, password: string) => {
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
      if (!res.ok) throw new Error('Register failed');
      const data = await res.json();
      localStorage.setItem('auth_token', data.token);
      return data;
    },
    logout: () => {
      localStorage.removeItem('auth_token');
    },
    isAuthenticated: () => !!localStorage.getItem('auth_token')
  },

  user: {
    getProfile: async (): Promise<Partial<UserProfile>> => {
      if (!ENABLE_BACKEND) {
         return JSON.parse(localStorage.getItem('nutriai_profile') || '{}');
      }
      const res = await fetch(`${API_URL}/profile`, { headers: getAuthHeaders() });
      return res.ok ? res.json() : {};
    },
    updateProfile: async (profile: UserProfile) => {
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
      if (!ENABLE_BACKEND) {
        return JSON.parse(localStorage.getItem('nutriai_diary') || '[]');
      }
      const res = await fetch(`${API_URL}/diary`, { headers: getAuthHeaders() });
      return res.ok ? res.json() : [];
    },
    addEntry: async (entry: MealEntry) => {
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