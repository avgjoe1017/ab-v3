'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { adminApi, AdminApiError } from '@/lib/api';
import Breadcrumbs from '@/components/Breadcrumbs';
import Link from 'next/link';

interface Affirmation {
  id: string;
  idx: number;
  text: string;
  moderationStatus: string;
  moderationReason?: string;
  autoFlagged: boolean;
}

interface Session {
  id: string;
  title: string;
  source: string;
  createdAt: string;
  ownerUser?: { id: string; email: string };
  affirmations: Affirmation[];
  _count: { affirmations: number };
}

interface ModerationStats {
  pending: number;
  approved: number;
  flagged: number;
  rejected: number;
  total: number;
}

export default function ModerationPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAffirmations, setSelectedAffirmations] = useState<Set<string>>(new Set());
  const [moderating, setModerating] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [flaggedData, statsData] = await Promise.all([
        adminApi.getFlaggedSessions(page, 50),
        adminApi.getModerationStats(),
      ]);
      setSessions(flaggedData.sessions);
      setTotalPages(flaggedData.pagination.totalPages);
      setStats(statsData.stats);
      setError('');
    } catch (err) {
      if (err instanceof AdminApiError && err.code === 'UNAUTHORIZED') {
        router.push('/admin/login');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load moderation data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (affirmationId: string, action: 'approve' | 'reject' | 'flag' | 'edit', editedText?: string, reason?: string) => {
    try {
      setModerating(affirmationId);
      await adminApi.moderateAffirmation(affirmationId, action, editedText, reason);
      loadData();
      setSelectedAffirmations((prev) => {
        const next = new Set(prev);
        next.delete(affirmationId);
        return next;
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to moderate affirmation');
    } finally {
      setModerating(null);
    }
  };

  const handleBulkModerate = async (action: 'approve' | 'reject', reason?: string) => {
    if (selectedAffirmations.size === 0) {
      alert('Please select affirmations to moderate');
      return;
    }

    if (!confirm(`Are you sure you want to ${action} ${selectedAffirmations.size} affirmation(s)?`)) {
      return;
    }

    try {
      setModerating('bulk');
      await adminApi.bulkModerateAffirmations(Array.from(selectedAffirmations), action, reason);
      loadData();
      setSelectedAffirmations(new Set());
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to bulk moderate');
    } finally {
      setModerating(null);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedAffirmations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading && sessions.length === 0) {
    return (
      <AdminLayout>
        <div className="px-4 py-6 sm:px-0">
          <div className="text-gray-600">Loading moderation data...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Content Moderation' },
          ]}
        />

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Content Moderation</h2>
          
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 mb-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-500">Pending</div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-500">Approved</div>
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-500">Flagged</div>
                <div className="text-2xl font-bold text-red-600">{stats.flagged}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-500">Rejected</div>
                <div className="text-2xl font-bold text-gray-600">{stats.rejected}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-500">Total</div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedAffirmations.size > 0 && (
            <div className="mb-4 p-4 bg-indigo-50 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-900">
                {selectedAffirmations.size} affirmation(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkModerate('approve')}
                  disabled={moderating === 'bulk'}
                  className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {moderating === 'bulk' ? 'Processing...' : 'Approve All'}
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Rejection reason (optional):');
                    if (reason !== null) {
                      handleBulkModerate('reject', reason || undefined);
                    }
                  }}
                  disabled={moderating === 'bulk'}
                  className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {moderating === 'bulk' ? 'Processing...' : 'Reject All'}
                </button>
                <button
                  onClick={() => setSelectedAffirmations(new Set())}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Flagged Sessions */}
        <div className="space-y-6">
          {sessions.map((session) => (
            <div key={session.id} className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      <Link
                        href={`/admin/sessions/${session.id}`}
                        className="hover:text-indigo-600"
                      >
                        {session.title}
                      </Link>
                    </h3>
                    <div className="mt-1 text-sm text-gray-500">
                      {session.source} • {new Date(session.createdAt).toLocaleDateString()}
                      {session.ownerUser && ` • ${session.ownerUser.email}`}
                    </div>
                  </div>
                  <Link
                    href={`/admin/sessions/${session.id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    View Session →
                  </Link>
                </div>

                <div className="space-y-3">
                  {session.affirmations.map((affirmation) => {
                    const isSelected = selectedAffirmations.has(affirmation.id);
                    const statusColors: Record<string, string> = {
                      pending: 'bg-yellow-100 text-yellow-800',
                      flagged: 'bg-red-100 text-red-800',
                      approved: 'bg-green-100 text-green-800',
                      rejected: 'bg-gray-100 text-gray-800',
                    };

                    return (
                      <div
                        key={affirmation.id}
                        className={`p-4 border rounded-lg ${
                          isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(affirmation.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-500">
                                #{affirmation.idx + 1}
                              </span>
                              <span
                                className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                  statusColors[affirmation.moderationStatus] || 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {affirmation.moderationStatus}
                              </span>
                              {affirmation.autoFlagged && (
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                  Auto-flagged
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-900 mb-2">{affirmation.text}</p>
                            {affirmation.moderationReason && (
                              <p className="text-xs text-red-600 mb-2">
                                Reason: {affirmation.moderationReason}
                              </p>
                            )}
                            <div className="flex gap-2">
                              {affirmation.moderationStatus !== 'approved' && (
                                <button
                                  onClick={() => handleModerate(affirmation.id, 'approve')}
                                  disabled={moderating === affirmation.id}
                                  className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                  Approve
                                </button>
                              )}
                              {affirmation.moderationStatus !== 'rejected' && (
                                <button
                                  onClick={() => {
                                    const reason = prompt('Rejection reason (optional):');
                                    if (reason !== null) {
                                      handleModerate(affirmation.id, 'reject', undefined, reason || undefined);
                                    }
                                  }}
                                  disabled={moderating === affirmation.id}
                                  className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  const edited = prompt('Edit affirmation:', affirmation.text);
                                  if (edited && edited !== affirmation.text) {
                                    handleModerate(affirmation.id, 'edit', edited);
                                  }
                                }}
                                disabled={moderating === affirmation.id}
                                className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

