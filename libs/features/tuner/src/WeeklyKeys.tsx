import { useI18n } from '@cq-talk/i18n';
import { PRESETS } from '@cq-talk/qso';
import type { Preset } from '@cq-talk/qso';
import { PresetKey } from './PresetKey';

export interface WeeklyKeysProps {
  /** A weekly frequency was pressed (the label is already translated) */
  onPreset: (preset: Preset, label: string) => void;
}

/** "Frecuencias de la semana": ivory preset keys in a recessed bay of the receiver. */
export const WeeklyKeys = ({ onPreset }: WeeklyKeysProps) => {
  const { t } = useI18n();
  return (
    <div className="cq-bay">
      <h2 id="weekly" className="cq-eng cq-bay-title">
        {t('tuner.weekly')}
      </h2>
      <ul aria-labelledby="weekly" className="cq-keys">
        {PRESETS.map((preset) => (
          <li key={preset.id}>
            <PresetKey
              freq={preset.freq}
              label={t(`presets.${preset.id}`)}
              onPress={() => onPreset(preset, t(`presets.${preset.id}`))}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};
