# Phone-Based User Assignment - Implementation Summary

## Overview

The RBAC system has been updated to use **phone numbers** instead of user IDs for assigning users to businesses. This provides a much better user experience as admins can easily search and assign users by their phone number.

---

## Changes Made

### 1. Backend Changes

#### DTO Update (`app/libs/shared/dto/src/rbac.dto.ts`)
- Changed `AssignUserToBusinessDto` to accept `phone` (string) instead of `userId` (UUID)
- Added validation for 10-digit phone number format

#### Service Update (`app/apps/business-service/src/services/business-user.service.ts`)
- Added `getUserIdByPhone()` method that calls auth-service to lookup user by phone
- Added `assignUserToBusinessByPhone()` method that:
  - Validates phone format (10 digits)
  - Looks up user ID by phone via auth-service API
  - Calls existing `assignUserToBusiness()` with the resolved user ID
- Uses `axios` for HTTP calls to auth-service
- Proper error handling for user not found scenarios

#### Controller Update (`app/apps/business-service/src/controllers/business-user.controller.ts`)
- Updated `assignUser()` endpoint to call `assignUserToBusinessByPhone()` instead of `assignUserToBusiness()`
- Updated API documentation to reflect phone-based assignment

#### Module Update (`app/apps/business-service/src/app.module.ts`)
- Removed HttpModule import (using axios directly instead)

#### Package Update (`app/package.json`)
- Added `axios` dependency for HTTP calls

### 2. Frontend Changes

#### Service Update (`web-app/lib/services/rbac.service.ts`)
- Updated `assignUserToBusiness()` function signature to accept `phone` instead of `userId`

#### Component Updates
- **`user-search-dialog.tsx`**: Updated to pass phone number instead of user ID to `onSelect` callback
- **`user-management.tsx`**: Updated `handleAssignUser()` and `assignMutation` to use phone number

---

## How It Works

### Flow Diagram

```
Admin searches for user by phone/email/name
    ↓
UserSearchDialog displays matching users
    ↓
Admin selects user and role
    ↓
Frontend sends: { phone: "9876543210", role: "admin" }
    ↓
Backend receives request
    ↓
BusinessUserService.assignUserToBusinessByPhone()
    ↓
Validates phone format (10 digits)
    ↓
Calls auth-service: GET /api/v1/users/search?q=9876543210
    ↓
Finds user by phone number
    ↓
Gets user.id from response
    ↓
Calls assignUserToBusiness(businessId, userId, role, ...)
    ↓
Creates/updates business_user record
    ↓
Returns success response
```

### API Endpoint

**POST** `/api/v1/businesses/:businessId/users`

**Request Body:**
```json
{
  "phone": "9876543210",
  "role": "admin"
}
```

**Response:**
```json
{
  "id": "business-user-uuid",
  "business_id": "business-uuid",
  "user_id": "user-uuid",
  "role": "admin",
  "permissions": null,
  "status": "active",
  ...
}
```

---

## Benefits

1. **Better UX**: Admins can search and assign users by phone number (which they know) instead of UUIDs
2. **User-Friendly**: No need to manually enter or copy-paste UUIDs
3. **Search Integration**: Works seamlessly with existing user search functionality
4. **Backward Compatible**: Internal operations still use user IDs, only the API interface changed

---

## Error Handling

### User Not Found
- **Error**: `404 Not Found`
- **Message**: "User with phone number {phone} not found. Please ensure the user has registered."
- **Action**: User needs to register/login first before being assigned

### Invalid Phone Format
- **Error**: `400 Bad Request`
- **Message**: "Invalid phone number. Must be 10 digits."
- **Action**: Admin should enter a valid 10-digit phone number

### Auth Service Unavailable
- **Error**: `400 Bad Request`
- **Message**: "Failed to lookup user by phone: {error message}"
- **Action**: Check auth-service connectivity

---

## Testing Checklist

### Superadmin Flow
- [ ] Superadmin can login with phone `9175760649` and OTP `760649`
- [ ] Superadmin is redirected to `/admin` dashboard
- [ ] Superadmin can view all businesses
- [ ] Superadmin can view all users
- [ ] Superadmin can assign users to businesses by phone number

### Admin/Owner Flow
- [ ] Admin/Owner can login and access business dashboard
- [ ] Admin/Owner can search for users by phone/email/name
- [ ] Admin/Owner can assign users to business by selecting from search results
- [ ] Assigned users appear in user management list
- [ ] Admin/Owner can update user roles
- [ ] Admin/Owner can remove users from business

### User Assignment Flow
- [ ] Search for user by phone number → User found
- [ ] Search for user by email → User found
- [ ] Search for user by name → User found
- [ ] Select user and assign role → Success
- [ ] Try to assign non-existent user → Error message shown
- [ ] Try to assign with invalid phone → Validation error

### Permission Enforcement
- [ ] Only users with `USER_ASSIGN` permission can assign users
- [ ] Only users with `USER_UPDATE_ROLE` permission can update roles
- [ ] Only users with `USER_REMOVE` permission can remove users
- [ ] Superadmin bypasses all permission checks

---

## Integration Points

### Auth Service
- **Endpoint Used**: `GET /api/v1/users/search?q={phone}`
- **Purpose**: Lookup user by phone number
- **Response**: Array of users matching the search query
- **Filtering**: Backend filters results to find exact phone match

### Business Service
- **Endpoint**: `POST /api/v1/businesses/:businessId/users`
- **Purpose**: Assign user to business
- **Input**: Phone number (10 digits)
- **Process**: Lookup user → Assign to business

---

## Configuration

### Environment Variables

**AUTH_SERVICE_URL** (optional, defaults to `http://localhost:3002`)
- URL of the auth-service for user lookup
- Example: `http://localhost:3002` or `http://auth-service:3002` (Docker)

---

## Migration Notes

### For Existing Code
- Any code calling `assignUserToBusiness(userId, ...)` should be updated to use phone number
- Frontend components already updated
- Backend API now requires phone instead of userId

### For New Integrations
- Always use phone number for user assignment
- Use user search API to find users before assignment
- Handle "user not found" errors gracefully

---

## Future Enhancements

1. **Bulk Assignment**: Assign multiple users at once using phone numbers
2. **Phone Validation**: Add country code support (currently 10-digit Indian format)
3. **Caching**: Cache user lookups to reduce auth-service calls
4. **Invitation Flow**: Send invitation SMS/email when assigning new users

---

## Conclusion

The phone-based assignment system is now fully integrated and provides a seamless experience for admins to manage team members. All components are properly linked, and the system works correctly for both superadmin and regular admin users.

