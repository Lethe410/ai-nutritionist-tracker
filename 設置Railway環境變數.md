# ⚙️ 設置 Railway 環境變數 - 詳細步驟

## 📋 需要設置的環境變數

| 變數名稱 | 值 | 說明 | 是否必須 |
|---------|-----|------|---------|
| `API_KEY` | 您的 Google Gemini API Key | 用於 AI 功能 | ✅ 必須 |
| `JWT_SECRET` | 任意字串（建議長字串） | 用於 JWT 簽名 | ✅ 必須 |
| `NODE_ENV` | `production` | 生產環境標記 | ✅ 必須 |

---

## 🔧 設置步驟

### 步驟 1：打開 Railway Variables 頁面

1. **在 Railway 中**：
   - 點擊您的服務 `ai-nutritionist-tracker`
   - 點擊頂部的 **"Variables"** 標籤

2. **您會看到**：
   - 一個表格顯示現有的環境變數
   - 右上角有 **"New Variable"** 按鈕

---

### 步驟 2：添加 `API_KEY`

1. **點擊 "New Variable" 按鈕**

2. **填寫**：
   - **Key**: `API_KEY`
   - **Value**: 您的 Google Gemini API Key
     - 如果還沒有 API Key：
       1. 前往：https://aistudio.google.com/apikey
       2. 點擊 "Create API Key"
       3. 複製生成的 API Key

3. **點擊 "Add"** 或 **"Save"**

---

### 步驟 3：添加 `JWT_SECRET`

1. **再次點擊 "New Variable" 按鈕**

2. **填寫**：
   - **Key**: `JWT_SECRET`
   - **Value**: 任意字串（建議使用長字串）
     - 例如：`mysecretkey123456789abcdefghijklmnop`
     - 或使用隨機生成的字串

3. **點擊 "Add"** 或 **"Save"**

---

### 步驟 4：添加 `NODE_ENV`

1. **再次點擊 "New Variable" 按鈕**

2. **填寫**：
   - **Key**: `NODE_ENV`
   - **Value**: `production`

3. **點擊 "Add"** 或 **"Save"**

---

## ✅ 完成後確認

設置完成後，您應該會在 Variables 列表中看到：

```
API_KEY        [已設置]
JWT_SECRET     [已設置]
NODE_ENV       production
PORT           [Railway 自動設置，不需要手動添加]
```

---

## 🔄 Railway 會自動重新部署

- 添加或修改環境變數後，Railway 會自動重新部署服務
- 等待約 1-2 分鐘讓部署完成
- 可以在 "Deploy Logs" 標籤查看部署進度

---

## 🧪 測試後端

設置完成後，測試後端是否正常：

1. **在瀏覽器打開**：
   ```
   https://ai-nutritionist-tracker-production.up.railway.app/
   ```

2. **應該會看到**：
   ```json
   {
     "status": "ok",
     "message": "Server is running",
     ...
   }
   ```

3. **如果看到錯誤**：
   - 檢查 Railway 日誌（"Deploy Logs" 標籤）
   - 確認所有環境變數都已正確設置
   - 確認 API_KEY 是否有效

---

## ❓ 常見問題

### 問題 1：找不到 Google Gemini API Key

**解決方法**：
1. 前往：https://aistudio.google.com/apikey
2. 登入您的 Google 帳號
3. 點擊 "Create API Key"
4. 複製生成的 API Key
5. 在 Railway 中設置 `API_KEY`

### 問題 2：Railway 重新部署失敗

**檢查項目**：
- 確認環境變數名稱拼寫正確（大小寫敏感）
- 確認 `API_KEY` 值正確（沒有多餘的空格）
- 查看 "Deploy Logs" 中的錯誤訊息

### 問題 3：後端無法訪問

**檢查項目**：
- 確認服務狀態是 "Active"（綠色）
- 確認所有環境變數都已設置
- 等待幾分鐘讓部署完成

---

## 🎯 完成後

設置完所有環境變數後：
1. ✅ Railway 後端應該可以正常運行
2. ✅ AI 功能應該可以使用
3. ✅ 前端應該可以連接後端

然後測試應用：
```
https://lethe410.github.io/ai-nutritionist-tracker/
```

---

## 📝 提示

- **API_KEY**：如果沒有，需要先到 Google AI Studio 創建
- **JWT_SECRET**：可以使用任何字串，建議使用長字串以提高安全性
- **NODE_ENV**：必須設置為 `production`，這樣後端才會使用生產環境配置

