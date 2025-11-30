export enum AppTab {
  OVERVIEW = 'overview',
  AI_CHAT = 'ai_chat',
  RECORD = 'record',
  DIARY = 'diary',
  MUSIC = 'music',
  MOOD_BOARD = 'mood_board',
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

export type MoodType = 'happy' | 'focus' | 'relaxed' | 'calm' | 'energetic' | 'sad';

export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  albumImage: string;
  spotifyUrl: string;
  previewUrl: string | null;
}

export type EmojiType = '😊' | '😢' | '😴' | '😤' | '😌' | '🤔' | '😍' | '🥳' | '😎' | '😭' | '😡' | '🤗';

export interface MoodBoardPost {
  id: string;
  userId: string;
  userNickname: string;
  emoji: EmojiType;
  content: string;
  likes: number;
  likedBy: string[]; // Array of user IDs who liked
  isLiked?: boolean; // Optional: whether current user liked (from backend)
  isOwner?: boolean; // Optional: whether current user is the owner (from backend)
  createdAt: Date | string;
}
