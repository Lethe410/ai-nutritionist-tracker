import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';
import { api } from '../services/api';

const AiChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: '你好！我是你的 AI 營養助手，可以幫你分析食物營養、提供飲食建議。有什麼問題嗎？',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const reply = await api.ai.chat(input);
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
    <div className="flex flex-col h-full bg-gray-50 pb-20">
      <div className="bg-white px-4 py-4 shadow-sm border-b border-gray-100 flex items-center gap-2 sticky top-0 z-10">
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

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
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

            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-green-600 text-white rounded-tr-none' 
                : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
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
             <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 flex items-center gap-1.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100 sticky bottom-[64px]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="詢問關於食物熱量或營養建議..."
            className="flex-1 bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:outline-none text-sm text-gray-900"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-[0.95]"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChatScreen;