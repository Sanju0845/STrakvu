'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Github, KeyRound, Shield, CheckCircle2, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';

interface ConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectSuccess: (customUsername?: string, token?: string) => void;
}

export function ConnectModal({
  open,
  onOpenChange,
  onConnectSuccess,
}: ConnectModalProps) {
  const [connectMethod, setConnectMethod] = useState<'oauth' | 'manual'>('oauth');
  const [usernameInput, setUsernameInput] = useState('');
  const [tokenInput, setTokenInput] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('strakvu_github_token') || '';
      } catch {
        return '';
      }
    }
    return '';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  const handleOAuthSignIn = async () => {
    setIsOAuthLoading(true);
    try {
      await signIn('github', { callbackUrl: '/?view=dashboard' });
    } catch {
      setIsOAuthLoading(false);
    }
  };

  const handleManualSync = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() && !tokenInput.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onConnectSuccess(usernameInput.trim(), tokenInput.trim() || undefined);
      onOpenChange(false);
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#161b22] border border-[#30363d] text-white mb-2">
          <Github className="h-5 w-5" />
        </div>
        <DialogTitle>Connect GitHub to Strakvu</DialogTitle>
        <DialogDescription>
          Sync your real GitHub commits, pushes, and repositories directly into your personal activity calendar.
        </DialogDescription>
      </DialogHeader>

      {/* Tabs */}
      <div className="flex border-b border-[#21262d] gap-2 pt-1 pb-3 text-xs font-mono">
        <button
          onClick={() => setConnectMethod('oauth')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            connectMethod === 'oauth'
              ? 'bg-[#238636] text-white font-medium'
              : 'text-[#8b949e] hover:text-white bg-[#161b22]'
          }`}
        >
          <Github className="h-3.5 w-3.5" />
          <span>GitHub OAuth (Recommended)</span>
        </button>

        <button
          onClick={() => setConnectMethod('manual')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            connectMethod === 'manual'
              ? 'bg-[#21262d] border border-[#30363d] text-white font-medium'
              : 'text-[#8b949e] hover:text-white'
          }`}
        >
          <span>Username / Token</span>
        </button>
      </div>

      {connectMethod === 'oauth' ? (
        <div className="space-y-4 pt-1">
          <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>1-Click GitHub Authorization</span>
            </div>
            <p className="text-xs text-[#c9d1d9] font-sans leading-relaxed">
              Authenticate securely with GitHub. Strakvu will read your activity events (pushes, commits, repositories) and populate your activity calendar automatically.
            </p>

            <Button
              onClick={handleOAuthSignIn}
              disabled={isOAuthLoading}
              className="w-full bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-xs h-10 shadow-lg shadow-emerald-950/50"
            >
              {isOAuthLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Redirecting to GitHub...</span>
                </>
              ) : (
                <>
                  <Github className="h-4 w-4 mr-2" />
                  <span>Sign in with GitHub</span>
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleManualSync} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-mono text-[#8b949e] mb-1.5">
              GitHub Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-mono text-[#484f58]">
                github.com/
              </span>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="username"
                className="w-full rounded-lg border border-[#30363d] bg-[#090d14] pl-28 pr-3 py-2 text-xs font-mono text-white placeholder:text-[#484f58] focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-[#6e7681] font-mono mt-1">
              Loads public GitHub events for this user without logging in.
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8b949e] mb-1.5">
              Personal Access Token (Optional, for private repos & higher limits)
            </label>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_..."
              className="w-full rounded-lg border border-[#30363d] bg-[#090d14] px-3 py-2 text-xs font-mono text-white placeholder:text-[#484f58] focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="border-[#30363d] text-[#8b949e]"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <span>Load Activity</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
