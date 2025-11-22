import React, { useState, useEffect } from 'react';
import OverviewScreen from './components/OverviewScreen';
import RecordScreen from './components/RecordScreen';
import DiaryScreen from './components/DiaryScreen';
import ProfileScreen from './components/ProfileScreen';
import OnboardingScreen from './components/OnboardingScreen';
import LoginScreen from './components/LoginScreen';
import AiChatScreen from './components/AiChatScreen';
import { TabIcon } from './components/TabIcon';
import { AppTab, MealEntry, UserProfile } from './types';
import { MOCK_MEALS, MOCK_PROFILE } from './constants';
import { api } from './services/api';

const App: React.FC = () => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentTab, setCurrentTab] = useState<AppTab>(AppTab.OVERVIEW);
  
  // State for App Data
  const [diaryEntries, setDiaryEntries] = useState<MealEntry[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(MOCK_PROFILE);

  // Load initial data
  useEffect(() => {
    const onboarded = localStorage.getItem('nutriai_onboarded');
    if (onboarded) setHasCompletedOnboarding(true);

    if (api.auth.isAuthenticated()) {
      setIsLoggedIn(true);
      refreshData();
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
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 pt-safe">
        {renderScreen()}
      </div>

      <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 pb-safe">
        <div className="flex justify-around items-center h-16">
          {Object.values(AppTab).map((tab) => (
             <button 
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className="flex flex-col items-center justify-center w-full h-full space-y-1 active:bg-gray-50 transition-colors"
              >
                <TabIcon tab={tab} isActive={currentTab === tab} />
                <span className={`text-[10px] font-medium ${currentTab === tab ? 'text-green-500' : 'text-gray-400'}`}>
                    {tab === AppTab.OVERVIEW && '總覽'}
                    {tab === AppTab.AI_CHAT && 'AI 聊天'}
                    {tab === AppTab.RECORD && '記錄'}
                    {tab === AppTab.DIARY && '日記'}
                    {tab === AppTab.PROFILE && '設定'}
                </span>
              </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;