'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { adminApi, AdminApiError } from '@/lib/api';
import Link from 'next/link';

interface Session {
  id: string;
  title: string;
  source: string;
  goalTag?: string;
  voiceId: string;
  createdAt: string;
  ownerUser?: { id: string; email: string };
  audio?: { mergedAudioAsset: { url: string } };
  affirmations: Array<{ text: string }>;
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [audioReadyFilter, setAudioReadyFilter] = useState<string>('');

  useEffect(() => {
    loadSessions();
  }, [page, sourceFilter, audioReadyFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        loadSessions();
      } else {
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getSessions(
        page,
        50,
        sourceFilter || undefined,
        searchQuery || undefined,
        audioReadyFilter || undefined
      );
      setSessions(data.sessions);
      setTotalPages(data.pagination.totalPages);
      setError('');
    } catch (err) {
      if (err instanceof AdminApiError && err.code === 'UNAUTHORIZED') {
        router.push('/admin/login');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      await adminApi.deleteSession(id);
      loadSessions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete session');
    }
  };

  if (loading && sessions.length === 0) {
    return (
      <AdminLayout>
        <div className="px-4 py-6 sm:px-0">
          <div className="text-gray-600">Loading sessions...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Sessions</h2>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Sources</option>
              <option value="catalog">Catalog</option>
              <option value="user">User</option>
              <option value="generated">Generated</option>
            </select>
            <select
              value={audioReadyFilter}
              onChange={(e) => {
                setAudioReadyFilter(e.target.value);
                setPage(1);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Audio Status</option>
              <option value="true">Audio Ready</option>
              <option value="false">No Audio</option>
            </select>
            {(sourceFilter || audioReadyFilter || searchQuery) && (
              <button
                onClick={() => {
                  setSourceFilter('');
                  setAudioReadyFilter('');
                  setSearchQuery('');
                  setPage(1);
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {sessions.map((session) => (
              <li key={session.id}>
                <Link
                  href={`/admin/sessions/${session.id}`}
                  className="block px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/admin/sessions/${session.id}`);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-lg font-medium text-gray-900">
                          {session.title}
                        </span>
                        <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {session.source}
                        </span>
                        {session.goalTag && (
                          <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {session.goalTag}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        {session.ownerUser ? (
                          <span>User: {session.ownerUser.email}</span>
                        ) : (
                          <span>No owner</span>
                        )}
                        <span className="ml-4">
                          {session.affirmations.length} affirmations
                        </span>
                        <span className="ml-4">
                          {session.audio ? '✓ Audio ready' : '✗ No audio'}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        Created: {new Date(session.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(session.id);
                        }}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
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

