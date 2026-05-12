import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'karysm_recently_viewed';
const MAX_ITEMS = 10;

export interface RecentProvider {
  id: string;
  slug: string;
  displayName: string;
  city: string;
  avgRating: number;
  timestamp: number;
}

export async function addRecentlyViewed(provider: Omit<RecentProvider, 'timestamp'>): Promise<void> {
  try {
    const existing = await getRecentlyViewed();
    const filtered = existing.filter(p => p.id !== provider.id);
    const updated = [{ ...provider, timestamp: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export async function getRecentlyViewed(): Promise<RecentProvider[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
