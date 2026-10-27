# Quizzy

- **Before committing:** `npm run check` runs typecheck, lint and unit tests. It is green; keep it green.
- **Before any browser or Playwright work:** read `~/.pi/agent/projects-memory/Quizzy/MEMORY.md` first. It records the two traps that otherwise cost an afternoon: delete `window.speechSynthesis` in the test init script or the app re-renders about once a second and hides screens, and the multiplayer quiz-selector never reaches a stable state.
- **For any user-visible text:** `components/locales/{en,de,fi}.json` are the source of truth, `components/locales/__tests__/localeParity.test.js` enforces parity between them, and `npx playwright test e2e/i18n-coverage.spec.ts` sweeps every screen for text still in English.
- **Quiz, essay and glossary data** (`assets/quizzes_*.json`, `assets/essays_*.json`, `assets/glossary.json`) is content rather than interface, and is out of scope for translation work.
