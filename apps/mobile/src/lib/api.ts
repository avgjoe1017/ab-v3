import { API_BASE_URL } from "./config";
import { useAuth } from "@clerk/clerk-expo";

/**
 * Get auth token for API requests
 * This is a helper that can be used in API functions
 */
async function getAuthToken(): Promise<string | null> {
  // In practice, we'll pass the token from components using useAuthToken()
  // For now, return null (will be handled by components)
  return null;
}

/**
 * Create headers with authentication
 */
async function createHeaders(authToken?: string | null): Promise<HeadersInit> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  // Add auth token if provided
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  
  return headers;
}

export async function apiGet<T>(path: string, authToken?: string | null): Promise<T> {
  const headers = await createHeaders(authToken);
  const res = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
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
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}
