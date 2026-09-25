'use client';

import React from 'react';
import { GitCommit, Github, Sparkles, ExternalLink, ShieldCheck, CheckCircle2, ChevronDown, UserCheck } from 'lucide-react';
import { DeveloperProfile } from '@/types/activity';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface NavbarProps {
  profile: DeveloperProfile;
  onConnectClick: () => void;
  onDisconnectClick: () => void;
  activeView: 'dashboard' | 'landing';
  setActiveView: (view: 'dashboard' | 'landing') => void;
}

export function Navbar({
  profile,
  onConnectClick,
  onDisconnectClick,
  activeView,
  setActiveView,
}: NavbarProps) {
  const [showDropdown, setShowDropdown] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#21262d] bg-[#0b0f17]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveView('dashboard')}
            className="flex items-center gap-2.5 text-left group transition-transform active:scale-98"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#238636] to-[#2ea043] shadow-md shadow-emerald-950/40 text-white">
              <GitCommit className="h-5 w-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white font-mono group-hover:text-emerald-400 transition-colors">
                  Strakvu
                </span>
                <span className="hidden sm:inline-flex text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
                  beta
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-[#8b949e] font-sans">
                developer activity calendar
              </p>
            </div>
          </button>

          {/* Quick tab switcher (Dashboard vs Landing preview) */}
          <nav className="hidden md:flex items-center ml-4 pl-4 border-l border-[#21262d] gap-1">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
                activeView === 'dashboard'
                  ? 'bg-[#161b22] text-white border border-[#30363d]'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Activity Grid
            </button>
            <button
              onClick={() => setActiveView('landing')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
                activeView === 'landing'
                  ? 'bg-[#161b22] text-white border border-[#30363d]'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              About & Connect
            </button>
          </nav>
        </div>

        {/* Right side Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {profile.isConnected ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 rounded-lg border border-[#30363d] bg-[#161b22] px-2.5 py-1.5 hover:border-[#484f58] transition-colors text-left"
              >
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profile.avatarUrl}
                    alt={profile.username}
                    className="h-6 w-6 rounded-full ring-1 ring-emerald-500/60 object-cover"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#39d353] ring-1 ring-[#0d1117]" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-medium text-white flex items-center gap-1 font-mono">
                    <span>@{profile.username}</span>
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-[#8b949e]" />
              </button>

              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#30363d] bg-[#161b22] p-2 shadow-2xl z-50 animate-in fade-in-0 zoom-in-95">
                    <div className="p-2 border-b border-[#21262d]">
                      <p className="text-xs font-semibold text-white font-mono">
                        {profile.displayName}
                      </p>
                      <p className="text-[11px] text-[#8b949e] font-mono">
                        github.com/{profile.username}
                      </p>
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>GitHub OAuth Synced</span>
                      </div>
                    </div>

                    <div className="p-1 space-y-1">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          setActiveView('dashboard');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-[#c9d1d9] hover:bg-[#21262d] hover:text-white font-mono transition-colors"
                      >
                        Activity Dashboard
                      </button>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          setActiveView('landing');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-[#c9d1d9] hover:bg-[#21262d] hover:text-white font-mono transition-colors"
                      >
                        Feature Overview
                      </button>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          onDisconnectClick();
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-red-400 hover:bg-red-950/30 hover:text-red-300 font-mono transition-colors"
                      >
                        Disconnect Account
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Button
              onClick={onConnectClick}
              variant="default"
              size="sm"
              className="bg-[#238636] hover:bg-[#2ea043] font-mono font-medium text-xs sm:text-sm px-3 sm:px-4"
            >
              <Github className="h-4 w-4" />
              <span>Connect GitHub</span>
            </Button>
          )}

          {/* Quick Mobile nav toggle between view */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setActiveView(activeView === 'dashboard' ? 'landing' : 'dashboard')}
              className="px-2.5 py-1.5 rounded-lg border border-[#30363d] bg-[#161b22] text-xs font-mono text-[#c9d1d9]"
            >
              {activeView === 'dashboard' ? 'Info' : 'Grid'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
