#!/bin/bash

###############################################################################
# Start All Backend Services
# Starts all 6 NestJS microservices in the background
###############################################################################

set -e

cd "$(dirname "$0")/.."

echo "🚀 Starting all backend services..."

# Create logs directory
mkdir -p logs

# Start services
echo "Starting auth-service on port 3002..."
npx nx serve auth-service --port=3002 > logs/auth.log 2>&1 &
AUTH_PID=$!

echo "Starting business-service on port 3003..."
npx nx serve business-service --port=3003 > logs/business.log 2>&1 &
BUSINESS_PID=$!

echo "Starting party-service on port 3004..."
npx nx serve party-service --port=3004 > logs/party.log 2>&1 &
PARTY_PID=$!

echo "Starting inventory-service on port 3005..."
npx nx serve inventory-service --port=3005 > logs/inventory.log 2>&1 &
INVENTORY_PID=$!

echo "Starting invoice-service on port 3006..."
npx nx serve invoice-service --port=3006 > logs/invoice.log 2>&1 &
INVOICE_PID=$!

echo "Starting payment-service on port 3007..."
npx nx serve payment-service --port=3007 > logs/payment.log 2>&1 &
PAYMENT_PID=$!

# Save PIDs
echo $AUTH_PID > logs/auth.pid
echo $BUSINESS_PID > logs/business.pid
echo $PARTY_PID > logs/party.pid
echo $INVENTORY_PID > logs/inventory.pid
echo $INVOICE_PID > logs/invoice.pid
echo $PAYMENT_PID > logs/payment.pid

echo ""
echo "✅ All services started!"
echo ""
echo "PIDs:"
echo "  Auth:      $AUTH_PID"
echo "  Business:  $BUSINESS_PID"
echo "  Party:     $PARTY_PID"
echo "  Inventory: $INVENTORY_PID"
echo "  Invoice:   $INVOICE_PID"
echo "  Payment:   $PAYMENT_PID"
echo ""
echo "Logs:"
echo "  tail -f logs/auth.log"
echo "  tail -f logs/business.log"
echo "  tail -f logs/party.log"
echo "  tail -f logs/inventory.log"
echo "  tail -f logs/invoice.log"
echo "  tail -f logs/payment.log"
echo ""
echo "⏳ Waiting 30 seconds for services to start..."
sleep 30

echo ""
echo "✅ Services should be ready!"
echo ""
echo "Check health:"
echo "  curl http://localhost:3002/health"
echo "  curl http://localhost:3003/health"
echo "  curl http://localhost:3004/health"
echo "  curl http://localhost:3005/health"
echo "  curl http://localhost:3006/health"
echo "  curl http://localhost:3007/health"
echo ""
