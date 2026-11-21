import type { SubmitEvent } from 'react';
import { useI18n } from '@cq-talk/i18n';
import { PRESETS } from '@cq-talk/qso';
import type { Preset } from '@cq-talk/qso';
import { TuningKnob } from '@cq-talk/ui';
import { PresetKey } from './PresetKey';

export interface TunerPanelProps {
  query: string;
  /** Needle position, so the knob turns with the dial */
  position: number;
  onQueryChange: (value: string) => void;
  /** Calls CQ on the typed topic */
  onCall: (topic: string) => void;
  /** A weekly frequency was pressed (the label is already translated) */
  onPreset: (preset: Preset, label: string) => void;
}

/** Home controls inside the rig: the knob, the topic display, LLAMAR · CQ and the weekly keys. */
export const TunerPanel = ({
  query,
  position,
  onQueryChange,
  onCall,
  onPreset,
}: TunerPanelProps) => {
  const { t } = useI18n();

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCall(query);
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <form onSubmit={submit} className="flex flex-wrap items-center gap-3.5">
        <TuningKnob position={position} />
        <label htmlFor="topic" className="sr-only">
          {t('tuner.prompt')}
        </label>
        <div className="flex min-w-0 flex-[999_1_260px] items-center gap-2.5 rounded-lg border-[3px] border-plate bg-display px-3.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-amber focus-within:outline-solid">
          <span aria-hidden="true" className="font-readout text-[18px] text-amber">
            &gt;
          </span>
          <input
            id="topic"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t('tuner.prompt')}
            autoComplete="off"
            className="h-[50px] min-w-0 flex-1 border-0 bg-transparent font-readout text-[20px] text-amber outline-none placeholder:text-display-placeholder"
          />
        </div>
        <button
          type="submit"
          className="min-h-14 flex-[1_1_150px] cursor-pointer rounded-lg border-0 bg-amber font-label text-[16px] font-semibold tracking-[3px] text-amber-ink shadow-[0_3px_0_#8A4E12] hover:bg-amber-hover"
        >
          {t('tuner.call')}
        </button>
      </form>
      <div className="flex flex-col gap-2.5">
        <h2
          id="weekly"
          className="m-0 font-label text-[12px] font-normal tracking-[3px] text-night-label"
        >
          {t('tuner.weekly')}
        </h2>
        <ul
          aria-labelledby="weekly"
          className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5 p-0"
        >
          {PRESETS.map((preset) => (
            <li key={preset.id} className="flex">
              <PresetKey
                freq={t('tuner.mhz', { freq: preset.freq })}
                label={t(`presets.${preset.id}`)}
                onPress={() => onPreset(preset, t(`presets.${preset.id}`))}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
