import { useEffect, useRef, useState } from 'react';
import { useRadioSfx } from '@cq-talk/audio';
import { ConversationLog, StationPanel, TransmitPanel } from '@cq-talk/call';
import { DEFAULT_MODEL } from '@cq-talk/claude';
import { useI18n } from '@cq-talk/i18n';
import {
  callStatus,
  conversationLog,
  correctionCounts,
  formatClock,
  isOnAir,
  micState,
  skyGlow,
} from '@cq-talk/qso';
import type { QslReport, QsoState } from '@cq-talk/qso';
import { ReportScreen, useDemoReport } from '@cq-talk/report';
import { useSettings } from '@cq-talk/storage';
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
import { logbook } from './logbook';
import { useLiveOperator } from './useLiveOperator';
import { useOperatorVoice } from './useOperatorVoice';
import { useQso } from './useQso';

const EMPTY_REPORT: QslReport = { errors: [], vocabulary: [], practice: [] };

const Report = ({ state, onNewQso }: { state: QsoState; onNewQso: () => void }) => {
  const { t } = useI18n();
  const counts = correctionCounts(conversationLog(state));
  const demoReport = useDemoReport(counts.fixes);
  const report = state.mode === 'live' ? (state.report ?? EMPTY_REPORT) : demoReport;
  const duration = formatClock(state.elapsed);

  // Every printed card goes to "Mis QSL", once
  const [id] = useState(() => crypto.randomUUID());
  const saved = useRef(false);
  useEffect(() => {
    if (saved.current) return;
    saved.current = true;
    void logbook.save({
      id,
      savedAt: new Date().toISOString(),
      mode: state.mode,
      topic: state.topic,
      call: state.station.call,
      stationId: state.station.id,
      freq: state.freq,
      duration,
      ...counts,
      report,
    });
  });

  return (
    <ReportScreen
      contact={{
        topic: state.topic,
        call: state.station.call,
        place: t(`stations.${state.station.id}`),
        freq: state.freq,
        duration,
        ...counts,
      }}
      report={report}
      secondaryLabel={t('report.newQso')}
      onSecondary={onNewQso}
    />
  );
};

export const RadioPage = () => {
  const { t, locale } = useI18n();
  const settings = useSettings(DEFAULT_MODEL);
  const sound = useRadioSfx();
  const qso = useQso(
    { unlock: sound.unlock, tuneIn: sound.tuneIn, off: sound.off },
    settings.apiKey ? 'live' : 'demo',
  );
  const { state } = qso;
  const onAir = isOnAir(state);
  const log = conversationLog(state);
  const lastOperator = log.findLast((entry) => entry.who === 'operator');
  const [voiceDoneId, setVoiceDoneId] = useState<string | null>(null);
  useOperatorVoice(log, {
    enabled: sound.soundOn && onAir,
    hiss: sound.hiss,
    streamingId: state.operatorTalking ? (lastOperator?.id ?? null) : null,
    onDone: setVoiceDoneId,
  });
  // Half-duplex: the microphone stays closed until the operator's last line has been read out
  const voicePending =
    state.mode === 'live' && onAir && lastOperator !== undefined && lastOperator.id !== voiceDoneId;
  const live = useLiveOperator({
    state,
    dispatch: qso.dispatch,
    apiKey: settings.apiKey,
    model: settings.model,
    locale,
    speaking: voicePending,
  });

  return (
    <Layout glow={skyGlow(state)}>
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
              {state.screen === 'call' && state.mode === 'live' && !state.closing && (
                <TransmitPanel
                  yourTurn={live.yourTurn}
                  listening={live.listening}
                  interim={live.interim}
                  notice={live.notice}
                  error={state.error}
                  onSend={live.send}
                  onRetry={live.retry}
                />
              )}
            </RigCase>
          }
          microphone={
            <DeskMicrophone state={micState(state)} onHangUp={() => qso.hangUp(live.finish())} />
          }
        />
      )}
      {state.screen === 'call' && <ConversationLog entries={log} call={state.station.call} />}
      {state.screen === 'report' && <Report state={state} onNewQso={qso.restart} />}
    </Layout>
  );
};
