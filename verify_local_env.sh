#!/bin/bash

# Kill any existing processes on ports
echo "Cleaning up ports..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null
lsof -ti:5432 | xargs kill -9 2>/dev/null

# Start Tunnel
echo "Starting SSH Tunnel..."
./start_tunnel.sh > tunnel.log 2>&1 &
TUNNEL_PID=$!
sleep 5

if ! nc -z localhost 5432; then
    echo "❌ SSH Tunnel failed to start on port 5432"
    exit 1
else
    echo "✅ SSH Tunnel active"
fi

# Start Backend
echo "Starting Backend (Port 3001)..."
cd backend/salonbw-backend
npm install
npm run build
nohup npm run start:dev > ../../backend_local.log 2>&1 &
BACKEND_PID=$!
cd ../..

echo "Waiting for Backend (15s)..."
sleep 15

if ! nc -z localhost 3001; then
    echo "❌ Backend failed to start on port 3001. Check backend_local.log"
    tail -n 20 backend_local.log
    kill $TUNNEL_PID
    exit 1
else
    echo "✅ Backend active on port 3001"
fi

# Start Frontend Dev (Landing)
echo "Starting Frontend: DEV (Port 3000, Structure: apps/landing)..."
cd apps/landing
npm install
npm run build
# Using 'npm start' with custom port
PORT=3000 nohup npm start > ../../frontend_dev.log 2>&1 &
DEV_PID=$!
cd ../..

# Start Frontend Panel (Dashboard)
echo "Starting Frontend: PANEL (Port 3002, Structure: apps/panel)..."
cd apps/panel
npm install
npm run build
PORT=3002 API_URL=http://localhost:3001 nohup npm start > ../../frontend_panel.log 2>&1 &
PANEL_PID=$!
cd ../..


echo "Waiting for Frontends (10s)..."
sleep 10

# Verification
echo "--- VERIFICATION REPORT ---"

# 1. Backend
if nc -z localhost 3001; then echo "✅ Backend: UP"; else echo "❌ Backend: DOWN"; fi

# 2. Dev Site
if nc -z localhost 3000; then 
    echo "✅ Dev Site: UP"
    echo "   Testing Landing Page Access..."
    curl -I http://localhost:3000/
else 
    echo "❌ Dev Site: DOWN (Check frontend_dev.log)"
fi

# 3. Panel Site
if nc -z localhost 3002; then 
    echo "✅ Panel Site: UP"
    echo "   Testing Dashboard Redirect..."
    curl -v http://localhost:3002/ 2>&1 | grep "Location"
else 
    echo "❌ Panel Site: DOWN (Check frontend_panel.log)"
fi

echo "--- END REPORT ---"
echo "--- END REPORT ---"
echo "Cleaning up..."
kill $BACKEND_PID $DEV_PID $PANEL_PID $TUNNEL_PID 2>/dev/null
echo "✅ Test Complete."
exit 0
