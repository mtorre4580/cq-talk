import { useI18n } from '@cq-talk/i18n';

export interface OnAirLampProps {
  on: boolean;
}

/** Red "ON AIR" lamp that pulses while transmitting. The text label keeps it readable without color. */
export const OnAirLamp = ({ on }: OnAirLampProps) => {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2 font-label text-[12px] tracking-[2px] text-night-label">
      <span
        aria-hidden="true"
        data-on={on}
        className={`size-3.5 rounded-full border-2 border-rig-body ${on ? 'bg-lamp-on animate-lamp' : 'bg-lamp-off'}`}
        style={{ boxShadow: on ? '0 0 12px rgba(255,74,46,.9)' : 'none' }}
      />
      {t('rig.onAir')}
    </div>
  );
};
