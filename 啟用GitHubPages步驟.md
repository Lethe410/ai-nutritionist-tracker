# 🔧 啟用 GitHub Pages - 重要步驟

## ⚠️ 錯誤原因

GitHub Actions 失敗是因為 **GitHub Pages 還沒有啟用**。

錯誤訊息：
```
Error: Get Pages site failed. Please verify that the repository has Pages enabled
```

## ✅ 解決步驟

### 步驟 1：啟用 GitHub Pages

1. 前往您的 GitHub 倉庫：
   https://github.com/Lethe410/ai-nutritionist-tracker

2. 點擊 **"Settings"**（倉庫設置）

3. 在左側選單中找到 **"Pages"**

4. 在 **"Source"** 區塊：
   - 選擇：**"GitHub Actions"**
   - **不要**選擇 "Deploy from a branch"

5. 點擊 **"Save"**

### 步驟 2：重新觸發部署

啟用 Pages 後，有兩種方式觸發部署：

**方式一：自動觸發**
- 推送任何代碼更改會自動觸發
- 或等待幾分鐘，GitHub 可能會自動重試

**方式二：手動觸發**
1. 點擊倉庫頂部的 **"Actions"** 標籤
2. 選擇 **"Deploy to GitHub Pages"** 工作流
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
- 如果仍然失敗，請檢查 Actions 日誌中的具體錯誤

## 🎯 完成後

啟用並部署成功後，您就可以：
- ✅ 在任何地方訪問應用
- ✅ 分享給朋友使用
- ✅ 繼續部署後端到 Railway

