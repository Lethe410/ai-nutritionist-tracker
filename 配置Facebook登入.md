# 📘 配置 Facebook 登入

## 🔑 您的 Facebook App Secret

您提供的 App Secret：
```
313a4c77148b4e492df4510352e8c803
```

**重要**：請妥善保管此密鑰，不要公開分享。

---

## 📋 在 Firebase Console 中配置

### 步驟 1：進入 Facebook 登入設置

1. **前往 Firebase Console**：
   - 訪問：https://console.firebase.google.com/
   - 選擇項目：`nutriai-410`

2. **進入 Authentication**：
   - 點擊左側「**建構**」（Build）
   - 點擊「**Authentication**」
   - 點擊「**登入方法**」（Sign-in method）標籤

3. **找到 Facebook**：
   - 在登入方法列表中，找到「**Facebook**」
   - 點擊「**Facebook**」

---

### 步驟 2：填入配置

在 Facebook 設置頁面中：

1. **啟用 Facebook**：
   - 將「**啟用**」開關打開

2. **填入 App ID**：
   - 您需要從 Facebook Developers 獲取 App ID
   - 如果還沒有，請前往：https://developers.facebook.com/

3. **填入 App Secret**：
   - 在「**App Secret**」欄位中，貼上：
     ```
     313a4c77148b4e492df4510352e8c803
     ```

4. **點擊「儲存」**

---

## 🔍 如何獲取 Facebook App ID

如果您還沒有 Facebook App ID：

### 步驟 1：前往 Facebook Developers

1. **訪問**：https://developers.facebook.com/
2. **登入**您的 Facebook 帳號

### 步驟 2：創建應用

1. **點擊「我的應用程式」**（My Apps）
2. **點擊「建立應用程式」**（Create App）
3. **選擇應用類型**：
   - 選擇「**消費者**」（Consumer）或「**商業**」（Business）
4. **填寫應用資訊**：
   - 應用程式名稱：`NutriAI`（或任何名稱）
   - 應用程式聯絡電子郵件：您的電子郵件
5. **點擊「建立應用程式」**

### 步驟 3：添加 Facebook 登入產品

1. **在應用儀表板中**：
   - 點擊「**新增產品**」（Add Product）
   - 找到「**Facebook 登入**」（Facebook Login）
   - 點擊「**設定**」（Set Up）

### 步驟 4：配置 OAuth 重新導向 URI

1. **在「Facebook 登入」設置中**：
   - 點擊「**設定**」（Settings）
   - 在「**有效的 OAuth 重新導向 URI**」中添加：
     ```
     https://nutriai-410.firebaseapp.com/__/auth/handler
     ```
   - 點擊「**儲存變更**」

### 步驟 5：獲取 App ID 和 App Secret

1. **在應用儀表板中**：
   - 點擊「**設定**」（Settings）→「**基本**」（Basic）
   - 您會看到：
     - **應用程式編號**（App ID）
     - **應用程式密鑰**（App Secret）- 點擊「顯示」查看

---

## ✅ 完成配置後

配置完成後：

1. **測試 Facebook 登入**：
   - 刷新應用
   - 點擊「使用 Facebook 登入」按鈕
   - 應該會彈出 Facebook 登入視窗

2. **檢查是否成功**：
   - 如果登入成功，會自動進入應用
   - 可以在 Firebase Console → Authentication → 使用者中看到新用戶

---

## 🐛 常見問題

### 問題 1：App ID 和 App Secret 不匹配

**解決方法**：
- 確保 App ID 和 App Secret 來自同一個 Facebook 應用
- 檢查是否複製完整

### 問題 2：OAuth 重新導向 URI 錯誤

**解決方法**：
- 確保在 Facebook Developers 中設置了正確的 URI
- URI 必須完全匹配：`https://nutriai-410.firebaseapp.com/__/auth/handler`

### 問題 3：登入視窗被阻擋

**解決方法**：
- 允許瀏覽器彈出視窗
- 或使用無痕模式測試

---

## 📝 配置檢查清單

- [ ] ✅ 已在 Firebase Console 中啟用 Facebook
- [ ] ✅ 已填入 App ID
- [ ] ✅ 已填入 App Secret：`313a4c77148b4e492df4510352e8c803`
- [ ] ✅ 已在 Facebook Developers 中設置 OAuth URI
- [ ] ✅ 已測試 Facebook 登入

---

## 🚀 下一步

完成配置後，告訴我：
- ✅ "我已經配置好 Facebook 登入了"
- ✅ 或告訴我遇到的問題

然後我會幫您測試和解決問題！

---

**提示**：如果還沒有 Facebook App ID，請先前往 Facebook Developers 創建應用。

