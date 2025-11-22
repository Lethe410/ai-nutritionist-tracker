# 🔧 啟用 GitHub Pages - 重要步驟

## ⚠️ 錯誤原因

GitHub Actions 失敗是因為 **GitHub Pages 還沒有啟用**。

從截圖可以看到：
- ✅ `build` job 成功（綠色勾號）
- ❌ `deploy` job 失敗（紅色 X）

這表示代碼構建成功，但部署失敗，因為 GitHub Pages 功能尚未啟用。

## ✅ 解決步驟（圖文說明）

### 步驟 1：啟用 GitHub Pages

1. **前往倉庫設置頁面**：
   - 直接點擊：https://github.com/Lethe410/ai-nutritionist-tracker/settings/pages
   - 或手動：點擊倉庫頂部的 **"Settings"** 標籤

2. **找到 Pages 設置**：
   - 在左側選單中，向下滾動找到 **"Pages"**（在 "Security" 和 "Secrets and variables" 附近）
   - 點擊 **"Pages"**

3. **配置 Source**：
   - 在頁面頂部的 **"Source"** 區塊中
   - 您會看到一個下拉選單，目前可能是空的或顯示 "None"
   - **選擇：`GitHub Actions`**
   - ⚠️ **重要**：不要選擇 "Deploy from a branch" 或 "main" 分支

4. **保存設置**：
   - 點擊 **"Save"** 按鈕
   - 頁面會刷新，您應該會看到 "Your site is live at..." 的提示（但可能還需要等待部署完成）

### 步驟 2：重新觸發部署

啟用 Pages 後，需要重新運行失敗的 job：

**推薦方式：重新運行失敗的 job**
1. 前往 Actions 頁面：
   - https://github.com/Lethe410/ai-nutritionist-tracker/actions
2. 點擊最新的工作流運行（顯示 "Fix: Remove Setup Pages step..."）
3. 在頁面右上角，點擊 **"Re-run jobs"** 下拉按鈕
4. 選擇 **"Re-run failed jobs"**
5. 等待約 1-2 分鐘，查看 `deploy` job 是否成功

**或者：手動觸發新運行**
1. 點擊倉庫頂部的 **"Actions"** 標籤
2. 在左側選擇 **"Deploy to GitHub Pages"** 工作流
3. 點擊右側的 **"Run workflow"** 按鈕
4. 選擇 `main` 分支
5. 點擊綠色的 **"Run workflow"** 按鈕

### 步驟 3：檢查部署狀態

1. 在 **"Actions"** 標籤查看部署進度
2. 等待約 1-2 分鐘
3. 如果成功，會看到綠色的勾號 ✅

### 步驟 4：獲取網址

部署成功後：
1. 前往 **Settings** → **Pages**
2. 您會看到網址：
   ```
   https://lethe410.github.io/ai-nutritionist-tracker/
   ```

## 📝 注意事項

- **必須先啟用 GitHub Pages**，工作流才能成功
- 啟用後，後續的推送會自動部署
- 如果仍然失敗，請：
  1. 點擊失敗的 `deploy` job
  2. 展開 "Deploy to GitHub Pages" 步驟
  3. 複製完整的錯誤訊息給我

## 🔍 如何查看詳細錯誤

如果 `deploy` job 仍然失敗：

1. 在 Actions 頁面，點擊失敗的 `deploy` job（紅色 X）
2. 展開 **"Deploy to GitHub Pages"** 步驟
3. 查看錯誤訊息，常見的錯誤包括：
   - `Error: Get Pages site failed` → Pages 未啟用（已解決）
   - `Error: HttpError: Not Found` → Pages 未啟用（已解決）
   - `Error: Permission denied` → 權限問題（檢查 Settings → Actions → General → Workflow permissions）
   - 其他錯誤 → 請複製完整錯誤訊息

## 🎯 完成後

啟用並部署成功後，您就可以：
- ✅ 在任何地方訪問應用
- ✅ 分享給朋友使用
- ✅ 繼續部署後端到 Railway

