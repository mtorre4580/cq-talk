/**
 * Lightweight entry: constants and types only. Everything that needs the Anthropic SDK lives in
 * `@cq-talk/claude/client`, which callers load with `import()` so the SDK stays out of the
 * main bundle until the user actually talks to the API.
 */
export type { KeyCheck } from './client';
export { DEFAULT_MODEL, isModelId, MODELS } from './models';
export type { ModelId, ModelKey } from './models';
