import { useI18n } from '@cq-talk/i18n';
import { formatClock } from '@cq-talk/qso';
import type { CallStatus, Station } from '@cq-talk/qso';

export interface StationHeaderProps {
  station: Station;
  /** Tuned frequency in MHz */
  freq: string;
  /** Seconds on air */
  elapsed: number;
  status: CallStatus;
}

const STATUS_KEY = {
  tuning: 'call.status.tuning',
  receiving: 'call.status.receiving',
  'your-turn': 'call.status.yourTurn',
  transmitting: 'call.status.transmitting',
  closing: 'call.status.closing',
} as const;

/** Top of the QSO side: who you are talking to, the clock and the status line. */
export const StationHeader = ({ station, freq, elapsed, status }: StationHeaderProps) => {
  const { t } = useI18n();
  return (
    <>
      <div className="cq-qso-head">
        <span className="cq-eyebrow">{t('call.inContact')}</span>
        <h2 className="cq-call-sign">{station.call}</h2>
        <span className="cq-clock">
          <span className="sr-only">{t('call.clock')} </span>
          <time dateTime={`PT${elapsed}S`}>{formatClock(elapsed)}</time>
        </span>
        <p className="cq-place">
          {t('call.operator', { place: t(`stations.${station.id}`) })}
          <span> · {t('tuner.mhz', { freq })}</span>
        </p>
      </div>
      <p role="status" className="cq-status m-0">
        {t(STATUS_KEY[status])}
      </p>
    </>
  );
};
