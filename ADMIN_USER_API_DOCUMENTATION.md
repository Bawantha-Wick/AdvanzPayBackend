# Admin User and Admin User Role API Documentation

This document provides an overview of the newly created API endpoints for Admin User and Admin User Role management.

## Overview

Two new controllers have been created to manage admin users and their roles:

- **AdUserController**: Manages admin users (CRUD operations, authentication)
- **AdUserRoleController**: Manages admin user roles (CRUD operations)

## Base Paths

- **Admin User**: `/api/ad-user`
- **Admin User Role**: `/api/ad-user-role`

---

## Admin User Role Endpoints

### 1. Get All Active Roles (Dropdown)

**Endpoint**: `GET /api/ad-user-role/dd`  
**Description**: Retrieves all active admin user roles for dropdown/select components.  
**Response**:

```json
{
  "status": true,
  "code": "SUCCESS",
  "message": "Admin user roles retrieved successfully",
  "data": {
    "roles": [
      {
        "no": 1,
        "name": "Super Admin"
      }
    ]
  }
}
```

### 2. Get Roles (Paginated with Search)

**Endpoint**: `GET /api/ad-user-role?search=<query>&page=<page_number>`  
**Description**: Retrieves admin user roles with pagination and search functionality.  
**Query Parameters**:

- `search` (optional): Search by role name or description
- `page` (optional, default: 1): Page number

**Response**:

```json
{
  "status": true,
  "code": "SUCCESS",
  "message": "Admin user roles retrieved successfully",
  "data": {
    "pagination": {
      "page": 1,
      "total": 10,
      "pages": 1
    },
    "roles": [
      {
        "no": 1,
        "name": "Super Admin",
        "description": "Full system access",
        "permissions": "{...}",
        "status": "ACTV",
        "statusLabel": "Active"
      }
    ]
  }
}
```

### 3. Create Role

**Endpoint**: `POST /api/ad-user-role`  
**Description**: Creates a new admin user role.  
**Request Body**:

```json
{
  "name": "Content Manager",
  "description": "Manages content and articles",
  "permissions": "{\"dashboard\":true,\"content\":true}"
}
```

**Response**:

```json
{
  "status": true,
  "code": "SUCCESS",
  "message": "Admin user role created successfully",
  "data": {}
}
```

### 4. Update Role

**Endpoint**: `PUT /api/ad-user-role`  
**Description**: Updates an existing admin user role.  
**Request Body**:

```json
{
  "no": 1,
  "name": "Super Admin",
  "description": "Updated description",
  "permissions": "{\"dashboard\":true,\"content\":true}",
  "status": "ACTV"
}
```

**Response**:

```json
{
  "status": true,
  "code": "SUCCESS",
  "message": "Admin user role updated successfully",
  "data": {}
}
```

---

## Admin User Endpoints

### 1. Get Users (Paginated with Search)

**Endpoint**: `GET /api/ad-user?search=<query>&page=<page_number>`  
**Description**: Retrieves admin users with pagination and search functionality.  
**Query Parameters**:

- `search` (optional): Search by name, email, or mobile
- `page` (optional, default: 1): Page number

**Response**:

```json
{
  "status": true,
  "code": "SUCCESS",
  "message": "Admin users retrieved successfully",
  "data": {
    "pagination": {
      "page": 1,
      "total": 5,
      "pages": 1
    },
    "users": [
      {
        "no": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "mobile": "+1234567890",
        "isVerified": true,
        "status": "ACTV",
        "statusLabel": "Active",
        "role": 1,
        "roleLabel": "Super Admin"
      }
    ]
  }
}
```

### 2. Create User

**Endpoint**: `POST /api/ad-user`  
**Description**: Creates a new admin user (invitation flow).  
**Request Body**:

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "mobile": "+9876543210",
  "role": 1,
  "password": "SecurePass123!" // Optional, if not provided uses default
}
```

**Response**:

```json
{
  "status": true,
  "code": "SUCCESS",
  "message": "Admin user created successfully",
  "data": {}
}
```

**Note**: If no password is provided, a default password is set and `isVerified` is false. The user must use the signup endpoint to set their password.

### 3. Update User

**Endpoint**: `PUT /api/ad-user`  
**Description**: Updates an existing admin user.  
**Request Body**:

```json
{
  "no": 1,
  "name": "Jane Smith Updated",
  "email": "jane.updated@example.com",
  "mobile": "+9876543210",
  "role": 2,
  "status": "ACTV"
}
```

**Response**:

```json
{
  "status": true,
  "code": "SUCCESS",
  "message": "Admin user updated successfully",
  "data": {}
}
```

### 4. Login

**Endpoint**: `POST /api/ad-user/login`  
**Description**: Authenticates an admin user and returns JWT tokens.  
**Request Body**:

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response**:

```json
{
  "status": true,
  "code": "SUCCESS",
  "message": "Admin login successful",
  "data": {
    "id": 1,
    "username": "John Doe",
    "email": "john@example.com",
    "mobile": "+1234567890",
    "role": {
      "id": 1,
      "name": "Super Admin",
      "permissions": "{...}"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 5. Refresh Token

**Endpoint**: `POST /api/ad-user/refresh-token`  
**Description**: Refreshes the access token using a valid refresh token.  
**Request Body**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response**:

```json
{
  "status": true,
  "code": "SUCCESS",
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 6. Signup (For Invited Users)

**Endpoint**: `POST /api/ad-user/signup`  
**Description**: Allows invited users to set their password and activate their account.  
**Request Body**:

```json
{
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "conPassword": "SecurePass123!"
}
```

**Response**:

```json
{
  "status": true,
  "code": "SUCCESS",
  "message": "Admin signup successful",
  "data": {
    "id": 2,
    "username": "Jane Smith",
    "email": "jane@example.com",
    "mobile": "+9876543210",
    "role": {
      "id": 1,
      "name": "Content Manager",
      "permissions": "{...}"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 7. Toggle Status

**Endpoint**: `PUT /api/ad-user/toggle-status`  
**Description**: Toggles an admin user's status between Active and Inactive.  
**Request Body**:

```json
{
  "no": 1
}
```

**Response**:

```json
{
  "status": true,
  "code": "SUCCESS",
  "message": "Admin user status updated successfully",
  "data": {
    "status": "Inactive"
  }
}
```

---

## Status Values

The following status values are used throughout the API:

- **ACTV** (1): Active
- **INAC** (2): Inactive
- **BLKD** (3): Blocked

---

## Database Tables

### apt_ad_user_role

- `adUserRoleId` (PK): Auto-increment integer
- `adUserRoleName`: Role name (max 250 chars)
- `adUserRoleDescription`: Role description (max 1000 chars)
- `adUserRolePermission`: JSON string of permissions (longtext)
- `adUserRoleStatus`: ENUM (ACTIVE, INACTIVE, BLOCKED)
- `adUserRoleCreatedDate`: Timestamp
- `adUserRoleUpdatedDate`: Timestamp

### apt_ad_user

- `adUserId` (PK): Auto-increment integer
- `adUserName`: User's full name (max 250 chars)
- `adUserEmail`: Email address (max 500 chars, unique)
- `adUserPassword`: Hashed password (longtext)
- `adUserMobile`: Mobile number (max 20 chars, unique)
- `adUserStatus`: ENUM (ACTIVE, INACTIVE, BLOCKED)
- `adUserRoleId` (FK): Reference to apt_ad_user_role
- `adUserIsVerified`: Boolean (default: false)
- `adUserCreatedDate`: Timestamp
- `adUserUpdatedDate`: Timestamp

---

## Implementation Notes

1. **Password Hashing**: All passwords are hashed using bcrypt via the `hashPassword` helper function.

2. **Authentication**: JWT tokens are generated using the `createTokens` helper with user type 'ADMIN'.

3. **Pagination**: Default page limit is 10 items per page.

4. **Search**: Search functionality is implemented using SQL LIKE queries.

5. **Unique Constraints**: Email and mobile are unique together in the database.

6. **Invitation Flow**:

   - Admin creates user without password → user receives invitation
   - User uses signup endpoint with email and password to activate account
   - After signup, user is marked as verified and can login

7. **Status Toggle**: Toggles only between ACTIVE and INACTIVE states (not BLOCKED).

---

## Error Codes

Common error responses:

- **400**: Bad Request (missing required fields)
- **401**: Unauthorized (invalid credentials or token)
- **404**: Not Found (user/role not found)
- **409**: Conflict (duplicate email/mobile/name)
- **500**: Internal Server Error

---

## Files Created

1. `/src/controller/admin/AdUserRoleController.ts`
2. `/src/controller/admin/AdUserController.ts`
3. `/src/routes/adUserRole.routes.ts`
4. `/src/routes/adUser.routes.ts`

## Files Modified

1. `/src/routes.ts` - Added imports and route registrations for the new endpoints
