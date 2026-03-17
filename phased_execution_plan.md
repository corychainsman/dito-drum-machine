# Orbit — Phased Execution Plan

**Companion to:** Orbit PRD v2 (Agent-Buildable Edition)  
**Purpose:** Break the full build into 5 independent agent sessions. Each phase produces a deployable, testable, end-user-usable artifact.  
**Last Updated:** 2026-03-17

-----

## How to Use This Document

You are an AI coding agent. This document tells you exactly what to build in **this session**. Follow these rules:

1. **Read the PRD first.** The companion document `Orbit_PRD_v2_Agent_Buildable.md` contains all specifications, code, constants, types, and test definitions. This document tells you *which parts* to build now.
1. **Check the entry condition.** If the project directory already exists, verify the prior phase’s exit condition before starting.
1. **Build only what’s listed in your phase.** Don’t skip ahead.
1. **Run the validation gate at the end.** Every phase has a bash script you run. If it exits 0, you’re done. If it doesn’t, fix until it does.
1. **Leave a phase marker.** After passing validation, write a `.phase-complete` file so the next session knows where you left off.

-----

## Phase Detection (Run This First)

At the start of every session, run this to determine which phase to execute:

```bash
#!/usr/bin/env bash
# Detect current phase
if [ ! -d "orbit" ]; then
  echo "PHASE=1"
elif [ -f "orbit/.phase-1-complete" ] && [ ! -f "orbit/.phase-2-complete" ]; then
  echo "PHASE=2"
elif [ -f "orbit/.phase-2-complete" ] && [ ! -f "orbit/.phase-3-complete" ]; then
  echo "PHASE=3"
elif [ -f "orbit/.phase-3-complete" ] && [ ! -f "orbit/.phase-4-complete" ]; then
  echo "PHASE=4"
elif [ -f "orbit/.phase-4-complete" ] && [ ! -f "orbit/.phase-5-complete" ]; then
  echo "PHASE=5"
elif [ -f "orbit/.phase-5-complete" ]; then
  echo "ALL PHASES COMPLETE"
else
  echo "PHASE=1"
fi
```

-----

# PHASE 1: Visual Sequencer + URL State

## What the User Gets

A beautiful dark-themed radial grid of 40 colored arc pads (5 rings × 8 steps). The user can tap pads to toggle them on/off. The pattern is encoded in the URL in real time — copy the URL, paste it somewhere else, open it, and the exact same pattern appears. No sound yet, no playhead, but the core visual toy is immediately satisfying to poke at.

## Entry Condition

No `orbit/` directory exists.

## Scope

|Build                                                                      |Skip                                                                   |
|---------------------------------------------------------------------------|-----------------------------------------------------------------------|
|Project scaffold (all config files, package.json, tsconfig, vite, vitest)  |Audio engine, voices, sample generation                                |
|`src/constants.ts` — all constants                                         |Playhead rotation / animation                                          |
|`src/types.ts` — all types                                                 |Faders, random, repeat, tempo controls                                 |
|`src/utils/geometry.ts` — arc generation + hit testing                     |Responsive breakpoints (single layout is fine)                         |
|`src/state/reducer.ts` — full reducer with all actions                     |Service worker / PWA                                                   |
|`src/state/urlCodec.ts` — URL serialization                                |Haptics                                                                |
|`src/components/RadialSequencer.tsx` — SVG container                       |`PlayheadArm.tsx` (create as empty stub only)                          |
|`src/components/Ring.tsx` — renders 8 pads                                 |`FaderTray.tsx`, `DiagonalFader.tsx` (stubs only)                      |
|`src/components/Pad.tsx` — arc-segment path with armed/off states          |`RandomButton.tsx`, `RepeatButton.tsx`, `TempoControl.tsx` (stubs only)|
|`src/components/CenterControl.tsx` — play/stop icon (visual only, no audio)|`useAudioEngine.ts`, `useAnimationFrame.ts`                            |
|`src/hooks/usePointerHandler.ts` — touch/click → pad toggle                |`scripts/dev-validate.ts`                                              |
|`src/styles/global.css` — body resets, dark background                     |                                                                       |
|`src/App.tsx` — reducer + URL sync + layout                                |                                                                       |
|`src/main.tsx` — React root mount                                          |                                                                       |
|`index.html` with correct meta tags                                        |                                                                       |
|All unit tests for geometry, reducer, URL codec                            |                                                                       |
|Playwright e2e tests for pads + URL state                                  |                                                                       |
|`scripts/validate.sh` (phase 1 version)                                    |                                                                       |

## Files to Create (Exact List)

```
orbit/
├── .github/
│   └── workflows/
│       └── deploy.yml                  ← PRD Section 12b (exact — GitHub Pages deployment)
├── index.html                          ← PRD Section 10.2 (exact)
├── package.json                        ← PRD Section 4 (exact, install deps)
├── tsconfig.json                       ← PRD Section 4 (exact)
├── vite.config.ts                      ← PRD Section 4 (exact)
├── vitest.config.ts                    ← PRD Section 16 (exact)
├── playwright.config.ts                ← PRD Section 15 (exact)
├── .gitignore                          ← node_modules/, dist/, .validation-status.json, .phase-*-complete
├── public/
│   └── manifest.json                   ← PRD Section 12 (exact, icons can 404 for now)
├── src/
│   ├── main.tsx                        ← Standard React 18 createRoot mount
│   ├── App.tsx                         ← useReducer + URL sync effect + layout
│   ├── types.ts                        ← PRD Section 7 (exact)
│   ├── constants.ts                    ← PRD Section 6 (exact)
│   ├── state/
│   │   ├── reducer.ts                  ← PRD Section 9.1 (exact)
│   │   ├── urlCodec.ts                 ← PRD Section 9.2 (exact)
│   │   └── reducer.test.ts             ← PRD Section 9.3 (all reducer + URL tests)
│   ├── components/
│   │   ├── RadialSequencer.tsx          ← PRD Section 22.2 (SVG structure)
│   │   ├── Ring.tsx                     ← Renders 8 <Pad> per ring
│   │   ├── Pad.tsx                      ← PRD Section 22.5 (pad states)
│   │   ├── CenterControl.tsx            ← PRD Section 8.7 (play/stop icon, dispatches PLAY/STOP)
│   │   ├── PlayheadArm.tsx              ← STUB: renders nothing (or static line at 12 o'clock)
│   │   ├── FaderTray.tsx                ← STUB: renders empty <div data-testid="fader-tray" />
│   │   ├── DiagonalFader.tsx            ← STUB: empty component
│   │   ├── RandomButton.tsx             ← STUB: renders <button data-testid="random-button" /> with dice icon, dispatches RANDOMIZE
│   │   ├── RepeatButton.tsx             ← STUB: renders <button data-testid="repeat-button" />
│   │   ├── TempoControl.tsx             ← STUB: renders turtle + dot + rabbit with data-testids, dispatches SET_BPM
│   │   └── icons/
│   │       ├── PlayIcon.tsx             ← PRD Section 8.7
│   │       ├── StopIcon.tsx             ← PRD Section 8.7
│   │       ├── DiceIcon.tsx             ← PRD Section 8.4
│   │       ├── LoopIcon.tsx             ← PRD Section 8.5
│   │       ├── TurtleIcon.tsx           ← PRD Section 8.6
│   │       └── RabbitIcon.tsx           ← PRD Section 8.6
│   ├── hooks/
│   │   ├── usePointerHandler.ts         ← PRD Section 8.1 (touch interaction)
│   │   ├── useAudioEngine.ts            ← STUB: export function useAudioEngine() { return { init: () => {}, start: () => {}, stop: () => {} }; }
│   │   └── useAnimationFrame.ts         ← STUB: export function useAnimationFrame() { return 0; }
│   ├── audio/
│   │   ├── AudioEngine.ts              ← STUB: empty class with init/start/stop methods that do nothing
│   │   └── voices.ts                   ← STUB: 5 empty functions with correct signatures
│   ├── utils/
│   │   ├── geometry.ts                  ← PRD Section 8.1 (exact: arcPath, generateAllArcs, hitTest)
│   │   ├── geometry.test.ts             ← PRD Section 8.1 (all 8 geometry tests)
│   │   ├── urlCodec.test.ts             ← PRD Section 9.3 (URL round-trip tests)
│   │   └── parameterCurves.ts           ← STUB: export mapParam function (PRD Section 8.2 voices.ts)
│   ├── styles/
│   │   └── global.css                   ← PRD Section 10.1 (exact)
│   └── sw.ts                            ← STUB: empty file
├── tests/
│   └── e2e/
│       ├── pads.spec.ts                 ← PRD Section 14.1 (exact)
│       ├── url-state.spec.ts            ← PRD Section 14.2 (exact)
│       ├── transport.spec.ts            ← STUB: single test that page loads
│       ├── faders.spec.ts               ← STUB: single test that page loads
│       ├── random.spec.ts               ← PRD Section 14.4 (exact — randomize already works via reducer)
│       └── responsive.spec.ts           ← STUB: single test that page loads
└── scripts/
    └── validate.sh                      ← PRD Section 17 (exact)
```

## Implementation Notes

**Stub components:** Every stub must still render its `data-testid` attribute so the file structure audit in `validate.sh` passes. Example:

```tsx
// FaderTray.tsx (stub)
export default function FaderTray() {
  return <div data-testid="fader-tray" />;
}
```

**RandomButton stub should be functional**, not just a visual stub — it dispatches `RANDOMIZE` to the reducer, which already handles it. Same for `TempoControl` — the turtle/rabbit buttons should dispatch `SET_BPM`. These work even without audio because they modify the pattern/BPM which is reflected in pad colors and URL state.

**CenterControl dispatches PLAY/STOP** to toggle the transport state, which changes the icon. No audio plays yet, but the icon switches correctly.

**URL sync effect in App.tsx** (PRD Section 9.3): Only sync on `pattern`, `faders`, and `bpm` changes. Use `replaceState`, not `pushState`.

**Layout:** For Phase 1, a simple single-column centered layout is sufficient. Don’t implement the responsive breakpoints yet. The sequencer should size itself with:

```css
.sequencer-container {
  width: min(85vw, 85vh - 100px);
  height: min(85vw, 85vh - 100px);
  max-width: 500px;
  max-height: 500px;
}
```

## Validation Gate

Create and run this script. All checks must pass.

```bash
#!/usr/bin/env bash
# scripts/validate-phase1.sh
set -euo pipefail
cd orbit

echo "═══ PHASE 1 VALIDATION ═══"
FAIL=0

echo "▸ Gate 1: npm install"
npm install 2>&1 || { echo "❌ npm install failed"; FAIL=1; }

echo "▸ Gate 2: TypeScript compiles"
npx tsc --noEmit 2>&1 || { echo "❌ tsc failed"; FAIL=1; }

echo "▸ Gate 3: Unit tests pass"
npx vitest run 2>&1 || { echo "❌ vitest failed"; FAIL=1; }

echo "▸ Gate 4: Production build succeeds"
npx vite build 2>&1 || { echo "❌ vite build failed"; FAIL=1; }

echo "▸ Gate 5: Bundle size < 80KB gzip"
JS_FILE=$(ls -S dist/assets/*.js 2>/dev/null | head -1)
if [ -n "$JS_FILE" ]; then
  GZIP_SIZE=$(gzip -c "$JS_FILE" | wc -c)
  [ "$GZIP_SIZE" -lt 81920 ] || { echo "❌ Bundle too large: ${GZIP_SIZE}"; FAIL=1; }
  echo "  Bundle: ${GZIP_SIZE} bytes gzipped"
else
  echo "❌ No JS bundle found"; FAIL=1
fi

echo "▸ Gate 6: Playwright e2e (pads + URL state + random)"
npx playwright install chromium --with-deps 2>&1 || true
npx playwright test --project=chromium tests/e2e/pads.spec.ts tests/e2e/url-state.spec.ts tests/e2e/random.spec.ts 2>&1 || { echo "❌ e2e failed"; FAIL=1; }

echo "▸ Gate 7: Required files exist"
for f in src/constants.ts src/types.ts src/utils/geometry.ts src/state/reducer.ts \
         src/state/urlCodec.ts src/components/RadialSequencer.tsx src/components/Pad.tsx \
         src/components/Ring.tsx src/components/CenterControl.tsx src/hooks/usePointerHandler.ts \
         src/styles/global.css src/App.tsx src/main.tsx .github/workflows/deploy.yml; do
  [ -f "$f" ] || { echo "❌ Missing: $f"; FAIL=1; }
done

echo "▸ Gate 8: data-testid audit"
for tid in "pad-" "sequencer-svg" "center-control" "play-icon" "stop-icon" \
           "random-button" "repeat-button" "fader-tray" "tempo-turtle" "tempo-rabbit" "tempo-dot"; do
  grep -r "data-testid" src/ | grep -q "$tid" || { echo "❌ Missing testid: $tid"; FAIL=1; }
done

echo "▸ Gate 9: GitHub Pages config"
grep -q 'base.*\.\/' vite.config.ts || { echo "❌ vite.config.ts missing base: './'"; FAIL=1; }
grep -q 'deploy-pages' .github/workflows/deploy.yml || { echo "❌ deploy.yml missing deploy-pages action"; FAIL=1; }

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "🎉 PHASE 1 PASSED"
  touch .phase-1-complete
else
  echo "💥 PHASE 1 FAILED"
  exit 1
fi
```

## Exit Condition

- `orbit/.phase-1-complete` exists
- `npm run build` succeeds
- Visiting `http://localhost:4173` shows the radial grid
- Clicking pads toggles their color
- URL updates on every pad toggle
- Reloading the URL restores the pattern
- Random button randomizes the pattern
- Turtle/rabbit buttons change BPM (visible in URL, no audible effect yet)

-----

# PHASE 2: Audio Engine + Playhead

## What the User Gets

Press the center play button and **hear music**. The 5 drum voices (kick, snare, hi-hat, clap, tom) play in the pattern the user arranged. A glowing playhead sweeps around the circle in time with the beat. Tap stop, silence. Tap play again, it loops. This is the “it’s a real instrument” moment.

## Entry Condition

`orbit/.phase-1-complete` exists. Run `cd orbit && npm run build` to confirm prior phase still compiles.

## Scope

|Build                                                          |Skip                                |
|---------------------------------------------------------------|------------------------------------|
|`src/audio/AudioEngine.ts` — full implementation               |Faders (stubs remain)               |
|`src/audio/voices.ts` — all 5 voice trigger functions          |RandomButton upgrade (already works)|
|Sample generation via `OfflineAudioContext`                    |RepeatButton (stutter logic)        |
|`src/hooks/useAudioEngine.ts` — React hook wrapping AudioEngine|Responsive layout                   |
|`src/hooks/useAnimationFrame.ts` — rAF playhead driver         |PWA / service worker                |
|`src/components/PlayheadArm.tsx` — full rotating playhead      |Haptics                             |
|Pad “triggering” state (glow when playhead crosses armed pad)  |Fader drawer behavior               |
|Audio unit tests (`mapParam`, sample generation)               |                                    |
|Playwright transport test (play icon → stop icon)              |                                    |

## Files to Create or Replace

```
src/audio/AudioEngine.ts               ← Replace stub. Full implementation per PRD Section 8.2.
                                          - init(): create AudioContext, generate samples, setup visibility
                                          - start(): begin scheduler loop
                                          - stop(): clear scheduler
                                          - Scheduler reads state via getter callbacks
                                          - Uses SCHEDULER_LOOKAHEAD_MS and SCHEDULER_AHEAD_S from constants

src/audio/voices.ts                    ← Replace stub. All 5 voice functions per PRD Section 8.2.
                                          - triggerKick(ctx, time, fader)
                                          - triggerSnare(ctx, time, fader)
                                          - triggerHihat(ctx, time, fader)
                                          - triggerClap(ctx, time, fader, sampleBuffers)
                                          - triggerTom(ctx, time, fader, sampleBuffers)
                                          - mapParam(fader, range) utility function

src/audio/sampleGeneration.ts          ← NEW. generateSamples() per PRD Section 8.2.
                                          - Clap: 3 overlapping noise bursts via OfflineAudioContext
                                          - Tom attack: short filtered noise transient
                                          Returns Map<string, AudioBuffer>

src/audio/audio.test.ts                ← NEW. mapParam tests per PRD Section 8.2 validation.
                                          Skip OfflineAudioContext tests if jsdom doesn't support it.

src/hooks/useAudioEngine.ts            ← Replace stub. Full implementation.
                                          - Holds AudioEngine instance in useRef
                                          - Exposes init(), start(getters), stop()
                                          - Passes getter callbacks: () => stateRef.current.bpm, etc.
                                          - Uses useRef for state to avoid stale closures in scheduler

src/hooks/useAnimationFrame.ts         ← Replace stub. Full implementation per PRD Section 8.1 playhead.
                                          - Returns current angle (0–360)
                                          - Reads audioCtx.currentTime on every rAF
                                          - Computes: angle = ((elapsed % loopDuration) / loopDuration) * 360
                                          - Only runs when transport === 'playing'

src/components/PlayheadArm.tsx         ← Replace stub. Full SVG line with rotation per PRD Section 22.2.
                                          - <line> from center to beyond outermost ring
                                          - style={{ transform: rotate(angle), transformOrigin: center }}
                                          - filter: url(#playhead-glow)
                                          - Only visible when transport === 'playing'

src/components/Pad.tsx                 ← MODIFY. Add "triggering" state.
                                          - New prop: `triggering: boolean`
                                          - When triggering: full opacity + glow filter + scale(1.05)
                                          - Derive from: armed && currentStep === step && transport === 'playing'

src/App.tsx                            ← MODIFY. Wire up audio engine.
                                          - Call audioEngine.init() on first interaction
                                          - Call audioEngine.start() on PLAY
                                          - Call audioEngine.stop() on STOP
                                          - Pass playhead angle to PlayheadArm
                                          - Pass currentStep to rings for triggering state
                                          - Maintain stateRef for scheduler getter callbacks

tests/e2e/transport.spec.ts           ← Replace stub. Full test per PRD Section 14.3.
                                          - Click center control → icon changes to stop
                                          - Click again → icon changes to play
```

## Implementation Notes

**AudioContext initialization:** The AudioEngine.init() MUST be called inside a pointerdown/click handler. Wire it to the `onFirstInteraction` callback in `usePointerHandler`, or to the CenterControl’s click handler — whichever fires first. Both should work:

```typescript
// In App.tsx
const audioEngineRef = useRef<AudioEngine | null>(null);
const initAudio = useCallback(async () => {
  if (!audioEngineRef.current) {
    const engine = new AudioEngine();
    await engine.init();
    audioEngineRef.current = engine;
  }
}, []);
```

**Scheduler ↔ React state bridge:** The scheduler runs on a setTimeout loop outside React’s render cycle. It must read the latest state without re-creating the scheduler. Solution: store state in a `useRef` that’s updated via `useEffect`:

```typescript
const stateRef = useRef(state);
useEffect(() => { stateRef.current = state; }, [state]);

// Pass getters to the scheduler:
audioEngine.start(
  () => stateRef.current.bpm,
  () => stateRef.current.pattern,
  () => stateRef.current.faders,
  () => stateRef.current.repeatActive,
  (step) => dispatch({ type: 'ADVANCE_STEP' })  // NOT used — see note below
);
```

**IMPORTANT: Do NOT dispatch ADVANCE_STEP from the scheduler.** The scheduler tracks `currentStep` internally. Instead, expose the scheduler’s internal step via a callback or shared ref so the UI can read it. Dispatching on every step (8×/beat at 200BPM = 26 dispatches/sec) causes unnecessary React re-renders. Instead:

```typescript
// In useAudioEngine, expose currentStep via ref:
const currentStepRef = useRef(0);
// Scheduler updates: currentStepRef.current = step;
// PlayheadArm reads from this ref (not from reducer state)
// Pad triggering state also reads from this ref via a rAF-driven state update
```

Alternatively, batch step updates: use the rAF loop (which already runs for the playhead) to sample the scheduler’s current step once per frame and set a local React state, limiting re-renders to 60/sec max.

**Fader values:** The scheduler reads faders via getter callback. Phase 1 set all faders to 0.5 (default). The voices will use default parameter values. This is correct — faders don’t need to be functional yet.

## Validation Gate

```bash
#!/usr/bin/env bash
# scripts/validate-phase2.sh
set -euo pipefail
cd orbit

echo "═══ PHASE 2 VALIDATION ═══"
FAIL=0

echo "▸ Gate 1: TypeScript compiles"
npx tsc --noEmit 2>&1 || { echo "❌ tsc"; FAIL=1; }

echo "▸ Gate 2: Unit tests (including new audio tests)"
npx vitest run 2>&1 || { echo "❌ vitest"; FAIL=1; }

echo "▸ Gate 3: Production build"
npx vite build 2>&1 || { echo "❌ build"; FAIL=1; }

echo "▸ Gate 4: Playwright — pads + url-state + transport + random"
npx playwright install chromium --with-deps 2>&1 || true
npx playwright test --project=chromium \
  tests/e2e/pads.spec.ts \
  tests/e2e/url-state.spec.ts \
  tests/e2e/transport.spec.ts \
  tests/e2e/random.spec.ts \
  2>&1 || { echo "❌ e2e"; FAIL=1; }

echo "▸ Gate 5: AudioEngine class has required methods"
grep -q "async init" src/audio/AudioEngine.ts || { echo "❌ Missing init()"; FAIL=1; }
grep -q "start(" src/audio/AudioEngine.ts || { echo "❌ Missing start()"; FAIL=1; }
grep -q "stop(" src/audio/AudioEngine.ts || { echo "❌ Missing stop()"; FAIL=1; }

echo "▸ Gate 6: All 5 voice trigger functions exist"
for v in triggerKick triggerSnare triggerHihat triggerClap triggerTom; do
  grep -q "export function $v" src/audio/voices.ts || { echo "❌ Missing $v"; FAIL=1; }
done

echo "▸ Gate 7: PlayheadArm renders a line element"
grep -q "<line" src/components/PlayheadArm.tsx || { echo "❌ No <line> in PlayheadArm"; FAIL=1; }

echo "▸ Gate 8: Audio test file exists and has tests"
[ -f "src/audio/audio.test.ts" ] || { echo "❌ Missing audio.test.ts"; FAIL=1; }

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "🎉 PHASE 2 PASSED"
  touch .phase-2-complete
else
  echo "💥 PHASE 2 FAILED"
  exit 1
fi
```

## Exit Condition

- `orbit/.phase-2-complete` exists
- Open in browser → click center play → hear drums loop
- Playhead rotates smoothly around the circle
- Active pads glow when the playhead crosses them
- Click stop → silence, playhead resets to 12 o’clock
- Toggle pads while playing → pattern changes immediately
- All prior tests still pass (pads, URL state, random)

-----

# PHASE 3: Faders + Random Polish + Repeat + Tempo

## What the User Gets

The complete creative toolkit. Drag diagonal faders to change how each drum sounds (pitch, decay, brightness). The random button now has a satisfying shake animation. Hold the repeat button to stutter the current beat. Tap the turtle to slow down or the rabbit to speed up, with a pulsing dot that beats in time. Fader positions are saved in the URL too.

## Entry Condition

`orbit/.phase-2-complete` exists. Run `cd orbit && npx vitest run && npx tsc --noEmit` to confirm.

## Scope

|Build                                                                     |Skip                           |
|--------------------------------------------------------------------------|-------------------------------|
|`DiagonalFader.tsx` — full interactive fader                              |Responsive breakpoints         |
|`FaderTray.tsx` — container with 5 faders (simple vertical layout for now)|Bottom drawer slide-up on phone|
|`RepeatButton.tsx` — momentary hold with pointer capture                  |PWA / service worker           |
|`TempoControl.tsx` — upgrade from stub to full turtle/rabbit/dot          |Haptics                        |
|`RandomButton.tsx` — add shake animation                                  |Accessibility (ARIA)           |
|Wire fader values into audio engine voice parameters                      |Visual polish animations       |
|Wire repeat flag into scheduler stutter logic                             |                               |
|Playwright faders test                                                    |                               |
|URL now encodes fader positions                                           |                               |

## Files to Create or Replace

```
src/components/DiagonalFader.tsx       ← Replace stub. Full implementation per PRD Section 8.3.
                                          - SVG track line + active fill + circle thumb
                                          - Rotated -45deg via CSS transform
                                          - pointerdown → capture → pointermove → update → pointerup → release
                                          - Dispatches SET_FADER on drag
                                          - data-testid="fader-{ring}"

src/components/FaderTray.tsx           ← Replace stub. Container rendering 5 DiagonalFaders.
                                          - Simple vertical stack for now (responsive drawer comes in Phase 4)
                                          - data-testid="fader-tray"
                                          - Wraps in a styled container with subtle background

src/components/RepeatButton.tsx        ← Replace stub. Full momentary button per PRD Section 8.5.
                                          - LoopIcon inside button
                                          - pointerdown → dispatch SET_REPEAT active: true + capture
                                          - pointerup/cancel/leave → dispatch SET_REPEAT active: false
                                          - Visual: opacity pulses while held
                                          - data-testid="repeat-button"

src/components/RandomButton.tsx        ← MODIFY. Add shake animation per PRD Section 8.4.
                                          - Already dispatches RANDOMIZE (from Phase 1)
                                          - Add CSS @keyframes shake, trigger on click for 300ms
                                          - DiceIcon already renders

src/components/TempoControl.tsx        ← Replace stub. Full implementation per PRD Section 8.6.
                                          - TurtleIcon button: dispatches SET_BPM -10
                                          - RabbitIcon button: dispatches SET_BPM +10
                                          - Pulsing dot between them (CSS animation, duration = 60/bpm seconds)
                                          - Bounce animation on button press

src/audio/AudioEngine.ts               ← MODIFY. Add repeat/stutter logic to scheduler.
                                          - When getRepeatActive() returns true:
                                            - Don't advance currentStep
                                            - Schedule at secondsPerStep / REPEAT_SUBDIVISION interval
                                          - When repeat is released, resume normal advancement

src/utils/parameterCurves.ts           ← Replace stub with the mapParam function.
                                          (May already be in voices.ts — deduplicate if so.
                                           The canonical location is voices.ts per PRD.
                                           parameterCurves.ts can re-export from voices.ts.)

tests/e2e/faders.spec.ts              ← Replace stub. Tests:
                                          - Fader elements are visible (5 faders with correct testids)
                                          - Dragging a fader changes the URL `f` parameter
                                          - Page loads with fader state from URL

tests/e2e/random.spec.ts              ← MODIFY if needed. Should already work from Phase 1.
                                          Ensure shake animation class is applied (check for CSS class).
```

## Implementation Notes

**Fader → Audio parameter wiring:** The scheduler already reads `getFaders()` on every step. The `triggerVoice` function in AudioEngine should call the appropriate voice function with the fader value:

```typescript
private triggerVoice(ring: number, time: number, faderValue: number): void {
  const voices = [triggerKick, triggerSnare, triggerHihat, triggerClap, triggerTom];
  const voice = voices[ring];
  if (ring === 3 || ring === 4) {
    // Clap and Tom need sample buffers
    voice(this.ctx!, time, faderValue, this.sampleBuffers);
  } else {
    voice(this.ctx!, time, faderValue);
  }
}
```

**Repeat stutter:** The key behavioral detail — when repeat is active, the scheduler’s `currentStep` does NOT advance. It re-triggers the same step at `secondsPerStep / 4` intervals. The playhead should freeze visually (stop rotating) and pulse. Simplest implementation: when `repeatActive`, the `useAnimationFrame` hook stops updating the angle.

**Fader drawer (simple version):** In Phase 3, render faders in a simple always-visible panel below the action row. The collapsible bottom drawer with swipe gestures comes in Phase 4. This keeps Phase 3 focused on functionality.

## Validation Gate

```bash
#!/usr/bin/env bash
# scripts/validate-phase3.sh
set -euo pipefail
cd orbit

echo "═══ PHASE 3 VALIDATION ═══"
FAIL=0

echo "▸ Gate 1: TypeScript"
npx tsc --noEmit 2>&1 || { echo "❌"; FAIL=1; }

echo "▸ Gate 2: Unit tests"
npx vitest run 2>&1 || { echo "❌"; FAIL=1; }

echo "▸ Gate 3: Build"
npx vite build 2>&1 || { echo "❌"; FAIL=1; }

echo "▸ Gate 4: E2E — all test files"
npx playwright install chromium --with-deps 2>&1 || true
npx playwright test --project=chromium 2>&1 || { echo "❌"; FAIL=1; }

echo "▸ Gate 5: Fader components exist and are not stubs"
grep -q "pointerdown\|onPointerDown" src/components/DiagonalFader.tsx || { echo "❌ DiagonalFader has no pointer handler"; FAIL=1; }
grep -q "DiagonalFader" src/components/FaderTray.tsx || { echo "❌ FaderTray doesn't use DiagonalFader"; FAIL=1; }

echo "▸ Gate 6: RepeatButton has pointer capture logic"
grep -q "setPointerCapture\|Capture" src/components/RepeatButton.tsx || { echo "❌ RepeatButton missing capture"; FAIL=1; }

echo "▸ Gate 7: Repeat logic in scheduler"
grep -q "repeatActive\|repeat\|REPEAT_SUBDIVISION" src/audio/AudioEngine.ts || { echo "❌ No repeat logic in AudioEngine"; FAIL=1; }

echo "▸ Gate 8: Fader URL parameter round-trips"
# Check that urlCodec handles fader values
grep -q "faders" src/state/urlCodec.ts || { echo "❌ urlCodec missing faders"; FAIL=1; }

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "🎉 PHASE 3 PASSED"
  touch .phase-3-complete
else
  echo "💥 PHASE 3 FAILED"
  exit 1
fi
```

## Exit Condition

- `orbit/.phase-3-complete` exists
- Dragging a fader audibly changes the drum sound in real time
- Random button shakes on press and produces a new pattern
- Holding the repeat button stutters the current step
- Turtle/rabbit change the speed, pulsing dot matches tempo
- URL includes fader positions — sharing URL preserves fader state
- All prior tests still pass

-----

# PHASE 4: Mobile-First Responsive + Touch Optimization

## What the User Gets

The app works beautifully on a phone held in one hand. The sequencer fills the screen. Faders hide in a smooth bottom drawer that slides up with a swipe. On a tablet, the layout splits into two columns. No more browser zoom/scroll interference — 10 fingers can mash the screen and every tap registers. Safe area insets handle the notch. It feels like a native app.

## Entry Condition

`orbit/.phase-3-complete` exists.

## Scope

|Build                                                                            |Skip                     |
|---------------------------------------------------------------------------------|-------------------------|
|Responsive CSS breakpoints (phone / tablet portrait / tablet landscape)          |PWA icons                |
|Fader bottom drawer with swipe expand/collapse (phone)                           |Service worker caching   |
|Side panel layout for faders (tablet)                                            |Haptics                  |
|Touch hardening: all `touch-action: none`, `overscroll-behavior`, pointer capture|Reduced motion (Phase 5) |
|Safe area insets for notched devices                                             |ARIA attributes (Phase 5)|
|SVG sizing per breakpoint                                                        |                         |
|Playwright responsive tests                                                      |                         |

## Files to Create or Modify

```
src/styles/global.css                  ← MODIFY. Add responsive breakpoints per PRD Section 10.3.
                                          - .app-container: column on phone, row on tablet
                                          - .sequencer-container: 85vw phone, 60vw tablet, max 500px
                                          - @media (min-width: 768px) for tablet layout
                                          - Ensure ALL touch-prevention CSS from PRD Section 10.1

src/components/FaderTray.tsx           ← MODIFY. Add bottom drawer behavior per PRD Section 22.7.
                                          - On < 768px: collapsed (60px peek bar with 5 color dots)
                                          - Tap or swipe up to expand (200px, shows 5 faders)
                                          - Transition: 300ms cubic-bezier(0.16, 1, 0.3, 1)
                                          - On ≥ 768px: always visible as side panel (200px wide)
                                          - Use CSS media query + React state for drawer open/closed

src/App.tsx                            ← MODIFY. Layout structure to support responsive modes.
                                          - Wrap sequencer + action row in .main-area div
                                          - FaderTray positioned at bottom (phone) or right (tablet)

src/components/RadialSequencer.tsx     ← MODIFY if needed. Ensure the SVG container uses the
                                          .sequencer-container class with correct sizing CSS.

tests/e2e/responsive.spec.ts          ← Replace stub. Full tests per PRD Section 22.9.
                                          - Phone (375×667): sequencer 290–340px wide, square, fader at bottom
                                          - Tablet landscape (1024×768): two-column layout
                                          - All 40 pads visible and non-overlapping
                                          - Center control inside sequencer bounds
```

## Implementation Notes

**Fader drawer state management:** Use local React state (`useState`), not the reducer — drawer open/closed is UI state, not app state, and should NOT be in the URL.

```tsx
const [drawerOpen, setDrawerOpen] = useState(false);
const isTablet = useMediaQuery('(min-width: 768px)');
// On tablet, ignore drawer state — always show faders
```

**Media query hook:**

```typescript
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}
```

**Drawer swipe detection:** Track `pointerdown` y-position on the peek bar. If `pointermove` deltaY < -20px, expand. If deltaY > 20px, collapse. Use pointer capture to ensure the gesture completes even if the finger moves off the bar.

**Touch hardening checklist** — verify ALL of these are present:

|Property                           |Element                   |Verified by                |
|-----------------------------------|--------------------------|---------------------------|
|`touch-action: none`               |CSS on `html, body, #root`|grep in global.css         |
|`touch-action="none"`              |HTML attribute on `<svg>` |grep in RadialSequencer.tsx|
|`overscroll-behavior: none`        |CSS on `html, body`       |grep in global.css         |
|`overscroll-behavior-y: contain`   |CSS on `html`             |grep in global.css         |
|`user-select: none`                |CSS on `*` or `#root`     |grep in global.css         |
|`-webkit-user-select: none`        |CSS on `*` or `#root`     |grep in global.css         |
|`-webkit-touch-callout: none`      |CSS on `*`                |grep in global.css         |
|`position: fixed; inset: 0`        |CSS on `#root`            |grep in global.css         |
|`oncontextmenu="return false"`     |HTML on `<body>`          |grep in index.html         |
|`maximum-scale=1, user-scalable=no`|`<meta viewport>`         |grep in index.html         |
|`viewport-fit=cover`               |`<meta viewport>`         |grep in index.html         |
|`env(safe-area-inset-*)`           |CSS on `#root` padding    |grep in global.css         |

## Validation Gate

```bash
#!/usr/bin/env bash
# scripts/validate-phase4.sh
set -euo pipefail
cd orbit

echo "═══ PHASE 4 VALIDATION ═══"
FAIL=0

echo "▸ Gate 1: TypeScript"
npx tsc --noEmit 2>&1 || { echo "❌"; FAIL=1; }

echo "▸ Gate 2: Unit tests"
npx vitest run 2>&1 || { echo "❌"; FAIL=1; }

echo "▸ Gate 3: Build"
npx vite build 2>&1 || { echo "❌"; FAIL=1; }

echo "▸ Gate 4: E2E — ALL test files including responsive"
npx playwright install chromium --with-deps 2>&1 || true
npx playwright test --project=chromium 2>&1 || { echo "❌"; FAIL=1; }

echo "▸ Gate 5: Touch hardening CSS"
for pattern in "touch-action" "overscroll-behavior" "user-select" "webkit-touch-callout" \
               "position: fixed\|position:fixed"; do
  grep -q "$pattern" src/styles/global.css || { echo "❌ Missing CSS: $pattern"; FAIL=1; }
done

echo "▸ Gate 6: Touch hardening HTML"
grep -q "maximum-scale=1" index.html || { echo "❌ Missing maximum-scale"; FAIL=1; }
grep -q "user-scalable=no" index.html || { echo "❌ Missing user-scalable=no"; FAIL=1; }
grep -q "viewport-fit=cover" index.html || { echo "❌ Missing viewport-fit"; FAIL=1; }
grep -q "oncontextmenu" index.html || { echo "❌ Missing oncontextmenu"; FAIL=1; }

echo "▸ Gate 7: Safe area insets"
grep -q "safe-area-inset" src/styles/global.css || { echo "❌ Missing safe-area-inset"; FAIL=1; }

echo "▸ Gate 8: Responsive breakpoint exists"
grep -q "min-width: 768px\|min-width:768px" src/styles/global.css || \
grep -q "min-width: 768px\|min-width:768px" src/App.tsx || \
grep -q "min-width: 768px\|min-width:768px" src/components/FaderTray.tsx || \
  { echo "❌ No 768px breakpoint found"; FAIL=1; }

echo "▸ Gate 9: Drawer behavior in FaderTray"
grep -q "translateY\|drawer\|expand\|collapse" src/components/FaderTray.tsx || { echo "❌ No drawer logic in FaderTray"; FAIL=1; }

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "🎉 PHASE 4 PASSED"
  touch .phase-4-complete
else
  echo "💥 PHASE 4 FAILED"
  exit 1
fi
```

## Exit Condition

- `orbit/.phase-4-complete` exists
- On phone viewport (375×667): sequencer fills screen, faders in collapsible drawer
- On tablet viewport (1024×768): two-column layout with faders visible on the right
- No browser zoom/scroll when multitouch-mashing the screen
- Fader drawer animates smoothly on open/close
- All prior tests still pass + new responsive tests pass

-----

# PHASE 5: PWA + Animations + Haptics + Accessibility

## What the User Gets

The finished, polished product. Add to home screen and it launches like a native app with an icon. Pads pulse with a glow when the playhead hits them. Buttons give tactile vibration feedback on tap. The random button shakes with a satisfying wobble. The app respects reduced-motion preferences. Screen readers can navigate the pad grid. Everything works offline.

## Entry Condition

`orbit/.phase-5-complete` does NOT exist. `orbit/.phase-4-complete` exists.

## Scope

|Build                                            |Skip|
|-------------------------------------------------|----|
|Service worker (Workbox via vite-plugin-pwa)     |—   |
|PWA icons (generated or placeholder)             |    |
|Haptic feedback on pad tap, random, repeat       |    |
|Pad trigger glow animation (CSS transitions)     |    |
|Button press animations (scale bounce)           |    |
|Pulsing dot animation synced to BPM              |    |
|`prefers-reduced-motion` support                 |    |
|ARIA labels on all pads, roles on SVG            |    |
|Hot-reload validation watcher (`dev-validate.ts`)|    |
|Full `validate.sh` (master script from PRD)      |    |
|`.gitignore`                                     |    |
|Final end-to-end validation of all tests         |    |

## Files to Create or Modify

```
src/sw.ts                              ← Replace stub. Minimal Workbox service worker.
                                          import { precacheAndRoute } from 'workbox-precaching';
                                          precacheAndRoute(self.__WB_MANIFEST);

public/icons/icon-192.png             ← Generate or create placeholder.
public/icons/icon-512.png             ← Generate or create placeholder.
                                          Use a Node script with sharp/canvas, or a simple
                                          shell command if ImageMagick is available.
                                          Fallback: create 1x1 pixel PNGs (app still works).

src/components/Pad.tsx                 ← MODIFY. Add CSS transitions for all state changes.
                                          - transition: opacity 120ms ease-out, filter 80ms ease-out
                                          - triggering: add scale(1.05) with 80ms ease-out
                                          - .pad.triggering class with glow filter

src/components/RandomButton.tsx        ← MODIFY if shake animation wasn't completed in Phase 3.
                                          Ensure @keyframes shake is defined and applied.

src/components/RepeatButton.tsx        ← MODIFY. Add opacity pulse animation while held.
                                          @keyframes hold-pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }

src/components/TempoControl.tsx        ← MODIFY if needed. Ensure:
                                          - Pulsing dot animationDuration = 60/bpm + 's'
                                          - Button bounce on press: transform scale(0.85) 80ms

src/components/CenterControl.tsx       ← MODIFY. Add pulsing glow on the center circle when playing.
                                          Sync pulse to beat via CSS animation-duration.

src/hooks/usePointerHandler.ts         ← MODIFY. Add haptic feedback:
                                          if (hit && navigator.vibrate) navigator.vibrate(10);

src/components/RandomButton.tsx        ← MODIFY. Add haptic:
                                          navigator.vibrate?.([30, 20, 30, 20, 30]);

src/components/RepeatButton.tsx        ← MODIFY. Add haptic on each repeat trigger.
                                          (This requires a callback from the scheduler — may be
                                           too complex. Simpler: vibrate on initial press only.)

src/components/Pad.tsx                 ← MODIFY. Add ARIA attributes per PRD Section 11:
                                          - role="switch"
                                          - aria-checked={armed}
                                          - aria-label={`${VOICE_NAMES[ring]}, step ${step + 1}, ${armed ? 'on' : 'off'}`}

src/components/RadialSequencer.tsx     ← MODIFY. Add ARIA attributes per PRD Section 11:
                                          - role="grid"
                                          - aria-label="Drum pattern editor"

src/styles/global.css                  ← MODIFY. Add reduced-motion media query:
                                          @media (prefers-reduced-motion: reduce) {
                                            *, *::before, *::after {
                                              animation-duration: 0.01ms !important;
                                              transition-duration: 0.01ms !important;
                                            }
                                          }

scripts/dev-validate.ts                ← NEW. Full hot-reload watcher per PRD Section 23.
scripts/validate.sh                    ← REPLACE with full master script per PRD Section 17.
.gitignore                             ← MODIFY. Ensure includes:
                                          node_modules/, dist/, .validation-status.json, .phase-*-complete
```

## Implementation Notes

**Service worker:** The `vite-plugin-pwa` handles most of the work. The key config is already in `vite.config.ts` from Phase 1. The `src/sw.ts` file just needs the Workbox precache call. Registration is handled by the plugin automatically.

**Icon generation strategy (in order of preference):**

1. If `sharp` npm package installs: Create a Node script that generates a dark circle with 5 colored concentric arcs.
1. If ImageMagick is available: `convert -size 192x192 xc:'#1A1A2E' ...`
1. Fallback: Create minimal valid PNGs programmatically (a single pixel stretched):

```bash
# Create a minimal 192x192 PNG with Node.js without any dependencies
node -e "
const fs = require('fs');
// Minimal 192x192 solid color PNG (generated via raw IHDR+IDAT)
// ... (the agent can use a PNG library or just create an SVG and convert)
"
```

1. Last resort: Skip icons entirely. The PWA manifest will show a default icon. The app fully works.

**Haptics:** Gate all vibration calls behind `if (navigator.vibrate)`. iOS Safari does NOT support the Vibration API, so this is Android/Chrome-only. This is fine — it’s a progressive enhancement.

**Reduced motion:** The media query should zero out animation/transition durations for decorative effects but NOT affect the playhead position update (which is driven by JavaScript, not CSS animation). The playhead continues to show the correct position — it just won’t have a glow effect.

**dev-validate.ts dependencies:** Install `chokidar`, `ws`, `@types/ws`, `tsx`, `concurrently` per PRD Section 23.3. Add the `dev:validate` and `dev:full` scripts to package.json.

## Validation Gate (FINAL)

This is the comprehensive master validation from the PRD, extended for Phase 5:

```bash
#!/usr/bin/env bash
# scripts/validate-phase5.sh
set -euo pipefail
cd orbit

echo "══════════════════════════════════════════════════════"
echo "  ORBIT — FINAL VALIDATION (Phase 5)"
echo "══════════════════════════════════════════════════════"
FAIL=0

echo "▸ Gate 1: TypeScript"
npx tsc --noEmit 2>&1 || { echo "❌ tsc"; FAIL=1; }

echo "▸ Gate 2: Unit tests"
npx vitest run 2>&1 || { echo "❌ vitest"; FAIL=1; }

echo "▸ Gate 3: Production build"
npx vite build 2>&1 || { echo "❌ build"; FAIL=1; }

echo "▸ Gate 4: Bundle size"
JS_FILE=$(ls -S dist/assets/*.js 2>/dev/null | head -1)
if [ -n "$JS_FILE" ]; then
  GZIP_SIZE=$(gzip -c "$JS_FILE" | wc -c)
  [ "$GZIP_SIZE" -lt 81920 ] || { echo "❌ Bundle: ${GZIP_SIZE} > 80KB"; FAIL=1; }
  echo "  Bundle: ${GZIP_SIZE} bytes gzipped ✓"
fi

echo "▸ Gate 5: E2E — ALL tests, ALL projects"
npx playwright install chromium --with-deps 2>&1 || true
npx playwright test --project=chromium 2>&1 || { echo "❌ e2e chromium"; FAIL=1; }

echo "▸ Gate 6: All required files"
REQUIRED=(
  src/main.tsx src/App.tsx src/types.ts src/constants.ts
  src/state/reducer.ts src/state/urlCodec.ts
  src/audio/AudioEngine.ts src/audio/voices.ts
  src/components/RadialSequencer.tsx src/components/Ring.tsx src/components/Pad.tsx
  src/components/PlayheadArm.tsx src/components/CenterControl.tsx
  src/components/FaderTray.tsx src/components/DiagonalFader.tsx
  src/components/RandomButton.tsx src/components/RepeatButton.tsx
  src/components/TempoControl.tsx
  src/hooks/useAudioEngine.ts src/hooks/usePointerHandler.ts src/hooks/useAnimationFrame.ts
  src/utils/geometry.ts src/styles/global.css
  public/manifest.json index.html
  vite.config.ts vitest.config.ts playwright.config.ts
  scripts/validate.sh scripts/dev-validate.ts .gitignore
  .github/workflows/deploy.yml
)
for f in "${REQUIRED[@]}"; do
  [ -f "$f" ] || { echo "❌ Missing: $f"; FAIL=1; }
done

echo "▸ Gate 7: All data-testids present"
for tid in "pad-" "sequencer-svg" "center-control" "play-icon" "stop-icon" \
           "random-button" "repeat-button" "fader-tray" "fader-" \
           "tempo-turtle" "tempo-rabbit" "tempo-dot"; do
  grep -r "data-testid" src/ | grep -q "$tid" || { echo "❌ Missing testid: $tid"; FAIL=1; }
done

echo "▸ Gate 8: ARIA attributes"
grep -q 'role="switch"\|role=.switch.' src/components/Pad.tsx || { echo "❌ Missing role=switch on Pad"; FAIL=1; }
grep -q "aria-label" src/components/Pad.tsx || { echo "❌ Missing aria-label on Pad"; FAIL=1; }
grep -q 'role="grid"\|role=.grid.' src/components/RadialSequencer.tsx || { echo "❌ Missing role=grid"; FAIL=1; }

echo "▸ Gate 9: Reduced motion support"
grep -q "prefers-reduced-motion" src/styles/global.css || { echo "❌ Missing reduced-motion"; FAIL=1; }

echo "▸ Gate 10: Haptic feedback"
grep -rq "navigator.vibrate" src/ || { echo "❌ No haptic calls found"; FAIL=1; }

echo "▸ Gate 11: Service worker file"
grep -q "precacheAndRoute\|precache" src/sw.ts || { echo "❌ sw.ts missing precache"; FAIL=1; }

echo "▸ Gate 12: PWA manifest valid"
node -e "const m=JSON.parse(require('fs').readFileSync('public/manifest.json','utf8')); \
  if(!m.name||!m.icons||m.icons.length<1) process.exit(1);" 2>&1 || { echo "❌ Invalid manifest"; FAIL=1; }

echo "▸ Gate 13: Touch hardening complete"
for pattern in "touch-action" "overscroll-behavior" "user-select" "safe-area-inset" \
               "webkit-touch-callout"; do
  grep -q "$pattern" src/styles/global.css || { echo "❌ Missing: $pattern"; FAIL=1; }
done
grep -q "maximum-scale=1" index.html || { echo "❌ Missing maximum-scale"; FAIL=1; }
grep -q "oncontextmenu" index.html || { echo "❌ Missing oncontextmenu"; FAIL=1; }

echo "▸ Gate 14: All 5 voice functions non-stub"
for v in triggerKick triggerSnare triggerHihat triggerClap triggerTom; do
  # Check function body has more than just a return/empty
  LINES=$(grep -A 5 "export function $v" src/audio/voices.ts | wc -l)
  [ "$LINES" -gt 3 ] || { echo "❌ $v appears to be a stub"; FAIL=1; }
done

echo "▸ Gate 15: Hot-reload watcher exists"
[ -f "scripts/dev-validate.ts" ] || { echo "❌ Missing dev-validate.ts"; FAIL=1; }
grep -q "chokidar\|watch" scripts/dev-validate.ts || { echo "❌ dev-validate.ts has no watcher"; FAIL=1; }

echo "▸ Gate 16: GitHub Pages deployment"
grep -q 'base.*\.\/' vite.config.ts || { echo "❌ vite.config.ts missing base: './'"; FAIL=1; }
grep -q 'deploy-pages' .github/workflows/deploy.yml || { echo "❌ deploy.yml missing deploy action"; FAIL=1; }
grep -q 'vite build' .github/workflows/deploy.yml || { echo "❌ deploy.yml missing build step"; FAIL=1; }

echo ""
echo "══════════════════════════════════════════════════════"
if [ "$FAIL" -eq 0 ]; then
  echo "  🎉 ALL 15 GATES PASSED — ORBIT IS COMPLETE"
  touch .phase-5-complete
else
  echo "  💥 FINAL VALIDATION FAILED"
  exit 1
fi
echo "══════════════════════════════════════════════════════"
```

## Exit Condition

- `orbit/.phase-5-complete` exists
- All 15 validation gates pass
- App loads offline after first visit (service worker active)
- Pads glow and pulse when triggered
- Buttons animate on press
- Phone vibrates on pad tap (Android only)
- `prefers-reduced-motion: reduce` disables decorative animations
- Screen reader can navigate pad grid with ARIA labels
- `npm run dev:full` starts both dev server and hot-reload validation watcher
- The URL `/?p=5544ff0000&f=88888&t=100` produces a playable four-on-the-floor pattern

-----

## Phase Summary

|Phase|Session Focus                     |User Value After                                 |Files Created/Modified|Validation Gates|
|-----|----------------------------------|-------------------------------------------------|---------------------:|:--------------:|
|**1**|Scaffold + Visual Grid + URL State|Tap colorful pads, share patterns via URL        |~35 files             |8               |
|**2**|Audio Engine + Playhead           |Press play → hear music, see playhead rotate     |~8 files              |8               |
|**3**|Faders + Random + Repeat + Tempo  |Full creative control over sound and rhythm      |~8 files              |8               |
|**4**|Responsive + Mobile Touch         |Beautiful on any phone or tablet, 10-finger safe |~5 files              |9               |
|**5**|PWA + Animations + Haptics + A11y |Polished, installable, accessible native-feel app|~12 files             |15              |

**Total across all phases:** 48 validation gates, ~68 file operations, 0 human decisions required.

-----

## Appendix: Agent Session Prompt Template

Copy this template and paste it at the start of each agent session, filling in the phase number:

```
I need you to build Phase {N} of the Orbit project — a radial drum machine for kids.

Here are the two reference documents:
1. [Attach: Orbit_PRD_v2_Agent_Buildable.md] — Full technical specification
2. [Attach: Orbit_Phased_Execution_Plan.md] — This phased plan (you are on Phase {N})

Instructions:
- Read the Phase {N} section of the execution plan carefully.
- Read the relevant PRD sections referenced in that phase.
- Check the entry condition. If prior phase files exist, verify they still compile.
- Build exactly what's listed in the phase scope. Nothing more.
- Run the phase validation gate script at the end.
- Fix any failures until the validation exits 0.
- Write the .phase-{N}-complete marker file.

The visual reference artifact (orbit_visual_reference.jsx) shows the exact expected UI.

Begin.
```
