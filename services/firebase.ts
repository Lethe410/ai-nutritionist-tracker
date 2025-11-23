// Firebase 配置文件
// 請將您在 Firebase Console 中獲取的配置貼到這裡

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// TODO: 請替換為您在 Firebase Console 中獲取的實際配置
// 步驟：
// 1. 前往 Firebase Console → 專案設定 → 一般設定
// 2. 找到您的網頁應用程式
// 3. 複製 firebaseConfig 對象
// 4. 貼到下面的 firebaseConfig 中

const firebaseConfig = {
    apiKey: "AIzaSyDatnrVDTfDitrJh78Wp-I4KsCbHZvcSzA",
    authDomain: "nutriai-410.firebaseapp.com",
    projectId: "nutriai-410",
    storageBucket: "nutriai-410.firebasestorage.app",
    messagingSenderId: "353695566500",
    appId: "1:353695566500:web:ee26a39b15d75486477431",
    measurementId: "G-ES9FLJB1H7"
  };
  

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化 Firebase 服務
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

export default app;

