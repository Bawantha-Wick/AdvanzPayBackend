# Admin Analytics API Documentation

This document describes the Admin Analytics API endpoints for retrieving dashboard statistics and analytics data.

## Overview

The Admin Analytics API provides comprehensive dashboard metrics and analytics for the AdvanzPay administrative system, including:

- Account balances
- Corporate and employee counts
- Withdrawal request statistics
- Disbursement totals
- Trends and activity feeds

## Base URL

```
/api/admin/analytics
```

## Authentication

All analytics endpoints require admin authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <admin_jwt_token>
```

---

## Endpoints

### 1. Get Dashboard Analytics

Get high-level dashboard metrics matching the dashboard UI.

**Endpoint:** `GET /admin/analytics/dashboard`

**Response:**

```json
{
  "statusCode": 200,
  "status": true,
  "responseCode": "SUCCESS",
  "message": "Dashboard analytics retrieved successfully",
  "data": {
    "accountBalance": 0.0,
    "totalCorporates": 40,
    "totalEmployees": 9,
    "totalRequests": 40,
    "totalDisbursed": 0.0
  }
}
```

**Response Fields:**

- `accountBalance` (number): Total system account balance (to be implemented based on business logic)
- `totalCorporates` (number): Count of active corporate clients
- `totalEmployees` (number): Count of active employees across all corporates
- `totalRequests` (number): Total number of withdrawal requests (all statuses)
- `totalDisbursed` (number): Total amount disbursed (completed withdrawals only)

**Example Request:**

```bash
curl --location 'http://localhost:3000/api/admin/analytics/dashboard' \
--header 'Authorization: Bearer YOUR_ADMIN_JWT_TOKEN'
```

---

### 2. Get Analytics Overview

Get detailed analytics with breakdowns by status and time period.

**Endpoint:** `GET /admin/analytics/overview`

**Query Parameters:**

- `startDate` (optional): Start date for the analysis period (ISO 8601 format)
- `endDate` (optional): End date for the analysis period (ISO 8601 format)
- Default: Current month if not specified

**Response:**

```json
{
  "statusCode": 200,
  "status": true,
  "responseCode": "SUCCESS",
  "message": "Analytics overview retrieved successfully",
  "data": {
    "dateRange": {
      "start": "2025-12-01T00:00:00.000Z",
      "end": "2025-12-03T12:00:00.000Z"
    },
    "corporates": {
      "total": 45,
      "active": 40,
      "inactive": 5
    },
    "employees": {
      "total": 150,
      "active": 120,
      "inactive": 30
    },
    "requests": {
      "total": 85,
      "pending": 25,
      "approved": 50,
      "rejected": 10
    },
    "disbursements": {
      "totalAmount": 125000.5,
      "totalCount": 50,
      "averageAmount": 2500.01,
      "periodStart": "2025-12-01T00:00:00.000Z",
      "periodEnd": "2025-12-03T12:00:00.000Z"
    }
  }
}
```

**Example Request:**

```bash
curl --location 'http://localhost:3000/api/admin/analytics/overview?startDate=2025-12-01&endDate=2025-12-31' \
--header 'Authorization: Bearer YOUR_ADMIN_JWT_TOKEN'
```

---

### 3. Get Recent Activity

Get recent withdrawal requests and activities.

**Endpoint:** `GET /admin/analytics/recent-activity`

**Query Parameters:**

- `limit` (optional): Number of activities to return (default: 10)

**Response:**

```json
{
  "statusCode": 200,
  "status": true,
  "responseCode": "SUCCESS",
  "message": "Recent activity retrieved successfully",
  "data": {
    "activities": [
      {
        "id": 123,
        "type": "withdrawal_request",
        "employeeName": "John Doe",
        "employeeEmail": "john.doe@company.com",
        "amount": 5000.0,
        "status": "pending",
        "purpose": "emergency",
        "createdAt": "2025-12-03T10:30:00.000Z"
      },
      {
        "id": 122,
        "type": "withdrawal_request",
        "employeeName": "Jane Smith",
        "employeeEmail": "jane.smith@company.com",
        "amount": 3000.0,
        "status": "completed",
        "purpose": "personal",
        "createdAt": "2025-12-03T09:15:00.000Z"
      }
    ]
  }
}
```

**Example Request:**

```bash
curl --location 'http://localhost:3000/api/admin/analytics/recent-activity?limit=20' \
--header 'Authorization: Bearer YOUR_ADMIN_JWT_TOKEN'
```

---

### 4. Get Trends Data

Get daily trends for withdrawals and employee registrations.

**Endpoint:** `GET /admin/analytics/trends`

**Query Parameters:**

- `period` (optional): Number of days to include (default: 30)

**Response:**

```json
{
  "statusCode": 200,
  "status": true,
  "responseCode": "SUCCESS",
  "message": "Trends data retrieved successfully",
  "data": {
    "period": 30,
    "startDate": "2025-11-03T12:00:00.000Z",
    "endDate": "2025-12-03T12:00:00.000Z",
    "withdrawals": [
      {
        "date": "2025-11-03",
        "count": 5,
        "totalAmount": 12500.0
      },
      {
        "date": "2025-11-04",
        "count": 8,
        "totalAmount": 20000.0
      }
    ],
    "employees": [
      {
        "date": "2025-11-03",
        "count": 3
      },
      {
        "date": "2025-11-04",
        "count": 5
      }
    ]
  }
}
```

**Example Request:**

```bash
curl --location 'http://localhost:3000/api/admin/analytics/trends?period=7' \
--header 'Authorization: Bearer YOUR_ADMIN_JWT_TOKEN'
```

---

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "status": false,
  "message": "Unauthorized access"
}
```

### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "status": false,
  "message": "Internal server error"
}
```

---

## Dashboard Implementation Notes

### Account Balance Calculation

The `accountBalance` field in the dashboard endpoint is currently set to `0.00` and needs to be implemented based on your business logic. Here are some options:

**Option 1: System-wide Balance Table**
Create a separate table to track the admin/system account balance:

```sql
CREATE TABLE system_account (
  id INT PRIMARY KEY,
  balance DECIMAL(10,2),
  updated_at TIMESTAMP
);
```

**Option 2: Calculate from Transactions**

```typescript
// Total deposits minus total disbursements
const deposits = await getDepositTotal();
const disbursements = await getDisbursementTotal();
const accountBalance = deposits - disbursements;
```

**Option 3: Sum Corporate Balances**
If each corporate has a balance field:

```typescript
const result = await CorporateRepo.createQueryBuilder('corp').select('SUM(corp.balance)', 'total').getRawOne();
const accountBalance = result.total;
```

### Status Mapping

The analytics uses these status constants:

- `ACTIVE` - Active entities
- `INACTIVE` - Inactive entities
- `PENDING` - Pending transactions
- `COMPLETED` - Completed transactions
- `FAILED` - Failed/rejected transactions

Ensure your status enums match these values.

---

## Integration Examples

### React/TypeScript Integration

```typescript
interface DashboardData {
  accountBalance: number;
  totalCorporates: number;
  totalEmployees: number;
  totalRequests: number;
  totalDisbursed: number;
}

const fetchDashboardData = async (): Promise<DashboardData> => {
  const response = await api.get('/admin/analytics/dashboard');
  return response.data.data;
};

// Usage in component
const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboardData().then(setData);
  }, []);

  if (!data) return <Loading />;

  return (
    <div className="dashboard">
      <Card title="Account Balance" value={`$${data.accountBalance.toFixed(2)}`} />
      <Card title="Corporates" value={data.totalCorporates} />
      <Card title="Employees" value={data.totalEmployees} />
      <Card title="Total Requests" value={data.totalRequests} />
      <Card title="Total Disbursed" value={data.totalDisbursed} />
    </div>
  );
};
```

### Chart Integration

```typescript
import { Line, Bar } from 'react-chartjs-2';

const TrendsChart: React.FC = () => {
  const [trends, setTrends] = useState(null);

  useEffect(() => {
    api.get('/admin/analytics/trends?period=30').then((res) => setTrends(res.data.data));
  }, []);

  if (!trends) return null;

  const chartData = {
    labels: trends.withdrawals.map((d) => d.date),
    datasets: [
      {
        label: 'Withdrawal Amount',
        data: trends.withdrawals.map((d) => d.totalAmount),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  return <Line data={chartData} />;
};
```

---

## Testing

### Manual Testing with cURL

**Test Dashboard Endpoint:**

```bash
# Get admin token first
TOKEN=$(curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.data.accessToken')

# Get dashboard data
curl -X GET http://localhost:3000/api/admin/analytics/dashboard \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

**Test Overview with Date Range:**

```bash
curl -X GET "http://localhost:3000/api/admin/analytics/overview?startDate=2025-12-01&endDate=2025-12-31" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

**Test Recent Activity:**

```bash
curl -X GET "http://localhost:3000/api/admin/analytics/recent-activity?limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

**Test Trends:**

```bash
curl -X GET "http://localhost:3000/api/admin/analytics/trends?period=7" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

---

## Performance Considerations

1. **Caching**: Consider implementing Redis caching for dashboard data that doesn't change frequently:

```typescript
const cacheKey = 'admin:dashboard:analytics';
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Calculate and cache for 5 minutes
const data = await calculateDashboardData();
await redis.setex(cacheKey, 300, JSON.stringify(data));
```

2. **Database Indexing**: Ensure indexes exist on:

   - `corpStatus` (Corporate table)
   - `corpEmpStatus` (CorpEmp table)
   - `status` (Withdrawal table)
   - `createdAt`, `processedAt` (Withdrawal table)
   - `corpEmpCreatedDate` (CorpEmp table)

3. **Aggregation Optimization**: For large datasets, consider materialized views or scheduled aggregation jobs.

---

## Future Enhancements

1. **Real-time Updates**: Implement WebSocket for live dashboard updates
2. **Export Functionality**: Add CSV/Excel export for analytics data
3. **Custom Date Ranges**: Add preset options (This Week, This Month, This Quarter)
4. **Comparative Analytics**: Compare current period vs previous period
5. **Corporate-specific Analytics**: Filter analytics by specific corporate
6. **Role-based Analytics**: Different analytics views for different admin roles

---

## Support

For questions or issues with the Analytics API:

- Check the main API documentation
- Review the entity schemas
- Contact the backend development team

---

## Changelog

### Version 1.0.0 (2025-12-03)

- Initial release with 4 analytics endpoints
- Dashboard metrics endpoint
- Overview with detailed breakdowns
- Recent activity feed
- Trends data for charts
