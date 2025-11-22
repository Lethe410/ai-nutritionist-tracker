import React, { useState } from 'react';
import { Utensils, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
          disabled={isLoading}
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
      
      <div className="mt-auto pt-6 text-center">
        <p className="text-gray-600 text-sm">
          {isRegistering ? '已經有帳號了嗎？' : '還沒有帳號？'}
          <button 
            onClick={toggleMode}
            className="text-green-500 font-bold ml-1 hover:underline"
          >
            {isRegistering ? '立即登入' : '立即註冊'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;