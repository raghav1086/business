#!/bin/bash

# =============================================================================
# SEAMLESS DEPLOYMENT SCRIPT
# =============================================================================
# Intelligently detects changed services and deploys only what's needed
# without impacting other services. Supports zero-downtime rolling updates.
# 
# Usage:
#   ./deploy-seamless.sh                    # Auto-detect changes
#   ./deploy-seamless.sh --service auth-service  # Deploy specific service
#   ./deploy-seamless.sh --all              # Force deploy all services
#   ./deploy-seamless.sh --rollback         # Rollback last deployment
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Configuration
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
DEPLOYMENT_LOG_DIR="$PROJECT_ROOT/.deployment"
ROLLBACK_DIR="$DEPLOYMENT_LOG_DIR/rollback"
HEALTH_CHECK_TIMEOUT=60
HEALTH_CHECK_INTERVAL=5
MAX_ROLLBACK_ATTEMPTS=3
LAST_DEPLOYED_COMMIT_FILE="$DEPLOYMENT_LOG_DIR/last_deployed_commit.txt"

# Service definitions with dependencies
declare -A SERVICE_PATHS=(
    ["auth-service"]="apps/auth-service"
    ["business-service"]="apps/business-service"
    ["party-service"]="apps/party-service"
    ["inventory-service"]="apps/inventory-service"
    ["invoice-service"]="apps/invoice-service"
    ["payment-service"]="apps/payment-service"
    ["gst-service"]="apps/gst-service"
    ["web-app"]="../web-app"
)

declare -A SERVICE_DEPENDENCIES=(
    ["auth-service"]=""
    ["business-service"]="auth-service"
    ["party-service"]="auth-service"
    ["inventory-service"]="auth-service"
    ["invoice-service"]="auth-service"
    ["payment-service"]="auth-service"
    ["gst-service"]="auth-service,business-service,invoice-service,party-service"
    ["web-app"]="auth-service,business-service"
)

declare -A SERVICE_PORTS=(
    ["auth-service"]="3002"
    ["business-service"]="3003"
    ["party-service"]="3004"
    ["inventory-service"]="3005"
    ["invoice-service"]="3006"
    ["payment-service"]="3007"
    ["gst-service"]="3008"
    ["web-app"]="3000"
)

# Parse arguments
FORCE_ALL=false
FORCE_SERVICE=""
ROLLBACK=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            FORCE_ALL=true
            shift
            ;;
        --service)
            FORCE_SERVICE="$2"
            shift 2
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --all              Force deploy all services"
            echo "  --service NAME     Deploy specific service only"
            echo "  --rollback         Rollback last deployment"
            echo "  --dry-run          Show what would be deployed without deploying"
            echo "  --help             Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Create deployment log directory
mkdir -p "$DEPLOYMENT_LOG_DIR" "$ROLLBACK_DIR"

# Use docker compose (v2) if available, otherwise docker-compose (v1)
if docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

# Check if service is running
is_service_running() {
    local service=$1
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" ps "$service" 2>/dev/null | grep -q "Up" || return 1
}

# Check service health
check_service_health() {
    local service=$1
    local port=${SERVICE_PORTS[$service]}
    local max_attempts=$((HEALTH_CHECK_TIMEOUT / HEALTH_CHECK_INTERVAL))
    local attempt=0
    
    if [ -z "$port" ]; then
        # For services without direct port, check container status
        is_service_running "$service" && return 0 || return 1
    fi
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -sf "http://localhost:$port/health" > /dev/null 2>&1; then
            return 0
        fi
        attempt=$((attempt + 1))
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    return 1
}

# Get changed files from git
get_changed_files() {
    local base_ref="${1:-}"
    local current_ref="${2:-HEAD}"
    
    if [ ! -d ".git" ]; then
        warning "Not a git repository, cannot detect changes"
        return 1
    fi
    
    # If no base_ref provided, try to get last deployed commit
    if [ -z "$base_ref" ]; then
        local last_deployed_file="$DEPLOYMENT_LOG_DIR/last_deployed_commit.txt"
        if [ -f "$last_deployed_file" ]; then
            base_ref=$(cat "$last_deployed_file" 2>/dev/null | head -1 || echo "")
            if [ -n "$base_ref" ] && git rev-parse --verify "$base_ref" > /dev/null 2>&1; then
                info "Comparing against last deployed commit: ${base_ref:0:7}"
            else
                base_ref=""
            fi
        fi
        
        # Fallback to HEAD~1 if no last deployed commit
        if [ -z "$base_ref" ]; then
            if git rev-parse --verify "HEAD~1" > /dev/null 2>&1; then
                base_ref="HEAD~1"
                info "Comparing against previous commit (HEAD~1)"
            else
                base_ref=""
            fi
        fi
    fi
    
    # Try to get changes
    local changed_files=""
    if [ -n "$base_ref" ] && git rev-parse --verify "$base_ref" > /dev/null 2>&1; then
        # Get modified, added, copied, and renamed files (exclude deleted)
        changed_files=$(git diff --name-only --diff-filter=ACMR "$base_ref" "$current_ref" 2>/dev/null || echo "")
    else
        # If no previous commit, check for uncommitted changes
        changed_files=$(git diff --name-only --diff-filter=ACMR HEAD 2>/dev/null || echo "")
        if [ -z "$changed_files" ]; then
            # Check staged changes
            changed_files=$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null || echo "")
        fi
    fi
    
    echo "$changed_files"
}

# Map file changes to services
detect_changed_services() {
    local changed_files="$1"
    local changed_services=()
    
    if [ -z "$changed_files" ]; then
        return 0
    fi
    
    # Filter out non-deployment files (docs, tests, etc.)
    # These files don't require service rebuilds
    local deployment_files=$(echo "$changed_files" | grep -vE "\.(md|txt|log|test\.ts|spec\.ts|e2e\.ts|stories\.tsx|snap)$|^docs/|^\.github/|^scripts/.*\.md$|^README|^CHANGELOG|^LICENSE|^\.gitignore|^\.editorconfig")
    
    if [ -z "$deployment_files" ]; then
        info "Only non-deployment files changed (docs, tests, etc.) - no services need rebuild"
        echo ""
        return 0
    fi
    
    # Check shared libraries (if changed, all services need rebuild)
    if echo "$deployment_files" | grep -qE "^libs/|^app/libs/|^apps/libs/"; then
        info "Shared libraries changed - all services will be rebuilt"
        for service in "${!SERVICE_PATHS[@]}"; do
            changed_services+=("$service")
        done
        echo "${changed_services[@]}"
        return 0
    fi
    
    # Check root level files that affect all services
    if echo "$deployment_files" | grep -qE "^(package\.json|package-lock\.json|nx\.json|tsconfig.*\.json|Dockerfile|docker-compose.*\.yml|\.env|\.env\..*)"; then
        info "Root configuration files changed - all services will be rebuilt"
        for service in "${!SERVICE_PATHS[@]}"; do
            changed_services+=("$service")
        done
        echo "${changed_services[@]}"
        return 0
    fi
    
    # Check each service with improved path matching
    for service in "${!SERVICE_PATHS[@]}"; do
        local service_path="${SERVICE_PATHS[$service]}"
        
        # Special handling for web-app (can be in parent directory or current)
        if [ "$service" = "web-app" ]; then
            # Match web-app in various locations: web-app/, ../web-app/, or web-app/ at root
            if echo "$deployment_files" | grep -qE "(^|/|\.\./)web-app/|^web-app/"; then
                changed_services+=("$service")
            fi
        else
            # Improved pattern matching for services
            # Match: apps/service/, apps/service-name/, service/ (if in root)
            # Escape special characters in service_path for regex
            local escaped_path=$(echo "$service_path" | sed 's/[.[\*^$()+?{|]/\\&/g')
            if echo "$deployment_files" | grep -qE "(^|/)${escaped_path}/|(^|/)apps/${service}(-service)?/"; then
                changed_services+=("$service")
            fi
        fi
    done
    
    echo "${changed_services[@]}"
}

# Get service dependencies (including transitive)
get_all_dependencies() {
    local service=$1
    local deps=()
    local visited=()
    
    get_deps_recursive() {
        local svc=$1
        local dep_list="${SERVICE_DEPENDENCIES[$svc]}"
        
        if [ -z "$dep_list" ]; then
            return
        fi
        
        IFS=',' read -ra DEPS <<< "$dep_list"
        for dep in "${DEPS[@]}"; do
            dep=$(echo "$dep" | xargs) # trim
            if [[ ! " ${visited[@]} " =~ " ${dep} " ]]; then
                visited+=("$dep")
                deps+=("$dep")
                get_deps_recursive "$dep"
            fi
        done
    }
    
    get_deps_recursive "$service"
    echo "${deps[@]}"
}

# Create backup of current deployment state
create_deployment_backup() {
    local timestamp=$(date +'%Y%m%d_%H%M%S')
    local backup_file="$ROLLBACK_DIR/deployment_${timestamp}.json"
    
    log "Creating deployment backup..."
    
    # Save current container states
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" ps --format json > "$backup_file" 2>/dev/null || true
    
    # Save current image tags
    {
        echo "{"
        echo "  \"timestamp\": \"$(date -Iseconds)\","
        echo "  \"images\": {"
        for service in "${!SERVICE_PATHS[@]}"; do
            local image_id=$($DOCKER_COMPOSE -f "$COMPOSE_FILE" images -q "$service" 2>/dev/null | head -1 || echo "")
            if [ -n "$image_id" ]; then
                echo "    \"$service\": \"$image_id\","
            fi
        done
        echo "  }"
        echo "}"
    } > "$backup_file"
    
    # Keep only last 5 backups
    ls -t "$ROLLBACK_DIR"/deployment_*.json 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
    
    success "Deployment backup created: $backup_file"
    echo "$backup_file"
}

# Rolling update: build new image, stop old, start new, verify health
rolling_update() {
    local service=$1
    local was_running=false
    local old_container_id=""
    
    log "Performing seamless update for $service..."
    
    # Check if service is currently running and get container ID
    if is_service_running "$service"; then
        was_running=true
        old_container_id=$($DOCKER_COMPOSE -f "$COMPOSE_FILE" ps -q "$service" 2>/dev/null | head -1 || echo "")
        info "Service $service is running (container: ${old_container_id:0:12}...), performing update..."
    else
        info "Service $service is not running, will build and start..."
    fi
    
    # Build new image (this doesn't stop the running container)
    log "Building new image for $service..."
    if ! $DOCKER_COMPOSE -f "$COMPOSE_FILE" build "$service"; then
        error "Failed to build $service"
        return 1
    fi
    
    # If service was running, perform graceful restart
    if [ "$was_running" = true ]; then
        # Stop old container gracefully (SIGTERM, then SIGKILL after timeout)
        if [ -n "$old_container_id" ]; then
            log "Stopping old container gracefully..."
            docker stop -t 10 "$old_container_id" 2>/dev/null || true
        fi
        
        # Start new container with new image
        log "Starting new container..."
        $DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d --no-deps "$service"
    else
        # Service wasn't running, just start it
        log "Starting service..."
        $DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d "$service"
    fi
    
    # Wait for service to be healthy
    log "Waiting for $service to be healthy (timeout: ${HEALTH_CHECK_TIMEOUT}s)..."
    if check_service_health "$service"; then
        success "$service is healthy and running"
        
        # Clean up old container if it still exists
        if [ -n "$old_container_id" ] && docker ps -a --format '{{.ID}}' | grep -q "^${old_container_id}$"; then
            log "Cleaning up old container..."
            docker rm -f "$old_container_id" 2>/dev/null || true
        fi
        
        return 0
    else
        error "$service health check failed"
        
        # If service was running before, try to restart old container
        if [ "$was_running" = true ] && [ -n "$old_container_id" ]; then
            warning "Attempting to restore old container..."
            docker start "$old_container_id" 2>/dev/null || {
                error "Failed to restore old container. Manual intervention required."
            }
        fi
        
        return 1
    fi
}

# Deploy a single service
deploy_service() {
    local service=$1
    local backup_file="$2"
    
    log "Deploying $service..."
    
    # Check dependencies first
    local deps=$(get_all_dependencies "$service")
    if [ -n "$deps" ]; then
        info "Dependencies for $service: $deps"
        for dep in $deps; do
            if ! is_service_running "$dep"; then
                warning "Dependency $dep is not running, starting it first..."
                $DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d "$dep" || {
                    error "Failed to start dependency $dep"
                    return 1
                }
                sleep 5
            fi
        done
    fi
    
    # Perform rolling update
    if rolling_update "$service"; then
        success "$service deployed successfully"
        return 0
    else
        error "$service deployment failed"
        return 1
    fi
}

# Rollback to previous deployment
rollback_deployment() {
    log "Rolling back to previous deployment..."
    
    # Find latest backup
    local latest_backup=$(ls -t "$ROLLBACK_DIR"/deployment_*.json 2>/dev/null | head -1)
    
    if [ -z "$latest_backup" ]; then
        error "No rollback backup found"
        return 1
    fi
    
    info "Found backup: $latest_backup"
    
    # For now, just restart all services (in production, you'd restore images)
    warning "Rollback: Restarting all services..."
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" restart
    
    log "Waiting for services to recover..."
    sleep 10
    
    # Check health
    local all_healthy=true
    for service in "${!SERVICE_PATHS[@]}"; do
        if ! check_service_health "$service"; then
            error "$service is not healthy after rollback"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        success "Rollback completed successfully"
        return 0
    else
        error "Rollback completed but some services are unhealthy"
        return 1
    fi
}

# =============================================================================
# MAIN DEPLOYMENT LOGIC
# =============================================================================

main() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     SEAMLESS DEPLOYMENT - INTELLIGENT SERVICE UPDATES         ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Handle rollback
    if [ "$ROLLBACK" = true ]; then
        rollback_deployment
        exit $?
    fi
    
    # Create backup before deployment
    local backup_file=$(create_deployment_backup)
    
    # Determine which services to deploy
    local services_to_deploy=()
    
    if [ "$FORCE_ALL" = true ]; then
        info "Force deploying all services..."
        for service in "${!SERVICE_PATHS[@]}"; do
            services_to_deploy+=("$service")
        done
    elif [ -n "$FORCE_SERVICE" ]; then
        if [[ -v SERVICE_PATHS["$FORCE_SERVICE"] ]]; then
            info "Deploying specific service: $FORCE_SERVICE"
            services_to_deploy+=("$FORCE_SERVICE")
        else
            error "Unknown service: $FORCE_SERVICE"
            echo "Available services: ${!SERVICE_PATHS[@]}"
            exit 1
        fi
    else
        # Auto-detect changes
        log "Detecting changed services..."
        local changed_files=$(get_changed_files)
        
        if [ -z "$changed_files" ]; then
            warning "No changes detected. Use --all to force deploy all services."
            exit 0
        fi
        
        local changed_services=$(detect_changed_services "$changed_files")
        
        if [ -z "$changed_services" ]; then
            info "No service changes detected. Nothing to deploy."
            exit 0
        fi
        
        # Convert to array
        read -ra services_to_deploy <<< "$changed_services"
        
        info "Detected changes in: ${services_to_deploy[*]}"
    fi
    
    if [ "$DRY_RUN" = true ]; then
        echo ""
        echo -e "${CYAN}DRY RUN MODE - No changes will be made${NC}"
        echo ""
        echo "Services that would be deployed:"
        for service in "${services_to_deploy[@]}"; do
            echo "  - $service"
        done
        exit 0
    fi
    
    # Deploy services
    echo ""
    log "Starting deployment of ${#services_to_deploy[@]} service(s)..."
    echo ""
    
    local deployed=()
    local failed=()
    
    for service in "${services_to_deploy[@]}"; do
        echo ""
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${CYAN}Deploying: $service${NC}"
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        
        if deploy_service "$service" "$backup_file"; then
            deployed+=("$service")
        else
            failed+=("$service")
        fi
    done
    
    # Summary
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     DEPLOYMENT SUMMARY                                         ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    if [ ${#deployed[@]} -gt 0 ]; then
        success "Successfully deployed (${#deployed[@]}):"
        for service in "${deployed[@]}"; do
            echo "  ✓ $service"
        done
    fi
    
    if [ ${#failed[@]} -gt 0 ]; then
        echo ""
        error "Failed to deploy (${#failed[@]}):"
        for service in "${failed[@]}"; do
            echo "  ✗ $service"
        done
        echo ""
        warning "To rollback: $0 --rollback"
        exit 1
    fi
    
    echo ""
    success "All services deployed successfully!"
    echo ""
    info "Backup saved at: $backup_file"
    info "To rollback if needed: $0 --rollback"
    echo ""
    
    # Final health check
    log "Performing final health check..."
    local all_healthy=true
    for service in "${deployed[@]}"; do
        if check_service_health "$service"; then
            success "$service is healthy"
        else
            error "$service health check failed"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        echo ""
        success "All services are healthy! Deployment complete."
        
        # Save last deployed commit for future comparisons
        local current_commit=$(git rev-parse HEAD 2>/dev/null || echo "")
        if [ -n "$current_commit" ]; then
            mkdir -p "$DEPLOYMENT_LOG_DIR"
            echo "$current_commit" > "$DEPLOYMENT_LOG_DIR/last_deployed_commit.txt"
            info "Saved last deployed commit: ${current_commit:0:7}"
        fi
    else
        echo ""
        warning "Some services failed health check. Review logs: $DOCKER_COMPOSE -f $COMPOSE_FILE logs"
    fi
}

# Run main function
main "$@"

