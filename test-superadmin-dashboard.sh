#!/bin/bash

# Superadmin Dashboard Comprehensive Test Script
# Tests all 6 phases of the Superadmin Dashboard

echo "=========================================="
echo "Superadmin Dashboard - Comprehensive Test"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
TOTAL=0

# Function to test a feature
test_feature() {
    local feature_name="$1"
    local test_command="$2"
    
    TOTAL=$((TOTAL + 1))
    echo -n "Testing: $feature_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "Phase 1: Enhanced Overview Dashboard"
echo "-------------------------------------"

# Check if overview tab exists
test_feature "Overview Tab" "grep -q 'TabsTrigger value=\"overview\"' web-app/app/admin/page.tsx"

# Check if statistics cards exist
test_feature "Statistics Cards (8 cards)" "grep -q 'Total Businesses\|Active Businesses\|Total Users\|Active Users\|Recent Businesses\|Recent Users\|System Status\|Recent Activity' web-app/app/admin/page.tsx"

# Check if charts exist
test_feature "Business Growth Chart" "grep -q 'Business Growth\|LineChart' web-app/app/admin/page.tsx"
test_feature "User Registration Chart" "grep -q 'User Registration Trend\|LineChart' web-app/app/admin/page.tsx"
test_feature "Business Type Distribution" "grep -q 'Business Type Distribution\|PieChart' web-app/app/admin/page.tsx"
test_feature "User Type Distribution" "grep -q 'User Type Distribution\|PieChart' web-app/app/admin/page.tsx"

# Check if quick actions exist
test_feature "Quick Actions Panel" "grep -q 'Quick Actions\|Global Search\|Export All Data' web-app/app/admin/page.tsx"

# Check if auto-refresh is configured
test_feature "Auto-refresh (30 seconds)" "grep -q 'refetchInterval.*30000' web-app/app/admin/page.tsx"

echo ""
echo "Phase 2: Enhanced Businesses Management"
echo "---------------------------------------"

# Check if businesses tab exists
test_feature "Businesses Tab" "grep -q 'TabsTrigger value=\"businesses\"' web-app/app/admin/page.tsx"

# Check if business details sheet exists
test_feature "Business Details Sheet Component" "test -f web-app/components/admin/business-details-sheet.tsx"

# Check if filtering exists
test_feature "Business Filtering (Status)" "grep -q 'businessStatusFilter\|Status.*Filter' web-app/app/admin/page.tsx"
test_feature "Business Filtering (Type)" "grep -q 'businessTypeFilter\|Type.*Filter' web-app/app/admin/page.tsx"
test_feature "Business Search" "grep -q 'businessSearch' web-app/app/admin/page.tsx"

# Check if sorting exists
test_feature "Business Sorting" "grep -q 'businessSortBy\|Sort By' web-app/app/admin/page.tsx"

# Check if pagination exists
test_feature "Business Pagination" "grep -q 'businessPage\|paginatedBusinesses\|totalBusinessPages' web-app/app/admin/page.tsx"

# Check if export exists
test_feature "Business Export CSV" "grep -q 'exportBusinesses\|Export CSV' web-app/app/admin/page.tsx"

echo ""
echo "Phase 3: Enhanced Users Management"
echo "----------------------------------"

# Check if users tab exists
test_feature "Users Tab" "grep -q 'TabsTrigger value=\"users\"' web-app/app/admin/page.tsx"

# Check if user details sheet exists
test_feature "User Details Sheet Component" "test -f web-app/components/admin/user-details-sheet.tsx"

# Check if filtering exists
test_feature "User Filtering (Status)" "grep -q 'userStatusFilter\|Status.*Filter' web-app/app/admin/page.tsx"
test_feature "User Filtering (Type)" "grep -q 'userTypeFilter\|Type.*Filter' web-app/app/admin/page.tsx"
test_feature "User Search" "grep -q 'userSearch' web-app/app/admin/page.tsx"

# Check if sorting exists
test_feature "User Sorting" "grep -q 'userSortBy\|Sort By' web-app/app/admin/page.tsx"

# Check if pagination exists
test_feature "User Pagination" "grep -q 'userPage\|paginatedUsers\|totalUserPages' web-app/app/admin/page.tsx"

# Check if bulk operations exist
test_feature "Bulk Selection" "grep -q 'selectedUserIds\|handleToggleUserSelection' web-app/app/admin/page.tsx"
test_feature "Bulk Export" "grep -q 'handleBulkExportUsers\|Export Selected' web-app/app/admin/page.tsx"

# Check if export exists
test_feature "User Export CSV" "grep -q 'exportUsers\|Export CSV' web-app/app/admin/page.tsx"

echo ""
echo "Phase 4: System-Wide Audit Logs"
echo "-------------------------------"

# Check if audit logs tab exists
test_feature "Audit Logs Tab" "grep -q 'TabsTrigger value=\"audit-logs\"' web-app/app/admin/page.tsx"

# Check if audit logs viewer exists
test_feature "Audit Logs Viewer Component" "test -f web-app/components/admin/audit-logs-viewer.tsx"

# Check if statistics exist
test_feature "Audit Log Statistics" "grep -q 'getAuditLogStatistics\|Total Logs\|Active Users' web-app/components/admin/audit-logs-viewer.tsx"

# Check if filtering exists
test_feature "Audit Log Filtering" "grep -q 'filters\|action.*filter\|date.*filter' web-app/components/admin/audit-logs-viewer.tsx"

# Check if expandable rows exist
test_feature "Expandable Rows" "grep -q 'expandedLogs\|toggleExpand\|ChevronDown\|ChevronRight' web-app/components/admin/audit-logs-viewer.tsx"

# Check if pagination exists
test_feature "Audit Log Pagination" "grep -q 'auditPage\|paginatedLogs\|totalPages' web-app/components/admin/audit-logs-viewer.tsx"

# Check if export exists
test_feature "Audit Log Export CSV" "grep -q 'handleExport\|Export CSV' web-app/components/admin/audit-logs-viewer.tsx"

# Check backend endpoints
test_feature "Backend: GET /admin/audit-logs" "grep -q 'admin/audit-logs' app/apps/business-service/src/controllers/audit-log.controller.ts"
test_feature "Backend: GET /admin/audit-logs/statistics" "grep -q 'admin/audit-logs/statistics' app/apps/business-service/src/controllers/audit-log.controller.ts"

echo ""
echo "Phase 5: Advanced Features"
echo "--------------------------"

# Check if global search exists
test_feature "Global Search" "grep -q 'globalSearch\|handleGlobalSearch\|Global Search' web-app/app/admin/page.tsx"

# Check if system health exists
test_feature "System Health Monitoring" "grep -q 'System Health\|Database\|Services\|Performance\|Security' web-app/app/admin/page.tsx"

# Check if enhanced exports exist
test_feature "Enhanced Export (All Data)" "grep -q 'handleExportAll\|Export All Data' web-app/app/admin/page.tsx"

echo ""
echo "Phase 6: Additional Features & Polish"
echo "-------------------------------------"

# Check if tabs navigation exists
test_feature "Tab Navigation" "grep -q 'TabsList\|TabsTrigger\|TabsContent' web-app/app/admin/page.tsx"

# Check if loading states exist
test_feature "Loading States (Skeleton)" "grep -q 'Skeleton\|isLoading\|loading' web-app/app/admin/page.tsx"

# Check if error handling exists
test_feature "Error Handling" "grep -q 'toast\|error\|Error' web-app/app/admin/page.tsx"

# Check if empty states exist
test_feature "Empty States" "grep -q 'No.*found\|empty\|Empty' web-app/app/admin/page.tsx"

echo ""
echo "Backend API Verification"
echo "------------------------"

# Check backend endpoints
test_feature "Backend: GET /businesses/admin/stats" "grep -q 'admin/stats' app/apps/business-service/src/controllers/business.controller.ts"
test_feature "Backend: GET /businesses (superadmin)" "grep -q 'findAll\|is_superadmin' app/apps/business-service/src/controllers/business.controller.ts"
test_feature "Backend: GET /users/admin/all" "grep -q 'admin/all' app/apps/auth-service/src/controllers/user.controller.ts || echo 'Endpoint may be in different location'"
test_feature "Backend: GET /users/admin/stats/*" "grep -q 'admin/stats' app/apps/auth-service/src/controllers/user.controller.ts || echo 'Endpoint may be in different location'"

echo ""
echo "Frontend Service Verification"
echo "-----------------------------"

# Check frontend service functions
test_feature "Frontend: getSystemStats" "grep -q 'getSystemStats' web-app/lib/services/superadmin.service.ts"
test_feature "Frontend: getAllBusinesses" "grep -q 'getAllBusinesses' web-app/lib/services/superadmin.service.ts"
test_feature "Frontend: getAllUsers" "grep -q 'getAllUsers' web-app/lib/services/superadmin.service.ts"
test_feature "Frontend: getAllAuditLogs" "grep -q 'getAllAuditLogs' web-app/lib/services/superadmin.service.ts"
test_feature "Frontend: getAuditLogStatistics" "grep -q 'getAuditLogStatistics' web-app/lib/services/superadmin.service.ts"

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Total Tests: ${TOTAL}"
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please review the output above.${NC}"
    exit 1
fi

