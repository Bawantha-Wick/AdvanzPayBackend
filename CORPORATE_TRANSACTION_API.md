# Corporate Transaction Management APIs

This document describes the two new APIs created for corporate transaction management.

## 1. Get All Transactions for Organization

**Endpoint:** `GET /api/corp/transactions`

**Description:** Retrieves all transactions for a specific corporate organization with pagination and filtering options.

### Query Parameters:

- `corpId` (required): The corporate organization ID
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of records per page (default: 10)
- `status` (optional): Filter by transaction status (`pending`, `completed`, `cancelled`, `failed`)
- `type` (optional): Filter by transaction type (`salary`, `bonus`, `withdrawal`, `goal_contribution`, `refund`)

### Example Request:

```
GET /api/corp/transactions?corpId=123&page=1&limit=10&status=pending&type=withdrawal
```

### Example Response:

```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "data": [
      {
        "id": 1,
        "title": "Salary Advance",
        "description": "Monthly salary advance request",
        "amount": 5000.0,
        "type": "withdrawal",
        "status": "pending",
        "verified": false,
        "referenceNumber": "REF123456",
        "notes": null,
        "employee": {
          "id": 101,
          "name": "John Doe",
          "email": "john.doe@company.com"
        },
        "bankAccount": {
          "id": 1,
          "accountNumber": "1234567890",
          "holderName": "John Doe",
          "bankName": "ABC Bank",
          "branch": "Main Branch"
        },
        "goal": null,
        "createdAt": "2025-01-15T10:30:00.000Z",
        "updatedAt": "2025-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  },
  "message": "Corporate transactions retrieved successfully"
}
```

## 2. Approve or Reject Transaction

**Endpoint:** `PUT /api/corp/transactions/approve-reject`

**Description:** Approves or rejects a pending transaction with a remark.

### Request Body:

```json
{
  "transactionId": 1,
  "action": "approve", // or "reject"
  "remark": "Approved after verification of documents"
}
```

### Parameters:

- `transactionId` (required): The ID of the transaction to approve/reject
- `action` (required): Either "approve" or "reject"
- `remark` (required): A comment explaining the decision

### Example Request:

```
PUT /api/corp/transactions/approve-reject
Content-Type: application/json

{
  "transactionId": 1,
  "action": "approve",
  "remark": "Approved after verification of employee documents and salary records"
}
```

### Example Response:

```json
{
  "status": true,
  "statusCode": 200,
  "data": {
    "transactionId": 1,
    "status": "completed",
    "verified": true,
    "notes": "Approved after verification of employee documents and salary records",
    "action": "approve",
    "updatedAt": "2025-01-15T11:45:00.000Z"
  },
  "message": "Transaction approved successfully"
}
```

## Error Responses

### 400 Bad Request

```json
{
  "status": false,
  "statusCode": 400,
  "message": "corpId is required"
}
```

### 404 Not Found

```json
{
  "status": false,
  "statusCode": 404,
  "message": "Corporate not found"
}
```

### 500 Internal Server Error

```json
{
  "status": false,
  "statusCode": 500,
  "message": "Internal server error"
}
```

## Business Rules

1. **Transaction Status Flow:**

   - Only `pending` transactions can be approved or rejected
   - Approved transactions get status `completed` and `verified: true`
   - Rejected transactions get status `cancelled` and `verified: false`

2. **Authorization:**

   - The APIs should be protected with appropriate authentication middleware
   - Only authorized corporate users should be able to access these endpoints

3. **Audit Trail:**
   - All approve/reject actions are logged with the user who performed the action
   - Remarks are stored in the `notes` field for audit purposes

## Implementation Notes

- The controller is located at: `src/controller/corporate/CorpTransactionController.ts`
- Routes are defined in: `src/routes/corporate.routes.ts`
- The APIs use the existing Transaction entity and related entities (CorpEmp, BankAccount, Goal)
- Proper error handling and validation are implemented
- Response formatting follows the existing application patterns
