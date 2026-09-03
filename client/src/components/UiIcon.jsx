/**
 * UiIcon - interface icons (navigation, chat controls, status).
 * Kept separate from SafetyIcon so safety content icons and chrome icons can
 * evolve independently.
 */

const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const PATHS = {
  logo: (
    <>
      <path {...S} d="M12 2.5 3.5 6v6.2c0 4.6 3.5 8.4 8.5 9.8 5-1.4 8.5-5.2 8.5-9.8V6L12 2.5Z" />
      <path {...S} d="M12 8v5.5M9.4 10.6 12 8l2.6 2.6" />
      <circle cx="12" cy="16.6" r="1" fill="currentColor" />
    </>
  ),
  menu: (
    <>
      <path {...S} d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  close: (
    <>
      <path {...S} d="M6 6l12 12M18 6 6 18" />
    </>
  ),
  send: (
    <>
      <path {...S} d="M4 12l16-7-7 16-2.2-6.4L4 12Z" />
    </>
  ),
  mic: (
    <>
      <rect {...S} x="9" y="3" width="6" height="10" rx="3" />
      <path {...S} d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path {...S} d="M12 17.5V21M9 21h6" />
    </>
  ),
  'mic-off': (
    <>
      <path {...S} d="M9 5.5A3 3 0 0 1 15 6v4" />
      <path {...S} d="M5.5 11a6.5 6.5 0 0 0 9.7 5.6" />
      <path {...S} d="M12 17.5V21M9 21h6" />
      <path {...S} d="M4 4l16 16" />
    </>
  ),
  speaker: (
    <>
      <path {...S} d="M4 9.5h3L11 6v12l-4-3.5H4z" />
      <path {...S} d="M14.5 9.5a3.5 3.5 0 0 1 0 5" />
      <path {...S} d="M17 7a7 7 0 0 1 0 10" opacity="0.75" />
    </>
  ),
  'speaker-off': (
    <>
      <path {...S} d="M4 9.5h3L11 6v12l-4-3.5H4z" />
      <path {...S} d="m15 10 4 4M19 10l-4 4" />
    </>
  ),
  globe: (
    <>
      <circle {...S} cx="12" cy="12" r="8.5" />
      <path {...S} d="M3.5 12h17" />
      <path {...S} d="M12 3.5c2.4 2.3 3.6 5.1 3.6 8.5S14.4 18.2 12 20.5c-2.4-2.3-3.6-5.1-3.6-8.5S9.6 5.8 12 3.5Z" />
    </>
  ),
  check: (
    <>
      <path {...S} d="m5 12.5 4.5 4.5L19 7.5" />
    </>
  ),
  'chevron-down': (
    <>
      <path {...S} d="m6 9.5 6 6 6-6" />
    </>
  ),
  'chevron-right': (
    <>
      <path {...S} d="m9.5 6 6 6-6 6" />
    </>
  ),
  'arrow-right': (
    <>
      <path {...S} d="M4 12h15" />
      <path {...S} d="m14 7 5 5-5 5" />
    </>
  ),
  spark: (
    <>
      <path {...S} d="M12 3.5l1.9 4.6 4.6 1.9-4.6 1.9L12 16.5l-1.9-4.6L5.5 10l4.6-1.9L12 3.5Z" />
      <path {...S} d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" opacity="0.8" />
    </>
  ),
  trash: (
    <>
      <path {...S} d="M4.5 7h15" />
      <path {...S} d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path {...S} d="M6.5 7l.8 12A1.5 1.5 0 0 0 8.8 20.5h6.4a1.5 1.5 0 0 0 1.5-1.5l.8-12" />
      <path {...S} d="M10.5 11v6M13.5 11v6" opacity="0.7" />
    </>
  ),
  location: (
    <>
      <path {...S} d="M12 21s6.5-5.7 6.5-10.4A6.5 6.5 0 0 0 5.5 10.6C5.5 15.3 12 21 12 21Z" />
      <circle {...S} cx="12" cy="10.5" r="2.5" />
    </>
  ),
  copy: (
    <>
      <rect {...S} x="9" y="9" width="11" height="11" rx="2" />
      <path {...S} d="M15 6.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h.5" />
    </>
  ),
  wifi: (
    <>
      <path {...S} d="M3.5 9.5a13 13 0 0 1 17 0" />
      <path {...S} d="M6.5 13a9 9 0 0 1 11 0" />
      <path {...S} d="M9.5 16.5a5 5 0 0 1 5 0" />
      <circle cx="12" cy="19.5" r="1.1" fill="currentColor" />
    </>
  ),
  'wifi-off': (
    <>
      <path {...S} d="M3.5 9.5a13 13 0 0 1 6-3.2" />
      <path {...S} d="M14.5 6.4a13 13 0 0 1 6 3.1" />
      <path {...S} d="M9.5 16.5a5 5 0 0 1 5 0" />
      <circle cx="12" cy="19.5" r="1.1" fill="currentColor" />
      <path {...S} d="M3.5 3.5 20.5 20.5" />
    </>
  ),
  info: (
    <>
      <circle {...S} cx="12" cy="12" r="8.5" />
      <path {...S} d="M12 11v5.5" />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
    </>
  ),
  shield: (
    <>
      <path {...S} d="M12 3 5 5.5v5.7c0 4 2.8 7.3 7 8.8 4.2-1.5 7-4.8 7-8.8V5.5L12 3Z" />
      <path {...S} d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  download: (
    <>
      <path {...S} d="M12 4v10" />
      <path {...S} d="m7.5 10.5 4.5 4 4.5-4" />
      <path {...S} d="M4.5 19h15" />
    </>
  ),
};

export default function UiIcon({ name, size = 22, label, className = '' }) {
  const content = PATHS[name] || PATHS.info;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : 'true'}
      focusable="false"
    >
      {label ? <title>{label}</title> : null}
      {content}
    </svg>
  );
}
