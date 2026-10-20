# Integration Architecture: AI Disaster App + Disaster Intelligence

## 1. Executive Summary

This document describes the architectural integration of advanced geospatial, risk modeling, and simulation capabilities from the reference project (**RAAH Disaster Intelligence**) into the student's primary repository (**AI Disaster App**).

### Core Design Philosophy
1. **Primary Project Continuity**: The student's repository (`https://github.com/anammajid88-png/ai-disaster-app`) remains the primary product, source of truth, and Git root.
2. **Visual & Brand Identity**: The student's established blue-and-white design tokens, brand logo, typography, and mobile-first responsive UX are strictly preserved.
3. **Incremental Feature Port**: Instead of an intrusive full-framework migration to Next.js, the integration uses an incremental feature port preserving the existing **Vite 5 + React 18 + Express 4** architecture.
4. **Safety & Provenance Integrity**: Clear boundaries separate live citizen emergency tools (`/emergency`, `/ai`) from simulation and decision-support engines (`/intelligence/*`). All external sources and donor algorithms are fully documented and attributed.

---

## 2. Technology Stack & Runtime Topology

| Layer | Original Student App | Reference Donor (RAAH) | Integrated App (Final) |
|---|---|---|---|
| **Framework** | Vite 5 + React 18 | Next.js 15 (App Router) + React 19 | **Vite 5 + React 18 (SPA)** |
| **Language** | JavaScript (ESM + JSX) | TypeScript 5 | **JavaScript + TypeScript (Dual)** |
| **Backend API** | Node.js / Express 4 | Next.js Server Actions / API Routes | **Node.js / Express 4** |
| **Styling** | Custom CSS (`tokens.css`) | Tailwind CSS + CSS Modules | **Design Tokens Bridge (`tokens.css` + `intelligence.css`)** |
| **Map Rendering** | Leaflet (basic) | Mapbox GL / D3-geo SVG | **D3-geo SVG Vector Engine (`PakMap.jsx`)** |
| **State Management** | React hooks (`useState`, `useContext`) | React hooks (`useReducer`, Context) | **React hooks (`useReducer`, Context, localStorage)** |
| **Testing** | Node.js ESM test scripts | Vitest + Playwright | **Node scripts + Vitest suite (48 tests)** |
| **Build Tooling** | Vite 5 (Rollup) | Turbopack / Webpack | **Vite 5 (with TS & `@/` alias resolution)** |

---

## 3. Directory Layout & Module Organization

The integrated codebase maintains clean separation of concerns:

```
ai-disaster-app/
├── client/
│   ├── index.html                   # HTML entry point with meta & fonts
│   ├── vite.config.js               # Vite bundler configuration with @/lib & @/data aliases
│   ├── tsconfig.json                # TypeScript compiler config for engine type safety
│   ├── vitest.config.ts             # Vitest unit test runner config
│   ├── src/
│   │   ├── App.jsx                  # Root router: preserves /, /ai, /emergency, /about; adds /intelligence/*
│   │   ├── main.jsx                 # Client entry point
│   │   ├── components/              # Shared original UI components (Navbar, Footer, etc.)
│   │   │   └── layout/
│   │   │       └── Navbar.jsx       # Navigation with added "Intelligence" item & active indicator
│   │   ├── pages/                   # Original student pages (100% preserved)
│   │   │   ├── Home.jsx             # Added "Explore Disaster Intelligence" showcase section
│   │   │   ├── AiHelp.jsx           # Multilingual Qwen + fallback assistant (preserved)
│   │   │   ├── Emergency.jsx        # Offline emergency kit & geolocation contacts (preserved)
│   │   │   └── About.jsx            # About & updated mission statement (preserved)
│   │   ├── features/intelligence/   # PORTED DOMAIN CAPABILITIES
│   │   │   ├── IntelligenceLayout.jsx # Secondary navigation tab bar & light card shell
│   │   │   ├── components/          # Domain UI primitives & map renderers
│   │   │   │   ├── primitives.jsx   # Card, MetricCard, Badge, Button, Slider, Select, AlertBox
│   │   │   │   └── PakMap.jsx       # Interactive SVG vector map of Pakistan with district layers
│   │   │   ├── pages/               # 9 Dedicated Intelligence workspaces
│   │   │   │   ├── IntelligenceHome.jsx         # Operational overview & rapid status
│   │   │   │   ├── IntelligenceRisk.jsx         # INFORM geometric risk index calculator
│   │   │   │   ├── IntelligenceSimulator.jsx    # What-if scenario modeling & parameter deltas
│   │   │   │   ├── IntelligenceEvacuation.jsx   # Road graph shortest-path routing & shelter finder
│   │   │   │   ├── IntelligenceResources.jsx    # Fleet coordination & dispatch event log
│   │   │   │   ├── IntelligenceMap.jsx          # Vector layer inspection (rivers, shelters, roads)
│   │   │   │   ├── IntelligenceLive.jsx         # Real-time USGS seismic & Open-Meteo feeds
│   │   │   │   ├── IntelligenceMethodology.jsx  # Mathematical formulas, assumptions & limits
│   │   │   │   └── IntelligenceDemo.jsx         # 9-step guided walkthrough for competition judges
│   │   │   ├── geo/                 # Pure TypeScript geospatial calculations
│   │   │   │   ├── geometry.ts      # Centroid, bounding box, Haversine distance, ray-casting
│   │   │   │   ├── graph.ts         # Dijkstra shortest-path with edge-closure avoidance
│   │   │   │   ├── data.ts          # District coordinates, geometries & shelter database
│   │   │   │   └── data/generated/  # Static GeoJSON and road network graph JSON
│   │   │   ├── risk/                # Risk engine
│   │   │   │   └── engine.ts        # INFORM model: Risk = (Hazard * Vulnerability * LackOfCop)^1/3
│   │   │   ├── scenario/            # Scenario engine
│   │   │   │   ├── types.ts         # Scenario parameter and impact types
│   │   │   │   ├── definitions.ts   # Preset disaster scenarios (Monsoon, Indus Breach, Quetta)
│   │   │   │   ├── engine.ts        # Dynamic parameter delta simulation
│   │   │   │   └── url.ts           # Shareable scenario state URL codec
│   │   │   ├── providers/           # External feed adapters
│   │   │   │   ├── types.ts         # Feed types & provider statuses
│   │   │   │   ├── usgs.ts          # USGS GeoJSON seismic parser
│   │   │   │   └── openMeteo.ts     # Open-Meteo weather API parser
│   │   │   ├── copilot/             # Explainable copilot engine
│   │   │   │   └── deterministic.ts # Grounded rule-based findings & recommendations
│   │   │   └── data/                # Reference datasets (regions, historical events, sources)
│   │   └── styles/
│   │       ├── tokens.css           # Authoritative student CSS design tokens
│   │       ├── index.css            # Base stylesheet importing tokens & intelligence bridge
│   │       └── intelligence.css     # Semantic bridge mapping RAAH variables to student tokens
│   └── tests/
│       └── unit/                    # Vitest test suite (48 tests covering all engines)
├── server/                          # Express 4 backend
│   ├── app.js                       # Express app factory (helmet, cors, routes)
│   ├── server.js                    # Server startup script (dynamic port support)
│   ├── config/env.js                # Environment config (PORT, ALIBABA_API_KEY, fallback)
│   └── routes/                      # API endpoints (/api/chat, /api/health)
├── docs/                            # Competition & technical documentation
│   ├── ORIGINAL_BASELINE.md         # Baseline verification and Git commit hashes
│   ├── FEATURE_PROVENANCE.md        # Source file provenance & attribution
│   ├── INTEGRATION_ARCHITECTURE.md  # System architecture & integration patterns (this doc)
│   ├── TEST_REPORT.md               # Complete test execution matrix & visual comparisons
│   └── JUDGE_DEMO.md                # Presenter script & step-by-step showcase guide
├── scripts/                         # Verification & test scripts
│   ├── validate-content.mjs         # Multi-lingual locale dictionary parity validator
│   ├── test-detection.mjs           # Intent & urgency classification test runner
│   └── smoke-test.mjs               # Production HTTP endpoint smoke tester
├── package.json                     # Root npm configuration with unified test scripts
├── vercel.json                      # Original production Vercel deployment configuration
└── vercel.preview.json              # Separate preview deployment configuration
```

---

## 4. Design System & CSS Token Bridge

The student app utilizes a clean, high-contrast, blue-and-white color palette defined in `client/src/styles/tokens.css`:

```css
:root {
  --color-primary: #0b5cab;       /* Trusted Pakistan Emergency Navy */
  --color-primary-dark: #06325f;  /* Deep Navy (Headings, active states) */
  --color-primary-light: #2f90e4; /* Vibrant Blue (Action states, highlights) */
  --color-accent: #e1eefc;        /* Pale Ice Blue (Badges, selected tabs) */
  --color-surface: #f5f9fd;       /* Page Canvas background */
  --color-white: #ffffff;         /* Card surfaces */
  --color-text-main: #1d2d3d;     /* High-legibility charcoal */
  --color-text-muted: #52667a;    /* Secondary text */
  --color-border: #d4e3f1;        /* Subtle blue-gray card borders */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
}
```

### The Semantic Token Bridge (`intelligence.css`)
RAAH's donor components were styled using dark-mode CSS variables (`--surface-base: #060b16`, `--border-subtle: #1e293b`). To integrate these seamlessly without visual dissonance, `client/src/styles/intelligence.css` maps every semantic slot to the student's tokens:

```css
:root {
  --surface-base: var(--color-surface);          /* #f5f9fd */
  --surface-card: var(--color-white);            /* #ffffff */
  --surface-elevated: #ffffff;
  --border-subtle: var(--color-border);          /* #d4e3f1 */
  --border-strong: var(--color-primary);         /* #0b5cab */
  --text-primary: var(--color-text-main);        /* #1d2d3d */
  --text-secondary: var(--color-text-muted);     /* #52667a */
  --primary-500: var(--color-primary);           /* #0b5cab */
  --primary-600: var(--color-primary-dark);      /* #06325f */
  --primary-50: var(--color-accent);             /* #e1eefc */
  
  /* Vector Map Colors in High-Contrast Light Theme */
  --map-land: #ebf3fa;
  --map-stroke: #b9d3ee;
  --map-stroke-selected: #0b5cab;
}
```

**Result**: All 9 intelligence modules render with identical visual DNA to the original student app—white elevated cards, crisp navy headings, subtle blue accents, and readable dark charcoal typography.

---

## 5. Domain Engines & Theoretical Models

### 5.1 INFORM Geometric Mean Risk Model (`risk/engine.ts`)
The risk index adopts the internationally recognized INFORM formulation for humanitarian disaster analysis:
$$ \text{Risk} = \sqrt[3]{\text{Hazard} \times \text{Vulnerability} \times \text{Lack of Coping Capacity}} $$
- **Hazard ($H$)**: Probability and intensity of 8 hazards (Flood, Earthquake, Drought, Cyclone, Heatwave, Landslide, GLOF, Security).
- **Vulnerability ($V$)**: Socio-economic indicators (Poverty rate, dependent population, building quality).
- **Lack of Coping Capacity ($L$)**: Healthcare density, road accessibility, emergency shelter capacity.
- **Normalization**: Scaled to 0–100 with 5 severity tiers: Very Low ($<20$), Low ($20–39$), Medium ($40–59$), High ($60–79$), Very High ($\ge 80$).

### 5.2 Dijkstra Road Network Routing (`geo/graph.ts`)
Evacuation and rescue routing executes a weighted shortest-path Dijkstra algorithm across Pakistan's major highway nodes:
- Supports real-time edge closures (e.g., simulating N-55 highway impassable during an Indus breach).
- Automatically reroutes traffic via alternate corridors (e.g., diverting through N-5 or M-5).
- Calculates travel duration assuming emergency transit speeds (50–70 km/h).

### 5.3 What-If Scenario Engine (`scenario/engine.ts`)
Enables emergency planners to benchmark baseline conditions against parameterized hazard events:
- **Rainfall Multiplier**: $1.0\times$ to $3.0\times$ baseline monsoon precipitation.
- **Breach Severity**: Simulates levee failures along the Indus River corridor.
- **Dynamic Delta**: Computes newly inundated districts, displaced population, isolated medical facilities, and required relief supplies (tents, water liters, ration packs).

---

## 6. Dual-Instance Local Development Setup

To strictly satisfy the requirement for dual independent local environments with zero port contention:

```
+-------------------------------------------------------------+
|                     OPERATING SYSTEM                        |
|                                                             |
|   [Instance 1: Original Student App]                        |
|   - Path: scratch/ai-disaster-project/original-app          |
|   - Frontend: http://localhost:5173  (Vite Dev Server)      |
|   - Backend:  http://localhost:5000  (Express API)          |
|   - Health:   http://localhost:5000/api/health              |
|                                                             |
|   [Instance 2: Integrated Preview App]                      |
|   - Path: scratch/ai-disaster-project/integrated-app        |
|   - Frontend: http://localhost:5174  (Vite Dev Server)      |
|   - Backend:  http://localhost:5001  (Express API)          |
|   - Health:   http://localhost:5001/api/health              |
|   - Environment: PORT=5001 npm run dev                      |
+-------------------------------------------------------------+
```

Both instances run concurrently without interfering with each other's state, caches, or network bindings.

---

## 7. Safety, Disclaimers, and Data Provenance

1. **Simulated vs Live Warning**:
   - The original `/emergency` and `/ai` routes are for direct citizen assistance.
   - The `/intelligence/*` workspace is strictly labeled as an **Emergency Decision Support & Simulation Sandbox**.
   - Evacuation routing displays an explicit badge: *"Coarse Graph: Not for live life-critical navigation. Consult NDMA / PDMA directives."*
2. **Deterministic Grounds vs Generative AI**:
   - All scenario assessments and risk calculations are produced by deterministic, explainable mathematical formulas.
   - Generative LLM responses (Qwen) are strictly confined to narrative summarization and citizen chat assistance.
3. **No Unauthenticated Admin Claims**:
   - The resource dispatcher is clearly presented as a local state simulation demo. No unauthenticated "admin authority" or fake backend database is simulated.
