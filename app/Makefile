# =============================================================================
# BUSINESS MANAGEMENT SYSTEM - MAKEFILE
# =============================================================================
# Single source of truth for all commands
# Usage: make <target>
# =============================================================================

.PHONY: help install dev start stop restart logs test test-unit test-integration test-e2e test-all build clean deploy health backup backup-s3 backup-local backup-upload

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# =============================================================================
# HELP
# =============================================================================
help: ## Show this help message
	@echo ""
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║     BUSINESS MANAGEMENT SYSTEM - COMMAND CENTER                ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)Usage:$(NC) make $(YELLOW)<target>$(NC)"
	@echo ""
	@echo "$(GREEN)Available targets:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# =============================================================================
# INSTALLATION
# =============================================================================
install: ## Install all dependencies
	@echo "$(BLUE)📦 Installing dependencies...$(NC)"
	npm install --legacy-peer-deps
	npx playwright install
	@echo "$(GREEN)✅ Dependencies installed$(NC)"

# =============================================================================
# DEVELOPMENT (Local without Docker)
# =============================================================================
dev: ## Start all services locally for development (DB & Redis from Docker)
	@echo "$(BLUE)🚀 Starting development environment (local services, Docker DB/Redis)...$(NC)"
	@bash scripts/start-local-services.sh

dev-stop: ## Stop local development services
	@echo "$(BLUE)🛑 Stopping development services...$(NC)"
	@bash scripts/stop-local-services.sh

# =============================================================================
# DOCKER OPERATIONS
# =============================================================================
start: ## Start all services with Docker (ONE COMMAND TO RUN ALL)
	@echo "$(BLUE)🐳 Starting all services with Docker...$(NC)"
	docker-compose up -d
	@echo "$(YELLOW)⏳ Waiting for databases...$(NC)"
	@sleep 8
	@echo "$(YELLOW)🔄 Running RBAC migrations...$(NC)"
	@bash scripts/run-rbac-migrations.sh localhost 5432 postgres postgres 2>/dev/null || \
		(echo "$(YELLOW)⚠️  Migrations skipped (may already be applied)$(NC)" && sleep 1)
	@echo "$(GREEN)✅ All services started$(NC)"
	@make health

stop: ## Stop all Docker services
	@echo "$(BLUE)🛑 Stopping all services...$(NC)"
	docker-compose down
	@echo "$(GREEN)✅ All services stopped$(NC)"

restart: ## Restart all Docker services
	@echo "$(BLUE)🔄 Restarting all services...$(NC)"
	docker-compose restart
	@echo "$(GREEN)✅ All services restarted$(NC)"

logs: ## View logs from all services
	docker-compose logs -f

logs-service: ## View logs from specific service (usage: make logs-service SERVICE=auth-service)
	docker-compose logs -f $(SERVICE)

build: ## Build all Docker images
	@echo "$(BLUE)🔨 Building all services...$(NC)"
	docker-compose build
	@echo "$(GREEN)✅ All services built$(NC)"

clean: ## Clean up Docker resources
	@echo "$(BLUE)🧹 Cleaning up...$(NC)"
	docker-compose down -v --remove-orphans
	docker system prune -f
	rm -rf dist node_modules/.cache
	@echo "$(GREEN)✅ Cleanup complete$(NC)"

# =============================================================================
# TESTING (SINGLE COMMANDS)
# =============================================================================
test: test-all ## Run all tests (alias for test-all)

test-unit: ## Run unit tests only
	@echo "$(BLUE)🧪 Running unit tests...$(NC)"
	npm run test
	@echo "$(GREEN)✅ Unit tests complete$(NC)"

test-integration: ## Run integration tests only
	@echo "$(BLUE)🧪 Running integration tests...$(NC)"
	docker-compose up -d postgres-test redis
	@sleep 3
	npm run test:integration
	@echo "$(GREEN)✅ Integration tests complete$(NC)"

test-e2e: ## Run Playwright E2E tests with 10 user personas
	@echo "$(BLUE)🎭 Running E2E tests with Playwright...$(NC)"
	@make start
	@echo "$(YELLOW)⏳ Waiting for services to be ready...$(NC)"
	@sleep 30
	@make health
	npx playwright test
	@echo "$(GREEN)✅ E2E tests complete$(NC)"

test-e2e-ui: ## Run Playwright E2E tests with UI mode
	@echo "$(BLUE)🎭 Running E2E tests with Playwright UI...$(NC)"
	@make start
	@sleep 30
	npx playwright test --ui

test-360: ## Run comprehensive 360-degree test suite
	@echo "$(BLUE)🎯 Running 360-degree test suite...$(NC)"
	@make start
	@echo "$(YELLOW)⏳ Waiting for services to be ready...$(NC)"
	@sleep 30
	@make health
	npm run test:360
	@echo "$(GREEN)✅ 360-degree tests complete$(NC)"

test-360-ui: ## Run 360-degree tests with UI mode
	@echo "$(BLUE)🎯 Running 360-degree tests with UI...$(NC)"
	@make start
	@sleep 30
	npm run test:360:ui

test-360-edge: ## Run edge case tests only
	@echo "$(BLUE)🎯 Running edge case tests...$(NC)"
	@make start
	@sleep 20
	npm run test:360:edge
	@echo "$(GREEN)✅ Edge case tests complete$(NC)"

test-360-security: ## Run security vulnerability tests
	@echo "$(BLUE)🔒 Running security tests...$(NC)"
	@make start
	@sleep 20
	npm run test:360:security
	@echo "$(GREEN)✅ Security tests complete$(NC)"

test-360-perf: ## Run performance and stress tests
	@echo "$(BLUE)⚡ Running performance tests...$(NC)"
	@make start
	@sleep 20
	npm run test:360:perf
	@echo "$(GREEN)✅ Performance tests complete$(NC)"

test-360-concurrency: ## Run concurrency and race condition tests
	@echo "$(BLUE)🔀 Running concurrency tests...$(NC)"
	@make start
	@sleep 20
	npm run test:360:concurrency
	@echo "$(GREEN)✅ Concurrency tests complete$(NC)"

test-all: ## Run ALL tests (unit + integration + e2e + 360)
	@echo "$(BLUE)🧪 Running ALL tests...$(NC)"
	@echo ""
	@echo "$(YELLOW)Step 1/4: Unit Tests$(NC)"
	@make test-unit
	@echo ""
	@echo "$(YELLOW)Step 2/4: Integration Tests$(NC)"
	@make test-integration
	@echo ""
	@echo "$(YELLOW)Step 3/4: E2E Tests$(NC)"
	@make test-e2e
	@echo ""
	@echo "$(YELLOW)Step 4/4: 360-Degree Tests$(NC)"
	@make test-360
	@echo ""
	@echo "$(GREEN)════════════════════════════════════════$(NC)"
	@echo "$(GREEN)✅ ALL TESTS COMPLETED SUCCESSFULLY$(NC)"
	@echo "$(GREEN)════════════════════════════════════════$(NC)"

# =============================================================================
# HEALTH CHECK
# =============================================================================
health: ## Check health of all services
	@echo "$(BLUE)🏥 Checking service health...$(NC)"
	@echo ""
	@echo "Service Health Status:"
	@echo "──────────────────────────────────────"
	@curl -s http://localhost:3002/health > /dev/null 2>&1 && echo "$(GREEN)✅ Auth Service     (3002)$(NC)" || echo "$(RED)❌ Auth Service     (3002)$(NC)"
	@curl -s http://localhost:3003/health > /dev/null 2>&1 && echo "$(GREEN)✅ Business Service (3003)$(NC)" || echo "$(RED)❌ Business Service (3003)$(NC)"
	@curl -s http://localhost:3004/health > /dev/null 2>&1 && echo "$(GREEN)✅ Party Service    (3004)$(NC)" || echo "$(RED)❌ Party Service    (3004)$(NC)"
	@curl -s http://localhost:3005/health > /dev/null 2>&1 && echo "$(GREEN)✅ Inventory Service(3005)$(NC)" || echo "$(RED)❌ Inventory Service(3005)$(NC)"
	@curl -s http://localhost:3006/health > /dev/null 2>&1 && echo "$(GREEN)✅ Invoice Service  (3006)$(NC)" || echo "$(RED)❌ Invoice Service  (3006)$(NC)"
	@curl -s http://localhost:3007/health > /dev/null 2>&1 && echo "$(GREEN)✅ Payment Service  (3007)$(NC)" || echo "$(RED)❌ Payment Service  (3007)$(NC)"
	@echo "──────────────────────────────────────"

# =============================================================================
# DEPLOYMENT
# =============================================================================
deploy: ## Build and deploy to production (legacy)
	@echo "$(BLUE)🚀 Deploying to production...$(NC)"
	@echo "$(YELLOW)Building production images...$(NC)"
	docker-compose -f docker-compose.yml build
	@echo "$(GREEN)✅ Deployment complete$(NC)"

deploy-staging: ## Deploy to staging environment
	@echo "$(BLUE)🚀 Deploying to staging...$(NC)"
	docker-compose -f docker-compose.yml up -d
	@echo "$(GREEN)✅ Staging deployment complete$(NC)"

start-prod: ## Start production with Docker (local testing, single command)
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║     PRODUCTION DEPLOYMENT - LOCAL DOCKER                    ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)This will:$(NC)"
	@echo "  ✅ Stop existing services"
	@echo "  ✅ Start infrastructure (PostgreSQL & Redis)"
	@echo "  ✅ Initialize databases"
	@echo "  ✅ Create database backup (MANDATORY)"
	@echo "  ✅ Run safe, idempotent migrations (won't affect existing data)"
	@echo "  ✅ Build Docker images"
	@echo "  ✅ Start all services in production mode"
	@echo "  ✅ Verify health"
	@echo ""
	@bash scripts/deploy-prod-local.sh

deploy-prod: ## Deploy latest code to production (EC2/Production) - uses existing Docker DB
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║     PRODUCTION DEPLOYMENT - EC2/PRODUCTION                  ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)This will:$(NC)"
	@echo "  ✅ Pull latest code from git"
	@echo "  ✅ Stop existing services"
	@echo "  ✅ Start infrastructure (PostgreSQL & Redis)"
	@echo "  ✅ Use existing databases (no new DBs created)"
	@echo "  ✅ Create database backup (MANDATORY)"
	@echo "  ✅ Run safe, idempotent migrations (won't affect existing data)"
	@echo "  ✅ Build Docker images"
	@echo "  ✅ Start all services in production mode"
	@echo "  ✅ Verify health"
	@echo ""
	@echo "$(BLUE)Note: Using existing Docker database (password: postgres)${NC}"
	@echo "$(BLUE)Only new migrations will be applied to existing databases${NC}"
	@echo ""
	@read -sp "$(YELLOW)JWT Secret (press Enter to auto-generate): $(NC)" JWT_SECRET; \
	echo ""; \
	echo ""; \
	bash scripts/deploy-prod-ec2.sh localhost 5432 postgres postgres $$JWT_SECRET

deploy-prod-quick: ## Quick production deploy - uses existing Docker DB (no prompts, fixes password)
	@echo "$(BLUE)🚀 Quick Production Deployment (using existing Docker DB)${NC}"
	@echo "$(YELLOW)Using: DB=localhost:5432, User=postgres, Password=postgres (Docker default)${NC}"
	@echo "$(YELLOW)This will ensure PostgreSQL password matches all services${NC}"
	@export DB_PASSWORD=postgres; \
	bash scripts/deploy-prod-ec2.sh localhost 5432 postgres postgres

start-prod-quick: start-prod ## Alias for start-prod

# =============================================================================
# AWS DEPLOYMENT (FULLY AUTOMATED - SINGLE COMMAND)
# =============================================================================
deploy-aws: ## Deploy entire app to AWS with single command (fully automated, end-to-end)
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║     UNIFIED AWS DEPLOYMENT - SINGLE COMMAND                      ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)This will automatically:$(NC)"
	@echo "  ✅ Setup IAM user (if needed)"
	@echo "  ✅ Create key pair (if needed)"
	@echo "  ✅ Launch EC2 instance"
	@echo "  ✅ Clone repository from GitHub"
	@echo "  ✅ Build and deploy all services"
	@echo "  ✅ Configure Nginx with all routes"
	@echo "  ✅ Setup automatic backups"
	@echo "  ✅ Setup domain and SSL/HTTPS (if domain provided)"
	@echo "  ✅ Configure HTTPS with comprehensive fix script"
	@echo ""
	@read -p "$(YELLOW)AWS Region (default: ap-south-1): $(NC)" REGION; \
	REGION=$${REGION:-ap-south-1}; \
	read -p "$(YELLOW)Key Pair Name (default: business-app-key): $(NC)" KEY_NAME; \
	KEY_NAME=$${KEY_NAME:-business-app-key}; \
	read -p "$(YELLOW)AWS Profile (default: business-app): $(NC)" AWS_PROFILE; \
	AWS_PROFILE=$${AWS_PROFILE:-business-app}; \
	read -p "$(YELLOW)Domain name (optional, press Enter to skip): $(NC)" DOMAIN; \
	DOMAIN=$${DOMAIN:-}; \
	if [ -n "$$DOMAIN" ]; then \
		read -p "$(YELLOW)Email for SSL certificate (default: admin@$$DOMAIN): $(NC)" EMAIL; \
		EMAIL=$${EMAIL:-admin@$$DOMAIN}; \
	else \
		EMAIL=""; \
	fi; \
	echo ""; \
	echo "$(YELLOW)Note: Instance type selection will be prompted by the deployment script$(NC)"; \
	echo ""; \
	export AWS_PROFILE=$$AWS_PROFILE; \
	if [ -n "$$DOMAIN" ]; then \
		bash scripts/deploy-aws-unified.sh $$REGION $$KEY_NAME "" $$AWS_PROFILE "$$DOMAIN" "$$EMAIL"; \
	else \
		bash scripts/deploy-aws-unified.sh $$REGION $$KEY_NAME "" $$AWS_PROFILE; \
	fi

deploy-aws-quick: ## Quick deploy with all defaults (no domain/SSL)
	@echo "$(BLUE)🚀 Quick Deploy to AWS (all defaults, no domain/SSL)$(NC)"
	@echo "$(YELLOW)Note: Instance type will be prompted$(NC)"
	@echo ""
	@AWS_PROFILE=$${AWS_PROFILE:-business-app}; \
	export AWS_PROFILE; \
	bash scripts/deploy-aws-unified.sh ap-south-1 business-app-key "" $$AWS_PROFILE

deploy-aws-full: ## Full deploy with domain and SSL (requires DOMAIN, optional EMAIL)
	@if [ -z "$$DOMAIN" ]; then \
		echo "$(RED)❌ Error: DOMAIN is required$(NC)"; \
		echo "Usage: make deploy-aws-full DOMAIN=samriddhi.buzz EMAIL=admin@samriddhi.buzz"; \
		echo "   Or: make deploy-aws-full DOMAIN=samriddhi.buzz"; \
		exit 1; \
	fi; \
	if [ -z "$$EMAIL" ]; then \
		EMAIL="admin@$$DOMAIN"; \
	fi; \
	echo "$(BLUE)🚀 Full Deploy to AWS with Domain & SSL$(NC)"; \
	echo "  Domain: $$DOMAIN"; \
	echo "  Email: $$EMAIL"; \
	echo "$(YELLOW)Note: Instance type will be prompted$(NC)"; \
	echo ""; \
	AWS_PROFILE=$${AWS_PROFILE:-business-app}; \
	export AWS_PROFILE; \
	bash scripts/deploy-aws-unified.sh ap-south-1 business-app-key "" $$AWS_PROFILE "$$DOMAIN" "$$EMAIL"

# =============================================================================
# DATABASE
# =============================================================================
db-reset: ## Reset all databases
	@echo "$(BLUE)🗄️ Resetting databases...$(NC)"
	docker-compose down -v
	docker-compose up -d postgres redis
	@sleep 5
	@echo "$(GREEN)✅ Databases reset$(NC)"

db-migrate: ## Run RBAC migrations on all databases (auth_db + business_db)
	@echo "$(BLUE)🗄️ Running RBAC migrations...$(NC)"
	@bash scripts/run-rbac-migrations.sh localhost 5432 postgres postgres
	@echo "$(GREEN)✅ Migrations complete$(NC)"

# =============================================================================
# BACKUP
# =============================================================================
backup: ## Backup all databases to S3 (usage: make backup BUCKET=my-backup-bucket)
	@echo "$(BLUE)💾 Backing up databases to S3...$(NC)"
	@if [ -z "$(BUCKET)" ]; then \
		echo "$(YELLOW)⚠️  No bucket specified. Using AWS_S3_BACKUP_BUCKET env var or will prompt$(NC)"; \
		bash scripts/backup-and-upload-to-s3.sh; \
	else \
		echo "$(BLUE)Using bucket: $(BUCKET)$(NC)"; \
		bash scripts/backup-and-upload-to-s3.sh "$(BUCKET)"; \
	fi
	@echo "$(GREEN)✅ Backup complete$(NC)"

backup-s3: backup ## Alias for backup

backup-local: ## Create local database backups only (no S3 upload)
	@echo "$(BLUE)💾 Creating local database backups...$(NC)"
	@bash scripts/backup-db.sh
	@echo "$(GREEN)✅ Local backups created in ./backups$(NC)"

backup-upload: ## Upload existing backups to S3 (usage: make backup-upload BUCKET=my-backup-bucket)
	@echo "$(BLUE)☁️  Uploading backups to S3...$(NC)"
	@if [ -z "$(BUCKET)" ]; then \
		echo "$(YELLOW)⚠️  No bucket specified. Using AWS_S3_BACKUP_BUCKET env var or will prompt$(NC)"; \
		bash scripts/upload-backup-to-s3.sh; \
	else \
		echo "$(BLUE)Using bucket: $(BUCKET)$(NC)"; \
		bash scripts/upload-backup-to-s3.sh "$(BUCKET)"; \
	fi
	@echo "$(GREEN)✅ Upload complete$(NC)"

# =============================================================================
# VERIFICATION
# =============================================================================
verify-types: ## Verify TypeScript types for all services
	@echo "$(BLUE)🔍 Verifying TypeScript types...$(NC)"
	@bash scripts/verify-types.sh

verify-all: ## Run all verification checks (lint, types, format)
	@echo "$(BLUE)🔍 Running comprehensive verification...$(NC)"
	@bash scripts/verify-all.sh

verify-web-app: ## Verify web-app (types and lint)
	@echo "$(BLUE)🔍 Verifying web-app...$(NC)"
	@cd ../web-app && bash scripts/verify-all.sh

# =============================================================================
# QUICK COMMANDS
# =============================================================================
up: start ## Alias for start
down: stop ## Alias for stop
t: test ## Alias for test
tu: test-unit ## Alias for test-unit
ti: test-integration ## Alias for test-integration
te: test-e2e ## Alias for test-e2e
t360: test-360 ## Alias for test-360
h: health ## Alias for health
b: backup ## Alias for backup

status: ## Check status of all services
	@echo "$(BLUE)🔍 Checking service status...$(NC)"
	@bash scripts/check-services.sh

check: status ## Alias for status

diagnose: ## Diagnose web access issues
	@echo "$(BLUE)🔍 Diagnosing web access...$(NC)"
	@bash scripts/diagnose-web-access.sh

fix-web: ## Fix web app access issues
	@echo "$(BLUE)🔧 Fixing web app...$(NC)"
	@docker-compose -f docker-compose.prod.yml restart web-app
	@echo "$(GREEN)✅ Web app restarted. Wait 30 seconds and check: make diagnose$(NC)"

fix-permissions: ## Fix user permissions (usage: make fix-permissions PHONE=8625953177)
	@echo "$(BLUE)🔧 Fixing user permissions...$(NC)"
	@if [ -z "$(PHONE)" ]; then \
		echo "$(YELLOW)⚠️  No phone number provided, fixing all users...$(NC)"; \
		bash scripts/fix-user-permissions.sh; \
	else \
		echo "$(YELLOW)Fixing permissions for phone: $(PHONE)$(NC)"; \
		bash scripts/fix-user-permissions.sh "$(PHONE)"; \
	fi
	@echo "$(GREEN)✅ Permissions fixed. User should log out and log back in.$(NC)"

fix-prod-permissions: ## Fix ALL user permissions in production database (grants full access to all users)
	@echo "$(BLUE)🔧 Fixing production database permissions...$(NC)"
	@echo "$(YELLOW)This will grant full permissions to ALL users in production database$(NC)"
	@read -p "$(YELLOW)Continue? (y/N): $(NC)" confirm; \
	if [ "$$confirm" != "y" ] && [ "$$confirm" != "Y" ]; then \
		echo "$(RED)Cancelled$(NC)"; \
		exit 1; \
	fi
	@bash scripts/fix-prod-permissions.sh localhost 5432 postgres postgres
	@echo "$(GREEN)✅ Production permissions fixed. Restart services: make restart$(NC)"
