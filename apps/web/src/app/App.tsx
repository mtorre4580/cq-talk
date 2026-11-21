import { I18nProvider, useI18n } from '@cq-talk/i18n';
import { Layout } from './Layout';

const Screen = () => {
  const { t } = useI18n();
  return (
    <Layout glow="idle">
      {/* The rig's brand plate becomes the visible heading in PR 3 */}
      <h1 className="sr-only">{t('app.name')}</h1>
    </Layout>
  );
};

export const App = () => (
  <I18nProvider>
    <Screen />
  </I18nProvider>
);
