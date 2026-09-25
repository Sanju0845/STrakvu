import { ActivityEvent, DayActivity, DeveloperProfile, AIChatSession, ChromeResearchItem } from '@/types/activity';

export const INITIAL_DEVELOPER: DeveloperProfile = {
  username: 'sanjayanand',
  displayName: 'Sanjay Anand',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  bio: 'Building Strakvu — Developer Activity Calendar',
  isConnected: true,
  currentStreak: 0,
  longestStreak: 0,
  totalCommitsMonth: 0,
  activeReposCount: 0,
  topRepo: 'sanjayanand/strakvu',
  totalAiAssistedPrompts: 0,
};

export const POPULAR_REPOS: string[] = [
  'sanjayanand/strakvu',
];

// Generates an empty, pristine calendar month (zero dummy data)
export function getCleanMonthActivities(year: number, month: number, referenceDateStr?: string): DayActivity[] {
  const result: DayActivity[] = [];
  const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));

  const startDayOfWeek = firstDayOfMonth.getUTCDay(); // 0 is Sunday
  const daysInMonth = lastDayOfMonth.getUTCDate();

  const now = new Date();
  const todayStr = referenceDateStr || `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;

  // Previous month trailing days
  const prevMonthLastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const prevMonthNum = month === 0 ? 12 : month;
    const prevYearNum = month === 0 ? year - 1 : year;
    const dateStr = `${prevYearNum}-${String(prevMonthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    result.push({
      date: dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      totalActivities: 0,
      totalCommits: 0,
      level: 0,
      events: [],
      repos: [],
    });
  }

  // Current month days (all clean with 0 dummy events)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;

    result.push({
      date: dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday,
      totalActivities: 0,
      totalCommits: 0,
      level: 0,
      events: [],
      repos: [],
    });
  }

  // Trailing next-month days to fill 7 columns grid
  const remainingCells = (7 - (result.length % 7)) % 7;
  for (let n = 1; n <= remainingCells; n++) {
    const nextMonthNum = month === 11 ? 1 : month + 2;
    const nextYearNum = month === 11 ? year + 1 : year;
    const dateStr = `${nextYearNum}-${String(nextMonthNum).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
    result.push({
      date: dateStr,
      dayNumber: n,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      totalActivities: 0,
      totalCommits: 0,
      level: 0,
      events: [],
      repos: [],
    });
  }

  return result;
}

// Deterministic short hash for commit IDs
export function generateCommitHash(seed: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(7, '0').slice(0, 7);
}
