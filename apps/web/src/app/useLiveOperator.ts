import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch } from 'react';
import type { TransmitNotice } from '@cq-talk/call';
import { messages } from '@cq-talk/i18n';
import type { Locale } from '@cq-talk/i18n';
import { isYourTurn } from '@cq-talk/qso';
import type {
  ConversationEngine,
  LiveError,
  LogEntry,
  OperatorContext,
  QslReport,
  QsoAction,
  QsoState,
} from '@cq-talk/qso';
import { createSpeechInput, findRecognition, normalizeTransmission } from '@cq-talk/speech';
import type { SpeechInput, SpeechInputOptions } from '@cq-talk/speech';

export interface LiveOperatorOptions {
  state: QsoState;
  dispatch: Dispatch<QsoAction>;
  apiKey: string | null;
  model: string;
  locale: Locale;
  /** The operator's voice is playing: keep the microphone closed */
  speaking: boolean;
  /** Tests inject a fake engine and microphone */
  createEngine?: (request: EngineRequest) => Promise<ConversationEngine>;
  createInput?: (options: SpeechInputOptions) => SpeechInput;
  /** Whether the browser can recognize speech (defaults to feature detection) */
  recognitionAvailable?: boolean;
}

const LIVE_ERRORS: readonly LiveError[] = ['key', 'rate-limit', 'offline', 'refused', 'other'];
const toLiveError = (error: unknown): LiveError => {
  const kind = (error as { kind?: unknown } | null)?.kind;
  return LIVE_ERRORS.includes(kind as LiveError) ? (kind as LiveError) : 'other';
};

/** Loads the SDK only when a live QSO starts. */
export interface EngineRequest {
  apiKey: string;
  model: string;
  context: OperatorContext;
}

const loadEngine = async (options: EngineRequest): Promise<ConversationEngine> => {
  const { createClaudeEngine, createClient } = await import('@cq-talk/claude/client');
  return createClaudeEngine({
    client: createClient(options.apiKey),
    model: options.model,
    context: options.context,
  });
};

/** What the QSL card shows when the report itself could not be written. */
const reportFromLog = (log: readonly LogEntry[]): QslReport => ({
  errors: log.flatMap((entry) =>
    entry.who === 'you' && entry.assessment?.kind === 'fix'
      ? [{ said: entry.text, better: entry.assessment.better, why: '' }]
      : [],
  ),
  vocabulary: [],
  practice: [],
});

/**
 * Drives a live QSO: the operator's streamed transmissions, the half-duplex microphone, typed
 * transmissions, corrections, retries and the QSL report.
 */
export const useLiveOperator = ({
  state,
  dispatch,
  apiKey,
  model,
  locale,
  speaking,
  createEngine = loadEngine,
  createInput = createSpeechInput,
  recognitionAvailable = Boolean(findRecognition()),
}: LiveOperatorOptions) => {
  const live = state.mode === 'live' && state.screen === 'call';
  const engine = useRef<Promise<ConversationEngine> | null>(null);
  const controller = useRef<AbortController | null>(null);
  const logRef = useRef(state.log);
  const lastStep = useRef<(() => void) | null>(null);
  const counter = useRef(0);
  const [interim, setInterim] = useState('');
  const [notice, setNotice] = useState<TransmitNotice | null>(
    recognitionAvailable ? null : 'unsupported',
  );
  const input = useRef<SpeechInput | null>(null);
  const transmitRef = useRef<(log: readonly LogEntry[]) => Promise<void>>(async () => {});

  useEffect(() => {
    logRef.current = state.log;
  });

  const transmit = useCallback(
    async (log: readonly LogEntry[]) => {
      lastStep.current = () => void transmitRef.current(log);
      const signal = controller.current?.signal;
      const id = `op-${++counter.current}`;
      let said = false;
      try {
        const operator = await engine.current;
        if (!operator || signal?.aborted) return;
        for await (const chunk of operator.transmit(log, signal)) {
          said = true;
          dispatch({ type: 'operator-chunk', id, text: chunk });
        }
        if (signal?.aborted) return;
        if (said) dispatch({ type: 'operator-done' });
        else dispatch({ type: 'live-error', error: 'other' });
      } catch (error) {
        if (!signal?.aborted) dispatch({ type: 'live-error', error: toLiveError(error) });
      }
    },
    [dispatch],
  );

  useEffect(() => {
    transmitRef.current = transmit;
  });

  // A new live contact: load the operator and let it answer the call
  const contact = live ? `${state.topic}|${state.station.id}|${state.freq}` : null;
  useEffect(() => {
    if (!contact || !apiKey) return;
    const current = new AbortController();
    controller.current = current;
    engine.current = createEngine({
      apiKey,
      model,
      context: {
        topic: state.topic,
        call: state.station.call,
        city: messages.en.stations[state.station.id],
        freq: state.freq,
        locale,
      },
    });
    void transmit([]);
    return () => current.abort();
    // Only a new contact restarts the operator
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact, apiKey]);

  const send = useCallback(
    (raw: string) => {
      const text = normalizeTransmission(raw);
      if (!text) return;
      // Half-duplex: one transmission per turn. A second one before the operator answers would
      // start two replies at once
      if (logRef.current[logRef.current.length - 1]?.who === 'you') return;
      const id = `you-${++counter.current}`;
      const before = logRef.current;
      dispatch({ type: 'transmission', id, text });
      // Seen right away by a transmission arriving before the next render
      logRef.current = [...before, { id, who: 'you', text }];
      setInterim('');
      const signal = controller.current?.signal;
      void engine.current
        ?.then((operator) => operator.assess(text, before, signal))
        .then((assessment) => dispatch({ type: 'assessed', id, assessment }));
      void transmit([...before, { id, who: 'you', text }]);
    },
    [dispatch, transmit],
  );

  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });

  // The microphone lives outside render: its callbacks read the latest handlers through refs
  useEffect(() => {
    const created = createInput({
      onInterim: setInterim,
      onTransmission: (text) => sendRef.current(text),
      onError: (error) => setNotice(error === 'other' ? null : error),
    });
    input.current = created;
    return () => {
      created.stop();
      input.current = null;
    };
  }, [createInput]);

  // Half-duplex: the microphone opens only on the user's turn, after the operator's voice ends
  const yourTurn = live && isYourTurn(state) && !speaking;
  const listening = yourTurn && notice === null;
  useEffect(() => {
    if (listening) input.current?.listen();
    else input.current?.stop();
  }, [listening]);

  const retry = useCallback(() => lastStep.current?.(), []);

  /** On hang-up: stops the operator and resolves once the QSL report is ready. */
  const finish = useCallback((): Promise<void> | undefined => {
    if (!live) return undefined;
    controller.current?.abort();
    input.current?.stop();
    const log = logRef.current;
    const reportReady = async () => {
      if (!log.some((entry) => entry.who === 'you')) {
        dispatch({ type: 'report-ready', report: reportFromLog(log) });
        return;
      }
      try {
        const operator = await engine.current;
        if (!operator) throw new Error('No operator');
        dispatch({ type: 'report-ready', report: await operator.report(log) });
      } catch {
        dispatch({ type: 'report-ready', report: reportFromLog(log) });
      }
    };
    return reportReady();
  }, [dispatch, live]);

  return { yourTurn, listening, interim, notice, send, retry, finish };
};
