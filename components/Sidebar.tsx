import React from 'react';
import { X, User, LogOut, Home, MessageSquare, Camera, BookOpen, Settings, TrendingUp, Music2 } from 'lucide-react';
import { UserProfile, MealEntry, AppTab } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  diaryEntries: MealEntry[];
  currentTab: AppTab;
  onNavigate: (tab: AppTab) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  profile,
  diaryEntries,
  currentTab,
  onNavigate,
  onLogout
}) => {
  // 計算 BMI
  const calculateBMI = () => {
    if (!profile.height || !profile.weight) return null;
    const heightInMeters = profile.height / 100;
    const bmi = profile.weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  };

  // 計算今日熱量
  const getTodayCalories = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    return diaryEntries
      .filter(entry => entry.date === todayStr)
      .reduce((sum, entry) => sum + entry.calories, 0);
  };

  // BMI 分類
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: '過輕', color: 'text-blue-600' };
    if (bmi < 24) return { label: '正常', color: 'text-green-600' };
    if (bmi < 27) return { label: '過重', color: 'text-yellow-600' };
    return { label: '肥胖', color: 'text-red-600' };
  };

  const bmi = calculateBMI();
  const todayCalories = getTodayCalories();
  const bmiCategory = bmi ? getBMICategory(parseFloat(bmi)) : null;

  // 導航項目
  const navItems = [
    { tab: AppTab.OVERVIEW, icon: Home, label: '總覽' },
    { tab: AppTab.AI_CHAT, icon: MessageSquare, label: 'AI 聊天' },
    { tab: AppTab.RECORD, icon: Camera, label: '記錄' },
    { tab: AppTab.DIARY, icon: BookOpen, label: '日記' },
    { tab: AppTab.MUSIC, icon: Music2, label: '音樂' },
    { tab: AppTab.PROFILE, icon: Settings, label: '設定' },
  ];

  return (
    <>
      {/* 遮罩層 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* 側邊欄 */}
      <div
        className={`fixed top-0 left-0 h-full w-[320px] max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* 頭部 */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {profile.nickname || '用戶'}
                  </h2>
                  <p className="text-sm opacity-90">
                    {profile.gender === 'Male' ? '男性' : '女性'} · {profile.age || '-'} 歲
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 內容區域 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 身體數據卡片 */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                身體數據
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">身高</p>
                  <p className="text-lg font-bold text-gray-800">
                    {profile.height || '-'} <span className="text-sm text-gray-500">cm</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">體重</p>
                  <p className="text-lg font-bold text-gray-800">
                    {profile.weight || '-'} <span className="text-sm text-gray-500">kg</span>
                  </p>
                </div>
                {bmi && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-1">BMI 指數</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-gray-800">{bmi}</p>
                      {bmiCategory && (
                        <span className={`text-sm font-medium ${bmiCategory.color}`}>
                          ({bmiCategory.label})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 熱量資訊卡片 */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h3 className="text-sm font-bold text-gray-700 mb-3">今日熱量</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">已攝取</span>
                  <span className="text-lg font-bold text-green-600">
                    {todayCalories} <span className="text-sm text-gray-500">kcal</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">目標</span>
                  <span className="text-sm font-medium text-gray-700">
                    {profile.targetCalories || '-'} <span className="text-xs text-gray-500">kcal</span>
                  </span>
                </div>
                {profile.targetCalories > 0 && (
                  <div className="w-full bg-white/50 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((todayCalories / profile.targetCalories) * 100))}%`
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* TDEE 資訊 */}
            {profile.tdee > 0 && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="text-sm font-bold text-gray-700 mb-2">每日消耗 (TDEE)</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {profile.tdee} <span className="text-sm text-gray-500">kcal</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  根據您的活動量計算
                </p>
              </div>
            )}

            {/* 目標資訊 */}
            {profile.goal && (
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <h3 className="text-sm font-bold text-gray-700 mb-2">目標</h3>
                <p className="text-sm font-medium text-purple-700">
                  {profile.goal === 'deficit' && '減脂 (熱量赤字)'}
                  {profile.goal === 'maintain' && '維持體重'}
                  {profile.goal === 'surplus' && '增肌 (熱量盈餘)'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  活動量：{profile.activityLevel === 'sedentary' && '久坐'}
                  {profile.activityLevel === 'light' && '輕度活動'}
                  {profile.activityLevel === 'moderate' && '中度活動'}
                  {profile.activityLevel === 'active' && '高度活動'}
                </p>
              </div>
            )}

            {/* 快速導航 */}
            <div className="pt-2">
              <h3 className="text-sm font-bold text-gray-700 mb-3 px-2">快速導航</h3>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.tab;
                  return (
                    <button
                      key={item.tab}
                      onClick={() => {
                        onNavigate(item.tab);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-green-100 text-green-700'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-500'}`} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 底部登出按鈕 */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>登出</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

