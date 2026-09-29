import { ActivityEvent, DeveloperProfile } from '@/types/activity';
import { GitHubDayActivity, GitHubSyncState } from './types';

/**
 * Service for managing GitHub activities, sync routines, and repo summaries
 */
export class GitHubFeatureService {
  static formatCommitMessage(msg: string): string {
    if (!msg) return 'Updated code';
    const firstLine = msg.split('\n')[0].trim();
    return firstLine.replace(/^(feat|fix|chore|refactor|docs|style|test|build|perf|ci)(\([^)]+\))?:\s*/i, '');
  }

  static getCleanRepoName(fullRepo: string): string {
    if (!fullRepo) return 'repository';
    return fullRepo.includes('/') ? fullRepo.split('/')[1] : fullRepo;
  }
}
