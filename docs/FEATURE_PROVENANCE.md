# Feature Provenance & Attributions

**Application**: AI Disaster App (Integrated Preview Edition)  
**Host / Primary Repository**: `https://github.com/anammajid88-png/ai-disaster-app`  
**Reference Project**: `raah-disaster-intelligence` (Open-Source Research Prototype)  
**Lead Developer & Project Owner**: Anam Majid (`anammajid88@gmail.com`)  

---

## 1. Provenance Statement & Integrity

In accordance with national competition standards and hackathon ethics:
1. **Primary Project Preservation**: The student's original project, git history, brand identity, blue-white color palette, chatbot, multilingual support (English, Urdu, Hindi), emergency kit checklist, and safety guidance are the core baseline and remain intact.
2. **Attributed Intelligence Modules**: Advanced disaster intelligence capabilities (deterministic multi-hazard risk engine, Dijkstra evacuation routing, scenario simulation with A/B comparative planning, resource dispatch allocation, and 9-step judge demo) are contributed modules ported from the RAAH reference implementation.
3. **No Impersonation or Misleading Claims**: Commits accurately reflect contributor history. All contributed algorithmic models are documented with their exact limitations and domain formulas.
4. **Demonstration & Educational Scope**: The simulation and resource dispatching features are public demonstrations and academic simulations. They are explicitly not connected to live emergency 1122 or NDMA dispatch systems.

---

## 2. Inventory of Ported Modules

| Contributed Module | Source Path (RAAH) | Integrated Path (AI Disaster App) | Functionality |
| :--- | :--- | :--- | :--- |
| **Risk Engine** | `lib/risk/engine.ts` | `client/src/features/intelligence/risk/engine.ts` | Deterministic 0-100 multi-hazard risk index, factor provenance, hazard monotonicity |
| **Geodata & Graph** | `lib/geo/*` | `client/src/features/intelligence/geo/*` | Natural Earth 1:10m Pakistan boundaries, rivers, and 4,251-node routable road graph |
| **Scenario Engine** | `lib/scenario/*` | `client/src/features/intelligence/scenario/*` | Riverine, urban flood, and landslide scenario clocks, exposure models, A/B planner |
| **Live Providers** | `lib/providers/*` | `client/src/features/intelligence/providers/*` | USGS real-time seismic feed and Open-Meteo precipitation client with timeout fallbacks |
| **Copilot Explanation** | `lib/copilot/deterministic.ts` | `client/src/features/intelligence/copilot/deterministic.ts` | Rule-based explanation generation with verified domain metrics |
| **Interactive Map** | `components/map/PakMap.tsx` | `client/src/features/intelligence/components/PakMap.tsx` | D3-geo SVG renderer adapted to student blue-white theme |
| **Judge Showcase** | `app/demo/DemoClient.tsx` | `client/src/features/intelligence/presentation/JudgeDemo.jsx` | 9-step guided walkthrough highlighting community impact and intelligence features |

---

## 3. Data Source Attributions

- **Natural Earth**: 1:10m cultural boundaries, major rivers, and primary road networks (Public Domain).
- **USGS Earthquake Hazards Program**: Global real-time seismic event API (Public Domain).
- **Open-Meteo Weather API**: Meteorological and rainfall feeds under Open Database License (ODbL).
- **NDMA Pakistan**: Historical disaster records (2010 Indus Flood, 2022 Floods, 2005 Kashmir Earthquake) utilized for historical validation benchmarks.
- **Alibaba Cloud Model Studio**: Qwen conversational LLM used for natural language disaster guidance.
