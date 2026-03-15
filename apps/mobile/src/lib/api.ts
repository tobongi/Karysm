const API_URL = __DEV__
  ? 'http://localhost:3001/api'
  : 'https://api.tokoss.com/api';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export async function api<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}
