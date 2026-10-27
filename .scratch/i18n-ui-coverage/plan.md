# Implementation plan: i18n UI coverage

- **Slug**: i18n-ui-coverage
- **Tier**: full
- **Critical**: no
- **Stage**: Plan
- **Authority**: `tree.md` decides *what* (D1 to D10). `master-table.md` fixes the
  per-file scope and the gate. `research.md` supplies the evidence and the line
  numbers. Nothing here re-opens a settled decision.

Branch `master`, tree clean apart from `?? .scratch/`. 14 slices, one commit each,
in the order below.

---

## Rules that apply to every slice

1. **One commit per slice.** Message shape follows the house convention found in
   `git log -- components/locales/`: `feat(i18n): <area>`, body one or two
   sentences, trailer `QRSPI: i18n-ui-coverage`.
2. **Gate after every slice**, from the slice's own directory state:
   `npx tsc --noEmit && npx jest --ci`. Never `npx jest` bare: without `--ci` it
   writes an untracked snapshot instead of failing (see S1). Never `npm test`, it
   is `jest --watchAll` (`package.json:10`) and never exits.
3. **`en.json` and `de.json`/`fi.json` move in the same commit** as the component
   that reads the key. A key that lands alone is a second-language commit, which
   is exactly how `de.json` ended up with 10 keys the other two lack (Q3, rule 3).
4. **New keys go beside their family**, not at the end of the file. The files are
   flat, `snake_case`, unsorted by key name, grouped by feature landing order.
5. **Emoji live in JSX, translated values carry words.** `🎉 Well Done! 🎉`
   becomes `{`🎉 `}{t('score_well_done')}{` 🎉`}`, `⚔️ Multiplayer Quiz` becomes
   `{`⚔️ `}{t('multiplayer_title')}`. This keeps the rendered English byte-identical
   to today's literal, which D6 requires for the eight e2e-pinned strings, and it
   keeps emoji out of the locale files.
6. **Never call `t()` at module scope.** `i18n.t()` outside a function body
   freezes the value at import time (research Q5 hazard, visible in
   `services/MultiplicationQuiz.ts:14-15`). A module-level constant may hold the
   *key*; the `t()` call happens inside the component.
7. **Every file that gains `t()` uses `useTranslation`** (D8). Only the plain
   `.ts` files under `services/` import the instance from `components/i18n.ts`.
8. **Format with prettier** (`npx prettier --write <files>`) before committing.
   The eslint gate line is `npx eslint . --ext .js,.jsx,.ts,.tsx` and it must keep
   reporting exactly **one** error, the pre-existing `expo-env.d.ts:3:73`.

### Where the copy comes from

**The implementer writes the German and Finnish text. The human reviews it in the
diff.** No machine translation, no placeholder left in. Two blocks are large and
are called out in their own slice:

- **212 newly invented German and Finnish strings**: 53 achievement names + 53
  achievement descriptions (`S14`) and 25 level titles (`S13`), each × 2
  languages. This is *product copy*, not translation of reviewed text: the
  English names in `components/gamification/types.ts` are the only source, and
  most of them are English idioms (`Week Warrior`, `Comeback King`,
  `Night Owl`). Expect the reviewer to argue about wording; that is the point of
  putting it in one reviewable block.
- **24 German pet names and messages** already exist as hardcoded literals in
  `components/kids/StreakPet.tsx` (S6); their English and Finnish equivalents are
  invented in that slice.

---

## Key naming convention

Derived from D7 and the existing `en.json` (flat, `snake_case`, feature-prefixed,
unsorted; the four legacy `Pascal_Snake` score keys stay as they are).

- **Prefix per feature area**, because a bare word collides with a legacy key:
  `multiplayer_*`, `settings_*`, `learn_*` (hub screen), `learning_*` (shared by
  the five modes), `tracing_*`, `debug_*`, `parsons_*`, `faded_*`, `warmup_*`,
  `kids_*`, `tab_*`, `score_*`, `quiz_*` (quiz chrome), `reader_*`, `glossary_*`,
  `essay_*`, `flashcard_*`, `onboarding_*`/`edit_info_*`, `modal_*`,
  `not_found_*`, `app_html_*` (unused: `app/+html.tsx` is out of scope),
  `achievement_<id>_name`, `achievement_<id>_description`, `level_<n>_title`.
- **Collision list, do not reuse these bare names**: `question`, `questions`,
  `score`, `scores`, `settings`, `learning`, `learning_todos`, `language`,
  `back`, `next`, `correct`, `wrong`, `save`, `reset`, `close`, `explanation`,
  `achievements`, `completed`, `minutes`, `stop`, `other`, `streak`, `daily_challenge`,
  `explanation`, `hello`, `stats`, `continue`.
  Concretely: `Back` → `learning_back` (the existing `back` is lowercase
  `"back"`, used at `components/Reader.tsx:299`; do not change it), `Reset` →
  `parsons_reset`, `Test` → `settings_test`, `Join` → `multiplayer_join`,
  `Share` → `multiplayer_share`, `Left` → `multiplayer_left`,
  `Finished` → `multiplayer_status_finished`.
- **`cancel` is the one new bare key** (D2). en `Cancel`, de `Abbrechen`,
  fi `Peruuta`. It is read by `components/kids/MultiplicationRangeSheet.tsx:147`,
  `app/(tabs)/settings.tsx:595` and `app/multiplayer/[code].tsx:162`.
- **Achievement and level scheme (D7)**: keys derive from the existing `id`
  field, so nothing is renamed in `types.ts`.
  - 53 ids, verified at `components/gamification/types.ts:145,154,163,172,181,190,199,211,220,229,238,247,256,265,275,286,295,304,313,322,331,340,349,358,367,376,385,394,403,414,423,432,441,452,463,472,481,490,502,511,520,529,538,548,558,568,577,586,595,604,614,623,632`:
    `streak_3, streak_7, streak_14, streak_30, streak_60, streak_100, streak_365,
    first_perfect, perfect_5, perfect_10, perfect_25, perfect_50, perfect_100,
    comeback_king, consistency_10, first_quiz, questions_50, questions_100,
    questions_250, questions_500, questions_1000, questions_2500, questions_5000,
    quizzes_5, quizzes_10, quizzes_25, quizzes_50, quizzes_100, quizzes_250,
    quick_thinker, speed_demon, lightning_fast, sonic_speed, speed_streak_5,
    category_explorer, category_conqueror, category_master, all_rounder,
    daily_quiz_first, daily_quiz_7, daily_quiz_30, daily_perfect_streak_3,
    night_owl, early_bird, weekend_warrior, marathon_session, first_try_legend,
    no_hints, level_10, level_25, xp_1000, xp_10000, xp_50000`.
  - Keys: `achievement_streak_3_name`, `achievement_streak_3_description`, … one
    pair per id. Nothing else changes: ids, icons, categories, `requirement`,
    `xpReward` stay in `types.ts`.
  - Levels: `level_1_title` … `level_25_title`, one per entry of `LEVEL_CONFIGS`
    (`types.ts:114-138`).
  - Note the near-collision that is *not* a collision: achievement ids `level_10`
    and `level_25` produce `achievement_level_10_name`, while the level titles
    produce `level_10_title`. Both prefixes are needed; do not collapse them.
- **`MultiplayerScoreboard` lead labels** (5, defined in
  `services/multiplayerRules.ts:129-132`, rendered at
  `components/MultiplayerScoreboard.tsx:73`):
  `multiplayer_lead_waiting` = "Waiting for your rival",
  `multiplayer_lead_opponent_left` = "Opponent left",
  `multiplayer_lead_behind` = "{{lead}} behind",
  `multiplayer_lead_ahead` = "You're ahead by {{lead}}",
  `multiplayer_lead_tied` = "Tied".
  The two scoreboard status labels are `multiplayer_left` ("Left") and
  `multiplayer_status_finished` ("Finished"), the viewer row is `multiplayer_you`
  ("You"), and the progress badge is `multiplayer_progress` = "Q{{current}}/{{total}}".
- **Multiplayer alert titles and button labels**:
  `multiplayer_required` ("Required"), `multiplayer_enter_name_body` ("Please
  enter your name"), `multiplayer_cannot_create` ("Cannot create a room"),
  `multiplayer_cannot_join` ("Cannot join"), `multiplayer_cannot_invite`
  ("Cannot send invite"), `multiplayer_leave_title` ("Leave Game?"),
  `multiplayer_leave_body` ("Are you sure you want to leave?"),
  `multiplayer_leave` ("Leave"), `multiplayer_select_quiz_title` ("Select Quiz"),
  `multiplayer_select_quiz_first` ("Please select a quiz first"),
  `multiplayer_retry` ("Try again"), `multiplayer_accept` ("Accept"),
  `multiplayer_decline` ("Decline"), `multiplayer_join` ("Join"),
  `multiplayer_invite` ("Invite"), `multiplayer_rejoin` ("Rejoin"),
  `multiplayer_share` ("Share"), `multiplayer_copy_link` ("Copy link"),
  `multiplayer_link_copied` ("Link copied"), `multiplayer_start_game`
  ("Start Game"), `multiplayer_back_to_lobby` ("Back to Lobby"),
  `multiplayer_open_web` ("Open the web version").
- **Learning-mode keys** (full list in S7 to S9). Shared ones are deliberately
  shared, so the same English word is not keyed five times:
  `learning_back` ("Back"), `learning_try_again` ("Try Again"),
  `learning_see_results` ("See Results"), `learning_finish` ("Finish"),
  `learning_score_line` ("{{correct}} / {{total}} correct ({{percent}}%)").
  The five mode titles are defined once in S7
  (`learn_mode_warmup_title`, `learn_mode_compiler_title`,
  `learn_mode_parsons_title`, `learn_mode_faded_title`,
  `learn_mode_bughunter_title`) and reused as the mode headers in S8/S9.
  `components/learning/FadedExamples.tsx:282` says `📖 Faded Examples` while the
  hub says `Scaffolded Learning`, so it gets its own `faded_title`.

---

# Slices

## S1. Prefactor: jest setup, snapshot, locale-parity test

Nothing user-visible changes. This slice exists so the gate is green before any
translation lands, and so `services/` can start importing `components/i18n.ts`
(D3) without its tests dying on `TurboModuleRegistry.getEnforcing(...):
'RNLocalize' could not be found`.

**Files touched**

- `jest.setup.js` (new, repo root)
- `package.json` (only the `jest` block)
- `.eslintrc.js` (one added override)
- `components/__tests__/__snapshots__/StyledText-test.js.snap` (new, generated)
- `components/locales/__tests__/localeParity.test.js` (new)

**The change**

1. `jest.setup.js`, exactly one line, nothing else:

   ```js
   jest.mock('react-native-localize', () => require('react-native-localize/mock'));
   ```

   (`react-native-localize` 3.4.1 ships `mock/index.js`; verified present at
   `node_modules/react-native-localize/mock`.)

2. `package.json`, inside the existing `jest` block, next to `preset`:

   ```json
   "setupFiles": ["<rootDir>/jest.setup.js"]
   ```

   **Verified, do not "fix" it into a preset override**: jest concatenates the
   preset's `setupFiles` with the project's instead of replacing them —
   `node_modules/jest-config/build/normalize.js:272-274` does
   `options.setupFiles = (preset.setupFiles || []).concat(options.setupFiles)`.
   `jest-expo`'s preset supplies two entries that must survive
   (`node_modules/react-native/jest/setup.js` and
   `node_modules/jest-expo/src/preset/setup.js`; checked by requiring
   `jest-expo/jest-preset`). Confirm after the edit with
   `npx jest --showConfig | grep -A4 '"setupFiles"'` and expect three entries,
   ours last.

3. `.eslintrc.js`: after the existing `overrides` entries that match test files,
   add

   ```js
       {
         // Jest setup file, executed before every suite
         files: ['jest.setup.js'],
         env: {
           jest: true,
           node: true,
         },
       },
   ```

   Without it, `eslint:recommended`'s `no-undef` fires on the `jest` global and
   the eslint baseline goes from one error to two. The alternative,
   `/* eslint-env jest */` in the file, would break the "exactly one line" shape
   asked for above.

4. Snapshot: run `npx jest components/__tests__/StyledText-test.js` **without**
   `--ci` once, which writes
   `components/__tests__/__snapshots__/StyledText-test.js.snap` (it has never
   been in git, and `.gitignore` does not ignore `snap`), then `git add` it. From
   this commit on, `npx jest --ci` is the only form used: bare `npx jest` would
   silently rewrite this file instead of failing on a diff.

5. `components/locales/__tests__/localeParity.test.js`. Path, chosen because
   jest's `testMatch` covers `**/__tests__/**/*.js` and the path contains none of
   the three `testPathIgnorePatterns` (`/node_modules/`, `/__rsc_tests__/`,
   `/e2e/`). It imports the three JSON files **directly** (`require('../en.json')`
   etc.) and never imports `components/i18n.ts`, which would pull in
   `react-native-localize` and React Native for no benefit (research Q8).

   Four assertions:

   **a. Key sets are identical.** Build the union of all three, and for each
   language assert nothing is missing, except names listed in `KNOWN_MISSING`.

   **b. No German or Finnish value is byte-identical to the English value** for
   the same key, except names listed in `IDENTICAL_TO_ENGLISH_ALLOWED`.

   **c. Every key used from source exists.** Walk `app/`, `components/` and
   `services/`, skipping `node_modules` and any `__tests__` directory, read
   `*.ts`, `*.tsx`, `*.js`, `*.jsx`, and match
   `/(?:\bt\(|i18n\.t\()\s*'([A-Za-z0-9_]+)'/g`. Every captured key must exist in
   all three files (or be in `KNOWN_MISSING`). Today that is 98 keys.

   **d. Declared exemptions are real.** Assert every name in `KNOWN_MISSING` is
   genuinely missing and every name in `IDENTICAL_TO_ENGLISH_ALLOWED` is
   genuinely identical, so a stale exemption fails rather than rotting. This is
   what makes the list shrink-only.

   Two constant tables at the top, each entry with a reason comment:

   ```js
   // Keys whose absence is a known locale defect, fixed in S2. Must be empty from S2 on.
   const KNOWN_MISSING = [
     'cancel',
     'multiplication_quiz_name',
     'multiplication_quiz_category',
     'multiplication_quiz_label_range',
     'multiplication_range_from',
     'multiplication_range_to',
     'multiplication_range_start',
     'multiplication_mode',
     'multiplication_mode_count',
     'multiplication_mode_timed',
     'multiplication_duration',
   ];

   // Values that may legitimately equal the English value. The brand name, and
   // German for "quiz" is "Quiz".
   const IDENTICAL_TO_ENGLISH_ALLOWED = {
     de: ['quiz_title', 'enable_sound', 'max_level', 'tab_quiz'],
     fi: ['quiz_title'],
   };
   ```

   (The de entries `enable_sound`, `max_level` and `tab_quiz` are the *current*
   state: the first two are defects S2 fixes, `tab_quiz` does not exist yet and
   is listed here so S10 does not have to touch this file. `quiz_title` is
   identical for `fi` today and for `de` after S2.)

   The scan is literal-only by design. Keys built from a template
   (`t(\`achievement_${achievement.id}_name\`)`, `t(\`achievement_category_${category}\`)`)
   and keys passed as a variable (`t(labelKey)` in
   `components/kids/MultiplicationRangeSheet.tsx:120`) are covered by
   assertion (a) plus the derived-key sweep added in S14. Dead keys in the locale
   files are deliberately **not** flagged (`achievements`, `completed`,
   `resets_in`, `explanation`, `Quiz_losses`, `Answers_right`, `Answers_wrong`
   have zero call sites today and stay).

**Automated check**: `npx tsc --noEmit && npx jest --ci` (expect 16 suites,
156 tests, including the new one, zero untracked files afterwards).

**Human check**: `git status --porcelain` shows only the committed files, and
`npx jest --showConfig | grep -A4 setupFiles` lists three setup files with
`jest.setup.js` last.

---

## S2. The locale files

The whole defect list from D2 plus the keys that later slices will read. No
component changes except one, forced by `cancel`.

**Files touched**: `components/locales/en.json`, `components/locales/de.json`,
`components/locales/fi.json`, `components/kids/MultiplicationRangeSheet.tsx`.

**The change**

1. **`de.json:2` `quiz_title`**: `"Quizzy (DE)"` → `"Quizzy"`, so the read-aloud
   TTS at `components/Reader.tsx:49` stops saying "Quizzy (DE)".
2. **`en.json:36-37` un-swap**: `Answers_right` → `"Correct Answers"`,
   `Answers_wrong` → `"Wrong Answers"`. Both keys are dead, so this is latent-bug
   hygiene, not a visible fix.
3. **Add `cancel` to all three**: en `"Cancel"`, de `"Abbrechen"`, fi
   `"Peruuta"`. Then drop the inline default in
   `components/kids/MultiplicationRangeSheet.tsx:147`:
   `t('cancel', 'Abbrechen')` → `t('cancel')`. That is the only component edit in
   this slice; without it, English and Finnish users keep seeing the German word.
4. **Add the 10 `multiplication_*` keys to `en.json` and `fi.json`** (de already
   has them at `de.json:55-64` and is unchanged). Values — en from research Q6,
   fi authored by the implementer to match:

   | key | en | fi |
   | --- | --- | --- |
   | `multiplication_quiz_name` | `Multiplication Tables (1×1 to 10×10)` | `Kertotaulu (1×1–10×10)` |
   | `multiplication_quiz_category` | `🔢 Mathematics` | `🔢 Matematiikka` |
   | `multiplication_quiz_label_range` | `{{from}}×{{from}} to {{to}}×{{to}}` | `{{from}}×{{from}} – {{to}}×{{to}}` |
   | `multiplication_range_from` | `From` | `Alkaen` |
   | `multiplication_range_to` | `To` | `Asti` |
   | `multiplication_range_start` | `Start` | `Aloita` |
   | `multiplication_mode` | `Mode` | `Tila` |
   | `multiplication_mode_count` | `20 problems` | `20 tehtävää` |
   | `multiplication_mode_timed` | `Timed` | `Ajastettu` |
   | `multiplication_duration` | `Duration` | `Kesto` |

   Note that this re-adds two keys that commit `63287c5` deleted on purpose
   (`multiplication_quiz_name`, `multiplication_quiz_category`). D2 overrides: the
   German-only gate at `components/Quizprovider.tsx:94-97` is what made them
   look unused, and on `en`/`fi` i18next currently resolves them to raw key text
   (research Q6, measured).
5. **`day_streak` gets its missing pair** (D2, D5):
   `day_streak` = en `day streak`, de `Tag in Folge`, fi `päivä putkeen`;
   new `days_streak` = en `day streak`, de `Tage in Folge`, fi `päivää putkeen`.
   The English values of the two keys are identical on purpose: English uses the
   same noun phrase after any number. The parity test only compares de/fi against
   en, so this does not trip assertion (b). The component switch that reads the
   pair is in S13, so `days_streak` is unused for one commit.
6. **The 16 German and 18 Finnish wording defects, quoted verbatim from
   `research.md` Q7.** The implementer writes the corrected value for every row;
   the human reviews these 34 values in the diff. Nothing else in `de.json` /
   `fi.json` changes.

   **German (`components/locales/de.json`), 16**

   | # | key | current value | bucket | problem |
   | --- | --- | --- | --- | --- |
   | 1 | `quiz_title` (`de.json:2`) | `Quizzy (DE)` | asymmetry | `en.json:2` and `fi.json:2` both say `Quizzy`; see Q6 |
   | 2 | `reader_mode_desc` (`de.json:42`) | `Text-zu-Sprache-Vorlesung von Fragen und Antworten aktivieren` | mistranslated | `Vorlesung` is a university lecture, not reading aloud; the noun is `Vorlesen` |
   | 3 | `enable_sound` (`de.json:24`) | `Sound` | still English | byte-identical to `en.json:24`; defensible as a Duden loanword, but it is the only untranslated value left |
   | 4 | `max_level` (`de.json:73`) | `Max Level!` | still English | byte-identical to `en.json:63`; same loanword caveat |
   | 5 | `day_streak` (`de.json:68`) | `Tage Serie` | grammar | two bare nouns, no hyphen, no compound; needs `Tage-Serie` or `Tage in Folge` |
   | 6 | `total_xp` (`de.json:71`) | `Gesamt XP` | grammar | `Gesamt` is a bound prefix; needs `Gesamt-XP` or `XP gesamt` |
   | 7 | `keep_playing` (`de.json:79`) | `Weiterspielen zum Entdecken!` | grammar | noun-ised infinitive plus a bare `zum` phrase, not idiomatic |
   | 8 | `resets_in` (`de.json:85`) | `Setzt zurück in` | grammar | "resets back in", incomplete without an object, unusable as a prefix for a duration. Key is dead code (see below), so latent |
   | 9 | `question_to_review` (`de.json:104`) | `Frage zu überprüfen` | grammar | `zu überprüfen` means "to be verified", a different action; also not a countable noun phrase, so a number cannot prefix it |
   | 10 | `questions_to_review` (`de.json:105`) | `Fragen zu überprüfen` | grammar | same defect; called at `LearningTodos.tsx:78` right after `{todos.length}`, printing e.g. `4 Fragen zu überprüfen` |
   | 11 | `progress_info` (`de.json:111`) | `Noch {{remaining}} mal richtig beantworten, um diese Frage zu meistern` | grammar | `mal` should be the noun `Mal` after a number |
   | 12 | `name_helper` (`de.json:120`) | `Dies hilft, dein Erlebnis zu personalisieren` | grammar | word-for-word calque; `Dies hilft` as a sentence opener is stiff |
   | 13 | `enable_notifications_desc` (`de.json:20`) | `Ermöglicht dem Benutzer, Erinnerungsbenachrichtigungen ein- oder auszuschalten` | register | third person while the rest of the file uses `du` (`de.json:51`, `:103`, `:116`, `:119`) |
   | 14 | `show_explanation_desc` (`de.json:23`) | `Ermöglicht dem Benutzer, die Validierung der Antwort auszublenden` | register | same break as row 13 |
   | 15 | `language_helper` (`de.json:117`) | `Du kannst das später in den Einstellungen ändern` | register | capitalised `Du` while `de.json:103` uses lowercase `du` |
   | 16 | `text_input_mode` (`de.json:46`) | `Antwort eintippen` | register | `eintippen` is colloquial; the UI-standard verb is `eingeben`, as in `de.json:118` |

   **Finnish (`components/locales/fi.json`), 18**

   | # | key | current value | bucket | problem |
   | --- | --- | --- | --- | --- |
   | 1 | `enable_sound` (`fi.json:24`) | `käyttöön` | mistranslated | translates "on"/"into use", not "Sound"; the sound settings row reads as a bare `käyttöön`, and it collides with `enable_notifications` `Ota ilmoitukset käyttöön` (`fi.json:18`). Worst value in the file |
   | 2 | `use_flashcards` (`fi.json:21`) | `muistilappuja` | grammar | partitive plural (the counting case), not a standalone label; needs nominative `muistilaput` |
   | 3 | `learning_todos` (`fi.json:91`) | `Oppimistehtävät` | mistranslated | "learning assignments", not learning to-dos; overstates `en.json:90` |
   | 4 | `Quiz_wins` (`fi.json:34`) | `Voitettu` | grammar | past participle ("won"), not a noun; needs `Voitot`. Used at `gamification/GamificationStats.tsx:111` beside a number |
   | 5 | `Quiz_losses` (`fi.json:35`) | `Hävitty` | grammar | same defect; needs `Häviöt` |
   | 6 | `day_streak` (`fi.json:58`) | `päivän sarja` | grammar | genitive and lowercase; rendered at `StreakDisplay.tsx:186` right after the number, so it reads wrong |
   | 7 | `keep_playing` (`fi.json:69`) | `Jatka pelaamista löytääksesi!` | grammar | `löytääksesi` has no object and the sentence stops |
   | 8 | `progress_info` (`fi.json:101`) | `Vastaa oikein vielä {{remaining}} kertaa oppiaksesi tämän kysymyksen` | grammar | missing the verb of what is being learned (`ulkoa`), so it reads "to learn this question"; also less natural word order than `Vastaa vielä oikein` |
   | 9 | `retry_wrong` (`fi.json:103`) | `Yritä vääriä uudelleen` | grammar | bare partitive with no head noun; ungrammatical as a button label |
   | 10 | `resets_in` (`fi.json:75`) | `Nollautuu` | grammar | "resets to zero", drops the "in <time>"; dead key, so latent |
   | 11 | `name_helper` (`fi.json:110`) | `Tämä auttaa personoimaan kokemustasi` | grammar | clunky anglicism (`personoida`) |
   | 12 | `remote_address_desc` (`fi.json:29`) | `URL json-tiedostoon, jossa on tietovisadataa` | grammar | no case government, two nouns in a row; lowercase `json` vs `JSON` elsewhere |
   | 13 | `timer_mode` (`fi.json:50`) | `Quiz-ajastin` | terminology | the file translates "quiz" as `tietovisa` everywhere else (`fi.json:3`, `:32`, `:88`) and switches to the loanword here |
   | 14 | `timer_mode_desc` (`fi.json:51`) | `Aseta aikaraja quizin suorittamiselle. Haasta itsesi!` | terminology | same break (`quizin`) |
   | 15 | `show_explanation` (`fi.json:10`) | `selitys` | capitalisation | lowercase where every other button label is capitalised, and its opposite `hide_explanation` `Piilota selitys` (`fi.json:11`) is capitalised |
   | 16 | `enable_music` (`fi.json:40`) | `musiikki` | capitalisation | lowercase, inconsistent with `Musik` (`de.json:39`) and `Music` (`en.json:39`) |
   | 17 | `score` (`fi.json:12`) and `scores` (`fi.json:13`) | both `Pisteet` | information loss | `en.json:11-12` distinguishes `Score`/`Scores`; Finnish collapses both to the plural, so the singular label becomes "Points" |
   | 18 | `max_level` (`fi.json:63`) | `Max taso!` | grammar | abbreviation glued to a bare noun; Finnish would be `Maksimitaso!` |

   Row 1 of the German table is fix (1) above and row 5 is fix (5); do not do them
   twice. Rows 3 and 4 must end up as German words, not the English loanwords.
7. **Leave every other English value exactly as it is** (D6). That includes the
   `en.json` values that read awkwardly in English — improving English prose is
   out of scope.
8. **Shrink the S1 exemption tables** in
   `components/locales/__tests__/localeParity.test.js`: `KNOWN_MISSING` becomes
   `[]`, and `IDENTICAL_TO_ENGLISH_ALLOWED` becomes
   `{ de: ['quiz_title', 'tab_quiz'], fi: ['quiz_title'] }`. Assertion (d) from S1
   forces this; if it fails, the fix above is incomplete.

**Automated check**: `npx tsc --noEmit && npx jest components/locales/__tests__/localeParity.test.js --ci && npx jest --ci`.

**Human check**: read only the changed lines of `de.json` and `fi.json` — 34
rewritten values, ten new keys per file, one brand string — and confirm each new
German/Finnish value reads as that language's normal UI wording.

---

## S3. Multiplayer screens

66 strings, the two largest live files. Also the slice the e2e spec watches: five
of its eight pinned literals are hardcoded in these two files
(`app/multiplayer/index.tsx:231,289`, `app/multiplayer/[code].tsx:648,728,771`).

**Files touched**: `app/multiplayer/index.tsx` (26),
`app/multiplayer/[code].tsx` (40).

**The change**

1. Add `const { t } = useTranslation()` to both components (D8). Neither imports
   it today.
2. `index.tsx`, literal → key (line numbers today):

   | line | literal | key | en value |
   | --- | --- | --- | --- |
   | 127, 155 | `Required` | `multiplayer_required` | `Required` |
   | 127, 155 | `Please enter your name` | `multiplayer_enter_name_body` | `Please enter your name` |
   | 141, 145, 198 | `Cannot create a room` | `multiplayer_cannot_create` | `Cannot create a room` |
   | 171, 175 | `Cannot join` | `multiplayer_cannot_join` | `Cannot join` |
   | 202 | `Cannot send invite` | `multiplayer_cannot_invite` | `Cannot send invite` |
   | 231 | `Multiplayer Quiz` | `multiplayer_title` | `Multiplayer Quiz` |
   | 233-234 | `Multiplayer needs a browser. Open the web version to play with a friend.` | `multiplayer_needs_browser` | same sentence, one line |
   | 242 | `Open the web version` | `multiplayer_open_web` | `Open the web version` |
   | 262 | `⚔️ Multiplayer Quiz` | `multiplayer_title` + emoji in JSX | `Multiplayer Quiz` |
   | 266 | `Your Name` | `multiplayer_your_name` | `Your Name` |
   | 269 | `Enter your name` (placeholder) | `multiplayer_enter_name` | `Enter your name` |
   | 289 | `🚀 Create New Game` | `multiplayer_create_game` | `Create New Game` |
   | 303 | `📬 Incoming Invites` | `multiplayer_incoming_invites` | `Incoming Invites` |
   | 308 | ` invited you!` after `{invite.fromName}` | `multiplayer_invited_you` | `{{name}} invited you!` |
   | 315 | `Accept` | `multiplayer_accept` | `Accept` |
   | 321 | `Decline` | `multiplayer_decline` | `Decline` |
   | 332 | `🟢 Active Players in Lobby` | `multiplayer_active_players` | `Active Players in Lobby` |
   | 343-344 | `Enter your name above to enter the lobby and see who is online.` | `multiplayer_lobby_hint` | same |
   | 348-349 | `No one else is online right now. Waiting for players... Ask the host for their invite link to join.` | `multiplayer_lobby_empty` | same |
   | 371 | `Join` / `Invite` ternary | `multiplayer_join` / `multiplayer_invite` | `Join` / `Invite` |

   `:308` currently bakes word order into JSX; pass `{ name: invite.fromName }`.
   `showAlert` itself (`:26-34`) needs no change: it takes its title and body as
   arguments, so the caller translates and the wrapper stays language-neutral.
3. `[code].tsx`, literal → key:

   | line | literal | key | en value |
   | --- | --- | --- | --- |
   | 44-49 | `` `${minutes}m ${secs}s` `` / `` `${secs}s` `` | `multiplayer_time_min_sec` / `multiplayer_time_sec` | `{{minutes}}m {{seconds}}s` / `{{seconds}}s` |
   | 161 | `Leave Game?` | `multiplayer_leave_title` | `Leave Game?` |
   | 161 | `Are you sure you want to leave?` | `multiplayer_leave_body` | `Are you sure you want to leave?` |
   | 162 | `Cancel` | `cancel` (from S2) | `Cancel` |
   | 164 | `Leave` | `multiplayer_leave` | `Leave` |
   | 342 | `Select Quiz` (alert title) | `multiplayer_select_quiz_title` | `Select Quiz` |
   | 342 | `Please select a quiz first` | `multiplayer_select_quiz_first` | `Please select a quiz first` |
   | 434 | `🏆 Game Over!` | `multiplayer_game_over` | `Game Over!` |
   | 434 | `⏳ Waiting for opponent...` | `multiplayer_waiting_opponent` | `Waiting for opponent...` |
   | 443 | `You Win!` | `multiplayer_you_win` | `You Win!` |
   | 443 | `` `${winner.name} Wins!` `` | `multiplayer_player_wins` | `{{name}} Wins!` |
   | 449 | `Final Scores` | `multiplayer_final_scores` | `Final Scores` |
   | 465 | `(You)` | `multiplayer_you_suffix` | `(You)` |
   | 469 | `Finished in ` before `{formatTime(...)}` | `multiplayer_finished_in` | `Finished in {{time}}` |
   | 473 | `Still playing...` | `multiplayer_still_playing` | `Still playing...` |
   | 492 | `🏠 Back to Lobby` | `multiplayer_back_to_lobby` | `Back to Lobby` |
   | 516 | `The host connection dropped.` | `multiplayer_host_dropped` | `The host connection dropped.` |
   | 522 | `Rejoin` | `multiplayer_rejoin` | `Rejoin` |
   | 585 | `Enter your name to join` | `multiplayer_enter_name_join` | `Enter your name to join` |
   | 588 | `Enter your name` (placeholder) | `multiplayer_enter_name` (reuse) | `Enter your name` |
   | 604 | `Join` | `multiplayer_join` (reuse) | `Join` |
   | 613, 757 | `Try again` | `multiplayer_retry` | `Try again` |
   | 648 | `Room: ` before `{code}` | `multiplayer_room` | `Room:` (render `{t('multiplayer_room')} {code}`) |
   | 660 | `Link copied` / `Copy link` | `multiplayer_link_copied` / `multiplayer_copy_link` | same |
   | 669 | `Share` | `multiplayer_share` | `Share` |
   | 676 | `Players:` | `multiplayer_players` | `Players:` |
   | 689 | `Left` / `✅ Ready` | `multiplayer_left` / `multiplayer_ready` | `Left` / `Ready` |
   | 696 | `Waiting for opponent...` | `multiplayer_waiting_opponent` (reuse) | same |
   | 710 | `Selected Quiz: ` + `None selected` | `multiplayer_selected_quiz` / `multiplayer_none_selected` | `Selected Quiz:` / `None selected` |
   | 716 | `📚 Select Quiz` | `multiplayer_select_quiz` | `Select Quiz` |
   | 728 | `🎮 Start Game` | `multiplayer_start_game` | `Start Game` |
   | 733 | `Send your opponent the room link to join` | `multiplayer_share_hint` | same |
   | 771 | `Waiting for host to start...` | `multiplayer_waiting_host` | `Waiting for host to start...` |
   | 780 | `Quiz: ` before `{selectedQuiz.name}` | `multiplayer_quiz_label` | `Quiz:` |
   | 795 | `Select a Quiz` | `multiplayer_select_quiz_overlay` | `Select a Quiz` |
   | 807 | `Cancel` | `cancel` (reuse) | `Cancel` |

   `formatTime` is a module-level helper, so it cannot call `t()`. Return the two
   numbers and translate at the call site: either give it an injected translator
   or render `t('multiplayer_time_min_sec', { minutes, seconds })` at `:469`;
   prefer the second, it keeps the helper pure.
4. Every `de`/`fi` value is authored in this commit. The German and Finnish
   strings for the eight e2e-pinned items must still read as normal UI wording —
   the e2e suite runs in English only, so it constrains `en.json`, not these.

**Automated check**: `npx tsc --noEmit && npx jest --ci`, plus the e2e literal
check from the risk register.

**Human check**: open `/multiplayer` and `/multiplayer/ABC123` in the web build
with the language set to German, and confirm no English and no raw `snake_case`
key is visible on either screen.

---

## S4. Multiplayer rules, failures and the scoreboard (D3)

The one slice where English text is pinned by unit tests, so it is deliberately
kept apart from the screens: if it goes wrong, the failure is local.

**Files touched**: `services/multiplayerFailures.ts` (8),
`services/multiplayerRules.ts` (5), `components/MultiplayerScoreboard.tsx` (5).

**The change**

1. Both services get `import i18n from '@/components/i18n';` — the alias is
   already used by `services/MultiplicationQuiz.ts:1`, and
   `components/i18n.ts` imports nothing from `components/` or `app/`, so no cycle
   can form (research Q5). Call `i18n.t(...)` **inside** the functions, never at
   module scope.
2. `failureMessage` keeps its switch, one `i18n.t` per branch, so the comment's
   promise ("a wrong sentence can only come from a wrong cause") still holds and
   TypeScript still proves exhaustiveness:

   | branch | key | en value |
   | --- | --- | --- |
   | `bad-code` | `multiplayer_failure_bad_code` | `A room code is six letters and numbers` |
   | `room-not-found` | `multiplayer_failure_room_not_found` | `No room with that code` |
   | `room-full` | `multiplayer_failure_room_full` | `This room is already full` |
   | `incompatible` | `multiplayer_failure_incompatible` | `This device cannot do multiplayer` |
   | `network` | `multiplayer_failure_network` | `Cannot reach the server, check the connection` |
   | `connect-failed` | `multiplayer_failure_connect_failed` | `Could not connect, try again` |
   | `timeout` | `multiplayer_failure_timeout` | `The room did not answer` |
   | `could-not-create` | `multiplayer_failure_could_not_create` | `Could not create a room, try again` |

   The en values are byte-identical to today's literals, because
   `services/__tests__/multiplayerFailures.test.js:51` asserts
   `'This room is already full'` with the jest setup file pinning `en`.
3. `leadLabel` (`services/multiplayerRules.ts:128-133`) becomes four returns:

   ```ts
   if (!you || !rival) return i18n.t('multiplayer_lead_waiting');
   if (rival.left) return i18n.t('multiplayer_lead_opponent_left');
   if (ahead === 'rival') return i18n.t('multiplayer_lead_behind', { lead: -lead });
   return ahead === 'you'
     ? i18n.t('multiplayer_lead_ahead', { lead })
     : i18n.t('multiplayer_lead_tied');
   ```

   with the five keys and values from the naming section. Interpolation with
   `escapeValue: false` (`components/i18n.ts:41-43`) reproduces
   `You're ahead by 2` and `2 behind` exactly, so
   `services/__tests__/multiplayerRules.test.js:266-294` stays green.
4. `components/MultiplayerScoreboard.tsx`: add `useTranslation`, replace
   `Left`/`Finished`/`You` at `:26,:28,:34` with `multiplayer_left`,
   `multiplayer_status_finished`, `multiplayer_you`, and the progress badge at
   `:30` with `multiplayer_progress`. Keep `⚔️` in JSX (rule 5). `leadLabel` is
   imported and called as before — it now returns translated text.
5. German and Finnish for all 18 values, authored here.

**Automated check**: `npx jest services/__tests__/multiplayerRules.test.js services/__tests__/multiplayerFailures.test.js --ci && npx tsc --noEmit && npx jest --ci`.

**Human check**: the two service test suites still pass with no edit to the test
files themselves.

---

## S5. Settings and the update path

37 strings: the settings screen (36, of which 3 are quiz content, see
"Deviations") plus the three thrown `Error` messages in
`services/androidUpdate.ts` that reach the user through
`Alert.alert('Update failed', msg)` at `app/(tabs)/settings.tsx:110`.

**Files touched**: `app/(tabs)/settings.tsx`, `services/androidUpdate.ts`.

**The change**

1. Settings already has `useTranslation` (`:6`, `:56`). Replace, in place:

   | line | literal | key | en value |
   | --- | --- | --- | --- |
   | 91 | `No published Android build found.` | `settings_update_no_build` | same |
   | 94 | `Unable to check for updates.` | `settings_update_check_failed` | same |
   | 108 | `Failed to install update.` | `settings_update_install_failed` | same |
   | 110 | `Update failed` (title) | `settings_update_failed` | `Update failed` |
   | 486 | `Checking for updates…` | `settings_checking_updates` | `Checking for updates…` |
   | 487 | `Latest build: ` | `settings_latest_build` | `Latest build: {{version}} (build #{{code}})` |
   | 490 | `Installed build: ` | `settings_installed_build` | `Installed build:` |
   | 490 | `unknown` | `settings_unknown` | `unknown` |
   | 506 | `Download & Install` | `settings_download_install` | `Download & Install` |
   | 511 | `Up to date` | `settings_up_to_date` | `Up to date` |
   | 519 | `Check` | `settings_check` | `Check` |
   | 155, 167 | `Error` (title) | `settings_error` | `Error` |
   | 155 | `Failed to load or create user quizzes` | `settings_user_quizzes_load_failed` | same |
   | 167 | `Failed to save user quizzes` | `settings_user_quizzes_save_failed` | same |
   | 304 | `🎨 Kids Mode` | `settings_kids_mode` | `Kids Mode` |
   | 306-307 | `Größere Feiern, Streak-Haustier und buntere Animationen für Kinder` | `settings_kids_mode_desc` | `Bigger celebrations, a streak pet and more colourful animations for kids` |
   | 373 | `TTS Voice` | `settings_tts_voice` | `TTS Voice` |
   | 394 | `Default Voice` | `settings_default_voice` | `Default Voice` |
   | 411 | `Test Voice` | `settings_test_voice` | `Test Voice` |
   | 413-414 | `Test the selected voice. On mobile devices, this also enables TTS functionality.` | `settings_test_voice_desc` | same |
   | 420 | `Hello! This is a test of the text-to-speech voice.` | `settings_test_voice_text` | same |
   | 439 | `Test` | `settings_test` | `Test` |
   | 447 | `Enable User Quizzes` | `settings_enable_user_quizzes` | same |
   | 449-450 | `Load quizzes from your own quizzes_user.json file in addition to the language-specific quizzes.` | `settings_enable_user_quizzes_desc` | same |
   | 465 | `Edit User Quizzes` | `settings_edit_user_quizzes` | same |
   | 467 | `Open a dialog to edit your quizzes_user.json file.` | `settings_edit_user_quizzes_desc` | same |
   | 474 | `Edit` | `settings_edit` | `Edit` |
   | 482 | `App Updates` | `settings_app_updates` | `App Updates` |
   | 570 | `Edit quizzes_user.json` | `settings_edit_json_title` | same |
   | 595 | `Cancel` | `cancel` (reuse, S2) | `Cancel` |
   | 598 | `Save` | `save` (existing key) | `Save` |

   Two things need care: `:398` `` `${voice.name} (${voice.lang})` `` stays
   untranslated (OS-provided names, only the parentheses are ours), and the
   `Picker.Item` labels at `:357-364` already read `${n} ${t('minutes')}`.
2. `settings_kids_mode_desc` is the one place where the **English is new copy**:
   the literal at `:306-307` is German, so there is no English original to keep
   byte-for-byte. Author en, keep de as the literal minus nothing, author fi.
3. `services/androidUpdate.ts`: add `import i18n from '@/components/i18n';` and
   translate the three thrown messages at `:84`, `:89`, `:96`:
   `settings_update_android_only` ("APK install is only available on Android."),
   `settings_update_no_storage` ("No writable storage directory available."),
   `settings_update_download_failed` ("APK download failed (HTTP {{status}}).").
   These messages are shown verbatim as the alert body
   (`app/(tabs)/settings.tsx:106-110`), so they are interface, not logs. They sit
   outside the 491 count; see "Deviations".
4. German and Finnish authored for all of the above.

**Automated check**: `npx tsc --noEmit && npx jest --ci`.

**Human check**: in the web build with Finnish selected, open Settings and read
the Kids Mode row, the TTS block and the App Updates block; no English is left.

---

## S6. Kids mode

29 strings across two components. The interesting part is that
`components/kids/StreakPet.tsx` is hardcoded **German**, so the German values
already exist as literals while the English and Finnish ones are invented here.

**Files touched**: `components/kids/StreakPet.tsx` (24),
`components/kids/CelebrationOverload.tsx` (5).

**The change**

1. `StreakPet`: `PET_STAGES` (`:10-67`) is module scope, so it may only carry keys.
   Reduce each entry to `{ minStreak, emoji, color, nameKey, messageKey }` and
   resolve at render time. 16 keys, derived from `minStreak`:
   `kids_pet_0_name` `Ei`, `kids_pet_0_message`
   `Spiele täglich, um mich schlüpfen zu sehen!`, `kids_pet_1_name` `Küken`,
   `kids_pet_1_message` `Ich bin geschlüpft! Spiel weiter!`, `kids_pet_3_name`
   `Jungvogel`, `kids_pet_3_message`
   `Ich wachse! Noch 4 Tage bis zum nächsten Level!`, `kids_pet_7_name`
   `Weise Eule`, `kids_pet_7_message`
   `Du bist toll! Ich bin jetzt eine weise Eule!`, `kids_pet_14_name` `Einhorn`,
   `kids_pet_14_message` `Magisch! Du hast 14 Tage geschafft!`,
   `kids_pet_30_name` `Drache`, `kids_pet_30_message`
   `FEUER! 30 Tage — ich bin jetzt ein Drache! 🐉🔥`, `kids_pet_60_name`
   `Sternenwesen`, `kids_pet_60_message` `Legendär! 60 Tage in Folge!`,
   `kids_pet_100_name` `König`, `kids_pet_100_message`
   `Der Quiz-König! 100 Tage! 👑`.
   TypeScript must allow the key to be built from the stage: type the field as
   `` `kids_pet_${number}_name` `` or keep two literal fields per entry; do not
   widen to plain `string` and lose the `t()` typing.
   Note the two messages with a number and an emoji baked into the German
   (`:30`, `:51`) — keep those two values exactly as they are and let the en/fi
   copy carry the same numbers.
2. `StreakPet` inline strings:
   `:256` `Schlafend...` → `kids_pet_sleeping`;
   `:259` `🔥 {n} Tag{e} in Folge` → `🔥 {currentStreak} ` plus the D5 two-key
   ternary `currentStreak === 1 ? t('kids_pet_day_in_streak') : t('kids_pet_days_in_streak')`
   where de is `Tag in Folge`/`Tage in Folge`, en `day in a row`/`days in a row`,
   fi `päivä putkeen`/`päivää putkeen`;
   `:263` `⚠️ Heute noch nicht gespielt! …` → `kids_pet_not_played_today` (emoji in
   JSX);
   `:269` `Noch {n} Tag{e} bis zum {emoji} {name}!` → the pair
   `kids_pet_next_stage_one` = `Noch {{days}} Tag bis zum {{next}}!` and
   `kids_pet_next_stage_other` = `Noch {{days}} Tage bis zum {{next}}!`, with
   `next` passed as `` `${nextStage.emoji} ${nextStage.name}` `` (a name that is
   itself already translated);
   `:275` `👑 Du hast alle Level erreicht! Legendär!` → `kids_pet_all_levels`
   (emoji in JSX);
   `:281` `Dein Haustier schläft... Spiel ein Quiz zum Aufwecken!` →
   `kids_pet_sleeping_message`.
   That is 24 strings, all of `:256-281` plus the 16 stage fields.
3. `CelebrationOverload.tsx:414-419`: the pool mixes English and German. Replace
   the array with five keys `kids_celebration_1` … `kids_celebration_5` and keep
   the emoji in JSX, so the pool becomes
   `[{ key: 'kids_celebration_1', emoji: '🦄' }, …]` and the render is
   `` {`${t(key)} ${emoji}`} ``. German values: `SUPER!`, `WOOOHOO!`, `TOLL!`,
   `GENIAL!`, `KLASSE!` (today's words); en and fi invented in this commit. Note
   `useState` picks one entry once (`:413`), which is fine: the words are chosen
   per language at mount.

**Automated check**: `npx tsc --noEmit && npx jest --ci`.

**Human check**: on the Quiz tab with a streak, switch language three times and
confirm the pet name, the streak line and the celebration words all change.

---

## S7. The Learn hub

23 strings. This slice also defines the five mode titles and descriptions that
S8 and S9 reuse, so it must land before them.

**Files touched**: `app/(tabs)/learn.tsx`.

**The change**: add `useTranslation`, then

| line | literal | key | en value |
| --- | --- | --- | --- |
| 69 | `Daily Warmup` | `learn_mode_warmup_title` | `Daily Warmup` |
| 71 | `Spaced repetition practice on questions you've answered before` | `learn_mode_warmup_desc` | same |
| 78 | `Mental Compiler` | `learn_mode_compiler_title` | `Mental Compiler` |
| 79 | `Predict code output to build your mental execution model` | `learn_mode_compiler_desc` | same |
| 86 | `Parsons Problems` | `learn_mode_parsons_title` | `Parsons Problems` |
| 87 | `Arrange scrambled code lines into the correct order` | `learn_mode_parsons_desc` | same |
| 94 | `Scaffolded Learning` | `learn_mode_faded_title` | `Scaffolded Learning` |
| 96 | `Study complete examples, then fill in progressively more blanks` | `learn_mode_faded_desc` | same |
| 103 | `Bug Hunter` | `learn_mode_bughunter_title` | `Bug Hunter` |
| 104 | `Find the bug in seemingly correct code` | `learn_mode_bughunter_desc` | same |
| 120 | `All Categories` | `learn_category_all` | `All Categories` |
| 185 | `🧠 Enhanced Learning` | `learn_title` | `Enhanced Learning` |
| 187 | `Science-backed methods for maximum retention` | `learn_subtitle` | same |
| 193 | `📚 Category Filter` | `learn_category_filter` | `Category Filter` |
| 221 | ` quizzes • ` | `learn_count_quizzes` | `{{count}} quizzes` |
| 226 | `questions` | `learn_count_questions` | `{{count}} questions` |
| 234 | `TIER 1` | `learn_tier_1_label` | `TIER 1` |
| 236 | `High Efficiency` | `learn_tier_1_title` | `High Efficiency` |
| 239 | `Low cognitive load, high learning ROI` | `learn_tier_1_desc` | same |
| 279 | `TIER 2` | `learn_tier_2_label` | `TIER 2` |
| 282 | `Deep Learning` | `learn_tier_2_title` | `Deep Learning` |
| 285 | `For mastering patterns after grasping basics` | `learn_tier_2_desc` | same |
| 323-324 | `Daily Warmup adapts to your quiz performance using spaced repetition. The more you practice, the smarter it gets!` | `learn_footer` | same |

The mode title/description pairs are plain strings in `learningOptions`
(`:68-108`), which is inside the component, so `t()` is safe there. Keep the
`id`, `icon`, `color` and `tier` fields untouched. `:221`/`:226` become one line:

```tsx
{t('learn_count_quizzes', { count: filteredQuizzes.length })} •{' '}
{t('learn_count_questions', { count: totalQuestions })}
```

German and Finnish authored for all 23.

**Automated check**: `npx tsc --noEmit && npx jest --ci`.

**Human check**: the Learn tab in Finnish shows five mode cards, two tier headers
and a category chip all in Finnish.

---

## S8. Learning modes, part 1: Bug Hunter and Parsons Problems

44 strings, two files, no translation machinery at all today.

**Files touched**: `components/learning/DebuggingExercise.tsx` (23),
`components/learning/ParsonsProblems.tsx` (21).

**The change**: add `useTranslation` to each, then

`DebuggingExercise.tsx`

| line | literal | key | en value |
| --- | --- | --- | --- |
| 72 | `` `// Concept: ${line}` `` | `debug_concept_comment` | `// Concept: {{concept}}` |
| 72 | `` `// ${line}` `` | `debug_plain_comment` | `// {{line}}` |
| 79 | `` `// ❌ Wrong: ${answer}` `` | `debug_wrong_comment` | `// ❌ Wrong: {{answer}}` |
| 88 | `The correct answer is: ${answer}. ${explanation}` | `debug_result_body` | `The correct answer is: {{answer}}. {{explanation}}` |
| 89 | `// ✅ Correct: ${answer}\n${explanation}` | `debug_fixed_body` | `// ✅ Correct: {{answer}}\n{{explanation}}` |
| 151 | `Bug Hunt Complete!` | `debug_complete` | same |
| 153 | `{n} / {m} bugs found ({p}%)` | `debug_score_line` | `{{correct}} / {{total}} bugs found ({{percent}}%)` |
| 157 | `You're a debugging master! 🐛🔍` | `debug_praise_90` | `You're a debugging master!` + emoji in JSX |
| 159 | `Great bug detection skills! 🎯` | `debug_praise_70` | `Great bug detection skills!` |
| 161 | `Keep hunting those bugs! 💪` | `debug_praise_50` | `Keep hunting those bugs!` |
| 162 | `Practice makes a better debugger! 🔧` | `debug_praise_else` | `Practice makes a better debugger!` |
| 167 | `Back` | `learning_back` | `Back` |
| 171 | `Try Again` | `learning_try_again` | `Try Again` |
| 189 | `🐛 Bug Hunter` | `learn_mode_bughunter_title` (reuse) | `Bug Hunter` |
| 215 | `👆 Tap the line with the bug` | `debug_instruction` | `Tap the line with the bug` |
| 226 | `buggy_code.js` | leave as literal | file name, not copy |
| 281 | `🎯 Bug Found!` | `debug_bug_found` | `Bug Found!` |
| 281 | `❌ Wrong Line` | `debug_wrong_line` | `Wrong Line` |
| 297 | `Hide Fix` / `Show Fixed Code` | `debug_hide_fix` / `debug_show_fix` | same |
| 303 | `✅ Fixed Code:` | `debug_fixed_code_title` | `Fixed Code:` |
| 315 | `Next Bug` | `debug_next` | `Next Bug` |
| 316 | `See Results` | `learning_see_results` | `See Results` |

`ParsonsProblems.tsx`

| line | literal | key | en value |
| --- | --- | --- | --- |
| 191 | `Parsons Complete!` | `parsons_complete` | same |
| 193 | `{n} / {m} correct ({p}%)` | `learning_score_line` (shared) | `{{correct}} / {{total}} correct ({{percent}}%)` |
| 197 | `Master code organizer! 🏆` | `parsons_praise_90` | `Master code organizer!` |
| 199 | `Great logical thinking! 🎯` | `parsons_praise_70` | `Great logical thinking!` |
| 201 | `Good progress! Keep practicing 💪` | `parsons_praise_50` | `Good progress! Keep practicing` |
| 202 | `Focus on the structure! 📚` | `parsons_praise_else` | `Focus on the structure!` |
| 207 | `Back` | `learning_back` (reuse) | `Back` |
| 211 | `Try Again` | `learning_try_again` (reuse) | `Try Again` |
| 227 | `📦 Parsons Problems` | `learn_mode_parsons_title` (reuse) | `Parsons Problems` |
| 254 | `📝 Your Solution (tap to remove)` | `parsons_solution_title` | `Your Solution (tap to remove)` |
| 259 | `Tap lines below to add them here...` | `parsons_solution_empty` | same |
| 299 | `🧩 Available Lines (tap to add)` | `parsons_pool_title` | `Available Lines (tap to add)` |
| 313 | `All lines placed! Check your answer.` | `parsons_pool_empty` | same |
| 322 | `Reset` | `parsons_reset` | `Reset` |
| 333 | `Check Answer` | `parsons_check` | `Check Answer` |
| 346 | `✅ Perfect Order!` | `parsons_correct` | `Perfect Order!` |
| 346 | `❌ Not Quite Right` | `parsons_wrong` | `Not Quite Right` |
| 350 | `You arranged all the code lines correctly!` | `parsons_correct_body` | same |
| 351 | `Some lines are in the wrong position. The correct positions are highlighted.` | `parsons_wrong_body` | same |
| 356 | `Next Problem` | `parsons_next` | `Next Problem` |
| 357 | `See Results` | `learning_see_results` (reuse) | `See Results` |

`:254`, `:299` and `:322` are the first three things a `de`/`fi` user sees on
this screen, and `styles.sectionTitle` uppercases them (`:435`) — check the
German after uppercasing still reads.

The five praise branches form a percentage ladder (`>= 90`, `>= 70`, `>= 50`,
else). Keep the thresholds; only the four returned strings and the emoji move.
German and Finnish authored for all 44.

**Automated check**: `npx tsc --noEmit && npx jest --ci`.

**Human check**: run Bug Hunter and Parsons Problems to the results screen in
German and confirm the score line and the praise line are both German.

---

## S9. Learning modes, part 2: Mental Compiler, Faded Examples, Daily Warmup

51 strings, three files, again zero coverage today.

**Files touched**: `components/learning/CodeTracing.tsx` (15),
`components/learning/FadedExamples.tsx` (19),
`components/learning/SRSDailyWarmup.tsx` (17).

**The change**: add `useTranslation` to each, then

`CodeTracing.tsx`

| line | literal | key | en value |
| --- | --- | --- | --- |
| 67 | `This is the correct answer.` | `tracing_default_explanation` | same |
| 128 | `Code Tracing Complete!` | `tracing_complete` | same |
| 130 | `{n} / {m} correct ({p}%)` | `learning_score_line` (reuse) | `{{correct}} / {{total}} correct ({{percent}}%)` |
| 134 | `You're a mental compiler! 🧠` | `tracing_praise_90` | `You're a mental compiler!` |
| 136 | `Great mental model! 🎯` | `tracing_praise_70` | `Great mental model!` |
| 138 | `Keep building that mental model 💪` | `tracing_praise_50` | `Keep building that mental model` |
| 139 | `Practice makes the mental compiler stronger! 🔧` | `tracing_praise_else` | same, emoji apart |
| 144 | `Back` | `learning_back` (reuse) | `Back` |
| 148 | `Try Again` | `learning_try_again` (reuse) | `Try Again` |
| 164 | `🧠 Mental Compiler` | `learn_mode_compiler_title` (reuse) | `Mental Compiler` |
| 192 | `script.js` | leave as literal | file name |
| 265 | `✅ Correct! You traced it right.` | `tracing_correct` | `Correct! You traced it right.` |
| 266 | `❌ Not quite. Here's the trace:` | `tracing_wrong` | `Not quite. Here's the trace:` |
| 274 | `Next Challenge` | `tracing_next` | `Next Challenge` |
| 275 | `See Results` | `learning_see_results` (reuse) | `See Results` |

`FadedExamples.tsx`

| line | literal | key | en value |
| --- | --- | --- | --- |
| 79 | `Read and understand the concept.` | `faded_stage_1_desc` | same |
| 92 | `Fill in the key term.` | `faded_stage_2_desc` | same |
| 210 | `fill in...` (placeholder) | `faded_blank_placeholder` | `fill in...` |
| 246 | `Scaffolding Complete!` | `faded_complete` | same |
| 248 | `{n} / {m} stages correct ({p}%)` | `faded_score_line` | `{{correct}} / {{total}} stages correct ({{percent}}%)` |
| 253 | `You've mastered these patterns! 🏆` | `faded_praise_90` | `You've mastered these patterns!` |
| 255 | `Great understanding! 🎯` | `faded_praise_70` | `Great understanding!` |
| 256 | `Keep practicing these patterns! 📚` | `faded_praise_else` | `Keep practicing these patterns!` |
| 261 | `Back` | `learning_back` (reuse) | `Back` |
| 265 | `Start Over` | `faded_start_over` | `Start Over` |
| 282 | `📖 Faded Examples` | `faded_title` | `Faded Examples` |
| 324 | `Stage {a} of {b}` | `faded_stage_progress` | `Stage {{current}} of {{total}}` |
| 344 | `✅ Perfect!` | `faded_correct` | `Perfect!` |
| 344 | `❌ Not quite right` | `faded_wrong` | `Not quite right` |
| 348 | `Correct answers:` | `faded_correct_answers` | `Correct answers:` |
| 363 | `Check Answers` | `faded_check` | `Check Answers` |
| 371 | `Next Stage` | `faded_next_stage` | `Next Stage` |
| 373 | `Next Example` | `faded_next_example` | `Next Example` |
| 374 | `Finish` | `learning_finish` | `Finish` |

`SRSDailyWarmup.tsx`

| line | literal | key | en value |
| --- | --- | --- | --- |
| 129 | `Loading your daily warmup...` | `warmup_loading` | same |
| 139 | `All caught up! 🎉` | `warmup_caught_up` | `All caught up!` |
| 141 | `No questions due for review right now.` | `warmup_nothing_due` | same |
| 143-147 | `📊 {tracked} questions tracked • {mastered} mastered` | `warmup_stats` | `{{tracked}} questions tracked • {{mastered}} mastered` |
| 149, 181 | `Back to Learn` | `warmup_back` | `Back to Learn` |
| 166 | `Warmup Complete!` | `warmup_complete` | same |
| 168 | `{n} / {m} correct ({p}%)` | `learning_score_line` (reuse) | `{{correct}} / {{total}} correct ({{percent}}%)` |
| 172 | `Outstanding! 🌟` | `warmup_praise_90` | `Outstanding!` |
| 174 | `Great job! 👏` | `warmup_praise_70` | `Great job!` |
| 176 | `Good effort! Keep practicing 💪` | `warmup_praise_50` | `Good effort! Keep practicing` |
| 177 | `Keep at it! Practice makes perfect 📚` | `warmup_praise_else` | `Keep at it! Practice makes perfect` |
| 194 | `Daily Warmup` | `learn_mode_warmup_title` (reuse) | `Daily Warmup` |
| 273 | `✅ Correct!` | `warmup_correct` | `Correct!` |
| 274 | `❌ Incorrect` | `warmup_wrong` | `Incorrect` |
| 282 | `Next Question` | `warmup_next` | `Next Question` |
| 283 | `Finish` | `learning_finish` (reuse) | `Finish` |

Question and answer text at `SRSDailyWarmup.tsx:222,223,257,277` is quiz content
and stays. German and Finnish authored for all 51.

**Automated check**: `npx tsc --noEmit && npx jest --ci`.

**Human check**: with a question due, the Daily Warmup screen in German shows a
German loading state, header, buttons and results; nothing English is left.

---

## S10. App shell: tabs, 404, modal, template prose, onboarding

18 strings across five small files. Every one of them is reachable from the UI.

**Files touched**: `app/(tabs)/_layout.tsx`, `app/+not-found.tsx`,
`app/modal.tsx`, `components/EditScreenInfo.tsx`, `components/Onboarding.tsx`.

**The change**

1. `app/(tabs)/_layout.tsx`: add `useTranslation` to `TabLayout` and set
   `title: t('tab_quiz')`, `t('tab_learn')`, `t('tab_profile')`,
   `t('tab_settings')` for `:91`, `:112`, `:121`, `:130`. `tab_settings` is a new
   key rather than a reuse of `settings`, so the tab label and the screen heading
   can diverge later; en `Settings`, de `Einstellungen`, fi `Asetukset`. German
   `tab_quiz` is `Quiz`, identical to English — that entry is already in the S1
   allowlist.
2. `app/+not-found.tsx`: `Oops!` (`:9`, `<Stack.Screen options={{title}}>`) →
   `not_found_title`; `This screen doesn't exist.` (`:11`) →
   `not_found_body`; `Go to home screen!` (`:14`) → `not_found_home`.
3. `app/modal.tsx`: `Modal` (`:10`) → `modal_title`. The `path="app/modal.tsx"`
   at `:16` stays a literal: it is a file path rendered as code, not copy.
4. `components/EditScreenInfo.tsx` (D9, kept and translated): `Open up the code
   for this screen:` (`:19-21`) → `edit_info_open_code`; `Change any of the text,
   save the file, and your app will automatically update.` (`:31-34`) →
   `edit_info_change_text` (the en value is the rendered, whitespace-collapsed
   sentence); `Tap here if your app doesn't automatically update after making
   changes` (`:45-47`) → `edit_info_tap_here`. The `path` prop stays untranslated.
5. `components/Onboarding.tsx`:
   - `:57` the brand `Quizzy` → reuse the existing `quiz_title` key (all three
     locales already say `Quizzy`, so nothing new is written).
   - `:74-76` the three language items → reuse the existing `english`, `german`,
     `finnish` keys, exactly as the Settings picker does at
     `app/(tabs)/settings.tsx:194-196`. A language picker that shows the
     localized name is consistent with the rest of the app; the alternative
     (endonyms `English`/`Deutsch`/`Suomi` behind three new keys) is rejected here
     because it would add three keys whose values must be identical to English
     and it would disagree with the Settings picker. See "Unresolved" item 4.
   - Everything else in the file already calls `t()` with an English default; the
     defaults stay, nobody is asked to delete them.

German and Finnish authored for the 15 genuinely new keys (all except
`tab_settings`, which is also new: 16).

**Automated check**: `npx tsc --noEmit && npx jest --ci`.

**Human check**: on the web build in Finnish, the four tab labels, `/does-not-exist`
and the info modal are all Finnish.

---

## S11. Quiz chrome: home, Question, Score, QuizSelection, Explanation, Reader

24 strings across eight files, all reachable from taking a quiz or reading one.

**Files touched**: `app/(tabs)/index.tsx` (6), `components/Question.tsx` (3),
`components/Score.tsx` (5), `components/QuizSelection.tsx` (2),
`components/Explanation.tsx` (2), `components/Reader.tsx` (4),
`components/useReadAloud.ts` (1), `components/SettingsHeader.tsx` (1).

**The change**

1. `app/(tabs)/index.tsx`: `Open glossary` at `:505` and `:655`
   (`accessibilityLabel`, both occurrences) → `quiz_open_glossary`;
   `Glossary` at `:508` and `:658` → `quiz_glossary`. The
   `t('multiplication_quiz_label_range', …)` at `:524-527` now resolves because
   S2 added the key to en/fi.
2. `components/Question.tsx`: `+1 ✨` (`:158`) → `question_score_popup` (en
   `+1`, emoji in JSX); the read-aloud `accessibilityLabel`
   `Read question and answers aloud` (`:826`) → `question_read_aloud_label`. The
   `answerLabels` array at `:267` (`A:` … `D:`) stays as it is: Latin option
   letters are not language-dependent, and the value is spoken by TTS (`:709`).
3. `components/Score.tsx`: `🎉 Well Done! 🎉` at `:337` and again at `:416` →
   one key `score_well_done` (en `Well Done!`, emoji in JSX at both sites);
   `💪 Try again!` (`:338`) → `score_try_again`; `✨ Perfect Score! ✨` (`:342`)
   → `score_perfect`; `Great job!` (`:342`) → `score_great_job`. The two
   occurrences of the winner heading must share the key — writing it twice is how
   the file got two copies in the first place.
4. `components/QuizSelection.tsx`: `📖 Read` (`:137`) → `quiz_read_badge`;
   `⚔️ Multiplayer Mode` (`:449`) → `quiz_multiplayer_mode`.
5. `components/Explanation.tsx`: `Read explanation aloud` (`:80`,
   `accessibilityLabel`) → `explanation_read_aloud_label`; `Tap highlighted terms
   for definitions` (`:100`) → `explanation_glossary_hint`.
6. `components/Reader.tsx`: `Start from question:` (`:319`) →
   `reader_start_from`; `Currently reading: {question} {n} of {total}` (`:351`,
   currently two literals around three values) → `reader_currently_reading` =
   `Currently reading: {{question}} {{current}} of {{total}}`, passing
   `question: t('question')`; `🔊 READING NOW` (`:383`) → `reader_reading_now`.
7. `components/useReadAloud.ts:576`: `alert('Text-to-speech is not supported in
   this browser.')` → `reader_tts_unsupported`. This file already destructures
   `i18n` (`:4`, `:327`, `:580`) but has no `t`, so use the hook here (it is a
   hook file, not a plain module) rather than `i18n.t`.
8. `components/SettingsHeader.tsx:88` already renders `{t('question')} {n}`. No
   change; the one counted string is the space between them and it stays.

German and Finnish authored for all of these.

**Automated check**: `npx tsc --noEmit && npx jest --ci`, plus the e2e literal
check (`Question 1` depends on `en.json`'s `question` staying `Question`).

**Human check**: take a quiz to the score screen in German, and open Reader mode;
the result headings, the retry button and the reading progress line are German.

---

## S12. Content readers and flashcards

13 strings. `components/Flashcards.tsx` is here because of D8, not because of its
size: it imports the bare `t` from `i18next` at `:20` and therefore never
re-renders when the language changes.

**Files touched**: `components/EssayReader.tsx` (5),
`components/GlossaryModal.tsx` (5), `components/Flashcards.tsx` (3).

**The change**

1. `components/Flashcards.tsx`: delete `import { t } from 'i18next';` at `:20`,
   add `const { t } = useTranslation();` inside the component (D8). Then
   `Loading or no more flashcards...` (`:445`) → `flashcard_empty`; `dump`
   (`:498`) → `flashcard_dump`; `Keep` (`:550`) → `flashcard_keep`. The existing
   `t('use_flashcards')` at `:480` now also re-renders on a language change.
2. `components/EssayReader.tsx`: `Back` (`:44`) → `learning_back` (reuse);
   `Study Material` (`:49`) → `essay_study_material`; `{n} sections` (`:58`) →
   `essay_section_count` = `{{count}} sections`; `Ready to test your knowledge?`
   (`:91`) → `essay_cta`; `Start Quiz` (`:97`) → `essay_start_quiz`. Essay
   category, title, headings and bodies are content (`assets/essays_en.json`) and
   stay.
3. `components/GlossaryModal.tsx`: `Definition` / `AI/ML Glossary` (`:202`) →
   `glossary_definition` / `glossary_title`; `Search terms...` (`:219`,
   placeholder) → `glossary_search_placeholder`; `No matching terms found`
   (`:264`) → `glossary_no_matches`; `{n} terms available` (`:265`) →
   `glossary_term_count` = `{{count}} terms available`. The 350 term/definition
   pairs are content and stay.

German and Finnish authored for all of these.

**Automated check**: `npx tsc --noEmit && npx jest --ci`.

**Human check**: with German selected, open the glossary from the Quiz tab, type
a nonsense term, and confirm the placeholder, the empty state and the count line
are German; then open an essay and confirm its chrome is German while its body is
still English (expected: the essays exist only in English).

---

## S13. Level titles and the gamification chrome

25 level titles plus two components. **This is the first of the two big authoring
slices**: 25 titles × 2 languages = 50 invented German and Finnish strings. They
are invented product copy (`Newcomer`, `Adept`, `Demigod`, `Omniscient`), not
translations of reviewed text.

**Files touched**: `components/locales/en.json`, `de.json`, `fi.json`,
`components/gamification/XPProgress.tsx`, `components/gamification/StreakDisplay.tsx`.

**The change**

1. Add `level_1_title` … `level_25_title` to all three files, beside the existing
   `level_progress` / `next_level` block. English values are the `title` fields of
   `LEVEL_CONFIGS` (`components/gamification/types.ts:114-138`) byte for byte, in
   order: `Newcomer, Beginner, Curious, Learner, Student, Apprentice, Scholar,
   Adept, Expert, Master, Sage, Grandmaster, Virtuoso, Prodigy, Champion, Legend,
   Mythic, Hero, Titan, Immortal, Demigod, Ascendant, Transcendent, Eternal,
   Omniscient`. German and Finnish are authored in this commit.
2. `components/gamification/XPProgress.tsx:147` renders `{levelTitle}` from the
   gamification context. Replace it with
   `t(\`level_${xp.currentLevel}_title\`)`. Leave
   `components/gamification/GamificationProvider.tsx:570` (`getLevelTitle`) and
   the `title` fields in `types.ts` untouched: D7 keeps the structure, and the
   English fields become the reference the locale values were copied from.
   `XPProgress` already has `useTranslation` (`:16`, `:30`).
3. `components/gamification/StreakDisplay.tsx:186`: `{t('day_streak')}` becomes
   `{t(streak.currentStreak === 1 ? 'day_streak' : 'days_streak')}`, using the
   pair added in S2. The number stays in its own `<Text>` at `:183-185`.
   `StreakDisplay` already has `useTranslation` (`:16`, `:30`) and its other two
   counted strings are already keys (`:164` `streak`, `:186` `day_streak`).

**Automated check**: `npx tsc --noEmit && npx jest --ci`.

**Human check**: profile → level badge in Finnish shows a Finnish level title, and
a one-day streak says the singular form while a multi-day streak says the plural
form.

---

## S14. Achievement names and descriptions

**The largest slice: 106 new keys, 318 values, of which 212 German and Finnish
strings are invented.** They are product copy, not translations of reviewed
text — the English names in `types.ts` are idioms (`Week Warrior`,
`Comeback King`, `Lightning Fast`, `Night Owl`). Do not ship this slice without a
copy review of the two added blocks.

**Files touched**: `components/locales/en.json`, `de.json`, `fi.json`,
`components/gamification/AchievementBadge.tsx`,
`components/gamification/AchievementModal.tsx`,
`components/locales/__tests__/localeParity.test.js`.

**The change**

1. For each of the 53 ids listed in the naming section, add
   `achievement_<id>_name` and `achievement_<id>_description` to all three files,
   in the order the ids appear in `DEFAULT_ACHIEVEMENTS`
   (`components/gamification/types.ts:145-634`), inserted as one block beside the
   existing `achievement_*` keys. The English values are that entry's `name` and
   `description` byte for byte (for example `achievement_streak_3_name` =
   `Getting Started`, `achievement_streak_3_description` =
   `Complete quizzes 3 days in a row`). Nothing in `types.ts` changes: ids, icons,
   categories, `requirement`, `xpReward`, `isSecret` all stay, and the English
   `name`/`description` fields stay as the source the locale values were copied
   from (D7).
2. `components/gamification/AchievementBadge.tsx`: replace `{achievement.name}`
   at `:139` with `{t(\`achievement_${achievement.id}_name\`)}` and
   `{achievement.description}` at `:145` with
   `{t(\`achievement_${achievement.id}_description\`)}`. The hook is already
   there (`:8`, `:20`); the secret branch at `:104-114` already uses
   `secret_achievement` / `keep_playing`.
3. `components/gamification/AchievementModal.tsx`: same two replacements for
   `{currentAchievement.name}` (`:283`) and `{currentAchievement.description}`
   (`:290`). The hook is already there (`:17`, and `const { t } = useTranslation()`
   is already destructured for the header at `:253`).
4. `components/gamification/GamificationStats.tsx` needs **no edit**: its eight
   counted strings are all `t()` calls already
   (`quizzes`, `badges`, `accuracy`, `level_progress`, `statistics`,
   `questions_answered`, `correct_answers`, `perfect_scores`, `Quiz_wins`,
   `days_played`, `best_streak`, `achievement_category_${category}`), and it
   renders names and descriptions through `AchievementBadge`. Do not churn it.
5. Extend `components/locales/__tests__/localeParity.test.js` with the derived-key
   sweep that makes the 212-string block mechanically checkable: require
   `../../gamification/types` (a plain `.ts` with no imports, so it loads under
   jest without a component tree), then assert that for every entry of
   `DEFAULT_ACHIEVEMENTS` both `achievement_<id>_name` and
   `achievement_<id>_description` exist in all three files, and that every
   `LEVEL_CONFIGS` entry has `level_<n>_title`. This is also the assertion that
   catches the two key families the source scan cannot see (template-built keys),
   so it closes the last coverage hole.

**Automated check**: `npx tsc --noEmit && npx jest components/locales/__tests__/localeParity.test.js --ci && npx jest --ci`.

**Human check**: read the new `achievement_*` block in `de.json` and `fi.json` in
one sitting — 212 values — and confirm they read as idiomatic game copy rather
than literal renderings of the English idioms.

---

## Deviations from the 491 count

Recorded so nobody has to re-derive the arithmetic:

- **`app/+html.tsx`, 4 strings: excluded.** Out of scope per `tree.md`; it renders
  in Node during static web rendering and cannot know the user's language. Do not
  touch the file.
- **4 dead files, 39 strings: excluded** (`TtsTestComponent` 26,
  `gamification/DailyQuiz` 9, `AnalogClock` 2, `OfflineIndicator` 2). Deleting
  them is a separate change.
- **`app/(tabs)/settings.tsx:136,139,142`, 3 strings: excluded as quiz content.**
  `User Quiz`, `What is 2+2?` and `2+2=4` are the default quiz template written
  into `quizzes_user.json`, i.e. the same category as
  `assets/quizzes_*.json`. Translating them would also mean writing non-English
  text into a file the user then edits. Counted in the 36, intentionally left.
- **`services/androidUpdate.ts:84,89,96`, 3 strings: included though outside the
  37-file list.** They are thrown `Error` messages shown verbatim as an alert
  body; leaving them English would contradict the end state. Handled in S5.
- **`services/MultiplicationQuiz.ts` module-scope `i18n.t` calls at `:14-15`:
  left alone.** Pre-existing, harmless because the quiz list is rebuilt on a
  language change (`Quizprovider.tsx:757-768`); changing it is not in the count.

---

## Risk register

1. **`services/` tests break if the jest setup file is missing or misconfigured
   (D3).** Importing `components/i18n.ts` under jest throws
   `TurboModuleRegistry.getEnforcing(...): 'RNLocalize' could not be found`
   because of the module-level import at `components/i18n.ts:4`. Mitigation: S1
   lands `jest.setup.js` plus the `setupFiles` entry before any service edit, and
   the merge order is fixed. Verification that adding the entry does not clobber
   the preset: jest concatenates (`node_modules/jest-config/build/normalize.js:272-274`),
   confirmed with `npx jest --showConfig | grep -A4 setupFiles` showing three
   entries. Related trap: an `en`-pinned test passing by luck. If
   `i18n.language` is not `en` under jest, `multiplayerRules.test.js:266-294` and
   `multiplayerFailures.test.js:51` fail loudly rather than silently, which is the
   behaviour we want.
2. **e2e breaks if any English value differs from today's literal (D6).** The spec
   sets no locale and rides Chromium `en-US`, so `en.json` is load-bearing. Check
   it mechanically after every slice that touches `en.json`:

   ```bash
   node -e '
   const en = require("./components/locales/en.json");
   const want = {
     multiplayer_title: "Multiplayer Quiz",
     multiplayer_create_game: "Create New Game",
     multiplayer_room: "Room:",
     multiplayer_waiting_host: "Waiting for host to start...",
     multiplayer_select_quiz: "Select Quiz",
     multiplayer_start_game: "Start Game",
     multiplayer_enter_name: "Enter your name",
     question: "Question",
   };
   let bad = 0;
   for (const [k, v] of Object.entries(want))
     if (en[k] !== v) { bad++; console.log("DRIFT", k, JSON.stringify(en[k]), "!=", JSON.stringify(v)); }
   console.log(bad ? "FAIL" : "ok: 8 e2e-pinned English values unchanged");
   process.exit(bad ? 1 : 0);'
   ```

   The other two literals in the spec are not UI: `🌐 Language` and
   `Advanced Finnish Language & Complex Grammar` come from
   `assets/quizzes_*.json` (out of scope, untouched), and `Question 1` is
   `components/SettingsHeader.tsx:88` composing `t('question')` + a number, which
   the check covers via `question`.
3. **`npx jest` writes an untracked snapshot if `--ci` is skipped.** Bare
   `npx jest` rewrites `components/__tests__/__snapshots__/StyledText-test.js.snap`
   instead of failing. Mitigation: S1 commits the snapshot and every later gate
   call uses `npx jest --ci`; `git status --porcelain` must show only `.scratch/`
   after each commit.
4. **212 invented German and Finnish strings need review.** They sit in one place
   in the diff: the `achievement_*` block in `components/locales/de.json` and
   `fi.json` (S14), plus the `level_*` block (S13) and the `kids_pet_*` block (S6).
   Mitigation: those three slices are copy-review slices, not code-review slices;
   the human check on each is "read the added values", and S13/S14 are separate
   commits precisely so the block can be rejected without losing the wiring.
5. **`app/+html.tsx` must not be touched.** It appears in the master table with 4
   strings and in an earlier ticket list, so it looks in scope. It is not: the
   file's own probe is `<html lang="en">` and an English meta description, which
   run in Node with no access to the stored language. No slice edits it, and a
   `git diff --stat` that mentions it is a mistake.
6. **Module-scope `t()` freezes a value.** `components/kids/StreakPet.tsx`'s
   `PET_STAGES` and `components/kids/CelebrationOverload.tsx`'s `texts` array are
   module-level today. Mitigation: both are reduced to keys/emoji at module scope
   and translated inside the component (S6). The same rule guards
   `app/(tabs)/learn.tsx`'s `learningOptions`, which is already inside the
   component, and it forbids an `i18n.t` at the top of either `services/` file.
7. **A new eslint error silently doubles the baseline.** `jest.setup.js` uses the
   `jest` global and `.eslintrc.js` has no matching override, so
   `eslint:recommended`'s `no-undef` fires. Mitigation: S1 adds a `jest.setup.js`
   override with `env: { jest: true, node: true }` and every slice ends with
   `npx eslint . --ext .js,.jsx,.ts,.tsx` reporting exactly one error, the
   pre-existing `expo-env.d.ts:3:73`.
8. **A key added in one language only.** Mitigation: rule 3 (all three files in
   the same commit) plus parity assertion (a). The failure mode this prevents is
   the historical one: ten `multiplication_*` keys in `de.json` only.
9. **Translated text lands in a value that also has to interpolate.** i18next
   treats `{{…}}` as interpolation with `escapeValue: false`
   (`components/i18n.ts:41-43`), so a stray `{{` in authored copy breaks the
   render. Mitigation: the parity test does not cover this, so each slice's human
   check clicks or reads the affected string. The keys that interpolate are:
   `multiplayer_lead_ahead`, `multiplayer_lead_behind`, `multiplayer_player_wins`,
   `multiplayer_invited_you`, `multiplayer_finished_in`, `multiplayer_progress`,
   `multiplayer_time_min_sec`, `multiplayer_time_sec`, `settings_latest_build`,
   `settings_update_download_failed`, `reader_currently_reading`,
   `learn_count_quizzes`, `learn_count_questions`, `warmup_stats`,
   `debug_concept_comment`, `debug_plain_comment`, `debug_wrong_comment`,
   `debug_result_body`, `debug_fixed_body`, `debug_score_line`,
   `learning_score_line`, `faded_score_line`, `faded_stage_progress`,
   `kids_pet_next_stage_one`, `kids_pet_next_stage_other`,
   `kids_pet_day_in_streak`, `kids_pet_days_in_streak`, `essay_section_count`,
   `glossary_term_count`,
   plus the existing `multiplication_quiz_label_range` and `progress_info`.

---

## Verification plan

Run these in order, at the end, from `/home/maverock24/gitrepos/Quizzy`:

```bash
# 1. Types
npx tsc --noEmit

# 2. The whole suite, once, in CI mode (no snapshot writes)
npx jest --ci

# 3. The two English-pinned service suites explicitly
npx jest services/__tests__/multiplayerRules.test.js \
       services/__tests__/multiplayerFailures.test.js --ci

# 4. Locale parity, including the derived achievement/level sweep
npx jest components/locales/__tests__/localeParity.test.js --ci

# 5. Lint: exactly one error, and it is the pre-existing generated one
npx eslint . --ext .js,.jsx,.ts,.tsx

# 6. The eight e2e-pinned English values (snippet in the risk register)
node -e '<the check from risk 2>'

# 7. Nothing uncommitted, nothing new untracked
git status --porcelain

# 8. Every slice committed, in order, one per area
git log --oneline -14
```

Expected: (1) silent; (2) 16 suites, 156+ tests, 0 written snapshots; (3) green
without editing either test file; (4) green; (5) one error at
`expo-env.d.ts:3:73`; (6) `ok: 8 e2e-pinned English values unchanged`; (7) only
`?? .scratch/`; (8) fourteen commits, each with the `QRSPI: i18n-ui-coverage`
trailer.

Not run as part of the gate, and said plainly: the Playwright spec
(`e2e/multiplayer.spec.ts`) is excluded from jest by `testPathIgnorePatterns` and
needs a running web build. The English values it pins are checked mechanically by
step 6, not by running it.

---

## Unresolved

Four calls the plan had to make that `tree.md` does not settle. None blocks a
slice; each is one line to change if the human disagrees.

1. **`components/MultiplayerScoreboard.tsx:30` `Q{n}/{q}` and
   `app/multiplayer/[code].tsx:44-49` `formatTime` (`2m 15s`).** Both are counted
   as strings in the master table, but nothing decides whether the abbreviations
   should be localized. Plan: translate both (`multiplayer_progress` =
   `Q{{current}}/{{total}}`, `multiplayer_time_min_sec`, `multiplayer_time_sec`),
   because D1 says every string goes behind `t()` and because a Finnish user
   reading `Q3/10` is no worse off while `2m 15s` is plainly English. If the
   human prefers them left as code-like chrome, delete three keys and three
   call sites.
2. **`app/(tabs)/settings.tsx:136,139,142` (`User Quiz`, `What is 2+2?`,
   `2+2=4`).** They are inside the settings screen's 36 but are quiz content,
   written into `quizzes_user.json`. Plan: leave them English, on the
   out-of-scope-quiz-content reading. If the human counts them as interface, that
   is one more key each and the stored template becomes language-dependent from
   the moment it is created.
3. **`services/androidUpdate.ts:84,89,96`.** Three user-visible `Error` messages
   that are not in the 37-file, 491-string list but do reach an alert body. Plan:
   include them (S5). The alternative is to leave them English and accept three
   visibly English alert bodies.
4. **The three language names in `components/Onboarding.tsx:74-76`.** The file
   hardcodes the endonyms `English` / `Deutsch` / `Suomi`, while the Settings
   picker shows the localized names from `en.json`/`de.json`/`fi.json`. `tree.md`
   does not say which is intended for onboarding. Plan: reuse the existing
   `english`/`german`/`finnish` keys, matching Settings and adding no keys. The
   alternative is three new endonym keys whose values are identical in all three
   files, which also means three more entries in the identical-value allowlist.

---

# Progress

| slice | state | commit |
|---|---|---|
| S1 Prefactor | done | b5c3e27 |
| S2 Locale files | done | 4a34087 |
| S3 Multiplayer screens | done | 3f700f2 |
| S4 Multiplayer services + scoreboard | done | f7e7728 |
| S5 Settings + update path | done | ded8721 |
| S6 Kids mode | done | 6cafe17 |
| S7 Learn hub | done | 86546fc |
| S8 Learning part 1 | done | 1896d49 |
| S9 Learning part 2 | done | fbe159f |
| S10 App shell | done | a387416 |
| S11 Quiz chrome | done | 487fa85 |
| S12 Content readers + flashcards | done | a194faf |
| S13 Level titles | done | b811610 |
| S14 Achievements | done | f31832f |

Gate after S1, verified by the orchestrator: `npx tsc --noEmit` clean,
`npx jest --ci` 16 suites / 159 tests green, `npx eslint` exactly 1 pre-existing
error in `expo-env.d.ts:3:73`. Mutation-checked the locale parity test: deleting
`save` from `fi.json` makes it fail.

Post-slice fix, found in the orchestrator's acceptance audit: `en.json`
`days_streak` carried the singular English value, so `StreakDisplay.tsx:188`
rendered "7 day streak". Fixed in `7367ec4`.
