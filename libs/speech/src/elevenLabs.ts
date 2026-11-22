/**
 * ElevenLabs text-to-speech, called from the browser with the user's own key (like the
 * Anthropic key: bring your own, stored only in this browser). ElevenLabs answers CORS requests
 * from any origin; their docs advise against exposing keys client-side, so the settings ask
 * users to restrict the key and give it a credit quota.
 */

export const ELEVENLABS_API = 'https://api.elevenlabs.io';
/** Lowest-latency model (~100 ms); the operator only speaks English */
export const ELEVENLABS_MODEL = 'eleven_flash_v2_5';

export interface ElevenLabsVoice {
  id: string;
  name: string;
  description: string;
  /** Free-form tags such as gender, accent, age, use case */
  labels: Record<string, string>;
}

export type ElevenLabsCheck = 'ok' | 'invalid' | 'forbidden' | 'rate-limited' | 'offline' | 'error';

export class ElevenLabsError extends Error {
  constructor(readonly status: number) {
    super(`ElevenLabs request failed with status ${status}`);
    this.name = 'ElevenLabsError';
  }
}

interface RawVoice {
  voice_id?: unknown;
  name?: unknown;
  description?: unknown;
  labels?: unknown;
}

const toVoice = (raw: RawVoice): ElevenLabsVoice | null => {
  if (typeof raw.voice_id !== 'string' || typeof raw.name !== 'string') return null;
  const labels: Record<string, string> = {};
  if (raw.labels && typeof raw.labels === 'object') {
    for (const [key, value] of Object.entries(raw.labels)) {
      if (typeof value === 'string') labels[key] = value;
    }
  }
  return {
    id: raw.voice_id,
    name: raw.name,
    description: typeof raw.description === 'string' ? raw.description : '',
    labels,
  };
};

const checkFor = (status: number): ElevenLabsCheck =>
  status === 401
    ? 'invalid'
    : status === 403
      ? 'forbidden'
      : status === 429
        ? 'rate-limited'
        : 'error';

export interface ElevenLabsClient {
  /** Speech for `text` as mp3 */
  synthesize(text: string, voiceId: string, signal?: AbortSignal): Promise<ArrayBuffer>;
  /** The premade voices every account can use */
  listVoices(signal?: AbortSignal): Promise<ElevenLabsVoice[]>;
  /** Free request that tells whether the key works */
  check(): Promise<ElevenLabsCheck>;
}

export const createElevenLabsClient = (
  apiKey: string,
  fetchImpl: typeof fetch = (...args) => globalThis.fetch(...args),
): ElevenLabsClient => {
  const headers = { 'xi-api-key': apiKey };

  const listVoices = async (signal?: AbortSignal) => {
    const response = await fetchImpl(`${ELEVENLABS_API}/v2/voices?category=premade&page_size=100`, {
      headers,
      signal,
    });
    if (!response.ok) throw new ElevenLabsError(response.status);
    const body = (await response.json()) as { voices?: RawVoice[] };
    return (body.voices ?? []).flatMap((raw) => toVoice(raw) ?? []);
  };

  return {
    async synthesize(text, voiceId, signal) {
      const response = await fetchImpl(
        `${ELEVENLABS_API}/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
          body: JSON.stringify({
            text,
            model_id: ELEVENLABS_MODEL,
            // A little less stable than default: a livelier, more human delivery on air
            voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.15 },
          }),
          signal,
        },
      );
      if (!response.ok) throw new ElevenLabsError(response.status);
      return response.arrayBuffer();
    },
    listVoices,
    async check() {
      if (!apiKey.trim()) return 'invalid';
      try {
        await listVoices();
        return 'ok';
      } catch (error) {
        return error instanceof ElevenLabsError ? checkFor(error.status) : 'offline';
      }
    },
  };
};

const text = (voice: ElevenLabsVoice) =>
  `${voice.description} ${Object.values(voice.labels).join(' ')}`.toLowerCase();

/** How well a voice fits a mature American ham radio operator. Higher is better. */
export const operatorVoiceScore = (voice: ElevenLabsVoice): number => {
  const all = text(voice);
  const gender = (voice.labels['gender'] ?? '').toLowerCase();
  const age = (voice.labels['age'] ?? '').toLowerCase();
  let score = 0;
  if (gender === 'male' || /\bmale\b/.test(all)) score += 4;
  if (gender === 'female') score -= 4;
  if (all.includes('american')) score += 3;
  if (age.includes('middle') || age.includes('old')) score += 3;
  if (age.includes('young')) score -= 1;
  for (const trait of ['warm', 'deep', 'raspy', 'gravel', 'calm', 'mature', 'narrat', 'radio']) {
    if (all.includes(trait)) score += 1;
  }
  return score;
};

/** Voices sorted best fit first (stable for equal scores). */
export const rankOperatorVoices = (voices: readonly ElevenLabsVoice[]): ElevenLabsVoice[] =>
  voices
    .map((voice, index) => ({ voice, index, score: operatorVoiceScore(voice) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ voice }) => voice);
