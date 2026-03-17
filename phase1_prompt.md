I need you to build Phase 1 of the Orbit project — a radial drum machine for kids.

You have three reference documents attached:

1. **Orbit_PRD_v2_Agent_Buildable.md** — The complete technical specification. Contains every constant, type definition, algorithm, SVG structure, CSS rule, and test case you need. When the execution plan references “PRD Section X”, look it up in this document.
1. **Orbit_Phased_Execution_Plan.md** — The phased build plan. You are executing **Phase 1: Visual Sequencer + URL State**. Read the Phase 1 section carefully — it tells you exactly which files to create, which to stub, and what the validation gate checks.
1. **orbit_visual_reference.jsx** — A React artifact showing the exact expected visual output at all breakpoints. Render this in your head or in a browser to understand the target aesthetic: dark navy background, 5 concentric rings of colored arc-segment pads, white playhead line, circular icon buttons.

## Your mission

Build Phase 1 from scratch. There is no existing code. You are creating the `orbit/` project directory and everything in it.

## What Phase 1 produces

A deployable web app where:

- A beautiful dark-themed radial grid of 40 colored arc pads (5 rings × 8 steps) fills the screen
- Tapping any pad toggles it on (colored) or off (gray)
- The entire pattern is encoded in the URL in real time — every tap updates the URL
- Copy the URL, open it in another tab, and the exact same pattern appears
- The Random button (dice icon) randomizes the pattern
- The Turtle/Rabbit buttons change the BPM (reflected in URL, no sound yet)
- The center Play/Stop button toggles its icon (no audio yet)
- No sound, no playhead animation — those come in Phase 2
- A GitHub Actions workflow is ready to deploy to GitHub Pages on push to `main`

## How to execute

1. Read the Phase 1 section of the execution plan. It lists every file to create with exact PRD section references.
1. Start by creating the project scaffold: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `index.html` — all specified exactly in PRD Sections 4, 10.2, 15, 16. Also create `.github/workflows/deploy.yml` per PRD Section 12b — this is the GitHub Actions workflow that builds and deploys to GitHub Pages on every push to `main`.
1. Run `npm install`.
1. Create `src/constants.ts` (PRD Section 6 — copy exactly), `src/types.ts` (PRD Section 7 — copy exactly).
1. Create `src/utils/geometry.ts` with `arcPath`, `generateAllArcs`, `hitTest` (PRD Section 8.1 — full code provided).
1. Create `src/state/reducer.ts` and `src/state/urlCodec.ts` (PRD Sections 9.1, 9.2 — full code provided).
1. Create all unit tests: `geometry.test.ts`, `reducer.test.ts`, `urlCodec.test.ts` (PRD Sections 8.1 validation, 9.3 — full test code provided).
1. Create components: `RadialSequencer.tsx`, `Ring.tsx`, `Pad.tsx`, `CenterControl.tsx`, all icon components, plus stubs for `PlayheadArm`, `FaderTray`, `DiagonalFader`, `RepeatButton`. Make `RandomButton` and `TempoControl` functional (they dispatch actions to the reducer).
1. Create `usePointerHandler.ts` hook for touch/click → pad toggle.
1. Create `App.tsx` with `useReducer` + URL sync effect.
1. Create `src/styles/global.css`, `src/main.tsx`.
1. Create Playwright e2e tests: `pads.spec.ts`, `url-state.spec.ts`, `random.spec.ts` (PRD Section 14 — full test code provided). Create stubs for the remaining test files.
1. Create `scripts/validate.sh`.

## Critical rules

- **Every component with user interaction MUST have a `data-testid` attribute.** The full list is in PRD Section 19. The validation gate checks for these.
- **Stub components must still render their `data-testid`.** Example: `FaderTray` stub renders `<div data-testid="fader-tray" />`.
- **The SVG element MUST have `touch-action: none` as both a CSS property AND an HTML attribute.**
- **URL sync uses `replaceState`, NOT `pushState`.** Dependency array: `[state.pattern, state.faders, state.bpm]` only.
- **Use TypeScript strict mode.** Zero `any` types. All code must pass `tsc --noEmit`.
- **PAD_GAP_DEG** is used in geometry.ts but defined in constants.ts — make sure it’s imported.
- **`vite.config.ts` must have `base: './'`** for GitHub Pages compatibility. All asset paths must be relative, not absolute. This is already specified in the PRD’s vite.config.ts — copy it exactly.
- **`public/manifest.json` uses relative paths** (`"./"` not `"/"`). Copy from PRD Section 12 exactly.
- **Create `.github/workflows/deploy.yml`** per PRD Section 12b. The workflow runs tsc, vitest, and vite build before deploying the `dist/` folder to GitHub Pages.

## Validation

After building everything, run the Phase 1 validation script (defined in the execution plan). It checks:

1. `npm install` succeeds
1. `tsc --noEmit` exits 0
1. `vitest run` exits 0
1. `vite build` exits 0
1. Gzipped JS bundle < 80KB
1. Playwright e2e tests pass (pads, URL state, random)
1. All required files exist (including `.github/workflows/deploy.yml`)
1. All required `data-testid` attributes are present in source
1. GitHub Pages config: `base: './'` in vite.config.ts, `deploy-pages` action in deploy.yml

Fix any failures until the validation exits 0, then create the marker file: `touch .phase-1-complete`

Begin.
