# MongoDB Atlas Setup Guide for MamaCare

## Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new cluster (choose the free M0 tier)

## Step 2: Configure Database Access
1. In Atlas dashboard, go to **Database Access**
2. Click **Add New Database User**
3. Create a user with username/password authentication
4. Grant **Read and write to any database** permissions
5. Save the username and password securely

## Step 3: Configure Network Access
1. Go to **Network Access**
2. Click **Add IP Address**
3. For development: Add **0.0.0.0/0** (allow access from anywhere)
4. For production: Add your specific server IP addresses

## Step 4: Get Connection String
1. Go to **Clusters** → **Connect**
2. Choose **Connect your application**
3. Select **Node.js** driver
4. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/mamacare?retryWrites=true&w=majority
   ```

## Step 5: Update Environment Variables
Create a `.env` file in the backend folder with:

```bash
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/mamacare?retryWrites=true&w=majority

# Other required variables
NODE_ENV=development
PORT=5000
JWT_SECRET=your_jwt_secret_minimum_32_characters_long
JWT_EXPIRE=7d

# Admin Configuration
ADMIN_EMAIL=admin@mamacare.com
ADMIN_PASSWORD=secure_admin_password

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/

# CORS (for development)
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Step 6: Test Connection
Run the backend server and check if it connects to MongoDB Atlas:

```bash
cd backend
npm install
npm run dev
```

Look for the log message: `MongoDB Connected: cluster0-xxxxx.mongodb.net`

## Step 7: Migrate Data (if needed)
If you have existing data in local MongoDB, you can migrate it using:

1. **Export from local MongoDB:**
   ```bash
   mongodump --db mamacare --out ./backup
   ```

2. **Import to MongoDB Atlas:**
   ```bash
   mongorestore --uri "mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/mamacare" ./backup/mamacare
   ```

## Benefits of MongoDB Atlas
- ✅ **Automatic backups**
- ✅ **Built-in security**
- ✅ **Global clusters**
- ✅ **Performance monitoring**
- ✅ **Automatic scaling**
- ✅ **99.995% uptime SLA**
- ✅ **Free tier (512MB storage)**

## Security Best Practices
1. **Never commit credentials** to version control
2. **Use environment variables** for all secrets
3. **Rotate passwords** regularly
4. **Use specific IP whitelisting** in production
5. **Enable authentication** on all databases
6. **Use SSL/TLS** connections (Atlas enforces this)

## Monitoring
- Atlas provides built-in monitoring dashboards
- Set up alerts for performance and security events
- Monitor connection counts and query performance
