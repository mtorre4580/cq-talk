import type { QslReport, QsoMode } from '@cq-talk/qso';

/** One printed QSL card, as kept in "Mis QSL". */
export interface QslRecord {
  id: string;
  /** ISO date-time when the card was printed */
  savedAt: string;
  mode: QsoMode;
  topic: string;
  call: string;
  /** Station id, so the city is shown in the reader's language */
  stationId: string;
  freq: string;
  duration: string;
  fixes: number;
  total: number;
  report: QslReport;
}

/** Where records live: IndexedDB in the browser, a Map in tests. */
export interface LogbookBackend {
  get(id: string): Promise<QslRecord | undefined>;
  set(id: string, record: QslRecord): Promise<void>;
  values(): Promise<QslRecord[]>;
  del(id: string): Promise<void>;
}

/** IndexedDB through idb-keyval, in its own database so it never mixes with other data. */
export const indexedDbBackend = async (): Promise<LogbookBackend> => {
  const { createStore, del, get, set, values } = await import('idb-keyval');
  const store = createStore('cq-talk', 'qsl-log');
  return {
    get: (id) => get<QslRecord>(id, store),
    set: (id, record) => set(id, record, store),
    values: () => values<QslRecord>(store),
    del: (id) => del(id, store),
  };
};

export const memoryBackend = (): LogbookBackend => {
  const map = new Map<string, QslRecord>();
  return {
    get: async (id) => map.get(id),
    set: async (id, record) => {
      map.set(id, record);
    },
    values: async () => [...map.values()],
    del: async (id) => {
      map.delete(id);
    },
  };
};

export interface Logbook {
  save(record: QslRecord): Promise<void>;
  /** Newest first */
  list(): Promise<QslRecord[]>;
  get(id: string): Promise<QslRecord | undefined>;
  remove(id: string): Promise<void>;
}

/**
 * The QSL log. Storage failures (private mode, quota, no IndexedDB) never break the app: reads
 * come back empty and writes are skipped.
 */
export const createLogbook = (
  backend: () => Promise<LogbookBackend> = indexedDbBackend,
): Logbook => {
  let opened: Promise<LogbookBackend | null> | null = null;
  const open = () => (opened ??= backend().catch(() => null));
  const safely = async <T>(run: (b: LogbookBackend) => Promise<T>, fallback: T): Promise<T> => {
    try {
      const b = await open();
      return b ? await run(b) : fallback;
    } catch {
      return fallback;
    }
  };
  return {
    save: (record) => safely((b) => b.set(record.id, record), undefined),
    list: () =>
      safely(
        async (b) => (await b.values()).sort((a, z) => z.savedAt.localeCompare(a.savedAt)),
        [] as QslRecord[],
      ),
    get: (id) => safely((b) => b.get(id), undefined),
    remove: (id) => safely((b) => b.del(id), undefined),
  };
};
