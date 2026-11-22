import { useI18n } from '@cq-talk/i18n';
import { formatClock } from '@cq-talk/qso';

export interface StationReadoutProps {
  call: string;
  freq: string;
  /** Seconds on air */
  elapsed: number;
}

/**
 * The receiver's amber readout strip on air: call sign, frequency and clock. It repeats what the
 * QSO header announces, so it is hidden from assistive technology.
 */
export const StationReadout = ({ call, freq, elapsed }: StationReadoutProps) => {
  const { t } = useI18n();
  return (
    <div className="cq-readout">
      <div className="cq-station-line" aria-hidden="true">
        <span>{call}</span>
        <span>{t('tuner.mhz', { freq })}</span>
        <span>{formatClock(elapsed)}</span>
      </div>
    </div>
  );
};
