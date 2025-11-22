import React, { useState } from 'react';
import { ArrowRight, Sparkles, ScanLine, TrendingUp } from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <Sparkles size={48} className="text-white" />,
      title: "歡迎來到 NutriAI",
      description: "您的專屬 AI 營養師，讓健康飲食變得簡單又有趣。",
      color: "bg-green-500"
    },
    {
      icon: <ScanLine size={48} className="text-white" />,
      title: "AI 智能食物分析",
      description: "只需拍張照，AI 立即為您識別食物並計算熱量與營養成分。",
      color: "bg-blue-500"
    },
    {
      icon: <TrendingUp size={48} className="text-white" />,
      title: "追蹤健康進度",
      description: "詳細記錄每日攝取，視覺化圖表助您輕鬆達成理想體態。",
      color: "bg-orange-500"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-white">
      {/* Top Visual Section */}
      <div className={`relative flex-1 ${steps[step].color} transition-colors duration-500 ease-in-out flex items-center justify-center overflow-hidden rounded-b-[48px]`}>
          
          {/* Decorative Circles */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white opacity-10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
          
          {/* Main Icon */}
          <div className="relative z-10 flex flex-col items-center">
             <div className="w-32 h-32 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-lg border border-white/30 mb-8 transform transition-all duration-500 hover:scale-105">
                {steps[step].icon}
             </div>
          </div>
      </div>

      {/* Bottom Content Section */}
      <div className="flex-1 flex flex-col items-center justify-between px-8 py-12">
        
        {/* Text Content */}
        <div className="text-center mt-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 transition-all duration-300">
            {steps[step].title}
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed max-w-xs mx-auto transition-all duration-300">
            {steps[step].description}
          </p>
        </div>

        {/* Controls */}
        <div className="w-full flex flex-col items-center gap-8">
          {/* Indicators */}
          <div className="flex gap-3">
            {steps.map((_, i) => (
              <div 
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? `w-8 ${steps[step].color.replace('bg-', 'bg-')}` : 'w-2 bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="w-full space-y-3">
            <button 
              onClick={handleNext}
              className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-xl shadow-gray-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${steps[step].color}`}
            >
              {step === steps.length - 1 ? '開始使用' : '下一步'}
              <ArrowRight size={20} />
            </button>
            
            {step < steps.length - 1 && (
               <button 
                 onClick={onComplete}
                 className="w-full py-3 text-gray-400 font-medium text-sm hover:text-gray-600 transition-colors"
               >
                 略過介紹
               </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;