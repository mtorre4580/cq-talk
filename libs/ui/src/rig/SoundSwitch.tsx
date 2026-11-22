import { useI18n } from '@cq-talk/i18n';

export interface SoundSwitchProps {
  soundOn: boolean;
  onToggle: () => void;
}

/** Chrome bat-handle toggle for the radio sounds ("SONIDO"): up is on, down is off. */
export const SoundSwitch = ({ soundOn, onToggle }: SoundSwitchProps) => {
  const { t } = useI18n();
  return (
    <div className="cq-ctl">
      <span aria-hidden="true" className="cq-eng">
        {t('rig.sound')}
      </span>
      <button
        type="button"
        className="cq-toggle"
        aria-pressed={soundOn}
        aria-label={soundOn ? t('rig.soundOn') : t('rig.soundOff')}
        onClick={onToggle}
      >
        <span className="cq-toggle-plate" />
        <span className="cq-toggle-bat" />
      </button>
      <span aria-hidden="true" className="cq-ctl-state">
        {soundOn ? t('rig.on') : t('rig.off')}
      </span>
    </div>
  );
};
