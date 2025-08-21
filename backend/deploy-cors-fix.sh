#!/bin/bash

echo "🚀 Deploying CORS fixes to Render..."

# Check if we're in the backend directory
if [ ! -f "server.js" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

echo "📋 Changes being deployed:"
echo "   ✅ Fixed CORS origin handling for Render domains"
echo "   ✅ Added proper rate limiting for auth endpoints"  
echo "   ✅ Enhanced CORS headers middleware"
echo "   ✅ Updated render.yaml configuration"

echo ""
echo "📦 Committing changes..."
git add .
git commit -m "fix: CORS configuration for Render deployment

- Fixed CORS origin function to properly handle Render domains
- Added specific rate limiting for auth endpoints (429 error fix)
- Enhanced CORS headers middleware with better origin handling
- Updated render.yaml with proper CORS_ORIGINS environment variable
- Added debugging logs for CORS requests"

echo ""
echo "🔄 Pushing to repository..."
git push origin master

echo ""
echo "✅ Changes pushed! Render will automatically deploy the updates."
echo ""
echo "📋 Next steps:"
echo "   1. Wait 2-3 minutes for Render to redeploy"
echo "   2. Test the login endpoint: https://mama-care-g7y1.onrender.com/api/auth/login"
echo "   3. Check logs in Render dashboard for CORS debugging info"
echo ""
echo "🔍 Monitor deployment: https://dashboard.render.com/"
