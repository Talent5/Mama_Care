# MamaCare Backend API

Node.js/Express backend API for the MamaCare healthcare platform with MongoDB database.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/mamacare
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   ```

3. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### API Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `POST /auth/logout` - User logout
- `PUT /auth/change-password` - Change password

#### Users
- `GET /users` - Get all users (admin only)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `GET /users/stats/overview` - User statistics

#### Patients
- `GET /patients` - Get all patients
- `POST /patients` - Create patient profile
- `GET /patients/:id` - Get patient by ID
- `PUT /patients/:id` - Update patient
- `DELETE /patients/:id` - Delete patient
- `GET /patients/stats/overview` - Patient statistics

#### Appointments
- `GET /appointments` - Get appointments
- `POST /appointments` - Create appointment
- `GET /appointments/:id` - Get appointment by ID
- `PUT /appointments/:id` - Update appointment
- `DELETE /appointments/:id` - Cancel appointment

#### Analytics
- `GET /analytics/overview` - Overview analytics
- `GET /analytics/patients` - Patient analytics
- `GET /analytics/appointments` - Appointment analytics

## 🗃️ Database Schema

### User Model
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  role: ['admin', 'healthcare_provider', 'patient'],
  phone: String,
  avatar: String,
  isActive: Boolean,
  lastLogin: Date,
  emailVerified: Boolean
}
```

### Patient Model
```javascript
{
  user: ObjectId (ref: User),
  dateOfBirth: Date,
  gender: ['female', 'male', 'other'],
  bloodType: String,
  height: Number, // cm
  weight: Number, // kg
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  medicalHistory: Array,
  allergies: Array,
  medications: Array,
  pregnancyHistory: Array,
  currentPregnancy: {
    isPregnant: Boolean,
    lastMenstrualPeriod: Date,
    estimatedDueDate: Date,
    pregnancyWeek: Number,
    riskLevel: ['low', 'medium', 'high']
  }
}
```

### Appointment Model
```javascript
{
  patient: ObjectId (ref: Patient),
  healthcareProvider: ObjectId (ref: User),
  appointmentDate: Date,
  appointmentTime: String,
  duration: Number, // minutes
  type: String,
  status: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'],
  priority: ['low', 'medium', 'high', 'urgent'],
  reason: String,
  notes: String,
  symptoms: Array,
  vitals: Object,
  diagnosis: Object,
  treatment: Object
}
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcryptjs with salt rounds
- **Input Validation**: express-validator
- **Rate Limiting**: Prevents brute force attacks
- **CORS**: Configured for cross-origin requests
- **Helmet**: Security headers
- **MongoDB Injection Protection**: Mongoose schema validation

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📦 Dependencies

### Production
- **express**: Web framework
- **mongoose**: MongoDB ODM
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT implementation
- **cors**: Cross-origin resource sharing
- **helmet**: Security headers
- **express-validator**: Input validation
- **express-rate-limit**: Rate limiting
- **dotenv**: Environment variables
- **multer**: File upload handling

### Development
- **nodemon**: Development server
- **jest**: Testing framework
- **supertest**: HTTP testing

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/mamacare
JWT_SECRET=your_production_secret_key
JWT_EXPIRE=7d
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Health Check
```
GET /api/health
```

Response:
```json
{
  "status": "OK",
  "message": "MamaCare API is running",
  "timestamp": "2025-07-09T12:00:00.000Z"
}
```

## 📊 Monitoring

The API includes built-in logging and error handling:

- Request/Response logging
- Error tracking with stack traces
- Performance monitoring
- Database connection monitoring

## 🔧 Development

### Project Structure
```
backend/
├── server.js              # Main server file
├── models/                # Mongoose models
│   ├── User.js
│   ├── Patient.js
│   └── Appointment.js
├── routes/                # API routes
│   ├── auth.js
│   ├── users.js
│   ├── patients.js
│   ├── appointments.js
│   └── analytics.js
├── middleware/            # Custom middleware
│   └── auth.js
└── package.json
```

### Adding New Routes

1. Create route file in `/routes`
2. Add middleware if needed
3. Import and use in `server.js`
4. Add tests for new endpoints

### Database Migrations

For schema changes:
1. Update Mongoose models
2. Create migration script if needed
3. Test with sample data
4. Document changes

## 📞 Support

For backend-specific issues:
- Check server logs: `npm run logs`
- Verify database connection
- Validate environment variables
- Review API documentation

---

**MamaCare Backend** - Robust and secure API for maternal healthcare.
