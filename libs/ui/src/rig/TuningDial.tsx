import { useI18n } from '@cq-talk/i18n';
import { DIAL_TICKS, needleLeft } from './dial';

export interface TuningDialProps {
  /** Needle position on the band, 0–100 */
  position: number;
  /** Text printed at the bottom of the dial (band name or frequency and station) */
  readout: string;
  /** The amber backlight glows brighter while on air */
  active: boolean;
}

/** Amber backlit dial with a red needle that springs to the tuned frequency. */
export const TuningDial = ({ position, readout, active }: TuningDialProps) => {
  const { t } = useI18n();
  return (
    <div
      className="relative min-h-[128px] flex-[3_1_340px] overflow-hidden rounded-lg border-[3px] border-plate"
      style={{
        background: 'radial-gradient(ellipse at 50% 60%, #FFB347 0%, #D9781E 45%, #5A2A08 100%)',
        boxShadow: `0 0 34px ${active ? 'rgba(255,179,71,.75)' : 'rgba(255,179,71,.35)'}`,
        transition: 'box-shadow 1.5s ease',
      }}
    >
      <div
        aria-hidden="true"
        className="absolute top-3 right-[18px] left-[18px] flex justify-between"
      >
        {DIAL_TICKS.map((tick, index) => (
          <div key={index} className="flex w-px flex-col items-center gap-1">
            <span className={`w-px bg-amber-ink ${tick.major ? 'h-[22px]' : 'h-[10px]'}`} />
            <span className="font-label text-[12px] whitespace-nowrap text-amber-ink">
              {tick.label}
            </span>
          </div>
        ))}
      </div>
      <span
        aria-hidden="true"
        data-testid="dial-needle"
        className="absolute top-1.5 bottom-1.5 w-[3px] rounded-[2px] bg-needle"
        style={{ left: needleLeft(position), transition: 'left .7s var(--ease-spring)' }}
      />
      <div className="absolute right-4 bottom-2.5 left-4 flex items-end justify-between gap-2.5">
        <span className="font-readout text-[15px] text-amber-ink">{readout}</span>
        <span className="font-label text-[11px] tracking-[2px] text-amber-ink">{t('rig.mhz')}</span>
      </div>
    </div>
  );
};
