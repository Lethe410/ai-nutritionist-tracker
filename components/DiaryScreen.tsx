import React, { useState } from 'react';
import { MealEntry, Ingredient } from '../types';
import { Clock, Flame, X, ChevronRight } from 'lucide-react';

interface DiaryScreenProps {
  entries: MealEntry[];
}

const DiaryScreen: React.FC<DiaryScreenProps> = ({ entries }) => {
  const [selectedEntry, setSelectedEntry] = useState<MealEntry | null>(null);

  // Group entries by date
  const groupedEntries = entries.reduce((groups, entry) => {
    const date = entry.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, MealEntry[]>);

  // Sort dates descending
  const sortedDates = Object.keys(groupedEntries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const getMealLabel = (type: string) => {
    switch (type) {
      case 'Breakfast': return '早餐';
      case 'Lunch': return '午餐';
      case 'Dinner': return '晚餐';
      case 'Snack': return '點心';
      default: return type;
    }
  };

  return (
    <div className="p-4 pb-24 min-h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">飲食日記</h2>
      </div>

      {sortedDates.length === 0 ? (
         <div className="text-center py-20 text-gray-400">
            <p>尚無紀錄，快去新增你的第一餐吧！</p>
         </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map(date => {
            const dayEntries = groupedEntries[date];
            const dayTotal = dayEntries.reduce((sum, e) => sum + e.calories, 0);
            
            return (
              <div key={date}>
                <div className="flex justify-between items-center mb-4 sticky top-0 bg-gray-50/95 backdrop-blur-sm py-2 z-10">
                  <div className="px-4 py-1.5 bg-gray-200 rounded-full text-sm font-semibold text-gray-600">
                    {date}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    當日總計: <span className="text-green-600 font-bold text-lg">{dayTotal}</span> kcal
                  </div>
                </div>

                <div className="space-y-4">
                  {dayEntries.map((meal) => (
                    <div 
                      key={meal.id} 
                      onClick={() => setSelectedEntry(meal)}
                      className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:bg-gray-50 transition-colors active:scale-[0.99]"
                    >
                      <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                        <img 
                          src={meal.imageUrl} 
                          alt={meal.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 py-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                              meal.type === 'Lunch' ? 'bg-green-50 text-green-600' : 
                              meal.type === 'Dinner' ? 'bg-blue-50 text-blue-600' :
                              meal.type === 'Breakfast' ? 'bg-yellow-50 text-yellow-600' :
                              'bg-purple-50 text-purple-600'
                            }`}>
                              {getMealLabel(meal.type)}
                            </span>
                            <div className="flex items-center text-xs text-gray-400">
                              <Clock size={12} className="mr-1" />
                              {meal.time}
                            </div>
                          </div>
                          
                          <h3 className="text-gray-800 font-medium text-sm mb-1 truncate">
                            {meal.title}
                          </h3>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div className="flex items-center text-orange-500 font-bold text-sm">
                              <Flame size={14} className="mr-1" />
                              {meal.calories} <span className="text-gray-400 font-normal ml-1 text-xs">kcal</span>
                            </div>
                            <ChevronRight size={16} className="text-gray-300" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
             <div className="relative h-56 bg-gray-100">
                <img src={selectedEntry.imageUrl} alt={selectedEntry.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
                   <h3 className="text-white text-2xl font-bold">{selectedEntry.title}</h3>
                   <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
                     <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded text-xs text-white font-medium">
                       {getMealLabel(selectedEntry.type)}
                     </span>
                     <span>•</span>
                     <span>{selectedEntry.date}</span>
                     <span>•</span>
                     <span>{selectedEntry.time}</span>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedEntry(null)}
                  className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm transition-colors"
                >
                  <X size={20} />
                </button>
             </div>

             <div className="p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-xl">
                   <div>
                     <p className="text-xs text-gray-500 mb-1">總熱量</p>
                     <p className="text-3xl font-bold text-green-600">{selectedEntry.calories}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-xs text-gray-500 mb-1">總份量</p>
                     <p className="text-lg font-bold text-gray-800">{selectedEntry.ingredients?.length || 1} 項食物</p>
                   </div>
                </div>

                <h4 className="font-bold text-gray-800 mb-4">詳細內容</h4>
                <div className="space-y-3">
                  {selectedEntry.ingredients && selectedEntry.ingredients.length > 0 ? (
                    selectedEntry.ingredients.map((item: Ingredient, index: number) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="font-medium text-gray-800">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.portion}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800">{item.calories} kcal</p>
                          <div className="flex gap-2 text-[10px] text-gray-400 mt-0.5">
                             <span>P: {item.protein}g</span>
                             <span>C: {item.carbs}g</span>
                             <span>F: {item.fat}g</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">無詳細食材資訊</p>
                  )}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiaryScreen;