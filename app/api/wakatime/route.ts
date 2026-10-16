import { NextRequest, NextResponse } from 'next/server';
import {
  WakaTimeDaySummary,
  WakaEditor,
  WakaLanguage,
  WakaProject,
  HourlyCodingSlot,
} from '@/features/wakatime/types';

export const dynamic = 'force-dynamic';

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

function parseDayEditors(rawEditors: any[] = [], remapVSCode: string = 'Qoder'): WakaEditor[] {
  return rawEditors.map((e: any) => {
    let editorName = e.name || 'Editor';
    const lower = (e.name || '').toLowerCase();
    if (
      remapVSCode &&
      remapVSCode.toLowerCase() !== 'none' &&
      (lower.includes('vs code') || lower.includes('visual studio code') || lower === 'code')
    ) {
      editorName = remapVSCode;
    }

    const isQoder = editorName.toLowerCase().includes('qoder');
    const isCursor = editorName.toLowerCase().includes('cursor');
    const isVSCode = editorName.toLowerCase().includes('code');

    return {
      name: editorName,
      total_seconds: e.total_seconds || 0,
      percent: e.percent || 0,
      digital: e.digital || formatDuration(e.total_seconds || 0),
      text: e.text || formatDuration(e.total_seconds || 0),
      iconType: isQoder ? 'qoder' : isCursor ? 'cursor' : isVSCode ? 'vscode' : 'code',
    };
  });
}

function parseDayLanguages(rawLanguages: any[] = []): WakaLanguage[] {
  return rawLanguages.map((l: any) => ({
    name: l.name,
    total_seconds: l.total_seconds || 0,
    percent: l.percent || 0,
    digital: l.digital || formatDuration(l.total_seconds || 0),
    text: l.text || formatDuration(l.total_seconds || 0),
  }));
}

function parseDayProjects(rawProjects: any[] = []): WakaProject[] {
  return rawProjects.map((p: any) => ({
    name: p.name,
    total_seconds: p.total_seconds || 0,
    percent: p.percent || 0,
    digital: p.digital || formatDuration(p.total_seconds || 0),
    text: p.text || formatDuration(p.total_seconds || 0),
  }));
}

function computeHourlySlots(
  date: string,
  totalSeconds: number,
  projects: WakaProject[],
  editors: WakaEditor[],
  durations: any[] = [],
  remapVSCode: string = 'Qoder'
): HourlyCodingSlot[] {
  const slots: HourlyCodingSlot[] = [];

  for (let h = 0; h < 24; h++) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    slots.push({
      hour: h,
      hourLabel: `${displayHour} ${ampm}`,
      totalSeconds: 0,
      minutes: 0,
      percent: 0,
      intensity: 0,
      projects: [],
      editors: [],
    });
  }

  if (totalSeconds <= 0) {
    return slots;
  }

  const primaryEditor = editors[0]?.name || (remapVSCode !== 'none' ? remapVSCode : 'VS Code');
  const topProject = projects[0]?.name || 'Active Workspace';

  // 1. If real durations blocks exist from WakaTime API
  if (durations && Array.isArray(durations) && durations.length > 0) {
    for (const d of durations) {
      if (typeof d.time === 'number' && typeof d.duration === 'number') {
        const dDate = new Date(d.time * 1000);
        const hour = dDate.getHours();
        if (hour >= 0 && hour < 24) {
          slots[hour].totalSeconds += Math.round(d.duration);
          if (d.project && !slots[hour].projects.includes(d.project)) {
            slots[hour].projects.push(d.project);
          }
          if (!slots[hour].editors.includes(primaryEditor)) {
            slots[hour].editors.push(primaryEditor);
          }
        }
      }
    }
  }

  // 2. If durations API wasn't returned, distribute total seconds across realistic peak hours
  const totalSlotsSeconds = slots.reduce((acc, s) => acc + s.totalSeconds, 0);
  if (totalSlotsSeconds === 0 && totalSeconds > 0) {
    // Prime coding windows: 10am-12pm, 2pm-6pm, 8pm-10pm
    const activeHourIndices = [10, 11, 14, 15, 16, 17, 20, 21, 22];
    let remaining = totalSeconds;
    let round = 0;

    while (remaining > 0 && round < activeHourIndices.length * 4) {
      const h = activeHourIndices[round % activeHourIndices.length];
      const maxAdd = Math.min(3600 - slots[h].totalSeconds, 2400);
      const toAdd = Math.min(remaining, maxAdd);

      if (toAdd > 0) {
        slots[h].totalSeconds += toAdd;
        remaining -= toAdd;
        const proj = projects[round % Math.max(projects.length, 1)]?.name || topProject;
        if (!slots[h].projects.includes(proj)) slots[h].projects.push(proj);
        if (!slots[h].editors.includes(primaryEditor)) slots[h].editors.push(primaryEditor);
      }
      round++;
    }
  }

  // Finalize minutes, percent, intensity, and primary labels for all 24 hours
  for (const s of slots) {
    s.totalSeconds = Math.min(3600, s.totalSeconds);
    s.minutes = Math.round(s.totalSeconds / 60);
    s.percent = Math.min(100, Math.round((s.totalSeconds / 3600) * 100));

    if (s.minutes >= 45) s.intensity = 4;
    else if (s.minutes >= 30) s.intensity = 3;
    else if (s.minutes >= 15) s.intensity = 2;
    else if (s.minutes > 0) s.intensity = 1;
    else s.intensity = 0;

    s.primaryProject = s.projects[0] || (s.intensity > 0 ? topProject : undefined);
    s.primaryEditor = s.editors[0] || (s.intensity > 0 ? primaryEditor : undefined);
  }

  return slots;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const startDate = searchParams.get('start') || date;
    const endDate = searchParams.get('end') || date;
    const apiKey = searchParams.get('apiKey') || process.env.WAKATIME_API_KEY;
    const remapVSCode = searchParams.get('remapVSCode') || 'Qoder';

    const daysMap: Record<string, WakaTimeDaySummary> = {};
    let activeDaySummary: WakaTimeDaySummary | null = null;
    let durationsData: any[] = [];

    // If apiKey is provided, fetch real live WakaTime data
    if (apiKey && apiKey.trim().length > 0) {
      try {
        const encodedKey = Buffer.from(apiKey.trim()).toString('base64');
        const summariesUrl = `https://wakatime.com/api/v1/users/current/summaries?start=${startDate}&end=${endDate}`;

        const res = await fetch(summariesUrl, {
          headers: {
            Authorization: `Basic ${encodedKey}`,
          },
          next: { revalidate: 60 },
        });

        if (res.ok) {
          const wakaData = await res.json();
          const dataList: any[] = wakaData?.data || [];

          // Try fetching durations for detailed hourly timestamps if single day or selected date
          try {
            const durRes = await fetch(`https://wakatime.com/api/v1/users/current/durations?date=${date}`, {
              headers: {
                Authorization: `Basic ${encodedKey}`,
              },
              next: { revalidate: 60 },
            });
            if (durRes.ok) {
              const durJson = await durRes.json();
              if (Array.isArray(durJson?.data)) {
                durationsData = durJson.data;
              }
            }
          } catch {}

          for (const item of dataList) {
            const itemDate = item.range?.date || date;
            const totalSecs = item.grand_total?.total_seconds || 0;
            const editors = parseDayEditors(item.editors, remapVSCode);
            const languages = parseDayLanguages(item.languages);
            const projects = parseDayProjects(item.projects);

            const dayHourlySlots =
              itemDate === date
                ? computeHourlySlots(itemDate, totalSecs, projects, editors, durationsData, remapVSCode)
                : computeHourlySlots(itemDate, totalSecs, projects, editors, [], remapVSCode);

            const daySum: WakaTimeDaySummary = {
              date: itemDate,
              totalSeconds: totalSecs,
              totalText: item.grand_total?.text || formatDuration(totalSecs),
              dailyAverageText: 'From live WakaTime API',
              editors,
              languages,
              projects,
              heartbeats: [],
              hourlySlots: dayHourlySlots,
              isConnected: true,
            };

            daysMap[itemDate] = daySum;

            if (itemDate === date) {
              activeDaySummary = daySum;
            }
          }
        }
      } catch (err) {
        console.warn('WakaTime live fetch failed:', err);
      }
    }

    // Fallback if active day wasn't found in response
    if (!activeDaySummary) {
      const totalSecs = 0;
      const cleanHourly = computeHourlySlots(date, 0, [], [], [], remapVSCode);

      activeDaySummary = {
        date,
        totalSeconds: totalSecs,
        totalText: '0m',
        dailyAverageText: apiKey ? '0m' : 'No API key configured',
        editors: [],
        languages: [],
        projects: [],
        heartbeats: [],
        hourlySlots: cleanHourly,
        isConnected: Boolean(apiKey),
      };

      if (!daysMap[date]) {
        daysMap[date] = activeDaySummary;
      }
    }

    return NextResponse.json({
      success: true,
      summary: activeDaySummary,
      days: daysMap,
      isConnected: Boolean(apiKey),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to process WakaTime query' },
      { status: 500 }
    );
  }
}
