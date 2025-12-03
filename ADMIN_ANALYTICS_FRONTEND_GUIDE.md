# Frontend Integration Guide - Admin Analytics

Quick guide for integrating the Admin Analytics API with the frontend dashboard.

## API Service Setup

Create an analytics service file:

**File:** `src/services/adminAnalyticsService.ts`

```typescript
import api from './api';

export interface DashboardAnalytics {
  accountBalance: number;
  totalCorporates: number;
  totalEmployees: number;
  totalRequests: number;
  totalDisbursed: number;
}

export interface AnalyticsOverview {
  dateRange: {
    start: string;
    end: string;
  };
  corporates: {
    total: number;
    active: number;
    inactive: number;
  };
  employees: {
    total: number;
    active: number;
    inactive: number;
  };
  requests: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  disbursements: {
    totalAmount: number;
    totalCount: number;
    averageAmount: number;
    periodStart: string;
    periodEnd: string;
  };
}

export interface ActivityItem {
  id: number;
  type: string;
  employeeName: string;
  employeeEmail: string;
  amount: number;
  status: string;
  purpose: string;
  createdAt: string;
}

export interface TrendsData {
  period: number;
  startDate: string;
  endDate: string;
  withdrawals: Array<{
    date: string;
    count: number;
    totalAmount: number;
  }>;
  employees: Array<{
    date: string;
    count: number;
  }>;
}

export const adminAnalyticsService = {
  // Get dashboard analytics
  getDashboard: async (): Promise<DashboardAnalytics> => {
    const response = await api.get('/admin/analytics/dashboard');
    return response.data.data;
  },

  // Get detailed overview
  getOverview: async (startDate?: string, endDate?: string): Promise<AnalyticsOverview> => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await api.get('/admin/analytics/overview', { params });
    return response.data.data;
  },

  // Get recent activity
  getRecentActivity: async (limit: number = 10): Promise<ActivityItem[]> => {
    const response = await api.get('/admin/analytics/recent-activity', {
      params: { limit }
    });
    return response.data.data.activities;
  },

  // Get trends data
  getTrends: async (period: number = 30): Promise<TrendsData> => {
    const response = await api.get('/admin/analytics/trends', {
      params: { period }
    });
    return response.data.data;
  }
};
```

---

## Dashboard Component Example

**File:** `src/components/admin/Dashboard.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { adminAnalyticsService, DashboardAnalytics } from '../../services/adminAnalyticsService';
import { Box, Grid, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { AccountBalance, Business, People, Assignment, AccountBalanceWallet } from '@mui/icons-material';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const analytics = await adminAnalyticsService.getDashboard();
      setData(analytics);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  if (!data) return null;

  const cards = [
    {
      title: 'Account Balance',
      value: `$${data.accountBalance.toFixed(2)}`,
      icon: <AccountBalance sx={{ fontSize: 40 }} />,
      color: '#FFD700',
      bgColor: '#FFF9E6'
    },
    {
      title: 'Corporates',
      value: data.totalCorporates,
      icon: <Business sx={{ fontSize: 40 }} />,
      color: '#90EE90',
      bgColor: '#F0FFF0'
    },
    {
      title: 'Employees',
      value: data.totalEmployees,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#E6E6FA',
      bgColor: '#F8F8FF'
    },
    {
      title: 'Total Requests',
      value: data.totalRequests,
      icon: <Assignment sx={{ fontSize: 40 }} />,
      color: '#90EE90',
      bgColor: '#F0FFF0'
    },
    {
      title: 'Total Disbursed',
      value: `$${data.totalDisbursed.toFixed(2)}`,
      icon: <AccountBalanceWallet sx={{ fontSize: 40 }} />,
      color: '#E6E6FA',
      bgColor: '#F8F8FF'
    }
  ];

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3} mt={2}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                backgroundColor: card.bgColor,
                borderRadius: 4,
                minHeight: 150
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      {card.title}
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      color: card.color,
                      backgroundColor: 'white',
                      borderRadius: 2,
                      p: 1
                    }}
                  >
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;
```

---

## React Hooks for Analytics

**File:** `src/hooks/useAdminAnalytics.ts`

```typescript
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { adminAnalyticsService, DashboardAnalytics, AnalyticsOverview, ActivityItem, TrendsData } from '../services/adminAnalyticsService';

export const useDashboardAnalytics = (): UseQueryResult<DashboardAnalytics> => {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminAnalyticsService.getDashboard(),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000 // Consider data fresh for 30 seconds
  });
};

export const useAnalyticsOverview = (startDate?: string, endDate?: string): UseQueryResult<AnalyticsOverview> => {
  return useQuery({
    queryKey: ['admin-overview', startDate, endDate],
    queryFn: () => adminAnalyticsService.getOverview(startDate, endDate),
    enabled: true
  });
};

export const useRecentActivity = (limit: number = 10): UseQueryResult<ActivityItem[]> => {
  return useQuery({
    queryKey: ['admin-activity', limit],
    queryFn: () => adminAnalyticsService.getRecentActivity(limit),
    refetchInterval: 30000 // Refresh every 30 seconds
  });
};

export const useTrends = (period: number = 30): UseQueryResult<TrendsData> => {
  return useQuery({
    queryKey: ['admin-trends', period],
    queryFn: () => adminAnalyticsService.getTrends(period)
  });
};
```

---

## Usage with React Query

```typescript
import { useDashboardAnalytics } from '../../hooks/useAdminAnalytics';

const Dashboard: React.FC = () => {
  const { data, isLoading, error, refetch } = useDashboardAnalytics();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;
  if (!data) return null;

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={() => refetch()}>Refresh</button>

      <StatsCard title="Account Balance" value={`$${data.accountBalance.toFixed(2)}`} />
      <StatsCard title="Corporates" value={data.totalCorporates} />
      {/* ... more cards */}
    </div>
  );
};
```

---

## Chart Integration Example

**File:** `src/components/admin/TrendsChart.tsx`

```typescript
import React from 'react';
import { Line } from 'react-chartjs-2';
import { useTrends } from '../../hooks/useAdminAnalytics';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const TrendsChart: React.FC = () => {
  const { data, isLoading } = useTrends(30);

  if (isLoading || !data) return <div>Loading chart...</div>;

  const chartData = {
    labels: data.withdrawals.map((d) => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Withdrawal Amount ($)',
        data: data.withdrawals.map((d) => d.totalAmount),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.3
      },
      {
        label: 'Request Count',
        data: data.withdrawals.map((d) => d.count),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.3,
        yAxisID: 'y1'
      }
    ]
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top' as const
      },
      title: {
        display: true,
        text: 'Withdrawal Trends (Last 30 Days)'
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Amount ($)'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Count'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default TrendsChart;
```

---

## Recent Activity Component

```typescript
import React from 'react';
import { useRecentActivity } from '../../hooks/useAdminAnalytics';
import { List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip, Typography, Box } from '@mui/material';
import { AccountBalance } from '@mui/icons-material';

const RecentActivity: React.FC = () => {
  const { data: activities, isLoading } = useRecentActivity(10);

  if (isLoading) return <div>Loading...</div>;
  if (!activities || activities.length === 0) {
    return <Typography>No recent activity</Typography>;
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Recent Activity
      </Typography>
      <List>
        {activities.map((activity) => (
          <ListItem key={activity.id} divider>
            <ListItemAvatar>
              <Avatar>
                <AccountBalance />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={activity.employeeName}
              secondary={
                <>
                  <Typography component="span" variant="body2">
                    ${activity.amount.toFixed(2)} - {activity.purpose}
                  </Typography>
                  <br />
                  <Typography component="span" variant="caption">
                    {new Date(activity.createdAt).toLocaleString()}
                  </Typography>
                </>
              }
            />
            <Chip label={activity.status} color={getStatusColor(activity.status)} size="small" />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default RecentActivity;
```

---

## Testing the Integration

```typescript
// Test file: src/services/__tests__/adminAnalyticsService.test.ts
import { adminAnalyticsService } from '../adminAnalyticsService';
import api from '../api';

jest.mock('../api');

describe('Admin Analytics Service', () => {
  it('should fetch dashboard analytics', async () => {
    const mockData = {
      accountBalance: 0,
      totalCorporates: 40,
      totalEmployees: 9,
      totalRequests: 40,
      totalDisbursed: 0
    };

    (api.get as jest.Mock).mockResolvedValue({
      data: { data: mockData }
    });

    const result = await adminAnalyticsService.getDashboard();
    expect(result).toEqual(mockData);
    expect(api.get).toHaveBeenCalledWith('/admin/analytics/dashboard');
  });
});
```

---

## API Call Examples

```typescript
// Simple fetch without React Query
const loadDashboard = async () => {
  try {
    const data = await adminAnalyticsService.getDashboard();
    console.log('Account Balance:', data.accountBalance);
    console.log('Corporates:', data.totalCorporates);
    console.log('Employees:', data.totalEmployees);
  } catch (error) {
    console.error('Failed to load dashboard:', error);
  }
};

// With date range
const loadOverview = async () => {
  const overview = await adminAnalyticsService.getOverview('2025-12-01', '2025-12-31');
  console.log('Overview:', overview);
};

// Get trends for last 7 days
const loadWeeklyTrends = async () => {
  const trends = await adminAnalyticsService.getTrends(7);
  console.log('Weekly trends:', trends);
};
```

---

## Best Practices

1. **Error Handling**: Always wrap API calls in try-catch
2. **Loading States**: Show loading indicators during data fetch
3. **Caching**: Use React Query for automatic caching and refetching
4. **Auto-refresh**: Set appropriate refetch intervals for real-time data
5. **Type Safety**: Use TypeScript interfaces for all API responses
6. **Formatting**: Format currency and numbers consistently
7. **Date Handling**: Use proper date libraries (date-fns, moment, dayjs)

---

## Common Issues & Solutions

**Issue:** CORS errors

```typescript
// Solution: Ensure backend has proper CORS configuration
// Or use a proxy in development
```

**Issue:** Authentication errors

```typescript
// Solution: Ensure token is included in all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Issue:** Stale data

```typescript
// Solution: Use proper cache invalidation
const { refetch } = useDashboardAnalytics();
// Call refetch() after important actions
```
