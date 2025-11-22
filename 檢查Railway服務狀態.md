# 🔍 檢查 Railway 服務狀態

## ⚠️ 當前問題

日誌顯示 "No logs in this time range"，這可能表示：
1. 服務可能沒有運行
2. 時間範圍設置太窄
3. 需要查看部署日誌而不是實時日誌

---

## 🔧 檢查步驟

### 步驟 1：擴大時間範圍查看日誌

1. **在 Railway 中**：
   - 點擊 "Logs" 標籤
   - 找到時間範圍選擇器（顯示 "11/22/25, 10:20 PM - 11/22/25, 10:20 PM"）
   - **擴大時間範圍**：
     - 點擊時間選擇器
     - 選擇更大的時間範圍（例如：過去 1 小時或過去 24 小時）
     - 查看是否有日誌

---

### 步驟 2：檢查服務狀態

1. **在 Railway 中**：
   - 點擊服務 `ai-nutritionist-tracker`
   - 查看頂部狀態：
     - ✅ **"Active"**（綠色）= 服務正在運行
     - ❌ **"Inactive"** 或 **"Stopped"** = 服務已停止

2. **如果服務已停止**：
   - 點擊 "Deployments" 標籤
   - 查看最新的部署狀態
   - 如果部署失敗，點擊查看錯誤訊息

---

### 步驟 3：查看部署日誌（重要）

1. **在 Railway 中**：
   - 點擊服務 `ai-nutritionist-tracker`
   - 點擊 **"Deployments"** 標籤（不是 "Logs"）
   - 點擊最新的部署
   - 查看 **"Build Logs"** 和 **"Deploy Logs"**

2. **應該看到**：
   - ✅ "server running" 訊息
   - ✅ 沒有紅色錯誤訊息
   - ✅ 部署狀態為 "Active"

3. **如果看到錯誤**：
   - 複製完整的錯誤訊息
   - 發送給我查看

---

### 步驟 4：檢查 Settings 配置

1. **在 Railway 中**：
   - 點擊服務 → "Settings" 標籤
   - 檢查 **"Start Command"**：
     - 應該設置為：`node server/server.js`
     - 如果沒有設置或設置錯誤，請修改並保存

2. **檢查環境變數**：
   - 點擊 "Variables" 標籤
   - 確認以下變數都已設置：
     - ✅ `API_KEY`
     - ✅ `JWT_SECRET`
     - ✅ `NODE_ENV` = `production`

---

### 步驟 5：手動重新部署

如果服務狀態異常：

1. **在 Railway 中**：
   - 點擊服務 → "Deployments" 標籤
   - 點擊最新的部署
   - 點擊 **"Redeploy"** 按鈕
   - 等待約 2-3 分鐘

2. **查看部署進度**：
   - 在 "Deploy Logs" 中查看部署過程
   - 確認沒有錯誤

---

## 🧪 測試後端

部署完成後，測試後端是否正常：

1. **在瀏覽器打開**：
   ```
   https://ai-nutritionist-tracker-production.up.railway.app/api/login
   ```

2. **應該看到**：
   - JSON 錯誤（因為沒有提供參數，但這表示 API 可以訪問）
   - 或者 405 錯誤（如果仍然有問題）

3. **如果無法訪問**：
   - 檢查 Railway 服務狀態
   - 查看部署日誌中的錯誤

---

## 📝 需要提供的信息

如果問題仍然存在，請提供：

1. **服務狀態**：
   - Active / Inactive / Stopped？

2. **部署日誌**：
   - 最新的 "Deploy Logs" 內容
   - 是否有錯誤訊息？

3. **Settings 配置**：
   - Start Command 設置是什麼？
   - 環境變數是否都已設置？

4. **測試結果**：
   - 訪問 `https://ai-nutritionist-tracker-production.up.railway.app/api/login` 的結果

---

## 🎯 快速檢查清單

- [ ] 擴大日誌時間範圍查看
- [ ] 檢查服務狀態（應該是 "Active"）
- [ ] 查看 "Deployments" → "Deploy Logs"（不是 "Logs"）
- [ ] 確認 Start Command 設置正確
- [ ] 確認環境變數都已設置
- [ ] 測試 API 端點是否可以訪問

---

## 💡 重要提示

**"Logs" 標籤** 顯示的是實時日誌，如果服務沒有活動，可能沒有日誌。

**"Deployments" → "Deploy Logs"** 顯示的是部署過程的日誌，這裡可以看到服務是否成功啟動。

建議查看 **"Deployments"** 標籤而不是 "Logs" 標籤來診斷問題。

