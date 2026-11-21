import type { QslReport } from './report';

/** How a line the user said was judged. */
export type Assessment =
  /** A more natural way to say it (English), shown as "✎ Mejor: …" */
  | { kind: 'fix'; better: string }
  /** Said well: "✓ Copiado 5 y 9" */
  | { kind: 'ok' }
  /** Nothing worth noting */
  | { kind: 'none' };

/** One transmission in the conversation log. */
export interface LogEntry {
  id: string;
  who: 'operator' | 'you';
  /** Always English: the conversation itself is never translated */
  text: string;
  /** Only for the user's lines; undefined while it is being assessed */
  assessment?: Assessment;
}

/** What the status line under the clock says. */
export type CallStatus = 'tuning' | 'receiving' | 'your-turn' | 'transmitting' | 'closing';

/** Why a live QSO stopped working. */
export type LiveError = 'key' | 'rate-limit' | 'offline' | 'refused' | 'other';

/** What the live operator needs to know about the contact. */
export interface OperatorContext {
  topic: string;
  /** Station call sign, e.g. JA1·AI */
  call: string;
  /** Station city in English, e.g. "Tokyo, Japan" */
  city: string;
  freq: string;
  /** Language for explanations on the QSL card: es, en or pt-BR */
  locale: string;
}

/**
 * The part of `AbortSignal` the contract needs. The domain does not load the DOM types;
 * implementations receive a real `AbortSignal`.
 */
export interface CancelSignal {
  readonly aborted: boolean;
}

/**
 * A live operator. Implementations hold the network client; the QSO domain only knows this
 * contract. Every method takes the whole log so far, oldest first.
 */
export interface ConversationEngine {
  /** The operator's next transmission, streamed as text chunks */
  transmit(log: readonly LogEntry[], signal?: CancelSignal): AsyncIterable<string>;
  /** Judges one line the user said */
  assess(text: string, log: readonly LogEntry[], signal?: CancelSignal): Promise<Assessment>;
  /** The QSL card's lessons for this QSO */
  report(log: readonly LogEntry[], signal?: CancelSignal): Promise<QslReport>;
}
