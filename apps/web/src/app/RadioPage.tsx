import { useEffect, useMemo, useRef, useState } from 'react';
import { useRadioSfx } from '@cq-talk/audio';
import { ConversationLog, StationHeader, StationReadout, TransmitPanel } from '@cq-talk/call';
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
import {
  createCloudSpeechOutput,
  createElevenLabsClient,
  createSpeechOutput,
} from '@cq-talk/speech';
import { useSettings } from '@cq-talk/storage';
import { TopicForm, WeeklyKeys } from '@cq-talk/tuner';
import { DeskMicrophone, Receiver, Rig, SplitStage } from '@cq-talk/ui';
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
  // ElevenLabs through the radio when configured; the browser voice otherwise and as a backup
  const { voiceProvider, elevenLabsKey, elevenLabsVoiceId } = settings;
  const operatorVoice = useMemo(() => {
    if (voiceProvider !== 'elevenlabs' || !elevenLabsKey || !elevenLabsVoiceId) return undefined;
    const client = createElevenLabsClient(elevenLabsKey);
    return createCloudSpeechOutput({
      synthesize: (text, signal) => client.synthesize(text, elevenLabsVoiceId, signal),
      play: sound.voice,
      fallback: createSpeechOutput(),
    });
  }, [voiceProvider, elevenLabsKey, elevenLabsVoiceId, sound.voice]);
  useOperatorVoice(log, {
    output: operatorVoice,
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

  const call = state.screen === 'call';
  const mic = micState(state);
  // The microphone is the push-to-talk: pressed at home it calls on the typed topic
  const callFromMic = () => {
    if (state.query.trim()) qso.call(state.query);
    else document.getElementById('topic')?.focus();
  };

  if (state.screen === 'report') {
    return (
      <Layout glow={skyGlow(state)}>
        <Report state={state} onNewQso={qso.restart} />
      </Layout>
    );
  }

  return (
    <Layout glow={skyGlow(state)} wide>
      <SplitStage
        split={call && !state.closing}
        rift={onAir ? 'on' : call ? 'closing' : 'off'}
        call={call}
        left={
          <Rig
            power={mic}
            radio={
              <Receiver
                position={state.position}
                readout={call ? `${state.freq} · ${state.station.call}` : t('rig.worldBand')}
                onAir={onAir}
                soundOn={sound.soundOn}
                onToggleSound={sound.toggleSound}
                display={
                  call ? (
                    <StationReadout
                      call={state.station.call}
                      freq={state.freq}
                      elapsed={state.elapsed}
                    />
                  ) : (
                    <TopicForm query={state.query} onQueryChange={qso.setQuery} onCall={qso.call} />
                  )
                }
                bay={call ? undefined : <WeeklyKeys onPreset={qso.pickPreset} />}
              />
            }
            microphone={
              <DeskMicrophone
                state={mic}
                onCall={callFromMic}
                onHangUp={() => qso.hangUp(live.finish())}
              />
            }
          />
        }
        right={
          call && (
            <div className="cq-qso">
              <StationHeader
                station={state.station}
                freq={state.freq}
                elapsed={state.elapsed}
                status={callStatus(state)}
              />
              <div aria-hidden="true" className="cq-rule" />
              <ConversationLog entries={log} call={state.station.call} />
              {state.mode === 'live' && !state.closing && (
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
              <p className="cq-hint">{t('log.hangUp')}</p>
            </div>
          )
        }
      />
    </Layout>
  );
};
