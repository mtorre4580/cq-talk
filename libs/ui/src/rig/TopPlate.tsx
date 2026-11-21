import { useI18n } from '@cq-talk/i18n';
import { OnAirLamp } from './OnAirLamp';

export interface TopPlateProps {
  onAir: boolean;
  soundOn: boolean;
  onToggleSound: () => void;
}

/** Brand plate (the page heading), the sound toggle and the ON AIR lamp. */
export const TopPlate = ({ onAir, soundOn, onToggleSound }: TopPlateProps) => {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-baseline gap-3 rounded bg-plate px-3 py-1.5 text-plate-ink shadow-[inset_0_1px_0_#EEF0EA,0_1px_2px_rgba(0,0,0,.4)]">
        <h1 className="m-0 font-display text-[22px] font-normal">{t('app.name')}</h1>
        <span className="font-label text-[11px] tracking-[2px]">{t('rig.model')}</span>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-pressed={soundOn}
          onClick={onToggleSound}
          className="min-h-11 cursor-pointer rounded-md border border-control-border bg-control px-3 font-label text-[12px] tracking-[2px] text-control-text"
        >
          {soundOn ? t('rig.soundOn') : t('rig.soundOff')}
        </button>
        <OnAirLamp on={onAir} />
      </div>
    </div>
  );
};
