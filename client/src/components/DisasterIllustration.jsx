import './DisasterIllustration.css';

/**
 * DisasterIllustration - a hand-drawn SVG scene per disaster.
 *
 * Each scene gives the disaster its own visual identity while sharing the same
 * design system (flat shapes, blue base, one accent colour from the disaster
 * JSON). Animation is ambient CSS only - no JS timers, no images, no 3D - and
 * it is switched off entirely by prefers-reduced-motion.
 *
 * viewBox is a fixed 160x100 so cards stay perfectly aligned.
 */

const Sky = () => (
  <>
    <rect x="0" y="0" width="160" height="100" fill="var(--ill-sky)" />
    <circle cx="132" cy="22" r="12" fill="var(--ill-sun)" opacity="0.5" />
  </>
);

const SCENES = {
  /* ---------------------------------------------------------------- Flood */
  flood: () => (
    <>
      <Sky />
      {/* houses */}
      <g className="ill-flood__houses">
        <path d="M28 58 46 42l18 16" fill="var(--ill-roof)" />
        <rect x="33" y="56" width="26" height="26" fill="var(--ill-wall)" />
        <rect x="41" y="63" width="10" height="9" fill="var(--ill-window)" />
        <path d="M84 52 104 34l20 18" fill="var(--ill-roof)" />
        <rect x="89" y="50" width="30" height="32" fill="var(--ill-wall)" />
        <rect x="99" y="58" width="11" height="10" fill="var(--ill-window)" />
      </g>
      {/* water layers - the back layer drifts, the front layer breathes */}
      <g className="ill-flood__water">
        <path
          className="ill-wave ill-wave--back"
          d="M-24 74c12 0 12-5 24-5s12 5 24 5 12-5 24-5 12 5 24 5 12-5 24-5 12 5 24 5 12-5 24-5v40H-24Z"
          fill="var(--accent)"
          opacity="0.35"
        />
        <path
          className="ill-wave ill-wave--front"
          d="M-24 80c12 0 12-5 24-5s12 5 24 5 12-5 24-5 12 5 24 5 12-5 24-5 12 5 24 5 12-5 24-5v30H-24Z"
          fill="var(--accent)"
          opacity="0.85"
        />
      </g>
    </>
  ),

  /* ----------------------------------------------------------------- Fire */
  fire: () => (
    <>
      <Sky />
      {/* smoke behind the building */}
      <g className="ill-fire__smoke">
        <circle className="ill-smoke ill-smoke--1" cx="58" cy="34" r="7" fill="var(--ill-smoke)" />
        <circle className="ill-smoke ill-smoke--2" cx="70" cy="26" r="9" fill="var(--ill-smoke)" />
        <circle className="ill-smoke ill-smoke--3" cx="84" cy="32" r="6" fill="var(--ill-smoke)" />
      </g>
      {/* building */}
      <rect x="46" y="40" width="46" height="42" fill="var(--ill-wall)" />
      <path d="M44 40h50l-4-8H48Z" fill="var(--ill-roof)" />
      <rect x="53" y="48" width="11" height="10" fill="var(--ill-window)" />
      <rect x="74" y="48" width="11" height="10" fill="var(--ill-window)" />
      <rect x="64" y="66" width="12" height="16" fill="var(--ill-roof)" opacity="0.8" />
      {/* flames from the lower windows */}
      <g className="ill-fire__flames">
        <path
          className="ill-flame ill-flame--1"
          d="M58 68c0-5 5-6 4-11 4 2 7 6 7 10 0 4-3 7-6 7s-5-2-5-6Z"
          fill="var(--accent)"
        />
        <path
          className="ill-flame ill-flame--2"
          d="M80 70c0-4 4-5 3-9 3 2 6 5 6 8 0 3-2 6-5 6s-4-2-4-5Z"
          fill="var(--ill-flame-2)"
        />
        <path
          className="ill-flame ill-flame--3"
          d="M40 72c0-3 3-4 3-7 3 1 5 4 5 7s-2 5-4 5-4-2-4-5Z"
          fill="var(--accent)"
        />
      </g>
      <rect x="0" y="82" width="160" height="18" fill="var(--ill-ground)" />
    </>
  ),

  /* ----------------------------------------------------------- Earthquake */
  earthquake: () => (
    <>
      <Sky />
      <g className="ill-quake">
        {/* left building with a structural crack */}
        <rect x="34" y="34" width="34" height="48" fill="var(--ill-wall)" />
        <rect x="40" y="41" width="9" height="9" fill="var(--ill-window)" />
        <rect x="54" y="41" width="9" height="9" fill="var(--ill-window)" />
        <rect x="40" y="56" width="9" height="9" fill="var(--ill-window)" />
        <rect x="54" y="56" width="9" height="9" fill="var(--ill-window)" />
        <path
          d="M51 34l-4 9 6 5-5 8 5 6-3 9"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* right building */}
        <rect x="82" y="46" width="30" height="36" fill="var(--ill-wall)" />
        <rect x="88" y="53" width="8" height="8" fill="var(--ill-window)" />
        <rect x="99" y="53" width="8" height="8" fill="var(--ill-window)" />
        <rect x="88" y="66" width="8" height="8" fill="var(--ill-window)" />
      </g>
      {/* ground and seismic waves */}
      <rect x="0" y="82" width="160" height="18" fill="var(--ill-ground)" />
      <g className="ill-quake__waves" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round">
        <path className="ill-seismic ill-seismic--1" d="M12 90c4 0 6-4 10-4s6 4 10 4" />
        <path className="ill-seismic ill-seismic--2" d="M124 90c4 0 6-4 10-4s6 4 10 4" />
      </g>
    </>
  ),

  /* ---------------------------------------------------------------- Storm */
  storm: () => (
    <>
      <Sky />
      {/* storm cloud */}
      <g>
        <ellipse cx="60" cy="36" rx="24" ry="16" fill="var(--ill-cloud)" />
        <ellipse cx="88" cy="40" rx="20" ry="13" fill="var(--ill-cloud)" />
        <ellipse cx="74" cy="30" rx="18" ry="13" fill="var(--ill-cloud-light)" />
      </g>
      {/* rain */}
      <g className="ill-storm__rain" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round">
        <path className="ill-rain ill-rain--1" d="M48 54v8" />
        <path className="ill-rain ill-rain--2" d="M62 54v8" />
        <path className="ill-rain ill-rain--3" d="M90 56v8" />
        <path className="ill-rain ill-rain--4" d="M104 56v8" />
      </g>
      {/* lightning */}
      <path
        className="ill-bolt"
        d="M76 48l-8 14h7l-4 12 13-17h-7l4-9Z"
        fill="var(--ill-bolt)"
      />
      <rect x="0" y="82" width="160" height="18" fill="var(--ill-ground)" />
    </>
  ),

  /* --------------------------------------------------------- Road accident */
  'road-accident': () => (
    <>
      <rect x="0" y="0" width="160" height="100" fill="var(--ill-sky)" />
      {/* road */}
      <path d="M0 100 44 46h72l44 54Z" fill="var(--ill-road)" />
      <g stroke="var(--ill-lane)" strokeWidth="4" strokeLinecap="round">
        <path d="M80 52v8" />
        <path d="M80 68v10" />
        <path d="M80 86v12" />
      </g>
      {/* car */}
      <g className="ill-car">
        <path d="M52 78h40l-6-13a5 5 0 0 0-4.4-2.6H62.4A5 5 0 0 0 58 65Z" fill="var(--ill-wall)" />
        <path d="M63 66h22l3.4 7H59.6Z" fill="var(--ill-window)" />
        <rect x="50" y="78" width="44" height="7" rx="2.5" fill="var(--accent)" />
        <circle cx="60" cy="87" r="4" fill="var(--ill-tyre)" />
        <circle cx="84" cy="87" r="4" fill="var(--ill-tyre)" />
      </g>
      {/* warning triangle placed behind the vehicle, as it should be */}
      <g className="ill-warn">
        <path d="M118 82 108 62l-10 20Z" fill="var(--ill-warn-fill)" stroke="var(--accent)" strokeWidth="2.5" />
        <path d="M108 69v6" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="108" cy="78.5" r="1.5" fill="var(--accent)" />
      </g>
    </>
  ),

  /* ------------------------------------------------------ Medical emergency */
  'medical-emergency': () => (
    <>
      <Sky />
      {/* heart with an ECG trace */}
      <path
        className="ill-heart"
        d="M80 80S46 62 46 42a16 16 0 0 1 34-9 16 16 0 0 1 34 9c0 20-34 38-34 38Z"
        fill="var(--accent)"
        opacity="0.9"
      />
      <path
        className="ill-ecg"
        d="M52 50h12l5-10 7 20 6-12 4 6h14"
        fill="none"
        stroke="var(--ill-ecg)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
};

export default function DisasterIllustration({ disaster, className = '' }) {
  const Scene = SCENES[disaster.illustration] || SCENES.flood;

  return (
    <svg
      className={`ill ill--${disaster.illustration} ${className}`}
      viewBox="0 0 160 100"
      preserveAspectRatio="xMidYMid slice"
      style={{ '--accent': disaster.accent, '--accent-soft': disaster.accentSoft }}
      aria-hidden="true"
      focusable="false"
    >
      <Scene />
    </svg>
  );
}
