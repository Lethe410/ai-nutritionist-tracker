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
      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-[28px] p-6 text-white shadow-[0_35px_70px_-40px_rgba(16,185,129,0.8)] border border-white/20 bg-gradient-to-br from-emerald-400/90 via-emerald-500/85 to-emerald-600/80 backdrop-blur-2xl">
        <div className="absolute -right-10 -top-10 w-44 h-44 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute -left-6 bottom-0 w-32 h-32 bg-emerald-300/30 rounded-full blur-2xl"></div>

        <div className="flex justify-between items-start relative z-10 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">今日目標</p>
            <h2 className="text-3xl font-semibold mt-1">攝取狀況</h2>
          </div>
          <div className="px-3 py-1 rounded-full bg-white/15 text-xs font-medium capitalize">
            {profile.goal === 'deficit' && '減脂期'}
            {profile.goal === 'maintain' && '維持期'}
            {profile.goal === 'surplus' && '增肌期'}
          </div>
        </div>

        <div className="flex items-end gap-3 relative z-10 mb-6">
          <div>
            <span className="text-5xl font-bold leading-none">{todayStats.consumed}</span>
            <span className="ml-2 text-white/80 text-lg">kcal</span>
          </div>
          <span className="text-sm text-white/70 mb-1"> / {todayStats.target || '—'} kcal</span>
        </div>

        <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden relative z-10 mb-3">
          <div 
            className="h-full rounded-full bg-white/90 shadow-[0_8px_20px_-10px_rgba(255,255,255,0.9)] transition-all duration-500 ease-out" 
            style={{ width: `${todayStats.percentage}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm relative z-10">
          <div className="bg-white/15 rounded-2xl px-4 py-3 backdrop-blur-md">
            <p className="text-white/70 text-xs mb-1">剩餘熱量</p>
            <p className="text-lg font-semibold">{todayStats.remaining} kcal</p>
          </div>
          <div className="bg-white/15 rounded-2xl px-4 py-3 backdrop-blur-md">
            <p className="text-white/70 text-xs mb-1">達成率</p>
            <p className="text-lg font-semibold">{todayStats.percentage}%</p>
          </div>
        </div>
      </div>

      {/* Chart Card */}
      <div className="rounded-[28px] p-6 bg-white/75 backdrop-blur-2xl border border-white/50 shadow-[0_30px_70px_-50px_rgba(15,23,42,0.9)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Weekly Trend</p>
            <h3 className="text-lg font-bold text-slate-800">近7天熱量趨勢</h3>
          </div>
          <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold">
            平均 {Math.round(chartData.reduce((a, b) => a + b.calories, 0) / 7)} kcal
          </div>
        </div>
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
              <Bar dataKey="calories" radius={[8, 8, 8, 8]} barSize={26}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === chartData.length - 1 ? 'url(#currentDay)' : 'url(#trendDay)'} 
                  />
                ))}
              </Bar>
              <defs>
                <linearGradient id="currentDay" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.9}/>
                </linearGradient>
                <linearGradient id="trendDay" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e2e8f0" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#cbd5f5" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Advice Card - Updated Style */}
      <div className="rounded-[26px] p-6 bg-gradient-to-br from-white/85 to-white/60 border border-white/50 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.9)] relative overflow-hidden backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),_transparent_60%)]"></div>
        
        <div className="flex items-center gap-2 mb-3 relative z-10">
          <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
             <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Smart Coach</p>
            <h3 className="text-lg font-bold text-slate-900">AI 營養師建議</h3>
          </div>
        </div>
        
        <p className="text-sm leading-relaxed text-slate-600 relative z-10">
          {diaryEntries.length > 0 
            ? `根據您目前的紀錄，您這幾天的平均攝取量為 ${Math.round(chartData.reduce((a, b) => a + b.calories, 0) / 7)} 大卡。建議繼續保持均衡飲食，多攝取蛋白質以維持肌肉量。` 
            : AI_ADVICE}
        </p>
      </div>
    </div>
  );
};

export default OverviewScreen;