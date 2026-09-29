'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { CheckCircle2, ChevronDown, LogOut, Loader2, Clock, Calendar, Info, Github } from 'lucide-react';
import { DeveloperProfile } from '@/types/activity';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

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
    <header className="sticky top-0 z-40 w-full border-b border-[#21262d] bg-[#0b0f17]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 gap-2">
        {/* Brand & Main Nav Links */}
        <div className="flex items-center gap-2 sm:gap-6 min-w-0">
          <button
            onClick={() => setActiveView('dashboard')}
            className="flex items-center gap-2 text-left group transition-transform active:scale-98 shrink-0"
          >
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#161b22] border border-[#30363d] overflow-hidden shadow-md shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/strakvu.png"
                alt="Strakvu Logo"
                className="h-6 w-6 sm:h-7 sm:w-7 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-bold tracking-tight text-white font-mono group-hover:text-emerald-400 transition-colors">
                  Strakvu
                </span>
                <span className="inline-flex text-[9px] sm:text-[10px] uppercase font-mono tracking-wider px-1 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
                  live
                </span>
              </div>
            </div>
          </button>

          {/* Nav Tabs Switcher (Responsive on all screen sizes) */}
          <nav className="flex items-center ml-1 sm:ml-4 pl-1 sm:pl-4 border-l border-[#21262d] gap-1">
            <button
              onClick={() => setActiveView('dashboard')}
              className={cn(
                'px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1 sm:gap-1.5',
                activeView === 'dashboard'
                  ? 'bg-[#161b22] text-white border border-[#30363d] shadow-sm font-semibold'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]/40'
              )}
            >
              <Calendar className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Activity Grid</span>
              <span className="sm:hidden text-[11px]">Grid</span>
            </button>

            <button
              onClick={() => setActiveView('wakatime')}
              className={cn(
                'px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1 sm:gap-1.5',
                activeView === 'wakatime'
                  ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-800/60 shadow-sm font-semibold'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]/40'
              )}
            >
              <Clock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="hidden md:inline">WakaTime Studio</span>
              <span className="hidden sm:inline md:hidden">WakaTime</span>
              <span className="sm:hidden text-[11px]">Pulse</span>
            </button>

            <button
              onClick={() => setActiveView('landing')}
              className={cn(
                'px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1 sm:gap-1.5',
                activeView === 'landing'
                  ? 'bg-[#161b22] text-white border border-[#30363d] shadow-sm font-semibold'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]/40'
              )}
            >
              <Info className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span className="text-[11px] sm:text-xs">About</span>
            </button>
          </nav>
        </div>

        {/* Right side Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {status === 'loading' ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[#30363d] bg-[#161b22] text-xs font-mono text-[#8b949e]">
              <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
            </div>
          ) : isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-[#30363d] bg-[#161b22] px-2 py-1 sm:px-2.5 sm:py-1.5 hover:border-[#484f58] transition-colors text-left"
              >
                <div className="relative shrink-0">
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
                <div className="hidden sm:block text-left max-w-[120px] truncate">
                  <div className="text-xs font-medium text-white flex items-center gap-1 font-mono truncate">
                    <span>@{username}</span>
                  </div>
                </div>
                <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#8b949e]" />
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
              className="h-7 sm:h-8 px-2.5 sm:px-3 bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-[11px] sm:text-xs shadow-md"
            >
              <Github className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Connect GitHub</span>
              <span className="sm:hidden">Connect</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
