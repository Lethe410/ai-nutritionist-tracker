import React, { useState } from 'react';
import { Headphones, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { MoodType, MusicTrack } from '../types';

const moodOptions: { id: MoodType; label: string; description: string; emoji: string }[] = [
  { id: 'happy', label: '開心愉悅', description: '活力 Pop', emoji: '😊' },
  { id: 'focus', label: '專注工作', description: '輕電子', emoji: '🧠' },
  { id: 'relaxed', label: '放鬆療癒', description: 'Lo-Fi / Acoustic', emoji: '🌿' },
  { id: 'calm', label: '夜晚靜心', description: 'Ambient', emoji: '🌙' },
  { id: 'energetic', label: '運動激勵', description: 'Workout', emoji: '⚡' },
  { id: 'sad', label: '療癒低潮', description: 'Chill Ballad', emoji: '🌧️' }
];

const MusicScreen: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelectMood = async (mood: MoodType) => {
    setSelectedMood(mood);
    setIsLoading(true);
    setError('');
    try {
      const result = await api.music.getRecommendations(mood);
      setTracks(result);
      if (result.length === 0) {
        setError('暫時找不到符合的歌曲，稍後再試一次。');
      }
    } catch (err: any) {
      console.error('Music recommend error:', err);
      setError(err?.message || '取用歌曲時發生錯誤');
      setTracks([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 pb-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
          <Headphones className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Mood Booster</p>
          <h2 className="text-2xl font-bold text-slate-900">情緒音樂電台</h2>
        </div>
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-2xl shadow-[0_25px_60px_-45px_rgba(15,23,42,0.9)] p-5">
        <p className="text-sm text-slate-500 mb-4">挑選目前的情緒，AI 幫你找到最適合的 Spotify 曲目。</p>
        <div className="grid grid-cols-2 gap-3">
          {moodOptions.map(option => {
            const isActive = selectedMood === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleSelectMood(option.id)}
                className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                  isActive
                    ? 'bg-emerald-500/90 border-emerald-400 text-white shadow-lg shadow-emerald-200/60'
                    : 'bg-white/80 border-white/70 hover:border-emerald-200'
                }`}
              >
                <div className="text-2xl mb-2">{option.emoji}</div>
                <p className="font-semibold text-sm">{option.label}</p>
                <p className={`text-xs ${isActive ? 'text-white/80' : 'text-slate-400'}`}>{option.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/85 backdrop-blur-2xl shadow-[0_20px_60px_-45px_rgba(15,23,42,0.9)] p-5 min-h-[200px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-emerald-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm font-medium">正在搜尋 Spotify 歌曲...</p>
          </div>
        ) : error ? (
          <p className="text-sm text-center text-rose-500">{error}</p>
        ) : tracks.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-10">選擇情緒，開始播放今日的心情歌單。</div>
        ) : (
          <div className="space-y-4">
            {tracks.map(track => (
              <div
                key={track.id}
                className="flex items-center gap-4 rounded-2xl border border-white/70 bg-white/85 p-3 shadow-[0_18px_40px_-35px_rgba(15,23,42,0.9)]"
              >
                <img
                  src={track.albumImage || 'https://placehold.co/120x120?text=No+Image'}
                  alt={track.name}
                  className="w-16 h-16 rounded-2xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{track.name}</p>
                  <p className="text-xs text-slate-500 truncate">{track.artist}</p>
                </div>
                <button
                  onClick={() => window.open(track.spotifyUrl, '_blank', 'noopener,noreferrer')}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700 hover:border-emerald-300 transition"
                >
                  <div className="w-8 h-8 rounded-full border border-current flex items-center justify-center group-hover:animate-spin">
                    <SpotifyGlyph className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold">播放</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicScreen;

const SpotifyGlyph: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 168 168"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M84 0C37.7 0 0 37.7 0 84s37.7 84 84 84 84-37.7 84-84S130.3 0 84 0zm38.4 121.3a6.5 6.5 0 0 1-9-2.1c-24.4-15-55-18.4-91-10.1a6.47 6.47 0 1 1-2.9-12.6c39.6-9.2 73.8-5.2 101.3 12.1a6.5 6.5 0 0 1 1.6 9.7zm12.8-28c-1.9 3.1-6 4-9.1 2.1-27.9-17.2-70.5-22.2-103.5-12.1-3.5 1-7.2-1-8.2-4.5-1-3.5 1-7.2 4.5-8.2 37-11 83.8-5.5 115.1 13.6a6.5 6.5 0 0 1 2.2 9.1zm1-32.9c-32.4-19.2-86.2-21-117.2-11.4a6.5 6.5 0 0 1-4-12.4c34.4-11.1 92.2-9 128.5 12.3a6.5 6.5 0 0 1-6.7 11.5z"
    />
  </svg>
);

