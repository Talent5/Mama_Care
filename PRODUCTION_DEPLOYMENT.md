# Production Deployment Guide

## Prerequisites

### Server Requirements
- Node.js 18+ with npm
- MongoDB 6.0+ (MongoDB Atlas recommended)
- SSL certificate for HTTPS
- Domain name with DNS configuration

### Environment Setup
- Production server (VPS, AWS EC2, Google Cloud, etc.)
- CI/CD pipeline (GitHub Actions, GitLab CI, etc.)
- Monitoring tools (PM2, New Relic, etc.)

## 1. Backend Deployment

### Environment Configuration
1. Copy `.env.example` to `.env` in the backend directory
2. Configure the following variables:

```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mamacare
JWT_SECRET=your_32_character_secret_key_here
CORS_ORIGIN=https://yourdomain.com,https://admin.yourdomain.com
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your_app_specific_password
```

### Database Setup
1. Create MongoDB Atlas cluster or set up MongoDB server
2. Create database user with appropriate permissions
3. Whitelist server IP addresses
4. Run initial admin setup:
```bash
npm run create-superadmin
```

### Server Deployment
1. Install dependencies:
```bash
npm ci --production
```

2. Install PM2 for process management:
```bash
npm install -g pm2
```

3. Create PM2 ecosystem file (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'mamacare-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

4. Start application:
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 2. Admin Dashboard Deployment

### Build and Deploy
1. Update API base URL in configuration
2. Build the application:
```bash
npm run build
```

3. Deploy the `dist` folder to your web server (Netlify, Vercel, AWS S3, etc.)

### Web Server Configuration
For Apache (`.htaccess`):
```apache
RewriteEngine On
RewriteRule ^(?!.*\.).*$ /index.html [L]
```

For Nginx:
```nginx
server {
    listen 443 ssl;
    server_name admin.yourdomain.com;
    
    root /var/www/admin-dashboard;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 3. Mobile App Deployment

### App Store Deployment
1. Configure EAS Build:
```bash
eas build configure
```

2. Build for production:
```bash
eas build --profile production --platform all
```

3. Submit to app stores:
```bash
eas submit --platform ios
eas submit --platform android
```

### Over-the-Air Updates
```bash
eas update --branch production --message "Production update"
```

## 4. Security Checklist

### Backend Security
- [ ] JWT secret is strong and secure
- [ ] CORS origins are properly configured
- [ ] Rate limiting is enabled
- [ ] Helmet security headers are configured
- [ ] Database connection uses SSL
- [ ] File upload limits are set
- [ ] Input validation is in place
- [ ] Error messages don't expose sensitive information

### Infrastructure Security
- [ ] SSL certificates are valid and auto-renewing
- [ ] Server firewall is configured
- [ ] Database access is restricted
- [ ] Regular security updates are applied
- [ ] Monitoring and logging are configured
- [ ] Backup strategy is implemented

## 5. Monitoring and Maintenance

### Application Monitoring
- PM2 monitoring dashboard
- Application performance monitoring (APM)
- Error tracking (Sentry, Rollbar)
- Uptime monitoring

### Database Monitoring
- MongoDB Atlas monitoring
- Query performance monitoring
- Storage usage monitoring
- Backup verification

### Log Management
```bash
# PM2 logs
pm2 logs

# Application logs
tail -f logs/app.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 6. Backup and Recovery

### Database Backup
```bash
# MongoDB backup
mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/mamacare"

# Automated daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="/backups/mamacare_$DATE"
```

### Application Backup
- Code repository (Git)
- Uploaded files backup
- Configuration files backup

## 7. CI/CD Pipeline Example (GitHub Actions)

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install and Build
      run: |
        cd backend && npm ci --production
        cd ../admin-dashboard && npm ci && npm run build
    
    - name: Deploy to Server
      uses: appleboy/ssh-action@v0.1.4
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/mamacare
          git pull origin main
          cd backend && npm ci --production
          pm2 reload mamacare-backend
```

## 8. Performance Optimization

### Backend Optimization
- Database indexing
- Query optimization
- Caching strategies
- Image optimization
- CDN for static assets

### Frontend Optimization
- Code splitting
- Lazy loading
- Image optimization
- PWA features
- CDN deployment

## 9. Troubleshooting

### Common Issues
1. **CORS errors**: Check CORS_ORIGIN environment variable
2. **Database connection**: Verify MongoDB URI and network access
3. **File uploads**: Check upload directory permissions
4. **Memory issues**: Monitor PM2 memory usage
5. **SSL issues**: Verify certificate configuration

### Health Checks
```bash
# Backend health check
curl https://api.yourdomain.com/api/health

# Database connectivity
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('DB OK'))"
```

## Support and Maintenance

- Regular security updates
- Performance monitoring
- User feedback collection
- Feature updates and improvements
- Documentation updates
