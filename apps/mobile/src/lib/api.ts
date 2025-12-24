import { API_BASE_URL } from "./config";

type ApiErrorResponse = {
  code: string;
  message: string;
  details?: unknown;
};

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(status: number, payload: ApiErrorResponse) {
    super(payload.message || `HTTP ${status}`);
    this.code = payload.code || "INTERNAL_ERROR";
    this.status = status;
    this.details = payload.details;
  }
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

/**
 * Create headers with authentication
 */
async function createHeaders(tokenOverride?: string | null): Promise<HeadersInit> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  // Add auth token if provided
  const token = tokenOverride ?? authToken;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

export async function apiGet<T>(path: string, authToken?: string | null): Promise<T> {
  const headers = await createHeaders(authToken);
  const res = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    try {
      const payload = JSON.parse(text) as ApiErrorResponse;
      if (payload?.code) {
        throw new ApiError(res.status, payload);
      }
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: any, authToken?: string | null): Promise<T> {
  const headers = await createHeaders(authToken);
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    try {
      const payload = JSON.parse(text) as ApiErrorResponse;
      if (payload?.code) {
        throw new ApiError(res.status, payload);
      }
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export async function apiPut<T>(path: string, body: any, authToken?: string | null): Promise<T> {
  const headers = await createHeaders(authToken);
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    try {
      const payload = JSON.parse(text) as ApiErrorResponse;
      if (payload?.code) {
        throw new ApiError(res.status, payload);
      }
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}
