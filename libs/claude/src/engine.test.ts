import Anthropic from '@anthropic-ai/sdk';
import type { OperatorContext } from '@cq-talk/qso';
import { createClaudeEngine, OperatorError, REFUSAL_LINE } from './engine';

const ctx: OperatorContext = {
  topic: 'Space',
  call: 'G4·AI',
  city: 'London, United Kingdom',
  freq: '18.110',
  locale: 'en',
};

const textEvents = (...chunks: string[]) =>
  chunks.map((text) => ({ type: 'content_block_delta', delta: { type: 'text_delta', text } }));

/** Just enough of `client.beta.messages` for the engine. */
const fakeClient = ({
  events = [] as unknown[],
  stopReason = 'end_turn',
  parsed = null as unknown,
  fail = null as unknown,
} = {}) => {
  const stream = vi.fn(() => {
    if (fail) throw fail;
    return {
      async *[Symbol.asyncIterator]() {
        yield* events;
      },
      finalMessage: async () => ({ stop_reason: stopReason }),
    };
  });
  const parse = vi.fn(async () => {
    if (fail) throw fail;
    return { stop_reason: stopReason, parsed_output: parsed };
  });
  return {
    client: { beta: { messages: { stream, parse } } } as unknown as Anthropic,
    stream,
    parse,
  };
};

const collect = async (chunks: AsyncIterable<string>) => {
  let text = '';
  for await (const chunk of chunks) text += chunk;
  return text;
};

describe('createClaudeEngine', () => {
  it('streams the transmission at low effort with fallbacks and caching', async () => {
    const fake = fakeClient({ events: textEvents('Roger, ', 'copy you. Over.') });
    const engine = createClaudeEngine({
      client: fake.client,
      model: 'claude-opus-5-5',
      context: ctx,
    });
    expect(await collect(engine.transmit([]))).toBe('Roger, copy you. Over.');
    const [params] = fake.stream.mock.calls[0] as unknown as [Record<string, unknown>];
    expect(params).toMatchObject({
      model: 'claude-opus-5-5',
      output_config: { effort: 'low' },
      cache_control: { type: 'ephemeral' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
    expect(params).not.toHaveProperty('thinking');
  });

  it('sends no fallbacks for Haiku 5.5, which has none', async () => {
    const fake = fakeClient({ events: textEvents('Hi. Over.') });
    const engine = createClaudeEngine({
      client: fake.client,
      model: 'claude-haiku-5-5',
      context: ctx,
    });
    await collect(engine.transmit([]));
    const [params] = fake.stream.mock.calls[0] as unknown as [Record<string, unknown>];
    expect(params).not.toHaveProperty('fallbacks');
  });

  it('keeps the QSO going when the model declines', async () => {
    const fake = fakeClient({ stopReason: 'refusal' });
    const engine = createClaudeEngine({
      client: fake.client,
      model: 'claude-opus-5-5',
      context: ctx,
    });
    expect(await collect(engine.transmit([]))).toBe(REFUSAL_LINE);
  });

  it('turns API errors into live errors the UI can explain', async () => {
    const auth = new Anthropic.AuthenticationError(401, {}, 'bad key', new Headers());
    const engine = createClaudeEngine({
      client: fakeClient({ fail: auth }).client,
      model: 'claude-opus-5-5',
      context: ctx,
    });
    await expect(collect(engine.transmit([]))).rejects.toEqual(new OperatorError('key'));
  });

  it('maps the structured assessment', async () => {
    const fix = createClaudeEngine({
      client: fakeClient({ parsed: { verdict: 'fix', better: ' I think it’s exciting. ' } }).client,
      model: 'claude-opus-5-5',
      context: ctx,
    });
    expect(await fix.assess('I think is exciting', [])).toEqual({
      kind: 'fix',
      better: 'I think it’s exciting.',
    });
    const ok = createClaudeEngine({
      client: fakeClient({ parsed: { verdict: 'ok', better: '' } }).client,
      model: 'claude-opus-5-5',
      context: ctx,
    });
    expect(await ok.assess('That sounds great', [])).toEqual({ kind: 'ok' });
  });

  it('never breaks the conversation over a failed assessment', async () => {
    const engine = createClaudeEngine({
      client: fakeClient({ fail: new Error('boom') }).client,
      model: 'claude-opus-5-5',
      context: ctx,
    });
    expect(await engine.assess('Hello', [])).toEqual({ kind: 'none' });
  });

  it('writes the report at medium effort and trims it to the card', async () => {
    const parsed = {
      errors: Array.from({ length: 6 }, (_, i) => ({ said: `s${i}`, better: `b${i}`, why: 'w' })),
      vocabulary: [{ phrase: 'to weigh in on', meaning: 'to give an opinion' }],
      practice: ['1. a', '2. b', '3. c', '4. d'],
    };
    const fake = fakeClient({ parsed });
    const engine = createClaudeEngine({
      client: fake.client,
      model: 'claude-sonnet-5-5',
      context: ctx,
    });
    const report = await engine.report([]);
    expect(report.errors).toHaveLength(4);
    expect(report.practice).toHaveLength(3);
    const [params] = fake.parse.mock.calls[0] as unknown as [Record<string, unknown>];
    expect(params).toMatchObject({ output_config: { effort: 'medium' } });
  });
});
