import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Trash2 } from 'lucide-react';
import { ChatMessage, UserProfile } from '../types';
import { api } from '../services/api';

interface AiChatScreenProps {
  profile?: UserProfile;
}

const AiChatScreen: React.FC<AiChatScreenProps> = ({ profile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('nutriai_chat_history');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Convert string timestamps back to Date objects
        const hydrated = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(hydrated);
      } catch (e) {
        console.error("Failed to parse chat history", e);
        setMessages(getDefaultMessages());
      }
    } else {
      setMessages(getDefaultMessages());
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('nutriai_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  const getDefaultMessages = (): ChatMessage[] => [
    {
      id: '1',
      role: 'model',
      text: '你好！我是你的 AI 營養助手，可以幫你分析食物營養、提供飲食建議。有什麼問題嗎？',
      timestamp: new Date()
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleClearHistory = () => {
    if (window.confirm('確定要清除對話紀錄嗎？')) {
      setMessages(getDefaultMessages());
      localStorage.removeItem('nutriai_chat_history');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Construct context string from profile
      let context = "";
      if (profile) {
        context = `
User Profile:
- Name: ${profile.nickname || 'User'}
- Gender: ${profile.gender}
- Age: ${profile.age}
- Height: ${profile.height}cm
- Weight: ${profile.weight}kg
- Activity Level: ${profile.activityLevel}
- Goal: ${profile.goal} (Target: ${profile.targetCalories} kcal/day)
- Health Focus: ${profile.healthFocus || 'General'}
`;
      }

      const reply = await api.ai.chat(input, context);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: reply,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg = error?.message || '';
      let errorText = "抱歉，連線發生錯誤，請檢查您的網路設定。";
      
      // Special handling for quota exceeded
      if (errorMsg.includes('配額') || errorMsg.includes('quota') || errorMsg.includes('429')) {
        errorText = "API 配額已用盡。\n\n請檢查您的 Google Gemini API 配額或等待配額重置。\n\n查看配額使用情況：\nhttps://ai.dev/usage?tab=rate-limit";
      } else if (errorMsg) {
        errorText = `錯誤：${errorMsg}`;
      }
      
       const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: errorText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-emerald-50/70 via-white to-emerald-50/60 pb-20">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between sticky top-0 z-10 bg-gradient-to-b from-emerald-50/90 via-white to-white/90 border-b border-emerald-100/60">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-100 rounded-full">
            <Bot size={20} className="text-green-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">AI 營養助手</h2>
            <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <p className="text-xs text-gray-500">線上</p>
            </div>
          </div>
        </div>
        <button 
          onClick={handleClearHistory}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="清除對話紀錄"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* 對話區域 */}
      <div className="flex-1 overflow-y-auto px-3 pt-4 pb-6">
        <div className="max-w-md mx-auto space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              msg.role === 'user' ? 'bg-gray-800' : 'bg-white border border-gray-200'
            }`}>
              {msg.role === 'user' ? (
                <User size={14} className="text-white" />
              ) : (
                <Sparkles size={14} className="text-green-500" />
              )}
            </div>

            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
              msg.role === 'user' 
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-tr-none' 
                : 'bg-white/95 text-gray-700 border border-emerald-50 rounded-tl-none backdrop-blur-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                <Sparkles size={14} className="text-green-500" />
             </div>
             <div className="bg-white/95 px-4 py-3 rounded-2xl rounded-tl-none border border-emerald-50 flex items-center gap-1.5 shadow-md">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 輸入區域 */}
      <div className="p-3 bg-gradient-to-t from-white/90 via-white/95 to-white/80 border-t border-emerald-100 sticky bottom-[72px]">
        <div className="max-w-md mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="詢問關於食物熱量或營養建議..."
            className="flex-1 bg-white/90 border border-emerald-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm text-gray-900 shadow-sm"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white px-4 py-3 rounded-2xl hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.96] shadow-md"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChatScreen;