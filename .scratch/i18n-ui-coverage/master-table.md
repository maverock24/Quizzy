# Consolidated master table

Built from `.scratch/i18n-ui-coverage/research.md` (wave 1) plus
`research/5-components-b.md` (wave 2), with the two counts corrected by
`research/6-verify.md`. Supersedes the table in `research.md`, which was missing
the 25 wave-2 files.

**Totals: 530 user-facing strings across 43 files. 491 of them are live, in 37
files. 39 sit in 4 files nothing renders.**

- `services/multiplayerFailures.ts` corrected from 7 to **8** per
  `research/6-verify.md` (strings at `:38,40,42,44,46,48,50,52`).
- `components/learning/index.ts` excluded: a wave-1 parsing artefact, the file is
  9 lines of re-exports with no text.

## Live files, largest first

| file | strings | useTranslation | notes |
|---|---|---|---|
| `components/gamification/types.ts` | 132 | no | 53 achievement names + 53 descriptions (`:146-634`), 25 level titles (`:114-138`), 1 fallback (`:695`) |
| `app/multiplayer/[code].tsx` | 40 | no | includes a `showAlert` wrapper at `:50-70` and button labels `Cancel`/`Leave` at `:162,:164` |
| `app/(tabs)/settings.tsx` | 36 | partial | 3 `Alert.alert` at `:110,:155,:167`, two titled just `Error` |
| `app/multiplayer/index.tsx` | 26 | no | `showAlert` wrapper `:26-34`; 5 strings the e2e spec pins |
| `components/kids/StreakPet.tsx` | 24 | no | |
| `app/(tabs)/learn.tsx` | 23 | no | |
| `components/learning/DebuggingExercise.tsx` | 23 | no | |
| `components/learning/ParsonsProblems.tsx` | 21 | no | |
| `components/learning/FadedExamples.tsx` | 19 | no | |
| `components/learning/SRSDailyWarmup.tsx` | 17 | no | 17 sites, 16 distinct |
| `components/learning/CodeTracing.tsx` | 15 | no | |
| `services/multiplayerFailures.ts` | 8 | no | plain `.ts`; returns text rendered directly |
| `components/gamification/AchievementBadge.tsx` | 8 | partial | |
| `components/gamification/AchievementModal.tsx` | 8 | partial | |
| `components/gamification/GamificationStats.tsx` | 8 | partial | |
| `app/(tabs)/index.tsx` | 6 | partial | |
| `components/Onboarding.tsx` | 6 | partial | 4 hardcoded: brand + 3 language endonyms |
| `components/GlossaryModal.tsx` | 5 | no | |
| `components/MultiplayerScoreboard.tsx` | 5 | no | renders `leadLabel` |
| `components/Score.tsx` | 5 | partial | |
| `components/EssayReader.tsx` | 5 | no | `{n} sections` at `:58` |
| `components/kids/CelebrationOverload.tsx` | 5 | no | |
| `services/multiplayerRules.ts` | 5 | no | plain `.ts`; `leadLabel` `:129-132`, two literals on `:132` |
| `components/gamification/XPProgress.tsx` | 5 | partial | |
| `app/+html.tsx` | 4 | no | SSR HTML shell, always renders in Node: `<html lang="en">` + meta description |
| `app/(tabs)/_layout.tsx` | 4 | no | tab labels |
| `components/Reader.tsx` | 4 | partial | `:319`, `:351` (two literals), `:383` |
| `app/+not-found.tsx` | 3 | no | |
| `components/Flashcards.tsx` | 3 | partial | **imports bare `t` from `i18next` at `:20`, never re-renders on language change** |
| `components/Question.tsx` | 3 | partial | |
| `components/EditScreenInfo.tsx` | 3 | no | Expo template prose, live via `app/modal.tsx:16` |
| `components/gamification/StreakDisplay.tsx` | 3 | partial | |
| `app/modal.tsx` | 2 | no | |
| `components/QuizSelection.tsx` | 2 | partial | |
| `components/Explanation.tsx` | 2 | partial | `:80`, `:100` |
| `components/kids/MultiplicationRangeSheet.tsx` | 1 | partial | `t('cancel', 'Abbrechen')` `:147` — key missing everywhere |
| `components/SettingsHeader.tsx` | 1 | yes | one ` / ` separator |
| `components/useReadAloud.ts` | 1 | partial | `:576` alert; destructures `i18n` only, zero `t()` keys |

## Dead, renders nothing

| file | strings | why |
|---|---|---|
| `components/TtsTestComponent.tsx` | 26 | imported by nothing |
| `components/gamification/DailyQuiz.tsx` | 9 | barrel-exported only, never rendered |
| `components/OfflineIndicator.tsx` | 2 | imported by nothing |
| `components/AnalogClock.tsx` | 2 | imported by nothing |

`components/useClientOnlyValue.ts` and `.web.ts` are also unimported but hold no
strings.

## Live, but no strings to translate

`app/_layout.tsx`, `app/multiplayer/_layout.tsx`, `app/remoteUpdate.ts`,
`app/(tabs)/profile.tsx` (all 3 strings already `t()`), `components/Music.tsx`,
`components/QuizTimer.tsx` (`MM:SS` only), `components/GlossaryProvider.tsx`,
`components/ClickableTerms.tsx`, `components/LearningTodosProvider.tsx`,
`components/LearningTodos.tsx`, `components/Quizprovider.tsx` (renders
`{children}` only, zero strings), `components/learning/SRSManager.ts`,
`hooks/useOfflineDetection.ts`.

## Third surface: strings that never touch JSX

| where | file:line | what |
|---|---|---|
| `services/` thrown `Error`, shown verbatim | `services/androidUpdate.ts:84,89,96` | caught at `app/(tabs)/settings.tsx:106-110`, `err.message` passed straight to `Alert.alert('Update failed', msg)` |
| `Alert.alert` | `app/(tabs)/settings.tsx:110,155,167` | native only |
| `showAlert` wrapper (web `window.alert`/`window.confirm`) | def `app/multiplayer/index.tsx:26-34`; calls `:127,141,145,155,171,175,198,202` | composes `` `${title}\n\n${message}` `` at `:29` |
| `showAlert` with buttons | def `app/multiplayer/[code].tsx:50-70`; calls `:161,342` | labels at `:162,:164`; web path `window.confirm` `:58` |
| TTS read-aloud output | `components/Reader.tsx:49,59`; `components/useReadAloud.ts` | `quiz_title`, `question` spoken, not printed |

## Locale defects with no file/line (they live in the JSON)

- **`cancel` key absent from all three files.** `components/kids/MultiplicationRangeSheet.tsx:147`
  calls `t('cancel', 'Abbrechen')`, so the button reads **Abbrechen** in English
  and Finnish too.
- **`en.json:36-37` has two labels swapped**: `Answers_right: "Wrong Answers"`,
  `Answers_wrong: "Correct Answers"`. `de`/`fi` are correct. Both keys are dead
  (0 `t()` hits), so it is latent, not live.
- **`de.json:55-64` holds 10 `multiplication_*` keys `en`/`fi` lack**, and shipped
  code uses all ten: `app/(tabs)/index.tsx:524-528`,
  `components/kids/MultiplicationRangeSheet.tsx:70`. Gated to German by
  `components/Quizprovider.tsx:94-97`, so en/fi never see them.
- **`"quiz_title": "Quizzy (DE)"`** (`de.json:2`, since commit `90f9cbe`,
  2025-06-10, never changed). Spoken aloud by `components/Reader.tsx:49`.
- **16 German and 18 Finnish wording defects** enumerated in `research.md` Q7.
  Worst: `reader_mode_desc` = "Vorlesung" (a lecture), `fi enable_sound` =
  "käyttöön".
- **Unused keys**: `achievements`, `completed`, `resets_in`, `explanation`,
  `Quiz_losses`, `Answers_right`, `Answers_wrong` have 0 repo-wide `t()` hits.
- **`day_streak` (`en.json:58`) is singular-only** and `components/gamification/StreakDisplay.tsx:183-186`
  prints the number and the key in two `<Text>` nodes, so "1 day streak" and
  "7 day streak" render identically.

## Test surfaces that pin English

| test | pins |
|---|---|
| `services/__tests__/multiplayerRules.test.js:266-294` | `"You're ahead by 2"`, `2 behind`, `Tied`, `Opponent left`, `Waiting for your rival` |
| `services/__tests__/multiplayerFailures.test.js:51` | `'This room is already full'` |
| `e2e/multiplayer.spec.ts:34,38,41,58,65,68,76,79` | 8 English literals; 5 of them are hardcoded JSX at `app/multiplayer/index.tsx:231,289` and `app/multiplayer/[code].tsx:648,728,771`. The spec sets no locale and rides Chromium `en-US`, so **`en.json` values must equal today's literals byte-for-byte**. |

## Gate

- `npx tsc --noEmit` — clean.
- `npx jest` — 15 suites, 155 tests pass, but **writes** an untracked
  `components/__tests__/__snapshots__/` (the StyledText snapshot was never
  committed).
- `npx jest --ci` — **1 failure**, same cause.
- `npx eslint . --ext .js,.jsx,.ts,.tsx` — 1 pre-existing error in the generated
  `expo-env.d.ts:3:73`.
