# 🚀 MamaCare Deployment Checklist

## ✅ Cleanup Completed
- [x] Removed development and test files
- [x] Cleaned debug console.log statements
- [x] Removed temporary documentation files
- [x] Updated .gitignore for production
- [x] Staged and committed all changes

## 📋 Pre-Deployment Verification

### Backend Deployment
- [ ] Update `backend/.env.production` with production database URL
- [ ] Update `backend/.env.production` with production JWT secret
- [ ] Test backend health endpoint: `/api/health`
- [ ] Deploy to production hosting (Render/Railway/Heroku)
- [ ] Configure domain/subdomain for backend

### Admin Dashboard Deployment
- [ ] Update `admin-dashboard/.env.production` with production backend URL
- [ ] Build admin dashboard: `cd admin-dashboard && npm run build`
- [ ] Deploy admin dashboard (Vercel/Netlify/Firebase)
- [ ] Test admin login and functionality

### Mobile App Deployment
- [ ] Update `MamaCare/.env.production` with production backend URL
- [ ] Configure EAS build profile in `eas.json`
- [ ] Build for production: `cd MamaCare && eas build --profile production`
- [ ] Test APK on physical device
- [ ] Submit to Google Play Store (if ready)

## 🔧 Configuration Files to Update

### Backend (`backend/.env.production`)
```env
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb+srv://your-production-cluster
JWT_SECRET=your-super-secure-jwt-secret-here
CORS_ORIGIN=https://your-admin-dashboard-domain.com,https://your-mobile-app-domain.com
```

### Admin Dashboard (`admin-dashboard/.env.production`)
```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

### Mobile App (`MamaCare/.env.production`)
```env
API_BASE_URL=https://your-backend-domain.com/api
```

## 🚀 Deployment Commands

### Deploy Backend
```bash
# Push to your hosting service repository
git push origin master

# Or deploy directly to Render/Railway
```

### Build & Deploy Admin Dashboard
```bash
cd admin-dashboard
npm ci
npm run build
# Deploy dist/ folder to your hosting service
```

### Build Mobile App
```bash
cd MamaCare
npm ci
eas build --profile production --platform android
# Follow EAS build process
```

## ✅ Final Verification
- [ ] Backend health check works from production URL
- [ ] Admin dashboard loads and can connect to backend
- [ ] Mobile app APK installs and connects to backend
- [ ] All environment variables are correctly configured
- [ ] SSL certificates are working for all domains
- [ ] CORS is properly configured for production domains

## 📝 Post-Deployment
- [ ] Monitor logs for errors
- [ ] Test all critical user flows
- [ ] Update DNS records if needed
- [ ] Set up monitoring/alerts
- [ ] Document production URLs and credentials

---

**Important:** Always test in a staging environment before deploying to production!
