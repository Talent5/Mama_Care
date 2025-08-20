# MamaCare Admin Dashboard

React-based web dashboard for healthcare administrators and providers to manage the MamaCare platform.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Modern web browser

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open in browser**
   ```
   http://localhost:5173
   ```

## 🌟 Features

### Dashboard Overview
- **Real-time Analytics**: Patient metrics, appointment statistics
- **Quick Actions**: Fast access to common administrative tasks
- **System Health**: Monitor platform performance and usage
- **Recent Activity**: Latest patient registrations and appointments

### User Management
- **Healthcare Providers**: Add, edit, and manage provider accounts
- **Patient Oversight**: View and manage patient profiles
- **Role Management**: Assign and modify user roles and permissions
- **Account Status**: Activate/deactivate user accounts

### Patient Management
- **Patient Profiles**: Comprehensive patient information management
- **Medical Records**: Access to complete medical histories
- **Pregnancy Tracking**: Monitor expectant mothers' progress
- **Risk Assessment**: Identify and flag high-risk patients

### Appointment System
- **Schedule Management**: View and manage all appointments
- **Provider Calendars**: Individual provider scheduling
- **Appointment Analytics**: Track booking patterns and no-shows
- **Conflict Resolution**: Handle scheduling conflicts

### Analytics & Reporting
- **Patient Demographics**: Age, location, and health statistics
- **Appointment Trends**: Booking patterns and provider utilization
- **Health Outcomes**: Track patient health improvements
- **Custom Reports**: Generate specific analytical reports

### Settings & Configuration
- **System Settings**: Platform-wide configuration
- **User Preferences**: Individual admin preferences
- **Notification Settings**: Alert and reminder configurations
- **Security Settings**: Authentication and access controls

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS for responsive design
- **UI Components**: Custom components with Lucide React icons
- **State Management**: React Context API and hooks
- **Routing**: React Router for navigation
- **HTTP Client**: Axios for API communication
- **Charts**: Recharts for data visualization

## 📁 Project Structure

```
admin-dashboard/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── alerts/
│   │   ├── analytics/
│   │   ├── appointments/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── layout/
│   │   ├── patients/
│   │   └── settings/
│   ├── contexts/          # React Context providers
│   │   └── AuthContext.tsx
│   ├── types/             # TypeScript type definitions
│   │   ├── auth.ts
│   │   └── dashboard.ts
│   ├── App.tsx           # Main application component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles
├── public/               # Static assets
├── index.html           # HTML template
├── package.json
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## 🎨 UI Components

### Layout Components
- **Header**: Navigation and user controls
- **Sidebar**: Main navigation menu
- **Dashboard**: Overview widgets and metrics
- **MetricCard**: Reusable metric display component
- **ChartCard**: Wrapper for chart components

### Feature Components
- **LoginForm**: Authentication interface
- **PatientManagement**: Patient CRUD operations
- **AppointmentScheduler**: Appointment management
- **AnalyticsReports**: Data visualization
- **SettingsPanel**: Configuration interface
- **AlertCenter**: Notifications and alerts

## ⚙️ Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_TITLE=MamaCare Admin Dashboard
VITE_APP_VERSION=1.0.0
```

### API Configuration
Update API base URL in service files to match your backend:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
```

### Tailwind Configuration
Custom theme configuration in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#E91E63',
        secondary: '#FF4081',
        // ... custom colors
      }
    }
  }
}
```

## 🔐 Authentication

### Login Flow
1. **Admin Login**: Email and password authentication
2. **JWT Token**: Secure token-based session management
3. **Role Verification**: Admin/healthcare provider role checking
4. **Auto-logout**: Automatic logout on token expiration

### Protected Routes
- All dashboard routes require authentication
- Role-based access control for sensitive features
- Automatic redirect to login for unauthorized access

## 📊 Dashboard Analytics

### Key Metrics
- **Total Patients**: Active patient count
- **Active Pregnancies**: Current pregnancy tracking
- **Today's Appointments**: Daily appointment metrics
- **System Usage**: Platform utilization statistics

### Chart Types
- **Line Charts**: Trends over time
- **Bar Charts**: Comparative data
- **Pie Charts**: Distribution analysis
- **Area Charts**: Cumulative metrics

## 🎯 User Roles & Permissions

### Admin Users
- Full system access
- User management capabilities
- System configuration access
- Analytics and reporting

### Healthcare Providers
- Patient management within their scope
- Appointment management
- Medical record access
- Limited analytics access

## 📱 Responsive Design

### Breakpoints
- **Mobile**: 640px and below
- **Tablet**: 641px - 1024px
- **Desktop**: 1025px and above

### Mobile Optimizations
- Collapsible sidebar navigation
- Touch-friendly interface elements
- Optimized data tables
- Responsive chart displays

## 🧪 Testing

### Component Testing
```bash
# Run component tests (when configured)
npm run test
```

### Manual Testing Checklist
- [ ] Authentication flow
- [ ] Dashboard data loading
- [ ] Patient management operations
- [ ] Appointment scheduling
- [ ] Analytics chart rendering
- [ ] Responsive design
- [ ] Error handling

## 📦 Building for Production

### Development Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deployment
The build creates a `dist` folder that can be deployed to:
- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **CDN**: CloudFront, CloudFlare
- **Web Servers**: Apache, Nginx

## 🔧 Development

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting (configurable)
- **Husky**: Git hooks for quality assurance

### Hot Reload
Vite provides instant hot module replacement for fast development.

### Browser DevTools
- React Developer Tools recommended
- Network tab for API debugging
- Console for error tracking

## 🚀 Performance Optimization

### Bundle Optimization
- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Remove unused code
- **Asset Optimization**: Image and CSS optimization
- **Lazy Loading**: Load components on demand

### Caching Strategy
- **Browser Caching**: Static asset caching
- **API Caching**: Response caching where appropriate
- **State Management**: Efficient state updates

## 📞 Support

### Common Issues
1. **Build failures**: Check Node.js version compatibility
2. **API connection**: Verify backend URL configuration
3. **Styling issues**: Clear browser cache and rebuild

### Development Tools
- **Vite DevTools**: Built-in development server
- **React DevTools**: Component debugging
- **Browser DevTools**: Network and console debugging

## 🔮 Future Enhancements

- [ ] Real-time notifications with WebSockets
- [ ] Advanced filtering and search
- [ ] Export functionality for reports
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Advanced user permissions
- [ ] Integration with external health systems
- [ ] Mobile app for healthcare providers

---

**MamaCare Admin Dashboard** - Powerful healthcare administration made simple.
