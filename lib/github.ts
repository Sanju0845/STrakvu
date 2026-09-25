import { Octokit } from 'octokit';

/**
 * Server-side Octokit instance helper for Strakvu.
 * Can be initialized with a user's GitHub OAuth token or an optional personal access token.
 */
export function getOctokitClient(accessToken?: string) {
  return new Octokit({
    auth: accessToken || process.env.GITHUB_ACCESS_TOKEN || undefined,
  });
}
