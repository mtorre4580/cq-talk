import { callStatus, initialQso, isYourTurn, qsoReducer } from './session';
import type { QsoAction, QsoState } from './session';

const run = (actions: QsoAction[], from: QsoState = initialQso) => actions.reduce(qsoReducer, from);
const live = () => run([{ type: 'call', topic: 'Mundial 2026', mode: 'live' }]);

describe('live QSO', () => {
  it('streams the operator transmission into one log entry', () => {
    const state = run(
      [
        { type: 'operator-chunk', id: 'op-1', text: 'CQ, this is ' },
        { type: 'operator-chunk', id: 'op-1', text: 'JA1·AI. Over.' },
      ],
      live(),
    );
    expect(state.log).toEqual([{ id: 'op-1', who: 'operator', text: 'CQ, this is JA1·AI. Over.' }]);
    expect(callStatus(state)).toBe('receiving');
    expect(isYourTurn(state)).toBe(false);
  });

  it('opens the microphone when the operator finishes', () => {
    const state = run(
      [{ type: 'operator-chunk', id: 'op-1', text: 'Hi. Over.' }, { type: 'operator-done' }],
      live(),
    );
    expect(callStatus(state)).toBe('your-turn');
    expect(isYourTurn(state)).toBe(true);
  });

  it('logs the user transmission and its assessment', () => {
    const state = run(
      [
        { type: 'operator-chunk', id: 'op-1', text: 'Hi. Over.' },
        { type: 'operator-done' },
        { type: 'transmission', id: 'you-1', text: ' I think is great. Over. ' },
        {
          type: 'assessed',
          id: 'you-1',
          assessment: { kind: 'fix', better: 'I think it’s great.' },
        },
      ],
      live(),
    );
    expect(state.log[1]).toEqual({
      id: 'you-1',
      who: 'you',
      text: 'I think is great. Over.',
      assessment: { kind: 'fix', better: 'I think it’s great.' },
    });
    expect(callStatus(state)).toBe('transmitting');
    expect(isYourTurn(state)).toBe(false);
  });

  it('stops taking turns on an error and keeps the report for the card', () => {
    const failed = run([{ type: 'live-error', error: 'key' }], live());
    expect(failed.error).toBe('key');
    expect(isYourTurn(failed)).toBe(false);
    const report = { errors: [], vocabulary: [], practice: [] };
    expect(qsoReducer(failed, { type: 'report-ready', report }).report).toBe(report);
  });

  it('never takes turns in demo mode', () => {
    const demo = run([{ type: 'call', topic: 'x' }]);
    expect(demo.mode).toBe('demo');
    expect(isYourTurn(demo)).toBe(false);
  });

  it('starts every QSO clean', () => {
    const dirty = run([{ type: 'live-error', error: 'offline' }], live());
    const again = run([{ type: 'restart' }, { type: 'call', topic: 'y', mode: 'live' }], {
      ...dirty,
      screen: 'report',
    });
    expect(again).toMatchObject({ log: [], error: null, report: null, operatorTalking: false });
  });
});
