import { PRESETS } from './presets';
import { initialQso, isOnAir, micState, qsoReducer, skyGlow } from './session';
import type { QsoAction, QsoState } from './session';

const run = (actions: QsoAction[], from: QsoState = initialQso) => actions.reduce(qsoReducer, from);
const climate = PRESETS.find((p) => p.id === 'climate')!;

describe('qsoReducer', () => {
  it('starts at home on 14.205 MHz with the needle at 44', () => {
    expect(initialQso).toMatchObject({ screen: 'home', freq: '14.205', position: 44 });
    expect(skyGlow(initialQso)).toBe('idle');
    expect(micState(initialQso)).toBe('off');
  });

  it('ignores a call without a topic', () => {
    expect(
      run([
        { type: 'query', value: '   ' },
        { type: 'call', topic: '   ' },
      ]),
    ).toEqual(run([{ type: 'query', value: '   ' }]));
  });

  it('tunes a typed topic and goes on air', () => {
    const state = run([
      { type: 'query', value: 'Mundial 2026' },
      { type: 'call', topic: 'Mundial 2026' },
    ]);
    expect(state).toMatchObject({
      screen: 'call',
      topic: 'Mundial 2026',
      freq: '10.436',
      position: 32,
      elapsed: 0,
    });
    expect(isOnAir(state)).toBe(true);
    expect(skyGlow(state)).toBe('on-air');
    expect(micState(state)).toBe('on');
  });

  it('moves the needle to a preset before calling on its frequency', () => {
    const picked = run([{ type: 'preset', preset: climate, label: 'Cambio climático' }]);
    expect(picked).toMatchObject({ screen: 'home', query: 'Cambio climático', position: 44 });
    const calling = qsoReducer(picked, {
      type: 'call',
      topic: picked.query,
      tuning: { freq: climate.freq, position: climate.position },
    });
    expect(calling).toMatchObject({ screen: 'call', freq: '14.205', position: 44 });
  });

  it('counts seconds only while on air', () => {
    const onAir = run([{ type: 'call', topic: 'x' }, { type: 'tick' }, { type: 'tick' }]);
    expect(onAir.elapsed).toBe(2);
    const closing = run([{ type: 'hang-up' }, { type: 'tick' }], onAir);
    expect(closing.elapsed).toBe(2);
    expect(run([{ type: 'tick' }]).elapsed).toBe(0);
  });

  it('hangs up, prints the QSL card and starts over keeping the dial', () => {
    const onAir = run([{ type: 'call', topic: 'Mundial 2026' }]);
    const closing = qsoReducer(onAir, { type: 'hang-up' });
    expect(closing.closing).toBe(true);
    expect(isOnAir(closing)).toBe(false);
    expect(micState(closing)).toBe('closing');

    const report = qsoReducer(closing, { type: 'closed' });
    expect(report.screen).toBe('report');
    expect(skyGlow(report)).toBe('report');

    const home = qsoReducer(report, { type: 'restart' });
    expect(home).toMatchObject({ screen: 'home', query: '', topic: '', position: 32 });
  });

  it('ignores actions that do not belong to the current screen', () => {
    expect(qsoReducer(initialQso, { type: 'hang-up' })).toBe(initialQso);
    expect(qsoReducer(initialQso, { type: 'closed' })).toBe(initialQso);
    const onAir = run([{ type: 'call', topic: 'x' }]);
    expect(qsoReducer(onAir, { type: 'query', value: 'y' })).toBe(onAir);
    expect(qsoReducer(onAir, { type: 'call', topic: 'y' })).toBe(onAir);
  });
});
