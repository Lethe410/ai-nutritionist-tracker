import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { LogOut } from 'lucide-react';

interface ProfileScreenProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onLogout: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ profile, onUpdateProfile, onLogout }) => {
  const [localProfile, setLocalProfile] = useState(profile);

  useEffect(() => {
      setLocalProfile(profile);
  }, [profile]);

  const handleChange = (field: string, value: any) => {
    setLocalProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!localProfile.weight || !localProfile.height || !localProfile.age) {
      alert("請填寫完整的身體數值以計算 TDEE");
      return;
    }

    let bmr = (10 * localProfile.weight) + (6.25 * localProfile.height) - (5 * localProfile.age);
    bmr += localProfile.gender === 'Male' ? 5 : -161;

    let activityMultiplier = 1.2;
    switch(localProfile.activityLevel) {
        case 'sedentary': activityMultiplier = 1.2; break;
        case 'light': activityMultiplier = 1.375; break;
        case 'moderate': activityMultiplier = 1.55; break;
        case 'active': activityMultiplier = 1.725; break;
    }

    const tdee = Math.round(bmr * activityMultiplier);
    let target = tdee;
    if (localProfile.goal === 'deficit') target -= 500;
    if (localProfile.goal === 'surplus') target += 300;

    const updatedProfile = {
        ...localProfile,
        tdee,
        targetCalories: target
    };

    setLocalProfile(updatedProfile);
    onUpdateProfile(updatedProfile);
  };

  return (
    <div className="p-4 pb-24 bg-white min-h-screen">
       <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-green-500 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-800">個人檔案 & TDEE</h2>
          </div>
          <button 
            onClick={() => {
              const ok = window.confirm('確定要登出嗎？\n\n登出後將需要重新登入才能繼續使用 AI 功能。');
              if (!ok) return;
              onLogout();
            }}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="登出"
          >
            <LogOut size={20} />
          </button>
       </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">暱稱</label>
          <input 
            type="text" 
            value={localProfile.nickname || ''}
            onChange={(e) => handleChange('nickname', e.target.value)}
            placeholder="請輸入您的暱稱"
            className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
             <label className="block text-sm font-bold text-gray-700 mb-1.5">性別</label>
             <div className="relative">
                <select 
                  value={localProfile.gender || 'Male'}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                >
                  <option value="Male">男性</option>
                  <option value="Female">女性</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
             </div>
          </div>
          <div className="flex-1">
             <label className="block text-sm font-bold text-gray-700 mb-1.5">年齡</label>
             <input 
                type="number" 
                value={localProfile.age || ''}
                onChange={(e) => handleChange('age', e.target.value ? parseInt(e.target.value) : 0)}
                placeholder="0"
                className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
              />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
             <label className="block text-sm font-bold text-gray-700 mb-1.5">身高 (cm)</label>
             <input 
                type="number" 
                value={localProfile.height || ''}
                onChange={(e) => handleChange('height', e.target.value ? parseInt(e.target.value) : 0)}
                placeholder="0"
                className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
              />
          </div>
          <div className="flex-1">
             <label className="block text-sm font-bold text-gray-700 mb-1.5">體重 (kg)</label>
             <input 
                type="number" 
                value={localProfile.weight || ''}
                onChange={(e) => handleChange('weight', e.target.value ? parseInt(e.target.value) : 0)}
                placeholder="0"
                className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
              />
          </div>
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-700 mb-1.5">活動量</label>
           <div className="relative">
              <select 
                value={localProfile.activityLevel || 'moderate'}
                onChange={(e) => handleChange('activityLevel', e.target.value)}
                className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              >
                <option value="sedentary">久坐 (無運動)</option>
                <option value="light">輕度活動 (1-3天/週)</option>
                <option value="moderate">中度活動 (3-5天/週)</option>
                <option value="active">高度活動 (6-7天/週)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
           </div>
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-700 mb-1.5">健康關注 / 社群分組</label>
           <div className="relative">
              <select 
                value={localProfile.healthFocus || 'general'}
                onChange={(e) => handleChange('healthFocus', e.target.value)}
                className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              >
                <option value="general">一般健康</option>
                <option value="weight_loss">體重管理 (減重)</option>
                <option value="muscle_gain">體態雕塑 (增肌)</option>
                <option value="diabetes">血糖控制 (糖尿病)</option>
                <option value="hypertension">血壓管理 (高血壓)</option>
                <option value="kidney">腎臟保健</option>
                <option value="heart">心血管健康</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
           </div>
           <p className="text-xs text-gray-500 mt-1 ml-1">選擇您的健康關注點，將帶您進入專屬的討論社群</p>
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-700 mb-1.5">目標</label>
           <div className="relative">
              <select 
                value={localProfile.goal || 'deficit'}
                onChange={(e) => handleChange('goal', e.target.value)}
                className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              >
                <option value="deficit">減脂 (熱量赤字)</option>
                <option value="maintain">維持體重</option>
                <option value="surplus">增肌 (熱量盈餘)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
           </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 transition-colors mt-4 active:scale-[0.98]"
        >
          計算並儲存
        </button>

        <div className="mt-8 bg-green-50 rounded-2xl p-6 border border-green-100">
          <h3 className="text-gray-800 font-bold mb-4">您的每日熱量建議</h3>
          
          <div className="flex justify-between items-center mb-2">
             <span className="text-gray-600 text-sm font-medium">每日消耗 (TDEE):</span>
             <div className="text-right">
                <span className="text-2xl font-bold text-green-600">{localProfile.tdee > 0 ? localProfile.tdee : '-'}</span>
                <span className="text-xs text-gray-500 ml-1">kcal</span>
             </div>
          </div>

          <div className="flex justify-between items-center mb-3">
             <span className="text-gray-600 text-sm font-medium">建議攝取:</span>
             <div className="text-right">
                <span className="text-3xl font-bold text-gray-800">{localProfile.targetCalories > 0 ? localProfile.targetCalories : '-'}</span>
                <span className="text-xs text-gray-500 ml-1">kcal</span>
             </div>
          </div>
          
          <p className="text-xs text-gray-400 text-right">
            {localProfile.tdee === 0 ? '請輸入資料以計算您的熱量需求' :
             localProfile.goal === 'deficit' ? '已扣除 500 大卡以達成減脂目標。' : 
             localProfile.goal === 'surplus' ? '已增加 300 大卡以達成增肌目標。' : '維持目前體重的建議攝取量。'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;