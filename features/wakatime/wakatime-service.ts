import { WakaTimeDaySummary, WakaEditor, WakaHeartbeatSession, WakaProject } from './types';

const STORAGE_KEY = 'strakvu_wakatime_key';
const SESSIONS_STORAGE_KEY = 'strakvu_waka_sessions';

export interface CustomEditorSession {
  id: string;
  date: string; // YYYY-MM-DD
  editor: 'Qoder' | 'Cursor' | 'VS Code' | 'JetBrains' | 'Antigravity / Web IDE' | 'Terminal' | string;
  durationMinutes: number;
  project: string;
  language?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

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

  static getCustomSessions(): Record<string, CustomEditorSession[]> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  static addCustomSession(session: CustomEditorSession): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getCustomSessions();
      const dateSessions = current[session.date] || [];
      current[session.date] = [session, ...dateSessions];
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(current));
    } catch {}
  }

  static async fetchDaySummary(date: string, apiKey?: string): Promise<WakaTimeDaySummary | null> {
    try {
      const key = apiKey !== undefined ? apiKey : this.getStoredApiKey();
      const params = new URLSearchParams({ date });
      if (key) {
        params.set('apiKey', key);
      }

      const res = await fetch(`/api/wakatime?${params.toString()}`);
      let apiSummary: WakaTimeDaySummary | null = null;
      if (res.ok) {
        const data = await res.json();
        apiSummary = data?.summary || null;
      }

      // Merge with custom editor sessions for that day
      const customSessions = this.getCustomSessions()[date] || [];

      if (!apiSummary) {
        apiSummary = {
          date,
          totalSeconds: 0,
          totalText: '0m',
          editors: [],
          languages: [],
          projects: [],
          heartbeats: [],
          isConnected: Boolean(key),
        };
      }

      if (customSessions.length > 0) {
        let addedSeconds = 0;
        const editorMap: Record<string, number> = {};
        const projectMap: Record<string, number> = {};

        // Seed existing from API
        for (const e of apiSummary.editors) {
          editorMap[e.name] = (editorMap[e.name] || 0) + e.total_seconds;
          addedSeconds += e.total_seconds;
        }
        for (const p of apiSummary.projects) {
          projectMap[p.name] = (projectMap[p.name] || 0) + p.total_seconds;
        }

        const newHeartbeats: WakaHeartbeatSession[] = [...apiSummary.heartbeats];

        for (const s of customSessions) {
          const sSeconds = s.durationMinutes * 60;
          addedSeconds += sSeconds;
          editorMap[s.editor] = (editorMap[s.editor] || 0) + sSeconds;
          projectMap[s.project] = (projectMap[s.project] || 0) + sSeconds;

          newHeartbeats.push({
            id: s.id,
            startTime: s.startTime || 'Active Session',
            endTime: s.endTime || '',
            startTimestamp: `${date}T12:00:00.000Z`,
            endTimestamp: `${date}T13:00:00.000Z`,
            durationText: `${s.durationMinutes}m`,
            durationMinutes: s.durationMinutes,
            project: s.project,
            editor: s.editor,
            language: s.language || 'TypeScript',
            file: s.notes || undefined,
          });
        }

        const totalSecs = addedSeconds;
        const editors: WakaEditor[] = Object.entries(editorMap).map(([name, secs]) => ({
          name,
          total_seconds: secs,
          percent: totalSecs > 0 ? Math.round((secs / totalSecs) * 100) : 100,
          digital: formatDuration(secs),
          text: formatDuration(secs),
        }));

        const projects: WakaProject[] = Object.entries(projectMap).map(([name, secs]) => ({
          name,
          total_seconds: secs,
          percent: totalSecs > 0 ? Math.round((secs / totalSecs) * 100) : 100,
          digital: formatDuration(secs),
          text: formatDuration(secs),
        }));

        return {
          ...apiSummary,
          totalSeconds: totalSecs,
          totalText: formatDuration(totalSecs),
          editors,
          projects,
          heartbeats: newHeartbeats,
        };
      }

      return apiSummary;
    } catch (e) {
      console.warn('Failed to fetch WakaTime summary:', e);
      return null;
    }
  }
}
