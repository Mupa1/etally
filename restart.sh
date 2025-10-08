#!/bin/bash

# eTally2 - Restart Script for Local Development
# Usage: ./restart.sh [backend|frontend|all]

echo "🔄 eTally2 Restart Script"
echo "=========================="

restart_backend() {
    echo ""
    echo "🛑 Stopping backend..."
    pkill -f "tsx watch src/server.ts" || echo "  ℹ️  Backend not running"
    sleep 1
    
    echo "🚀 Starting backend..."
    cd backend && npm run dev > /dev/null 2>&1 &
    echo "  ✅ Backend started (PID: $!)"
    echo "  📍 Running on http://localhost:5000"
}

restart_frontend() {
    echo ""
    echo "🛑 Stopping frontend..."
    pkill -f "vite" || echo "  ℹ️  Frontend not running"
    sleep 1
    
    echo "🚀 Starting frontend..."
    cd frontend && npm run dev > /dev/null 2>&1 &
    echo "  ✅ Frontend started (PID: $!)"
    echo "  📍 Running on http://localhost:5173"
}

case "$1" in
    backend)
        restart_backend
        ;;
    frontend)
        restart_frontend
        ;;
    all|"")
        restart_backend
        restart_frontend
        ;;
    *)
        echo "❌ Invalid option: $1"
        echo "Usage: ./restart.sh [backend|frontend|all]"
        exit 1
        ;;
esac

echo ""
echo "✅ Done!"
echo ""
echo "Check status with: ps aux | grep -E '(tsx watch|vite)' | grep -v grep"
