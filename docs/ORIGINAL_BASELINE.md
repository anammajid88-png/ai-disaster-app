# Original Project Baseline Report

**Project**: AI Disaster App  
**Primary Repository**: `https://github.com/anammajid88-png/ai-disaster-app`  
**Owner & Author**: Anam Majid (`anammajid88@gmail.com`)  
**Baseline Git Commit**: `1bb4f318646f617307d618df8196d234ada891d1`  
**Verification Date**: October 21, 2026  
**Presentation Venue**: Islamabad Final Round  

---

## 1. System Architecture Baseline

- **Frontend Runtime**: React 18.3.1 with React Router DOM 6.26.2
- **Frontend Build Tool**: Vite 5.4.8 (Rollup bundling, ES modules)
- **Styling Architecture**: Semantic CSS tokens with BEM-style modular CSS:
  - `--color-primary`: `#0b5cab` (Main brand blue)
  - `--color-primary-dark`: `#06325f` (Deep navy)
  - `--color-primary-light`: `#2f90e4` (Vibrant action blue)
  - `--color-primary-subtle`: `#e1eefc` (Pale blue surface)
  - `--color-surface`: `#ffffff` (White card container)
  - `--color-page-bg`: `#f5f9fd` (Crisp page background)
  - `--color-text`: `#102a43`
  - `--color-text-muted`: `#486581`
- **Backend API**: Express 4.19.2 with Node.js (`server/server.js`)
  - Middleware: `helmet`, `cors`, `compression`, custom rate limiting (`express-rate-limit` semantics)
  - AI Integration: Alibaba Cloud Model Studio (Qwen-plus) with offline/fallback local guidance engine
- **PWA & Offline**: Custom service worker precaching offline safety guidance and static assets

---

## 2. Baseline Test Execution Results

```
Locale parity
  PASS  ur.json defines every English key
  PASS  ur.json has no orphan keys
  PASS  hi.json defines every English key
  PASS  hi.json has no orphan keys

Translation keys used in the UI
  PASS  all 119 literal t() keys resolve

Keys built from data at runtime
  PASS  all 22 data-driven keys resolve

Safety data
  PASS  6 disaster categories found
  PASS  disaster content checked in all three languages

Icons referenced by data
  PASS  all 50 data icons exist

Emergency contacts and kit
  PASS  contacts and kit checked in all three languages

No content problems found

Detection test suite:
  PASS  English phrasing (10/10)
  PASS  Roman Urdu (6/6)
  PASS  Urdu script (4/4)
  PASS  Hindi script (5/5)
  PASS  Short stems precision tests (3/3)
  PASS  Urgency classification (5/5)
  PASS  Empty input edge cases (2/2)

Build verification:
  vite build completed in 3.64s
  dist/assets created cleanly (90 modules transformed)
```

---

## 3. Route Baseline Matrix

| Route | Primary Purpose | State Management | Multilingual Support |
| :--- | :--- | :--- | :--- |
| `/` | Landing page, emergency banner, category quick links, AI CTA | React State | English, Urdu, Hindi |
| `/ai` | Multilingual Qwen chatbot with emergency intent classifier & speech synth/mic | React State + Local fallback | English, Urdu, Hindi |
| `/emergency` | Interactive emergency contacts, checklist persistence, location consent | LocalStorage + Geolocation API | English, Urdu, Hindi |
| `/about` | Project mission, safety disclaimers, methodology | Static content | English, Urdu, Hindi |

---

## 4. Visual Baseline Evidence

Screenshots captured from pristine original application on port 5173:
- Desktop (1440x900): `screenshots/baseline/desktop_home.png`, `desktop_ai.png`, `desktop_emergency.png`, `desktop_about.png`
- Mobile (390x844): `screenshots/baseline/mobile_home.png`, `mobile_ai.png`, `mobile_emergency.png`, `mobile_about.png`
