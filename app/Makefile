# =============================================================================
# BUSINESS MANAGEMENT SYSTEM - MAKEFILE
# =============================================================================
# Single source of truth for all commands
# Usage: make <target>
# =============================================================================

.PHONY: help install dev start stop restart logs test test-unit test-integration test-e2e test-all build clean deploy health

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
dev: ## Start all services locally for development
	@echo "$(BLUE)🚀 Starting development environment...$(NC)"
	@docker-compose up -d postgres redis
	@echo "$(YELLOW)⏳ Waiting for databases...$(NC)"
	@sleep 5
	@docker exec -i business-postgres psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='auth_db'" | grep -q 1 || \
		docker exec -i business-postgres psql -U postgres -f /docker-entrypoint-initdb.d/init-db.sql
	@npx nx run-many --target=serve --all --parallel=6
	@echo "$(GREEN)✅ All services running$(NC)"

dev-stop: ## Stop local development services
	@echo "$(BLUE)🛑 Stopping development services...$(NC)"
	@pkill -f "nx serve" || true
	@echo "$(GREEN)✅ Services stopped$(NC)"

# =============================================================================
# DOCKER OPERATIONS
# =============================================================================
start: ## Start all services with Docker (ONE COMMAND TO RUN ALL)
	@echo "$(BLUE)🐳 Starting all services with Docker...$(NC)"
	docker-compose up -d
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
deploy: ## Build and deploy to production
	@echo "$(BLUE)🚀 Deploying to production...$(NC)"
	# @make test-all
	@echo "$(YELLOW)Building production images...$(NC)"
	docker-compose -f docker-compose.yml build
	@echo "$(GREEN)✅ Deployment complete$(NC)"

deploy-staging: ## Deploy to staging environment
	@echo "$(BLUE)🚀 Deploying to staging...$(NC)"
	docker-compose -f docker-compose.yml up -d
	@echo "$(GREEN)✅ Staging deployment complete$(NC)"

# =============================================================================
# AWS DEPLOYMENT (FULLY AUTOMATED)
# =============================================================================
deploy-aws: ## Deploy entire app to AWS with single command (fully automated)
	@echo "$(BLUE)🚀 Automated AWS Deployment$(NC)"
	@echo "$(YELLOW)This will automatically:$(NC)"
	@echo "  • Setup IAM user (if needed)"
	@echo "  • Create key pair (if needed)"
	@echo "  • Launch EC2 instance"
	@echo "  • Clone repository from GitHub"
	@echo "  • Deploy all services"
	@echo "  • Configure Nginx"
	@echo ""
	@read -p "AWS Region (default: ap-south-1): " REGION; \
	REGION=$${REGION:-ap-south-1}; \
	read -p "Key Pair Name (default: business-app-key): " KEY_NAME; \
	KEY_NAME=$${KEY_NAME:-business-app-key}; \
	read -p "Instance Type (default: t3.small): " INSTANCE_TYPE; \
	INSTANCE_TYPE=$${INSTANCE_TYPE:-t3.small}; \
	echo ""; \
	bash scripts/deploy-aws-auto.sh $$REGION $$KEY_NAME $$INSTANCE_TYPE

deploy-aws-quick: ## Quick deploy with all defaults (no prompts)
	@echo "$(BLUE)🚀 Quick Deploy to AWS (all defaults)$(NC)"
	@bash scripts/deploy-aws-auto.sh ap-south-1 business-app-key t3.small

# =============================================================================
# DATABASE
# =============================================================================
db-reset: ## Reset all databases
	@echo "$(BLUE)🗄️ Resetting databases...$(NC)"
	docker-compose down -v
	docker-compose up -d postgres redis
	@sleep 5
	@echo "$(GREEN)✅ Databases reset$(NC)"

db-migrate: ## Run database migrations
	@echo "$(BLUE)🗄️ Running migrations...$(NC)"
	npx nx run-many --target=migration:run --all
	@echo "$(GREEN)✅ Migrations complete$(NC)"

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
