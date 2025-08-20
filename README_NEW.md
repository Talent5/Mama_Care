# 🤱 MamaCare - Comprehensive Maternal Healthcare Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.72+-blue.svg)](https://reactnative.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/atlas)

MamaCare is a comprehensive maternal healthcare platform designed to support expecting mothers throughout their pregnancy journey. The platform includes a mobile app for patients, an admin dashboard for healthcare providers, and a robust backend API.

## 🌟 Features

### 📱 Mobile App (React Native)
- **Patient Registration & Profiles**
- **Appointment Scheduling**
- **Health Metrics Tracking** (weight, blood pressure, etc.)
- **Medication Reminders**
- **Symptom Logging**
- **Educational Content**
- **Push Notifications**
- **Telemedicine Support**
- **Emergency Alerts**

### 🖥️ Admin Dashboard (React + Vite)
- **Patient Management**
- **Appointment Management**
- **Health Records Overview**
- **Analytics & Reporting**
- **User Management**
- **System Settings**
- **Medical Records Management**
- **Billing & Invoicing**

### 🔧 Backend API (Node.js + Express)
- **RESTful API Architecture**
- **MongoDB Atlas Integration**
- **JWT Authentication**
- **Role-based Access Control**
- **File Upload Support**
- **Push Notifications**
- **Automated Reminders**
- **Health Check Endpoints**

## 🏗️ Project Structure

```
MamaCare/
├── 📱 MamaCare/                 # React Native Mobile App
│   ├── app/                     # App screens and navigation
│   ├── components/              # Reusable components
│   ├── services/                # API services
│   ├── types/                   # TypeScript definitions
│   └── package.json
├── 🖥️ admin-dashboard/          # React Admin Dashboard
│   ├── src/
│   │   ├── components/          # Dashboard components
│   │   ├── services/            # API services
│   │   ├── contexts/            # React contexts
│   │   └── types/               # TypeScript definitions
│   └── package.json
├── 🔧 backend/                  # Node.js Backend API
│   ├── models/                  # MongoDB schemas
│   ├── routes/                  # API routes
│   ├── middleware/              # Express middleware
│   ├── services/                # Business logic
│   ├── scripts/                 # Utility scripts
│   └── package.json
└── 📄 docs/                     # Documentation
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**
- **MongoDB Atlas** account
- **Expo CLI** (for mobile development)

### 1. Clone the Repository
```bash
git clone https://github.com/Talent5/Mama_Care.git
cd Mama_Care
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB Atlas connection string
npm start
```

### 3. Admin Dashboard Setup
```bash
cd admin-dashboard
npm install
npm run dev
```

### 4. Mobile App Setup
```bash
cd MamaCare
npm install
npx expo start
```

## 🌐 Deployment

### Backend (Render)
The backend is configured for easy deployment on Render:

1. **Push to GitHub**
2. **Connect to Render**
3. **Configure Environment Variables**
4. **Deploy**

See `RENDER_DEPLOYMENT.md` for detailed instructions.

### Admin Dashboard (Netlify/Vercel)
```bash
cd admin-dashboard
npm run build
# Deploy dist/ folder to Netlify or Vercel
```

### Mobile App (Expo)
```bash
cd MamaCare
npx expo build:android  # For Android APK
npx expo build:ios      # For iOS App Store
```

## 🔐 Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secure_jwt_secret
JWT_EXPIRE=7d
CORS_ORIGINS=https://yourdomain.com
```

### Admin Dashboard (.env)
```env
VITE_API_URL=https://your-backend-url.com/api
VITE_APP_NAME=MamaCare Admin Dashboard
```

## 📊 Database Schema

The application uses MongoDB with the following main collections:

- **Users** - System users (doctors, nurses, patients)
- **Patients** - Patient profiles and medical information
- **Appointments** - Appointment scheduling and management
- **HealthMetrics** - Patient health data tracking
- **MedicalRecords** - Medical history and documents
- **Alerts** - System notifications and alerts
- **Reports** - Analytics and reporting data

## 🛡️ Security Features

- **JWT Authentication**
- **Role-based Access Control**
- **Input Validation**
- **Rate Limiting**
- **CORS Protection**
- **Helmet Security Headers**
- **Password Hashing (bcrypt)**
- **Secure File Uploads**

## 📱 Mobile App Features

### For Expecting Mothers:
- **Profile Management**
- **Pregnancy Tracking**
- **Appointment Booking**
- **Health Metrics Logging**
- **Medication Reminders**
- **Educational Resources**
- **Emergency Contacts**

### For Healthcare Providers:
- **Patient Dashboard**
- **Appointment Management**
- **Medical Records Access**
- **Prescription Management**
- **Communication Tools**

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh

### Patients
- `GET /api/patients` - Get all patients
- `POST /api/patients` - Create patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Appointments
- `GET /api/appointments` - Get appointments
- `POST /api/appointments` - Book appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

See full API documentation in `/docs/API.md`

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:db  # Test database connection
```

### Frontend Tests
```bash
cd admin-dashboard
npm test
```

## 📈 Monitoring & Analytics

- **Health Check Endpoints**
- **Performance Monitoring**
- **Error Tracking**
- **User Analytics**
- **System Metrics**

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- **Issues**: [GitHub Issues](https://github.com/Talent5/Mama_Care/issues)
- **Documentation**: `/docs` folder
- **Email**: support@mamacare.com

## 🚀 Roadmap

- [ ] **Multi-language Support**
- [ ] **AI-powered Health Insights**
- [ ] **Wearable Device Integration**
- [ ] **Telemedicine Video Calls**
- [ ] **Advanced Analytics Dashboard**
- [ ] **Mobile Payment Integration**
- [ ] **Community Features**

## 📊 Technology Stack

### Frontend
- **React Native** (Mobile)
- **React** + **Vite** (Admin Dashboard)
- **TypeScript**
- **Tailwind CSS**

### Backend
- **Node.js** + **Express**
- **MongoDB Atlas**
- **Mongoose ODM**
- **JWT Authentication**

### DevOps
- **Docker**
- **Render** (Backend hosting)
- **Netlify/Vercel** (Frontend hosting)
- **GitHub Actions** (CI/CD)

---

**Made with ❤️ for expecting mothers and healthcare providers**

*MamaCare - Caring for mothers, one step at a time* 🤱
