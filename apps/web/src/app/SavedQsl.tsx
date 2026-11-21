import { useEffect, useState } from 'react';
import { useI18n } from '@cq-talk/i18n';
import { ReportScreen } from '@cq-talk/report';
import type { StationId } from '@cq-talk/qso';
import type { Logbook, QslRecord } from '@cq-talk/storage';

export interface SavedQslProps {
  logbook: Logbook;
  id: string;
  onBack: () => void;
}

/** One card from "Mis QSL", ready to download or share again. */
export const SavedQsl = ({ logbook, id, onBack }: SavedQslProps) => {
  const { t } = useI18n();
  const [record, setRecord] = useState<QslRecord | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    void logbook.get(id).then((found) => {
      if (active) setRecord(found ?? null);
    });
    return () => {
      active = false;
    };
  }, [logbook, id]);

  if (record === undefined) return <p className="m-0">{t('logbook.loading')}</p>;
  if (record === null) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="m-0">{t('logbook.notFound')}</p>
        <button
          type="button"
          onClick={onBack}
          className="min-h-12 cursor-pointer rounded-lg border border-rig-border bg-control px-[22px] font-label text-[15px] font-medium tracking-[2px] text-night-label"
        >
          {t('logbook.backToLog')}
        </button>
      </div>
    );
  }

  return (
    <ReportScreen
      contact={{
        topic: record.topic,
        call: record.call,
        place: t(`stations.${record.stationId as StationId}`),
        freq: record.freq,
        duration: record.duration,
        fixes: record.fixes,
        total: record.total,
      }}
      report={record.report}
      secondaryLabel={t('logbook.backToLog')}
      onSecondary={onBack}
    />
  );
};
