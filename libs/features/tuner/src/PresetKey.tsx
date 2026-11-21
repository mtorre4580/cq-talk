export interface PresetKeyProps {
  freq: string;
  label: string;
  onPress: () => void;
}

/** Enamel key for a weekly frequency; it sinks 2 px when pressed. */
export const PresetKey = ({ freq, label, onPress }: PresetKeyProps) => (
  <button
    type="button"
    onClick={onPress}
    className="flex min-h-[58px] w-full cursor-pointer flex-col gap-0.5 rounded-md border-0 bg-key px-3 py-2 text-left text-plate-ink shadow-[0_3px_0_#6E716B] hover:bg-key-hover active:translate-y-0.5 active:shadow-[0_1px_0_#6E716B]"
  >
    <span className="font-readout text-[13px] text-freq-ink">{freq}</span>
    <span className="font-body text-[15px] font-bold">{label}</span>
  </button>
);
