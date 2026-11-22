import { useI18n } from '@cq-talk/i18n';

export interface OnAirLampProps {
  on: boolean;
}

/**
 * Red jewel pilot lamp. Its glow follows `--lamp` from the desk set; the engraved "ON AIR" and
 * the ON/OFF state keep it readable without color.
 */
export const OnAirLamp = ({ on }: OnAirLampProps) => {
  const { t } = useI18n();
  return (
    <div className="cq-ctl">
      <span className="cq-eng">{t('rig.onAir')}</span>
      <span aria-hidden="true" className="cq-jewel" data-on={on} />
      <span className="cq-ctl-state">{on ? t('rig.on') : t('rig.off')}</span>
    </div>
  );
};
