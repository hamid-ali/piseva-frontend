# PiSeva Frontend Deployment Guide

## 🚀 Free Hosting Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd frontend
   vercel --prod
   ```

4. **Set Environment Variables in Vercel Dashboard:**
   - `REACT_APP_API_BASE_URL`: Your backend URL
   - `REACT_APP_SOCKET_URL`: Your backend URL
   - `REACT_APP_ENV`: production

### Option 2: Netlify

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Deploy:**
   ```bash
   cd frontend
   npm run build
   netlify deploy --prod --dir=build
   ```

### Option 3: GitHub Pages

1. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json:**
   ```json
   "homepage": "https://yourusername.github.io/your-repo-name",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

### Option 4: Surge.sh (Simplest)

1. **Install Surge:**
   ```bash
   npm install -g surge
   ```

2. **Deploy:**
   ```bash
   cd frontend/build
   surge
   ```

## 🔧 Configuration Notes

- Update `REACT_APP_API_BASE_URL` in `.env.production` with your backend URL
- For demo purposes, you can use mock data by creating a demo mode
- All deployments support custom domains on free tiers

## 📱 Demo Mode (No Backend Required)

To showcase without backend, you can enable demo mode:

1. Set `REACT_APP_DEMO_MODE=true` in environment variables
2. The app will use mock data for demonstrations
3. Perfect for product pitches and investor demos

## 🌐 Live URLs

After deployment, your app will be available at:
- Vercel: `https://your-app-name.vercel.app`
- Netlify: `https://your-app-name.netlify.app`
- Surge: `https://your-domain.surge.sh`
- GitHub Pages: `https://yourusername.github.io/repo-name`