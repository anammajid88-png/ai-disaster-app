/**
 * SafetyIcon - one lightweight inline SVG per icon name used in the shared
 * safety JSON (steps, emergency contacts, kit items).
 *
 * Why inline SVG: no sprite request, no icon font, scales with text, inherits
 * currentColor, and it all still works offline. Every icon is drawn from
 * scratch so nothing here is a copyrighted asset.
 *
 * Icons are decorative by default - the instruction text next to them carries
 * the meaning - so they are aria-hidden unless a label is passed.
 */

const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

/* eslint-disable react/jsx-key */
const PATHS = {
  /* ---- Movement / shelter ---------------------------------------- */
  stairs: (
    <>
      <path {...S} d="M3 20h4v-4h4v-4h4V8h4" />
      <path {...S} d="M17 4v4h-4" />
    </>
  ),
  'shelter-home': (
    <>
      <path {...S} d="M4 11 12 4l8 7" />
      <path {...S} d="M6 10v10h12V10" />
      <path {...S} d="M10 20v-5h4v5" />
    </>
  ),
  'exit-door': (
    <>
      <path {...S} d="M14 4H6v16h8" />
      <path {...S} d="M11 12h9" />
      <path {...S} d="m17 9 3 3-3 3" />
    </>
  ),
  'under-table': (
    <>
      <path {...S} d="M3 9h18" />
      <path {...S} d="M6 9v11M18 9v11" />
      <circle {...S} cx="12" cy="14" r="2" />
      <path {...S} d="M10 20c0-2 .9-3 2-3s2 1 2 3" />
    </>
  ),
  'drop-cover-hold': (
    <>
      <path {...S} d="M3 8h18" />
      <path {...S} d="M6 8v12M18 8v12" />
      <circle {...S} cx="11" cy="13" r="1.8" />
      <path {...S} d="M8 20c0-2.2 1.3-3.4 3-3.4s3 1.2 3 3.4" />
      <path {...S} d="M13 12.5 16 9" />
    </>
  ),
  'crawl-low': (
    <>
      <path {...S} d="M3 6c2 1.4 4 1.4 6 0s4-1.4 6 0 4 1.4 6 0" opacity="0.5" />
      <circle {...S} cx="7" cy="14" r="1.7" />
      <path {...S} d="M9 15h6l3 3" />
      <path {...S} d="M11 15v4M15 15v4M7 16v3" />
    </>
  ),
  'away-from-window': (
    <>
      <rect {...S} x="3" y="4" width="10" height="10" rx="1" />
      <path {...S} d="M8 4v10M3 9h10" />
      <path {...S} d="M14 17h7" />
      <path {...S} d="m18 14 3 3-3 3" />
    </>
  ),
  'stop-drop-roll': (
    <>
      <circle {...S} cx="12" cy="13" r="4.5" />
      <path {...S} d="M12 10.5v2.5l1.8 1" />
      <path {...S} d="M6 6a9 9 0 0 1 12.5.8" />
      <path {...S} d="M6 6v3.5M6 6h3.5" />
    </>
  ),
  'car-safe': (
    <>
      <path {...S} d="M4 15h13l-1.6-4.3A2 2 0 0 0 13.5 9.4H8a2 2 0 0 0-1.9 1.3L4.6 15" />
      <path {...S} d="M4 15v3h13v-3" />
      <circle {...S} cx="7" cy="18.5" r="1.4" />
      <circle {...S} cx="14" cy="18.5" r="1.4" />
      <path {...S} d="M19 5.5 21.5 7v3c0 1.7-1.1 2.8-2.5 3.3-1.4-.5-2.5-1.6-2.5-3.3V7Z" />
    </>
  ),
  'roof-secure': (
    <>
      <path {...S} d="M3 12 12 5l9 7" />
      <path {...S} d="M6 11v9h12v-9" />
      <path {...S} d="M9 11v9M15 11v9" />
      <path {...S} d="M6 15h12" />
    </>
  ),

  /* ---- Hazards ---------------------------------------------------- */
  'electric-hazard': (
    <>
      <path {...S} d="M12 3 1.8 20.5h20.4L12 3Z" />
      <path {...S} d="m13 9-3 5h3.2l-1 3.5 3.3-5H12l1-3.5Z" />
    </>
  ),
  'warning-triangle': (
    <>
      <path {...S} d="M12 3 1.8 20.5h20.4L12 3Z" />
      <path {...S} d="M12 10v4" />
      <circle cx="12" cy="17.2" r="1" fill="currentColor" />
    </>
  ),
  lightning: (
    <>
      <path {...S} d="M13.5 2 6 13h5l-1.5 9L18 10h-5.5L13.5 2Z" />
    </>
  ),
  'water-flow': (
    <>
      <path {...S} d="M2.5 9c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0" />
      <path {...S} d="M2.5 14c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0" />
      <path {...S} d="M15 19h6" />
      <path {...S} d="m18.5 16.5 2.5 2.5-2.5 2.5" />
    </>
  ),
  'wall-crack': (
    <>
      <rect {...S} x="3.5" y="4" width="17" height="16" rx="1" />
      <path {...S} d="M12 4l-2 4.5 3 2-2.5 3.5 2.5 2-1.5 4" />
    </>
  ),
  'tree-hazard': (
    <>
      <path {...S} d="M12 3.5 7.5 10h9L12 3.5Z" />
      <path {...S} d="M9 10l-2 4h10l-2-4" />
      <path {...S} d="M12 14v6" />
      <path {...S} d="M19 4v4h-4" opacity="0.7" />
    </>
  ),
  'mask-smoke': (
    <>
      <path {...S} d="M4 9c2.7-1.2 5.3-1.2 8 0s5.3 1.2 8 0" opacity="0.5" />
      <path {...S} d="M5 13c0-1.4 3.1-2.2 7-2.2s7 .8 7 2.2c0 3.4-3.1 6.2-7 6.2S5 16.4 5 13Z" />
      <path {...S} d="M2.5 13.5 5 12.7M21.5 13.5 19 12.7" />
      <path {...S} d="M9.5 14.5h5" />
    </>
  ),
  'gas-off': (
    <>
      <path {...S} d="M9.5 4h5v2.5c1.6.9 2.5 2.4 2.5 4.3V18a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-7.2c0-1.9.9-3.4 2.5-4.3V4Z" />
      <path {...S} d="M4 20 20 4" />
    </>
  ),
  'no-swim': (
    <>
      <circle {...S} cx="12" cy="12" r="9" />
      <path {...S} d="M5.6 5.6l12.8 12.8" />
      <path {...S} d="M6.5 14c1.6-1.2 3.2-1.2 4.8 0s3.2 1.2 4.8 0" />
      <circle {...S} cx="14" cy="9" r="1.3" />
    </>
  ),
  'no-entry': (
    <>
      <circle {...S} cx="12" cy="12" r="9" />
      <path {...S} d="M7 12h10" />
    </>
  ),
  'no-move-patient': (
    <>
      <circle {...S} cx="6.5" cy="10" r="1.6" />
      <path {...S} d="M8.5 11h7.5a3 3 0 0 1 3 3v1H8.5z" />
      <path {...S} d="M4 20 20 4" />
    </>
  ),

  /* ---- Action / help --------------------------------------------- */
  'phone-call': (
    <>
      <path
        {...S}
        d="M6.5 3.5h3l1.5 4-2 1.5a10 10 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z"
      />
    </>
  ),
  ambulance: (
    <>
      <path {...S} d="M2.5 16V8.5h10V16" />
      <path {...S} d="M12.5 11h3.5l3 3.2V16h-6.5z" />
      <circle {...S} cx="6.5" cy="18" r="1.6" />
      <circle {...S} cx="16.5" cy="18" r="1.6" />
      <path {...S} d="M7.5 10.5v3M6 12h3" />
    </>
  ),
  'fire-truck': (
    <>
      <path {...S} d="M2.5 16V9h9v7" />
      <path {...S} d="M11.5 11.5H16l3.5 3V16h-8z" />
      <circle {...S} cx="6.5" cy="18" r="1.6" />
      <circle {...S} cx="16.5" cy="18" r="1.6" />
      <path {...S} d="M4 6.5h9" />
      <path {...S} d="M5.5 9V6.5M11 9V6.5" />
    </>
  ),
  police: (
    <>
      <path {...S} d="M12 3 5 5.5v5.7c0 4 2.8 7.3 7 8.8 4.2-1.5 7-4.8 7-8.8V5.5L12 3Z" />
      <path {...S} d="m12 8.5 1.2 2.4 2.6.3-1.9 1.9.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.9 2.6-.3L12 8.5Z" />
    </>
  ),
  highway: (
    <>
      <path {...S} d="M9 3 4 21M15 3l5 18" />
      <path {...S} d="M12 4v3M12 10v3M12 16v3" />
    </>
  ),
  'heart-hands': (
    <>
      <path {...S} d="M12 9.2 10.8 8a2.3 2.3 0 0 0-3.3 3.3L12 15.7l4.5-4.4A2.3 2.3 0 0 0 13.2 8L12 9.2Z" />
      <path {...S} d="M4 15.5c1.6 0 2.6.6 3.5 1.6L9 19H5.5A1.5 1.5 0 0 1 4 17.5v-2Z" />
      <path {...S} d="M20 15.5c-1.6 0-2.6.6-3.5 1.6L15 19h3.5a1.5 1.5 0 0 0 1.5-1.5v-2Z" />
    </>
  ),
  'helping-hand': (
    <>
      <path {...S} d="M7 13V6.5a1.5 1.5 0 0 1 3 0V12" />
      <path {...S} d="M10 12V5.5a1.5 1.5 0 0 1 3 0V12" />
      <path {...S} d="M13 12V7.5a1.5 1.5 0 0 1 3 0V15a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5v-2l2-1" />
    </>
  ),
  extinguisher: (
    <>
      <path {...S} d="M8 8.5h6V19a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 8 19V8.5Z" />
      <path {...S} d="M9.5 8.5V6.5h3v2" />
      <path {...S} d="M12.5 5.5H16l1.5-1.5" />
      <path {...S} d="M8 12h6" />
    </>
  ),
  'first-aid': (
    <>
      <rect {...S} x="3" y="7.5" width="18" height="12" rx="2" />
      <path {...S} d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5" />
      <path {...S} d="M12 11v5M9.5 13.5h5" />
    </>
  ),
  bandage: (
    <>
      <rect {...S} x="2.5" y="9" width="19" height="6" rx="3" transform="rotate(-35 12 12)" />
      <circle cx="10.6" cy="13.4" r="0.8" fill="currentColor" />
      <circle cx="13.4" cy="10.6" r="0.8" fill="currentColor" />
      <circle cx="13.4" cy="13.4" r="0.8" fill="currentColor" />
      <circle cx="10.6" cy="10.6" r="0.8" fill="currentColor" />
    </>
  ),
  'cpr-heart': (
    <>
      <path
        {...S}
        d="M12 20s-7.5-4.4-7.5-9.4A4.1 4.1 0 0 1 12 8.2a4.1 4.1 0 0 1 7.5 2.4C19.5 15.6 12 20 12 20Z"
      />
      <path {...S} d="M7.5 13h2l1.2-2.2 1.6 4 1.2-1.8h3" />
    </>
  ),
  medicine: (
    <>
      <rect {...S} x="3" y="9" width="18" height="6" rx="3" transform="rotate(-40 12 12)" />
      <path {...S} d="m9.2 9.2 5.6 5.6" />
    </>
  ),
  whistle: (
    <>
      <path {...S} d="M14 8h5.5a1.5 1.5 0 0 1 0 3H14" />
      <circle {...S} cx="9" cy="12.5" r="4.5" />
      <path {...S} d="M9 5.5V8" />
    </>
  ),
  radio: (
    <>
      <rect {...S} x="3" y="10" width="18" height="9" rx="2" />
      <circle {...S} cx="8" cy="14.5" r="2" />
      <path {...S} d="M14 13h4M14 16h4" />
      <path {...S} d="M16 10 19 5" />
    </>
  ),
  flashlight: (
    <>
      <path {...S} d="M9 3.5h6v3.2l-1.2 1.6V20a1.5 1.5 0 0 1-1.5 1.5h-.6A1.5 1.5 0 0 1 10.2 20V8.3L9 6.7V3.5Z" />
      <path {...S} d="M17.5 5.5h2.5M17 9h2.5M17.5 12.5h2" opacity="0.7" />
    </>
  ),

  /* ---- Preparedness ---------------------------------------------- */
  'kit-bag': (
    <>
      <rect {...S} x="3" y="8" width="18" height="11" rx="2" />
      <path {...S} d="M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8" />
      <path {...S} d="M12 11v4M10 13h4" />
    </>
  ),
  'water-drop': (
    <>
      <path {...S} d="M12 3.5c3 3.7 5.5 6.4 5.5 9.4a5.5 5.5 0 0 1-11 0c0-3 2.5-5.7 5.5-9.4Z" />
    </>
  ),
  'boil-water': (
    <>
      <path {...S} d="M5 11h14v4.5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V11Z" />
      <path {...S} d="M19 12.5h1.5a1.5 1.5 0 0 1 0 3H19" />
      <path {...S} d="M9 8c0-1.2 1-1.6 1-2.8M13 8c0-1.2 1-1.6 1-2.8" opacity="0.8" />
    </>
  ),
  documents: (
    <>
      <path {...S} d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path {...S} d="M14 3.5v4h4" />
      <path {...S} d="M8.5 12h7M8.5 15.5h7" />
    </>
  ),
  food: (
    <>
      <path {...S} d="M4 12h16a8 8 0 0 1-8 7 8 8 0 0 1-8-7Z" />
      <path {...S} d="M3 20h18" />
      <path {...S} d="M10 8c0-1.2 1-1.6 1-2.8M14 8.5c0-1.2 1-1.6 1-2.8" opacity="0.8" />
    </>
  ),
  'power-bank': (
    <>
      <rect {...S} x="3" y="6.5" width="15" height="11" rx="2" />
      <path {...S} d="M21 10v4" />
      <path {...S} d="m11.5 8.5-2.5 4h2.5l-1 3 3.5-4.5h-2.5l1-2.5Z" />
    </>
  ),
  hygiene: (
    <>
      <rect {...S} x="4" y="12" width="12" height="7" rx="2" />
      <path {...S} d="M7 12c0-1.5 1-2.5 2.5-2.5" />
      <circle {...S} cx="18" cy="7" r="1.5" />
      <circle {...S} cx="14.5" cy="4.5" r="1" />
    </>
  ),
  clothing: (
    <>
      <path
        {...S}
        d="M9 4 5 6.5l1.5 4 1.5-.8V20h8V9.7l1.5.8L19 6.5 15 4a3 3 0 0 1-6 0Z"
      />
    </>
  ),
  /* Folded blanket - covers both bedding and the wet cloth used to seal a door. */
  blanket: (
    <>
      <path {...S} d="M4 7.5h16V15a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Z" />
      <path {...S} d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5" />
      <path {...S} d="M8 11.5h8" />
    </>
  ),
  checklist: (
    <>
      <rect {...S} x="4" y="4" width="16" height="17" rx="2" />
      <path {...S} d="M8 3.5h8" />
      <path {...S} d="m8 10 1.5 1.5L12.5 8.5" />
      <path {...S} d="m8 16 1.5 1.5 3-3" />
      <path {...S} d="M15 10h2M15.5 16h1.5" opacity="0.7" />
    </>
  ),
  sandbag: (
    <>
      <rect {...S} x="3" y="13.5" width="8.5" height="5.5" rx="2.5" />
      <rect {...S} x="12.5" y="13.5" width="8.5" height="5.5" rx="2.5" />
      <rect {...S} x="7.5" y="7.5" width="9" height="5.5" rx="2.5" />
    </>
  ),
  'eye-watch': (
    <>
      <path {...S} d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle {...S} cx="12" cy="12" r="2.8" />
    </>
  ),
  clock: (
    <>
      <circle {...S} cx="12" cy="12" r="8.5" />
      <path {...S} d="M12 7.5V12l3 2" />
    </>
  ),
  'hazard-lights': (
    <>
      <path {...S} d="M12 6 8 11.5h8L12 6Z" />
      <path {...S} d="M12 18l-4-5.5h8L12 18Z" />
      <path {...S} d="M3 12h2M19 12h2" opacity="0.7" />
    </>
  ),
};
/* eslint-enable react/jsx-key */

/** Names that exist, so a data typo shows a neutral marker instead of nothing. */
export const ICON_NAMES = Object.keys(PATHS);

export default function SafetyIcon({ name, size = 24, label, className = '', style }) {
  const content = PATHS[name] || PATHS['warning-triangle'];

  return (
    <svg
      className={className}
      style={style}
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
