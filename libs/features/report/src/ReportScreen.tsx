import { useRef, useState } from 'react';
import type { QslReport } from '@cq-talk/qso';
import { canShareFiles, downloadQslPdf, shareQslImage } from './exportQsl';
import { QslCard } from './QslCard';
import type { QslContact } from './QslCard';
import { ReportActions } from './ReportActions';

export interface ReportScreenProps {
  contact: QslContact;
  report: QslReport;
  secondaryLabel: string;
  onSecondary: () => void;
  /** Injected in tests; defaults to the real PDF export */
  download?: (card: HTMLElement, topic: string) => Promise<void>;
}

/** The QSL card and what to do with it. */
export const ReportScreen = ({
  contact,
  report,
  secondaryLabel,
  onSecondary,
  download = downloadQslPdf,
}: ReportScreenProps) => {
  const card = useRef<HTMLElement>(null);
  const [busy, setBusy] = useState(false);
  const [shareable] = useState(canShareFiles);

  const run = async (task: (element: HTMLElement, topic: string) => Promise<void>) => {
    if (!card.current) return;
    setBusy(true);
    try {
      await task(card.current, contact.topic);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <QslCard ref={card} contact={contact} report={report} />
      <ReportActions
        onDownload={() => void run(download)}
        onShare={shareable ? () => void run(shareQslImage) : undefined}
        secondaryLabel={secondaryLabel}
        onSecondary={onSecondary}
        busy={busy}
      />
    </div>
  );
};
