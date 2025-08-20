@echo off
echo === MamaCare CORS Configuration Test ===
echo.

echo Testing backend connectivity from different origins...
echo.

echo 1. Testing health endpoint...
curl -s -o nul -w "Health endpoint: %%{http_code}\n" https://mama-care-g7y1.onrender.com/api/health

echo.
echo 2. Testing CORS with Vercel origin...
curl -s -o nul -w "Vercel CORS: %%{http_code}\n" -H "Origin: https://mama-care-219h0cq8f-talent5s-projects.vercel.app" -X OPTIONS https://mama-care-g7y1.onrender.com/api/auth/login

echo.
echo 3. Testing CORS with localhost origin...
curl -s -o nul -w "Localhost CORS: %%{http_code}\n" -H "Origin: http://localhost:3000" -X OPTIONS https://mama-care-g7y1.onrender.com/api/auth/login

echo.
echo 4. Testing mobile app endpoint...
curl -s -o nul -w "Mobile API: %%{http_code}\n" https://mama-care-g7y1.onrender.com/api/dashboard

echo.
echo Expected results:
echo - Health endpoint: 200
echo - Vercel CORS: 200
echo - Localhost CORS: 200
echo - Mobile API: 401 (unauthorized, but accessible)
echo.
echo If all tests show 200/401, CORS is working correctly!
echo.
pause
