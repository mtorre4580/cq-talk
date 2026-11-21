import type { LogEntry, OperatorContext } from '@cq-talk/qso';
import {
  assessInput,
  explanationLanguage,
  openingCue,
  operatorSystemPrompt,
  reportInput,
  reportSystemPrompt,
  toMessages,
} from './prompts';

const ctx: OperatorContext = {
  topic: 'Mundial 2026',
  call: 'JA1·AI',
  city: 'Tokyo, Japan',
  freq: '7.074',
  locale: 'es',
};

const log: LogEntry[] = [
  { id: 'op-1', who: 'operator', text: 'CQ, this is JA1·AI. What do you think? Over.' },
  { id: 'you-1', who: 'you', text: 'I think is exciting. Over.' },
];

describe('prompts', () => {
  it('casts the operator with its station, frequency, topic and radio rules', () => {
    const system = operatorSystemPrompt(ctx);
    expect(system).toContain('You are JA1·AI, a friendly amateur radio operator in Tokyo, Japan.');
    expect(system).toContain('7.074 MHz');
    expect(system).toContain('"Mundial 2026"');
    expect(system).toContain('End every transmission with "Over."');
    expect(system).toContain('Never correct their English');
  });

  it('starts every conversation with the CQ cue and alternates roles', () => {
    expect(toMessages([], ctx)).toEqual([{ role: 'user', content: openingCue(ctx) }]);
    expect(toMessages(log, ctx).map((m) => m.role)).toEqual(['user', 'assistant', 'user']);
  });

  it('merges consecutive lines from the same side', () => {
    const doubled: LogEntry[] = [...log, { id: 'you-2', who: 'you', text: 'Also fun. Over.' }];
    const messages = toMessages(doubled, ctx);
    expect(messages).toHaveLength(3);
    expect(messages[2]?.content).toBe('I think is exciting. Over.\nAlso fun. Over.');
  });

  it('gives the assessor the question the learner answered', () => {
    expect(assessInput('I think is exciting', log)).toBe(
      'The operator had said: "CQ, this is JA1·AI. What do you think? Over."\nThe learner said: "I think is exciting"',
    );
  });

  it('writes the card lessons in the UI language', () => {
    expect(reportSystemPrompt('es')).toContain('Rioplatense Spanish');
    expect(reportSystemPrompt('pt-BR')).toContain('Brazilian Portuguese');
    expect(explanationLanguage('fr')).toBe('plain English');
    expect(reportInput(log, ctx)).toContain('LEARNER: I think is exciting. Over.');
  });
});
