'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tokoss-production.up.railway.app/api';

let authToken: string | null = null;

export function setAdminToken(token: string | null) {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('karysm_admin_token', token);
    } else {
      localStorage.removeItem('karysm_admin_token');
    }
  }
}

export function getAdminToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== 'undefined') {
    authToken = localStorage.getItem('karysm_admin_token');
  }
  return authToken;
}

export async function adminApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (res.status === 401) {
    setAdminToken(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Session expirée');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}
