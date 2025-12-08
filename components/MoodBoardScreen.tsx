import React, { useState, useEffect } from 'react';
import { Heart, Send, Smile, Trash2 } from 'lucide-react';
import { MoodBoardPost, EmojiType } from '../types';
import { api } from '../services/api';
import { USE_FIREBASE } from '../services/api';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const EMOJI_OPTIONS: EmojiType[] = ['😊', '😢', '😴', '😤', '😌', '🤔', '😍', '🥳', '😎', '😭', '😡', '🤗'];

const HEALTH_FOCUS_MAP: Record<string, string> = {
  'general': '一般健康',
  'weight_loss': '體重管理 (減重)',
  'muscle_gain': '體態雕塑 (增肌)',
  'diabetes': '血糖控制 (糖尿病)',
  'hypertension': '血壓管理 (高血壓)',
  'kidney': '腎臟保健',
  'heart': '心血管健康'
};

const MoodBoardScreen: React.FC = () => {
  const [posts, setPosts] = useState<MoodBoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<EmojiType>('😊');
  const [content, setContent] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userNickname, setUserNickname] = useState<string>('');
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [userCategory, setUserCategory] = useState<string>('general');

  useEffect(() => {
    loadCurrentUserAndPosts();
  }, []);

  const loadCurrentUserAndPosts = async () => {
    try {
      setLoading(true);
      
      // Load user first to get category
      let category = 'general';
      let uid = null;
      let nickname = '';

      if (USE_FIREBASE) {
         // Firebase auth listener is async, but we can try getting profile if user is already known
         // For simplicity in this component, we rely on api.user.getProfile() which handles backend switch
         // But we need auth state first.
         const profile = await api.user.getProfile();
         if (profile) {
            category = profile.healthFocus || 'general';
            nickname = profile.nickname || '匿名';
         }
         // Get UID from auth
         const currentUser = auth.currentUser;
         if (currentUser) uid = currentUser.uid;
      } else {
         const profile = await api.user.getProfile();
         if (profile) {
            category = profile.healthFocus || 'general';
            nickname = profile.nickname || '匿名';
         }
         if (localStorage.getItem('auth_token')) uid = 'railway_user';
      }

      setUserCategory(category);
      setUserNickname(nickname);
      setCurrentUserId(uid);

      // Now load posts for this category
      const data = await api.moodBoard.getPosts(category);
      setPosts(data);

    } catch (error) {
      console.error('載入失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      // Don't set full loading, just refresh
      const data = await api.moodBoard.getPosts(userCategory);
      setPosts(data);
    } catch (error) {
      console.error('載入留言失敗:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !api.auth.isAuthenticated()) {
      alert('請先登入並輸入內容');
      return;
    }

    try {
      setSubmitting(true);
      await api.moodBoard.createPost({
        emoji: selectedEmoji,
        content: content.trim(),
        category: userCategory
      });
      setContent('');
      setSelectedEmoji('😊');
      await loadPosts();
    } catch (error: any) {
      console.error('發布失敗:', error);
      alert(error.message || '發布失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!currentUserId && !api.auth.isAuthenticated()) {
      alert('請先登入');
      return;
    }

    try {
      if (isLiked) {
        await api.moodBoard.unlikePost(postId);
      } else {
        await api.moodBoard.likePost(postId);
      }
      await loadPosts();
    } catch (error: any) {
      console.error('點讚失敗:', error);
      alert(error.message || '操作失敗，請稍後再試');
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('確定要刪除此留言嗎？此操作無法復原。')) {
      return;
    }

    try {
      setDeletingPostId(postId);
      await api.moodBoard.deletePost(postId);
      await loadPosts();
    } catch (error: any) {
      console.error('刪除失敗:', error);
      alert(error.message || '刪除失敗，請稍後再試');
    } finally {
      setDeletingPostId(null);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '剛剛';
    if (minutes < 60) return `${minutes} 分鐘前`;
    if (hours < 24) return `${hours} 小時前`;
    if (days < 7) return `${days} 天前`;
    return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 pb-8">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 標題 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">情緒留言板</h1>
              <p className="text-sm text-gray-600">分享你的心情，為他人加油打氣 💚</p>
            </div>
            <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full">
              {HEALTH_FOCUS_MAP[userCategory] || '一般健康'} 社群
            </div>
          </div>
        </div>

        {/* 新增留言表單 */}
        <form onSubmit={handleSubmit} className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-emerald-100">
          <div className="mb-3">
            <label className="block text-sm font-semibold text-gray-700 mb-2">選擇情緒</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`text-2xl p-2 rounded-xl transition-all duration-200 ${
                    selectedEmoji === emoji
                      ? 'bg-emerald-200 scale-110 shadow-md'
                      : 'bg-gray-100 hover:bg-emerald-50'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-semibold text-gray-700 mb-2">分享你的心情</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="寫下你想說的話..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 outline-none resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {content.length}/500
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>發布中...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>發布</span>
              </>
            )}
          </button>
        </form>

        {/* 留言列表 */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white/60 backdrop-blur-sm rounded-2xl">
            <Smile className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">還沒有留言，成為第一個分享心情的人吧！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              // 優先使用後端提供的 isLiked，否則使用前端判斷
              const isLiked = post.isLiked !== undefined 
                ? post.isLiked 
                : (currentUserId ? post.likedBy.includes(currentUserId) : false);
              // 判斷是否為自己的留言（優先使用後端提供的 isOwner，否則使用前端判斷）
              const isOwnPost = post.isOwner !== undefined
                ? post.isOwner
                : (USE_FIREBASE ? (currentUserId === post.userId) : false);
              const isDeleting = deletingPostId === post.id;
              
              return (
                <div
                  key={post.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-emerald-100 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">{post.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{post.userNickname}</span>
                          <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
                        </div>
                        {isOwnPost && (
                          <button
                            onClick={() => handleDelete(post.id)}
                            disabled={isDeleting}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                            title="刪除留言"
                          >
                            {isDeleting ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap break-words mb-3">
                        {post.content}
                      </p>
                      <button
                        onClick={() => handleLike(post.id, isLiked)}
                        disabled={isDeleting}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 disabled:opacity-50 ${
                          isLiked
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`}
                        />
                        <span className="text-sm font-semibold">{post.likes}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodBoardScreen;

