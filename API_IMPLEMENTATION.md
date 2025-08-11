# AdvanzPay Backend - New API Implementation

This document outlines all the new APIs that have been implemented based on the provided API documentation.

## Overview

The following controllers and routes have been created to match the API specifications:

1. **Authentication Controller** - Handles login, signup, password reset, OTP verification
2. **User Profile Controller** - Manages user profile information
3. **Dashboard Controller** - Provides dashboard data and recent transactions
4. **Bank Account Controller** - Manages user bank accounts
5. **Goal Controller** - Handles savings goals management
6. **Transaction Controller** - Provides transaction history and search
7. **Withdrawal Controller** - Manages withdrawal requests

## New Entities Created

### 1. BankAccount Entity

- `bankAccountId` (Primary Key)
- `corpEmpId` (Foreign Key to CorpEmp)
- `accountNumber`, `holderName`, `bankName`, `branch`
- `nickname`, `isDefault`, `isActive`
- Status and audit fields

### 2. Goal Entity

- `goalId` (Primary Key)
- `corpEmpId` (Foreign Key to CorpEmp)
- `accountId` (Foreign Key to BankAccount)
- `name`, `targetAmount`, `currentAmount`
- `startDate`, `endDate`, `category`
- `color`, `icon`, `repeat`
- Status and audit fields

### 3. Transaction Entity

- `transactionId` (Primary Key)
- `corpEmpId` (Foreign Key to CorpEmp)
- `bankAccountId` (Foreign Key to BankAccount)
- `goalId` (Foreign Key to Goal)
- `title`, `description`, `amount`
- `type` (SALARY, BONUS, WITHDRAWAL, etc.)
- `status` (PENDING, COMPLETED, CANCELLED, FAILED)
- `verified`, `referenceNumber`, `notes`
- Audit fields

### 4. Withdrawal Entity

- `withdrawalId` (Primary Key)
- `corpEmpId` (Foreign Key to CorpEmp)
- `bankAccountId` (Foreign Key to BankAccount)
- `amount`, `purpose`, `status`
- `notes`, `referenceNumber`
- `processedAt`, `rejectionReason`
- Audit fields

### 5. PasswordResetOtp Entity

- `otpId` (Primary Key)
- `email`, `otpCode`, `expiresAt`
- `status`, `isUsed`
- Audit fields

## API Endpoints Implemented

### Authentication APIs (`/v1/auth`)

- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/verify-otp` - Verify OTP
- `POST /auth/resend-otp` - Resend OTP
- `POST /auth/reset-password` - Reset password
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh access token
- `POST /auth/change-password` - Change current password

### User Profile APIs (`/v1/user`)

- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile

### Dashboard APIs (`/v1/dashboard`)

- `GET /dashboard` - Get dashboard data
- `GET /dashboard/recent-transactions` - Get recent transactions

### Bank Account APIs (`/v1/bank-accounts`)

- `GET /bank-accounts` - Get all bank accounts
- `GET /bank-accounts/:id` - Get specific bank account
- `POST /bank-accounts` - Create new bank account
- `PUT /bank-accounts/:id` - Update bank account
- `DELETE /bank-accounts/:id` - Delete bank account
- `PUT /bank-accounts/:id/set-default` - Set default account

### Goals APIs (`/v1/goals`)

- `GET /goals` - Get all goals
- `GET /goals/:id` - Get specific goal
- `POST /goals` - Create new goal
- `PUT /goals/:id` - Update goal
- `DELETE /goals/:id` - Delete goal
- `GET /goals/priority` - Get priority goals
- `PUT /goals/:id/progress` - Update goal progress

### Transaction APIs (`/v1/transactions`)

- `GET /transactions` - Get paginated transactions
- `GET /transactions/:id` - Get specific transaction
- `GET /transactions/recent` - Get recent transactions
- `GET /transactions/search` - Search transactions

### Withdrawal APIs (`/v1/withdrawals`)

- `POST /withdrawals` - Create withdrawal request
- `GET /withdrawals` - Get paginated withdrawals
- `GET /withdrawals/:id` - Get specific withdrawal
- `PUT /withdrawals/:id/cancel` - Cancel withdrawal
- `GET /withdrawals/limits` - Get withdrawal limits

## Features Implemented

### Authentication System

- JWT-based authentication with access and refresh tokens
- OTP-based password reset system
- Email domain-based corporate signup
- Password hashing and verification

### Dashboard Analytics

- Monthly earnings calculation
- Available withdrawal amount calculation
- Recent transaction summary
- Attendance cycle tracking

### Bank Account Management

- Multiple bank account support
- Default account setting
- Account validation and duplicate prevention
- Soft delete functionality

### Goals Management

- Category-based goal creation with auto-assigned colors and icons
- Progress tracking with contribution updates
- Priority goal identification based on deadlines and progress
- Goal completion detection

### Transaction System

- Comprehensive transaction history
- Transaction search and filtering
- Multiple transaction types support
- Status tracking and verification

### Withdrawal System

- Withdrawal request creation with validation
- Available balance calculation
- Reference number generation
- Status management (pending, completed, cancelled)
- Withdrawal limits configuration

## Database Schema Updates

All new entities have been added to the entity index file and will be automatically created by TypeORM migrations.

## Helper Functions Created

### OTP Generation

- `generatePasswordResetCode()` - Generates 6-digit OTP codes

### Response Management

- Updated response constants with new message types
- Comprehensive error handling across all controllers

## Security Features

### Input Validation

- Required field validation
- Amount validation for withdrawals
- Date validation for goals
- Email format validation

### Authorization

- User-specific data access (users can only access their own data)
- JWT token validation (commented middleware placeholders)
- Soft delete implementation for data integrity

## Configuration

### Withdrawal Limits

- Minimum withdrawal: $50
- Maximum withdrawal: $5000
- Dynamic available balance calculation

### Goal Categories

Predefined categories with colors and icons:

- Emergency (Red, Shield)
- Travel (Teal, Plane)
- Education (Blue, Book)
- House (Green, Home)
- Car (Yellow, Car)
- Retirement (Purple, Piggy Bank)
- Other (Gray, Target)

## Next Steps

1. **Add Authentication Middleware**: Uncomment and implement JWT middleware for protected routes
2. **Add Validation Middleware**: Implement request body validation
3. **Add Email Service**: Implement actual email sending for OTP functionality
4. **Add Rate Limiting**: Implement rate limiting for authentication endpoints
5. **Add Logging**: Implement comprehensive logging system
6. **Add Tests**: Create unit and integration tests for all endpoints
7. **Add API Documentation**: Generate Swagger/OpenAPI documentation

## File Structure

```
src/
├── controller/
│   ├── auth/AuthController.ts
│   ├── user/UserController.ts
│   ├── dashboard/DashboardController.ts
│   ├── bankAccount/BankAccountController.ts
│   ├── goal/GoalController.ts
│   ├── transaction/TransactionController.ts
│   └── withdrawal/WithdrawalController.ts
├── entity/
│   ├── BankAccount.ts
│   ├── Goal.ts
│   ├── Transaction.ts
│   ├── Withdrawal.ts
│   └── PasswordResetOtp.ts
├── routes/
│   ├── auth.routes.ts
│   ├── userProfile.routes.ts
│   ├── dashboard.routes.ts
│   ├── bankAccount.routes.ts
│   ├── goal.routes.ts
│   ├── transaction.routes.ts
│   └── withdrawal.routes.ts
└── helper/
    └── user/generateOtpCode.ts
```

All APIs follow the same response format and error handling patterns as the existing codebase, ensuring consistency and maintainability.
