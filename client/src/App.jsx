import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { DisclaimerBar, OfflineBanner } from './components/layout/Banners';
import Footer from './components/layout/Footer';
import InstallPrompt from './components/layout/InstallPrompt';
import Navbar from './components/layout/Navbar';
import { useLanguage } from './i18n/LanguageProvider';
import './App.css';

// Each route is its own chunk: the first paint only loads Home.
const Home = lazy(() => import('./pages/Home'));
const AiHelp = lazy(() => import('./pages/AiHelp'));
const Emergency = lazy(() => import('./pages/Emergency'));
const About = lazy(() => import('./pages/About'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Intelligence Feature Routes
const IntelligenceLayout = lazy(() => import('./features/intelligence/IntelligenceLayout'));
const IntelligenceHome = lazy(() => import('./features/intelligence/pages/IntelligenceHome'));
const IntelligenceRisk = lazy(() => import('./features/intelligence/pages/IntelligenceRisk'));
const IntelligenceSimulator = lazy(() => import('./features/intelligence/pages/IntelligenceSimulator'));
const IntelligenceEvacuation = lazy(() => import('./features/intelligence/pages/IntelligenceEvacuation'));
const IntelligenceResources = lazy(() => import('./features/intelligence/pages/IntelligenceResources'));
const IntelligenceMap = lazy(() => import('./features/intelligence/pages/IntelligenceMap'));
const IntelligenceLive = lazy(() => import('./features/intelligence/pages/IntelligenceLive'));
const IntelligenceMethodology = lazy(() => import('./features/intelligence/pages/IntelligenceMethodology'));
const IntelligenceDemo = lazy(() => import('./features/intelligence/pages/IntelligenceDemo'));

/** Every navigation should start at the top of the new page. */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

function RouteLoader() {
  const { t } = useLanguage();

  return (
    <div className="route-loader" role="status" aria-live="polite">
      <span className="route-loader__dot" />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
}

/** Shown only if a screen throws: still offers the way out and the numbers. */
function CrashScreen() {
  const { t } = useLanguage();

  return (
    <div className="container section crash">
      <h1>{t('errors.boundaryTitle')}</h1>
      <p>{t('errors.boundaryText')}</p>
      <button type="button" className="btn" onClick={() => window.location.reload()}>
        {t('errors.reload')}
      </button>
    </div>
  );
}

export default function App() {
  const { t } = useLanguage();

  return (
    <>
      <a className="skip-link" href="#main">
        {t('nav.skipToContent')}
      </a>

      <Navbar />
      <DisclaimerBar />
      <OfflineBanner />
      <ScrollToTop />

      <main id="main" className="app-main">
        <ErrorBoundary fallback={<CrashScreen />}>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/ai" element={<AiHelp />} />
              <Route path="/emergency" element={<Emergency />} />
              <Route path="/about" element={<About />} />

              {/* Disaster Intelligence Progressive Feature */}
              <Route path="/intelligence" element={<IntelligenceLayout />}>
                <Route index element={<IntelligenceHome />} />
                <Route path="risk" element={<IntelligenceRisk />} />
                <Route path="simulator" element={<IntelligenceSimulator />} />
                <Route path="evacuation" element={<IntelligenceEvacuation />} />
                <Route path="resources" element={<IntelligenceResources />} />
                <Route path="map" element={<IntelligenceMap />} />
                <Route path="live" element={<IntelligenceLive />} />
                <Route path="methodology" element={<IntelligenceMethodology />} />
                <Route path="demo" element={<IntelligenceDemo />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer />
      <InstallPrompt />
    </>
  );
}
