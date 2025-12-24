'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminApi, AdminApiError } from '@/lib/api';

interface DashboardStats {
  sessions: { total: number };
  users: { total: number };
  jobs: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  recentJobs: Array<{
    id: string;
    type: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    error?: string;
  }>;
  metrics?: {
    jobs24h: number;
    jobs7d: number;
    successRate24h: number;
    successRate7d: number;
    failedJobs24h: number;
    failedJobs7d: number;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const data = await adminApi.getDashboardStats();
      setStats(data);
      setError('');
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError('Failed to load dashboard stats');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="px-4 py-6 sm:px-0">
          <div className="text-gray-600">Loading dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="px-4 py-6 sm:px-0">
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-gray-900">{stats.sessions.total}</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Sessions</dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-gray-900">{stats.users.total}</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-yellow-600">{stats.jobs.pending}</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Jobs</dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-red-600">{stats.jobs.failed}</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Failed Jobs</dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Status Breakdown */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Job Status</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <div className="text-sm text-gray-500">Pending</div>
                <div className="text-2xl font-semibold text-yellow-600">{stats.jobs.pending}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Processing</div>
                <div className="text-2xl font-semibold text-blue-600">{stats.jobs.processing}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Completed</div>
                <div className="text-2xl font-semibold text-green-600">{stats.jobs.completed}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Failed</div>
                <div className="text-2xl font-semibold text-red-600">{stats.jobs.failed}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Health Metrics */}
        {stats.metrics && (
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Health Metrics</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <div className="text-sm text-gray-500">Jobs (24h)</div>
                  <div className="text-2xl font-semibold text-gray-900">{stats.metrics.jobs24h}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {stats.metrics.completedJobs24h} completed, {stats.metrics.failedJobs24h} failed
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Success Rate (24h)</div>
                  <div className={`text-2xl font-semibold ${
                    stats.metrics.successRate24h >= 95 ? 'text-green-600' :
                    stats.metrics.successRate24h >= 80 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {stats.metrics.successRate24h.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Jobs (7d)</div>
                  <div className="text-2xl font-semibold text-gray-900">{stats.metrics.jobs7d}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {stats.metrics.completedJobs7d} completed, {stats.metrics.failedJobs7d} failed
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Success Rate (7d)</div>
                  <div className={`text-2xl font-semibold ${
                    stats.metrics.successRate7d >= 95 ? 'text-green-600' :
                    stats.metrics.successRate7d >= 80 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {stats.metrics.successRate7d.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Jobs */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Jobs</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Error
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentJobs.map((job) => (
                    <tr key={job.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            job.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : job.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : job.status === 'processing'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(job.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {job.error ? (
                          <span className="text-red-600 truncate max-w-xs block" title={job.error}>
                            {job.error}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

