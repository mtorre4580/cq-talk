import type { Locale } from '../locales';
import type { Plural } from '../translate';
import { en } from './en';
import { es } from './es';
import { ptBR } from './pt-BR';

type Widen<T> = T extends string
  ? string
  : T extends Plural
    ? Plural
    : { [K in keyof T]: Widen<T[K]> };

/** Every locale must provide exactly the keys of the Spanish source. */
export type Messages = Widen<typeof es>;

export const messages: Record<Locale, Messages> = { es, en, 'pt-BR': ptBR };
