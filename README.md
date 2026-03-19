# Dito Drum Machine

Dito is a browser-based radial drum sequencer built with React, TypeScript, and Vite.

## What You Need

- Node.js `20.x` (matches CI and GitHub Actions)
- npm `10+` (comes with modern Node releases)
- A Chromium-based browser for best local audio + Playwright parity

Check your versions:

```bash
node -v
npm -v
```

## Quick Start

1. Install dependencies:

```bash
npm ci
```

2. Start the development server (with hot module reloading):

```bash
npm run dev
```

3. Open the URL shown in your terminal (usually `http://localhost:5173`).

Vite hot reload is enabled by default, so edits in `src/` should update in the browser immediately.

## Dev Server with Hot Reloading (Example Code)

### Standard CLI command

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

### Programmatic Vite server example

If you want to boot the dev server from Node code:

```ts
import { createServer } from 'vite';

async function startDevServer() {
  const server = await createServer({
    server: {
      host: '0.0.0.0',
      port: 5173,
    },
  });

  await server.listen();
  server.printUrls();
}

startDevServer();
```

Vite enables HMR automatically in this mode.

## Common Commands

- `npm run dev`: start local dev server with HMR
- `npm run build`: type-check and build production assets into `dist/`
- `npm run preview`: serve the production build locally
- `npm run lint`: TypeScript no-emit check
- `npm run test`: run unit tests once (Vitest)
- `npm run test:watch`: run unit tests in watch mode
- `npm run test:e2e`: run Playwright end-to-end tests
- `npm run test:e2e:headed`: run Playwright E2E in headed mode
- `npm run validate`: run the full project validation script

## Testing Workflow

### Unit tests

```bash
npm run test
```

Unit tests live next to source files in `src/**/*.test.ts`.

### E2E tests

```bash
npx playwright install
npm run test:e2e
```

Notes:
- E2E config builds and serves the app with `npm run build && npm run preview`
- Playwright uses `http://localhost:4173`
- Mobile and desktop projects are both included in the Playwright config

## Project Structure

```text
src/
  audio/         Web Audio engine and voice generation
  components/    UI controls and radial sequencer rendering
  hooks/         React hooks for animation, audio, and pointer handling
  state/         Reducer + URL encoding/decoding state sync
  styles/        Global styles
  utils/         Shared geometry and utility helpers
tests/e2e/       Playwright browser tests
scripts/         Validation scripts
```

## Development Notes

- URL state sync is implemented in `src/state/urlCodec.ts` so layout/pattern can be shared via URL.
- Audio initialization is user-gesture gated (browser policy), so transport starts after first interaction.
- Path alias `@` points to `src/` (configured in `vite.config.ts` and `vitest.config.ts`).
- Vite PWA plugin is enabled; app manifest is supplied via `public/manifest.json`.

## Build and Deployment

- Production build:

```bash
npm run build
```

- Local production preview:

```bash
npm run preview
```

GitHub Actions deploys `dist/` to GitHub Pages on pushes to `main` using Node 20.

## Troubleshooting

- If Playwright fails on a new machine, run `npx playwright install`.
- If audio seems silent, click/tap the interface first to unlock the audio context.
- If the dev server port is busy, run:

```bash
npm run dev -- --port 5174
```
