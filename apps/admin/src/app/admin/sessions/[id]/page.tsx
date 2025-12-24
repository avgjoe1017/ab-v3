'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { adminApi, AdminApiError } from '@/lib/api';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import AudioInspector from '@/components/AudioInspector';
import AudioPreviewPlayer from '@/components/AudioPreviewPlayer';

interface Session {
  id: string;
  title: string;
  source: string;
  goalTag?: string;
  voiceId: string;
  pace?: string;
  frequencyHz?: number;
  brainwaveState?: string;
  createdAt: string;
  updatedAt: string;
  ownerUser?: { id: string; email: string };
  audio?: {
    mergedAudioAsset: {
      id: string;
      url: string;
      hash: string;
    };
    generatedAt: string;
  };
  affirmations: Array<{
    id: string;
    idx: number;
    text: string;
    moderationStatus?: string;
    moderationReason?: string;
    autoFlagged?: boolean;
  }>;
}

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [integrityChecks, setIntegrityChecks] = useState<Array<{
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    threshold?: string;
  }>>([]);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const [sessionData, integrityData] = await Promise.all([
        adminApi.getSession(sessionId),
        adminApi.getAudioIntegrity(sessionId).catch(() => ({ checks: [] })),
      ]);
      setSession(sessionData.session);
      setIntegrityChecks(integrityData.checks || []);
      setError('');
    } catch (err) {
      if (err instanceof AdminApiError && err.code === 'UNAUTHORIZED') {
        router.push('/admin/login');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      await adminApi.deleteSession(sessionId);
      router.push('/admin/sessions');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete session');
      setDeleting(false);
    }
  };

  const handleRebuildAudio = async () => {
    if (!confirm('Rebuild audio for this session? This will create a new job.')) {
      return;
    }

    try {
      setRebuilding(true);
      const result = await adminApi.rebuildAudio(sessionId);
      if (result.jobId) {
        alert(`Audio rebuild job created: ${result.jobId}`);
        loadSession();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to rebuild audio');
    } finally {
      setRebuilding(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="px-4 py-6 sm:px-0">
          <div className="text-gray-600">Loading session...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !session) {
    return (
      <AdminLayout>
        <div className="px-4 py-6 sm:px-0">
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error || 'Session not found'}</div>
          </div>
          <Link
            href="/admin/sessions"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-900"
          >
            ← Back to Sessions
          </Link>
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
            { label: 'Sessions', href: '/admin/sessions' },
            { label: session.title },
          ]}
        />

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{session.title}</h2>
          <div className="flex gap-2">
            <button
              onClick={handleRebuildAudio}
              disabled={rebuilding}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {rebuilding ? 'Rebuilding...' : 'Rebuild Audio'}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Session'}
            </button>
          </div>
        </div>

        {/* Session Info */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Session Information</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{session.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Source</dt>
                <dd className="mt-1">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    {session.source}
                  </span>
                </dd>
              </div>
              {session.goalTag && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Goal Tag</dt>
                  <dd className="mt-1">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {session.goalTag}
                    </span>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Voice ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{session.voiceId}</dd>
              </div>
              {session.pace && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Pace</dt>
                  <dd className="mt-1 text-sm text-gray-900">{session.pace}</dd>
                </div>
              )}
              {session.frequencyHz && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Binaural Frequency</dt>
                  <dd className="mt-1 text-sm text-gray-900">{session.frequencyHz} Hz</dd>
                </div>
              )}
              {session.brainwaveState && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Brainwave State</dt>
                  <dd className="mt-1 text-sm text-gray-900">{session.brainwaveState}</dd>
                </div>
              )}
              {session.ownerUser && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Owner</dt>
                  <dd className="mt-1 text-sm text-gray-900">{session.ownerUser.email}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(session.createdAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(session.updatedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Audio Status */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Audio Status</h3>
            {session.audio ? (
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-green-600">✓ Audio Generated</span>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Generated At</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(session.audio.generatedAt).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Audio Hash</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono text-xs break-all">
                    {session.audio.mergedAudioAsset.hash}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Audio URL</dt>
                  <dd className="mt-1">
                    <a
                      href={session.audio.mergedAudioAsset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-900 break-all"
                    >
                      {session.audio.mergedAudioAsset.url}
                    </a>
                  </dd>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-sm font-medium text-yellow-600">⚠ Audio Not Generated</span>
              </div>
            )}
          </div>
        </div>

        {/* Audio Preview Player */}
        {session.audio && (
          <div className="mb-6">
            <AudioPreviewPlayer
              sessionId={session.id}
              assets={session.audio.assets || []}
              affirmations={session.affirmations}
              mergedAudioUrl={session.audio.mergedAudioAsset?.url}
            />
          </div>
        )}

        {/* Audio Inspector */}
        {session.audio && (
          <div className="mb-6">
            <AudioInspector
              sessionId={session.id}
              assets={session.audio.assets || []}
              integrityChecks={integrityChecks}
            />
          </div>
        )}

        {/* Affirmations */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Affirmations ({session.affirmations.length})
            </h3>
            <div className="space-y-4">
              {session.affirmations.map((affirmation, index) => {
                const statusColors: Record<string, string> = {
                  pending: 'border-yellow-500 bg-yellow-50',
                  flagged: 'border-red-500 bg-red-50',
                  approved: 'border-green-500 bg-green-50',
                  rejected: 'border-gray-500 bg-gray-50',
                };
                const borderColor = statusColors[affirmation.moderationStatus] || 'border-indigo-500';

                return (
                  <div key={affirmation.id} className={`border-l-4 ${borderColor} pl-4 py-2`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-500">
                        #{affirmation.idx + 1}
                      </span>
                      {affirmation.moderationStatus && (
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          affirmation.moderationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                          affirmation.moderationStatus === 'flagged' ? 'bg-red-100 text-red-800' :
                          affirmation.moderationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {affirmation.moderationStatus}
                        </span>
                      )}
                      {affirmation.autoFlagged && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                          Auto-flagged
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-900">{affirmation.text}</div>
                    {affirmation.moderationReason && (
                      <div className="text-xs text-red-600 mt-1">
                        Reason: {affirmation.moderationReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

