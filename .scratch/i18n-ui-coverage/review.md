# Review: i18n UI coverage (`qrspi/i18n-ui-coverage`)

**Verdict: ship with fixes.** The translation work itself holds up: no live
hardcoded English string survived my scans, no `t()` evaluates at module scope,
every literal and derived key exists in all three locales, English survived
byte-identical for the eight e2e-pinned strings, and the gate matches the plan.
What does not hold up is part of the regression net. The locale parity test is
blind to every key reached through a variable, and blind to interpolation
placeholder drift, so four of the seven mutations I ran left it green. Two
copy defects and one plan item that was never implemented come with that.

Reviewed: `git diff 77da792..HEAD` (15 commits, 55 files, 8814 insertions) against
`tree.md` (D1-D15), `plan.md` (S1-S14, risk register, verification plan) and
`research.md` via the plan.

## Findings

| # | Severity | Where | What is wrong | Fix |
|---|---|---|---|---|
| 1 | MAJOR | `components/locales/__tests__/localeParity.test.js:122-137` and `:31` | The net cannot see keys that are not a `t('literal')`. Proven, not guessed (mutations 4-6): deleting `multiplication_mode_count`, `kids_celebration_2`, `faded_stage_2_desc` or `achievement_category_speed` from all three locale files leaves the suite at 5/5 green, and the app then renders the raw key. The uncovered families are `t(labelKey)` (`components/kids/MultiplicationRangeSheet.tsx:120`), `t(celebration.key)` (`components/kids/CelebrationOverload.tsx:449`), `t(stage.nameKey)` / `t(stage.messageKey)` / `t(nextStage.nameKey)` (`components/kids/StreakPet.tsx:268,291,304`), `t(currentStage.descriptionKey)` (`components/learning/FadedExamples.tsx:319`), `t(\`achievement_category_${category}\`)` (`components/gamification/GamificationStats.tsx:133`) and the `day_streak` / `days_streak` ternary (`components/gamification/StreakDisplay.tsx:188`). `plan.md:1361` claims the S14 sweep "closes the last coverage hole"; it closes the `achievement_<id>_*` and `level_<n>_title` hole only. | Export the key tables (`MODE_OPTIONS`, `CELEBRATIONS`, `PET_STAGES`, the FadedExamples stage descriptors) and the `AchievementCategory` union from their modules, then drive the sweep off them the way it already drives off `DEFAULT_ACHIEVEMENTS` / `LEVEL_CONFIGS`. Cheapest partial: add an `INDIRECT_KEYS` array to the test with a reason comment per entry, and assert it in all three files. Do not widen to "any string in the source looks like a key"; that is noise. |
| 2 | MAJOR | `components/locales/__tests__/localeParity.test.js` (whole file) | No assertion compares `{{...}}` placeholder sets across locales, and no assertion checks that a call site passes the names its value interpolates. Mutation 7 (`de` `settings_update_download_failed` = `... (HTTP {{state}}).`) passes 5/5, and on screen the user then reads `APF-Download fehlgeschlagen (HTTP {{state}}).`. `plan.md:1300` (risk 9) declares this gap and asks each slice's human check to look, which is not a net. | Add one assertion: for every key present in `en`, `de`, `fi`, `sortedPlaceholders(value)` is equal. It is ten lines, it cannot false-positive (all 700+ current values pass, verified by hand below), and it catches exactly the failure class D9's risk register names. |
| 3 | MINOR | `components/locales/de.json:350` | `language_helper` is now `"du kannst das später in den Einstellungen ändern"`, lowercased to match the mid-sentence `du` at `de.json:103`. But this string is its own standalone sentence (`components/Onboarding.tsx:105`, its own `<Text>`), so a German UI now starts a sentence with a lowercase letter. The pre-change value `"Du kannst ..."` was correct for that position. | Restore `"Du kannst das später in den Einstellungen ändern"`. The inconsistency D2 row 15 named is not a defect at all. |
| 4 | MINOR | `components/locales/en.json:70` | `days_streak` is `"days streak"`, so an English profile with a 7 day streak reads "7 days streak". Commit `7367ec4` changed it from `"day streak"` on the strength of the old render reading "7 day streak", which was the lesser evil. `plan.md` S2 item 5 explicitly specified both English keys as `"day streak"` on purpose. | Set `en.days_streak` back to `"day streak"` (de/fi keep their plural forms, `days_streak` is a new key so D6 does not bite), or go to `"-day streak"` on both. Do not leave "days streak". |
| 5 | MINOR | `components/learning/DebuggingExercise.tsx:182` | S8 (`plan.md:778`) asked for the `` `// ${line}` `` comment prefix to become `debug_plain_comment`. It did not: the template literal is still there, and the key exists in none of the three locale files, which is harmless only because `// ` is punctuation. | Either delete the row from the plan or add the key and use `t('debug_plain_comment', { line })`. As it stands the plan and the code disagree about one of the 491 strings. |
| 6 | MINOR | `components/locales/de.json:387` | `multiplayer_quiz_label` (en `"Quiz:"`) is translated as `"Ausgewähltes Quiz:"`, the same German string as `multiplayer_selected_quiz` (en `"Selected Quiz:"`). The lobby therefore prints the same label twice where English and Finnish distinguish them. | Use `"Quiz:"` for `multiplayer_quiz_label` in de, keeping `"Ausgewähltes Quiz:"` for `multiplayer_selected_quiz`. |
| 7 | MINOR | `components/locales/de.json:439` | `settings_up_to_date` = `"Aktuell"`. `aktuell` means "current"; the badge means "you are running the newest build". | `"Auf dem neuesten Stand"`. |
| 8 | MINOR | `components/locales/de.json:527`, `components/locales/fi.json:527` | `flashcard_dump` = de `"ablegen"` ("file away"), fi `"hylkää"`; en is `"dump"` on a swipe-left control that discards the card (`components/Flashcards.tsx:498`). German `ablegen` does not mean discard. Both values are also lowercase while the paired `flashcard_keep` is capitalised (`"Behalten"`, `"Pidä"`), which reads as a typo next to it. | de `"Verwerfen"`, fi `"Hylkää"` (or keep `hylkää` if the pair convention is lowercase, but then lowercase `Pidä` too). |
| 9 | MINOR | `components/locales/fi.json:514`, `components/locales/fi.json:431` | `reader_tts_unsupported`: `"Tekstistä puheeksi ei ole tuettu tässä selaimessa."` is not idiomatic (`ei ole tuettu` should be `ei tueta`, and the compound needs a case). `settings_update_check_failed`: `"Päivitysten tarkistus ei onnistu."` is present tense for an event that already failed. | `"Tekstistä puheeksi -toimintoa ei tueta tässä selaimessa."` and `"Päivitysten tarkistus ei onnistunut."` |
| 10 | MINOR | `services/__tests__/multiplayerRules.test.js:266-294`, `services/__tests__/multiplayerFailures.test.js:51` | Both suites assert English strings without pinning `en`. They pass because `i18n.language` happens to be `en` under jest (`getInitialLanguage()` in `components/i18n.ts:9-33` returns `en` when `window` is undefined, else falls through `navigator.language`). A future jest environment that supplies a `de` navigator turns six assertions red for no product reason, and a future one that supplies `de-DE`… is fine, but the coupling is invisible. | Print the language once (`console.log(i18n.language)` in `jest.setup.js` is too noisy; better `beforeAll(() => i18n.changeLanguage('en'))` in the two suites) or pin `lng` in a test-only init. Verified genuine, not luck, by probe: see "D3 probe" below. |
| 11 | NIT | `.scratch/i18n-ui-coverage/` (13 files, commit `4d33c56`) | The effort's own plan, tree, research and state files are committed to the repo, while every other `.scratch/` directory stays untracked, and `plan.md`'s own verification step 7 expects `git status` to show `?? .scratch/`. | Drop `.scratch/` from the tree before pushing to `main`, or add `.scratch/` to `.gitignore` and `git rm --cached` it. |
| 12 | NIT | `app/multiplayer/[code].tsx:316` | `setRejoinError(failureMessage(...))` snapshots a translated sentence into state, so a language switch during the banner's lifetime leaves stale-language text. Same class for any `t()` result stored in state; I found no other instance. | Translate at render: store the `MultiplayerFailure` and call `failureMessage()` in JSX. |
| 13 | NIT | `components/gamification/GamificationProvider.tsx:570,582` | The context still exposes `levelTitle`, which is the English `LEVEL_CONFIGS[...].title` from `types.ts`. Nothing consumes it today (`XPProgress` was switched to `t('level_<n>_title')`), so it is a trap rather than a bug: the next component to read `levelTitle` renders English in all three languages. | Delete `levelTitle` from the context, or make it return the key so the consumer translates. |
| 14 | NIT | `components/useReadAloud.ts:580` | The `useCallback` body reads `t` but the dependency array is `[i18n.language, stopTTS]`. It works (the callback is rebuilt when the language changes, and i18next's `t` resolves against the instance at call time), so this is a dep-array discipline nit, not a stale-string bug. | `[t, i18n.language, stopTTS]`. |
| 15 | NIT | `components/locales/de.json:58` | `multiplication_quiz_label_range` de is `"Einmaleins ({{from}}×{{from}} bis {{to}}×{{to}})"` while en is `"{{from}}×{{from}} to {{to}}×{{to}}"` and fi keeps the bare range. Same meaning, but the German quiz card label is longer than the layout was built for and the two other languages do not get the noun. | Either drop the wrapper or add it to en/fi for parity. |

## What I verified as correct (so the fixes above are not mistaken for a rewrite)

- **Completeness.** AST walk over `app/`, `components/`, `services/` for JSX text
  nodes, `placeholder` / `label` / `title` / `message` / `accessibilityLabel` /
  `accessibilityHint` / `text` attributes, conditional branches returning string
  literals, `Alert.alert(...)` / `alert(...)` / `showAlert(...)` arguments and
  `new Error('...')`. Survivors are: `"XP"` (`components/gamification/*`), file
  names rendered as code (`script.js`, `buggy_code.js`, `app/modal.tsx`), 130
  `console.*` diagnostics, the documented exclusions (`app/(tabs)/settings.tsx:138,141,142`
  quiz template, `app/+html.tsx`, `services/remoteUpdate` errors) and the dead
  files. Nothing else.
- **Dead files are dead.** `TtsTestComponent`, `AnalogClock`, `OfflineIndicator`
  have no importer at all. `gamification/DailyQuiz.tsx` is re-exported from
  `components/gamification/index.ts:20` and that barrel is imported by four live
  files, so the module is evaluated but never rendered. The plan's wording
  ("nothing imports or renders them") is slightly wrong for `DailyQuiz`; the
  conclusion (no user-visible string) holds.
- **No module-scope translation.** No `t()` or `i18n.t()` outside a function
  body. `PET_STAGES`, `CELEBRATIONS`, `MODE_OPTIONS` carry keys and emoji only.
  `createMultiplicationQuiz()` calls `i18n.t` inside the factory and the quiz
  list is rebuilt on `i18n.language` (`components/Quizprovider.tsx:757-768`).
  The three `useMemo`/`useCallback` bodies that touch `t` all rebuild on a
  language change; `DebuggingExercise` deliberately stores raw pieces
  (`:82-92`) and translates at render (`:182-196`).
- **Every component that calls `t()` uses the hook.** The only files with `t('`
  and no `useTranslation` are false positives (`.get('...')`, `.split('T')`,
  `createElement('style')`). D8's `Flashcards.tsx` fix is in place.
- **No missing keys at render.** All literal keys resolve (parity test), and I
  separately checked all 32 keys reached by indirection: `faded_stage_1_desc`,
  `faded_stage_2_desc`, `multiplication_mode_count`, `multiplication_mode_timed`,
  `kids_celebration_1..5`, `kids_pet_{0,1,3,7,14,30,60,100}_{name,message}`,
  `achievement_category_{streak,score,speed,special,volume}`, `day_streak`,
  `days_streak`. Since `fallbackLng` is `en` (`components/i18n.ts:38`), a key
  missing from de or fi would render English, not the raw key; a key missing from
  all three renders raw. Both classes are covered for literal keys, neither for
  indirection keys (finding 1).
- **Placeholder sets agree across all three locales today** (checked for every
  key), and all 30 interpolating keys' literal call sites pass exactly the names
  their value uses (`progress_info` uses the legacy `t(key, default, opts)` form
  at `components/LearningTodos.tsx:177` and its `{{remaining}}` resolves).
- **D6 / e2e.** `en.json` vs `77da792`: 0 keys removed, 416 added, exactly 2
  values changed, both the intended `Answers_right` / `Answers_wrong` un-swap.
  I also machine-compared 169 one-to-one `literal → t('key')` replacements
  (letters-only comparison, emoji and punctuation stripped): all 169 agree
  except six explainable rows (`&apos;` entity, the two intentional Onboarding
  language-name changes, the `⏰ {t('time_up')} ⏰` template, and the two German
  `StreakPet` literals moving to `de.json`).
- **Copy in the two big authored blocks reads as game copy, not literal
  rendering.** I read all 25 level titles and all 53 achievement names, plus the
  German and Finnish side of the multiplayer, settings, learn, learning and kids
  families. Idioms were re-created rather than calqued (`Week Warrior` →
  `Wochenheld` / `Viikkosankari`, `Night Owl` → `Nachteule` / `Yöpöllö`), no
  German leaked into `en` or `fi`, no English leaked into `de`, and no emoji is
  double-rendered.

## D3 probe (services translate at call time, not at import)

Throwaway jest file `services/__tests__/zzzReviewProbe.test.js`, deleted after
the run (`git status` clean, see below). Output:

```
LANGUAGE_AT_IMPORT=en
EN_LEAD="You're ahead by 2"
EN_FAILURE="This room is already full"
LANGUAGE_AFTER_CHANGE=de
DE_AHEAD="Du liegst 2 vorn"
DE_BEHIND="2 zurück"
DE_TIED="Gleichstand"
DE_LEFT="Gegner hat das Spiel verlassen"
DE_WAITING="Warte auf deinen Gegner"
DE_FAILURE="Dieser Raum ist bereits voll"
FI_TIED="Tasapeli"
FI_FAILURE="Huone ei vastannut"
BACK_TO_EN="This room is already full"
```

So `leadLabel` and `failureMessage` follow `i18n.changeLanguage` at runtime: the
language is not frozen at import, and the six English-pinned assertions in
`services/__tests__/` pass because the language really is `en`, not because the
functions ignore the language. The residual risk is finding 10 (nothing pins
that `en`).

## Mutation results

Locale files were checksummed before and verified after every mutation
(`sha256sum -c`): `en.json 66b8d69c…`, `de.json ef46c06f…`, `fi.json a575331d…`,
all `OK` at the end. Each mutation ran
`npx jest components/locales/__tests__/localeParity.test.js --ci`, then
`git checkout -- components/locales/`.

| # | Mutation | Expected | Observed | Restored |
|---|---|---|---|---|
| 1 | delete `settings_check` from `fi.json` | fail | **fail**, 2 of 5: `has the same keys in every locale`, `has a value for every literal key used in the source` | yes |
| 2 | set de `settings_check` to the en value `"Check"` | fail | **fail**, 1 of 5: `does not ship untranslated values equal to the English value` | yes |
| 3 | delete `achievement_streak_3_name` from all three (breaks the derived sweep, leaves key sets identical) | fail | **fail**, 1 of 5: `has a value for every key derived from the achievement and level data` | yes |
| 4 | delete `multiplication_mode_count` from all three (read via `t(labelKey)`) | fail | **passed 5/5** — hole | yes |
| 5 | delete `kids_celebration_2` from all three (read via `t(celebration.key)`) | fail | **passed 5/5** — hole | yes |
| 6 | delete `faded_stage_2_desc` and `achievement_category_speed` from all three | fail | **passed 5/5** — hole | yes |
| 7 | de `settings_update_download_failed`: `{{status}}` → `{{state}}` | fail | **passed 5/5** — hole | yes |

The three mutations the brief asked for all bite. What the test would **not**
catch, beyond rows 4-7 above: an English-looking value that is not byte-identical
to `en` (e.g. a German value that is the English sentence plus one typo), a
value that is a stale but still-correct-language sentence, a call site moved to a
`t()` with the wrong key whose English happens to be plausible, and a
`useMemo`/`useState` that freezes a translated string (no test covers
re-rendering on language change at all).

## Gate

Run from `/home/maverock24/gitrepos/Quizzy` on `HEAD = 4d33c56`, in parallel:

- `npx tsc --noEmit` → exit 0, no output.
- `npx jest --ci` → 16 suites, **160** tests, 1 snapshot, all pass. The plan
  expected "16 suites, 156 tests"; the extra four are S14's sweep sitting in the
  existing parity suite, so no drift in spirit. No snapshot written.
- `npx eslint . --ext .js,.jsx,.ts,.tsx` → exactly one error,
  `expo-env.d.ts:3:73 prettier/prettier`, the pre-existing baseline. No drift.

## What I could not prove

1. **The Playwright spec was not run.** No web build and no server, so
   `e2e/multiplayer.spec.ts` is traced in code only. What I did check: `en.json`
   holds `multiplayer_title` = "Multiplayer Quiz", `multiplayer_enter_name` =
   "Enter your name", `multiplayer_create_game` = "Create New Game",
   `multiplayer_room` = "Room:", `multiplayer_waiting_host` = "Waiting for host
   to start...", `multiplayer_select_quiz` = "Select Quiz",
   `multiplayer_start_game` = "Start Game" and `question` = "Question", all
   equal to the asserted literals; and the four emoji call sites
   (`app/multiplayer/index.tsx:274-277,304-307`, `app/multiplayer/[code].tsx:752-755,767-770`)
   render `{'emoji '} + value` inside one `<Text>`, so `textContent` is still
   `"⚔️ Multiplayer Quiz"` and `getByText('Multiplayer Quiz')` still matches. Not
   executed: text-node splitting is an assumption about React Native Web's DOM,
   not something I observed.
2. **No runtime language switch.** I never booted the app, so "choosing German
   changes every visible string" is unverified end to end. Every specific freeze
   mechanism I could test statically is clean (see above), and the two known
   dynamic paths (`services/`, `useReadAloud`) were probed under jest.
3. **Only 169 of the 491 replacements were machine-compared** key-to-literal.
   Multi-line hunks (emoji splits, ternary rewrites, the two placeholder-into-JSX
   conversions) were read by hand at a sample of sites, not exhaustively.
4. **Rendering of the indirection keys in de/fi was verified by presence, not by
   display.** I know `kids_celebration_*`, `kids_pet_*`, `multiplication_mode_*`,
   `faded_stage_*` and `achievement_category_*` exist in all three files; I did
   not see them rendered.
5. **Native paths untested.** `i18n` init on device goes through
   `RNLocalize.getLocales()` (`components/i18n.ts:25-32`); under jest that is the
   mocked module, so the device branch is unexercised.
6. **Copy review is a sample, not a reading of all 318 new values.** All 25 level
   titles and all 53 achievement names were read; descriptions and the
   multiplayer/settings/learn/learning/kids families were read as a table, which
   is how findings 6-9 turned up, but I would not claim every sentence was
   proofread.

## Working tree

`git status --porcelain` after the review shows only the pre-existing
`?? .scratch/...` entries (ten of them, all untouched and none created by me) and
this `review.md`. Cleanup performed: the throwaway
`services/__tests__/zzzReviewProbe.test.js` was deleted, and the three locale
files were restored with `git checkout` and verified against the recorded
checksums; `/tmp/scan*.js` scanners live outside the repo.

---

## Resolution (orchestrator, after the review)

Fixed in `ef08754` and `2f8b095`.

| Finding | Resolution |
|---|---|
| 1 MAJOR indirection keys uncovered | Fixed. The parity test now scans the `*Key:` / `key:` property convention across `app/`, `components/`, `services/`, and expands `achievement_category_<union>` from the five known categories. A floor assertion (`indirect.length >= 20`) fails loudly if the convention changes and the scan silently covers nothing. Proven by mutation: deleting `multiplication_mode_count`, `kids_celebration_2`, `faded_stage_2_desc` or `achievement_category_speed` each turns the suite red. Files restored by checksum. |
| 2 MAJOR no placeholder parity | Fixed. Every key compares its `{{...}}` name set against English per language. Proven by mutation: `de` `settings_update_download_failed` with `{{state}}` instead of `{{status}}` turns the suite red. |
| 3 MINOR `language_helper` lowercase | Fixed, back to `Du kannst das später in den Einstellungen ändern`. |
| 4 MINOR `days_streak` = "days streak" | Fixed by reverting to `day streak`. The render is `{number}` then `{phrase}` in separate nodes, so "7 day streak" is idiomatic and only de/fi inflect. The earlier `7367ec4` changed it for the wrong reason. |
| 5 MINOR `debug_plain_comment` not implemented | Accepted as a deviation, not fixed. The `// ` prefix is punctuation with no words, and a key whose de/fi values equal English would need another allowlist entry for no user-visible gain. |
| 6 MINOR `multiplayer_quiz_label` duplicated | Fixed to `Quiz:`, and added to `IDENTICAL_TO_ENGLISH_ALLOWED.de` because German for "quiz" is "Quiz". |
| 7 MINOR `settings_up_to_date` = "Aktuell" | Fixed to `Auf dem neuesten Stand`. |
| 8 MINOR `flashcard_dump` | Fixed: de `Verwerfen`, fi `Hylkää`, capitalised to match the paired Keep button. |
| 9 MINOR two Finnish copy errors | Fixed: `Tekstistä puheeksi -toimintoa ei tueta tässä selaimessa.` and `Päivitysten tarkistus ei onnistunut.` The same tense problem in the German sibling (`Updates können nicht geprüft werden.`) was fixed too, to `konnten`. |
| 10 MINOR service tests do not pin the locale | Not changed. The reviewer proved the passing is genuine by forcing `de`, and pinning the locale inside the product's test suites would hide a future environment change rather than surface it. Recorded as a known coupling. |
| 11 NIT `.scratch/` committed | Intended. The QRSPI skill says to commit the artifacts with the work and never commit `ACTIVE`, which is what happened; every other `.scratch/` directory stays untracked. |
| 12 NIT `setRejoinError` snapshots translated text | Not changed. Transient banner, and the fix (storing the failure code and translating at render) is a behaviour change outside a translation effort. Recorded for a follow-up. |
| 13 NIT `levelTitle` still in the context | Not changed. No consumer today; recorded as a trap for whoever reads it next. |
| 14 NIT `useReadAloud` dep array | Not changed. Works as written because the callback is rebuilt on language change; recorded. |
| 15 NIT `multiplication_quiz_label_range` de wrapper | Fixed: de now reads `{{from}}×{{from}} – {{to}}×{{to}}`, matching en and fi. |

Gate after the fixes: `npx tsc --noEmit` clean, `npx jest --ci` 16 suites /
162 tests green, `npx eslint` exactly 1 pre-existing error at
`expo-env.d.ts:3:73`, and the 8 e2e-pinned English values unchanged.

Still unproven, unchanged by the fixes: the Playwright suite was never executed
(no dev server was started), so the e2e English assertions are traced in code,
not observed.
