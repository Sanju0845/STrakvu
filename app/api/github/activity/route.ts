import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Octokit } from 'octokit';
import { ActivityEvent, CommitDetail, DayActivity, DeveloperProfile } from '@/types/activity';

export const dynamic = 'force-dynamic';

// 5-minute in-memory cache to prevent hitting GitHub's 60 req/hr rate limits
interface CacheEntry {
  timestamp: number;
  data: any;
}
const activityCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function synthesizeDayStory(events: ActivityEvent[], dateStr: string): string {
  if (!events || events.length === 0) return '';

  const repos = Array.from(new Set(events.map((e) => e.repo.split('/')[1] || e.repo)));
  const allCommitMessages: string[] = [];
  let prCount = 0;
  let pushCount = 0;

  for (const evt of events) {
    if (evt.type === 'pull_request') prCount++;
    if (evt.type === 'push') pushCount++;
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
      allCommitMessages.push(evt.title);
    }
  }

  const repoNames = repos.slice(0, 3).map((r) => `\`${r}\``).join(', ');
  const repoSuffix = repos.length > 3 ? ` and ${repos.length - 3} other repos` : '';

  // Extract clean bullet-points or thematic summary
  const highlights = allCommitMessages.slice(0, 4).map((msg) => {
    // Clean conventional commit prefixes
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

    const token = queryToken || sessionToken || process.env.GITHUB_TOKEN;
    const targetUsername = queryUsername || sessionUsername || (token ? undefined : 'sanjayanand');

    const cacheKey = `${token ? 'token:' + token.slice(-8) : 'user:' + (targetUsername || 'default')}`;

    // Check cache unless explicitly requested to bypass
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
        userProfile = {
          username: authUser.login,
          displayName: authUser.name || authUser.login,
          avatarUrl: authUser.avatar_url,
          bio: authUser.bio || 'GitHub Developer',
          isConnected: true,
          currentStreak: 0,
          longestStreak: 0,
          totalCommitsMonth: 0,
          activeReposCount: 0,
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
          activeReposCount: 0,
          topRepo: '',
        };
      } catch (err: any) {
        const isRateLimit = err?.status === 403 || (err?.message && err.message.toLowerCase().includes('rate limit'));
        if (isRateLimit) {
          // If unauthenticated rate limit hit, check if we have any stale cache
          const stale = activityCache.get(cacheKey);
          if (stale) {
            return NextResponse.json({ ...stale.data, fromCache: true, rateLimited: true });
          }
          return NextResponse.json(
            {
              error: 'GitHub API unauthenticated IP quota reached. Please click "Connect GitHub" for 5,000 free requests/hr.',
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
    let totalCommitsAcrossPeriod = 0;

    // 2. Fetch User's Repositories (up to 100)
    try {
      let reposData: any[] = [];
      if (token) {
        const res = await octokit.rest.repos.listForAuthenticatedUser({
          sort: 'updated',
          per_page: 100,
          visibility: 'all',
        });
        reposData = res.data;
      } else if (usernameToQuery) {
        const res = await octokit.rest.repos.listForUser({
          username: usernameToQuery,
          sort: 'updated',
          per_page: 100,
          type: 'all',
        });
        reposData = res.data;
      }

      for (const repo of reposData) {
        allUserRepos.push(repo.full_name);
        repoFrequency[repo.full_name] = repo.stargazers_count || 1;
      }
    } catch {
      // Non-critical, continue with events
    }

    // 3. Fetch Events from GitHub Events API (up to 300 events / 90 days)
    const rawEvents: any[] = [];
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
        rawEvents.push(...res.data);
        if (res.data.length < 100) break;
      } catch {
        break;
      }
    }

    // Process GitHub events
    const allowedTypes = ['PushEvent', 'CreateEvent', 'PullRequestEvent', 'ReleaseEvent'];
    const filteredRaw = rawEvents.filter((e) => allowedTypes.includes(e.type));

    for (const e of filteredRaw) {
      const createdAt = new Date(e.created_at);
      const year = createdAt.getFullYear();
      const month = String(createdAt.getMonth() + 1).padStart(2, '0');
      const day = String(createdAt.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const hours = createdAt.getHours();
      const minutes = String(createdAt.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 === 0 ? 12 : hours % 12;
      const timeStr = `${displayHour}:${minutes} ${ampm}`;

      const repoName = e.repo?.name || 'repository';
      if (!allUserRepos.includes(repoName)) {
        allUserRepos.push(repoName);
      }
      repoFrequency[repoName] = (repoFrequency[repoName] || 0) + 1;

      let eventType: ActivityEvent['type'] = 'commit';
      let title = '';
      let description: string | undefined = undefined;
      let branch = 'main';
      let commits: CommitDetail[] | undefined = undefined;
      let realHash = (e.payload?.head || e.id || '').substring(0, 7);

      if (e.type === 'PushEvent') {
        eventType = 'push';
        branch = e.payload?.ref ? e.payload.ref.replace('refs/heads/', '') : 'main';
        const rawCommits: any[] = Array.isArray(e.payload?.commits) ? e.payload.commits : [];

        if (rawCommits.length > 0) {
          totalCommitsAcrossPeriod += rawCommits.length;
          commits = rawCommits.map((c, cIdx) => {
            const sha = c.sha || `${e.id}${cIdx}`;
            const shortSha = sha.substring(0, 7);
            return {
              id: `cmt-${sha}`,
              hash: shortSha,
              message: c.message || 'Updated repository files',
              repo: repoName,
              repoUrl: `https://github.com/${repoName}`,
              branch,
              time: timeStr,
              timestamp: e.created_at,
              additions: 0,
              deletions: 0,
            };
          });
          realHash = commits[0]?.hash || realHash;
          title =
            rawCommits.length === 1
              ? rawCommits[0].message || `Pushed 1 commit to ${branch}`
              : `Pushed ${rawCommits.length} commits to ${branch}`;
        } else {
          totalCommitsAcrossPeriod += 1;
          title = `Pushed updates to ${branch}`;
        }
      } else if (e.type === 'CreateEvent') {
        const refType = e.payload?.ref_type || 'repository';
        branch = e.payload?.master_branch || 'main';

        if (refType === 'repository') {
          eventType = 'repo_created';
          title = `Created repository ${repoName}`;
          description = e.payload?.description || undefined;
        } else {
          eventType = 'push';
          title = `Created ${refType} ${e.payload?.ref || ''} in ${repoName}`;
        }
      } else if (e.type === 'PullRequestEvent') {
        eventType = 'pull_request';
        const action = e.payload?.action || 'opened';
        const pr = e.payload?.pull_request;
        const isMerged = Boolean(pr?.merged);

        title = `${isMerged ? 'Merged PR' : action === 'opened' ? 'Opened PR' : 'Updated PR'} #${e.payload?.number || ''}: ${pr?.title || repoName}`;
        description = pr?.body ? pr.body.slice(0, 160) : undefined;
        branch = pr?.head?.ref || 'feature';
      }

      const activityEvent: ActivityEvent = {
        id: `evt-${e.id}`,
        type: eventType,
        title,
        description,
        repo: repoName,
        repoUrl: `https://github.com/${repoName}`,
        branch,
        time: timeStr,
        timestamp: e.created_at,
        commits,
        hash: realHash,
      };

      if (!eventsByDate[dateStr]) {
        eventsByDate[dateStr] = [];
      }
      eventsByDate[dateStr].push(activityEvent);
    }

    // 4. Also fetch deeper commit history for top 3 repositories if user has fewer than 15 days of activity
    const distinctActiveDays = Object.keys(eventsByDate).length;
    if (distinctActiveDays < 15 && allUserRepos.length > 0) {
      const topReposToScan = allUserRepos.slice(0, 3);
      for (const fullRepo of topReposToScan) {
        const [owner, repo] = fullRepo.split('/');
        if (!owner || !repo) continue;

        try {
          const { data: repoCommits } = await octokit.rest.repos.listCommits({
            owner,
            repo,
            per_page: 30,
          });

          for (const c of repoCommits) {
            const commitDate = c.commit?.author?.date || c.commit?.committer?.date;
            if (!commitDate) continue;

            const cDate = new Date(commitDate);
            const y = cDate.getFullYear();
            const m = String(cDate.getMonth() + 1).padStart(2, '0');
            const d = String(cDate.getDate()).padStart(2, '0');
            const ds = `${y}-${m}-${d}`;

            const hours = cDate.getHours();
            const minutes = String(cDate.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHour = hours % 12 === 0 ? 12 : hours % 12;
            const timeStr = `${displayHour}:${minutes} ${ampm}`;

            const fullSha = c.sha || 'unknown';
            const shortSha = fullSha.substring(0, 7);

            // Avoid duplicating if already present in events
            if (eventsByDate[ds]?.some((ev) => ev.hash === shortSha || ev.commits?.some((sc) => sc.hash === shortSha))) {
              continue;
            }

            const commitEvt: ActivityEvent = {
              id: `repo-cmt-${fullSha}`,
              type: 'commit',
              title: c.commit?.message?.split('\n')[0] || 'Code commit',
              description: c.commit?.message?.split('\n').slice(1).join('\n').trim() || undefined,
              repo: fullRepo,
              repoUrl: `https://github.com/${fullRepo}`,
              branch: 'main',
              time: timeStr,
              timestamp: commitDate,
              hash: shortSha,
              commits: [
                {
                  id: `cmt-${fullSha}`,
                  hash: shortSha,
                  message: c.commit?.message || 'Updated files',
                  repo: fullRepo,
                  repoUrl: `https://github.com/${fullRepo}`,
                  branch: 'main',
                  time: timeStr,
                  timestamp: commitDate,
                  additions: 0,
                  deletions: 0,
                },
              ],
            };

            if (!eventsByDate[ds]) {
              eventsByDate[ds] = [];
            }
            eventsByDate[ds].push(commitEvt);
            totalCommitsAcrossPeriod++;
          }
        } catch {
          // Ignore individual repo errors
        }
      }
    }

    // 5. Generate human story summary for each active date
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

    userProfile.topRepo = topRepo || userProfile.topRepo || (allUserRepos[0] || 'sanjayanand/strakvu');
    userProfile.currentStreak = currentStreak;
    userProfile.longestStreak = Math.max(longestStreak, currentStreak);
    userProfile.totalCommitsMonth = totalCommitsAcrossPeriod;
    userProfile.activeReposCount = allUserRepos.length || Object.keys(repoFrequency).length;

    const responsePayload = {
      success: true,
      profile: userProfile,
      eventsByDate,
      storiesByDate,
      totalEvents: Object.values(eventsByDate).reduce((sum, evs) => sum + evs.length, 0),
      totalCommits: totalCommitsAcrossPeriod,
      repositories: allUserRepos,
    };

    // Cache the successful payload
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
