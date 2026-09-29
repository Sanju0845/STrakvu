import { AIChatSession } from '@/types/activity';

export interface AISessionModel {
  name: string;
  provider: 'anthropic' | 'openai' | 'google' | 'cursor';
  badgeColor: string;
}

export interface AIActivityContext {
  date: string;
  sessions: AIChatSession[];
  totalPromptsCount: number;
}
