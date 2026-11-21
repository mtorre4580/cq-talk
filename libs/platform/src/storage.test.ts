import { storage, STORAGE_PREFIX } from './storage';

describe('storage', () => {
  it('reads and writes prefixed keys', () => {
    storage.set('sound', 'off');
    expect(localStorage.getItem(`${STORAGE_PREFIX}sound`)).toBe('off');
    expect(storage.get('sound')).toBe('off');
    storage.remove('sound');
    expect(storage.get('sound')).toBeNull();
  });

  it('never throws when storage is blocked', () => {
    const spy = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(() => storage.set('locale', 'en')).not.toThrow();
    expect(storage.get('locale')).toBeNull();
    expect(() => storage.remove('locale')).not.toThrow();
    spy.mockRestore();
  });

  it('ignores quota errors on write', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(() => storage.set('locale', 'en')).not.toThrow();
    spy.mockRestore();
  });
});
