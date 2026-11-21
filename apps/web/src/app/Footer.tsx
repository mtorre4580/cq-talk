import { Link } from 'react-router';
import { isLocale, locales, useI18n } from '@cq-talk/i18n';

const linkClass =
  'inline-flex min-h-6 cursor-pointer items-center border-0 bg-transparent p-0 font-body text-[13px] text-link underline hover:text-link-hover';

interface FooterProps {
  onOpenSettings: () => void;
}

export const Footer = ({ onOpenSettings }: FooterProps) => {
  const { t, locale, setLocale } = useI18n();

  return (
    <footer className="mt-auto flex flex-wrap items-center justify-center gap-5 text-[13px] text-night-muted">
      <span>{t('footer.free')}</span>
      <button type="button" onClick={onOpenSettings} className={linkClass}>
        {t('footer.settings')}
      </button>
      <Link to="/qsl" className={linkClass}>
        {t('footer.logbook')}
      </Link>
      <label className="flex items-center gap-2">
        <span className="sr-only">{t('footer.language')}</span>
        <select
          value={locale}
          onChange={(event) => {
            if (isLocale(event.target.value)) setLocale(event.target.value);
          }}
          className="min-h-6 cursor-pointer rounded border border-control-border bg-night px-1 font-body text-[13px] text-link hover:text-link-hover"
        >
          {locales.map((l) => (
            <option key={l.id} value={l.id} lang={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
    </footer>
  );
};
