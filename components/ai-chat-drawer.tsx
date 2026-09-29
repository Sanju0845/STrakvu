'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  Loader2,
  Trash2,
  Copy,
  Check,
  BookmarkPlus,
  Minimize2,
  Maximize2,
  MessageSquare,
  HelpCircle,
  Code2,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { AIChatSession } from '@/types/activity';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  context?: {
    username?: string;
    selectedDayDate?: string;
    totalCommits?: number;
    repos?: string[];
    wakaDuration?: string;
  };
  onSaveToDayLog?: (date: string, chat: Omit<AIChatSession, 'id' | 'timestamp' | 'time'>) => void;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'Summarize my activity for today\'s standup 📋',
  'Draft a conventional commit message for recent changes ✍️',
  'How can I track AI Studio / Gemini prompt usage? 🤖',
  'Explain how Strakvu integrates WakaTime & GitHub 🚀',
];

export function AIChatDrawer({
  isOpen,
  onClose,
  context,
  onSaveToDayLog,
}: AIChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content:
        "👋 **Hey developer!** I'm your **Strakvu AI Assistant**.\n\nAsk me anything about your git commits, standup summaries, debugging, or how to track your **AI Studio / WakaTime** sessions.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const payload = {
        messages: newMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        context,
      };

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate AI response');
      }

      const botMsg: Message = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: data.text || 'No response returned from model.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          content: `⚠️ **Error:** ${err?.message || 'Could not connect to Gemini API.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSavePrompt = (msg: Message) => {
    if (!onSaveToDayLog) return;
    const targetDate = context?.selectedDayDate || new Date().toISOString().split('T')[0];

    // Find previous user prompt if this is a model message
    const prevMsg = messages.slice(0, messages.findIndex((m) => m.id === msg.id)).reverse().find((m) => m.role === 'user');

    onSaveToDayLog(targetDate, {
      source: 'gemini',
      promptTopic: prevMsg?.content || 'Developer AI Consultation',
      aiResponseSummary: msg.content.slice(0, 300) + (msg.content.length > 300 ? '...' : ''),
      targetRepo: context?.repos?.[0] || 'strakvu',
      tags: ['GEMINI', 'AI Studio'],
    });

    setSavedId(msg.id);
    setTimeout(() => setSavedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        content: "Chat history cleared. How can I help you next?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div
        className={cn(
          'relative flex flex-col h-full bg-[#0d1117] border-l border-[#30363d] shadow-2xl transition-all duration-300 w-full sm:w-[480px]',
          isExpanded && 'sm:w-[680px]'
        )}
      >
        {/* Chat Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#21262d] bg-[#161b22] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-950/70 border border-purple-800/60 text-purple-400">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-mono text-white">Strakvu AI Chat</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950 border border-purple-800 text-purple-300">
                  Gemini Flash
                </span>
              </div>
              <p className="text-[10px] text-[#8b949e] font-sans">
                Dev companion & commit assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearHistory}
              title="Clear chat history"
              className="p-1.5 text-[#8b949e] hover:text-rose-400 hover:bg-[#21262d] rounded-md transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse width' : 'Expand width'}
              className="hidden sm:inline-flex p-1.5 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-md transition-colors"
            >
              {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={onClose}
              title="Close chat"
              className="p-1.5 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-md transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick Prompts Bar */}
        <div className="border-b border-[#21262d] bg-[#161b22]/40 p-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] hover:border-purple-500 hover:text-purple-300 transition-colors shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex flex-col space-y-1',
                msg.role === 'user' ? 'items-end' : 'items-start'
              )}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8b949e] px-1">
                <span>{msg.role === 'user' ? 'You' : 'Strakvu AI'}</span>
                <span>·</span>
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={cn(
                  'rounded-2xl px-4 py-3 text-xs sm:text-sm max-w-[88%] font-sans leading-relaxed break-words shadow-md',
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white rounded-tr-none font-medium'
                    : 'bg-[#161b22] text-[#e6edf3] border border-[#30363d] rounded-tl-none whitespace-pre-wrap'
                )}
              >
                {msg.content}

                {/* Message Actions */}
                {msg.role === 'model' && msg.id !== 'welcome' && (
                  <div className="mt-2 pt-2 border-t border-[#30363d]/60 flex items-center gap-2 text-[11px] font-mono text-[#8b949e]">
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {onSaveToDayLog && (
                      <button
                        onClick={() => handleSavePrompt(msg)}
                        className="hover:text-purple-300 flex items-center gap-1 transition-colors"
                      >
                        {savedId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-purple-400" />
                            <span className="text-purple-400">Saved to Day</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="h-3 w-3" />
                            <span>Save to Day</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-2 text-xs font-mono text-[#8b949e]">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-950/70 border border-purple-800/60 text-purple-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              </div>
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl px-3.5 py-2 text-xs text-[#8b949e] animate-pulse">
                Thinking with Gemini Flash...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Box */}
        <div className="border-t border-[#21262d] bg-[#161b22] p-3 sm:p-4">
          <div className="relative flex items-center rounded-xl border border-[#30363d] bg-[#0d1117] focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 transition-all">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your commits, standups, or AI Studio..."
              className="flex-1 bg-transparent px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-[#6e7681] focus:outline-none resize-none max-h-24 font-sans"
            />
            <Button
              size="sm"
              disabled={!input.trim() || isLoading}
              onClick={() => handleSendMessage()}
              className="m-1.5 h-7 w-7 p-0 bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-[#8b949e]">
            <span>Shift + Enter for new line</span>
            <span>Powered by Gemini 3.8 Flash</span>
          </div>
        </div>
      </div>
    </div>
  );
}
