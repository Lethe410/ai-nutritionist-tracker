import React, { useState } from 'react';
import { Music, Heart } from 'lucide-react';
import MusicScreen from './MusicScreen';
import MoodBoardScreen from './MoodBoardScreen';

type EntertainmentTab = 'music' | 'mood';

const EntertainmentScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<EntertainmentTab>('music');

  return (
    <div className="pb-24">
      {/* Tab 切換器（貼齊內容頂部，不額外留白） */}
      <div className="px-4 pt-2 pb-3">
        <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('music')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all ${
              activeTab === 'music'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Music size={18} />
            <span>音樂推薦</span>
          </button>
          <button
            onClick={() => setActiveTab('mood')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all ${
              activeTab === 'mood'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Heart size={18} />
            <span>情緒留言板</span>
          </button>
        </div>
      </div>

      {/* 內容區域 */}
      <div>
        {activeTab === 'music' ? <MusicScreen /> : <MoodBoardScreen />}
      </div>
    </div>
  );
};

export default EntertainmentScreen;

