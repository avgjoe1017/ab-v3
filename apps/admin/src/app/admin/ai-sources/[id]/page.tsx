'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { adminApi, AdminApiError } from '@/lib/api';
import Breadcrumbs from '@/components/Breadcrumbs';

interface AISourceVersion {
  id: string;
  version: number;
  name: string;
  content: string;
  model?: string;
  voice?: string;
  cachingPolicy?: string;
  rolloutPercent: number;
  isActive: boolean;
  isTest: boolean;
  createdAt: string;
  activatedAt?: string;
}

interface AISourceTemplate {
  id: string;
  name: string;
  description?: string;
  currentVersion: number;
  versions: AISourceVersion[];
}

export default function AISourceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<AISourceTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<AISourceVersion | null>(null);
  const [showCreateVersion, setShowCreateVersion] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAISource(templateId);
      setTemplate(data.template);
      if (data.template.versions.length > 0) {
        setSelectedVersion(data.template.versions[0]);
      }
      setError('');
    } catch (err) {
      if (err instanceof AdminApiError && err.code === 'UNAUTHORIZED') {
        router.push('/admin/login');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load AI source');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (versionId: string) => {
    if (!confirm('Activate this version? This will deactivate all other versions.')) {
      return;
    }

    try {
      setActivating(versionId);
      await adminApi.activateAISourceVersion(versionId, 100);
      loadTemplate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to activate version');
    } finally {
      setActivating(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="px-4 py-6 sm:px-0">
          <div className="text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!template) {
    return (
      <AdminLayout>
        <div className="px-4 py-6 sm:px-0">
          <div className="text-red-600">Template not found</div>
        </div>
      </AdminLayout>
    );
  }

  const activeVersion = template.versions.find(v => v.isActive && !v.isTest);

  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'AI Sources', href: '/admin/ai-sources' },
            { label: template.name },
          ]}
        />

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{template.name}</h2>
          {template.description && (
            <p className="mt-1 text-sm text-gray-600">{template.description}</p>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Versions List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Versions</h3>
                <button
                  onClick={() => setShowCreateVersion(true)}
                  className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-900"
                >
                  + New Version
                </button>
              </div>

              <div className="space-y-2">
                {template.versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-3 border rounded-lg cursor-pointer ${
                      selectedVersion?.id === version.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedVersion(version)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            v{version.version}: {version.name}
                          </span>
                          {version.isActive && !version.isTest && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          )}
                          {version.isTest && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Test
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {new Date(version.createdAt).toLocaleDateString()}
                          {version.model && ` • ${version.model}`}
                        </div>
                      </div>
                      {!version.isActive && !version.isTest && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivate(version.id);
                          }}
                          disabled={activating === version.id}
                          className="px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                        >
                          {activating === version.id ? 'Activating...' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Version Detail */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {selectedVersion ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Version {selectedVersion.version} Details
                  </h3>

                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedVersion.name}</dd>
                    </div>

                    {selectedVersion.model && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Model</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedVersion.model}</dd>
                      </div>
                    )}

                    {selectedVersion.voice && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Voice</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedVersion.voice}</dd>
                      </div>
                    )}

                    {selectedVersion.cachingPolicy && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Caching Policy</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedVersion.cachingPolicy}</dd>
                      </div>
                    )}

                    {selectedVersion.isActive && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Rollout</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedVersion.rolloutPercent}%</dd>
                      </div>
                    )}

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Content</dt>
                      <dd className="mt-1">
                        <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-96 font-mono">
                          {selectedVersion.content}
                        </pre>
                      </dd>
                    </div>
                  </dl>
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Select a version to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

