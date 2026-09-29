'use client';

import React from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { GitCommit, Github, CheckCircle2, ChevronDown, LogOut, ArrowRight, Loader2, Clock, Calendar, Info } from 'lucide-react';
import { DeveloperProfile } from '@/types/activity';
import { Button } from './ui/button';

interface NavbarProps {
  profile: DeveloperProfile;
  onConnectClick: () => void;
  onDisconnectClick: () => void;
  activeView: 'dashboard' | 'wakatime' | 'landing';
  setActiveView: (view: 'dashboard' | 'wakatime' | 'landing') => void;
}

export function Navbar({
  profile,
  onConnectClick,
  onDisconnectClick,
  activeView,
  setActiveView,
}: NavbarProps) {
  const sessionHook = useSession();
  const session = sessionHook?.data;
  const status = sessionHook?.status || 'unauthenticated';
  const [showDropdown, setShowDropdown] = React.useState(false);

  // Derive active authenticated user from NextAuth session if available
  const isSessionAuth = Boolean(session?.user);
  const isLoggedIn = isSessionAuth || (profile.isConnected && Boolean(profile.username));
  const avatarUrl = session?.user?.image || profile.avatarUrl;
  const displayName = session?.user?.name || profile.displayName || 'Developer';
  // @ts-expect-error custom username field
  const username = (session?.user?.username as string) || (session?.user?.name as string) || profile.username || 'developer';

  const handleSignOut = async () => {
    setShowDropdown(false);
    onDisconnectClick();
    if (session) {
      await signOut({ callbackUrl: '/?view=dashboard' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#21262d] bg-[#0b0f17]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Main Nav Links */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={() => setActiveView('dashboard')}
            className="flex items-center gap-2.5 text-left group transition-transform active:scale-98"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#161b22] border border-[#30363d] overflow-hidden shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/strakvu.png"
                alt="Strakvu Logo"
                className="h-7 w-7 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white font-mono group-hover:text-emerald-400 transition-colors">
                  Strakvu
                </span>
                <span className="hidden sm:inline-flex text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
                  live
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-[#8b949e] font-sans">
                developer activity calendar
              </p>
            </div>
          </button>

          {/* Nav Tabs Switcher */}
          <nav className="flex items-center ml-2 sm:ml-4 pl-2 sm:pl-4 border-l border-[#21262d] gap-1 sm:gap-1.5">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 ${
                activeView === 'dashboard'
                  ? 'bg-[#161b22] text-white border border-[#30363d] shadow-sm font-semibold'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]/40'
              }`}
            >
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              <span>Activity Grid</span>
            </button>

            <button
              onClick={() => setActiveView('wakatime')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 ${
                activeView === 'wakatime'
                  ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-800/60 shadow-sm font-semibold'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]/40'
              }`}
            >
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">WakaTime Studio</span>
              <span className="sm:hidden">WakaTime</span>
            </button>

            <button
              onClick={() => setActiveView('landing')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 ${
                activeView === 'landing'
                  ? 'bg-[#161b22] text-white border border-[#30363d] shadow-sm font-semibold'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]/40'
              }`}
            >
              <Info className="h-3.5 w-3.5 text-purple-400" />
              <span>About</span>
            </button>
          </nav>
        </div>

        {/* Right side Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {status === 'loading' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#30363d] bg-[#161b22] text-xs font-mono text-[#8b949e]">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
              <span className="hidden sm:inline">Checking auth...</span>
            </div>
          ) : isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 rounded-lg border border-[#30363d] bg-[#161b22] px-2.5 py-1.5 hover:border-[#484f58] transition-colors text-left"
              >
                <div className="relative">
                  {avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={avatarUrl}
                      alt={username}
                      className="h-6 w-6 rounded-full ring-1 ring-emerald-500/60 object-cover"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-[10px] font-mono text-emerald-300">
                      {username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#39d353] ring-1 ring-[#0d1117]" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-medium text-white flex items-center gap-1 font-mono">
                    <span>@{username}</span>
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
                      <p className="text-xs font-semibold text-white font-mono truncate">
                        {displayName}
                      </p>
                      <p className="text-[11px] text-[#8b949e] font-mono truncate">
                        github.com/{username}
                      </p>
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{isSessionAuth ? 'GitHub OAuth Active' : 'Connected via Token'}</span>
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
                        Activity Grid
                      </button>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          setActiveView('wakatime');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-[#c9d1d9] hover:bg-[#21262d] hover:text-white font-mono transition-colors"
                      >
                        WakaTime Studio
                      </button>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          setActiveView('landing');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-[#c9d1d9] hover:bg-[#21262d] hover:text-white font-mono transition-colors"
                      >
                        About & Features
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 font-mono transition-colors flex items-center gap-1.5 border-t border-[#21262d] mt-1 pt-2"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Disconnect Account</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Button
              size="sm"
              onClick={onConnectClick}
              className="h-8 bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-xs shadow-md"
            >
              <Github className="h-3.5 w-3.5 mr-1.5" />
              <span>Connect GitHub</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
