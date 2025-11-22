import React, { useMemo } from 'react';
import { AI_ADVICE } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Sparkles } from 'lucide-react';
import { MealEntry, UserProfile } from '../types';

interface OverviewScreenProps {
  diaryEntries: MealEntry[];
  profile: UserProfile;
}

const OverviewScreen: React.FC<OverviewScreenProps> = ({ diaryEntries, profile }) => {
  
  // Calculate Today's Stats
  const todayStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCalories = diaryEntries
      .filter(entry => entry.date === todayStr)
      .reduce((sum, entry) => sum + entry.calories, 0);
    
    const target = profile.targetCalories;
    const remaining = Math.max(0, target - todayCalories);
    const percentage = Math.min(100, Math.round((todayCalories / target) * 100));

    return {
      consumed: todayCalories,
      target,
      remaining,
      percentage
    };
  }, [diaryEntries, profile]);

  // Calculate 7-Day Trend
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const monthDay = `${d.getMonth() + 1}/${d.getDate()}`;
      
      const dailyCalories = diaryEntries
        .filter(entry => entry.date === dateStr)
        .reduce((sum, entry) => sum + entry.calories, 0);

      data.push({
        name: monthDay,
        calories: dailyCalories
      });
    }
    return data;
  }, [diaryEntries]);

  return (
    <div className="p-4 pb-24 space-y-6">
      {/* Header */}
      <div className="bg-green-500 rounded-2xl p-6 text-white shadow-lg shadow-green-200">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-medium opacity-90">今日攝取狀況</h2>
        </div>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-6xl font-bold">{todayStats.consumed}</span>
          <span className="text-lg opacity-80">/ {todayStats.target} kcal</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-white/30 rounded-full h-3 mb-2">
          <div 
            className="bg-white h-3 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${todayStats.percentage}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-sm opacity-90 font-medium">
          <span>剩餘: {todayStats.remaining} kcal</span>
          <span>{todayStats.percentage}%</span>
        </div>
      </div>

      {/* Chart Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6">近7天熱量趨勢</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                ticks={[0, 500, 1000, 1500, 2000]}
              />
              <Tooltip 
                cursor={{fill: 'transparent'}} 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="calories" radius={[4, 4, 0, 0]} barSize={30}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === chartData.length - 1 ? '#22c55e' : '#e5e7eb'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Advice Card - Updated Style */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>
        
        <div className="flex items-center gap-2 mb-3 relative z-10">
          <div className="p-2 bg-green-100 rounded-full">
             <Sparkles className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">AI 營養師建議</h3>
        </div>
        
        <p className="text-sm leading-relaxed text-gray-600 text-justify relative z-10">
          {diaryEntries.length > 0 
            ? `根據您目前的紀錄，您這幾天的平均攝取量為 ${Math.round(chartData.reduce((a, b) => a + b.calories, 0) / 7)} 大卡。建議繼續保持均衡飲食，多攝取蛋白質以維持肌肉量。` 
            : AI_ADVICE}
        </p>
      </div>
    </div>
  );
};

export default OverviewScreen;