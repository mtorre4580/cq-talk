const MAX_SLUG = 40;
const isSlugChar = (c: string) => (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9');

/**
 * File name for a card: `cq-talk-qsl-mundial-2026.pdf`. One pass over the topic, no regular
 * expressions: topics are user input (CodeQL: polynomial regex).
 */
export const qslFileName = (topic: string, extension: 'pdf' | 'png'): string => {
  // Split accented letters into letter + combining mark (U+0300–U+036F) and drop the marks
  const plain = topic.normalize('NFD').toLowerCase();
  let slug = '';
  for (const c of plain) {
    if (slug.length >= MAX_SLUG) break;
    const code = c.charCodeAt(0);
    if (code >= 0x300 && code <= 0x36f) continue;
    if (isSlugChar(c)) slug += c;
    else if (slug && !slug.endsWith('-')) slug += '-';
  }
  while (slug.endsWith('-')) slug = slug.slice(0, -1);
  return `cq-talk-qsl-${slug || 'qso'}.${extension}`;
};

/** Renders the card element to a PNG data URL at twice its size (sharp on paper and phones). */
const renderCard = async (
  card: HTMLElement,
): Promise<{ png: string; width: number; height: number }> => {
  const { toPng } = await import('html-to-image');
  const { width, height } = card.getBoundingClientRect();
  const png = await toPng(card, { pixelRatio: 2, cacheBust: true });
  return { png, width, height };
};

/** Downloads the card as a one-page PDF sized to the card. Libraries load on demand. */
export const downloadQslPdf = async (card: HTMLElement, topic: string): Promise<void> => {
  const [{ png, width, height }, { jsPDF }] = await Promise.all([
    renderCard(card),
    import('jspdf'),
  ]);
  const pdf = new jsPDF({
    unit: 'px',
    format: [width, height],
    orientation: width > height ? 'landscape' : 'portrait',
    hotfixes: ['px_scaling'],
  });
  pdf.addImage(png, 'PNG', 0, 0, width, height);
  pdf.save(qslFileName(topic, 'pdf'));
};

/** Shares the card as an image where the Web Share API takes files (mostly phones). */
export const canShareFiles = (): boolean => {
  try {
    const probe = new File([''], 'qsl.png', { type: 'image/png' });
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
};

export const shareQslImage = async (card: HTMLElement, topic: string): Promise<void> => {
  const { png } = await renderCard(card);
  const blob = await (await fetch(png)).blob();
  const file = new File([blob], qslFileName(topic, 'png'), { type: 'image/png' });
  try {
    await navigator.share({ files: [file], title: topic });
  } catch {
    // The user closed the share sheet: nothing to do
  }
};
