import Anthropic from '@anthropic-ai/sdk';

/**
 * Anthropic client for the browser. The key is the user's own (bring your own key): it stays in
 * their browser and is only ever sent to api.anthropic.com, which is why direct browser access is
 * acceptable here and nowhere else.
 */
export const createClient = (apiKey: string): Anthropic =>
  new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });

export type KeyCheck = 'ok' | 'invalid' | 'forbidden' | 'rate-limited' | 'offline' | 'error';

/** Checks a key with a free request (list one model): no tokens are spent. */
export const checkApiKey = async (
  apiKey: string,
  client: Pick<Anthropic, 'models'> = createClient(apiKey),
): Promise<KeyCheck> => {
  if (!apiKey.trim()) return 'invalid';
  try {
    await client.models.list({ limit: 1 });
    return 'ok';
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return 'invalid';
    if (error instanceof Anthropic.PermissionDeniedError) return 'forbidden';
    if (error instanceof Anthropic.RateLimitError) return 'rate-limited';
    if (error instanceof Anthropic.APIConnectionError) return 'offline';
    return 'error';
  }
};
