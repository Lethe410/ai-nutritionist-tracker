# 部署指南

## 部署架構

這個應用需要分別部署前端和後端：

- **前端**：部署到 GitHub Pages（靜態文件）
- **後端**：需要部署到支持 Node.js 的平台

## 方案一：GitHub Pages + Railway/Render（推薦）

### 1. 部署前端到 GitHub Pages

1. 將代碼推送到 GitHub
2. 在 GitHub 倉庫設置中啟用 GitHub Pages
3. 選擇 `gh-pages` 分支或 `main` 分支的 `/docs` 文件夾
4. GitHub Actions 會自動構建和部署

### 2. 部署後端到 Railway 或 Render

#### Railway 部署步驟：

1. 前往 [Railway](https://railway.app/)
2. 創建新專案，選擇 "Deploy from GitHub repo"
3. 選擇您的倉庫
4. 設置環境變數：
   - `API_KEY`: 您的 Google Gemini API Key
   - `JWT_SECRET`: 您的 JWT 密鑰
   - `PORT`: Railway 會自動設置
5. Railway 會自動部署

#### Render 部署步驟：

1. 前往 [Render](https://render.com/)
2. 創建新的 "Web Service"
3. 連接您的 GitHub 倉庫
4. 設置：
   - Build Command: `npm install`
   - Start Command: `node server/server.js`
   - Root Directory: 留空
5. 設置環境變數（同 Railway）
6. 部署

### 3. 更新前端 API URL

部署後端後，您會獲得一個 URL（如：`https://your-app.railway.app`）

1. 在 GitHub 倉庫設置中添加 Secret：
   - 名稱：`VITE_API_URL`
   - 值：`https://your-app.railway.app/api`

2. 或者手動更新 `services/api.ts`：
   ```typescript
   const API_URL = 'https://your-app.railway.app/api';
   ```

## 方案二：全棧部署到 Vercel

Vercel 支持全棧應用，可以同時部署前端和後端。

### 部署步驟：

1. 前往 [Vercel](https://vercel.com/)
2. 導入您的 GitHub 倉庫
3. 設置：
   - Framework Preset: Vite
   - Root Directory: `.`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. 設置環境變數
5. 創建 `vercel.json` 配置 API 路由

## 環境變數設置

無論使用哪個平台，都需要設置以下環境變數：

- `API_KEY`: Google Gemini API Key
- `JWT_SECRET`: JWT 簽名密鑰
- `PORT`: 服務器端口（通常平台會自動設置）

## 注意事項

1. **數據庫**：SQLite 文件不會持久化，建議使用 PostgreSQL 或 MySQL
2. **CORS**：確保後端允許前端域名的跨域請求
3. **HTTPS**：生產環境必須使用 HTTPS（部署平台通常會自動提供）

## 快速測試

部署完成後，在手機瀏覽器訪問：
- GitHub Pages URL: `https://your-username.github.io/ai-nutritionist-tracker/`
- 或 Vercel URL: `https://your-app.vercel.app`

