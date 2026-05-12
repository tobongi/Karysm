import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const PROD_API = 'https://tokoss-production.up.railway.app/api';

// Web dev: use relative /api — Metro proxy in metro.config.js forwards to Railway (same-origin, no CORS)
// Native dev: use local API at localhost:3001
// Production: always absolute Railway URL
const API_URL = (() => {
  if (!__DEV__) return PROD_API;
  if (Platform.OS === 'web') return '/api';
  return Platform.OS === 'android' ? 'http://10.0.2.2:3001/api' : 'http://localhost:3001/api';
})();

let authToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

async function refreshToken(): Promise<string | null> {
  try {
    const savedRefresh = await AsyncStorage.getItem('karysm_refresh');
    if (!savedRefresh) return null;

    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: savedRefresh }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.success && data.token) {
      authToken = data.token;
      await AsyncStorage.setItem('karysm_token', data.token);
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
}

async function forceLogout() {
  authToken = null;
  await AsyncStorage.multiRemove(['karysm_token', 'karysm_refresh', 'karysm_user']);
  // Redirect to login on web and native
  try {
    router.replace('/auth/login');
  } catch {
    // router might not be ready
  }
}

export async function api<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    let res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    // Auto-refresh on 401
    if (res.status === 401 && authToken) {
      if (!refreshPromise) {
        refreshPromise = refreshToken();
      }
      const newToken = await refreshPromise;
      refreshPromise = null;

      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(`${API_URL}${endpoint}`, { ...options, headers, signal: controller.signal });
      } else {
        await forceLogout();
        throw new Error('Session expirée');
      }
    }

    // Also handle 401 on non-auth endpoints (user never logged in)
    if (res.status === 401 && !authToken) {
      await forceLogout();
      throw new Error('Connectez-vous pour continuer');
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Erreur ${res.status}`);
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}
