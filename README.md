<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1RLSIvTinHtU2RxqnKQr75Au5teFeGVu-

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory with the following content:
   ```env
   API_KEY=your_google_gemini_api_key_here
   JWT_SECRET=your_jwt_secret_key_here
   PORT=3001
   ```
   > **Note:** Replace `your_google_gemini_api_key_here` with your actual Google Gemini API key.
   > You can get one from [Google AI Studio](https://makersuite.google.com/app/apikey)

3. Run both frontend and backend:
   ```bash
   npm run dev:all
   ```
   
   This will start:
   - Backend server on `http://localhost:3001`
   - Frontend dev server (usually on `http://localhost:5173`)

## Deployment

### Deploy to GitHub Pages

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository Settings → Pages
   - Source: GitHub Actions
   - The workflow will automatically deploy on push to main

3. **Deploy Backend:**
   - Use Railway, Render, or Vercel to deploy the backend
   - Set environment variables: `API_KEY`, `JWT_SECRET`
   - Update `VITE_API_URL` in GitHub Secrets with your backend URL

See [DEPLOY.md](./DEPLOY.md) for detailed deployment instructions.

## Troubleshooting

### AI features not working
- Make sure you have created a `.env` file with a valid `API_KEY`
- Check the terminal for error messages
- Verify the backend server is running on port 3001

### Mobile access issues
- Ensure phone and computer are on the same Wi-Fi network
- Check Windows Firewall settings for ports 5173 and 3001
- Use the computer's local IP address: `http://YOUR_IP:5173`

## Environment variables
- `VITE_API_URL` – set this to your deployed backend URL, e.g. `https://your-service.up.railway.app` (must include `https://`)
