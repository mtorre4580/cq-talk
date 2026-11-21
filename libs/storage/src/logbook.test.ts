import { createLogbook, memoryBackend } from './logbook';
import type { QslRecord } from './logbook';

const record = (id: string, savedAt: string): QslRecord => ({
  id,
  savedAt,
  mode: 'demo',
  topic: 'Mundial 2026',
  call: 'JA1·AI',
  stationId: 'tokyo',
  freq: '7.074',
  duration: '00:12',
  fixes: 2,
  total: 2,
  report: { errors: [], vocabulary: [], practice: [] },
});

describe('logbook', () => {
  it('keeps cards and lists the newest first', async () => {
    const backend = memoryBackend();
    const logbook = createLogbook(async () => backend);
    await logbook.save(record('a', '2026-11-20T10:00:00.000Z'));
    await logbook.save(record('b', '2026-11-21T10:00:00.000Z'));
    expect((await logbook.list()).map((r) => r.id)).toEqual(['b', 'a']);
    expect((await logbook.get('a'))?.topic).toBe('Mundial 2026');
    await logbook.remove('a');
    expect(await logbook.get('a')).toBeUndefined();
  });

  it('works without storage: empty reads, skipped writes', async () => {
    const logbook = createLogbook(async () => {
      throw new Error('IndexedDB blocked');
    });
    await expect(logbook.save(record('a', '2026-11-21T10:00:00.000Z'))).resolves.toBeUndefined();
    expect(await logbook.list()).toEqual([]);
    expect(await logbook.get('a')).toBeUndefined();
  });
});
