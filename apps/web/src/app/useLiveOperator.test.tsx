import { act, renderHook, waitFor } from '@testing-library/react';
import { useReducer } from 'react';
import { initialQso, qsoReducer } from '@cq-talk/qso';
import type { ConversationEngine, QsoState } from '@cq-talk/qso';
import type { SpeechInput, SpeechInputOptions } from '@cq-talk/speech';
import { useLiveOperator } from './useLiveOperator';
import type { EngineRequest } from './useLiveOperator';

const fakeEngine = (replies: string[][]) => {
  let turn = 0;
  const engine: ConversationEngine = {
    async *transmit() {
      for (const chunk of replies[turn++] ?? ['Roger. Over.']) yield chunk;
    },
    assess: vi.fn(async (text: string) =>
      text.includes('is great')
        ? { kind: 'fix' as const, better: 'It’s great.' }
        : { kind: 'none' as const },
    ),
    report: vi.fn(async () => ({
      errors: [{ said: 'It is great', better: 'It’s great.', why: 'Contraction.' }],
      vocabulary: [],
      practice: ['1. a', '2. b', '3. c'],
    })),
  };
  return engine;
};

const fakeInput = () => {
  let options: SpeechInputOptions | null = null;
  const input: SpeechInput = { listen: vi.fn(), stop: vi.fn() };
  return {
    input,
    create: (o: SpeechInputOptions) => {
      options = o;
      return input;
    },
    say: (text: string) => options?.onTransmission(text),
  };
};

const setup = (engine: ConversationEngine, mic = fakeInput()) => {
  const requests: EngineRequest[] = [];
  const hook = renderHook(() => {
    const [state, dispatch] = useReducer(qsoReducer, initialQso, (s): QsoState => ({
      ...s,
    }));
    const live = useLiveOperator({
      state,
      dispatch,
      apiKey: 'sk-ant-test',
      model: 'claude-opus-5-5',
      locale: 'es',
      speaking: false,
      createEngine: async (request) => {
        requests.push(request);
        return engine;
      },
      createInput: mic.create,
      recognitionAvailable: true,
    });
    return { state, dispatch, live };
  });
  return { ...hook, requests, mic };
};

describe('useLiveOperator', () => {
  it('answers the call, then opens the microphone for the user', async () => {
    const { result, requests, mic } = setup(fakeEngine([['CQ, this is ', 'JA1·AI. Over.']]));
    act(() => result.current.dispatch({ type: 'call', topic: 'Mundial 2026', mode: 'live' }));

    await waitFor(() => expect(result.current.live.yourTurn).toBe(true));
    expect(result.current.state.log).toEqual([
      { id: 'op-1', who: 'operator', text: 'CQ, this is JA1·AI. Over.' },
    ]);
    expect(requests[0]?.context).toMatchObject({
      topic: 'Mundial 2026',
      call: 'JA1·AI',
      city: 'Tokyo, Japan',
      locale: 'es',
    });
    expect(mic.input.listen).toHaveBeenCalled();
  });

  it('logs what the user says, corrects it and gets the next transmission', async () => {
    const { result, mic } = setup(fakeEngine([['Hi. Over.'], ['Why? Over.']]));
    act(() => result.current.dispatch({ type: 'call', topic: 'x', mode: 'live' }));
    await waitFor(() => expect(result.current.live.yourTurn).toBe(true));

    act(() => mic.say('it is great over'));
    await waitFor(() => expect(result.current.state.log).toHaveLength(3));
    expect(result.current.state.log[1]).toMatchObject({ who: 'you', text: 'It is great. Over.' });
    await waitFor(() =>
      expect(result.current.state.log[1]?.assessment).toEqual({
        kind: 'fix',
        better: 'It’s great.',
      }),
    );
    expect(result.current.state.log[2]).toMatchObject({ who: 'operator', text: 'Why? Over.' });
  });

  it('takes one transmission per turn, so the operator never answers twice at once', async () => {
    const { result, mic } = setup(fakeEngine([['Hi. Over.'], ['Why? Over.'], ['Again? Over.']]));
    act(() => result.current.dispatch({ type: 'call', topic: 'x', mode: 'live' }));
    await waitFor(() => expect(result.current.live.yourTurn).toBe(true));

    // The recognizer handing over the same words twice
    act(() => {
      mic.say('it is great over');
      mic.say('it is great over');
    });
    await waitFor(() => expect(result.current.state.operatorTalking).toBe(false));
    await waitFor(() => expect(result.current.state.log).toHaveLength(3));
    expect(result.current.state.log.map((entry) => entry.who)).toEqual([
      'operator',
      'you',
      'operator',
    ]);
    expect(result.current.state.log[2]).toMatchObject({ text: 'Why? Over.' });
  });

  it('writes the QSL report on hang-up', async () => {
    const engine = fakeEngine([['Hi. Over.'], ['Ok. Over.']]);
    const { result } = setup(engine);
    act(() => result.current.dispatch({ type: 'call', topic: 'x', mode: 'live' }));
    await waitFor(() => expect(result.current.live.yourTurn).toBe(true));
    act(() => result.current.live.send('It is great'));
    await waitFor(() => expect(result.current.state.log).toHaveLength(3));

    await act(async () => {
      result.current.dispatch({ type: 'hang-up' });
      await result.current.live.finish();
    });
    expect(engine.report).toHaveBeenCalled();
    expect(result.current.state.report?.errors).toHaveLength(1);
  });

  it('skips the report call when the user never spoke', async () => {
    const engine = fakeEngine([['Hi. Over.']]);
    const { result } = setup(engine);
    act(() => result.current.dispatch({ type: 'call', topic: 'x', mode: 'live' }));
    await waitFor(() => expect(result.current.live.yourTurn).toBe(true));
    await act(async () => {
      await result.current.live.finish();
    });
    expect(engine.report).not.toHaveBeenCalled();
    expect(result.current.state.report).toEqual({ errors: [], vocabulary: [], practice: [] });
  });

  it('reports a failure and retries the same step', async () => {
    let fail = true;
    const engine: ConversationEngine = {
      ...fakeEngine([]),
      async *transmit() {
        if (fail) throw Object.assign(new Error('offline'), { kind: 'offline' });
        yield 'Back on air. Over.';
      },
    };
    const { result } = setup(engine);
    act(() => result.current.dispatch({ type: 'call', topic: 'x', mode: 'live' }));
    await waitFor(() => expect(result.current.state.error).toBe('offline'));

    fail = false;
    act(() => result.current.live.retry());
    await waitFor(() => expect(result.current.live.yourTurn).toBe(true));
    expect(result.current.state.error).toBeNull();
  });
});
