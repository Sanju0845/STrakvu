import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Octokit } from 'octokit';
import { ActivityEvent, CommitDetail, DeveloperProfile } from '@/types/activity';

export const dynamic = 'force-dynamic';

// 2-minute in-memory cache to prevent hitting GitHub rate limits while staying fresh
interface CacheEntry {
  timestamp: number;
  data: any;
}
const activityCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 2 * 60 * 1000;

function synthesizeDayStory(events: ActivityEvent[], dateStr: string): string {
  if (!events || events.length === 0) return '';

  const repos = Array.from(new Set(events.map((e) => e.repo.split('/')[1] || e.repo)));
  const allCommitMessages: string[] = [];

  for (const evt of events) {
    if (evt.commits && evt.commits.length > 0) {
      for (const c of evt.commits) {
        if (c.message) {
          const firstLine = c.message.split('\n')[0].trim();
          if (firstLine && !allCommitMessages.includes(firstLine)) {
            allCommitMessages.push(firstLine);
          }
        }
      }
    } else if (evt.title) {
      const firstLine = evt.title.split('\n')[0].trim();
      if (firstLine && !allCommitMessages.includes(firstLine)) {
        allCommitMessages.push(firstLine);
      }
    }
  }

  const repoNames = repos.slice(0, 3).map((r) => `\`${r}\``).join(', ');
  const repoSuffix = repos.length > 3 ? ` and ${repos.length - 3} other repos` : '';

  const highlights = allCommitMessages.slice(0, 4).map((msg) => {
    return msg
      .replace(/^(feat|fix|chore|refactor|docs|style|test|build|perf|ci)(\([^)]+\))?:\s*/i, '')
      .replace(/^[a-z]/, (char) => char.toUpperCase());
  });

  if (highlights.length === 0) {
    return `Active coding session across ${repoNames}${repoSuffix} with ${events.length} git operations.`;
  }

  const mainActions = highlights.join(' · ');
  return `Worked across ${repoNames}${repoSuffix}: ${mainActions}. (${allCommitMessages.length} commit${allCommitMessages.length === 1 ? '' : 's'} recorded)`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryUsername = searchParams.get('username');
    const queryToken = searchParams.get('token');
    const forceRefresh = searchParams.get('refresh') === 'true';

    // 1. Check NextAuth session first
    const session = await getServerSession(authOptions);
    // @ts-expect-error accessToken stored on session
    const sessionToken: string | undefined = session?.accessToken;
    // @ts-expect-error username stored on session user
    const sessionUsername: string | undefined = session?.user?.username || session?.user?.name;

    const token = queryToken || sessionToken;
    const targetUsername = queryUsername || sessionUsername;

    if (!token && !targetUsername) {
      return NextResponse.json({
        success: true,
        profile: {
          username: '',
          displayName: 'Developer',
          avatarUrl: '',
          bio: 'Connect GitHub to view your live activity calendar',
          isConnected: false,
          currentStreak: 0,
          longestStreak: 0,
          totalCommitsMonth: 0,
          activeReposCount: 0,
          topRepo: '',
        },
        eventsByDate: {},
        storiesByDate: {},
        totalEvents: 0,
        totalCommits: 0,
        repositories: [],
      });
    }

    const cacheKey = `${token ? 'token:' + token.slice(-8) : 'user:' + targetUsername}`;

    // Check cache unless explicitly forced
    if (!forceRefresh) {
      const cached = activityCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return NextResponse.json({ ...cached.data, fromCache: true });
      }
    }

    let octokit: Octokit;
    let userProfile: DeveloperProfile;
    let usernameToQuery = targetUsername;

    if (token) {
      octokit = new Octokit({ auth: token });
      try {
        const { data: authUser } = await octokit.rest.users.getAuthenticated();
        usernameToQuery = authUser.login;
        const totalReposCount = (authUser.public_repos || 0) + (authUser.total_private_repos || 0);
        userProfile = {
          username: authUser.login,
          displayName: authUser.name || authUser.login,
          avatarUrl: authUser.avatar_url,
          bio: authUser.bio || 'GitHub Developer',
          isConnected: true,
          currentStreak: 0,
          longestStreak: 0,
          totalCommitsMonth: 0,
          activeReposCount: totalReposCount,
          topRepo: '',
        };
      } catch (err: any) {
        const isRateLimit = err?.status === 403 || (err?.message && err.message.toLowerCase().includes('rate limit'));
        return NextResponse.json(
          {
            error: isRateLimit
              ? 'GitHub API rate limit reached. Please reconnect via GitHub OAuth.'
              : 'Failed to authenticate with GitHub: ' + (err?.message || err),
            isRateLimit,
          },
          { status: isRateLimit ? 429 : 401 }
        );
      }
    } else if (usernameToQuery) {
      octokit = new Octokit();
      try {
        const { data: publicUser } = await octokit.rest.users.getByUsername({
          username: usernameToQuery,
        });
        userProfile = {
          username: publicUser.login,
          displayName: publicUser.name || publicUser.login,
          avatarUrl: publicUser.avatar_url,
          bio: publicUser.bio || 'GitHub Developer',
          isConnected: true,
          currentStreak: 0,
          longestStreak: 0,
          totalCommitsMonth: 0,
          activeReposCount: publicUser.public_repos || 0,
          topRepo: '',
        };
      } catch (err: any) {
        const isRateLimit = err?.status === 403 || (err?.message && err.message.toLowerCase().includes('rate limit'));
        if (isRateLimit) {
          const stale = activityCache.get(cacheKey);
          if (stale) {
            return NextResponse.json({ ...stale.data, fromCache: true, rateLimited: true });
          }
          return NextResponse.json(
            {
              error: 'GitHub API unauthenticated rate limit reached. Click "Connect GitHub" for unlimited 5,000 requests/hr.',
              isRateLimit: true,
            },
            { status: 429 }
          );
        }
        return NextResponse.json(
          {
            error: `GitHub user '${usernameToQuery}' not found: ` + (err?.message || err),
          },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'No GitHub token or username provided.' },
        { status: 400 }
      );
    }

    const eventsByDate: Record<string, ActivityEvent[]> = {};
    const repoFrequency: Record<string, number> = {};
    const allUserRepos: string[] = [];
    const seenCommitShas = new Set<string>();

    // Helper to record a single commit cleanly
    const addCommitToDate = (
      commitDateStr: string,
      fullSha: string,
      message: string,
      fullRepo: string,
      branchName: string = 'main',
      timestampStr?: string
    ) => {
      const shortSha = fullSha.substring(0, 7);
      if (seenCommitShas.has(fullSha) || seenCommitShas.has(shortSha)) {
        return;
      }
      seenCommitShas.add(fullSha);
      seenCommitShas.add(shortSha);

      if (!allUserRepos.includes(fullRepo)) {
        allUserRepos.push(fullRepo);
      }
      repoFrequency[fullRepo] = (repoFrequency[fullRepo] || 0) + 1;

      const cDate = timestampStr ? new Date(timestampStr) : new Date(commitDateStr + 'T12:00:00Z');
      const hours = cDate.getHours();
      const minutes = String(cDate.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 === 0 ? 12 : hours % 12;
      const timeStr = `${displayHour}:${minutes} ${ampm}`;

      const firstLine = message.split('\n')[0] || 'Code commit';
      const desc = message.split('\n').slice(1).join('\n').trim() || undefined;

      const commitDetail: CommitDetail = {
        id: `cmt-${fullSha}`,
        hash: shortSha,
        message: firstLine,
        repo: fullRepo,
        repoUrl: `https://github.com/${fullRepo}`,
        branch: branchName,
        time: timeStr,
        timestamp: timestampStr || cDate.toISOString(),
        additions: 0,
        deletions: 0,
      };

      const commitEvt: ActivityEvent = {
        id: `cmt-evt-${fullSha}`,
        type: 'commit',
        title: firstLine,
        description: desc,
        repo: fullRepo,
        repoUrl: `https://github.com/${fullRepo}`,
        branch: branchName,
        time: timeStr,
        timestamp: timestampStr || cDate.toISOString(),
        hash: shortSha,
        commits: [commitDetail],
      };

      if (!eventsByDate[commitDateStr]) {
        eventsByDate[commitDateStr] = [];
      }
      eventsByDate[commitDateStr].push(commitEvt);
    };

    // 2. Fetch User's Repositories (sorted by pushed to get recently active repos first)
    let reposData: any[] = [];
    try {
      if (token) {
        const res = await octokit.rest.repos.listForAuthenticatedUser({
          sort: 'pushed',
          per_page: 100,
          visibility: 'all',
        });
        reposData = res.data;
      } else if (usernameToQuery) {
        const res = await octokit.rest.repos.listForUser({
          username: usernameToQuery,
          sort: 'pushed',
          per_page: 100,
          type: 'all',
        });
        reposData = res.data;
      }

      for (const repo of reposData) {
        allUserRepos.push(repo.full_name);
        repoFrequency[repo.full_name] = (repoFrequency[repo.full_name] || 0) + 1;
      }
    } catch {
      // Non-critical, continue
    }

    // 3. Search Commits API — Fetches user commits across their entire GitHub journey across all history
    try {
      for (let searchPage = 1; searchPage <= 3; searchPage++) {
        const searchRes = await octokit.rest.search.commits({
          q: `author:${usernameToQuery}`,
          sort: 'author-date',
          order: 'desc',
          per_page: 100,
          page: searchPage,
        });

        if (!searchRes.data.items || searchRes.data.items.length === 0) break;

        for (const item of searchRes.data.items) {
          const dateRaw = item.commit?.author?.date || item.commit?.committer?.date;
          if (!dateRaw) continue;

          const cDate = new Date(dateRaw);
          const y = cDate.getFullYear();
          const m = String(cDate.getMonth() + 1).padStart(2, '0');
          const d = String(cDate.getDate()).padStart(2, '0');
          const ds = `${y}-${m}-${d}`;

          const repoFullName = item.repository?.full_name || 'repository';
          addCommitToDate(
            ds,
            item.sha,
            item.commit?.message || 'Updated code',
            repoFullName,
            'main',
            dateRaw
          );
        }

        if (searchRes.data.items.length < 100) break;
      }
    } catch {
      // Fallback to direct repo commit scanning if search.commits is restricted
    }

    // 4. Direct Commit Fetch from all active repositories (scans recent 25 repositories)
    const reposToDeepScan = reposData.slice(0, 25);
    for (const repoObj of reposToDeepScan) {
      const fullRepo = repoObj.full_name;
      const [owner, repo] = fullRepo.split('/');
      if (!owner || !repo) continue;

      try {
        const { data: repoCommits } = await octokit.rest.repos.listCommits({
          owner,
          repo,
          per_page: 100,
        });

        for (const c of repoCommits) {
          const commitDate = c.commit?.author?.date || c.commit?.committer?.date;
          if (!commitDate) continue;

          const cDate = new Date(commitDate);
          const y = cDate.getFullYear();
          const m = String(cDate.getMonth() + 1).padStart(2, '0');
          const d = String(cDate.getDate()).padStart(2, '0');
          const ds = `${y}-${m}-${d}`;

          addCommitToDate(
            ds,
            c.sha,
            c.commit?.message || 'Updated files',
            fullRepo,
            'main',
            commitDate
          );
        }
      } catch {
        // Skip individual repo error
      }
    }

    // 5. Fetch GitHub Events (Pushes, PRs, Repo Creations, Releases)
    for (let page = 1; page <= 3; page++) {
      try {
        let res: any;
        if (token) {
          res = await octokit.rest.activity.listEventsForAuthenticatedUser({
            username: userProfile.username,
            per_page: 100,
            page,
          });
        } else {
          res = await octokit.rest.activity.listPublicEventsForUser({
            username: userProfile.username,
            per_page: 100,
            page,
          });
        }

        if (!res.data || res.data.length === 0) break;

        for (const e of res.data) {
          const createdAt = new Date(e.created_at);
          const y = createdAt.getFullYear();
          const m = String(createdAt.getMonth() + 1).padStart(2, '0');
          const d = String(createdAt.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${d}`;

          const hours = createdAt.getHours();
          const minutes = String(createdAt.getMinutes()).padStart(2, '0');
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const displayHour = hours % 12 === 0 ? 12 : hours % 12;
          const timeStr = `${displayHour}:${minutes} ${ampm}`;

          const repoName = e.repo?.name || 'repository';
          if (!allUserRepos.includes(repoName)) {
            allUserRepos.push(repoName);
          }

          if (e.type === 'PushEvent') {
            const rawCommits: any[] = Array.isArray(e.payload?.commits) ? e.payload.commits : [];
            for (const c of rawCommits) {
              const sha = c.sha || `${e.id}`;
              addCommitToDate(dateStr, sha, c.message || 'Pushed commit', repoName, 'main', e.created_at);
            }
          } else if (e.type === 'PullRequestEvent') {
            const action = e.payload?.action || 'opened';
            const pr = e.payload?.pull_request;
            const isMerged = Boolean(pr?.merged);

            const prEvt: ActivityEvent = {
              id: `pr-${e.id}`,
              type: 'pull_request',
              title: `${isMerged ? 'Merged PR' : action === 'opened' ? 'Opened PR' : 'Updated PR'} #${e.payload?.number || ''}: ${pr?.title || repoName}`,
              description: pr?.body ? pr.body.slice(0, 160) : undefined,
              repo: repoName,
              repoUrl: `https://github.com/${repoName}`,
              branch: pr?.head?.ref || 'feature',
              time: timeStr,
              timestamp: e.created_at,
            };

            if (!eventsByDate[dateStr]) eventsByDate[dateStr] = [];
            eventsByDate[dateStr].push(prEvt);
          } else if (e.type === 'CreateEvent' && e.payload?.ref_type === 'repository') {
            const createEvt: ActivityEvent = {
              id: `create-${e.id}`,
              type: 'repo_created',
              title: `Created repository ${repoName}`,
              description: e.payload?.description || undefined,
              repo: repoName,
              repoUrl: `https://github.com/${repoName}`,
              branch: 'main',
              time: timeStr,
              timestamp: e.created_at,
            };

            if (!eventsByDate[dateStr]) eventsByDate[dateStr] = [];
            eventsByDate[dateStr].push(createEvt);
          }
        }
      } catch {
        break;
      }
    }

    // 6. Generate human story summary for each active date
    const storiesByDate: Record<string, string> = {};
    for (const [dateStr, dayEvents] of Object.entries(eventsByDate)) {
      storiesByDate[dateStr] = synthesizeDayStory(dayEvents, dateStr);
    }

    // Determine top repo
    let topRepo = '';
    let maxRepoCount = 0;
    for (const [r, count] of Object.entries(repoFrequency)) {
      if (count > maxRepoCount) {
        maxRepoCount = count;
        topRepo = r;
      }
    }

    // Calculate streaks
    const sortedDates = Object.keys(eventsByDate).sort();
    let currentStreak = 0;
    let longestStreak = 0;

    if (sortedDates.length > 0) {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      let checkDate = eventsByDate[todayStr] ? now : eventsByDate[yesterdayStr] ? yesterday : null;

      if (checkDate) {
        let tempDate = new Date(checkDate);
        while (true) {
          const ds = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;
          if (eventsByDate[ds] && eventsByDate[ds].length > 0) {
            currentStreak++;
            tempDate = new Date(tempDate.getTime() - 24 * 60 * 60 * 1000);
          } else {
            break;
          }
        }
      }

      let runningStreak = 0;
      let prevTimestamp = 0;
      for (const dStr of sortedDates) {
        const dObj = new Date(dStr + 'T00:00:00');
        const ts = dObj.getTime();
        if (prevTimestamp === 0 || ts - prevTimestamp === 86400000) {
          runningStreak++;
        } else {
          runningStreak = 1;
        }
        prevTimestamp = ts;
        if (runningStreak > longestStreak) longestStreak = runningStreak;
      }
    }

    // Total commits counted
    const totalCommitsCount = Object.values(eventsByDate).reduce((sum, dayEvts) => {
      return (
        sum +
        dayEvts.reduce((dSum, e) => {
          return dSum + (e.commits && e.commits.length > 0 ? e.commits.length : e.type === 'commit' ? 1 : 0);
        }, 0)
      );
    }, 0);

    userProfile.topRepo = topRepo || userProfile.topRepo || (allUserRepos[0] || '');
    userProfile.currentStreak = currentStreak;
    userProfile.longestStreak = Math.max(longestStreak, currentStreak);
    userProfile.totalCommitsMonth = totalCommitsCount;
    userProfile.activeReposCount = userProfile.activeReposCount || allUserRepos.length || 0;

    const responsePayload = {
      success: true,
      profile: userProfile,
      eventsByDate,
      storiesByDate,
      totalEvents: Object.values(eventsByDate).reduce((sum, evs) => sum + evs.length, 0),
      totalCommits: totalCommitsCount,
      repositories: allUserRepos,
    };

    // Cache the payload
    activityCache.set(cacheKey, {
      timestamp: Date.now(),
      data: responsePayload,
    });

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error while fetching GitHub activity' },
      { status: 500 }
    );
  }
}
