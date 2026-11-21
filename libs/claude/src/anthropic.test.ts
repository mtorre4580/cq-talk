import Anthropic from '@anthropic-ai/sdk';
import { checkApiKey } from './anthropic';

const clientThatThrows = (error: unknown) =>
  ({ models: { list: vi.fn().mockRejectedValue(error) } }) as unknown as Pick<Anthropic, 'models'>;

const apiError = <T extends new (...args: never[]) => Error>(Kind: T, status: number) =>
  new (Kind as unknown as new (...args: unknown[]) => Error)(status, {}, 'boom', new Headers());

describe('checkApiKey', () => {
  it('accepts a key that can list models, without spending tokens', async () => {
    const list = vi.fn().mockResolvedValue({ data: [] });
    const client = { models: { list } } as unknown as Pick<Anthropic, 'models'>;
    expect(await checkApiKey('sk-ant-test', client)).toBe('ok');
    expect(list).toHaveBeenCalledWith({ limit: 1 });
  });

  it('rejects an empty key without a request', async () => {
    const list = vi.fn();
    expect(await checkApiKey('  ', { models: { list } } as never)).toBe('invalid');
    expect(list).not.toHaveBeenCalled();
  });

  it.each([
    [apiError(Anthropic.AuthenticationError, 401), 'invalid'],
    [apiError(Anthropic.PermissionDeniedError, 403), 'forbidden'],
    [apiError(Anthropic.RateLimitError, 429), 'rate-limited'],
    [new Anthropic.APIConnectionError({ message: 'offline' }), 'offline'],
    [new Error('anything else'), 'error'],
  ])('maps %o to %s', async (error, expected) => {
    expect(await checkApiKey('sk-ant-test', clientThatThrows(error))).toBe(expected);
  });
});
