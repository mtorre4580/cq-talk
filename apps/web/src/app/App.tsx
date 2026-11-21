import { useState } from 'react';
import { I18nProvider, useI18n } from '@cq-talk/i18n';
import {
  DeskMicrophone,
  MeterBridge,
  Rig,
  RigCase,
  SMeter,
  TopPlate,
  TuningDial,
} from '@cq-talk/ui';
import { Layout } from './Layout';

/** Needle position the prototype starts on (14.205 MHz) */
const HOME_POSITION = 44;

const Screen = () => {
  const { t } = useI18n();
  // Persisted and wired to the sound effects in PR 5
  const [soundOn, setSoundOn] = useState(true);

  return (
    <Layout glow="idle">
      <Rig
        radio={
          <RigCase onAir={false}>
            <TopPlate
              onAir={false}
              soundOn={soundOn}
              onToggleSound={() => setSoundOn((on) => !on)}
            />
            <MeterBridge>
              <SMeter active={false} />
              <TuningDial position={HOME_POSITION} readout={t('rig.worldBand')} active={false} />
            </MeterBridge>
          </RigCase>
        }
        microphone={<DeskMicrophone state="off" onHangUp={() => {}} />}
      />
    </Layout>
  );
};

export const App = () => (
  <I18nProvider>
    <Screen />
  </I18nProvider>
);
