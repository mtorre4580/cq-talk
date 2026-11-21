import { storage } from '@cq-talk/platform';

export interface Settings {
  /** The user's Anthropic API key, or null for the demo operator */
  apiKey: string | null;
  /** Model id for the operator */
  model: string;
}

const KEY_STORAGE = 'api-key';
const MODEL_STORAGE = 'model';
const CHANGE_EVENT = 'cq-talk:settings';

export const readSettings = (defaultModel: string): Settings => ({
  apiKey: storage.get(KEY_STORAGE),
  model: storage.get(MODEL_STORAGE) ?? defaultModel,
});

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
