# MamaCare Local Development Setup Guide

## 🎯 Quick Start

### 1. Backend Setup (Required First)
```bash
cd backend
./start-dev.bat
```
This will:
- ✅ Activate development environment (.env.development)
- ✅ Install dependencies  
- ✅ Start backend on http://localhost:5000
- ✅ Enable CORS for all local development ports

### 2. Admin Dashboard (Vite)
```bash
cd admin-dashboard
npm install
npm run dev
```
- 🌐 Runs on: http://localhost:5173
- ✅ Will connect to backend automatically

### 3. Mobile App (Expo)
```bash
cd MamaCare
npm install  
npm start
```
- 🌐 Runs on: http://localhost:8081
- 📱 Expo Go will auto-detect your local network IP
- ✅ Will connect to backend automatically

## 🔧 CORS Configuration

Your backend now supports these origins in development mode:

### Web Development:
- ✅ `http://localhost:5173` (Vite dev server - Admin Dashboard)
- ✅ `http://localhost:3000` (React dev server)
- ✅ `http://localhost:3001` (Alternative React port)
- ✅ `https://localhost:5173` (HTTPS variant)

### Mobile Development:
- ✅ `http://localhost:8081` (Expo dev server)
- ✅ `http://127.0.0.1:8081` (Alternative localhost)
- ✅ `http://192.168.x.x:xxxx` (Any local network IP)
- ✅ `http://10.0.2.2:xxxx` (Android emulator)
- ✅ `exp://` and `expo://` URLs (Expo development)

### Production:
- ✅ `https://mama-care-2m7mq1hws-talent5s-projects.vercel.app` (Your Vercel frontend)
- ✅ `https://mama-care.vercel.app` (Future production domain)

## 🧪 Testing Your Setup

### Test Backend Health:
```bash
# From backend directory
node test-local-cors.js
```

### Test Frontend Connection:
1. Open http://localhost:5173
2. Try to login - should work without CORS errors
3. Check browser console - no CORS errors should appear

### Test Mobile App:
1. Start Expo: `npm start` in MamaCare directory
2. Open Expo Go on your phone
3. Scan QR code or use development build
4. App should connect to your local backend

## 🔍 Troubleshooting

### CORS Errors Still Appearing?
1. **Restart backend** after any CORS changes
2. **Clear browser cache** (Ctrl+Shift+R)
3. **Check your local IP** - run `ipconfig` and update if needed

### Mobile App Can't Connect?
1. **Make sure you're on the same WiFi network**
2. **Check firewall settings** - allow port 5000
3. **Update local IP** in backend logs and Expo config

### Different Port Numbers?
The backend automatically detects and allows:
- Any localhost port (http://localhost:XXXX)
- Any local network IP (http://192.168.x.x:XXXX)

## 📱 Network Configuration

### For Mobile Development:
1. **Connect phone and computer to same WiFi**
2. **Backend will show your network IP** when starting:
   ```
   Network access: http://192.168.0.49:5000/api/health
   ```
3. **Expo will auto-detect** this IP and connect automatically

### For Different Networks:
If you change WiFi networks:
1. **Restart backend** to detect new IP
2. **Restart Expo** to refresh connection
3. **No code changes needed** - all automatic!

## 🚀 Development Workflow

1. **Start backend first**: `./start-dev.bat`
2. **Start frontend(s)**: Admin dashboard and/or mobile app
3. **Develop normally** - CORS is handled automatically
4. **Test on devices** - just connect to same WiFi

## 📋 Environment Files

### Backend (.env.development):
```bash
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8081,...
```

### Admin Dashboard (.env.development):
```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

### Mobile App:
Uses automatic IP detection - no manual configuration needed!

---

🎉 **You're all set!** Your development environment now supports:
- 💻 Admin dashboard on http://localhost:5173
- 📱 Mobile app via Expo Go
- 🔄 Automatic backend connection
- 🌐 No more CORS errors!
