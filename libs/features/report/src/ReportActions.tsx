import { useI18n } from '@cq-talk/i18n';

export interface ReportActionsProps {
  onDownload: () => void;
  /** Shown where the device can share images (mostly phones) */
  onShare?: (() => void) | undefined;
  /** The second button: "Nuevo QSO" after a contact, "Volver a Mis QSL" in the logbook */
  secondaryLabel: string;
  onSecondary: () => void;
  /** The PDF is being prepared */
  busy?: boolean;
}

const secondaryButton =
  'min-h-12 cursor-pointer rounded-lg border border-rig-border bg-control px-[22px] font-label text-[15px] font-medium tracking-[2px] text-night-label';

/** "Descargar QSL (PDF)", "Compartir" and the way out, under the card. */
export const ReportActions = ({
  onDownload,
  onShare,
  secondaryLabel,
  onSecondary,
  busy = false,
}: ReportActionsProps) => {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="flex flex-wrap justify-center gap-2.5">
        <button
          type="button"
          onClick={onDownload}
          disabled={busy}
          className="flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border-0 bg-amber px-[22px] font-label text-[15px] font-semibold tracking-[2px] text-amber-ink shadow-[0_3px_0_#8A4E12] hover:bg-amber-hover disabled:cursor-wait disabled:opacity-70"
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
          </svg>
          {t('report.download')}
        </button>
        {onShare && (
          <button type="button" onClick={onShare} disabled={busy} className={secondaryButton}>
            {t('report.share')}
          </button>
        )}
        <button type="button" onClick={onSecondary} className={secondaryButton}>
          {secondaryLabel}
        </button>
      </div>
      <p role="status" className="m-0 min-h-5 text-[13px] text-night-muted">
        {busy ? t('report.preparing') : ''}
      </p>
    </div>
  );
};
