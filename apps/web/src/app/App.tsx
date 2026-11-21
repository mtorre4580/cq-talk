import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router';
import { I18nProvider } from '@cq-talk/i18n';
import { LogbookPage } from '@cq-talk/logbook';
import { Layout } from './Layout';
import { logbook } from './logbook';
import { RadioPage } from './RadioPage';
import { SavedQsl } from './SavedQsl';

/** Vite's base path (`/cq-talk/` on GitHub Pages) without the trailing slash */
const BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '');

const LogbookRoute = () => {
  const navigate = useNavigate();
  return (
    <Layout glow="idle">
      <LogbookPage
        logbook={logbook}
        onBack={() => void navigate('/')}
        renderLink={(record, children, className) => (
          <Link to={`/qsl/${record.id}`} className={className}>
            {children}
          </Link>
        )}
      />
    </Layout>
  );
};

const SavedQslRoute = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  return (
    <Layout glow="report">
      <SavedQsl logbook={logbook} id={id} onBack={() => void navigate('/qsl')} />
    </Layout>
  );
};

export const App = () => (
  <I18nProvider>
    <BrowserRouter basename={BASENAME}>
      <Routes>
        <Route path="/" element={<RadioPage />} />
        <Route path="/qsl" element={<LogbookRoute />} />
        <Route path="/qsl/:id" element={<SavedQslRoute />} />
        <Route path="*" element={<RadioPage />} />
      </Routes>
    </BrowserRouter>
  </I18nProvider>
);
