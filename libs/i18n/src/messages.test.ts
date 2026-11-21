import { messages } from './messages';

/** Every leaf path of a dictionary, so the locales can be compared key by key. */
const paths = (node: object, prefix = ''): string[] =>
  Object.entries(node).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null && !('one' in value)
      ? paths(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );

describe('messages', () => {
  it('every locale has exactly the Spanish keys', () => {
    const source = paths(messages.es).sort();
    expect(paths(messages.en).sort()).toEqual(source);
    expect(paths(messages['pt-BR']).sort()).toEqual(source);
  });

  it('no translation is empty', () => {
    for (const dict of Object.values(messages)) {
      for (const path of paths(dict)) expect(path).not.toBe('');
    }
  });
});
