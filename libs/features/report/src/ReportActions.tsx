import { useI18n } from '@cq-talk/i18n';

export interface ReportActionsProps {
  onDownload: () => void;
  onNewQso: () => void;
}

/** "Descargar QSL (PDF)" and "Nuevo QSO" under the card. */
export const ReportActions = ({ onDownload, onNewQso }: ReportActionsProps) => {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      <button
        type="button"
        onClick={onDownload}
        className="flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border-0 bg-amber px-[22px] font-label text-[15px] font-semibold tracking-[2px] text-amber-ink shadow-[0_3px_0_#8A4E12] hover:bg-amber-hover"
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
      <button
        type="button"
        onClick={onNewQso}
        className="min-h-12 cursor-pointer rounded-lg border border-solid border-rig-border bg-control px-[22px] font-label text-[15px] font-medium tracking-[2px] text-night-label"
      >
        {t('report.newQso')}
      </button>
    </div>
  );
};
