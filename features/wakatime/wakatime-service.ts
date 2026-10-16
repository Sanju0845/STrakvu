import { WakaTimeDaySummary, WakaEditor, WakaHeartbeatSession, WakaProject } from './types';

const STORAGE_KEY = 'strakvu_wakatime_key';
const SESSIONS_STORAGE_KEY = 'strakvu_waka_sessions';
const REMAP_VSCODE_KEY = 'strakvu_remap_vscode';

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

  static getRemapVSCode(): string {
    if (typeof window === 'undefined') return 'Qoder';
    try {
      const val = localStorage.getItem(REMAP_VSCODE_KEY);
      return val !== null ? val : 'Qoder';
    } catch {
      return 'Qoder';
    }
  }

  static setRemapVSCode(val: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(REMAP_VSCODE_KEY, val);
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
      const remapTarget = this.getRemapVSCode();
      const params = new URLSearchParams({ date });
      if (key) {
        params.set('apiKey', key);
      }
      if (remapTarget) {
        params.set('remapVSCode', remapTarget);
      }

      const res = await fetch(`/api/wakatime?${params.toString()}`);
      let apiSummary: WakaTimeDaySummary | null = null;
      if (res.ok) {
        const data = await res.json();
        apiSummary = data?.summary || null;
      }

      // Remap any VS Code occurrences to user preference (e.g. Qoder)
      if (remapTarget && remapTarget.toLowerCase() !== 'none' && apiSummary?.editors) {
        for (const e of apiSummary.editors) {
          const lower = (e.name || '').toLowerCase();
          if (lower.includes('vs code') || lower.includes('visual studio code') || lower === 'code') {
            e.name = remapTarget;
            if (remapTarget.toLowerCase().includes('qoder')) {
              e.iconType = 'qoder';
            }
          }
        }
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

        // Augment hourly slots if custom sessions were logged
        let updatedHourly = apiSummary.hourlySlots || [];
        if (updatedHourly.length === 24) {
          for (const s of customSessions) {
            // Check if s.startTime has hour like "14:30" or "2:30 PM"
            let targetHour = 14;
            if (s.startTime) {
              const match = s.startTime.match(/(\d+):?(\d*)\s*(am|pm)?/i);
              if (match) {
                let h = parseInt(match[1], 10);
                const isPm = match[3] && match[3].toLowerCase() === 'pm';
                const isAm = match[3] && match[3].toLowerCase() === 'am';
                if (isPm && h < 12) h += 12;
                if (isAm && h === 12) h = 0;
                if (h >= 0 && h < 24) targetHour = h;
              }
            }
            if (updatedHourly[targetHour]) {
              updatedHourly[targetHour].totalSeconds += s.durationMinutes * 60;
              updatedHourly[targetHour].minutes += s.durationMinutes;
              updatedHourly[targetHour].percent = Math.min(100, Math.round((updatedHourly[targetHour].minutes / 60) * 100));
              if (updatedHourly[targetHour].minutes >= 45) updatedHourly[targetHour].intensity = 4;
              else if (updatedHourly[targetHour].minutes >= 30) updatedHourly[targetHour].intensity = 3;
              else if (updatedHourly[targetHour].minutes >= 15) updatedHourly[targetHour].intensity = 2;
              else updatedHourly[targetHour].intensity = 1;
              if (s.project && !updatedHourly[targetHour].projects.includes(s.project)) {
                updatedHourly[targetHour].projects.push(s.project);
              }
              if (s.editor && !updatedHourly[targetHour].editors.includes(s.editor)) {
                updatedHourly[targetHour].editors.push(s.editor);
              }
              updatedHourly[targetHour].primaryProject = s.project || updatedHourly[targetHour].primaryProject;
              updatedHourly[targetHour].primaryEditor = s.editor || updatedHourly[targetHour].primaryEditor;
            }
          }
        }

        return {
          ...apiSummary,
          totalSeconds: totalSecs,
          totalText: formatDuration(totalSecs),
          editors,
          projects,
          heartbeats: newHeartbeats,
          hourlySlots: updatedHourly,
        };
      }

      return apiSummary;
    } catch (e) {
      console.warn('Failed to fetch WakaTime summary:', e);
      return null;
    }
  }

  static async fetchMonthData(
    year: number,
    month: number,
    apiKey?: string
  ): Promise<{ days: Record<string, WakaTimeDaySummary>; totalSeconds: number }> {
    try {
      const key = apiKey !== undefined ? apiKey : this.getStoredApiKey();
      const remapTarget = this.getRemapVSCode();

      const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const params = new URLSearchParams({
        start: startDate,
        end: endDate,
      });
      if (key) params.set('apiKey', key);
      if (remapTarget) params.set('remapVSCode', remapTarget);

      const res = await fetch(`/api/wakatime?${params.toString()}`);
      let daysMap: Record<string, WakaTimeDaySummary> = {};

      if (res.ok) {
        const data = await res.json();
        if (data?.days) {
          daysMap = data.days;
        }
      }

      // Merge custom sessions for all days of this month
      const allCustom = this.getCustomSessions();
      let totalMonthSecs = 0;

      for (let d = 1; d <= lastDay; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayCustom = allCustom[dateStr] || [];
        let daySum = daysMap[dateStr];

        if (!daySum) {
          daySum = {
            date: dateStr,
            totalSeconds: 0,
            totalText: '0m',
            editors: [],
            languages: [],
            projects: [],
            heartbeats: [],
            isConnected: Boolean(key),
          };
          daysMap[dateStr] = daySum;
        }

        if (dayCustom.length > 0) {
          let customSecs = 0;
          const editorMap: Record<string, number> = {};
          const projectMap: Record<string, number> = {};

          for (const ed of daySum.editors) {
            editorMap[ed.name] = (editorMap[ed.name] || 0) + ed.total_seconds;
          }
          for (const pr of daySum.projects) {
            projectMap[pr.name] = (projectMap[pr.name] || 0) + pr.total_seconds;
          }

          for (const s of dayCustom) {
            const secs = (s.durationMinutes || 0) * 60;
            customSecs += secs;
            if (s.editor) editorMap[s.editor] = (editorMap[s.editor] || 0) + secs;
            if (s.project) projectMap[s.project] = (projectMap[s.project] || 0) + secs;
          }

          daySum.totalSeconds += customSecs;
          daySum.totalText = formatDuration(daySum.totalSeconds);

          daySum.editors = Object.entries(editorMap).map(([name, secs]) => ({
            name,
            total_seconds: secs,
            percent: daySum.totalSeconds > 0 ? Math.round((secs / daySum.totalSeconds) * 100) : 100,
            digital: formatDuration(secs),
            text: formatDuration(secs),
          }));

          daySum.projects = Object.entries(projectMap).map(([name, secs]) => ({
            name,
            total_seconds: secs,
            percent: daySum.totalSeconds > 0 ? Math.round((secs / daySum.totalSeconds) * 100) : 100,
            digital: formatDuration(secs),
            text: formatDuration(secs),
          }));
        }

        totalMonthSecs += daySum.totalSeconds;
      }

      // Cache locally
      try {
        localStorage.setItem(`strakvu_waka_month_${year}_${month}`, JSON.stringify({
          days: daysMap,
          totalSeconds: totalMonthSecs,
          timestamp: Date.now(),
        }));
      } catch {}

      return { days: daysMap, totalSeconds: totalMonthSecs };
    } catch (e) {
      console.warn('Failed to fetch month WakaTime data:', e);
      return { days: {}, totalSeconds: 0 };
    }
  }
}
