import { useI18n } from '@cq-talk/i18n';
import { formatClock } from '@cq-talk/qso';
import type { CallStatus, Station } from '@cq-talk/qso';

export interface StationPanelProps {
  station: Station;
  /** Seconds on air */
  elapsed: number;
  status: CallStatus;
}

const STATUS_KEY = {
  tuning: 'call.status.tuning',
  'your-turn': 'call.status.yourTurn',
  transmitting: 'call.status.transmitting',
  closing: 'call.status.closing',
} as const;

/** Display inside the rig during a call: who you are talking to, the clock and the status. */
export const StationPanel = ({ station, elapsed, status }: StationPanelProps) => {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-[3px] border-plate bg-display px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <span className="font-label text-[11px] tracking-[2px] text-display-muted">
          {t('call.inContact')}
        </span>
        <span className="font-readout text-[26px] tracking-[2px] text-amber">{station.call}</span>
        <span className="text-[14px] text-night-text">
          {t('call.operator', { place: t(`stations.${station.id}`) })}
        </span>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="font-readout text-[26px] text-amber">
          <span className="sr-only">{t('call.clock')} </span>
          <time dateTime={`PT${elapsed}S`}>{formatClock(elapsed)}</time>
        </span>
        <span role="status" className="font-readout text-[13px] text-display-muted">
          {t(STATUS_KEY[status])}
        </span>
      </div>
    </div>
  );
};
