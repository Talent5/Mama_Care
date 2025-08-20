# 🚀 MamaCare Deployment Instructions

## 📋 Prerequisites

Before deploying, you'll need:
- MongoDB Atlas account and connection string
- Render.com account (for backend)
- Netlify/Vercel account (for admin dashboard)
- Expo account (for mobile app)

## 🔧 Environment Setup

### 1. Backend Environment Variables

Create `backend/.env` file with:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secure_jwt_secret
JWT_EXPIRE=7d
CORS_ORIGINS=https://your-frontend-domain.com
```

### 2. Admin Dashboard Environment Variables

Create `admin-dashboard/.env` file with:

```env
VITE_API_URL=https://your-backend-url.onrender.com/api
VITE_APP_NAME=MamaCare Admin Dashboard
```

## 🌐 Deployment Steps

### Backend (Render)
1. Push code to GitHub
2. Connect Render to your repository
3. Configure build settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Root Directory: `backend`
4. Add environment variables in Render dashboard
5. Deploy

### Admin Dashboard (Netlify/Vercel)
1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Configure environment variables

### Mobile App (Expo)
1. Update API endpoints in app configuration
2. Build for production: `expo build`
3. Submit to app stores

## 📝 Important Notes

- Never commit `.env` files to git
- Use example files (`.env.example`) as templates
- Update CORS origins with your actual domains
- Test all endpoints after deployment

## 🔐 Security Checklist

- [ ] Strong JWT secrets
- [ ] MongoDB Atlas IP whitelist configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] HTTPS enforced

---

For detailed deployment guides, see:
- `RENDER_DEPLOYMENT.md` - Backend deployment
- `MONGODB_ATLAS_SETUP.md` - Database setup
