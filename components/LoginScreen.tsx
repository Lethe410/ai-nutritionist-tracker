import React, { useState } from 'react';
import { Utensils, Loader2, AlertCircle } from 'lucide-react';
import { api, USE_FIREBASE } from '../services/api';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!email || !password) {
      setError('請輸入電子郵件和密碼');
      return false;
    }
    if (!email.includes('@')) {
      setError('請輸入有效的電子郵件格式');
      return false;
    }
    if (password.length < 6) {
      setError('密碼長度至少需 6 個字元');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
        if (isRegistering) {
            await api.auth.register(email, password);
        } else {
            await api.auth.login(email, password);
        }
        onLogin();
    } catch (err: any) {
        console.error(err);
        setError(isRegistering ? '註冊失敗 (信箱可能已被使用)' : '帳號或密碼錯誤');
    } finally {
        setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setEmail('');
    setPassword('');
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    if (!USE_FIREBASE) {
      setError('社交登入僅支持 Firebase 模式');
      return;
    }

    setIsSocialLoading(provider);
    setError('');

    try {
      if (provider === 'google') {
        await api.auth.loginWithGoogle();
      } else if (provider === 'facebook') {
        await api.auth.loginWithFacebook();
      } else if (provider === 'apple') {
        await api.auth.loginWithApple();
      }
      onLogin();
    } catch (err: any) {
      console.error(err);
      setError(err.message || `${provider} 登入失敗`);
    } finally {
      setIsSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8 flex flex-col">
      <div className="mb-12 mt-4">
        <div className="flex items-center gap-2 mb-8">
           <Utensils className="text-green-500" size={24} />
           <span className="text-xl font-bold text-gray-800">NutriAI</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isRegistering ? '建立新帳號' : '歡迎回來！'}
        </h1>
        <p className="text-gray-500">
          {isRegistering ? '加入我們，開始您的健康飲食計畫' : '登入以繼續您的健康旅程'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-500 text-sm p-3 rounded-xl flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件</label>
          <input 
            type="email" 
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all bg-gray-50 text-gray-900"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
          <input 
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all bg-gray-50 text-gray-900"
            disabled={isLoading}
          />
        </div>

        <button 
          type="submit"
          disabled={isLoading || isSocialLoading !== null}
          className="w-full bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 hover:bg-green-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              {isRegistering ? '註冊中...' : '登入中...'}
            </>
          ) : (
            isRegistering ? '註冊帳號' : '登入'
          )}
        </button>
      </form>

      {USE_FIREBASE && (
        <>
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">或</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading || isSocialLoading !== null}
              className="w-full bg-white border-2 border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSocialLoading === 'google' ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>使用 Google 登入</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleSocialLogin('facebook')}
              disabled={isLoading || isSocialLoading !== null}
              className="w-full bg-[#1877F2] text-white font-medium py-3 rounded-xl hover:bg-[#166FE5] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSocialLoading === 'facebook' ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>使用 Facebook 登入</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleSocialLogin('apple')}
              disabled={isLoading || isSocialLoading !== null}
              className="w-full bg-black text-white font-medium py-3 rounded-xl hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSocialLoading === 'apple' ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <span>使用 Apple 登入</span>
                </>
              )}
            </button>
          </div>
        </>
      )}
      
      <div className="mt-auto pt-6 text-center">
        <p className="text-gray-600 text-sm">
          {isRegistering ? '已經有帳號了嗎？' : '還沒有帳號？'}
          <button 
            onClick={toggleMode}
            className="text-green-500 font-bold ml-1 hover:underline"
            disabled={isLoading || isSocialLoading !== null}
          >
            {isRegistering ? '立即登入' : '立即註冊'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;