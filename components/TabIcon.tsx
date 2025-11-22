import React from 'react';
import { PieChart, Camera, Activity, User, MessageCircle } from 'lucide-react';
import { AppTab } from '../types';

interface TabIconProps {
  tab: AppTab;
  isActive: boolean;
}

export const TabIcon: React.FC<TabIconProps> = ({ tab, isActive }) => {
  const color = isActive ? '#22c55e' : '#9ca3af'; // green-500 vs gray-400
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
    case AppTab.PROFILE:
      return <User size={size} color={color} />;
    default:
      return null;
  }
};