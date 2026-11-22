export interface PresetKeyProps {
  /** Frequency in MHz, printed on the key */
  freq: string;
  label: string;
  onPress: () => void;
}

/** Ivory bakelite preset key; it sinks when pressed. */
export const PresetKey = ({ freq, label, onPress }: PresetKeyProps) => (
  <button type="button" onClick={onPress} className="cq-key">
    <span className="cq-key-freq">{freq}</span>
    <span className="cq-key-label">{label}</span>
  </button>
);
