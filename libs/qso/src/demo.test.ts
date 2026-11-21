import { demoLinesAt, demoScript } from './demo';
import { callStatus, conversationLog, initialQso, qsoReducer } from './session';
import type { QsoState } from './session';

describe('demo script', () => {
  it('names the station and topic in the first call', () => {
    expect(demoScript('Mundial 2026', 'JA1·AI')[0]?.text).toBe(
      'CQ, CQ, this is JA1·AI. I copy you loud and clear! So, Mundial 2026 — what’s your take on it? Over.',
    );
  });

  it('alternates operator and user, with two fixes and one well said', () => {
    const script = demoScript('x', 'G4·AI');
    expect(script.map((l) => l.who)).toEqual([
      'operator',
      'you',
      'operator',
      'you',
      'operator',
      'you',
      'operator',
    ]);
    expect(script.filter((l) => l.assessment?.kind === 'fix')).toHaveLength(2);
    expect(script.filter((l) => l.assessment?.kind === 'ok')).toHaveLength(1);
  });

  it('follows the prototype timing: first line at 3 s, then every 3 s, up to 7', () => {
    expect([0, 2, 3, 5, 6, 9, 21, 99].map((s) => demoLinesAt(s))).toEqual([0, 0, 1, 1, 2, 3, 7, 7]);
  });
});

describe('call status', () => {
  const onAirFor = (seconds: number): QsoState => {
    let state = qsoReducer(initialQso, { type: 'call', topic: 'Mundial 2026' });
    for (let i = 0; i < seconds; i++) state = qsoReducer(state, { type: 'tick' });
    return state;
  };

  it('tunes, then waits for the user after the operator, then transmits', () => {
    expect(callStatus(onAirFor(0))).toBe('tuning');
    expect(callStatus(onAirFor(3))).toBe('your-turn');
    expect(callStatus(onAirFor(6))).toBe('transmitting');
    expect(conversationLog(onAirFor(6))).toHaveLength(2);
  });

  it('says it is closing after the hang-up', () => {
    expect(callStatus(qsoReducer(onAirFor(4), { type: 'hang-up' }))).toBe('closing');
  });

  it('uses the stored log in live mode', () => {
    const live: QsoState = {
      ...onAirFor(9),
      mode: 'live',
      log: [{ id: 'a', who: 'operator', text: 'Hi. Over.' }],
    };
    expect(conversationLog(live)).toHaveLength(1);
  });
});
