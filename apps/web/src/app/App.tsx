import { useState } from 'react';
import { useRadioSfx } from '@cq-talk/audio';
import { ConversationLog, StationPanel } from '@cq-talk/call';
import { I18nProvider, useI18n } from '@cq-talk/i18n';
import {
  callStatus,
  conversationLog,
  correctionCounts,
  formatClock,
  isOnAir,
  micState,
  skyGlow,
} from '@cq-talk/qso';
import type { QsoState } from '@cq-talk/qso';
import { ReportScreen, useDemoReport } from '@cq-talk/report';
import { SettingsDialog } from '@cq-talk/settings';
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

const Report = ({ state, onNewQso }: { state: QsoState; onNewQso: () => void }) => {
  const { t } = useI18n();
  const counts = correctionCounts(conversationLog(state));
  const report = useDemoReport(counts.fixes);
  return (
    <ReportScreen
      contact={{
        topic: state.topic,
        call: state.station.call,
        place: t(`stations.${state.station.id}`),
        freq: state.freq,
        duration: formatClock(state.elapsed),
        ...counts,
      }}
      report={report}
      // The browser's print dialog saves a PDF until the real export lands (PR 11)
      onDownload={() => window.print()}
      onNewQso={onNewQso}
    />
  );
};

const Screen = () => {
  const { t } = useI18n();
  const sound = useRadioSfx();
  const qso = useQso({ unlock: sound.unlock, tuneIn: sound.tuneIn, off: sound.off });
  const { state } = qso;
  const onAir = isOnAir(state);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <Layout glow={skyGlow(state)} onOpenSettings={() => setSettingsOpen(true)}>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {state.screen !== 'report' && (
        <Rig
          radio={
            <RigCase onAir={onAir}>
              <TopPlate onAir={onAir} soundOn={sound.soundOn} onToggleSound={sound.toggleSound} />
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
              {state.screen === 'call' && (
                <StationPanel
                  station={state.station}
                  elapsed={state.elapsed}
                  status={callStatus(state)}
                />
              )}
            </RigCase>
          }
          microphone={<DeskMicrophone state={micState(state)} onHangUp={qso.hangUp} />}
        />
      )}
      {state.screen === 'call' && (
        <ConversationLog entries={conversationLog(state)} call={state.station.call} />
      )}
      {state.screen === 'report' && <Report state={state} onNewQso={qso.restart} />}
    </Layout>
  );
};

export const App = () => (
  <I18nProvider>
    <Screen />
  </I18nProvider>
);
