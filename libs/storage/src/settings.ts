import { storage } from '@cq-talk/platform';

/** `system`: the browser's speech synthesis; `elevenlabs`: a natural cloud voice through the radio */
export type VoiceProvider = 'system' | 'elevenlabs';

export interface Settings {
  /** The user's Anthropic API key, or null for the demo operator */
  apiKey: string | null;
  /** Model id for the operator */
  model: string;
  voiceProvider: VoiceProvider;
  /** The user's ElevenLabs key, or null */
  elevenLabsKey: string | null;
  /** The chosen ElevenLabs voice, or null */
  elevenLabsVoiceId: string | null;
}

const KEY_STORAGE = 'api-key';
const MODEL_STORAGE = 'model';
const VOICE_PROVIDER_STORAGE = 'voice-provider';
const ELEVENLABS_KEY_STORAGE = 'elevenlabs-key';
const ELEVENLABS_VOICE_STORAGE = 'elevenlabs-voice';
const CHANGE_EVENT = 'cq-talk:settings';

export const readSettings = (defaultModel: string): Settings => ({
  apiKey: storage.get(KEY_STORAGE),
  model: storage.get(MODEL_STORAGE) ?? defaultModel,
  voiceProvider: storage.get(VOICE_PROVIDER_STORAGE) === 'elevenlabs' ? 'elevenlabs' : 'system',
  elevenLabsKey: storage.get(ELEVENLABS_KEY_STORAGE),
  elevenLabsVoiceId: storage.get(ELEVENLABS_VOICE_STORAGE),
});

/** Same values, field by field */
export const sameSettings = (a: Settings, b: Settings): boolean =>
  (Object.keys(a) as (keyof Settings)[]).every((key) => a[key] === b[key]);

const notify = () => {
  try {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // No window (tests outside jsdom): nothing to notify
  }
};

export const saveApiKey = (apiKey: string | null) => {
  if (apiKey?.trim()) storage.set(KEY_STORAGE, apiKey.trim());
  else storage.remove(KEY_STORAGE);
  notify();
};

export const saveModel = (model: string) => {
  storage.set(MODEL_STORAGE, model);
  notify();
};

const setOrRemove = (key: string, value: string | null) => {
  if (value?.trim()) storage.set(key, value.trim());
  else storage.remove(key);
};

/** The operator's voice: the browser's, or ElevenLabs with a key and a voice. */
export const saveVoice = (
  voice: { provider: 'system' } | { provider: 'elevenlabs'; key: string; voiceId: string },
) => {
  storage.set(VOICE_PROVIDER_STORAGE, voice.provider);
  if (voice.provider === 'elevenlabs') {
    setOrRemove(ELEVENLABS_KEY_STORAGE, voice.key);
    setOrRemove(ELEVENLABS_VOICE_STORAGE, voice.voiceId);
  }
  notify();
};

/** Forgets the ElevenLabs key and goes back to the browser's voice. */
export const removeElevenLabs = () => {
  storage.remove(ELEVENLABS_KEY_STORAGE);
  storage.remove(ELEVENLABS_VOICE_STORAGE);
  storage.set(VOICE_PROVIDER_STORAGE, 'system');
  notify();
};

/** Subscribes to settings saved in this tab or another one. */
export const subscribeSettings = (onChange: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key?.startsWith('cq-talk:')) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
};
