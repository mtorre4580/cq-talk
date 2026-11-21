import { useState } from 'react';
import { I18nProvider, useI18n } from '@cq-talk/i18n';
import { isOnAir, micState, skyGlow } from '@cq-talk/qso';
import { TunerPanel } from '@cq-talk/tuner';
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
import { useQso } from './useQso';

const Screen = () => {
  const { t } = useI18n();
  const qso = useQso();
  const { state } = qso;
  const onAir = isOnAir(state);
  // Persisted and wired to the sound effects in PR 5
  const [soundOn, setSoundOn] = useState(true);

  return (
    <Layout glow={skyGlow(state)}>
      {state.screen !== 'report' && (
        <Rig
          radio={
            <RigCase onAir={onAir}>
              <TopPlate
                onAir={onAir}
                soundOn={soundOn}
                onToggleSound={() => setSoundOn((on) => !on)}
              />
              <MeterBridge>
                <SMeter active={onAir} />
                <TuningDial
                  position={state.position}
                  readout={
                    state.screen === 'call'
                      ? `${state.freq} · ${state.station.call}`
                      : t('rig.worldBand')
                  }
                  active={onAir}
                />
              </MeterBridge>
              {state.screen === 'home' && (
                <TunerPanel
                  query={state.query}
                  position={state.position}
                  onQueryChange={qso.setQuery}
                  onCall={qso.call}
                  onPreset={qso.pickPreset}
                />
              )}
              {/* PR 6: station panel and conversation log */}
            </RigCase>
          }
          microphone={<DeskMicrophone state={micState(state)} onHangUp={qso.hangUp} />}
        />
      )}
      {state.screen === 'report' && (
        // PR 7: the QSL card goes above this button
        <button
          type="button"
          onClick={qso.restart}
          className="min-h-12 cursor-pointer rounded-lg border border-rig-border bg-control px-[22px] font-label text-[15px] font-medium tracking-[2px] text-night-label"
        >
          {t('report.newQso')}
        </button>
      )}
    </Layout>
  );
};

export const App = () => (
  <I18nProvider>
    <Screen />
  </I18nProvider>
);
