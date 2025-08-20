#!/bin/bash

echo "Building MamaCare for Production..."
echo

# Set production environment
export NODE_ENV=production

echo "[1/4] Building Admin Dashboard..."
cd admin-dashboard
npm ci --production=false
npm run build
if [ $? -ne 0 ]; then
    echo "Error: Admin Dashboard build failed"
    exit 1
fi
cd ..

echo "[2/4] Installing Backend Dependencies..."
cd backend
npm ci --production
if [ $? -ne 0 ]; then
    echo "Error: Backend dependencies installation failed"
    exit 1
fi
cd ..

echo "[3/4] Building Mobile App for Production..."
cd MamaCare
npm ci --production=false
echo "Mobile app prepared for production build. Run 'eas build --profile production' to build for stores."
cd ..

echo "[4/4] Creating Production Package..."
mkdir -p production-build
cp -r admin-dashboard/dist production-build/admin-dashboard
cp -r backend production-build/backend
rm -rf production-build/backend/node_modules
rm -rf production-build/backend/uploads
rm -rf production-build/backend/logs
cp -r MamaCare production-build/mobile-app
rm -rf production-build/mobile-app/node_modules
rm -rf production-build/mobile-app/.expo

echo
echo "Production build completed successfully!"
echo
echo "Next steps:"
echo "1. Configure environment variables in production-build/backend/.env"
echo "2. Deploy backend to your server"
echo "3. Deploy admin-dashboard to your web hosting"
echo "4. Build mobile app with: cd MamaCare && eas build --profile production"
echo
