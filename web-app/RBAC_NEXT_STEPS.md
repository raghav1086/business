# RBAC Next Steps - Implementation Plan

## Priority 1: Backend User Search & Lookup (Critical)

### 1.1 User Search Endpoint
**Problem:** Frontend has user search UI but no backend endpoint
**Solution:** Add `GET /api/v1/users/search?q={query}` endpoint
- Search by phone number (exact match or partial)
- Search by email (exact match or partial)
- Search by name (partial match)
- Return limited results (max 10-20)
- Only return active users

### 1.2 Get User by ID Endpoint
**Problem:** Frontend needs to fetch user details by ID
**Solution:** Add `GET /api/v1/users/:userId` endpoint
- Return user profile (name, phone, email, avatar)
- Protected endpoint (requires auth)
- Used for displaying user details in business user list

### 1.3 Enhance Business Users Response
**Problem:** Business users endpoint only returns user_id, not user details
**Solution:** Option A - Join user data in backend response
- Modify `getBusinessUsers` to include user details
- Return enriched response with user name, phone, email

**Solution:** Option B - Frontend fetches separately (current approach)
- Keep current approach but optimize with batch fetching
- Cache user details

## Priority 2: Enhanced Features

### 2.1 User Details Modal/Sheet
- Expandable user detail view
- Show all businesses user belongs to
- Show permission summary
- Activity timeline
- Contact information

### 2.2 Bulk Actions
- Select multiple users
- Bulk role update
- Bulk permission changes
- Bulk remove (with confirmation)

### 2.3 Export Functionality
- Export audit logs to CSV
- Export user list to Excel
- Export permission matrix

### 2.4 Advanced Filtering
- Filter users by role
- Filter users by status
- Filter audit logs by date presets (Today, This Week, This Month)

## Priority 3: Performance & Optimization

### 3.1 Batch User Details Fetching
- Fetch multiple user details in one request
- Reduce API calls when displaying user list

### 3.2 Caching Strategy
- Cache user details
- Cache permissions list
- Cache business users

### 3.3 Pagination
- Add pagination to user list
- Add pagination to audit logs
- Virtual scrolling for large lists

## Implementation Order

1. **User Search Endpoint** (Backend) - Most critical for UX
2. **Get User by ID Endpoint** (Backend) - Needed for user display
3. **User Details Modal** (Frontend) - Nice to have
4. **Bulk Actions** (Frontend) - Efficiency feature
5. **Export Functionality** (Frontend) - Reporting feature

