import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import type {
  Assessment,
  ConversationEngine,
  LiveError,
  LogEntry,
  OperatorContext,
  QslReport,
} from '@cq-talk/qso';
import {
  ASSESS_SYSTEM_PROMPT,
  assessInput,
  operatorSystemPrompt,
  reportInput,
  reportSystemPrompt,
  toMessages,
} from './prompts';

/** Server-side refusal fallbacks (Opus 5.5 and Sonnet 5.5; Haiku 5.5 has none). */
const fallbacksFor = (model: string) =>
  model === 'claude-haiku-5-5'
    ? {}
    : { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const };

/** Said on air when the model declines to continue, so the QSO never goes silent. */
export const REFUSAL_LINE =
  'Sorry, I lost you in the noise there. Let’s change frequency: what else is on your mind? Over.';

export class OperatorError extends Error {
  constructor(readonly kind: LiveError) {
    super(`Live operator failed: ${kind}`);
    this.name = 'OperatorError';
  }
}

const toLiveError = (error: unknown): LiveError => {
  if (error instanceof Anthropic.AuthenticationError) return 'key';
  if (error instanceof Anthropic.PermissionDeniedError) return 'key';
  if (error instanceof Anthropic.RateLimitError) return 'rate-limit';
  if (error instanceof Anthropic.APIConnectionError) return 'offline';
  return 'other';
};

const AssessmentSchema = z.object({
  verdict: z.enum(['fix', 'ok', 'none']),
  better: z.string(),
});

const ReportSchema = z.object({
  errors: z.array(z.object({ said: z.string(), better: z.string(), why: z.string() })),
  vocabulary: z.array(z.object({ phrase: z.string(), meaning: z.string() })),
  practice: z.array(z.string()),
});

export interface ClaudeEngineOptions {
  client: Anthropic;
  model: string;
  context: OperatorContext;
}

/** The live operator on the Claude API. */
export const createClaudeEngine = ({
  client,
  model,
  context,
}: ClaudeEngineOptions): ConversationEngine => ({
  async *transmit(log: readonly LogEntry[], signal?: AbortSignal) {
    let said = false;
    try {
      const stream = client.beta.messages.stream(
        {
          model,
          max_tokens: 4000,
          system: operatorSystemPrompt(context),
          messages: toMessages(log, context),
          // Short spoken turns: keep latency down
          output_config: { effort: 'low' },
          cache_control: { type: 'ephemeral' },
          ...fallbacksFor(model),
        },
        { signal },
      );
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          said = true;
          yield event.delta.text;
        }
      }
      const final = await stream.finalMessage();
      if (final.stop_reason === 'refusal' && !said) yield REFUSAL_LINE;
    } catch (error) {
      if (signal?.aborted) return;
      throw new OperatorError(toLiveError(error));
    }
  },

  async assess(text: string, log: readonly LogEntry[], signal?: AbortSignal): Promise<Assessment> {
    try {
      const response = await client.beta.messages.parse(
        {
          model,
          max_tokens: 2000,
          system: ASSESS_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: assessInput(text, log) }],
          output_config: { effort: 'low', format: betaZodOutputFormat(AssessmentSchema) },
          ...fallbacksFor(model),
        },
        { signal },
      );
      const verdict = response.stop_reason === 'refusal' ? null : response.parsed_output;
      if (!verdict) return { kind: 'none' };
      if (verdict.verdict === 'fix' && verdict.better.trim()) {
        return { kind: 'fix', better: verdict.better.trim() };
      }
      return verdict.verdict === 'ok' ? { kind: 'ok' } : { kind: 'none' };
    } catch {
      // A missing correction must never interrupt the conversation
      return { kind: 'none' };
    }
  },

  async report(log: readonly LogEntry[], signal?: AbortSignal): Promise<QslReport> {
    try {
      const response = await client.beta.messages.parse(
        {
          model,
          max_tokens: 8000,
          system: reportSystemPrompt(context.locale),
          messages: [{ role: 'user', content: reportInput(log, context) }],
          output_config: { effort: 'medium', format: betaZodOutputFormat(ReportSchema) },
          ...fallbacksFor(model),
        },
        { signal },
      );
      const report = response.stop_reason === 'refusal' ? null : response.parsed_output;
      if (!report) throw new OperatorError('refused');
      return {
        errors: report.errors.slice(0, 4),
        vocabulary: report.vocabulary.slice(0, 4),
        practice: report.practice.slice(0, 3),
      };
    } catch (error) {
      if (error instanceof OperatorError) throw error;
      throw new OperatorError(toLiveError(error));
    }
  },
});
