#!/bin/bash

# Business Management System - Quick Start Script
# This script starts all microservices for development

echo "🚀 Starting Business Management System"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
echo "📦 Checking PostgreSQL..."
if docker ps | grep -q business-postgres; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL is not running. Starting...${NC}"
    docker start business-postgres
    sleep 3
    echo -e "${GREEN}✅ PostgreSQL started${NC}"
fi

echo ""
echo "🔧 Starting Microservices..."
echo "======================================"
echo ""

# Start services in background
echo "Starting Auth Service (Port 3002)..."
PORT=3002 npm run start:dev auth-service > logs/auth.log 2>&1 &
AUTH_PID=$!

echo "Starting Business Service (Port 3003)..."
PORT=3003 npm run start:dev business-service > logs/business.log 2>&1 &
BUSINESS_PID=$!

echo "Starting Party Service (Port 3004)..."
PORT=3004 npm run start:dev party-service > logs/party.log 2>&1 &
PARTY_PID=$!

echo "Starting Inventory Service (Port 3005)..."
PORT=3005 npm run start:dev inventory-service > logs/inventory.log 2>&1 &
INVENTORY_PID=$!

echo "Starting Invoice Service (Port 3006)..."
PORT=3006 npm run start:dev invoice-service > logs/invoice.log 2>&1 &
INVOICE_PID=$!

echo "Starting Payment Service (Port 3007)..."
PORT=3007 npm run start:dev payment-service > logs/payment.log 2>&1 &
PAYMENT_PID=$!

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo -e "${GREEN}✅ All Services Started!${NC}"
echo ""
echo "======================================"
echo "📚 Service URLs:"
echo "======================================"
echo "Auth Service:      http://localhost:3002"
echo "  └─ Swagger:      http://localhost:3002/api/docs"
echo ""
echo "Business Service:  http://localhost:3003"
echo "  └─ Swagger:      http://localhost:3003/api/docs"
echo ""
echo "Party Service:     http://localhost:3004"
echo "  └─ Swagger:      http://localhost:3004/api/docs"
echo ""
echo "Inventory Service: http://localhost:3005"
echo "  └─ Swagger:      http://localhost:3005/api/docs"
echo ""
echo "Invoice Service:   http://localhost:3006"
echo "  └─ Swagger:      http://localhost:3006/api/docs"
echo ""
echo "Payment Service:   http://localhost:3007"
echo "  └─ Swagger:      http://localhost:3007/api/docs"
echo ""
echo "======================================"
echo "📝 Logs are in ./logs/ directory"
echo "======================================"
echo ""
echo "Process IDs:"
echo "Auth: $AUTH_PID | Business: $BUSINESS_PID | Party: $PARTY_PID"
echo "Inventory: $INVENTORY_PID | Invoice: $INVOICE_PID | Payment: $PAYMENT_PID"
echo ""
echo "To stop all services, run: ./scripts/stop-services.sh"
echo "Or press Ctrl+C"
echo ""

# Keep script running and handle Ctrl+C
trap 'echo ""; echo "Stopping all services..."; kill $AUTH_PID $BUSINESS_PID $PARTY_PID $INVENTORY_PID $INVOICE_PID $PAYMENT_PID; exit' INT

# Wait for all background processes
wait
