# Translate the whole quiz app interface (en / de / fi)

- **Slug**: i18n-ui-coverage
- **Tier**: full (touches many production files across `app/` and `components/`)
- **Critical**: no (no auth, payment, migration, secrets or infra paths touched)
- **Stage**: Research

## What the owner said

> the whole quiz app interface should be translated depending on what language the
> user chooses from the settings. There are still a lot of text that is not yet
> properly translated into finnish or german when the user chooses those languages
> in the settings

## Scope decided here

In scope: **interface chrome**. Every user-visible string in `app/` and
`components/` that is still a hardcoded English literal, plus any locale key that
exists in `en.json` but is missing or wrong in `de.json` / `fi.json`.

Out of scope (owner said "the whole quiz app interface", and this reading is
recorded as an assumption Research must confirm or refute with evidence):
quiz *content* (`assets/quizzes_en.json`, `quizzes_de.json`, `quizzes_fi.json`)
is already language-selected and is not a UI string.

## Evidence gathered in this window

### The translation machinery already exists and works

- `components/i18n.ts:33-45` — i18next + `initReactI18next`, `fallbackLng: 'en'`,
  three resources `en` / `de` / `fi`.
- `components/i18n.ts:11-31` — `getInitialLanguage()` picks from `navigator` on
  web, `RNLocalize` on native.
- `components/i18n.ts:9-10` — SSR guard returns `'en'` when `typeof window ===
  'undefined'`.
- `components/Quizprovider.tsx:361-372` — `setLanguage` calls
  `i18n.changeLanguage` and persists to `AsyncStorage` key `language`.
- `app/(tabs)/settings.tsx:186-196` — the `Picker` that switches language, with
  `selectedValue={i18n.language}` and English/German/Finnish items.
- `components/Onboarding.tsx:29-30` — onboarding also calls `setLanguage` +
  `i18n.changeLanguage`.
- `components/Quizprovider.tsx:757-768` — an effect re-selects the quiz list when
  `i18n.language` changes.

So the switch itself is wired. The complaint is **coverage**, not plumbing.

### Locale files are small relative to the app

- `components/locales/en.json` — 111 keys, flat, snake_case (`quiz_title`,
  `select_quiz`, `time_up`, `achievement_category_streak`).
- `components/locales/de.json` — 121 keys.
- `components/locales/fi.json` — 111 keys.
- Key diff: `de.json` has 10 keys `fi.json` and `en.json` lack:
  `multiplication_duration`, `multiplication_mode`,
  `multiplication_mode_count`, `multiplication_mode_timed`,
  `multiplication_quiz_category`, `multiplication_quiz_label_range`,
  `multiplication_quiz_name`, `multiplication_range_from`,
  `multiplication_range_start`, `multiplication_range_to`.
  No key in `en.json` is missing from either `de.json` or `fi.json`.
  `de.json:1` also has `"quiz_title": "Quizzy (DE)"` while `en`/`fi` are
  `"Quizzy"` — a suspicious asymmetry.

### Only 21 files call `useTranslation`; the app has 83 TS/TSX files

Files with `useTranslation` (from grep):
`app/(tabs)/index.tsx`, `app/(tabs)/profile.tsx`,
`app/(tabs)/settings.tsx`, `components/Explanation.tsx`,
`components/gamification/{AchievementBadge,AchievementModal,DailyQuiz,GamificationStats,StreakDisplay,XPProgress}.tsx`,
`components/kids/MultiplicationRangeSheet.tsx`, `components/LearningTodos.tsx`,
`components/Onboarding.tsx`, `components/Question.tsx`,
`components/QuizSelection.tsx`, `components/Reader.tsx`, `components/Score.tsx`,
`components/SettingsHeader.tsx`, `components/useReadAloud.ts`.

Files that render user-facing text and have **no** `useTranslation`, from a
crude JSX-literal scan (75 candidate literals across 20 files, likely an
undercount because the scan misses ternaries and single-word literals):

`app/+not-found.tsx`, `app/modal.tsx`, `app/(tabs)/learn.tsx`,
`app/(tabs)/_layout.tsx`, `app/multiplayer/index.tsx`,
`app/multiplayer/[code].tsx`, `app/multiplayer/_layout.tsx`,
`app/_layout.tsx`, `components/EssayReader.tsx`, `components/Flashcards.tsx`,
`components/GlossaryModal.tsx`, `components/Quizprovider.tsx`,
`components/TtsTestComponent.tsx`, `components/learning/CodeTracing.tsx`,
`components/learning/DebuggingExercise.tsx`,
`components/learning/FadedExamples.tsx`,
`components/learning/ParsonsProblems.tsx`,
`components/learning/SRSDailyWarmup.tsx`, plus suspected:
`components/MultiplayerScoreboard.tsx`, `components/OfflineIndicator.tsx`,
`components/QuizTimer.tsx`, `components/kids/StreakPet.tsx`,
`components/kids/CelebrationOverload.tsx`, `components/AnalogClock.tsx`,
`components/Music.tsx`, `components/ClickableTerms.tsx`,
`components/GlossaryProvider.tsx`, `components/LearningTodosProvider.tsx`,
`components/learning/SRSManager.ts`, `app/(tabs)/profile.tsx`.

Indicative file sizes: `app/multiplayer/[code].tsx` 1069 lines,
`components/Quizprovider.tsx` 847, `app/(tabs)/index.tsx` 793,
`app/(tabs)/settings.tsx` 699, `components/learning/FadedExamples.tsx` 653,
`components/learning/ParsonsProblems.tsx` 631, `components/Flashcards.tsx` 625,
`components/learning/DebuggingExercise.tsx` 588, `app/multiplayer/index.tsx`
577, `components/learning/CodeTracing.tsx` 518,
`components/learning/SRSDailyWarmup.tsx` 496, `app/(tabs)/learn.tsx` 485,
`components/kids/CelebrationOverload.tsx` 479, `components/GlossaryModal.tsx`
441.

### English copy is load-bearing for the one existing test

`e2e/multiplayer.spec.ts` asserts on English strings:
`:34 'Multiplayer Quiz'`, `:38 'Create New Game'`, `:41 'Room:'`,
`:58 'Waiting for host to start...'`, `:65 'Select Quiz'`,
`:68 '🌐 Language'`, `:76 'Start Game'`, `:79 'Question 1'`.
These tests run with the default language (English), so the English strings must
stay byte-identical after the change.

### Gate

- `npx tsc --noEmit` → clean, exit 0.
- `npx eslint . --ext .js,.jsx,.ts,.tsx` → 1 pre-existing error in the generated
  `expo-env.d.ts:3:73` (`prettier/prettier`). Not ours, not to be fixed here.
- **CORRECTION to an earlier reading of this ticket**: jest unit tests DO exist.
  `services/__tests__/` holds 14 suites / 154 tests, all `.test.js`, plain node,
  no component tree. `npx jest services/__tests__` → 14 suites, 154 tests,
  all passing, ~6 s. So there IS a home for a locale-parity test.
- `npm test` is `jest --watchAll` (`package.json:10`), which never exits. The
  usable gate form is `npx jest --ci` (runs once) or `npx jest <path> --ci`.
- The `e2e/` Playwright spec is excluded from jest by
  `testPathIgnorePatterns` (`package.json:17-19`) and is not part of the gate.

### Existing tests pin English copy (a real constraint)

- `services/__tests__/multiplayerRules.test.js:266-294` asserts the five
  `leadLabel` returns verbatim: `"You're ahead by 2"`, `2 behind`, `Tied`,
  `Opponent left`, `Waiting for your rival`.
- `services/__tests__/multiplayerFailures.test.js:51` asserts
  `failureMessage('room-full') === 'This room is already full'`.
- So `services/multiplayerRules.ts:129-132` and
  `services/multiplayerFailures.ts:40-52` cannot simply start returning
  translated text: either they keep returning stable codes and the translation
  moves to the render site, or the tests are pinned to English by forcing the
  language. Design decides.

### A file location the first scan missed

`services/` holds user-facing copy, and it is plain `.ts`, not components:

- `services/multiplayerFailures.ts:40-52` — 7 error strings (`No room with that
  code`, `This room is already full`, `This device cannot do multiplayer`,
  `Cannot reach the server, check the connection`, `Could not connect, try
  again`, `The room did not answer`, `Could not create a room, try again`).
- `services/multiplayerRules.ts:129-132` — `leadLabel`, 4 strings
  (`Waiting for your rival`, `Opponent left`, ``You're ahead by ${lead}``, `Tied`).

These need the i18n instance imported directly (`i18n.t`), not the hook, because
no component is rendering them.

### Dead components confirmed

`components/TtsTestComponent.tsx`, `components/AnalogClock.tsx` and
`components/OfflineIndicator.tsx` are imported by nothing under `app/`,
`components/`, `hooks/` or `services/` (verified with `grep -rn`). They carry
user-facing text (26, 2 and 2 strings) but translating them changes nothing a
user can see. Design decides whether to spend on them.

### Working tree state

`git status --porcelain` → `?? .scratch/` only. Branch `master`. Clean.

## Questions Research must answer

Numbered; answer each or mark `unresolved` with a reason.

1. **Full inventory of hardcoded UI strings.** For every file under `app/` and
   `components/` (excluding `components/ui/`, `components/i18n.ts`,
   `components/locales/`): is it user-facing, and exactly which string literals
   render to the user? Give `file:line` and the literal for each. Include JSX
   text nodes, ternaries, template literals, `Alert.alert` titles and bodies,
   `placeholder`, `accessibilityLabel`, `label`/`title` props, `Picker.Item`
   labels, `Text` children built from expressions, and any string returned by a
   helper that ends up on screen. State the per-file count so the plan can slice.
2. **Which of those files are not user-facing at all** and must be skipped —
   pure logic, providers with no rendered text, style-only modules. Name them so
   the plan does not churn them.
3. **Naming convention for new keys.** Report the existing key style from
   `en.json` (flat vs nested, snake_case vs camelCase, any namespacing prefix),
   and check `git log` for how keys were added before, so new keys match.
4. **Dynamic strings.** Which candidate strings contain interpolation
   (`{{count}}`, `{{remaining}}`), counts/plurals, dates, times, durations or
   numbers that need formatting? Is `i18next` pluralisation (`_one`/`_other`
   suffixes) used anywhere today? Does `en.json` already have any `_one`/`_other`
   keys? Report exactly which strings need plural handling so the design does not
   invent count forms that read wrong in Finnish or German.
5. **Non-component string sources.** Where do strings live outside a React
   render: `Alert.alert` calls, `accessibilityLabel`s, `useReadAloud.ts` TTS
   output, `app/_layout.tsx` and `app/(tabs)/_layout.tsx` screen `title`/`options`,
   `app/+not-found.tsx`, `components/learning/SRSManager.ts`, error messages
   surfaced to the user? Report `file:line`. Note that a `t()` call inside a
   non-component module needs the i18n instance imported directly rather than the
   hook — confirm whether `components/i18n.ts` default export is importable from
   a plain `.ts` without circular-import trouble.
6. **The `multiplication_*` gap.** Where are those 10 keys consumed
   (likely `components/kids/MultiplicationRangeSheet.tsx` and a
   multiplication quiz builder in `components/Quizprovider.tsx`)? What English
   text do they correspond to? Confirm that on `fi` the multiplication quiz
   currently falls back to English, and say what `en.json` needs to add for them.
   Also confirm whether `"quiz_title": "Quizzy (DE)"` is intentional.
7. **Translation-quality check.** Read `de.json` and `fi.json` string by string
   against `en.json`. List any key whose value is still English, is a
   copy-paste of the English, is mistranslated, or is grammatically wrong for
   that language. Report `key: value`. Do not rewrite them, just list.
8. **Where should a regression test live?** There are no unit tests. Report
   whether `jest-expo` can run a plain node test in this repo without a
   component tree (does `jest` resolve today at all — check for
   `jest.config`, `setupFiles`, babel config, `@testing-library/*` in
   `devDependencies`). If a locale-parity test (every `en` key present in `de`
   and `fi`, no value identical to English) is feasible, report the exact
   command that would run it.
9. **Is `i18next` re-rendering reliable?** Confirm that components using
   `useTranslation` actually re-render on `changeLanguage` given
   `initReactI18next` is registered and no `react: { useSuspense: false }` or
   `bindI18n` override gets in the way. Check for any component that reads
   `i18n.language` into local state once (e.g. `Quizprovider.tsx:116`,
   `Onboarding.tsx:25`) and would not re-render its strings.
10. **`assets/essays_en.json` and `assets/glossary.json`.** Are these ever shown
    as UI text, or only as content? If content, confirm they stay out of scope.
11. **Anything already half-done.** Are there components that import
    `useTranslation` but use `t()` for only a few strings while rendering many
    English literals (partial coverage)? List them with the covered vs uncovered
    strings, because those are the cheapest wins.
