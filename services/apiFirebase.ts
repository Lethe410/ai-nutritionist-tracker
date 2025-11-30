// Firebase 版本的 API 服務
// 使用 Firebase Authentication 和 Firestore

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  addDoc,
  deleteDoc,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from './firebase';
import { MealEntry, UserProfile, MoodBoardPost, EmojiType } from '../types';

// 等待認證狀態
const waitForAuth = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// 獲取當前用戶 ID
const getCurrentUserId = async (): Promise<string> => {
  const user = await waitForAuth();
  if (!user) {
    throw new Error('用戶未登入');
  }
  return user.uid;
};

export const apiFirebase = {
  auth: {
    login: async (email: string, password: string) => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
      } catch (error: any) {
        let errorMessage = '登入失敗';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          errorMessage = '帳號或密碼錯誤';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = '無效的電子郵件格式';
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = '嘗試次數過多，請稍後再試';
        } else {
          errorMessage = error.message || errorMessage;
        }
        throw new Error(errorMessage);
      }
    },
    
    register: async (email: string, password: string) => {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 創建用戶資料文檔
        const userDoc = {
          email: email,
          createdAt: Timestamp.now(),
          // 其他資料會在更新個人資料時添加
        };
        await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);
        
        return { success: true, user: userCredential.user };
      } catch (error: any) {
        let errorMessage = '註冊失敗';
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = '信箱可能已被使用';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = '無效的電子郵件格式';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = '密碼強度不足，請使用至少 6 個字元';
        } else {
          errorMessage = error.message || errorMessage;
        }
        throw new Error(errorMessage);
      }
    },
    
    logout: async () => {
      try {
        await signOut(auth);
      } catch (error: any) {
        console.error('登出失敗:', error);
        throw new Error('登出失敗');
      }
    },
    
    // Google 登入
    loginWithGoogle: async () => {
      try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        
        // 創建或更新用戶資料
        const userDoc = {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        await setDoc(doc(db, 'users', userCredential.user.uid), userDoc, { merge: true });
        
        return { success: true, user: userCredential.user };
      } catch (error: any) {
        console.error('Google 登入失敗:', error);
        let errorMessage = 'Google 登入失敗';
        if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = '登入視窗已關閉';
        } else if (error.code === 'auth/popup-blocked') {
          errorMessage = '彈出視窗被阻擋，請允許彈出視窗';
        } else {
          errorMessage = error.message || errorMessage;
        }
        throw new Error(errorMessage);
      }
    },
    
    // Facebook 登入
    loginWithFacebook: async () => {
      try {
        const provider = new FacebookAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        
        // 創建或更新用戶資料
        const userDoc = {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        await setDoc(doc(db, 'users', userCredential.user.uid), userDoc, { merge: true });
        
        return { success: true, user: userCredential.user };
      } catch (error: any) {
        console.error('Facebook 登入失敗:', error);
        let errorMessage = 'Facebook 登入失敗';
        if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = '登入視窗已關閉';
        } else if (error.code === 'auth/popup-blocked') {
          errorMessage = '彈出視窗被阻擋，請允許彈出視窗';
        } else if (error.code === 'auth/account-exists-with-different-credential') {
          errorMessage = '此電子郵件已使用其他方式註冊';
        } else {
          errorMessage = error.message || errorMessage;
        }
        throw new Error(errorMessage);
      }
    },
    
    // Apple 登入
    loginWithApple: async () => {
      try {
        const provider = new OAuthProvider('apple.com');
        provider.addScope('email');
        provider.addScope('name');
        const userCredential = await signInWithPopup(auth, provider);
        
        // 創建或更新用戶資料
        const userDoc = {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        await setDoc(doc(db, 'users', userCredential.user.uid), userDoc, { merge: true });
        
        return { success: true, user: userCredential.user };
      } catch (error: any) {
        console.error('Apple 登入失敗:', error);
        let errorMessage = 'Apple 登入失敗';
        if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = '登入視窗已關閉';
        } else if (error.code === 'auth/popup-blocked') {
          errorMessage = '彈出視窗被阻擋，請允許彈出視窗';
        } else if (error.code === 'auth/account-exists-with-different-credential') {
          errorMessage = '此電子郵件已使用其他方式註冊';
        } else {
          errorMessage = error.message || errorMessage;
        }
        throw new Error(errorMessage);
      }
    },
    
    isAuthenticated: (): boolean => {
      return auth.currentUser !== null;
    },
    
    getCurrentUser: (): User | null => {
      return auth.currentUser;
    }
  },

  user: {
    getProfile: async (): Promise<Partial<UserProfile>> => {
      try {
        const userId = await getCurrentUserId();
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          return {
            nickname: data.nickname || '',
            gender: data.gender || 'Male',
            age: data.age || 0,
            height: data.height || 0,
            weight: data.weight || 0,
            activityLevel: data.activityLevel || '',
            goal: data.goal || '',
            tdee: data.tdee || 0,
            targetCalories: data.targetCalories || 0
          };
        }
        return {};
      } catch (error: any) {
        console.error('獲取個人資料失敗:', error);
        return {};
      }
    },
    
    updateProfile: async (profile: UserProfile) => {
      try {
        const userId = await getCurrentUserId();
        await setDoc(doc(db, 'users', userId), {
          ...profile,
          updatedAt: Timestamp.now()
        }, { merge: true });
      } catch (error: any) {
        console.error('更新個人資料失敗:', error);
        throw new Error('更新個人資料失敗');
      }
    }
  },

  diary: {
    getEntries: async (): Promise<MealEntry[]> => {
      try {
        const userId = await getCurrentUserId();
        console.log('獲取日記，用戶ID:', userId);
        
        // 先嘗試使用 userId 查詢
        let q = query(
          collection(db, 'diary_entries'),
          where('userId', '==', userId),
          orderBy('date', 'desc')
        );
        
        let snapshot;
        try {
          snapshot = await getDocs(q);
        } catch (error: any) {
          // 如果查詢失敗（可能是索引問題），嘗試不使用 orderBy
          console.warn('使用 orderBy 查詢失敗，嘗試不使用排序:', error);
          q = query(
            collection(db, 'diary_entries'),
            where('userId', '==', userId)
          );
          snapshot = await getDocs(q);
        }
        
        console.log('獲取到日記數量:', snapshot.docs.length);
        
        // 如果沒有找到數據，可能是舊數據沒有 userId，嘗試獲取所有數據並過濾
        if (snapshot.docs.length === 0) {
          console.warn('使用 userId 查詢沒有結果，嘗試獲取所有數據');
          const allSnapshot = await getDocs(collection(db, 'diary_entries'));
          console.log('所有日記數量:', allSnapshot.docs.length);
          
          // 過濾出當前用戶的數據（如果有 userId）或所有數據（如果沒有 userId）
          const allEntries = allSnapshot.docs
            .filter(doc => {
              const data = doc.data();
              // 如果有 userId 字段，必須匹配；如果沒有，可能是舊數據，暫時顯示
              return !data.userId || data.userId === userId;
            })
            .map(doc => {
              const data = doc.data();
              // 處理舊數據格式（ingredients 可能是扁平化的）
              let ingredients = data.ingredients || [];
              
              // 如果 ingredients 是空數組，但文檔中有 name, portion 等字段，可能是舊格式
              if (ingredients.length === 0 && data.name) {
                ingredients = [{
                  name: data.name,
                  portion: data.portion || '',
                  calories: data.calories || 0,
                  protein: data.protein || 0,
                  carbs: data.carbs || 0,
                  fat: data.fat || 0
                }];
              }
              
              // 如果沒有 date，使用 createdAt 或當前日期
              let entryDate = data.date;
              if (!entryDate && data.createdAt) {
                // 從 Timestamp 轉換
                const timestamp = data.createdAt;
                if (timestamp.toDate) {
                  entryDate = timestamp.toDate().toISOString().split('T')[0];
                } else if (timestamp.seconds) {
                  entryDate = new Date(timestamp.seconds * 1000).toISOString().split('T')[0];
                }
              }
              if (!entryDate) {
                // 如果還是沒有，使用當前日期
                entryDate = new Date().toISOString().split('T')[0];
              }
              
              return {
                id: doc.id,
                date: entryDate,
                type: data.type || 'Lunch',
                title: data.title || data.name || '未知',
                description: data.description || data.name || '',
                calories: data.calories || 0,
                time: data.time || '',
                imageUrl: data.imageUrl || '',
                ingredients: ingredients
              } as MealEntry;
            });
          
          // 按日期和時間排序
          allEntries.sort((a, b) => {
            if (a.date !== b.date) {
              return b.date.localeCompare(a.date);
            }
            return b.time.localeCompare(a.time);
          });
          
          return allEntries;
        }
        
        const entries = snapshot.docs.map(doc => {
          const data = doc.data();
          
          // 處理舊數據格式
          let ingredients = data.ingredients || [];
          if (ingredients.length === 0 && data.name) {
            ingredients = [{
              name: data.name,
              portion: data.portion || '',
              calories: data.calories || 0,
              protein: data.protein || 0,
              carbs: data.carbs || 0,
              fat: data.fat || 0
            }];
          }
          
          return {
            id: doc.id,
            date: data.date,
            type: data.type,
            title: data.title || data.name || '未知',
            description: data.description || data.name || '',
            calories: data.calories,
            time: data.time,
            imageUrl: data.imageUrl || '',
            ingredients: ingredients
          } as MealEntry;
        });
        
        // 在內存中按時間排序
        entries.sort((a, b) => {
          if (a.date !== b.date) {
            return b.date.localeCompare(a.date);
          }
          return b.time.localeCompare(a.time);
        });
        
        return entries;
      } catch (error: any) {
        console.error('獲取日記失敗:', error);
        console.error('錯誤詳情:', error.message, error.code);
        
        // 如果是索引錯誤，嘗試獲取所有數據
        if (error.code === 'failed-precondition' || error.code === 'permission-denied') {
          console.warn('查詢失敗，嘗試獲取所有數據');
          try {
            const allSnapshot = await getDocs(collection(db, 'diary_entries'));
            const entries = allSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                date: data.date || '',
                type: data.type || 'Lunch',
                title: data.title || data.name || '未知',
                description: data.description || data.name || '',
                calories: data.calories || 0,
                time: data.time || '',
                imageUrl: data.imageUrl || '',
                ingredients: data.ingredients || []
              } as MealEntry;
            });
            return entries;
          } catch (fallbackError) {
            console.error('獲取所有數據也失敗:', fallbackError);
          }
        }
        
        return [];
      }
    },
    
    addEntry: async (entry: MealEntry) => {
      try {
        const userId = await getCurrentUserId();
        console.log('新增日記，用戶ID:', userId, '日記:', entry);
        
        // 檢查圖片大小（如果圖片是 base64）
        if (entry.imageUrl && entry.imageUrl.startsWith('data:image')) {
          const imageSize = entry.imageUrl.length;
          if (imageSize > 1000000) { // 約 1MB
            console.warn(`圖片大小 ${(imageSize / 1024 / 1024).toFixed(2)}MB，可能超過 Firestore 限制`);
            // 不直接拋錯，讓 Firestore 自己處理，但記錄警告
          }
        }
        
        const docRef = await addDoc(collection(db, 'diary_entries'), {
          userId: userId,
          date: entry.date,
          type: entry.type,
          title: entry.title,
          description: entry.description,
          calories: entry.calories,
          time: entry.time,
          imageUrl: entry.imageUrl,
          ingredients: entry.ingredients || [],
          createdAt: Timestamp.now()
        });
        
        console.log('日記已保存，文檔ID:', docRef.id);
        return docRef.id;
      } catch (error: any) {
        console.error('新增日記失敗:', error);
        console.error('錯誤詳情:', error.message, error.code);
        
        // 提供更具體的錯誤訊息
        let errorMessage = error.message || '未知錯誤';
        
        if (error.code === 'failed-precondition') {
          errorMessage = '資料庫索引尚未建立，請稍後再試';
        } else if (error.code === 'permission-denied') {
          errorMessage = '沒有儲存權限，請確認已登入帳號';
        } else if (error.message?.includes('Payload too large') || error.message?.includes('size')) {
          errorMessage = '圖片檔案太大，請嘗試使用較小的圖片';
        } else if (error.code === 'unavailable') {
          errorMessage = '服務暫時不可用，請稍後再試';
        }
        
        throw new Error(`新增日記失敗: ${errorMessage}`);
      }
    }
  },

  ai: {
    analyzeImage: async (base64Image: string) => {
      try {
        // 使用 Cloud Functions 調用 AI API
        const analyzeImage = httpsCallable(functions, 'analyzeImage');
        const result = await analyzeImage({ image: base64Image });
        return result.data as any;
      } catch (error: any) {
        console.error('AI 分析失敗:', error);
        let errorMessage = 'AI 分析失敗';
        if (error.code === 'functions/not-found') {
          errorMessage = 'AI 功能未設置，請先設置 Cloud Functions';
        } else if (error.message) {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }
    },
    
    estimateNutrition: async (name: string, portion: string) => {
      try {
        const estimateNutrition = httpsCallable(functions, 'estimateNutrition');
        const result = await estimateNutrition({ name, portion });
        return result.data as any;
      } catch (error: any) {
        console.error('營養估算失敗:', error);
        let errorMessage = '營養估算失敗';
        if (error.code === 'functions/not-found') {
          errorMessage = 'AI 功能未設置，請先設置 Cloud Functions';
        } else if (error.message) {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }
    },
    
    chat: async (message: string) => {
      try {
        const chat = httpsCallable(functions, 'chat');
        const result = await chat({ message });
        const data = result.data as any;
        return data.reply || data.message || '抱歉，AI 沒有產生回應';
      } catch (error: any) {
        console.error('AI 聊天失敗:', error);
        let errorMessage = 'AI 聊天失敗';
        if (error.code === 'functions/not-found') {
          errorMessage = 'AI 功能未設置，請先設置 Cloud Functions';
        } else if (error.message) {
          errorMessage = error.message;
        }
        return `錯誤：${errorMessage}`;
      }
    }
  },

  moodBoard: {
    getPosts: async (): Promise<MoodBoardPost[]> => {
      try {
        const currentUserId = await getCurrentUserId();
        const q = query(
          collection(db, 'mood_board_posts'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            userNickname: data.userNickname || '匿名',
            emoji: data.emoji,
            content: data.content,
            likes: data.likes || 0,
            likedBy: data.likedBy || [],
            isLiked: (data.likedBy || []).includes(currentUserId),
            isOwner: data.userId === currentUserId,
            createdAt: data.createdAt?.toDate() || new Date()
          } as MoodBoardPost;
        });
      } catch (error: any) {
        console.error('載入留言失敗:', error);
        throw new Error('載入留言失敗');
      }
    },

    createPost: async (post: { emoji: EmojiType; content: string }) => {
      try {
        const userId = await getCurrentUserId();
        const profile = await apiFirebase.user.getProfile();
        const userNickname = profile.nickname || '匿名';

        const docRef = await addDoc(collection(db, 'mood_board_posts'), {
          userId: userId,
          userNickname: userNickname,
          emoji: post.emoji,
          content: post.content,
          likes: 0,
          likedBy: [],
          createdAt: Timestamp.now()
        });

        return docRef.id;
      } catch (error: any) {
        console.error('發布留言失敗:', error);
        throw new Error('發布留言失敗');
      }
    },

    likePost: async (postId: string) => {
      try {
        const userId = await getCurrentUserId();
        const postRef = doc(db, 'mood_board_posts', postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
          throw new Error('留言不存在');
        }

        const data = postSnap.data();
        const likedBy = data.likedBy || [];

        if (likedBy.includes(userId)) {
          return; // 已經點過讚
        }

        await setDoc(postRef, {
          likes: (data.likes || 0) + 1,
          likedBy: [...likedBy, userId]
        }, { merge: true });
      } catch (error: any) {
        console.error('點讚失敗:', error);
        throw new Error('點讚失敗');
      }
    },

    unlikePost: async (postId: string) => {
      try {
        const userId = await getCurrentUserId();
        const postRef = doc(db, 'mood_board_posts', postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
          throw new Error('留言不存在');
        }

        const data = postSnap.data();
        const likedBy = (data.likedBy || []).filter((id: string) => id !== userId);

        await setDoc(postRef, {
          likes: Math.max(0, (data.likes || 0) - 1),
          likedBy: likedBy
        }, { merge: true });
      } catch (error: any) {
        console.error('取消讚失敗:', error);
        throw new Error('取消讚失敗');
      }
    },

    deletePost: async (postId: string) => {
      try {
        const userId = await getCurrentUserId();
        const postRef = doc(db, 'mood_board_posts', postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
          throw new Error('留言不存在');
        }

        const data = postSnap.data();
        // 只允許作者刪除自己的留言
        if (data.userId !== userId) {
          throw new Error('無權限刪除此留言');
        }

        await deleteDoc(postRef);
      } catch (error: any) {
        console.error('刪除留言失敗:', error);
        throw new Error(error.message || '刪除留言失敗');
      }
    }
  }
};

