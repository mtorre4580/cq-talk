/** Every key the app stores is prefixed so it never collides with other apps on the origin. */
export const STORAGE_PREFIX = 'cq-talk:';

const area = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    // Blocked storage (private mode, disabled site data) throws on access
    return null;
  }
};

/**
 * `localStorage` that never throws. Reads return `null` and writes are no-ops when storage is
 * missing, full or blocked, so the app keeps working without it.
 */
export const storage = {
  get(key: string): string | null {
    try {
      return area()?.getItem(STORAGE_PREFIX + key) ?? null;
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      area()?.setItem(STORAGE_PREFIX + key, value);
    } catch {
      // Quota exceeded or blocked: ignore
    }
  },
  remove(key: string): void {
    try {
      area()?.removeItem(STORAGE_PREFIX + key);
    } catch {
      // Blocked: ignore
    }
  },
};
