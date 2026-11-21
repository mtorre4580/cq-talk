/** Models the operator can run on. Labels live in the dictionaries under `settings.models.<id>`. */
export const MODELS = [
  { id: 'claude-opus-5-5', key: 'opus' },
  { id: 'claude-sonnet-5-5', key: 'sonnet' },
  { id: 'claude-haiku-5-5', key: 'haiku' },
] as const;

export type ModelId = (typeof MODELS)[number]['id'];
export type ModelKey = (typeof MODELS)[number]['key'];

export const DEFAULT_MODEL: ModelId = 'claude-opus-5-5';

export const isModelId = (value: unknown): value is ModelId =>
  MODELS.some((model) => model.id === value);
