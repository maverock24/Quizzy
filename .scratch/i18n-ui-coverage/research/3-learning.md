# Research 3: `learning/`, `Quizprovider`, hooks

Scope: questions 1, 2, 5 and 6 of `ticket.md`, restricted to these files (all under
`/home/maverock24/gitrepos/Quizzy/`):

```
components/Quizprovider.tsx            847 lines  read in full
components/learning/CodeTracing.tsx    518 lines  read in full
components/learning/DebuggingExercise.tsx 588 lines read in full
components/learning/FadedExamples.tsx  653 lines  read in full
components/learning/ParsonsProblems.tsx 631 lines read in full
components/learning/SRSDailyWarmup.tsx 496 lines  read in full
components/learning/SRSManager.ts      266 lines  read in full
components/learning/index.ts             9 lines  read in full
hooks/useOfflineDetection.ts            38 lines  read in full  (only file in hooks/)
```

Evidence base besides the files themselves: `components/i18n.ts` (47 lines, read in
full), `services/MultiplicationQuiz.ts`, `components/kids/MultiplicationRangeSheet.tsx`,
`app/(tabs)/index.tsx:519-527` and `:663-675`, `components/locales/{en,de,fi}.json`,
`node_modules/i18next@25.2.1/dist/cjs/i18next.js:605-670`, plus a local
`node` + `i18next` run against the three real locale files (output quoted below).

## Per-file counts

| File | Hardcoded user-visible literals | Renders to the user? |
| --- | --- | --- |
| `components/Quizprovider.tsx` | 0 | no (provider) |
| `components/learning/CodeTracing.tsx` | 15 | yes |
| `components/learning/DebuggingExercise.tsx` | 23 | yes |
| `components/learning/FadedExamples.tsx` | 19 | yes |
| `components/learning/ParsonsProblems.tsx` | 21 | yes |
| `components/learning/SRSDailyWarmup.tsx` | 17 sites / 16 distinct | yes |
| `components/learning/SRSManager.ts` | 0 | no |
| `components/learning/index.ts` | 0 | no |
| `hooks/useOfflineDetection.ts` | 0 | no |

Total in my set: **95 literal sites**, all in five `learning/` components. Every one of
those five files has **no** `useTranslation` import and **no** `t()` call (verified by
`grep -n "useTranslation\|t(" components/learning/*` showing only `useState`,
`useEffect`, `setState` matches and the one `t`-free `useQuiz()` destructure in
`SRSDailyWarmup.tsx:34`). There is no partial coverage to report in this file set; the
coverage is zero.

---

## components/Quizprovider.tsx

**0 user-visible strings.** The component renders `{children}` inside
`QuizContext.Provider` (`:776-837`) and `return null` while
`isLanguageReady` is false (`:770-773`). Nothing it renders carries copy.

String literals present, all non-UI:

| line | literal | why not user-facing |
| --- | --- | --- |
| `:844` | `'useQuiz must be used within a QuizProvider'` | thrown `Error`, developer-facing |
| `:733` | `` `API route responded with an error: ${response.statusText}` `` | thrown `Error` at `:732`, caught at `:743-745` and only `console.error`-ed |
| `:500` | `` `${Platform.OS} update error:` `` | `console.error` |
| `:524` | `'Failed to download quizzes:'` | `console.error` |
| `:542` | `'Failed to parse downloaded data as JSON:'` | `console.error` |
| `:560` | `'Web update fetch/processing error:'` | `console.error` |

31 `console.error(...)` calls in total (counted with `grep -c "console.error"`), all
developer logs, none surfaced in the UI. No `Alert.alert` anywhere in my file set
(`grep -n "Alert\."` over `Quizprovider.tsx`, `components/learning/*`, `hooks/*` →
no matches, exit 1).

Copy this file *does* cause to appear, indirectly:

- `:78-104` `getLocalQuizzes()` selects `assets/quizzes_{en,fi,de}.json` and sorts by
  `quiz.name || quiz.nimi`. Quiz names on screen come from those content files.
- `:95-97` appends `createMultiplicationQuiz()` **only when `lang.startsWith('de')`**,
  with the comment `// Generated Einmaleins practice round. German-only for now.`
  This is load-bearing for question 6.
- `:106-110` `getLocalEssays()` always returns `assets/essays_en.json`, with the comment
  `// Only English essays exist for now; extend with de/fi when available`. Out of my
  question set but it means essays stay English under `de`/`fi`.
- `:361-372` `setLanguage` is the only language write path here; it calls
  `i18n.changeLanguage` and persists. No strings.

---

## components/learning/CodeTracing.tsx

15 literals. No `useTranslation`.

| line | literal | how it renders |
| --- | --- | --- |
| `:67` | `'This is the correct answer.'` | fallback for `explanation`, rendered at `:268-270` in the result card body |
| `:128` | `'Code Tracing Complete!'` | `completedTitle`, completion screen |
| `:130` | `{correctCount} / {questions.length} correct ({percentage}%)` | `scoreText`; three interpolations wrapped around the word `correct` |
| `:134` | `"You're a mental compiler! 🧠"` | ternary `percentage >= 90`, encouragement |
| `:136` | `'Great mental model! 🎯'` | ternary `>= 70` |
| `:138` | `'Keep building that mental model 💪'` | ternary `>= 50` |
| `:139` | `'Practice makes the mental compiler stronger! 🔧'` | ternary else |
| `:144` | `'Back'` | button label |
| `:148` | `'Try Again'` | button label |
| `:164` | `'🧠 Mental Compiler'` | header title, always on screen |
| `:192` | `'script.js'` | fake file name in the code-card chrome, always on screen |
| `:265` | `'✅ Correct! You traced it right.'` | explanation card title, correct branch |
| `:266` | `"❌ Not quite. Here's the trace:"` | explanation card title, wrong branch |
| `:274` | `'Next Challenge'` | next button, not-last branch |
| `:275` | `'See Results'` | next button, last branch |

Fixed chrome worth noting for the plan: the answer prefix `{String.fromCharCode(65 + index)}.`
at `:247` is a Latin letter label, and the progress readout
`{currentIndex + 1} / {questions.length}` at `:165-167` and `:130` are pure numbers, no
copy.

Quiz *content* shown here (`question`, `options`, `explanation` at `:63-69`, `:200`,
`:212`, `:268`) comes from `assets/quizzes_*.json` via the `quizzes` prop, so it is
content, not chrome.

---

## components/learning/DebuggingExercise.tsx

23 literals. No `useTranslation`. This file is the one case in my set where
module-level code *builds* English sentences out of content.

| line | literal | how it renders |
| --- | --- | --- |
| `:72` | `` `// Concept: ${line}` `` (i === 0 branch) | first line of the fake "buggy code" block, rendered at `:257` |
| `:72` | `` `// ${line}` `` (else branch) | remaining code lines, rendered at `:257` |
| `:79` | `` `// ❌ Wrong: ${wrongAnswers[0].answer}` `` | the red-herring line, rendered at `:257` |
| `:88` | `` `The correct answer is: ${q.answer}. ${q.explanation}` `` | result card body, rendered at `:283-285` |
| `:89` | `` `// ✅ Correct: ${q.answer}\n${q.explanation}` `` | "fixed code" body, rendered at `:305-307` |
| `:151` | `'Bug Hunt Complete!'` | completion title |
| `:153` | `{correctCount} / {exercises.length} bugs found ({percentage}%)` | score line |
| `:157` | `"You're a debugging master! 🐛🔍"` | ternary `>= 90` |
| `:159` | `'Great bug detection skills! 🎯'` | ternary `>= 70` |
| `:161` | `'Keep hunting those bugs! 💪'` | ternary `>= 50` |
| `:162` | `'Practice makes a better debugger! 🔧'` | ternary else |
| `:167` | `'Back'` | button label |
| `:171` | `'Try Again'` | button label |
| `:189` | `'🐛 Bug Hunter'` | header title, always on screen |
| `:215` | `'👆 Tap the line with the bug'` | instruction line, always on screen |
| `:226` | `'buggy_code.js'` | fake file name in the code card |
| `:281` | `'🎯 Bug Found!'` | result title, correct branch |
| `:281` | `'❌ Wrong Line'` | result title, wrong branch |
| `:297` | `'Hide Fix'` | toggle label when `showFix` |
| `:297` | `'Show Fixed Code'` | toggle label when `!showFix` |
| `:303` | `'✅ Fixed Code:'` | fixed-code card title |
| `:315` | `'Next Bug'` | next button, not-last branch |
| `:316` | `'See Results'` | next button, last branch |

`:257`'s `{line || ' '}` is a space, not copy.

---

## components/learning/FadedExamples.tsx

19 literals. No `useTranslation`.

| line | literal | how it renders |
| --- | --- | --- |
| `:79` | `'Read and understand the concept.'` | `stage.description`, stage 1, rendered at `:309-311` |
| `:92` | `'Fill in the key term.'` | `stage.description`, stage 2, rendered at `:309-311` |
| `:210` | `placeholder="fill in..."` | `TextInput` placeholder inside the blank, `:200-213` |
| `:246` | `'Scaffolding Complete!'` | completion title |
| `:248` | `{correctCount} / {totalStagesWithBlanks} stages correct (` + `{percentage}%)` | score line, split across `:247-250` |
| `:253` | `"You've mastered these patterns! 🏆"` | ternary `>= 90` |
| `:255` | `'Great understanding! 🎯'` | ternary `>= 70` |
| `:256` | `'Keep practicing these patterns! 📚'` | ternary else (no `>= 50` branch here, unlike the other four) |
| `:261` | `'Back'` | button label |
| `:265` | `'Start Over'` | button label (the other four components say `Try Again`) |
| `:282` | `'📖 Faded Examples'` | header title |
| `:324` | `Stage {currentStageIndex + 1} of {currentExample.stages.length}` | code-card chrome, a sentence with two numbers in it |
| `:344` | `'✅ Perfect!'` | result title, correct branch |
| `:344` | `'❌ Not quite right'` | result title, wrong branch |
| `:348` | `'Correct answers:'` | label above the answer list |
| `:363` | `'Check Answers'` | primary button |
| `:371` | `'Next Stage'` | next button, more stages |
| `:373` | `'Next Example'` | next button, more examples |
| `:374` | `'Finish'` | next button, last |

`'___BLANK___'` at `:88` is an internal sentinel consumed by `renderCodeWithBlanks()`
(`:174-226`); it never reaches the screen because the matched fragment is replaced by the
`TextInput`.

---

## components/learning/ParsonsProblems.tsx

21 literals. No `useTranslation`.

| line | literal | how it renders |
| --- | --- | --- |
| `:191` | `'Parsons Complete!'` | completion title |
| `:193` | `{correctCount} / {problems.length} correct ({percentage}%)` | score line |
| `:197` | `'Master code organizer! 🏆'` | ternary `>= 90` |
| `:199` | `'Great logical thinking! 🎯'` | ternary `>= 70` |
| `:201` | `'Good progress! Keep practicing 💪'` | ternary `>= 50` |
| `:202` | `'Focus on the structure! 📚'` | ternary else |
| `:207` | `'Back'` | button label |
| `:211` | `'Try Again'` | button label |
| `:227` | `'📦 Parsons Problems'` | header title |
| `:254` | `'📝 Your Solution (tap to remove)'` | section title |
| `:259` | `'Tap lines below to add them here...'` | empty state for the placed-lines box |
| `:299` | `'🧩 Available Lines (tap to add)'` | section title |
| `:313` | `'All lines placed! Check your answer.'` | empty state for the available pool |
| `:322` | `'Reset'` | button label |
| `:333` | `'Check Answer'` | button label |
| `:346` | `'✅ Perfect Order!'` | result title, correct branch |
| `:346` | `'❌ Not Quite Right'` | result title, wrong branch |
| `:350` | `'You arranged all the code lines correctly!'` | result body, correct |
| `:351` | `'Some lines are in the wrong position. The correct positions are highlighted.'` | result body, wrong |
| `:356` | `'Next Problem'` | next button, not-last |
| `:357` | `'See Results'` | next button, last |

`:254`, `:299` and `:322` are the first things a `de`/`fi` user sees on this screen, and
the CSS at `:435` (`styles.sectionTitle`) adds `textTransform: 'uppercase'`, which compounds with Finnish and
German longer words.

---

## components/learning/SRSDailyWarmup.tsx

17 sites, 16 distinct literals (`'Back to Learn'` appears twice). No `useTranslation`,
although it already imports `useQuiz` at `:12`. This is the cheapest file in my set to
convert: every label is a plain sibling of a question the file already loads.

| line | literal | how it renders |
| --- | --- | --- |
| `:129` | `'Loading your daily warmup...'` | loading state |
| `:139` | `'All caught up! 🎉'` | empty-state title |
| `:141` | `'No questions due for review right now.'` | empty-state subtitle |
| `:143-147` | `📊 {stats.totalTracked} questions tracked • {stats.masteredCount}{' '} mastered` | stats line, **two counts and a plural in one string** |
| `:149` | `'Back to Learn'` | button, empty state |
| `:166` | `'Warmup Complete!'` | completion title |
| `:168` | `{correctCount} / {questions.length} correct ({percentage}%)` | score line |
| `:172` | `'Outstanding! 🌟'` | ternary `>= 90` |
| `:174` | `'Great job! 👏'` | ternary `>= 70` |
| `:176` | `'Good effort! Keep practicing 💪'` | ternary `>= 50` |
| `:177` | `'Keep at it! Practice makes perfect 📚'` | ternary else |
| `:181` | `'Back to Learn'` | button, completion state |
| `:194` | `'Daily Warmup'` | header title |
| `:273` | `'✅ Correct!'` | explanation title, correct branch |
| `:274` | `'❌ Incorrect'` | explanation title, wrong branch |
| `:282` | `'Next Question'` | next button, not-last |
| `:283` | `'Finish'` | next button, last |

Question and answer text (`currentQuestion.quizName`, `.question`, `ans.answer`,
`.explanation` at `:222`, `:223`, `:257`, `:277`) comes from the SRS object, i.e. from
quiz content. `stats.dueToday` from `getSRSStats()` is fetched at `:85` and never
rendered here.

Cross-file duplicate strings the plan can reuse one key for:
`'Back'` (CodeTracing `:144`, DebuggingExercise `:167`, FadedExamples `:261`,
ParsonsProblems `:207`; `en.json:8` already has `"back": "back"`, lowercase, so it is not
the same string), `'Try Again'` (3x), `'See Results'` (3x), `'Finish'` (2x),
`'Back to Learn'` (2x), and the score pattern
`{a} / {b} correct ({p}%)` (4x).

---

## Question 2: files in my set that are not user-facing at all

Skip these, no churn:

1. `components/learning/SRSManager.ts` — pure logic plus `AsyncStorage` I/O. See
   question 5 below for the string audit.
2. `components/learning/index.ts` — 9 lines of re-exports; the only literal is the
   comment `// Export all learning components` at `:1`.
3. `hooks/useOfflineDetection.ts` — returns `{ isOnline, wasOffline }` booleans only
   (`:38`). No literals of any kind beyond the module path imports.
4. `components/Quizprovider.tsx` — a context provider. It renders no copy, only
   `{children}` (`:836`) or `null` (`:772`). Its 31 `console.error` strings and 2 thrown
   `Error` messages are developer-facing and should stay English.

Everything else in my set (`CodeTracing`, `DebuggingExercise`, `FadedExamples`,
`ParsonsProblems`, `SRSDailyWarmup`) is in scope, 95 literals.

---

## Question 5: non-component string sources, and the plain-`.ts` import question

### 5a. `Alert.alert` in my set: none

`grep -n "Alert\." components/Quizprovider.tsx components/learning/*.{ts,tsx} hooks/*.ts`
returns no matches (exit 1). No dialog titles or bodies to translate here.

### 5b. `accessibilityLabel`: none in my set

The only `placeholder` and `accessibility*` hits in my set are
`FadedExamples.tsx:210` (`placeholder="fill in..."`) and the style key
`ParsonsProblems.tsx:258/448` (`styles.placeholderText`, not a prop). Every other
`accessibilityLabel` in the app lives outside my file set.

### 5c. `components/learning/SRSManager.ts` surfaces no copy of its own

Full audit of the file (266 lines):

- Exported API: `generateQuestionId` (`:26-40`), `loadSRSData` (`:44-56`),
  `saveSRSData` (`:61-70`), `getQuestionSRSData` (`:74-94`), `calculateNextReview`
  (`:101-146`), `getDueQuestions` (`:152-220`), `recordAnswer` (`:228-244`),
  `getSRSStats` (`:249-266`), plus the `SRSReviewQuestion` interface (`:13-21`).
- Literals: `'@quizzy_srs_data'` (`:9`, a storage key), and two developer log strings
  `'Failed to load SRS data:'` (`:53`) and `'Failed to save SRS data:'` (`:67`). Both go
  to `console.error` inside `catch` blocks; neither is returned or rethrown.
- Returned values that a component *does* render: `getDueQuestions()` returns
  `{ questionId, quizName, question, answers, correctAnswer, explanation, srsData }`
  (built at `:167-177` and `:199-210`). Every textual field is copied verbatim from the
  `quizzes` argument, so it is quiz content, already language-selected upstream in
  `Quizprovider.getLocalQuizzes()`. `getSRSStats()` returns three numbers only
  (`:259-265`): `totalTracked`, `dueToday`, `masteredCount`. No labels.
- `generateQuestionId` builds `` `${quizName}::${questionText.substring(0, 50)}` ``
  (`:31`) purely as a hash input; it never reaches the UI.

Conclusion: `SRSManager.ts` needs **no** `t()` calls. Every user-facing label lives in
`SRSDailyWarmup.tsx`, which can use `useTranslation` normally. If a future caller ever
needs a translated string from a plain module, the pattern below already works.

### 5d. Importing `components/i18n.ts` from a plain `.ts` is safe, no cycle

`components/i18n.ts` imports exactly:

```
i18next, react-i18next, react-native (Platform), react-native-localize,
./locales/de.json, ./locales/en.json, ./locales/fi.json
```

It imports **nothing** from `components/` or `app/`. So `components/learning/SRSManager.ts`
→ `components/i18n.ts` is a leaf edge, and no cycle can form through it. Adding
`import i18n from '@/components/i18n'` to a plain `.ts` module is safe here.

This is not theoretical. The repo already does it: `services/MultiplicationQuiz.ts:1`
(`import i18n from '@/components/i18n';`) then calls `i18n.t(...)` at module scope
(`:14-15`), and `components/Quizprovider.tsx:1` imports `i18n` the same way. That module
is loaded through `Quizprovider.tsx:3` → `services/MultiplicationQuiz.ts`, i.e. exactly
the shape a translated `SRSManager.ts` would have, and `tsc --noEmit` is clean
(ticket gate).

Caveat for the design stage, not a bug today: `i18n.t()` is evaluated at module load in
`services/MultiplicationQuiz.ts`, so its two strings freeze at whatever language is
active when the module first loads. That is harmless for it because
`getLocalQuizzes()` re-calls `createMultiplicationQuiz()` on every language change
(`Quizprovider.tsx:758-769` effect). Any new `i18n.t()` call in a plain module should be
inside a function body, not at module scope, unless it has the same re-evaluation hook.

---

## multiplication_* key gap

### Where the 10 keys are consumed

`grep -rn "multiplication_" app/ components/ services/` (all extensions) gives exactly
11 `t()` / `i18n.t()` call sites in three files, plus the 10 key definitions in
`components/locales/de.json:55-64`:

| file:line | call |
| --- | --- |
| `app/(tabs)/index.tsx:524` | `t('multiplication_quiz_label_range', { from: multiplicationRange.from, to: multiplicationRange.to })` |
| `components/kids/MultiplicationRangeSheet.tsx:36` | `labelKey: 'multiplication_mode_count'` (data, translated at `:120` via `t(labelKey)`) |
| `components/kids/MultiplicationRangeSheet.tsx:37` | `labelKey: 'multiplication_mode_timed'` (translated at `:120`) |
| `components/kids/MultiplicationRangeSheet.tsx:96` | `t('multiplication_quiz_name')` (sheet title) |
| `components/kids/MultiplicationRangeSheet.tsx:98` | `t('multiplication_mode')` (row label) |
| `components/kids/MultiplicationRangeSheet.tsx:129` | `t('multiplication_duration')` (row label, timed mode only) |
| `components/kids/MultiplicationRangeSheet.tsx:134` | `t('multiplication_range_from')` (row label) |
| `components/kids/MultiplicationRangeSheet.tsx:138` | `t('multiplication_range_to')` (row label) |
| `components/kids/MultiplicationRangeSheet.tsx:155` | `t('multiplication_range_start')` (confirm button) |
| `services/MultiplicationQuiz.ts:14` | `i18n.t('multiplication_quiz_name')` → quiz `name` |
| `services/MultiplicationQuiz.ts:15` | `i18n.t('multiplication_quiz_category')` → quiz `category` |

That is 11 usage sites, and between them they cover all 10 keys.
`multiplication_quiz_label_range` is used only at `app/(tabs)/index.tsx:524`; it is the
one key with interpolation (`{{from}}`, `{{to}}`, used twice each in German).
`multiplication_quiz_category` is used only at `services/MultiplicationQuiz.ts:15`; it
reaches the screen as the quiz-list group heading via `QuizSelection`.

### What actually renders for an `en` or `fi` user

`components/i18n.ts:33-45` initialises with `fallbackLng: 'en'` and no
`parseMissingKeyHandler`, `missingKeyNoValueFallbackToKey`, `returnNull` override,
`saveMissing` or `keySeparator` tuning. In i18next 25.2.1 the resolution path is
`node_modules/i18next/dist/cjs/i18next.js:605-670`: when the key is invalid in every
language of the fallback chain, `res = key` (`:614-616`), then
`extendTranslation(res, ...)` interpolates that key string (`:663`). Because the key text
contains no `{{...}}` placeholders, interpolation is a no-op.

I ran the repo's real locale files through the repo's own i18next 25.2.1 to confirm
rather than trusting the read:

```
en ["multiplication_quiz_label_range","multiplication_quiz_name","multiplication_mode",
    "multiplication_range_start","multiplication_mode_count","multiplication_duration",
    "multiplication_quiz_category","Abbrechen","minutes"]
fi ["multiplication_quiz_label_range","multiplication_quiz_name","multiplication_mode",
    "multiplication_range_start","multiplication_mode_count","multiplication_duration",
    "multiplication_quiz_category","Abbrechen","minuuttia"]
de ["Einmaleins (2×2 bis 7×7)","Einmaleins (1×1 bis 10×10)","Modus","Los geht’s",
    "20 Aufgaben","Dauer","🔢 Mathematik","Abbrechen","Minuten"]
```

So the literal rendering is the **raw key text**, not English:
`multiplication_quiz_label_range`, `multiplication_quiz_name`, `multiplication_mode`,
`multiplication_range_start`, `multiplication_mode_count`, `multiplication_duration`,
`multiplication_quiz_category` as bare snake_case identifiers, underscore and all.
For `fi` the fallback chain is `fi` → `en`, and both are missing, so `fi` behaves
identically to `en`. The related `de`-only `t('cancel', 'Abbrechen')` at
`MultiplicationRangeSheet.tsx:147` renders the German word `Abbrechen` for `en` and `fi`
users, because a missing key with a `defaultValue` takes the default
(`i18next.js:609-612`, `hasDefaultValue`).

**However, the gap does not reach a user today.** Two independent gates keep those
screens away from `en`/`fi`:

1. `components/Quizprovider.tsx:94-97` only appends the multiplication quiz when
   `lang.startsWith('de')`, with the explicit comment
   `// Generated Einmaleins practice round. German-only for now.` So for `en`/`fi` there
   is no quiz with `generator === MULTIPLICATION_GENERATOR` in the list.
2. `app/(tabs)/index.tsx:241-249` only opens the sheet when a selected quiz matches
   `generator === MULTIPLICATION_GENERATOR`, and `:663-675` only mounts
   `<MultiplicationRangeSheet>` while `rangeSheetQuiz !== null`.

None of `assets/quizzes_{en,de,fi}.json` contains a `generator` field (checked: the only
`multiplication` hits in `quizzes_en.json` are prose inside explanations; `quizzes_de` and
`quizzes_fi` have zero). The one way a `en`/`fi` user could still see the raw keys is a
user-supplied quiz JSON declaring `"generator": "multiplication"`, loaded through
`Quizprovider.tsx:349-360` `loadUserQuizzes()`, which `JSON.parse`s the stored array
without validating `generator`. So the defect is real but dormant until the
"German-only for now" gate is lifted.

### The English text these keys correspond to

`components/kids/MultiplicationRangeSheet.tsx` is already fully keyed: I found **no
remaining English literal** in its render path. The only unkeyed-looking string is
`t('cancel', 'Abbrechen')` at `:147`. So the keys were introduced together with the
German-only feature, and the English copies were never written because the feature never
shipped in English. What `en.json` needs (and `fi.json`, to avoid the same fallback):

| key | de value (source of truth for intent) | needed `en` value | needed `fi` value |
| --- | --- | --- | --- |
| `multiplication_quiz_name` | `Einmaleins (1×1 bis 10×10)` | multiplication tables name, note the `1×1 bis 10×10` is hardcoded and will be stale for any other range | fi name |
| `multiplication_quiz_category` | `🔢 Mathematik` | `🔢 Mathematics` | fi category |
| `multiplication_quiz_label_range` | `Einmaleins ({{from}}×{{from}} bis {{to}}×{{to}})` | `{{from}}×{{from}} to {{to}}×{{to}}` | fi, same placeholders |
| `multiplication_range_from` | `Von` | `From` | fi |
| `multiplication_range_to` | `Bis` | `To` | fi |
| `multiplication_range_start` | `Los geht’s` | `Start` | fi |
| `multiplication_mode` | `Modus` | `Mode` | fi |
| `multiplication_mode_count` | `20 Aufgaben` | `20 problems` (matches `MULTIPLICATION_QUESTION_COUNT = 20`, `services/multiplicationProblems.ts:10`) | fi |
| `multiplication_mode_timed` | `Zeit` | `Timed` | fi |
| `multiplication_duration` | `Dauer` | `Duration` | fi |

Two adjacent facts the plan should not miss:

- `minutes` already exists in all three files (`en.json:54` `"minutes"`,
  `de.json:54` `"Minuten"`, `fi.json:54` `"minuuttia"`), and
  `MultiplicationRangeSheet.tsx:70` renders `` `${minutes} ${t('minutes')}` ``. That is a
  count plus a noun with no plural handling, so `fi` gets `1 minuuttia` instead of
  `1 minuutti`. Dynamic-string evidence for question 4.
- `cancel` is in **none** of the three locale files (`grep` for `"cancel` in each:
  no match), which is why the `'Abbrechen'` default shows for everyone.

### `"quiz_title": "Quizzy (DE)"`

`de.json:2` is `"quiz_title": "Quizzy (DE)"` while `en.json:2` and `fi.json:2` are
`"Quizzy"`. (`ticket.md` cites this as `de.json:1`; line 1 in all three files is the
opening brace, so the key itself is line 2.) `quiz_title` has exactly one consumer,
`components/Reader.tsx:49`: `` content = `${t('quiz_title')}: ${quiz.name}. ` ``, and
`content` is the read-aloud TTS string (`generateReadingContent`, passed to
`readAloud(...)` from `useReadAloud` at `components/Reader.tsx:165` and `:253`). It is not rendered as on-screen text anywhere (`grep -rn "quiz_title"`
over `app/` and `components/` returns that single hit). So the asymmetry is audible in
reader mode and invisible otherwise.

**Unresolved whether it is intentional.** Determining intent needs `git log`/`git blame`
on `components/locales/de.json`, and my instructions for this stage forbid running git
commands. Evidence for whoever answers it: the suffix is `(DE)`, a developer-style marker,
and it survives into spoken audio, which reads as a debug artefact rather than a product
decision; but nothing in the code comments explains it.
