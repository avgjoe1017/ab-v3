'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { adminApi, AdminApiError } from '@/lib/api';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';

interface Job {
  id: string;
  type: string;
  status: string;
  payload: string;
  result?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [requeuing, setRequeuing] = useState(false);

  useEffect(() => {
    if (jobId) {
      loadJob();
      const interval = setInterval(loadJob, 5000); // Refresh every 5s
      return () => clearInterval(interval);
    }
  }, [jobId]);

  const loadJob = async () => {
    try {
      const data = await adminApi.getJob(jobId);
      setJob(data.job);
      setError('');
    } catch (err) {
      if (err instanceof AdminApiError && err.code === 'UNAUTHORIZED') {
        router.push('/admin/login');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load job');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!confirm('Retry this job?')) {
      return;
    }

    try {
      setRetrying(true);
      await adminApi.retryJob(jobId);
      loadJob();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to retry job');
    } finally {
      setRetrying(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this job?')) {
      return;
    }

    try {
      setCancelling(true);
      await adminApi.cancelJob(jobId);
      loadJob();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel job');
    } finally {
      setCancelling(false);
    }
  };

  const handleRequeue = async () => {
    if (!confirm('Requeue this job (create a new job with same payload)?')) {
      return;
    }

    try {
      setRequeuing(true);
      const result = await adminApi.requeueJob(jobId);
      if (result.jobId) {
        router.push(`/admin/jobs/${result.jobId}`);
      } else {
        loadJob();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to requeue job');
    } finally {
      setRequeuing(false);
    }
  };

  if (loading && !job) {
    return (
      <AdminLayout>
        <div className="px-4 py-6 sm:px-0">
          <div className="text-gray-600">Loading job...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !job) {
    return (
      <AdminLayout>
        <div className="px-4 py-6 sm:px-0">
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error || 'Job not found'}</div>
          </div>
          <Link
            href="/admin/jobs"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-900"
          >
            ← Back to Jobs
          </Link>
        </div>
      </AdminLayout>
    );
  }

  let payloadObj: any = {};
  let resultObj: any = {};
  try {
    payloadObj = JSON.parse(job.payload);
  } catch {}
  try {
    resultObj = job.result ? JSON.parse(job.result) : {};
  } catch {}

  const duration = job.updatedAt && job.createdAt
    ? new Date(job.updatedAt).getTime() - new Date(job.createdAt).getTime()
    : null;

  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Jobs', href: '/admin/jobs' },
            { label: job.id.substring(0, 8) + '...' },
          ]}
        />

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Job Details</h2>
          <div className="flex gap-2">
            {job.status === 'failed' && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {retrying ? 'Retrying...' : 'Retry Job'}
              </button>
            )}
            {(job.status === 'pending' || job.status === 'processing') && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Job'}
              </button>
            )}
            <button
              onClick={handleRequeue}
              disabled={requeuing}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {requeuing ? 'Requeuing...' : 'Requeue'}
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Job ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{job.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{job.type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
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
                </dd>
              </div>
              {duration !== null && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Duration</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {duration > 1000 ? `${(duration / 1000).toFixed(1)}s` : `${duration}ms`}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(job.createdAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(job.updatedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Payload */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payload</h3>
            <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(payloadObj, null, 2)}
            </pre>
          </div>
        </div>

        {/* Result */}
        {job.result && (
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Result</h3>
              <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(resultObj, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Error */}
        {job.error && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-red-900 mb-4">Error</h3>
              <div className="bg-red-50 p-4 rounded-md">
                <pre className="text-sm text-red-800 whitespace-pre-wrap">{job.error}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

