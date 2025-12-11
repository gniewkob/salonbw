#!/usr/bin/env bash
set -e

# Configuration
MYDEVIL_SSH_HOST=${MYDEVIL_SSH_HOST:-s0.mydevil.net}
MYDEVIL_SSH_USER=${MYDEVIL_SSH_USER:-vetternkraft}
MYDEVIL_PG_HOST=${MYDEVIL_PG_HOST:-pgsql0.mydevil.net}
PROJECT_ROOT=$(pwd)
DB_TUNNEL_PORT=8543
BACKEND_PORT=3001
FRONTEND_PORT=3000

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[TEST-FLOW]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

cleanup() {
    log "Stopping background services spawned by this script..."
    # kill $(jobs -p) 2>/dev/null || true
    # We don't want to kill services if they were already running, but for this script's scope
    # we might want to leave them running if the user wants to debug.
    # However, to be clean, if WE started them, we should stop them. 
    # For now, simplistic cleanup:
    if [ ! -z "$BE_PID" ]; then kill $BE_PID 2>/dev/null || true; fi
    if [ ! -z "$FE_PID" ]; then kill $FE_PID 2>/dev/null || true; fi
    if [ ! -z "$TUNNEL_PID" ]; then kill $TUNNEL_PID 2>/dev/null || true; fi
}
trap cleanup EXIT

# 1. SSH Tunnel Check
log "Checking DB Tunnel on port $DB_TUNNEL_PORT..."
if lsof -i:$DB_TUNNEL_PORT -t >/dev/null; then
    log "Tunnel already active on port $DB_TUNNEL_PORT."
else
    log "Tunnel NOT found. Starting..."
    MYDEVIL_SSH_HOST=$MYDEVIL_SSH_HOST MYDEVIL_SSH_USER=$MYDEVIL_SSH_USER MYDEVIL_PG_HOST=$MYDEVIL_PG_HOST npm run tunnel:start > /dev/null 2>&1 &
    TUNNEL_PID=$!
    sleep 3
    if ! lsof -i:$DB_TUNNEL_PORT -t >/dev/null; then
        error "Failed to start DB tunnel. Check SSH credentials or network."
    fi
    log "Tunnel started successfully."
fi

# 2. Database Reachability Check (Simple TCP check to the tunnel)
log "Verifying connectivity to Database via Tunnel..."
if ! nc -z localhost $DB_TUNNEL_PORT; then
    error "Cannot reach Database via localhost:$DB_TUNNEL_PORT. Tunnel might be broken."
fi
log "Database tunnel endpoint is reachable."

# 3. Backend Check
log "Checking Backend service on port $BACKEND_PORT..."
if lsof -i:$BACKEND_PORT -t >/dev/null; then
    log "Backend already listening on port $BACKEND_PORT."
    # Optional: Check health
    if curl -s http://localhost:$BACKEND_PORT/api/health >/dev/null; then
        log "Backend is healthy."
    else
        warn "Backend port is open but /api/health failed. It might be starting or stuck."
        # Decision: Don't kill, just wait a bit more? Or fail? 
        # For this script, let's assume if port is open it's 'working' or we wait.
    fi
else
    log "Backend NOT running. Starting..."
    cd $PROJECT_ROOT/backend/salonbw-backend
    npm run start:dev > ../../backend.log 2>&1 &
    BE_PID=$!
    log "Waiting for Backend to start..."
    # Wait loop
    for i in {1..60}; do
        if curl -s http://localhost:$BACKEND_PORT/api/health >/dev/null; then
            log "Backend is UP!"
            break
        fi
        if [ $i -eq 60 ]; then
            error "Backend failed to start within 60 seconds. Check backend.log."
        fi
        sleep 1
    done
fi

# 4. Frontend Check
log "Checking Frontend service on port $FRONTEND_PORT..."
if lsof -i:$FRONTEND_PORT -t >/dev/null; then
    log "Frontend already listening on port $FRONTEND_PORT."
else
    log "Frontend NOT running. Starting..."
    cd $PROJECT_ROOT/frontend
    export NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT/api
    npm run dev > ../frontend.log 2>&1 &
    FE_PID=$!
    log "Waiting for Frontend to start..."
    for i in {1..60}; do
        if curl -s http://localhost:$FRONTEND_PORT >/dev/null; then
            log "Frontend is UP!"
            break
        fi
        if [ $i -eq 60 ]; then
            error "Frontend failed to start within 60 seconds. Check frontend.log."
        fi
        sleep 1
    done
fi

# 5. Run Cypress
log "Running Cypress E2E Tests..."
cd $PROJECT_ROOT/frontend
npx cypress run --spec "cypress/e2e/register.cy.ts"

log "All tests passed!"
exit 0
