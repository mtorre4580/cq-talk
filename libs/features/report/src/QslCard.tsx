import type { Ref } from 'react';
import { useI18n } from '@cq-talk/i18n';
import type { QslReport } from '@cq-talk/qso';

export interface QslContact {
  topic: string;
  call: string;
  /** City of the station, already translated */
  place: string;
  freq: string;
  /** `mm:ss` */
  duration: string;
  fixes: number;
  total: number;
}

export interface QslCardProps {
  contact: QslContact;
  report: QslReport;
  /** The printed card, for the PDF and image exports */
  ref?: Ref<HTMLElement>;
}

const sectionTitle = 'm-0 font-label text-[15px] font-medium tracking-[3px]';

/** The printed QSL card: contact details, mistakes, vocabulary and practice for tomorrow. */
export const QslCard = ({ contact, report, ref }: QslCardProps) => {
  const { t } = useI18n();
  const fields = [
    { key: t('report.fields.to'), value: t('report.you') },
    { key: t('report.fields.from'), value: contact.call },
    { key: t('report.fields.qth'), value: contact.place },
    { key: t('report.fields.freq'), value: `${contact.freq} MHz` },
    { key: t('report.fields.duration'), value: contact.duration },
    {
      key: t('report.fields.corrections'),
      value: t('report.correctionsValue', { fixes: contact.fixes, total: contact.total }),
    },
  ];

  return (
    <article
      ref={ref}
      aria-labelledby="qsl-topic"
      className="box-border w-full max-w-[760px] animate-fadein rounded bg-qsl p-2.5 text-qsl-ink shadow-[0_24px_60px_rgba(0,0,0,.7),0_0_80px_rgba(70,255,170,.18)]"
    >
      <div className="flex flex-col gap-[22px] border-2 border-solid border-qsl-ink p-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-label text-[13px] tracking-[3px] text-qsl-muted">
              {t('report.title')}
            </span>
            <h2 id="qsl-topic" className="m-0 font-display text-[34px] font-normal">
              {contact.topic}
            </h2>
          </div>
          <div
            aria-hidden="true"
            className="rotate-[-6deg] rounded-lg border-[3px] border-solid border-stamp px-3 py-1.5 font-display text-[22px] tracking-[2px] text-stamp"
          >
            {t('report.stamp')}
          </div>
        </header>

        <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] border-t-2 border-l-2 border-qsl-ink">
          {fields.map((field) => (
            <div
              key={field.key}
              className="flex flex-col gap-0.5 border-r-2 border-b-2 border-qsl-ink px-2.5 py-2"
            >
              <dt className="font-label text-[11px] tracking-[2px] text-qsl-muted">{field.key}</dt>
              <dd className="m-0 text-[16px] font-bold">{field.value}</dd>
            </div>
          ))}
        </dl>

        <section className="flex flex-col gap-3">
          <h3 className={sectionTitle}>{t('report.errors')}</h3>
          {report.errors.map((error) => (
            <div
              key={error.said}
              className="flex flex-col gap-1.5 border-l-4 border-stamp py-1 pl-3.5"
            >
              <p className="m-0 text-[15px] leading-normal text-qsl-muted">
                {t('report.said')}{' '}
                <del lang="en" className="decoration-stamp">
                  {error.said}
                </del>
              </p>
              <p className="m-0 text-[16px] leading-normal">
                <strong className="text-stamp">{t('report.better')}</strong>{' '}
                <span lang="en">{error.better}</span>
              </p>
              <p className="m-0 text-[14px] leading-normal text-qsl-body">{error.why}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
          <div className="flex flex-col gap-2">
            <h3 className={sectionTitle}>{t('report.vocabulary')}</h3>
            {report.vocabulary.map((item) => (
              <p key={item.phrase} className="m-0 text-[15px] leading-[1.45]">
                <strong lang="en">{item.phrase}</strong> — {item.meaning}
              </p>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className={sectionTitle}>{t('report.practice')}</h3>
            {report.practice.map((line) => (
              <p key={line} className="m-0 text-[15px] leading-[1.45]">
                {line}
              </p>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
};
