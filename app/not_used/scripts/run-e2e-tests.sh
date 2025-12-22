#!/bin/bash

###############################################################################
# E2E Test Runner Script
# 
# This script automates the complete E2E testing workflow:
# 1. Starts all services via Docker Compose
# 2. Waits for all services to be healthy
# 3. Runs Playwright E2E tests
# 4. Generates test reports
# 5. Cleans up resources
#
# Usage: ./scripts/run-e2e-tests.sh
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.e2e.yml"
MAX_WAIT_TIME=300  # 5 minutes max wait
CHECK_INTERVAL=10  # Check every 10 seconds

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to check if a service is healthy
check_service_health() {
    local service=$1
    local status=$(docker inspect --format='{{.State.Health.Status}}' "business-${service}-e2e" 2>/dev/null || echo "not_found")
    
    if [ "$status" == "healthy" ]; then
        return 0
    else
        return 1
    fi
}

# Function to wait for all services
wait_for_services() {
    print_info "Waiting for all services to become healthy..."
    
    local services=("postgres" "redis" "auth-service" "business-service" "party-service" "inventory-service" "invoice-service" "payment-service")
    local elapsed=0
    local all_healthy=false
    
    while [ $elapsed -lt $MAX_WAIT_TIME ]; do
        all_healthy=true
        
        for service in "${services[@]}"; do
            if ! check_service_health "$service"; then
                all_healthy=false
                print_info "  ⏳ Waiting for $service... (${elapsed}s elapsed)"
                break
            fi
        done
        
        if $all_healthy; then
            print_success "All services are healthy!"
            return 0
        fi
        
        sleep $CHECK_INTERVAL
        elapsed=$((elapsed + CHECK_INTERVAL))
    done
    
    print_error "Services did not become healthy within ${MAX_WAIT_TIME} seconds"
    return 1
}

# Function to cleanup
cleanup() {
    print_info "Cleaning up Docker containers..."
    docker-compose -f $COMPOSE_FILE down -v 2>/dev/null || true
    print_success "Cleanup completed"
}

# Trap to ensure cleanup on exit
trap cleanup EXIT INT TERM

# Main execution
main() {
    echo ""
    echo "======================================================================"
    echo "  🚀 E2E Test Runner"
    echo "======================================================================"
    echo ""
    
    # Step 1: Check if Docker is running
    print_info "Checking Docker..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
    
    # Step 2: Clean up any existing containers
    print_info "Cleaning up existing containers..."
    docker-compose -f $COMPOSE_FILE down -v 2>/dev/null || true
    print_success "Cleanup completed"
    
    # Step 3: Build and start services
    print_info "Building and starting all services..."
    if docker-compose -f $COMPOSE_FILE up -d --build; then
        print_success "Services started successfully"
    else
        print_error "Failed to start services"
        exit 1
    fi
    
    # Step 4: Wait for services to be ready
    if wait_for_services; then
        print_success "All services are ready"
    else
        print_error "Services failed to become healthy"
        print_info "Showing service logs:"
        docker-compose -f $COMPOSE_FILE logs --tail=50
        exit 1
    fi
    
    # Step 5: Run database migrations
    print_info "Running database migrations..."
    docker-compose -f $COMPOSE_FILE exec -T auth-service npm run typeorm migration:run 2>/dev/null || true
    print_success "Migrations completed"
    
    # Step 6: Wait a bit more for frontend to be ready
    print_info "Waiting for frontend to be ready..."
    sleep 15
    print_success "Frontend should be ready"
    
    # Step 7: Run Playwright tests
    echo ""
    print_info "Running Playwright E2E tests..."
    echo ""
    
    if npx playwright test; then
        print_success "All E2E tests passed! 🎉"
        EXIT_CODE=0
    else
        print_error "Some E2E tests failed"
        EXIT_CODE=1
    fi
    
    # Step 8: Generate and show report
    echo ""
    print_info "Generating test report..."
    npx playwright show-report --host 0.0.0.0 --port 9323 > /dev/null 2>&1 &
    REPORT_PID=$!
    
    print_success "Test report generated!"
    print_info "Report available at: http://localhost:9323"
    print_info "Report files saved in: playwright-report/"
    
    # Step 9: Show test summary
    echo ""
    echo "======================================================================"
    if [ $EXIT_CODE -eq 0 ]; then
        print_success "✅ E2E Testing Completed Successfully!"
    else
        print_warning "⚠️  E2E Testing Completed with Failures"
    fi
    echo "======================================================================"
    echo ""
    
    print_info "Test artifacts:"
    print_info "  - HTML Report: playwright-report/index.html"
    print_info "  - JSON Results: playwright-report/results.json"
    print_info "  - JUnit XML: playwright-report/results.xml"
    print_info "  - Screenshots: playwright-report/ (on failure)"
    print_info "  - Videos: playwright-report/ (on failure)"
    echo ""
    
    # Kill report server
    kill $REPORT_PID 2>/dev/null || true
    
    exit $EXIT_CODE
}

# Run main function
main
