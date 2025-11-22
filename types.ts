export enum AppTab {
  OVERVIEW = 'overview',
  AI_CHAT = 'ai_chat',
  RECORD = 'record',
  DIARY = 'diary',
  PROFILE = 'profile'
}

export interface Ingredient {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodItem extends Ingredient {
  id: string;
}

export interface MealEntry {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'Lunch' | 'Dinner' | 'Breakfast' | 'Snack';
  title: string;
  description: string;
  calories: number;
  time: string;
  imageUrl: string;
  ingredients?: Ingredient[]; // Optional detailed list
}

export interface DailyStats {
  consumed: number;
  target: number;
  remaining: number;
  percentage: number;
}

export interface UserProfile {
  nickname: string;
  gender: 'Male' | 'Female';
  age: number;
  height: number; // cm
  weight: number; // kg
  activityLevel: string;
  goal: string;
  tdee: number;
  targetCalories: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}