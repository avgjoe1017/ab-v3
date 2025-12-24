/**
 * Admin API Client
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export class AdminApiError extends Error {
  code: string;
  details?: unknown;

  constructor(error: ApiError) {
    super(error.message);
    this.code = error.code;
    this.details = error.details;
    this.name = 'AdminApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new AdminApiError(data);
  }

  return data;
}

export const adminApi = {
  // Auth
  login: async (email: string, password: string) => {
    return request<{ token: string; admin: { email: string; role: string; name?: string } }>(
      '/admin/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
  },

  logout: async () => {
    return request('/admin/auth/logout', { method: 'POST' });
  },

  // Dashboard
  getDashboardStats: async () => {
    return request<{
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
    }>('/admin/dashboard/stats');
  },

  // Sessions
  getSessions: async (
    page = 1,
    limit = 50,
    source?: string,
    search?: string,
    audioReady?: string
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (source) params.append('source', source);
    if (search) params.append('search', search);
    if (audioReady) params.append('audioReady', audioReady);
    return request(`/admin/sessions?${params}`);
  },

  getSession: async (id: string) => {
    return request(`/admin/sessions/${id}`);
  },

  deleteSession: async (id: string) => {
    return request(`/admin/sessions/${id}`, { method: 'DELETE' });
  },

  rebuildAudio: async (id: string) => {
    return request(`/admin/sessions/${id}/rebuild-audio`, { method: 'POST' });
  },

  getAudioIntegrity: async (id: string) => {
    return request(`/admin/sessions/${id}/audio-integrity`);
  },

  // Jobs
  getJobs: async (page = 1, limit = 50, status?: string, type?: string, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append('status', status);
    if (type) params.append('type', type);
    if (search) params.append('search', search);
    return request(`/admin/jobs?${params}`);
  },

  getJob: async (id: string) => {
    return request(`/admin/jobs/${id}`);
  },

  retryJob: async (id: string) => {
    return request(`/admin/jobs/${id}/retry`, { method: 'POST' });
  },

  cancelJob: async (id: string) => {
    return request(`/admin/jobs/${id}/cancel`, { method: 'POST' });
  },

  requeueJob: async (id: string) => {
    return request(`/admin/jobs/${id}/requeue`, { method: 'POST' });
  },

  // Users
  getUsers: async (page = 1, limit = 50, search?: string, plan?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);
    if (plan) params.append('plan', plan);
    return request(`/admin/users?${params}`);
  },

  getUser: async (id: string) => {
    return request(`/admin/users/${id}`);
  },

  // Audit Log
  getAuditLogs: async (
    page = 1,
    limit = 50,
    filters?: {
      adminUserId?: string;
      action?: string;
      resourceType?: string;
      resourceId?: string;
      startDate?: string;
      endDate?: string;
    }
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filters?.adminUserId) params.append('adminUserId', filters.adminUserId);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.resourceType) params.append('resourceType', filters.resourceType);
    if (filters?.resourceId) params.append('resourceId', filters.resourceId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    return request(`/admin/audit?${params}`);
  },

  // AI Sources
  getAISources: async () => {
    return request('/admin/ai-sources');
  },

  getAISource: async (id: string) => {
    return request(`/admin/ai-sources/${id}`);
  },

  createAISource: async (data: { name: string; description?: string }) => {
    return request('/admin/ai-sources', { method: 'POST', body: JSON.stringify(data) });
  },

  createAISourceVersion: async (templateId: string, data: {
    name: string;
    content: string;
    model?: string;
    voice?: string;
    cachingPolicy?: string;
  }) => {
    return request(`/admin/ai-sources/${templateId}/versions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateAISourceVersion: async (versionId: string, data: {
    name?: string;
    content?: string;
    model?: string;
    voice?: string;
    cachingPolicy?: string;
    rolloutPercent?: number;
    isTest?: boolean;
  }) => {
    return request(`/admin/ai-sources/versions/${versionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  activateAISourceVersion: async (versionId: string, rolloutPercent: number = 100) => {
    return request(`/admin/ai-sources/versions/${versionId}/activate`, {
      method: 'POST',
      body: JSON.stringify({ rolloutPercent }),
    });
  },

  // Moderation
  getModerationStats: async () => {
    return request('/admin/moderation/stats');
  },

  getFlaggedSessions: async (page = 1, limit = 50) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return request(`/admin/moderation/flagged?${params}`);
  },

  moderateAffirmation: async (id: string, action: 'approve' | 'reject' | 'flag' | 'edit', editedText?: string, reason?: string) => {
    return request(`/admin/moderation/affirmations/${id}`, {
      method: 'POST',
      body: JSON.stringify({ action, editedText, reason }),
    });
  },

  bulkModerateAffirmations: async (ids: string[], action: 'approve' | 'reject', reason?: string) => {
    return request('/admin/moderation/affirmations/bulk', {
      method: 'POST',
      body: JSON.stringify({ affirmationIds: ids, action, reason }),
    });
  },
};

