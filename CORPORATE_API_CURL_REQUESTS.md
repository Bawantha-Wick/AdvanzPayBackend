# Corporate API - cURL Requests

This document contains all the cURL requests for the Corporate Management APIs.

---

## 🏢 Corporate Management APIs

### 1. GET - List All Corporates (with pagination)

Get a paginated list of all corporate organizations.

```bash
curl -X GET "http://localhost:3000/api/v1/corp?page=1&limit=10" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Response Example:**

```json
{
  "corporates": [
    {
      "corpId": 1,
      "corpName": "Tech Solutions Inc",
      "corpRegAddress": "123 Business Street, Tech City, TC 12345",
      "corpRegId": "REG-2024-001",
      "corpPayDay": 25,
      "corpConPsnName": "John Doe",
      "corpConPsnTitle": "HR Manager",
      "corpEmailDomain": "techsolutions.com",
      "corpConPsnEmail": "john.doe@techsolutions.com",
      "corpConPsnMobile": "+1234567890",
      "corpSalAdzMinAmt": 5000.0,
      "corpSalAdzMaxAmt": 50000.0,
      "corpSalAdzPercent": 15.0,
      "corpSalAdzCapAmt": 7500.0,
      "corpMaxEwaPercent": 60,
      "corpAdhocTransFee": 4.5,
      "corpEnableAutoApproval": true,
      "corpManualWithdrawalFee": 2.5,
      "corpAutoWithdrawalFee": 1.5,
      "corpAccountStatus": true,
      "corpApproveStatus": true,
      "corpStatus": "ACTV",
      "corpCreatedBy": 1,
      "corpLastUpdatedBy": 1,
      "corpCreatedDate": "2024-12-01T10:00:00.000Z",
      "corpLastUpdatedDate": "2024-12-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

---

### 2. POST - Create New Corporate

Create a new corporate organization with all details.

**Full Request (All Fields):**

```bash
curl -X POST "http://localhost:3000/api/v1/corp" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "corpName": "Tech Solutions Inc",
    "corpRegAddress": "123 Business Street, Tech City, TC 12345",
    "corpRegId": "REG-2024-001",
    "corpPayDay": 25,
    "corpConPsnName": "John Doe",
    "corpConPsnTitle": "HR Manager",
    "corpEmailDomain": "techsolutions.com",
    "corpConPsnEmail": "john.doe@techsolutions.com",
    "corpConPsnMobile": "+1234567890",
    "corpSalAdzMinAmt": 5000.00,
    "corpSalAdzMaxAmt": 50000.00,
    "corpSalAdzPercent": 15.00,
    "corpSalAdzCapAmt": 7500.00,
    "corpMaxEwaPercent": 60,
    "corpAdhocTransFee": 4.50,
    "corpEnableAutoApproval": true,
    "corpManualWithdrawalFee": 2.50,
    "corpAutoWithdrawalFee": 1.50,
    "corpAccountStatus": true,
    "corpApproveStatus": true
  }'
```

**Minimal Request (Required Fields Only):**

```bash
curl -X POST "http://localhost:3000/api/v1/corp" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "corpName": "Tech Solutions Inc",
    "corpRegAddress": "123 Business Street, Tech City, TC 12345",
    "corpRegId": "REG-2024-001",
    "corpPayDay": 25,
    "corpConPsnName": "John Doe",
    "corpConPsnTitle": "HR Manager",
    "corpEmailDomain": "techsolutions.com",
    "corpConPsnEmail": "john.doe@techsolutions.com",
    "corpConPsnMobile": "+1234567890"
  }'
```

**Field Descriptions:**

| Field                     | Type    | Required | Default | Description                      |
| ------------------------- | ------- | -------- | ------- | -------------------------------- |
| `corpName`                | string  | Yes      | -       | Corporate name                   |
| `corpRegAddress`          | string  | Yes      | -       | Registered address               |
| `corpRegId`               | string  | Yes      | -       | Registration ID (must be unique) |
| `corpPayDay`              | number  | Yes      | -       | Pay day (1-31)                   |
| `corpConPsnName`          | string  | Yes      | -       | Contact person name              |
| `corpConPsnTitle`         | string  | Yes      | -       | Contact person job title         |
| `corpEmailDomain`         | string  | Yes      | -       | Email domain                     |
| `corpConPsnEmail`         | string  | Yes      | -       | Contact person email             |
| `corpConPsnMobile`        | string  | Yes      | -       | Contact person mobile            |
| `corpSalAdzMinAmt`        | number  | No       | 10000   | Minimum salary amount            |
| `corpSalAdzMaxAmt`        | number  | No       | 10000   | Maximum salary amount            |
| `corpSalAdzPercent`       | number  | No       | 10000   | Salary percentage                |
| `corpSalAdzCapAmt`        | number  | No       | 10000   | Salary cap amount                |
| `corpMaxEwaPercent`       | number  | No       | 51      | Max EWA percentage (0-100)       |
| `corpAdhocTransFee`       | number  | No       | 5.00    | Adhoc transaction fee            |
| `corpEnableAutoApproval`  | boolean | No       | true    | Enable auto approval             |
| `corpManualWithdrawalFee` | number  | No       | 3.00    | Manual withdrawal fee            |
| `corpAutoWithdrawalFee`   | number  | No       | 2.00    | Automated withdrawal fee         |
| `corpAccountStatus`       | boolean | No       | true    | Account status                   |
| `corpApproveStatus`       | boolean | No       | true    | Approval status                  |

---

### 3. PUT - Update Corporate

Update an existing corporate organization. Only include fields you want to update.

**Full Update:**

```bash
curl -X PUT "http://localhost:3000/api/v1/corp" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "id": 1,
    "corpName": "Tech Solutions Ltd Updated",
    "corpRegAddress": "456 New Business Avenue, Tech City, TC 54321",
    "corpRegId": "REG-2024-001-UPD",
    "corpPayDay": 28,
    "corpConPsnName": "Jane Smith",
    "corpConPsnTitle": "Chief HR Officer",
    "corpEmailDomain": "techsolutions.com",
    "corpConPsnEmail": "jane.smith@techsolutions.com",
    "corpConPsnMobile": "+1987654321",
    "corpSalAdzMinAmt": 6000.00,
    "corpSalAdzMaxAmt": 60000.00,
    "corpSalAdzPercent": 20.00,
    "corpSalAdzCapAmt": 12000.00,
    "corpMaxEwaPercent": 70,
    "corpAdhocTransFee": 5.00,
    "corpEnableAutoApproval": false,
    "corpManualWithdrawalFee": 3.00,
    "corpAutoWithdrawalFee": 2.00,
    "corpAccountStatus": true,
    "corpApproveStatus": false,
    "corpStatus": "ACTV"
  }'
```

**Partial Update (Specific Fields):**

```bash
curl -X PUT "http://localhost:3000/api/v1/corp" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "id": 1,
    "corpMaxEwaPercent": 75,
    "corpEnableAutoApproval": true,
    "corpAdhocTransFee": 4.00
  }'
```

**Update Status Only:**

```bash
curl -X PUT "http://localhost:3000/api/v1/corp" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "id": 1,
    "corpStatus": "INAC"
  }'
```

**Status Values:**

- `ACTV` - Active
- `INAC` - Inactive
- `BLCK` - Blocked

---

### 4. GET - Corporate Analytics

Get detailed analytics for a corporate organization including:

- Number of employees
- Total withdrawal amount
- Withdrawal request count
- Total liability
- Daily withdrawals (for date range)
- Monthly liabilities (past 6 months)

**Basic Analytics:**

```bash
curl -X GET "http://localhost:3000/api/v1/corp/analytics?corpId=1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**With Custom Date Range:**

```bash
curl -X GET "http://localhost:3000/api/v1/corp/analytics?corpId=1&from=2024-11-01&to=2024-11-30" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Query Parameters:**

- `corpId` (required): Corporate ID
- `from` (optional): Start date (YYYY-MM-DD) - defaults to 30 days ago
- `to` (optional): End date (YYYY-MM-DD) - defaults to today

**Response Example:**

```json
{
  "employeeCount": 150,
  "totalWithdrawalAmount": 45000.5,
  "withdrawalRequestCount": 320,
  "totalLiability": 75000.0,
  "dailyWithdrawals": [
    {
      "date": "2024-11-01",
      "amount": 1500.0
    },
    {
      "date": "2024-11-02",
      "amount": 2300.5
    }
  ],
  "monthlyLiabilities": [
    {
      "billingMonth": "2024-Jun",
      "type": "Invoice",
      "lastDate": "2024.06.30",
      "totalLiability": 68000.0,
      "balance": 12000.0
    },
    {
      "billingMonth": "2024-Jul",
      "type": "Invoice",
      "lastDate": "2024.07.31",
      "totalLiability": 70000.0,
      "balance": 8500.0
    }
  ]
}
```

---

## 📊 Employee & Time Log Management

### 5. POST - Upload Employees (Excel)

Upload employees in bulk using an Excel file.

```bash
curl -X POST "http://localhost:3000/api/v1/corp/upload-employees" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/employees.xlsx" \
  -F "corpId=1"
```

**Form Data:**

- `file`: Excel file (.xlsx)
- `corpId`: Corporate ID

---

### 6. GET - Download Employee Template

Download an Excel template for bulk employee upload.

```bash
curl -X GET "http://localhost:3000/api/v1/corp/employee-template" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -o employee_template.xlsx
```

This will save the template as `employee_template.xlsx` in your current directory.

---

### 7. POST - Bulk Create Employees

Create multiple employees at once using JSON.

```bash
curl -X POST "http://localhost:3000/api/v1/corp/employees/bulk-create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "corpId": 1,
    "employees": [
      {
        "employeeName": "Alice Johnson",
        "employeeEmail": "alice@techsolutions.com",
        "employeeMobile": "+1111111111",
        "employeeId": "EMP001",
        "department": "Engineering"
      },
      {
        "employeeName": "Bob Wilson",
        "employeeEmail": "bob@techsolutions.com",
        "employeeMobile": "+2222222222",
        "employeeId": "EMP002",
        "department": "Marketing"
      },
      {
        "employeeName": "Carol Davis",
        "employeeEmail": "carol@techsolutions.com",
        "employeeMobile": "+3333333333",
        "employeeId": "EMP003",
        "department": "Sales"
      }
    ]
  }'
```

---

### 8. GET - Get Time Logs

Retrieve employee time logs for a specific date range.

```bash
curl -X GET "http://localhost:3000/api/v1/corp/time-logs?corpId=1&from=2024-12-01&to=2024-12-31" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Query Parameters:**

- `corpId` (required): Corporate ID
- `from` (required): Start date (YYYY-MM-DD)
- `to` (required): End date (YYYY-MM-DD)

---

### 9. POST - Bulk Create Employee Time Logs

Create time logs for multiple employees.

```bash
curl -X POST "http://localhost:3000/api/v1/corp/employee-time-logs/bulk-create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "corpId": 1,
    "timeLogs": [
      {
        "employeeId": 101,
        "date": "2024-12-02",
        "hoursWorked": 8.5,
        "overtimeHours": 1.0,
        "breakHours": 0.5
      },
      {
        "employeeId": 102,
        "date": "2024-12-02",
        "hoursWorked": 9.0,
        "overtimeHours": 1.5,
        "breakHours": 0.5
      }
    ]
  }'
```

---

## 💰 Transaction Management

### 10. GET - Get Transactions

Get all transactions for a corporate organization.

```bash
curl -X GET "http://localhost:3000/api/v1/corp/transactions?corpId=1&page=1&limit=20" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**With Filters:**

```bash
curl -X GET "http://localhost:3000/api/v1/corp/transactions?corpId=1&page=1&limit=20&status=pending&from=2024-12-01&to=2024-12-31" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Query Parameters:**

- `corpId` (required): Corporate ID
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Transaction status (pending, approved, rejected)
- `from` (optional): Start date
- `to` (optional): End date

---

### 11. GET - Get Transactions by Employee

Get all transactions for a specific employee.

```bash
curl -X GET "http://localhost:3000/api/v1/corp/transactions/employee/101" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**With Pagination:**

```bash
curl -X GET "http://localhost:3000/api/v1/corp/transactions/employee/101?page=1&limit=10" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 12. PUT - Approve/Reject Transaction

Approve or reject a withdrawal transaction.

**Approve Transaction:**

```bash
curl -X PUT "http://localhost:3000/api/v1/corp/transactions/approve-reject" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "transactionId": 123,
    "status": "approved",
    "remarks": "Approved by HR Manager - all documents verified"
  }'
```

**Reject Transaction:**

```bash
curl -X PUT "http://localhost:3000/api/v1/corp/transactions/approve-reject" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "transactionId": 124,
    "status": "rejected",
    "remarks": "Insufficient documentation provided"
  }'
```

---

## 🔧 Configuration & Notes

### Base URL Configuration

Replace the base URL in all requests based on your environment:

- **Local Development**: `http://localhost:3000`
- **Staging**: `https://staging-api.advanzpay.com`
- **Production**: `https://api.advanzpay.com`

### API Base Path

The default API base path is `/api/v1` (configured in `API_BASE_PATH` environment variable).

### Authentication

All endpoints require JWT authentication. Include the access token in the Authorization header:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

To get an access token, authenticate through the auth endpoints first.

### Error Responses

All endpoints return standardized error responses:

```json
{
  "status": false,
  "statusCode": 400,
  "message": "Error message here"
}
```

Common status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict (duplicate record)
- `500` - Internal Server Error

### Testing Tips

1. **Use environment variables** for the base URL and token:

   ```bash
   export API_URL="http://localhost:3000/api/v1"
   export TOKEN="your_access_token_here"

   curl -X GET "$API_URL/corp?page=1&limit=10" \
     -H "Authorization: Bearer $TOKEN"
   ```

2. **Save responses to files** for inspection:

   ```bash
   curl -X GET "$API_URL/corp?page=1&limit=10" \
     -H "Authorization: Bearer $TOKEN" \
     -o response.json
   ```

3. **Use verbose mode** for debugging:
   ```bash
   curl -v -X GET "$API_URL/corp?page=1&limit=10" \
     -H "Authorization: Bearer $TOKEN"
   ```

---

## 📝 Quick Reference

| Method | Endpoint                               | Description                |
| ------ | -------------------------------------- | -------------------------- |
| GET    | `/corp`                                | List all corporates        |
| POST   | `/corp`                                | Create corporate           |
| PUT    | `/corp`                                | Update corporate           |
| GET    | `/corp/analytics`                      | Get analytics              |
| POST   | `/corp/upload-employees`               | Upload employees (Excel)   |
| GET    | `/corp/employee-template`              | Download template          |
| POST   | `/corp/employees/bulk-create`          | Bulk create employees      |
| GET    | `/corp/time-logs`                      | Get time logs              |
| POST   | `/corp/employee-time-logs/bulk-create` | Bulk create time logs      |
| GET    | `/corp/transactions`                   | Get transactions           |
| GET    | `/corp/transactions/employee/:id`      | Get employee transactions  |
| PUT    | `/corp/transactions/approve-reject`    | Approve/reject transaction |

---

**Last Updated**: December 2, 2025
**API Version**: v1
