#!/usr/bin/env bash
set -euo pipefail

echo "═══════════════════════════════════════════════════"
echo "  ORBIT — Master Validation Script"
echo "═══════════════════════════════════════════════════"

FAIL=0

# ─── Gate 1: TypeScript compiles ─────────────────────────────────
echo ""
echo "▸ Gate 1: TypeScript compilation"
if npx tsc --noEmit 2>&1; then
  echo "  ✅ TypeScript: PASS"
else
  echo "  ❌ TypeScript: FAIL"
  FAIL=1
fi

# ─── Gate 2: Unit tests ─────────────────────────────────────────
echo ""
echo "▸ Gate 2: Vitest unit tests"
if npx vitest run 2>&1; then
  echo "  ✅ Unit tests: PASS"
else
  echo "  ❌ Unit tests: FAIL"
  FAIL=1
fi

# ─── Gate 3: Production build ────────────────────────────────────
echo ""
echo "▸ Gate 3: Vite production build"
if npx vite build 2>&1; then
  echo "  ✅ Build: PASS"
else
  echo "  ❌ Build: FAIL"
  FAIL=1
fi

# ─── Gate 4: Bundle size ─────────────────────────────────────────
echo ""
echo "▸ Gate 4: Bundle size check (< 80KB gzipped JS)"
JS_FILE=$(ls -S dist/assets/*.js | head -1)
if [ -f "$JS_FILE" ]; then
  GZIP_SIZE=$(gzip -c "$JS_FILE" | wc -c)
  echo "  JS bundle gzipped: ${GZIP_SIZE} bytes"
  if [ "$GZIP_SIZE" -lt 81920 ]; then
    echo "  ✅ Bundle size: PASS"
  else
    echo "  ❌ Bundle size: FAIL (${GZIP_SIZE} > 81920)"
    FAIL=1
  fi
else
  echo "  ❌ Bundle size: FAIL (no JS file found in dist/assets/)"
  FAIL=1
fi

# ─── Gate 5: E2E tests ──────────────────────────────────────────
echo ""
echo "▸ Gate 5: Playwright end-to-end tests"
npx playwright install chromium --with-deps 2>&1 || true
if npx playwright test --project=chromium 2>&1; then
  echo "  ✅ E2E tests: PASS"
else
  echo "  ❌ E2E tests: FAIL"
  FAIL=1
fi

# ─── Gate 6: File structure audit ────────────────────────────────
echo ""
echo "▸ Gate 6: Required files exist"
REQUIRED_FILES=(
  "src/main.tsx"
  "src/App.tsx"
  "src/types.ts"
  "src/constants.ts"
  "src/state/reducer.ts"
  "src/state/urlCodec.ts"
  "src/audio/AudioEngine.ts"
  "src/audio/voices.ts"
  "src/components/RadialSequencer.tsx"
  "src/components/Ring.tsx"
  "src/components/Pad.tsx"
  "src/components/PlayheadArm.tsx"
  "src/components/CenterControl.tsx"
  "src/components/FaderTray.tsx"
  "src/components/DiagonalFader.tsx"
  "src/components/RandomButton.tsx"
  "src/components/RepeatButton.tsx"
  "src/components/TempoControl.tsx"
  "src/hooks/useAudioEngine.ts"
  "src/hooks/usePointerHandler.ts"
  "src/hooks/useAnimationFrame.ts"
  "src/utils/geometry.ts"
  "src/styles/global.css"
  "public/manifest.json"
  "index.html"
  "vite.config.ts"
  "vitest.config.ts"
  "playwright.config.ts"
  "scripts/validate.sh"
  "scripts/dev-validate.ts"
  ".gitignore"
  ".github/workflows/deploy.yml"
)

FILE_FAIL=0
for f in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "  ❌ Missing: $f"
    FILE_FAIL=1
  fi
done
if [ "$FILE_FAIL" -eq 0 ]; then
  echo "  ✅ File structure: PASS (all ${#REQUIRED_FILES[@]} files present)"
else
  echo "  ❌ File structure: FAIL"
  FAIL=1
fi

# ─── Gate 7: data-testid audit ───────────────────────────────────
echo ""
echo "▸ Gate 7: Required data-testid attributes in source"
REQUIRED_TESTIDS=(
  "pad-"
  "sequencer-svg"
  "center-control"
  "play-icon"
  "stop-icon"
  "random-button"
  "repeat-button"
  "fader-tray"
  "tempo-turtle"
  "tempo-rabbit"
  "tempo-dot"
)

TESTID_FAIL=0
for tid in "${REQUIRED_TESTIDS[@]}"; do
  if ! grep -r "data-testid=\"${tid}" src/ > /dev/null 2>&1; then
    # Also check for template literal form
    if ! grep -r "data-testid={\`${tid}" src/ > /dev/null 2>&1; then
      echo "  ❌ Missing data-testid: ${tid}*"
      TESTID_FAIL=1
    fi
  fi
done
if [ "$TESTID_FAIL" -eq 0 ]; then
  echo "  ✅ Test IDs: PASS"
else
  echo "  ❌ Test IDs: FAIL"
  FAIL=1
fi

# ─── Summary ─────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
if [ "$FAIL" -eq 0 ]; then
  echo "  🎉 ALL GATES PASSED"
else
  echo "  💥 ONE OR MORE GATES FAILED"
fi
echo "═══════════════════════════════════════════════════"

exit $FAIL
