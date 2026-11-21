import { useEffect, useState } from 'react';
import { useI18n } from '@cq-talk/i18n';
import type { Logbook, QslRecord } from '@cq-talk/storage';

export interface LogbookPageProps {
  logbook: Logbook;
  /** Link to one card; the app's router renders it */
  renderLink: (record: QslRecord, children: React.ReactNode, className: string) => React.ReactNode;
  onBack: () => void;
}

const secondaryButton =
  'min-h-12 cursor-pointer rounded-lg border border-rig-border bg-control px-[22px] font-label text-[15px] font-medium tracking-[2px] text-night-label';

/** "Mis QSL": every printed card, newest first, as enamel keys. */
export const LogbookPage = ({ logbook, renderLink, onBack }: LogbookPageProps) => {
  const { t, locale } = useI18n();
  const [records, setRecords] = useState<QslRecord[] | null>(null);

  useEffect(() => {
    let active = true;
    void logbook.list().then((list) => {
      if (active) setRecords(list);
    });
    return () => {
      active = false;
    };
  }, [logbook]);

  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <section
      aria-labelledby="logbook-title"
      className="box-border flex w-full max-w-[820px] flex-col gap-[18px] rounded-xl border border-rig-border bg-rig-chassis p-[22px] shadow-[0_24px_60px_rgba(0,0,0,.7)]"
    >
      <div className="self-start rounded bg-plate px-3 py-1.5 text-plate-ink shadow-[inset_0_1px_0_#EEF0EA,0_1px_2px_rgba(0,0,0,.4)]">
        <h1 id="logbook-title" className="m-0 font-label text-[15px] font-medium tracking-[3px]">
          {t('logbook.title')}
        </h1>
      </div>

      {records === null && <p className="m-0 text-[15px]">{t('logbook.loading')}</p>}
      {records?.length === 0 && <p className="m-0 text-[15px]">{t('logbook.empty')}</p>}
      {records && records.length > 0 && (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-2.5 p-0">
          {records.map((record) => (
            <li key={record.id} className="flex">
              {renderLink(
                record,
                <>
                  <span className="font-readout text-[13px] text-freq-ink">
                    {date.format(new Date(record.savedAt))}
                    {record.mode === 'demo' && ` · ${t('logbook.demo')}`}
                  </span>
                  <span className="font-body text-[15px] font-bold">{record.topic}</span>
                  <span className="text-[13px]">
                    {record.call} · {record.freq} MHz · {record.duration}
                  </span>
                  <span className="text-[13px]">
                    {t('logbook.corrections', { fixes: record.fixes, total: record.total })}
                  </span>
                </>,
                'flex min-h-[58px] w-full flex-col gap-0.5 rounded-md bg-key px-3 py-2 text-left text-plate-ink no-underline shadow-[0_3px_0_#6E716B] hover:bg-key-hover hover:text-plate-ink',
              )}
            </li>
          ))}
        </ul>
      )}

      <button type="button" onClick={onBack} className={`${secondaryButton} self-start`}>
        {t('logbook.back')}
      </button>
    </section>
  );
};
