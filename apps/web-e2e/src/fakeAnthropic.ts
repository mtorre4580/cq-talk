import type { Page, Request } from '@playwright/test';

const message = (text: string) => ({
  id: 'msg_test',
  type: 'message',
  role: 'assistant',
  model: 'claude-opus-5-5',
  content: [{ type: 'text', text }],
  stop_reason: 'end_turn',
  stop_sequence: null,
  usage: { input_tokens: 1, output_tokens: 1 },
});

/** A streamed operator transmission, as server-sent events. */
const sse = (chunks: string[]) =>
  [
    [
      'message_start',
      { type: 'message_start', message: { ...message(''), content: [], stop_reason: null } },
    ],
    [
      'content_block_start',
      { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    ],
    ...chunks.map((text) => [
      'content_block_delta',
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } },
    ]),
    ['content_block_stop', { type: 'content_block_stop', index: 0 }],
    [
      'message_delta',
      {
        type: 'message_delta',
        delta: { stop_reason: 'end_turn', stop_sequence: null },
        usage: { output_tokens: 5 },
      },
    ],
    ['message_stop', { type: 'message_stop' }],
  ]
    .map(([event, data]) => `event: ${event as string}\ndata: ${JSON.stringify(data)}\n\n`)
    .join('');

export interface FakeAnthropic {
  requests: { body: Record<string, unknown>; headers: Record<string, string> }[];
}

/**
 * Answers the Claude API in the browser without network or tokens: streamed operator lines,
 * a structured assessment and a structured QSL report.
 */
export const fakeAnthropic = async (
  page: Page,
  transmissions: string[][],
): Promise<FakeAnthropic> => {
  const fake: FakeAnthropic = { requests: [] };
  let turn = 0;
  await page.route('https://api.anthropic.com/v1/messages**', async (route) => {
    const request: Request = route.request();
    const body = request.postDataJSON() as Record<string, unknown>;
    fake.requests.push({ body, headers: await request.allHeaders() });
    const system = String(body['system'] ?? '');

    if (body['stream']) {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: sse(transmissions[turn++] ?? ['Roger that. Over.']),
      });
      return;
    }
    const json = system.includes('QSL card')
      ? {
          errors: [
            {
              said: 'I think is great',
              better: 'I think it’s great.',
              why: 'El sujeto no se omite.',
            },
          ],
          vocabulary: [{ phrase: 'to weigh in on', meaning: 'opinar sobre un tema' }],
          practice: ['1. Uno.', '2. Dos.', '3. Tres.'],
        }
      : { verdict: 'fix', better: 'I think it’s great.' };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(message(JSON.stringify(json))),
    });
  });
  return fake;
};
