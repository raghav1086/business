# Vyapar App - Technical Architecture

## 1. Overview

This document outlines the production-ready architecture for the Vyapar App clone using NX Monorepo with React Native frontend and NestJS microservices backend.

## 2. Monorepo Structure (NX Workspace)

```
vyapar-app/
├── apps/
│   ├── mobile/                    # React Native Mobile App
│   ├── web/                       # React Web App (Optional)
│   ├── api-gateway/               # NestJS API Gateway
│   ├── auth-service/              # Authentication Microservice
│   ├── business-service/          # Business & Party Management
│   ├── inventory-service/         # Inventory & Items
│   ├── invoice-service/           # Billing & Invoicing
│   ├── accounting-service/        # Ledger & Transactions
│   ├── gst-service/               # GST Reports & Compliance
│   ├── notification-service/      # SMS, WhatsApp, Push
│   └── sync-service/              # Offline Sync Handler
│
├── libs/
│   ├── shared/
│   │   ├── dto/                   # Shared DTOs
│   │   ├── interfaces/            # TypeScript Interfaces
│   │   ├── constants/             # App Constants
│   │   └── utils/                 # Utility Functions
│   ├── ui/                        # Shared UI Components (React Native)
│   ├── api-client/                # API Client Library
│   ├── offline-db/                # Local Database (WatermelonDB)
│   └── state/                     # State Management (Zustand/Redux)
│
├── tools/                         # Custom NX Generators & Scripts
├── docker/                        # Docker Compose & Dockerfiles
├── k8s/                           # Kubernetes Manifests
├── .github/                       # GitHub Actions CI/CD
├── nx.json
├── package.json
└── tsconfig.base.json
```

## 3. Microservices Architecture

### 3.1 Service Communication
- **Sync Communication**: REST APIs via API Gateway
- **Async Communication**: Message Queue (RabbitMQ/Redis Streams)
- **Service Discovery**: Kubernetes DNS / Consul

### 3.2 Microservices Breakdown

| Service | Responsibility | Database | Port |
|---------|---------------|----------|------|
| API Gateway | Request routing, Auth validation, Rate limiting | Redis (Cache) | 3000 |
| Auth Service | Login, OTP, JWT, Sessions | PostgreSQL | 3001 |
| Business Service | Business profiles, Parties, Staff | PostgreSQL | 3002 |
| Inventory Service | Items, Stock, Categories | PostgreSQL | 3003 |
| Invoice Service | Invoices, Quotations, Challans | PostgreSQL | 3004 |
| Accounting Service | Ledgers, Transactions, Reports | PostgreSQL | 3005 |
| GST Service | GSTR-1, GSTR-3B, E-Invoice | PostgreSQL | 3006 |
| Notification Service | SMS, WhatsApp, Push, Email | MongoDB | 3007 |
| Sync Service | Offline data sync, Conflict resolution | Redis | 3008 |

## 4. Technology Stack

### 4.1 Frontend (Mobile)
- **Framework**: React Native 0.73+
- **State Management**: Zustand + React Query
- **Local Database**: WatermelonDB (SQLite based)
- **Navigation**: React Navigation 6
- **UI Library**: React Native Paper / NativeBase
- **Forms**: React Hook Form + Zod
- **PDF Generation**: react-native-pdf-lib

### 4.2 Backend (Microservices)
- **Framework**: NestJS 10+
- **ORM**: Prisma / TypeORM
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Message Queue**: RabbitMQ / Bull (Redis)
- **API Documentation**: Swagger/OpenAPI

### 4.3 Infrastructure
- **Container**: Docker
- **Orchestration**: Kubernetes (EKS/GKE)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack / Loki
- **Cloud**: AWS / GCP

## 5. Security Architecture

### 5.1 Authentication Flow
1. User enters phone number
2. OTP sent via SMS gateway
3. OTP verified → JWT (Access + Refresh tokens) issued
4. Access token stored securely (Keychain/Keystore)
5. Refresh token rotation on each use

### 5.2 Data Security
- **In Transit**: TLS 1.3
- **At Rest**: AES-256 encryption for sensitive fields
- **Local Storage**: SQLCipher for local database
- **API Security**: Rate limiting, Input validation, SQL injection prevention

## 6. Offline-First Architecture

### 6.1 Sync Strategy
1. All write operations go to local DB first
2. Sync queue maintains pending changes
3. Background sync when online
4. Conflict resolution: Last-Write-Wins with version vectors

### 6.2 Data Flow
```
[User Action] → [Local DB] → [Sync Queue] → [Sync Service] → [Microservice] → [PostgreSQL]
                    ↑                              ↓
                    └──────── [Conflict Resolution] ←──────┘
```

## 7. Deployment Strategy

### 7.1 Environments
- **Development**: Local Docker Compose
- **Staging**: Kubernetes (Single Node)
- **Production**: Kubernetes (Multi-Node, Auto-scaling)

### 7.2 Release Strategy
- **Backend**: Blue-Green Deployment
- **Mobile**: Staged Rollout (1% → 10% → 50% → 100%)
- **Feature Flags**: LaunchDarkly / Unleash
