import type { QslReport } from '@cq-talk/qso';
import { QslCard } from './QslCard';
import type { QslContact } from './QslCard';
import { ReportActions } from './ReportActions';

export interface ReportScreenProps {
  contact: QslContact;
  report: QslReport;
  onDownload: () => void;
  onNewQso: () => void;
}

/** Third screen: the QSL card and what to do next. */
export const ReportScreen = ({ contact, report, onDownload, onNewQso }: ReportScreenProps) => (
  <div className="flex w-full flex-col items-center gap-5">
    <QslCard contact={contact} report={report} />
    <ReportActions onDownload={onDownload} onNewQso={onNewQso} />
  </div>
);
