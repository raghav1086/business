# Health Check Endpoints for All Services

## Auth Service (Port 3002)
GET /health
Response: { "status": "ok", "service": "auth-service" }

## Business Service (Port 3003)
GET /health
Response: { "status": "ok", "service": "business-service" }

## Party Service (Port 3004)
GET /health
Response: { "status": "ok", "service": "party-service" }

## Inventory Service (Port 3005)
GET /health
Response: { "status": "ok", "service": "inventory-service" }

## Invoice Service (Port 3006)
GET /health
Response: { "status": "ok", "service": "invoice-service" }

## Payment Service (Port 3007)
GET /health
Response: { "status": "ok", "service": "payment-service" }
