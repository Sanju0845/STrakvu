import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Octokit } from 'octokit';
import { ActivityEvent, CommitDetail, DayActivity, DeveloperProfile } from '@/types/activity';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryUsername = searchParams.get('username');
    const queryToken = searchParams.get('token');

    // 1. Check NextAuth session first
    const session = await getServerSession(authOptions);
    // @ts-expect-error accessToken stored on session
    const sessionToken: string | undefined = session?.accessToken;
    // @ts-expect-error username stored on session user
    const sessionUsername: string | undefined = session?.user?.username || session?.user?.name;

    const token = queryToken || sessionToken || process.env.GITHUB_TOKEN;
    const targetUsername = queryUsername || sessionUsername || (token ? undefined : 'sanjayanand');

    let octokit: Octokit;
    let userProfile: DeveloperProfile;

    if (token) {
      octokit = new Octokit({ auth: token });
      try {
        const { data: authUser } = await octokit.rest.users.getAuthenticated();
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
              ? 'GitHub API rate limit reached. Please generate a personal token or connect via GitHub OAuth.'
              : 'Failed to authenticate with GitHub token: ' + (err?.message || err),
            isRateLimit,
          },
          { status: isRateLimit ? 429 : 401 }
        );
      }
    } else if (targetUsername) {
      octokit = new Octokit();
      try {
        const { data: publicUser } = await octokit.rest.users.getByUsername({
          username: targetUsername,
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
        return NextResponse.json(
          {
            error: isRateLimit
              ? 'GitHub unauthenticated API rate limit reached on shared server IP. Please connect via GitHub OAuth or enter a Personal Access Token in the Connect modal.'
              : `User '${targetUsername}' not found on GitHub: ` + (err?.message || err),
            isRateLimit,
          },
          { status: isRateLimit ? 429 : 404 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'No GitHub token or username provided.' },
        { status: 400 }
      );
    }

    // 2. Fetch events from GitHub Events API (last 90 days / up to 300 events)
    const rawEvents: any[] = [];
    const maxPages = 3;

    for (let page = 1; page <= maxPages; page++) {
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
      } catch (err: any) {
        if (page === 1 && rawEvents.length === 0) {
          const isRateLimit = err?.status === 403 || (err?.message && err.message.toLowerCase().includes('rate limit'));
          if (isRateLimit) {
            return NextResponse.json(
              {
                error: 'GitHub API rate limit reached for shared IP. Connect via GitHub OAuth or enter a Personal Access Token in the Connect dialog.',
                isRateLimit: true,
              },
              { status: 429 }
            );
          }
        }
        break;
      }
    }

    // 3. Filter for: PushEvent, CreateEvent, PullRequestEvent
    const allowedTypes = ['PushEvent', 'CreateEvent', 'PullRequestEvent'];
    const filteredRaw = rawEvents.filter((e) => allowedTypes.includes(e.type));

    // 4. Transform into ActivityEvent format and group by date
    const eventsByDate: Record<string, ActivityEvent[]> = {};
    const repoFrequency: Record<string, number> = {};
    let totalCommitsAcrossPeriod = 0;

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
      repoFrequency[repoName] = (repoFrequency[repoName] || 0) + 1;

      let eventType: ActivityEvent['type'] = 'commit';
      let title = '';
      let description: string | undefined = undefined;
      let branch = 'main';
      let commits: CommitDetail[] | undefined = undefined;
      let hash = e.id?.substring(0, 7) || 'evt';

      if (e.type === 'PushEvent') {
        eventType = 'push';
        branch = e.payload?.ref ? e.payload.ref.replace('refs/heads/', '') : 'main';
        const rawCommits: any[] = Array.isArray(e.payload?.commits) ? e.payload.commits : [];

        if (rawCommits.length > 0) {
          totalCommitsAcrossPeriod += rawCommits.length;
          commits = rawCommits.map((c, cIdx) => ({
            id: `cmt-${e.id}-${cIdx}`,
            hash: c.sha ? c.sha.substring(0, 7) : hash,
            message: c.message || 'Updated repository files',
            repo: repoName,
            branch,
            time: timeStr,
            timestamp: e.created_at,
            additions: 0,
            deletions: 0,
          }));
          hash = commits[0]?.hash || hash;
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
        branch,
        time: timeStr,
        timestamp: e.created_at,
        commits,
        hash,
      };

      if (!eventsByDate[dateStr]) {
        eventsByDate[dateStr] = [];
      }
      eventsByDate[dateStr].push(activityEvent);
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
      // Check current streak from today or yesterday
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

      // Compute longest consecutive days
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

    userProfile.topRepo = topRepo || userProfile.topRepo;
    userProfile.currentStreak = currentStreak;
    userProfile.longestStreak = Math.max(longestStreak, currentStreak);
    userProfile.totalCommitsMonth = totalCommitsAcrossPeriod;
    userProfile.activeReposCount = Object.keys(repoFrequency).length;

    return NextResponse.json({
      success: true,
      profile: userProfile,
      eventsByDate,
      totalEvents: filteredRaw.length,
      totalCommits: totalCommitsAcrossPeriod,
      repositories: Object.keys(repoFrequency),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error while fetching GitHub activity' },
      { status: 500 }
    );
  }
}
