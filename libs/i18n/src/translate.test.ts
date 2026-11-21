import { interpolate, lookup, translate } from './translate';

const dict = {
  greet: 'Hola, {name}',
  turns: { one: '{count} turno', other: '{count} turnos' },
  nested: { deep: 'abajo' },
};

describe('translate', () => {
  it('looks up dot paths', () => {
    expect(lookup(dict, 'nested.deep')).toBe('abajo');
    expect(lookup(dict, 'nested.missing')).toBeUndefined();
  });

  it('fills placeholders and keeps unknown ones', () => {
    expect(interpolate('{a} y {b}', { a: 1 })).toBe('1 y {b}');
    expect(translate(dict, 'es', 'greet', { name: 'Vos' })).toBe('Hola, Vos');
  });

  it('picks plural forms per locale', () => {
    expect(translate(dict, 'es', 'turns', { count: 1 })).toBe('1 turno');
    expect(translate(dict, 'es', 'turns', { count: 3 })).toBe('3 turnos');
  });

  it('falls back to the key when it does not exist', () => {
    expect(translate(dict, 'en', 'nope')).toBe('nope');
  });
});
