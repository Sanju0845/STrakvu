'use client';

import React, { useState } from 'react';
import { Github, KeyRound, Shield, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';

interface ConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectSuccess: (customUsername?: string) => void;
}

export function ConnectModal({
  open,
  onOpenChange,
  onConnectSuccess,
}: ConnectModalProps) {
  const [usernameInput, setUsernameInput] = useState('sanjayanand');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSimulateOAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onConnectSuccess(usernameInput.trim() || 'sanjayanand');
      onOpenChange(false);
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#161b22] border border-[#30363d] text-white mb-2">
          <Github className="h-5 w-5" />
        </div>
        <DialogTitle>Connect GitHub to Strakvu</DialogTitle>
        <DialogDescription>
          Sync your public commits, branches, and repositories into your Strakvu activity calendar.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSimulateOAuth} className="space-y-4 pt-1">
        <div>
          <label className="block text-xs font-mono text-[#8b949e] mb-1.5">
            GitHub Username or Organization
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-mono text-[#484f58]">
              github.com/
            </span>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="sanjayanand"
              className="w-full rounded-lg border border-[#30363d] bg-[#090d14] pl-28 pr-3 py-2 text-xs font-mono text-white placeholder:text-[#484f58] focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Permissions transparency */}
        <div className="rounded-lg border border-[#21262d] bg-[#161b22]/50 p-3 space-y-2 text-xs font-mono text-[#8b949e]">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <Shield className="h-3.5 w-3.5" />
            <span>Read-Only Activity Access</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Strakvu only reads public activity logs and contributions. No write access or repository modification rights are required.
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-[#484f58] pt-1 border-t border-[#21262d]">
            <span>OAuth Stack: NextAuth.js + Octokit REST v5</span>
          </div>
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
                <span>Authorizing...</span>
              </>
            ) : (
              <>
                <span>Connect & Sync</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
