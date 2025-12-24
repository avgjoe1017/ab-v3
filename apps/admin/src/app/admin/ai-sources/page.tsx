'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { adminApi, AdminApiError } from '@/lib/api';
import Breadcrumbs from '@/components/Breadcrumbs';
import Link from 'next/link';

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

export default function AISourcesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<AISourceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAISources();
      setTemplates(data.templates || []);
      setError('');
    } catch (err) {
      if (err instanceof AdminApiError && err.code === 'UNAUTHORIZED') {
        router.push('/admin/login');
      } else {
        const message = err instanceof Error ? err.message : 'Failed to load AI sources';
        // If it's a migration error, show helpful message
        if (message.includes('migration') || message.includes('does not exist')) {
          setError('AI Sources feature requires database migration. Please run: bun prisma migrate dev');
        } else {
          setError(message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="px-4 py-6 sm:px-0">
          <div className="text-gray-600">Loading AI sources...</div>
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
            { label: 'AI Sources' },
          ]}
        />

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Sources</h2>
          <p className="text-sm text-gray-600">
            Manage prompt templates and their versions for AI generation
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {templates.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500">No AI source templates found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => {
              const activeVersion = template.versions.find(v => v.isActive && !v.isTest);
              const testVersion = template.versions.find(v => v.isTest);

              return (
                <div key={template.id} className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          <Link
                            href={`/admin/ai-sources/${template.id}`}
                            className="hover:text-indigo-600"
                          >
                            {template.name}
                          </Link>
                        </h3>
                        {template.description && (
                          <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {activeVersion && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Active: v{activeVersion.version}
                          </span>
                        )}
                        {testVersion && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Test: v{testVersion.version}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{template.versions.length}</span> version(s)
                        {activeVersion && (
                          <span className="ml-2">
                            • Rollout: {activeVersion.rolloutPercent}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <Link
                        href={`/admin/ai-sources/${template.id}`}
                        className="text-sm text-indigo-600 hover:text-indigo-900"
                      >
                        View details →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

