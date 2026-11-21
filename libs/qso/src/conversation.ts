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
export type CallStatus = 'tuning' | 'your-turn' | 'transmitting' | 'closing';
