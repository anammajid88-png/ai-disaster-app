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

const SUB_NAV = [
  { to: '/intelligence', label: 'Overview', icon: Compass, end: true },
  { to: '/intelligence/risk', label: 'Risk Index', icon: Activity },
  { to: '/intelligence/simulator', label: 'Simulator', icon: Sliders },
  { to: '/intelligence/evacuation', label: 'Evacuation', icon: RouteIcon },
  { to: '/intelligence/resources', label: 'Resources', icon: Truck },
  { to: '/intelligence/map', label: 'Map & Layers', icon: MapIcon },
  { to: '/intelligence/live', label: 'Live Feeds', icon: Radio },
  { to: '/intelligence/methodology', label: 'Methodology', icon: BookOpen },
  { to: '/intelligence/demo', label: 'Judge Demo', icon: Award, highlight: true },
];

export default function IntelligenceLayout() {
  const { pathname } = useLocation();

  return (
    <div className="intel-shell">
      {/* Top Banner Notice */}
      <DemoNotice />

      {/* Secondary Intelligence Navigation Bar */}
      <nav className="intel-nav" aria-label="Disaster Intelligence Navigation">
        {SUB_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? 'intel-nav__link is-active' : 'intel-nav__link'
              }
            >
              <Icon size={16} />
              <span>{item.label}</span>
              {item.highlight && <span className="intel-nav__badge">9-Step</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Feature Content Outlet */}
      <Outlet />
    </div>
  );
}
