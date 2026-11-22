import { useEffect, useState } from 'react';

/** Characters per keystroke and the pause between them: about 35 characters a second. */
const STEP_MS = 28;
const JITTER_MS = 30;

/**
 * Types `text` out like a teleprinter, with a block caret. Screen readers get the whole line at
 * once (the typed copy is hidden from them), so the live region announces it a single time. When
 * `text` grows (a live transmission streaming in) typing carries on from where it was.
 */
export const TypedText = ({ text }: { text: string }) => {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown >= text.length) return;
    const id = setTimeout(
      () => setShown((n) => Math.min(text.length, n + (Math.random() < 0.3 ? 2 : 1))),
      STEP_MS + Math.random() * JITTER_MS,
    );
    return () => clearTimeout(id);
  }, [shown, text.length]);

  if (shown >= text.length) return text;
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, shown)}
        <span className="cq-caret" />
      </span>
    </>
  );
};
