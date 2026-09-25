'use client';

import React from 'react';
import { Github, Calendar, GitCommit, GitPullRequest, ArrowRight, Bot, Compass, Sparkles, Terminal, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';

interface LandingHeroProps {
  isConnected: boolean;
  onConnectClick: () => void;
  onGoToDashboard: () => void;
}

export function LandingHero({
  isConnected,
  onConnectClick,
  onGoToDashboard,
}: LandingHeroProps) {
  return (
    <div className="relative overflow-hidden py-10 sm:py-16">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 w-[300px] h-[250px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        {/* App Logo */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#161b22] border border-[#30363d] p-2 shadow-2xl shadow-emerald-950/60 ring-1 ring-emerald-500/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/strakvu.png"
              alt="Strakvu"
              className="h-12 w-12 object-contain"
            />
          </div>
        </div>

        {/* Release badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-mono text-emerald-300 shadow-sm backdrop-blur-sm mb-6">
          <span className="flex h-2 w-2 rounded-full bg-[#39d353] animate-pulse" />
          <span>Strakvu · The Humanoid Developer Activity Hub</span>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white font-sans max-w-3xl mx-auto leading-[1.15]">
          Your daily dev story,{' '}
          <span className="bg-gradient-to-r from-[#39d353] via-emerald-400 to-purple-400 bg-clip-text text-transparent">
            from AI prompts to shipped commits.
          </span>
        </h1>

        {/* Tagline explaining the unified workflow */}
        <p className="mt-5 text-base sm:text-lg text-[#8b949e] max-w-2xl mx-auto leading-relaxed font-sans">
          A calendar that connects your entire coding loop. Auto-sync your GitHub commits and pushes, attach what you discussed with Claude, ChatGPT, or Gemini, and see the major project you actually built every day.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          {isConnected ? (
            <Button
              onClick={onGoToDashboard}
              size="lg"
              className="w-full sm:w-auto bg-[#238636] hover:bg-[#2ea043] font-mono text-white text-sm px-6 h-11"
            >
              <span>Open Activity Calendar</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={onConnectClick}
              size="lg"
              className="w-full sm:w-auto bg-[#238636] hover:bg-[#2ea043] font-mono text-white text-sm px-6 h-11"
            >
              <Github className="h-4 w-4 mr-2" />
              <span>Connect GitHub</span>
            </Button>
          )}

          <Button
            onClick={onGoToDashboard}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto border-[#30363d] bg-[#161b22] text-[#c9d1d9] hover:text-white font-mono text-sm px-5 h-11"
          >
            <Calendar className="h-4 w-4 mr-2 text-emerald-400" />
            <span>Explore Demo Data</span>
          </Button>
        </div>

        {/* Status hints */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-[#8b949e]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            100% Free GitHub API
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5 text-purple-400" />
            Paste AI chats (Claude / ChatGPT / Gemini)
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            Human-readable daily summary
          </span>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-14 sm:mt-18 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="rounded-xl border border-[#30363d] bg-[#0d1117]/80 p-5 shadow-lg relative overflow-hidden group hover:border-[#484f58] transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 mb-4">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-white font-mono">
              Major Project at a Glance
            </h3>
            <p className="mt-1.5 text-xs text-[#8b949e] leading-relaxed">
              No guesswork. Each calendar cell highlights the primary repository worked on that day, with activity density dots showing real effort.
            </p>
          </div>

          <div className="rounded-xl border border-[#30363d] bg-[#0d1117]/80 p-5 shadow-lg relative overflow-hidden group hover:border-[#484f58] transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-950/60 border border-purple-800/40 text-purple-400 mb-4">
              <Bot className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-white font-mono">
              AI Prompts & IDE Link
            </h3>
            <p className="mt-1.5 text-xs text-[#8b949e] leading-relaxed">
              Remember why you wrote that code. Link prompts and brainstorming sessions from Claude, ChatGPT, or Cursor directly to that day&apos;s commits.
            </p>
          </div>

          <div className="rounded-xl border border-[#30363d] bg-[#0d1117]/80 p-5 shadow-lg relative overflow-hidden group hover:border-[#484f58] transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-950/60 border border-sky-800/40 text-sky-400 mb-4">
              <GitCommit className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-white font-mono">
              Exact Times & Code Diffs
            </h3>
            <p className="mt-1.5 text-xs text-[#8b949e] leading-relaxed">
              Free automatic pulls of every commit message, push event, diff stat, and timestamp down to the minute.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
