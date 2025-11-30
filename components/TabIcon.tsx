import React from 'react';
import { PieChart, Camera, Activity, User, MessageCircle, Music, Heart } from 'lucide-react';
import { AppTab } from '../types';

interface TabIconProps {
  tab: AppTab;
  isActive: boolean;
}

export const TabIcon: React.FC<TabIconProps> = ({ tab, isActive }) => {
  // 透明綠色主題：啟動時使用深綠，未啟動則為石板灰。
  const color = isActive ? '#064e3b' : '#1e293b';
  const size = 24;

  switch (tab) {
    case AppTab.OVERVIEW:
      return <PieChart size={size} color={color} />;
    case AppTab.AI_CHAT:
      return <MessageCircle size={size} color={color} />;
    case AppTab.RECORD:
      return <Camera size={size} color={color} />;
    case AppTab.DIARY:
      return <Activity size={size} color={color} />;
    case AppTab.MUSIC:
      return <Music size={size} color={color} />;
    case AppTab.MOOD_BOARD:
      return <Heart size={size} color={color} />;
    case AppTab.PROFILE:
      return <User size={size} color={color} />;
    default:
      return null;
  }
};