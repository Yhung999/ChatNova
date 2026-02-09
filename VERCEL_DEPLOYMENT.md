# 🚀 Vercel Deployment Guide - ChatNova

## 📋 Overview

ChatNova consists of two parts:
1. **Frontend (React)** - Deploy to Vercel
2. **Backend (Node.js)** - Deploy to Heroku, Railway, or Render

## ⚠️ Important: Deploy Backend First!

You **MUST** deploy the backend server before the frontend, because the frontend needs the backend URL.

---

## 🔧 Step 1: Deploy Backend (Server)

### Option A: Deploy to Heroku (Recommended)

1. **Install Heroku CLI**
   ```bash
   # Download from: https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Deploy Server**
   ```bash
   cd chatnova/server
   
   # Initialize git (if not already)
   git init
   git add .
   git commit -m "Initial commit"
   
   # Create Heroku app
   heroku create chatnova-server
   
   # Deploy
   git push heroku main
   
   # Your server URL will be: https://chatnova-server.herokuapp.com
   ```

4. **Note Your Server URL**
   ```
   Example: https://chatnova-server.herokuapp.com
   ```

### Option B: Deploy to Render.com (Free Alternative)

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Select `server` directory
5. Configure:
   - **Name**: chatnova-server
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Click "Create Web Service"
7. Note your URL: `https://chatnova-server.onrender.com`

### Option C: Deploy to Railway.app

1. Go to https://railway.app
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repo → Select `server` folder
5. Railway auto-detects Node.js
6. Deploy and note your URL

---

## 🌐 Step 2: Deploy Frontend to Vercel

### A. Configure Environment Variables

1. **Create `.env` file in `client` folder**
   ```bash
   cd chatnova/client
   nano .env
   ```

2. **Add your backend URL** (replace with your actual server URL)
   ```env
   REACT_APP_API_URL=https://chatnova-server.herokuapp.com
   REACT_APP_SOCKET_URL=https://chatnova-server.herokuapp.com
   ```

### B. Deploy to Vercel

#### Option 1: Using Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd chatnova/client
   vercel
   ```

4. **Follow prompts:**
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? **chatnova** (or your choice)
   - Directory? **./** (current directory)
   - Override settings? **N**

5. **Set Environment Variables in Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Select your project → Settings → Environment Variables
   - Add:
     - `REACT_APP_API_URL` = `https://your-server.herokuapp.com`
     - `REACT_APP_SOCKET_URL` = `https://your-server.herokuapp.com`

6. **Redeploy**
   ```bash
   vercel --prod
   ```

#### Option 2: Using Vercel Dashboard (Easy)

1. **Go to https://vercel.com**

2. **Click "Add New Project"**

3. **Import from Git**
   - Connect your GitHub account
   - Select your repository
   - **Important**: Set Root Directory to `client`

4. **Configure Project**
   - Framework Preset: **Create React App**
   - Root Directory: **client**
   - Build Command: `npm run build`
   - Output Directory: `build`

5. **Add Environment Variables**
   - Click "Environment Variables"
   - Add:
     - Name: `REACT_APP_API_URL`
     - Value: `https://your-server.herokuapp.com`
   - Add:
     - Name: `REACT_APP_SOCKET_URL`
     - Value: `https://your-server.herokuapp.com`

6. **Click Deploy**

7. **Done!** Your app will be live at `https://your-project.vercel.app`

---

## 🔄 Update CORS on Backend

After deploying frontend, update your server's CORS settings:

**In `server/server.js`:**

```javascript
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://your-app.vercel.app"  // Add your Vercel URL
    ],
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 1e8
});

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://your-app.vercel.app"  // Add your Vercel URL
  ]
}));
```

Then redeploy your server.

---

## ✅ Verify Deployment

1. **Open your Vercel URL**: `https://your-app.vercel.app`
2. **Check Console** (F12):
   - Should connect to your backend
   - No CORS errors
   - Socket.io connected

3. **Test Features**:
   - Create account ✓
   - Login ✓
   - Send messages ✓
   - Upload files ✓

---

## 🐛 Troubleshooting

### Issue 1: 404 Error on Refresh

**Solution**: The `vercel.json` file should already be in the `client` folder. If not, create it:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/static/$1"
    },
    {
      "src": "/favicon.ico",
      "dest": "/favicon.ico"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Issue 2: Can't Connect to Server

**Check:**
- Backend is actually deployed and running
- Environment variables are set correctly in Vercel
- CORS is configured with your Vercel URL
- Both URLs use HTTPS (not HTTP)

**Fix:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL`
3. Redeploy: `vercel --prod`

### Issue 3: WebSocket Not Connecting

**Solution:**
1. Make sure your backend supports WebSockets
2. Check CORS settings include your Vercel domain
3. Use `wss://` for secure WebSocket (happens automatically with https)

### Issue 4: Files Not Uploading

**Solution:**
- Ensure your backend has file upload limits configured
- Check Heroku/Render has enough storage
- Verify upload endpoint is accessible

---

## 📁 File Structure After Setup

```
chatnova/
├── client/
│   ├── vercel.json          ✅ (created)
│   ├── .env                  ✅ (you create with your URLs)
│   ├── .env.example          ✅ (template)
│   └── src/
│       ├── api-config.js     ✅ (created)
│       └── App.js            ✅ (updated to use config)
└── server/
    └── server.js             (update CORS after deployment)
```

---

## 🎯 Quick Deploy Checklist

- [ ] Deploy backend first (Heroku/Render/Railway)
- [ ] Note your backend URL
- [ ] Create `.env` in `client` folder with backend URL
- [ ] Deploy frontend to Vercel
- [ ] Set environment variables in Vercel dashboard
- [ ] Update CORS in backend with Vercel URL
- [ ] Redeploy both if needed
- [ ] Test the app!

---

## 🌟 Production Tips

1. **Use Custom Domain** (Optional)
   - Vercel: Settings → Domains → Add
   - Add your custom domain
   - Update CORS accordingly

2. **Enable HTTPS** (Automatic on Vercel & Heroku)
   - Both platforms provide SSL by default

3. **Monitor Usage**
   - Check Vercel analytics
   - Monitor Heroku dyno usage

4. **Database** (For Production)
   - Add MongoDB Atlas or PostgreSQL
   - Update server to use database instead of in-memory storage

---

## 💡 Example URLs

**After deployment, you'll have:**

- Frontend: `https://chatnova.vercel.app`
- Backend: `https://chatnova-server.herokuapp.com`

**User flow:**
1. User visits `https://chatnova.vercel.app`
2. App connects to `https://chatnova-server.herokuapp.com`
3. Real-time messaging works via WebSocket
4. Files upload to server
5. Everything works! 🎉

---

## 🆘 Still Having Issues?

1. **Check Vercel Logs**
   ```bash
   vercel logs
   ```

2. **Check Heroku Logs**
   ```bash
   heroku logs --tail -a chatnova-server
   ```

3. **Common Fixes**
   - Clear browser cache
   - Check all environment variables
   - Verify both apps are running
   - Check browser console for errors
   - Ensure CORS is configured correctly

---

## ✅ Success Indicators

Your deployment is successful when:
- ✅ Frontend loads without errors
- ✅ No 404 errors on page refresh
- ✅ Can create account and login
- ✅ Can send messages in real-time
- ✅ Can upload files
- ✅ WebSocket shows as connected
- ✅ All features work as in local development

**Congratulations! Your ChatNova is now live! 🚀**
