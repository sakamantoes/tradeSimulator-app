import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { adminService } from '@/services/admin';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { useToast } from '@/hooks/useToast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardStats {
  totalUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalTrades: number;
  companyRevenue: number;
  platformFees: number;
  activeTrades: number;
  winRate: number;
  recentActivity: Array<{
    id: number;
    type: string;
    user: string;
    amount: number;
    timestamp: string;
  }>;
  userGrowth: Array<{
    date: string;
    count: number;
  }>;
  tradeVolume: Array<{
    date: string;
    volume: number;
  }>;
  revenueByAsset: Array<{
    asset: string;
    revenue: number;
  }>;
}

const AdminDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['admin-stats', timeRange],
    queryFn: () => adminService.getDashboardStats(timeRange),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (error) {
      showToast('Failed to load dashboard stats', 'error');
    }
  }, [error, showToast]);

  const userGrowthData = {
    labels: stats?.userGrowth.map(item => format(new Date(item.date), 'MMM dd')) || [],
    datasets: [
      {
        label: 'New Users',
        data: stats?.userGrowth.map(item => item.count) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const tradeVolumeData = {
    labels: stats?.tradeVolume.map(item => format(new Date(item.date), 'MMM dd')) || [],
    datasets: [
      {
        label: 'Trade Volume ($)',
        data: stats?.tradeVolume.map(item => item.volume) || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
      },
    ],
  };

  const revenueByAssetData = {
    labels: stats?.revenueByAsset.map(item => item.asset) || [],
    datasets: [
      {
        label: 'Revenue by Asset',
        data: stats?.revenueByAsset.map(item => item.revenue) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
      },
    ],
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: '👥',
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'Total Deposits',
      value: `$${(stats?.totalDeposits || 0).toLocaleString()}`,
      icon: '💰',
      color: 'bg-green-500',
      change: '+8%',
    },
    {
      title: 'Total Withdrawals',
      value: `$${(stats?.totalWithdrawals || 0).toLocaleString()}`,
      icon: '💸',
      color: 'bg-red-500',
      change: '-3%',
    },
    {
      title: 'Total Trades',
      value: stats?.totalTrades || 0,
      icon: '📊',
      color: 'bg-purple-500',
      change: '+15%',
    },
    {
      title: 'Company Revenue',
      value: `$${(stats?.companyRevenue || 0).toLocaleString()}`,
      icon: '🏦',
      color: 'bg-yellow-500',
      change: '+22%',
    },
    {
      title: 'Platform Fees',
      value: `$${(stats?.platformFees || 0).toLocaleString()}`,
      icon: '⚙️',
      color: 'bg-indigo-500',
      change: '+5%',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-base-content/70 mt-1">
            Overview of platform statistics and performance
          </p>
        </div>
        <div className="flex gap-2">
          <select
            className="select select-bordered select-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-stats'] })}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-base-content/70">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  {stat.change && (
                    <p className={`text-xs mt-1 ${
                      stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {stat.change} from last period
                    </p>
                  )}
                </div>
                <div className={`${stat.color} p-3 rounded-full text-2xl`}>
                  {stat.icon}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">User Growth</h3>
          <Line
            data={userGrowthData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' as const },
                tooltip: { mode: 'index', intersect: false },
              },
              scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } },
              },
            }}
          />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Trade Volume</h3>
          <Bar
            data={tradeVolumeData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' as const },
                tooltip: { callbacks: { label: (context) => `$${context.raw}` } },
              },
            }}
          />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Revenue by Asset</h3>
          <div className="h-80">
            <Pie
              data={revenueByAssetData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  tooltip: { callbacks: { label: (context) => `$${context.raw}` } },
                },
              }}
            />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {stats?.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-base-300 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'deposit' ? 'bg-green-500' :
                    activity.type === 'withdrawal' ? 'bg-red-500' :
                    activity.type === 'trade' ? 'bg-blue-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="font-medium">{activity.type.toUpperCase()}</p>
                    <p className="text-sm text-base-content/70">User: {activity.user}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    activity.type === 'deposit' ? 'text-green-500' :
                    activity.type === 'withdrawal' ? 'text-red-500' : 'text-blue-500'
                  }`}>
                    {activity.type === 'deposit' ? '+' : '-'}${activity.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-base-content/70">
                    {format(new Date(activity.timestamp), 'HH:mm MMM dd')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="secondary" onClick={() => window.location.href = '/admin/users'}>
            Manage Users
          </Button>
          <Button variant="secondary" onClick={() => window.location.href = '/admin/deposits'}>
            View Deposits
          </Button>
          <Button variant="secondary" onClick={() => window.location.href = '/admin/withdrawals'}>
            Process Withdrawals
          </Button>
          <Button variant="secondary" onClick={() => window.location.href = '/admin/market'}>
            Market Settings
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;