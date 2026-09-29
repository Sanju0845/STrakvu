import { NextRequest, NextResponse } from 'next/server';
import { WakaTimeDaySummary, WakaEditor, WakaLanguage, WakaProject, WakaHeartbeatSession } from '@/features/wakatime/types';

export const dynamic = 'force-dynamic';

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const apiKey = searchParams.get('apiKey') || process.env.WAKATIME_API_KEY;

    // If apiKey is provided, fetch real live WakaTime data
    if (apiKey && apiKey.trim().length > 0) {
      try {
        const encodedKey = Buffer.from(apiKey.trim()).toString('base64');
        const res = await fetch(`https://wakatime.com/api/v1/users/current/summaries?start=${date}&end=${date}`, {
          headers: {
            Authorization: `Basic ${encodedKey}`,
          },
          next: { revalidate: 60 },
        });

        if (res.ok) {
          const wakaData = await res.json();
          const dayData = wakaData?.data?.[0];

          if (dayData) {
            const totalSecs = dayData.grand_total?.total_seconds || 0;
            const editors: WakaEditor[] = (dayData.editors || []).map((e: any) => ({
              name: e.name,
              total_seconds: e.total_seconds,
              percent: e.percent,
              digital: e.digital,
              text: e.text || formatDuration(e.total_seconds),
              iconType: e.name.toLowerCase().includes('cursor')
                ? 'cursor'
                : e.name.toLowerCase().includes('qoder')
                ? 'code'
                : e.name.toLowerCase().includes('code')
                ? 'vscode'
                : 'code',
            }));

            const languages: WakaLanguage[] = (dayData.languages || []).map((l: any) => ({
              name: l.name,
              total_seconds: l.total_seconds,
              percent: l.percent,
              digital: l.digital,
              text: l.text || formatDuration(l.total_seconds),
            }));

            const projects: WakaProject[] = (dayData.projects || []).map((p: any) => ({
              name: p.name,
              total_seconds: p.total_seconds,
              percent: p.percent,
              digital: p.digital,
              text: p.text || formatDuration(p.total_seconds),
            }));

            return NextResponse.json({
              success: true,
              summary: {
                date,
                totalSeconds: totalSecs,
                totalText: dayData.grand_total?.text || formatDuration(totalSecs),
                dailyAverageText: 'From live WakaTime API',
                editors,
                languages,
                projects,
                heartbeats: [],
                isConnected: true,
              },
            });
          }
        }
      } catch (err) {
        console.warn('WakaTime live fetch failed:', err);
      }
    }

    // Clean empty state when no API key is configured or no activity exists
    const cleanSummary: WakaTimeDaySummary = {
      date,
      totalSeconds: 0,
      totalText: '0m',
      dailyAverageText: 'No API key configured',
      editors: [],
      languages: [],
      projects: [],
      heartbeats: [],
      isConnected: Boolean(apiKey),
    };

    return NextResponse.json({
      success: true,
      summary: cleanSummary,
      isSimulated: false,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to process WakaTime query' },
      { status: 500 }
    );
  }
}
