@echo off
echo Deploying CORS fix to production backend...
echo.

echo Step 1: Committing changes to Git...
git add .
git commit -m "Fix CORS configuration for Vercel frontend deployment"

echo.
echo Step 2: Pushing to main branch...
git push origin main

echo.
echo Step 3: Render will automatically redeploy when it detects the changes.
echo Please check your Render dashboard for deployment status.
echo.
echo Alternative: Update environment variables directly in Render:
echo 1. Go to your Render dashboard
echo 2. Select your backend service
echo 3. Go to Environment tab
echo 4. Update CORS_ORIGINS to include: https://mama-care-219h0cq8f-talent5s-projects.vercel.app
echo.
pause
