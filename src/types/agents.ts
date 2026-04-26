/** Agent type definitions for the multi-agent research platform. */

import type { ProviderType } from './index';

export interface AgentConfig {
  name: string;
  role: 'domain' | 'supervisor';
  provider: ProviderType;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface ClassifierResult {
  classification: string;
  rawResponse: string;
}

export interface ExtractorResult {
  parsed: Record<string, unknown>;
  rawResponse: string;
}

export interface AppraisalResult {
  ratings: Record<string, number>;
  rawResponse: string;
}

export type SupervisorResult = ClassifierResult | ExtractorResult | AppraisalResult;

export interface TranscriptMessage {
  turn: number;
  agentName: string;
  content: string;
  provider: string;
  model: string;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  timeTakenMs: number;
  wordCount: number;
  createdAt: string;
}

export interface SupervisorOutput {
  afterTurn: number;
  supervisorName: string;
  outputType: 'classification' | 'extraction' | 'appraisal';
  parsed: Record<string, unknown>;
  rawResponse: string;
}
