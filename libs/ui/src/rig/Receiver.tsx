import type { ReactNode } from 'react';
import { useI18n } from '@cq-talk/i18n';
import { BandSpread } from './BandSpread';
import { Knob } from './Knob';
import { MainDial } from './MainDial';
import { MeterWindow } from './MeterWindow';
import { OnAirLamp } from './OnAirLamp';
import { SMeter } from './SMeter';
import { SoundSwitch } from './SoundSwitch';
import { TuningKnob } from './TuningKnob';

export interface ReceiverProps {
  /** Needle position on the band, 0–100; the knob and band spread follow it */
  position: number;
  /** Printed at the bottom of the main dial */
  readout: string;
  onAir: boolean;
  soundOn: boolean;
  onToggleSound: () => void;
  /** The amber readout strip under the nameplate (topic input or station line) */
  display: ReactNode;
  /** Optional bay under the controls (the weekly frequency keys) */
  bay?: ReactNode;
}

/**
 * A 1940s-style communications receiver: hammertone steel cabinet with chrome trims, black
 * crackle panel, three backlit meter windows, the brand nameplate (the page heading), the
 * readout strip, knobs, the ON AIR jewel and the sound toggle.
 */
export const Receiver = ({
  position,
  readout,
  onAir,
  soundOn,
  onToggleSound,
  display,
  bay,
}: ReceiverProps) => {
  const { t } = useI18n();
  return (
    <div className="cq-rig">
      <div className="cq-cabinet">
        <div className="cq-lid" />
        <div className="cq-face">
          <i className="cq-screw cq-screw-1" />
          <i className="cq-screw cq-screw-2" />
          <i className="cq-screw cq-screw-3" />
          <i className="cq-screw cq-screw-4" />

          <div className="cq-windows">
            <MeterWindow label={t('rig.meterUnits')}>
              <SMeter active={onAir} />
            </MeterWindow>
            <MeterWindow label={t('rig.megacycles')} main>
              <MainDial position={position} readout={readout} />
            </MeterWindow>
            <MeterWindow label={t('rig.bandSpread')}>
              <BandSpread position={position} />
            </MeterWindow>
          </div>

          <div className="cq-nameplate">
            <span aria-hidden="true" className="cq-chev">
              ›››
            </span>
            <span>
              <h1 className="cq-brand">{t('app.name')}</h1>
              <span className="cq-model cq-eng">{t('rig.model')}</span>
            </span>
            <span aria-hidden="true" className="cq-chev">
              ‹‹‹
            </span>
          </div>

          {display}

          <div className="cq-controls">
            <Knob label={t('rig.tone')} pointer={-40} />
            <Knob label={t('rig.rfGain')} pointer={60} />
            <div className="cq-ctl">
              <TuningKnob position={position} />
            </div>
            <OnAirLamp on={onAir} />
            <SoundSwitch soundOn={soundOn} onToggle={onToggleSound} />
          </div>

          {bay}
        </div>
      </div>
      <div className="cq-feet" aria-hidden="true">
        <i />
        <i />
      </div>
    </div>
  );
};
