# 🚀 Deploy MamaCare Backend to Render

This guide will help you deploy your MamaCare backend to Render.com with MongoDB Atlas.

## 📋 Prerequisites

✅ MongoDB Atlas setup complete (already done!)  
✅ GitHub repository with your code  
✅ Render.com account (free tier available)  

## 🎯 Step-by-Step Deployment

### 1. **Prepare Your Repository**

Make sure your backend code is pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. **Deploy on Render**

1. Go to [render.com](https://render.com) and sign up/login
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your MamaCare repository
5. Choose the **backend** folder as root directory

### 3. **Configure Build Settings**

```yaml
Name: mamacare-backend
Region: Oregon (US West) or closest to your users
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm start
```

### 4. **Environment Variables**

Add these environment variables in Render dashboard:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://talentmundwa:theresakazingizi@cluster0.fgdy8jz.mongodb.net/mamacare?retryWrites=true&w=majority` |
| `JWT_SECRET` | `mamacare_super_secret_jwt_key_2025_zimbabwe_healthcare` |
| `JWT_EXPIRE` | `7d` |
| `CORS_ORIGINS` | `https://your-admin-dashboard.onrender.com,https://localhost:3000` |
| `MAX_FILE_SIZE` | `10485760` |
| `UPLOAD_PATH` | `uploads/` |
| `RATE_LIMIT_WINDOW` | `15` |
| `RATE_LIMIT_MAX` | `100` |

### 5. **Health Check Configuration**

Render will automatically detect your health check endpoint at `/api/health`

## 🔧 Files Ready for Deployment

✅ **render.yaml** - Render configuration file  
✅ **package.json** - Updated with build script  
✅ **server.js** - Configured for production  
✅ **.env** - Environment variables template  

## 🌍 After Deployment

### Your API will be available at:
```
https://mamacare-backend-[random-string].onrender.com
```

### Test your deployment:
```
https://your-backend-url.onrender.com/api/health
```

### Update your mobile app configuration:
```typescript
// In MamaCare/config/api.ts
const API_BASE_URL = 'https://your-backend-url.onrender.com/api';
```

## 📱 Frontend Deployment Options

### Option 1: Admin Dashboard on Render
1. Create new Static Site on Render
2. Build command: `npm run build`
3. Publish directory: `dist`

### Option 2: Admin Dashboard on Netlify/Vercel
1. Connect GitHub repository
2. Build settings: `npm run build` → `dist`

## 🔐 Security Considerations

### Production Environment Variables:
- Change `JWT_SECRET` to a secure random string
- Update `CORS_ORIGINS` with your actual frontend domains
- Consider using environment-specific database names

### Database Security:
- MongoDB Atlas is already secured with authentication
- Enable MongoDB Atlas IP whitelist (or use 0.0.0.0/0 for Render)
- Regular backups are handled by MongoDB Atlas

## 🚀 Render Free Tier Limitations

- **Spins down after 15 minutes of inactivity**
- **750 hours per month** (more than enough for testing)
- **500MB memory limit**
- **Cold start delay** (30-60 seconds wake up time)

## ⚡ Render Paid Tier Benefits

- **Always-on instances** (no spin down)
- **More memory and CPU**
- **Custom domains**
- **Auto-scaling**

## 🎯 Next Steps

1. **Deploy backend to Render**
2. **Test all API endpoints**
3. **Deploy admin dashboard**
4. **Update mobile app configuration**
5. **Submit mobile app to app stores**

## 🆘 Troubleshooting

### Common Issues:

**Build fails:**
- Check Node.js version in package.json
- Verify all dependencies are in package.json

**Database connection fails:**
- Verify MongoDB Atlas connection string
- Check IP whitelist in MongoDB Atlas

**CORS errors:**
- Update CORS_ORIGINS environment variable
- Add your frontend domain to the list

---

## 🎉 Your Backend is Ready for Production!

Once deployed, your MamaCare backend will be:
- ✅ Hosted on Render cloud platform
- ✅ Connected to MongoDB Atlas cloud database  
- ✅ Accessible worldwide with HTTPS
- ✅ Ready for mobile app deployment

Your backend URL will look like:
`https://mamacare-backend-xyz123.onrender.com`
