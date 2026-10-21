import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Compass,
  Activity,
  Sliders,
  Route as RouteIcon,
  Truck,
  Map as MapIcon,
  Radio,
  BookOpen,
  Award,
} from 'lucide-react';
import { DemoNotice } from './components/primitives';
import { useLanguage } from '../../i18n/LanguageProvider';

const SUB_NAV = [
  { to: '/intelligence', key: 'intelNav.overview', defaultLabel: 'Overview', icon: Compass, end: true },
  { to: '/intelligence/risk', key: 'intelNav.risk', defaultLabel: 'Risk Index', icon: Activity },
  { to: '/intelligence/simulator', key: 'intelNav.simulator', defaultLabel: 'Simulator', icon: Sliders },
  { to: '/intelligence/evacuation', key: 'intelNav.evacuation', defaultLabel: 'Evacuation', icon: RouteIcon },
  { to: '/intelligence/resources', key: 'intelNav.resources', defaultLabel: 'Resources', icon: Truck },
  { to: '/intelligence/map', key: 'intelNav.map', defaultLabel: 'Map & Layers', icon: MapIcon },
  { to: '/intelligence/live', key: 'intelNav.live', defaultLabel: 'Live Feeds', icon: Radio },
  { to: '/intelligence/methodology', key: 'intelNav.methodology', defaultLabel: 'Methodology', icon: BookOpen },
  { to: '/intelligence/demo', key: 'intelNav.demo', defaultLabel: 'Judge Demo', icon: Award, highlight: true },
];

export default function IntelligenceLayout() {
  const { pathname } = useLocation();
  const { t } = useLanguage();

  return (
    <div className="intel-shell">
      {/* Top Banner Notice */}
      <DemoNotice />

      {/* Secondary Intelligence Navigation Bar */}
      <nav className="intel-nav" aria-label={t('nav.primary') || 'Disaster Intelligence Navigation'}>
        {SUB_NAV.map((item) => {
          const Icon = item.icon;
          const label = t(item.key) || item.defaultLabel;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? 'intel-nav__link is-active' : 'intel-nav__link'
              }
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              <Icon size={16} />
              <span>{label}</span>
              {item.highlight && <span className="intel-nav__badge">{t('intelNav.badge') || '9-Step'}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Feature Content Outlet */}
      <Outlet />
    </div>
  );
}
