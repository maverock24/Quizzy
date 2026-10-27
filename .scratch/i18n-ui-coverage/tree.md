# Design tree

- **Slug**: i18n-ui-coverage
- **Tier**: full
- **Critical**: no

## End state

Choosing German or Finnish in Settings changes **every** user-visible string in
the app: 491 live strings across 37 files move behind `t()`, the locale files
carry no defects, no key is missing from any language, and a jest test fails the
moment a key goes missing or a value stays English.

## Out of scope

- **Quiz content.** `assets/quizzes_{en,de,fi}.json`, `assets/essays_en.json` and
  `assets/glossary.json` stay as they are. Content, not chrome, and there is no
  `_de`/`_fi` variant to key into.
- **The 4 dead files**, 39 strings: `components/TtsTestComponent.tsx` (26),
  `components/gamification/DailyQuiz.tsx` (9), `components/AnalogClock.tsx` (2),
  `components/OfflineIndicator.tsx` (2). Nothing imports or renders them, so
  translating them changes nothing a user can see. Deleting them is a separate
  change.
- **`app/+html.tsx`.** Renders in Node during static web rendering with no access
  to the user's stored language, so it cannot know what to translate to. Its
  `<html lang="en">` and English meta description stay.
- **Improving the English wording.** See D6: English values must equal today's
  literals byte for byte.
- **Adding languages.** Only en/de/fi exist and only those three are wired.

## Decisions

### D1. What counts as "the interface"

- **Status**: settled
- **Blocked by**: none
- **Decision**: all 491 live user-facing strings across 37 files, including the
  132 in `components/gamification/types.ts` (53 achievement names, 53
  descriptions, 25 level titles). The 4 dead files are skipped, not translated
  and not deleted. Counts and per-file lines are in `master-table.md`.

### D2. Locale hygiene

- **Status**: settled
- **Blocked by**: none
- **Decision**: fix everything in this effort. Concretely:
  - rewrite the 16 German and 18 Finnish wording defects listed in
    `research.md` Q7;
  - add the missing `cancel` key to all three files (today
    `components/kids/MultiplicationRangeSheet.tsx:147` shows "Abbrechen" to
    English and Finnish users);
  - un-swap `en.json:36-37` (`Answers_right` / `Answers_wrong`);
  - replace `"quiz_title": "Quizzy (DE)"` with `"Quizzy"` so the read-aloud TTS
    at `components/Reader.tsx:49` stops saying "Quizzy (DE)";
  - add the `multiplication_*` keys currently only in `de.json` to `en.json` and
    `fi.json`;
  - fix the `day_streak` plural.

### D3. How `services/` gets translated

- **Status**: settled
- **Blocked by**: none
- **Decision**: import the i18next instance into `services/multiplayerRules.ts`
  and `services/multiplayerFailures.ts` and call `i18n.t` there. The sentence
  stays in the tested rule, where commit `e9e62bc` deliberately put it.

  **This requires a jest setup file.** Verified by probe: importing
  `components/i18n.ts` under jest currently throws
  `Invariant Violation: TurboModuleRegistry.getEnforcing(...): 'RNLocalize'
  could not be found`, because of the module-level
  `import * as RNLocalize from 'react-native-localize'` at
  `components/i18n.ts:4`. A repo-local `jest.setup.js` containing exactly
  `jest.mock('react-native-localize', () => require('react-native-localize/mock'));`
  registered through `setupFiles` fixes it. Verified: with that in place
  `i18n.language === 'en'`, `i18n.t('select_quiz') === 'Select Quiz:'`, and the
  full suite runs 156 tests green. So the 6 existing English assertions in
  `multiplayerRules.test.js:266-294` and `multiplayerFailures.test.js:51` keep
  passing untouched.

### D4. Verification

- **Status**: settled
- **Blocked by**: none
- **Decision**: add a jest locale-parity test and commit the missing snapshot.
  The test asserts: identical key sets across `en`/`de`/`fi`; no value identical
  to the English value outside a small allowlist (`Sound`, `Max Level!`,
  `Quizzy`, plus same-spelling words); every literal `t('…')` key used in
  `app/`/`components/`/`services/` exists in the locale files. Also commit
  `components/__tests__/__snapshots__/StyledText-test.js.snap`, which has never
  been in git, so `npx jest --ci` stops failing.

### D5. Countable strings

- **Status**: settled
- **Blocked by**: none
- **Decision**: keep the existing two-key / ternary pattern
  (`question_to_review` / `questions_to_review`), translate both branches in all
  three languages, and add the missing singular/plural pair for `day_streak`.
  No conversion to i18next `_one`/`_other`.

### D6. English copy must not move

- **Status**: settled, forced by evidence
- **Blocked by**: none
- **Decision**: every `en.json` value that replaces a current hardcoded literal
  must be that literal, character for character. `e2e/multiplayer.spec.ts` asserts
  8 English strings at `:34,38,41,58,65,68,76,79` and pins no locale, riding
  Chromium `en-US`, so any rewording turns the e2e suite red. This also means no
  opportunistic English copy-editing.

### D7. Achievement and level keys

- **Status**: settled
- **Blocked by**: none
- **Decision**: derive keys from the existing stable `id` field rather than
  inventing new identifiers. `components/gamification/types.ts` keeps the
  structure, icons, categories, requirements and XP rewards; the English `name`
  and `description` become `t('achievement_<id>_name')` and
  `t('achievement_<id>_description')` at the render sites
  (`AchievementBadge.tsx`, `AchievementModal.tsx`). Level titles become
  `t('level_<n>_title')`. The 25 level titles and 53 achievement names and
  descriptions get German and Finnish copy authored in this effort.

### D8. `useTranslation` everywhere, including the one bare-`t` import

- **Status**: settled
- **Blocked by**: none
- **Decision**: `components/Flashcards.tsx:20` imports `{ t }` from `i18next`
  directly, so it never re-renders when the language changes. Replace it with the
  `useTranslation` hook. Every file that gains `t()` uses the hook; only the
  plain-`.ts` services (D3) use the instance.

### D9. `EditScreenInfo` stays, and gets translated

- **Status**: settled
- **Blocked by**: none
- **Decision**: `components/EditScreenInfo.tsx` holds Expo template prose and is
  reachable from a real link at `app/(tabs)/_layout.tsx:94` via `app/modal.tsx:16`.
  It is user-visible, so its 3 strings get translated rather than deleted.

### D10. Slice order

- **Status**: settled
- **Blocked by**: none
- **Decision**: prefactor first (jest setup file + snapshot + parity test, so the
  gate is green and stays green), then locale files, then screens by size, then
  the learning modes, then achievements last. One commit per slice.

### D11. Language names in onboarding

- **Status**: settled
- **Blocked by**: none
- **Decision**: use the localized names from the existing `english` / `german` /
  `finnish` keys, matching the Settings picker. No new endonym keys.

### D12. Code-like chrome

- **Status**: settled
- **Blocked by**: none
- **Decision**: translate both. `Q3/10`
  (`components/MultiplayerScoreboard.tsx:30`) becomes
  `multiplayer_progress` = `Q{{current}}/{{total}}`, and the duration rendering
  at `app/multiplayer/[code].tsx:44-49` becomes localized time keys. `2m 15s`
  reads as English, which is the bug being reported.

### D13. The user-quiz template in settings

- **Status**: settled
- **Blocked by**: none
- **Decision**: leave `User Quiz` / `What is 2+2?` / `2+2=4`
  (`app/(tabs)/settings.tsx:136,139,142`) in English. They are quiz content
  written into `quizzes_user.json`, and translating them would make the stored
  template language-dependent from the moment it is created.

### D14. The Android update errors

- **Status**: settled
- **Blocked by**: none
- **Decision**: include the three messages at `services/androidUpdate.ts:84,89,96`.
  They reach the user as alert bodies via `app/(tabs)/settings.tsx:106-110`.

### D15. Slices that share a file run sequentially

- **Status**: settled, forced by evidence
- **Blocked by**: none
- **Decision**: every slice that adds strings writes keys into the same three
  JSON files, so slices cannot run in parallel worktrees without JSON merge
  conflicts. Implementation runs one commit at a time, in plan order.
