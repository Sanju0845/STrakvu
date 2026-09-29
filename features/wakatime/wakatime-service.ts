import { WakaTimeDaySummary } from './types';

const STORAGE_KEY = 'strakvu_wakatime_key';

export class WakaTimeService {
  static getStoredApiKey(): string {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  }

  static setStoredApiKey(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      if (key) {
        localStorage.setItem(STORAGE_KEY, key);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }

  static async fetchDaySummary(date: string, apiKey?: string): Promise<WakaTimeDaySummary | null> {
    try {
      const key = apiKey || this.getStoredApiKey();
      const params = new URLSearchParams({ date });
      if (key) {
        params.set('apiKey', key);
      }

      const res = await fetch(`/api/wakatime?${params.toString()}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data?.summary || null;
    } catch (e) {
      console.warn('Failed to fetch WakaTime summary:', e);
      return null;
    }
  }
}
