import React, { useState, useEffect } from 'react';
import OverviewScreen from './components/OverviewScreen';
import RecordScreen from './components/RecordScreen';
import DiaryScreen from './components/DiaryScreen';
import ProfileScreen from './components/ProfileScreen';
import OnboardingScreen from './components/OnboardingScreen';
import LoginScreen from './components/LoginScreen';
import AiChatScreen from './components/AiChatScreen';
import Sidebar from './components/Sidebar';
import { TabIcon } from './components/TabIcon';
import { AppTab, MealEntry, UserProfile } from './types';
import { MOCK_MEALS, MOCK_PROFILE } from './constants';
import { api } from './services/api';
import { USE_FIREBASE } from './services/api';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // 添加檢查狀態
  const [currentTab, setCurrentTab] = useState<AppTab>(AppTab.OVERVIEW);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // State for App Data
  const [diaryEntries, setDiaryEntries] = useState<MealEntry[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(MOCK_PROFILE);

  // Load initial data
  useEffect(() => {
    const onboarded = localStorage.getItem('nutriai_onboarded');
    if (onboarded) setHasCompletedOnboarding(true);

    // 如果是 Firebase，需要等待認證狀態初始化
    if (USE_FIREBASE) {
      // 監聽 Firebase 認證狀態變化
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setIsCheckingAuth(false);
        if (user) {
          setIsLoggedIn(true);
          // 如果沒有 Railway token，嘗試同步（用於 AI 功能）
          const railwayToken = localStorage.getItem('auth_token');
          if (!railwayToken && user.email) {
            // 嘗試在 Railway 登入或註冊（使用相同的 email，但需要密碼）
            // 注意：這裡無法獲取密碼，所以只能提示用戶重新登入
            // 或者我們可以讓用戶在第一次使用 AI 功能時重新輸入密碼
            console.log('Firebase 用戶已登入，但沒有 Railway token。AI 功能可能需要重新登入。');
          }
          refreshData();
        } else {
          setIsLoggedIn(false);
        }
      });
      
      return () => unsubscribe();
    } else {
      // 非 Firebase 模式，直接檢查
      setIsCheckingAuth(false);
    if (api.auth.isAuthenticated()) {
      setIsLoggedIn(true);
      refreshData();
      }
    }
  }, []);

  const refreshData = async () => {
    try {
      const [profile, diary] = await Promise.all([
        api.user.getProfile(),
        api.diary.getEntries()
      ]);
      // If profile is empty object, fallback to mock/default structure
      if (profile && Object.keys(profile).length > 0) {
          setUserProfile(prev => ({...prev, ...profile}));
      }
      setDiaryEntries(diary);
    } catch (e) {
      console.error("Failed to load data", e);
    }
  };

  // Handlers
  const handleCompleteOnboarding = () => {
    setHasCompletedOnboarding(true);
    localStorage.setItem('nutriai_onboarded', 'true');
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    refreshData();
  };

  const handleLogout = () => {
    api.auth.logout();
    setIsLoggedIn(false);
    setCurrentTab(AppTab.OVERVIEW);
    setDiaryEntries([]);
    setUserProfile(MOCK_PROFILE);
  };

  const handleAddEntry = async (entry: MealEntry) => {
    try {
        await api.diary.addEntry(entry);
        await refreshData(); // Reload from server to get ID/Sorting
        setCurrentTab(AppTab.DIARY);
    } catch (e) {
        console.error("Failed to save entry", e);
        alert("儲存失敗");
    }
  };

  const handleUpdateProfile = async (newProfile: UserProfile) => {
    try {
        await api.user.updateProfile(newProfile);
        setUserProfile(newProfile);
    } catch (e) {
        console.error("Failed to update profile", e);
        alert("更新失敗");
    }
  };

  // ------------------------------------------------------------------
  // Rendering Logic
  // ------------------------------------------------------------------

  if (!hasCompletedOnboarding) {
    return <OnboardingScreen onComplete={handleCompleteOnboarding} />;
  }

  // 等待認證狀態檢查完成
  if (isCheckingAuth) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderScreen = () => {
    switch (currentTab) {
      case AppTab.OVERVIEW:
        return <OverviewScreen diaryEntries={diaryEntries} profile={userProfile} />;
      case AppTab.AI_CHAT:
        return <AiChatScreen />;
      case AppTab.RECORD:
        return <RecordScreen onSave={handleAddEntry} />;
      case AppTab.DIARY:
        return <DiaryScreen entries={diaryEntries} />;
      case AppTab.PROFILE:
        return (
          <ProfileScreen 
            profile={userProfile} 
            onUpdateProfile={handleUpdateProfile} 
            onLogout={handleLogout} 
          />
        );
      default:
        return <OverviewScreen diaryEntries={diaryEntries} profile={userProfile} />;
    }
  };
  
  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative shadow-2xl overflow-hidden font-sans flex flex-col">
      {/* 側邊欄 */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        profile={userProfile}
        diaryEntries={diaryEntries}
        currentTab={currentTab}
        onNavigate={(tab) => setCurrentTab(tab)}
        onLogout={handleLogout}
      />

      {/* 頂部菜單按鈕 */}
      <div className="fixed top-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-sm z-30 pt-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="打開側邊欄"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">NutriAI</h1>
          <div className="w-10" /> {/* 佔位符，保持居中 */}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 pt-16">
        {renderScreen()}
      </div>

      {/* Glassmorphism Floating Bottom Navigation */}
      <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-50 pointer-events-none pb-safe">
        <div className="w-full max-w-[calc(100%-32px)] md:max-w-[400px] bg-emerald-50/65 backdrop-blur-2xl border border-emerald-100/60 shadow-[0_18px_45px_-20px_rgba(16,185,129,0.65)] rounded-[32px] h-[72px] px-1 flex justify-between items-center pointer-events-auto">
          {Object.values(AppTab).map((tab) => {
            const isActive = currentTab === tab;
            return (
             <button 
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className="flex-1 flex flex-col items-center justify-center h-full relative group"
              >
                <div
                  className={`
                    flex flex-col items-center justify-center gap-1 rounded-full transition-all duration-300 ease-out px-4 py-2
                    ${isActive
                      ? 'bg-gradient-to-br from-emerald-100/85 to-emerald-200/60 border border-emerald-200/70 backdrop-blur-xl shadow-[0_12px_25px_-14px_rgba(16,185,129,0.6)] -translate-y-1.5'
                      : 'bg-transparent text-emerald-900/70 group-active:scale-95'}
                  `}
                >
                  <div className={`${isActive ? 'text-emerald-900' : 'text-slate-600/80'}`}>
                    <TabIcon tab={tab} isActive={isActive} />
                  </div>
                  <span
                    className={`
                      text-[10px] font-semibold tracking-wide
                      ${isActive ? 'text-emerald-900' : 'text-emerald-900/70'}
                    `}
                  >
                    {tab === AppTab.OVERVIEW && '總覽'}
                    {tab === AppTab.AI_CHAT && 'AI聊天'}
                    {tab === AppTab.RECORD && '記錄'}
                    {tab === AppTab.DIARY && '日記'}
                    {tab === AppTab.PROFILE && '設定'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default App;