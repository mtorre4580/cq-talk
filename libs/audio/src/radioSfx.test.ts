import { createRadioSfx } from './radioSfx';
import { createFakeAudioContext } from './testing';

describe('createRadioSfx', () => {
  it('creates the context lazily, once, and resumes it when suspended', () => {
    const fake = createFakeAudioContext('suspended');
    const factory = vi.fn(() => fake.ctx);
    const sfx = createRadioSfx(factory);
    expect(factory).not.toHaveBeenCalled();
    sfx.unlock();
    sfx.tuneIn();
    expect(factory).toHaveBeenCalledOnce();
    expect(fake.calls.resume).toBeGreaterThan(0);
  });

  it('tune-in plays static, the heterodyne pair and the lock beep', () => {
    const fake = createFakeAudioContext();
    createRadioSfx(() => fake.ctx).tuneIn();
    expect(fake.started).toEqual(['noise', 'oscillator', 'oscillator', 'oscillator']);
  });

  it('off plays a static burst and a click', () => {
    const fake = createFakeAudioContext();
    createRadioSfx(() => fake.ctx).off();
    expect(fake.started).toEqual(['noise', 'oscillator']);
  });

  it('loops soft static under a transmission until stopped', () => {
    const fake = createFakeAudioContext();
    const stop = createRadioSfx(() => fake.ctx).hiss();
    expect(fake.started).toEqual(['noise']);
    expect(() => stop()).not.toThrow();
    expect(createRadioSfx(() => null).hiss()).toBeTypeOf('function');
  });

  it('is a silent no-op without Web Audio or when it throws', () => {
    expect(() => createRadioSfx(() => null).tuneIn()).not.toThrow();
    expect(() =>
      createRadioSfx(() => {
        throw new Error('no audio');
      }).off(),
    ).not.toThrow();
  });

  it('closes the context on dispose', () => {
    const fake = createFakeAudioContext();
    const sfx = createRadioSfx(() => fake.ctx);
    sfx.unlock();
    sfx.dispose();
    expect(fake.calls.close).toBe(1);
  });
});
