/** SDK entry (`@cq-talk/claude/client`): load it with `import()` so the SDK stays lazy. */
export { checkApiKey, createClient } from './anthropic';
export type { KeyCheck } from './anthropic';
export { createClaudeEngine, OperatorError } from './engine';
export type { ClaudeEngineOptions } from './engine';
