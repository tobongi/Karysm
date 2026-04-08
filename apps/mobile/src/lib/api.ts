import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const PROD_API = 'https://tokoss-production.up.railway.app/api';

const DEV_API = Platform.select({
  web: 'http://localhost:3001/api',
  default: 'http://localhost:3001/api',
});

// In dev mode on web, use prod API (local port may conflict with other projects)
// In dev mode on native, use local API
// In production builds (expo export), always use prod API
const API_URL = __DEV__
  ? Platform.OS === 'web' ? PROD_API : DEV_API!
  : PROD_API;

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
    const savedRefresh = await AsyncStorage.getItem('tokoss_refresh');
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
      await AsyncStorage.setItem('tokoss_token', data.token);
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
}

async function forceLogout() {
  authToken = null;
  await AsyncStorage.multiRemove(['tokoss_token', 'tokoss_refresh', 'tokoss_user']);
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
