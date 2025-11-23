# 🔧 修復 Facebook App Secret 錯誤

## ❌ 遇到的錯誤

錯誤訊息：
```
Error validating client secret
auth/invalid-credential
```

**原因**：Facebook App Secret 驗證失敗，可能是：
1. App Secret 不正確
2. App ID 和 App Secret 不匹配（來自不同的應用）
3. App Secret 已過期或被重置
4. 在 Firebase Console 中輸入錯誤

---

## ✅ 解決方法

### 步驟 1：確認 App ID 和 App Secret

1. **前往 Facebook Developers**：
   - 訪問：https://developers.facebook.com/
   - 選擇您的應用（例如：`Food Detection1`，App ID: `1347256056841048`）

2. **獲取正確的 App ID 和 App Secret**：
   - 點擊「**設定**」（Settings）→「**基本**」（Basic）
   - 查看：
     - **應用程式編號**（App ID）：例如 `1347256056841048`
     - **應用程式密鑰**（App Secret）：點擊「**顯示**」查看
     - **重要**：確保 App Secret 是從**同一個應用**獲取的

3. **確認匹配**：
   - App ID 和 App Secret 必須來自**同一個 Facebook 應用**
   - 如果有多個應用，確保使用正確的配對

---

### 步驟 2：在 Firebase Console 中重新配置

1. **前往 Firebase Console**：
   - 訪問：https://console.firebase.google.com/
   - 選擇項目：`nutriai-410`

2. **進入 Facebook 設置**：
   - 點擊「**建構**」→「**Authentication**」→「**登入方法**」
   - 點擊「**Facebook**」

3. **重新填入配置**：
   - **App ID**：從 Facebook Developers 複製（例如：`1347256056841048`）
   - **App Secret**：從 Facebook Developers 複製（點擊「顯示」查看）
   - **重要**：確保完全複製，沒有多餘空格
   - 點擊「**儲存**」

---

### 步驟 3：檢查 App Secret 是否正確

**您之前提供的 App Secret**：
```
313a4c77148b4e492df4510352e8c803
```

**請確認**：
1. 這個 App Secret 是否對應 App ID `1347256056841048`？
2. 或者您使用的是其他應用的 App ID？
3. 在 Facebook Developers 中，點擊「顯示」重新獲取 App Secret

---

## 🔍 如何獲取正確的 App Secret

### 在 Facebook Developers 中：

1. **選擇正確的應用**：
   - 確認您選擇的是正確的應用（例如：`Food Detection1`）

2. **獲取 App Secret**：
   - 點擊「**設定**」→「**基本**」
   - 找到「**應用程式密鑰**」（App Secret）
   - 點擊「**顯示**」按鈕
   - **複製完整的 App Secret**（32 個字符）

3. **確認格式**：
   - App Secret 通常是 32 個字符的十六進制字符串
   - 例如：`313a4c77148b4e492df4510352e8c803`

---

## 📝 配置檢查清單

請確認以下項目：

- [ ] ✅ App ID 和 App Secret 來自**同一個** Facebook 應用
- [ ] ✅ 在 Firebase Console 中，App ID 正確（例如：`1347256056841048`）
- [ ] ✅ 在 Firebase Console 中，App Secret 正確（32 個字符，無空格）
- [ ] ✅ 已在 Facebook Developers 中設置 OAuth URI：`https://nutriai-410.firebaseapp.com/__/auth/handler`
- [ ] ✅ 已啟用「使用 JavaScript SDK 登入」

---

## 🐛 常見問題

### 問題 1：App ID 和 App Secret 不匹配

**症狀**：`Error validating client secret`

**解決方法**：
- 確保 App ID 和 App Secret 來自同一個應用
- 重新從 Facebook Developers 獲取兩者

### 問題 2：App Secret 已過期

**解決方法**：
- 在 Facebook Developers 中，點擊「**重設**」App Secret
- 獲取新的 App Secret
- 在 Firebase Console 中更新

### 問題 3：複製時有空格

**解決方法**：
- 確保複製時沒有多餘的空格
- 可以手動輸入，確保完全正確

---

## 🔄 重新配置步驟

1. **在 Facebook Developers 中**：
   - 確認應用（例如：`Food Detection1`，App ID: `1347256056841048`）
   - 獲取 App Secret（點擊「顯示」）

2. **在 Firebase Console 中**：
   - 前往 Authentication → 登入方法 → Facebook
   - **刪除**現有的 App ID 和 App Secret
   - **重新輸入**：
     - App ID：`1347256056841048`（或您實際使用的 App ID）
     - App Secret：從 Facebook Developers 重新獲取
   - 點擊「**儲存**」

3. **等待幾秒鐘**讓設置生效

4. **重新測試** Facebook 登入

---

## ✅ 完成後

重新配置後，告訴我：
- ✅ "我已經重新配置了 App Secret"
- ✅ 或告訴我您使用的 App ID（我可以幫您確認）

然後我會幫您測試和解決問題！

---

## 💡 提示

**如果還是不行**：
1. 可以在 Facebook Developers 中「重設」App Secret
2. 獲取新的 App Secret
3. 在 Firebase Console 中更新

**或者**：
- 確認您使用的是哪個 Facebook 應用
- 告訴我 App ID，我可以幫您確認配置

