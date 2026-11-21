import { act, renderHook } from '@testing-library/react';
import { readSettings, removeElevenLabs, saveApiKey, saveModel, saveVoice } from './settings';
import { useSettings } from './useSettings';

describe('settings', () => {
  it('starts in demo mode with the default model', () => {
    expect(readSettings('claude-opus-5-5')).toEqual({
      apiKey: null,
      model: 'claude-opus-5-5',
      voiceProvider: 'system',
      elevenLabsKey: null,
      elevenLabsVoiceId: null,
    });
  });

  it('stores a trimmed key and removes it when cleared', () => {
    saveApiKey('  sk-ant-test  ');
    expect(localStorage.getItem('cq-talk:api-key')).toBe('sk-ant-test');
    saveApiKey('');
    expect(localStorage.getItem('cq-talk:api-key')).toBeNull();
  });

  it('updates every hook when settings change', () => {
    const { result } = renderHook(() => useSettings('claude-opus-5-5'));
    act(() => {
      saveApiKey('sk-ant-test');
      saveModel('claude-haiku-5-5');
    });
    expect(result.current).toMatchObject({ apiKey: 'sk-ant-test', model: 'claude-haiku-5-5' });
  });

  it('returns the same object while nothing changes', () => {
    const { result, rerender } = renderHook(() => useSettings('claude-opus-5-5'));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('stores the ElevenLabs voice and forgets it on request', () => {
    saveVoice({ provider: 'elevenlabs', key: ' xi-test ', voiceId: 'v1' });
    expect(readSettings('m')).toMatchObject({
      voiceProvider: 'elevenlabs',
      elevenLabsKey: 'xi-test',
      elevenLabsVoiceId: 'v1',
    });
    saveVoice({ provider: 'system' });
    expect(readSettings('m')).toMatchObject({ voiceProvider: 'system', elevenLabsKey: 'xi-test' });
    removeElevenLabs();
    expect(readSettings('m')).toMatchObject({
      voiceProvider: 'system',
      elevenLabsKey: null,
      elevenLabsVoiceId: null,
    });
  });
});
