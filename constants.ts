
import { DailyStats, FoodItem, MealEntry, UserProfile } from './types';

export const MOCK_STATS: DailyStats = {
  consumed: 0,
  target: 2000,
  remaining: 2000,
  percentage: 0
};

export const MOCK_FOOD_ITEMS: FoodItem[] = [];

// Cleared mock meals as requested to start with an empty diary
export const MOCK_MEALS: MealEntry[] = [];

// Reset profile to empty defaults
export const MOCK_PROFILE: UserProfile = {
  nickname: '',
  gender: 'Male',
  age: 0,
  height: 0,
  weight: 0,
  activityLevel: 'moderate',
  goal: 'deficit',
  tdee: 0,
  targetCalories: 0
};

export const CHART_DATA = [
  { name: '11/15', calories: 0 },
  { name: '11/16', calories: 0 },
  { name: '11/17', calories: 0 },
  { name: '11/18', calories: 0 },
  { name: '11/19', calories: 0 },
  { name: '11/20', calories: 0 },
  { name: '11/21', calories: 0 },
];

export const AI_ADVICE = `目前尚無足夠數據進行分析。請開始紀錄您的飲食，AI 營養師將會根據您的攝取狀況提供個人化建議。`;
