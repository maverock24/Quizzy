# Research 4: mechanics of the existing i18n setup

Answers to Q3, Q4, Q7, Q8, Q9, Q10 of `.scratch/i18n-ui-coverage/ticket.md`.
Pure fact-finding. No files modified apart from this one.

Repo state when this was written: branch `master`, `git status --porcelain` →
`?? .scratch/` only.

---

## Q3. Key convention

### Shape: flat, `snake_case`, no namespaces

All three locale files are a single flat object of `string -> string`. No nesting,
no arrays.

```
$ node -e "for (const l of ['en','de','fi']) { const d=require('./components/locales/'+l+'.json'); console.log(l, Object.keys(d).length, 'keys'); }"
en 111 keys
de 121 keys
fi 111 keys
```

Naming:

- Dominant style is flat `snake_case`: `quiz_title`, `select_quiz`,
  `show_explanation_desc`, `achievement_category_streak`,
  `multiplication_quiz_label_range`.
- Four legacy keys use `Pascal_Snake`, all in the score block:
  `en.json:33` `Quiz_wins`, `en.json:34` `Quiz_losses`, `en.json:36`
  `Answers_right`, `en.json:37` `Answers_wrong`. These are the only keys that
  start with an uppercase letter:
  ```
  Pascal_Snake keys: Quiz_wins, Quiz_losses, Answers_right, Answers_wrong
  keys with hyphen: none
  keys with dot/colon (namespaces): none
  ```
- No namespace prefixes and no `:` separators. There are no i18next namespaces
  at all: `components/i18n.ts:37-41` registers one namespace per language
  (`en: { translation: en }`, and so on), so every key is in `translation`.
- Feature prefixes are used instead of namespaces, and they are consistent:
  `timer_*` (`en.json:47-51`), `achievement_category_*` (`en.json:79-83`),
  `multiplication_*` (de only, `de.json:55-64`), `achievement_*`.

### Keys are NOT sorted

```
$ node -e "... console.log('en keys alphabetical?', ...)"
en keys alphabetical? false
en first 12: quiz_title, select_quiz, question, questions, correct, wrong, next, back, show_explanation, hide_explanation, score, scores
```

Order is by feature area, in the order the features landed: quiz chrome, settings
toggles, score, reader, timer, gamification, daily quiz, statistics, learning
to-dos, explanation, onboarding. `de.json` and `fi.json` mirror the `en.json`
order, with the ten `multiplication_*` keys spliced into `de.json` between
`minutes` (`de.json:54`) and `time_up` (`de.json:65`).

### How keys were added historically

```
$ git log --oneline -15 -- components/locales/
77c1c95 feat(i18n): add German strings for the round mode and duration
375ab40 fix(i18n): keep the Einmaleins identity string as it was
9d9ab9d feat(i18n): split the Einmaleins name from its range label
20b55fc feat(i18n): add German strings for the Einmaleins range sheet
63287c5 fix: show multiplication tables quiz only in German quiz list
37f389e feat: add typed-answer multiplication tables quiz (1-10)
dec0955 Add personalized onboarding, retry wrong answers, and learning to-dos
76cf6fc Add gamification system with daily challenges, streaks, and XP rewards
d4faee0 Add quiz timer feature
d8e0f61 Add text input answer mode setting
4824fa9 feat: Enhance quiz selection with category grouping and expand/collapse functionality
a382b25 feat: Implement reader mode with text-to-speech functionality and add settings toggle
82571b1 feat: Update localization for music settings and improve UI text
0d5853d feat: Add elevator music feature and settings header
20152da feat: enhance read aloud functionality and add answer options to localization files
```

Observed pattern, four parts:

1. **One block of keys per feature, added with the feature commit.** `d4faee0`
   (timer) brings `timer_mode`, `timer_mode_desc`, `timer_duration`,
   `timer_duration_desc`, `minutes`, `time_up`, `time_remaining`.
   `76cf6fc` (gamification) brings the `achievement_*` and stats block.
2. **New keys are inserted next to the keys they belong with, not appended at
   the end of the file.** `20b55fc` adds three keys directly after
   `multiplication_quiz_category` and before `time_up`:
   ```
   @@ -54,6 +54,9 @@
      "minutes": "Minuten",
      "multiplication_quiz_name": "Einmaleins (1×1 bis 10×10)",
      "multiplication_quiz_category": "🔢 Mathematik",
   +  "multiplication_range_from": "Von",
   +  "multiplication_range_to": "Bis",
   +  "multiplication_range_start": "Los geht’s",
      "time_up": "Zeit abgelaufen!",
   ```
3. **Single-language commits happen and are the known failure mode.** All four
   `multiplication_*` commits touch `components/locales/de.json` only
   (`20b55fc ... 1 file changed, 3 insertions(+)`). That is exactly how `de.json`
   ended up with 10 keys that `en.json` and `fi.json` lack. It also shows the
   commit-message convention for these: `feat(i18n): ...` plus a `QRSPI: <slug>`
   trailer.
4. **`en.json` is the reference and is edited last or simultaneously.** The most
   recent `en.json` change is a deletion, not an addition:
   ```
   $ git log -1 -p -- components/locales/en.json
   63287c5 fix: show multiplication tables quiz only in German quiz list
   ...
   -  "multiplication_quiz_name": "Multiplication Tables (1–10)",
   -  "multiplication_quiz_category": "📐 Mathematics",
   ```
   Commit body: "The generated Einmaleins round is for the German quiz set, so
   inject it only when the app language is German. Drops the unused English and
   Finnish name/category keys."

So new keys must be: flat, `snake_case`, English-named keys (the key itself is
English regardless of value language), feature-prefixed where a feature word
exists, inserted beside their feature block in all three files in the same
commit, and `en.json` is the source of the value naming.

### House convention worth matching: in-code English defaults

23 `t()` calls pass an English string as the second argument, which i18next uses
as the default value when the key is missing:

```
$ grep -rn "t('[a-z_]*', *'" --include=*.tsx --include=*.ts app/ components/ | wc -l
23
```

Examples: `app/(tabs)/profile.tsx:30` `{t('hello', 'Hello')}, {userName}! 👋`,
`components/Onboarding.tsx:61` `t('almost_there', 'Almost there!')`,
`components/LearningTodos.tsx:77` `t('question_to_review', 'question to review')`.
New strings in already-covered files should follow this form.

---

## Q4. Dynamic strings

### 1. Keys whose value contains i18next interpolation

Interpolation appears in exactly one English key, and in two German keys:

```
$ grep -n "{{" components/locales/en.json
101:  "progress_info": "Answer correctly {{remaining}} more times to master this question"

$ grep -n "{{" components/locales/fi.json
101:  "progress_info": "Vastaa oikein vielä {{remaining}} kertaa oppiaksesi tämän kysymyksen"

$ grep -n "{{" components/locales/de.json
57:  "multiplication_quiz_label_range": "Einmaleins ({{from}}×{{from}} bis {{to}}×{{to}})"
111:  "progress_info": "Noch {{remaining}} mal richtig beantworten, um diese Frage zu meistern"
```

| key | languages | placeholders | call site |
|---|---|---|---|
| `progress_info` | en, de, fi | `{{remaining}}` | `components/LearningTodos.tsx:178-183` |
| `multiplication_quiz_label_range` | de only | `{{from}}`, `{{to}}` | `app/(tabs)/index.tsx:524-528` |

Call sites, verbatim:

```
components/LearningTodos.tsx:180:                      'progress_info',
components/LearningTodos.tsx:181:                      'Answer correctly {{remaining}} more times to master this question',
components/LearningTodos.tsx:182:                      { remaining: 3 - selectedTodo.correctCount },

app/(tabs)/index.tsx:524:                  ? t('multiplication_quiz_label_range', {
app/(tabs)/index.tsx:525:                      from: multiplicationRange.from,
app/(tabs)/index.tsx:526:                      to: multiplicationRange.to,
```

Those two are the only `t()` calls in `app/` and `components/` that pass an
options object:

```
$ grep -rn "t('[a-z_]*', *{" --include=*.tsx --include=*.ts app/ components/
app/(tabs)/index.tsx:524:                  ? t('multiplication_quiz_label_range', {
```
(`progress_info` is missed by that pattern only because its key sits on its own
line, `LearningTodos.tsx:179-183`.)

Note the `{{from}}`/`{{to}}` label is a German-only key with an English-absent
twin, so a German label renders even in English if the language falls back. It
is reached only under `quiz.generator === MULTIPLICATION_GENERATOR`, and per
`63287c5` that generator is injected for German only.

### 2. Plural suffixes and `count`: none, anywhere

```
$ grep -rn "_one\|_other\|_zero\|_many" components/locales/
(no output, exit 1)
```

There is no `_one` / `_other` key in any locale file. No `t()` call passes a
`count` option either. The 9 `count:` hits are unrelated identifiers:

```
$ grep -rn "count:" --include=*.tsx --include=*.ts app/ components/
components/QuizSelection.tsx:44:  count: number;
components/QuizSelection.tsx:367:        count: groups[category].length,
components/QuizSelection.tsx:374:        count: uncategorized.length,
components/QuizSelection.tsx:403:  section: { title: string; data: Quiz[]; count: number };
components/QuizSelection.tsx:417:  section: { title: string; data: Quiz[]; count: number };
components/gamification/StreakDisplay.tsx:81:          count: styles.countSmall,
components/gamification/StreakDisplay.tsx:88:          count: styles.countLarge,
components/gamification/StreakDisplay.tsx:95:          count: styles.countMedium,
```

`QuizSelection.tsx:367` and `:374` are `SectionList` section metadata
(`components/QuizSelection.tsx:403` declares `{ title, data, count }`), not
i18next options. `StreakDisplay` hits are style keys.

### 3. Plural handling is hand-rolled today

Singular/plural is currently selected in JS with a ternary over two keys, not by
i18next. `components/LearningTodos.tsx:75-79`:

```
              {todos.length}{' '}
              {todos.length === 1
                ? t('question_to_review', 'question to review')
                : t('questions_to_review', 'questions to review')}
```

The singular/plural key pairs that exist:

| pair | en lines | fi | de |
|---|---|---|---|
| `question` / `questions` | `en.json:4`, `en.json:5` | `Kysymys` / `kysymystä` | `Frage` / `Fragen` |
| `question_to_review` / `questions_to_review` | `en.json:94`, `en.json:95` | `kerrattava kysymys` / `kerrattavaa kysymystä` | `Frage zu überprüfen` / `Fragen zu überprüfen` |

`fi.json:4-5` already encodes the Finnish partitive rule correctly
(`5 kysymystä`), so the existing two-key approach works for Finnish as long as
the count-1 branch is used for exactly 1.

### 4. Values containing digits, and strings that get a number glued on

No English or Finnish value contains a digit:

```
$ grep -n "[0-9]" components/locales/en.json
(no output, exit 1)
$ grep -n "[0-9]" components/locales/fi.json
(no output, exit 1)
$ grep -n "[0-9]" components/locales/de.json
55:  "multiplication_quiz_name": "Einmaleins (1×1 bis 10×10)",
62:  "multiplication_mode_count": "20 Aufgaben",
```

Numbers are concatenated in the component instead. Every place a number, count
or duration is embedded in a translated string:

| file:line | code | note |
|---|---|---|
| `app/(tabs)/settings.tsx:357-364` | ``label={`1 ${t('minutes')}`}`` … ``label={`30 ${t('minutes')}`}`` | 8 hardcoded number + unit; Finnish `minuuttia` and German `Minuten` both fit any count > 1, so this survives |
| `components/kids/MultiplicationRangeSheet.tsx:70` | ``label={`${minutes} ${t('minutes')}`}`` | same pattern |
| `components/SettingsHeader.tsx:88` | `{t('question')} {currentQuestionIndex + 1}` | "Question 3"; the number follows the noun, which is the correct order for en/de/fi, so no reformat needed |
| `components/Reader.tsx:59` | ``content += `${t('question')} ${questionNumber}: ${question.question}. `;`` | TTS output |
| `components/Reader.tsx:338` | ``label={`${t('question')} ${index + 1}`}`` | |
| `components/Reader.tsx:351` | `Currently reading: {t('question')} {currentQuestionIndex + 1} of{' '}` | the words `Currently reading` and `of` are hardcoded English |
| `components/Reader.tsx:381` | `{t('question')} {index + 1}` | |
| `components/gamification/DailyQuiz.tsx:85` | `{dailyQuizData.quiz.questions?.length \|\| 0} {t('questions')}` | number + `questions`; needs the singular branch at 1 |
| `components/gamification/StreakDisplay.tsx:183-186` | `{streak.currentStreak}` in one `<Text>`, `{t('day_streak')}` in the next | "7 day streak"; `en.json:58` is already singular-only, so 1 and 7 read the same in English |
| `components/gamification/XPProgress.tsx:151` | `{xp.totalXP.toLocaleString()} {t('total_xp')}` | |
| `components/gamification/XPProgress.tsx:182` | `` `${xp.xpForNextLevel - xp.xpInCurrentLevel} ${t('xp_to_next')}` `` | |
| `components/gamification/GamificationStats.tsx:68,78,96,106,111,116` | `t('quizzes')`, `t('accuracy')`, `t('questions_answered')`, `t('perfect_scores')`, `t('Quiz_wins')`, `t('days_played')` | labels beside numeric counters |
| `components/LearningTodos.tsx:75` | `{todos.length}{' '}` | count + plural pair, see above |

No translated value embeds a date or a formatted time. There is no date/`Intl`
formatting in any locale string.

### 5. Where count forms are actually needed

Ranked by whether the English reads wrong at 1:

1. `question`/`questions` (`en.json:4-5`) at `DailyQuiz.tsx:85`. At 1 question
   the English prints "1 questions". This is the one real plural bug reachable
   today.
2. `question_to_review`/`questions_to_review` (`en.json:94-95`) at
   `LearningTodos.tsx:76-78`. Already handled by a ternary; correct.
3. `day_streak` (`en.json:58`). No plural form exists. English "1 day streak"
   and "7 day streak" are both acceptable, so it needs no count form.
4. `minutes` (`en.json:54`). All call sites use counts >= 1; Finnish partitive
   `minuuttia` and German `Minuten` are correct for every count offered, so no
   count form is needed unless a 1-minute option is ever added (it already is:
   `settings.tsx:357` `1 ${t('minutes')}` renders "1 minutes", and Finnish
   "1 minuuttia" instead of "1 minuutti").

Everything else (`Quiz_wins`, `quizzes`, `days_played`, `xp_to_next`,
`total_xp`) is a bare label beside a number and is count-invariant in all three
languages.

---

## Q7. Translation quality

Method: every key of `en.json` read against the same key in `de.json` and
`fi.json`. Only keys with a defect are listed. No fixes applied.

### German (`components/locales/de.json`)

Bucket key: (a) still English, (b) mistranslated, (c) grammatically wrong or
unnatural, (d) wrong register, (e) broken placeholder.

| # | key | current value | bucket | problem |
|---|---|---|---|---|
| 1 | `quiz_title` (`de.json:2`) | `Quizzy (DE)` | asymmetry | en (`en.json:2`) and fi (`fi.json:2`) both say `Quizzy`. See the dedicated finding below. |
| 2 | `reader_mode_desc` (`de.json:42`) | `Text-zu-Sprache-Vorlesung von Fragen und Antworten aktivieren` | (b) | `Vorlesung` means a university lecture, not reading aloud. The feature is text-to-speech playback, so the correct noun is `Vorlesen`. |
| 3 | `enable_sound` (`de.json:24`) | `Sound` | (a) | Byte-identical to `en.json:24`. Defensible as a German loanword (Duden lists `Sound`), but it is an untranslated value and the only one left. |
| 4 | `max_level` (`de.json:73`) | `Max Level!` | (a) | Byte-identical to `en.json:63`. `Level` is an accepted German loanword, so same caveat as row 3. |
| 5 | `day_streak` (`de.json:68`) | `Tage Serie` | (c) | Two bare nouns with no hyphen and no compound. Should be a compound (`Tage-Serie`) or a phrase (`Tage in Folge`). As written it reads like two words side by side. |
| 6 | `total_xp` (`de.json:71`) | `Gesamt XP` | (c) | `Gesamt` is a bound prefix, not a free adverb; needs the hyphen (`Gesamt-XP`) or a postposition (`XP gesamt`). |
| 7 | `keep_playing` (`de.json:79`) | `Weiterspielen zum Entdecken!` | (c) | Noun-ised infinitive plus a bare `zum` phrase; not idiomatic. Natural German is an imperative with a purpose clause (`Spiel weiter, um mehr zu entdecken!`). |
| 8 | `resets_in` (`de.json:85`) | `Setzt zurück in` | (c) | Reads as "resets back in", and `setzt zurück` without an object is incomplete. Also unusable as a prefix for a time value. The key is dead code (see note below), so low risk. |
| 9 | `question_to_review` (`de.json:104`) | `Frage zu überprüfen` | (c) | `zu überprüfen` means "to be verified", which is a different action from reviewing/repeating. Also a bare infinitive phrase with no article, so it is not a countable noun phrase; it cannot be prefixed by a number. |
| 10 | `questions_to_review` (`de.json:105`) | `Fragen zu überprüfen` | (c) | Same defect as row 9. Called at `LearningTodos.tsx:78` right after `{todos.length}`, where it prints e.g. `4 Fragen zu überprüfen`. |
| 11 | `progress_info` (`de.json:111`) | `Noch {{remaining}} mal richtig beantworten, um diese Frage zu meistern` | (c) | `mal` is capitalised `Mal` when it follows a number as a noun. Minor, but visible. |
| 12 | `name_helper` (`de.json:120`) | `Dies hilft, dein Erlebnis zu personalisieren` | (c) | Word-for-word calque of the English. Natural German is `Damit wird dein Erlebnis persönlicher` (or similar). `Dies hilft` as a sentence opener is stiff. |
| 13 | `enable_notifications_desc` (`de.json:20`) | `Ermöglicht dem Benutzer, Erinnerungsbenachrichtigungen ein- oder auszuschalten` | (d) | Third person (`dem Benutzer`) while the rest of `de.json` addresses the user as `du`: `de.json:51` `Fordere dich selbst heraus!`, `de.json:103` `Fragen, die du falsch beantwortest`, `de.json:116` `Wähle deine Sprache`, `de.json:119` `Gib deinen Namen ein`. |
| 14 | `show_explanation_desc` (`de.json:23`) | `Ermöglicht dem Benutzer, die Validierung der Antwort auszublenden` | (d) | Same register break as row 13. |
| 15 | `language_helper` (`de.json:117`) | `Du kannst das später in den Einstellungen ändern` | (d) | Capitalised `Du` while the file uses lowercase `du` at `de.json:103`. The rest of the file is informal, so `du` is right and this one is inconsistent. |
| 16 | `text_input_mode` (`de.json:46`) | `Antwort eintippen` | (d) | `eintippen` is colloquial; `eingeben` is the UI-standard register used by the same file's `de.json:118` `Gib deinen Namen ein`. |

Total German defects: **16** (2 of them bucket (a), so 14 real translation
problems plus the `quiz_title` asymmetry).

### Finnish (`components/locales/fi.json`)

| # | key | current value | bucket | problem |
|---|---|---|---|---|
| 1 | `enable_sound` (`fi.json:24`) | `käyttöön` | (b) | Translates "on" / "into use", not "Sound". The settings row for sound therefore reads as a bare `käyttöön`. This is the worst value in the file: it is a mistranslation of the neighbouring label, and it collides with `enable_notifications` `Ota ilmoitukset käyttöön` (`fi.json:18`). |
| 2 | `use_flashcards` (`fi.json:21`) | `muistilappuja` | (b)/(c) | Partitive plural ("some flashcards"), the case used for counting, not for a standalone settings label. A label needs the nominative `muistilaput`. It also sits opposite `enable_notifications` which is nominative. |
| 3 | `learning_todos` (`fi.json:91`) | `Oppimistehtävät` | (b) | Means "learning assignments", not "learning to-do's". The en value (`en.json:90`) is a task list to review wrong answers, so `Oppimistehtävät` overstates it. |
| 4 | `Quiz_wins` (`fi.json:34`) | `Voitettu` | (c) | A past participle ("won"), not a noun. As a counter label it needs the nominative plural `Voitot`. Used at `components/gamification/GamificationStats.tsx:111` as a label next to a number. |
| 5 | `Quiz_losses` (`fi.json:35`) | `Hävitty` | (c) | Same defect: participle instead of noun (`Häviöt`). |
| 6 | `day_streak` (`fi.json:58`) | `päivän sarja` | (c) | Genitive `päivän` ("the day's streak") and lowercase. For "7 day streak" the natural Finnish is `päivää putkeen` or `päivän putki`. Rendered at `StreakDisplay.tsx:186` directly after the number, so the genitive reads wrong. |
| 7 | `keep_playing` (`fi.json:69`) | `Jatka pelaamista löytääksesi!` | (c) | `löytääksesi` ("in order that you find") has no object and the sentence stops. Incomplete. |
| 8 | `progress_info` (`fi.json:101`) | `Vastaa oikein vielä {{remaining}} kertaa oppiaksesi tämän kysymyksen` | (c) | `oppiaksesi tämän kysymyksen` is missing the verb of what is being learned (`ulkoa`), so it reads as "to learn this question". Also `Vastaa oikein vielä` is a less natural order than `Vastaa vielä oikein`. |
| 9 | `retry_wrong` (`fi.json:103`) | `Yritä vääriä uudelleen` | (c) | `vääriä` is a bare partitive with no head noun; reads as "try wrong ones again" and is ungrammatical as a button label. Needs `Yritä väärät uudelleen` or a noun. |
| 10 | `resets_in` (`fi.json:75`) | `Nollautuu` | (c) | Means "resets to zero" and drops the "in <time>" that the key exists to carry. Cannot be used as a prefix for a duration. The key is dead code (see note below), so low risk. |
| 11 | `name_helper` (`fi.json:110`) | `Tämä auttaa personoimaan kokemustasi` | (c) | Clunky anglicism (`personoida` borrowed from "personalise"). Grammatical but stiff; `Tämän avulla kokemuksesi mukautuu sinulle` is the natural phrasing. |
| 12 | `remote_address_desc` (`fi.json:29`) | `URL json-tiedostoon, jossa on tietovisadataa` | (c) | `json` is lowercase where the same file writes `JSON` nowhere but `en.json`/`de.json` write `json`/`JSON`; the bigger issue is that `URL json-tiedostoon` has no case government, so it reads as two nouns in a row. |
| 13 | `timer_mode` (`fi.json:50`) | `Quiz-ajastin` | (c) | Terminology break: the file translates "quiz" as `tietovisa` everywhere else (`fi.json:3` `Valitse tietovisa:`, `fi.json:32` `tietovisan tilastot`, `fi.json:88` `Tietovisat`) but switches to the English loanword here, and `fi.json:51` repeats it as `quizin`. |
| 14 | `timer_mode_desc` (`fi.json:51`) | `Aseta aikaraja quizin suorittamiselle. Haasta itsesi!` | (c) | Same terminology break as row 13 (`quizin`). |
| 15 | `show_explanation` (`fi.json:10`) | `selitys` | (c) | Lowercase where every other button label in the file is capitalised, and it sits opposite `hide_explanation` `Piilota selitys` (`fi.json:11`) which is capitalised. |
| 16 | `enable_music` (`fi.json:40`) | `musiikki` | (c) | Lowercase label, inconsistent with `Musik` (`de.json:39`) and `Music` (`en.json:39`) and with the file's own capitalisation elsewhere. |
| 17 | `score` (`fi.json:12`) and `scores` (`fi.json:13`) | both `Pisteet` | (c) | The two English keys are distinct (`en.json:11-12` `Score` / `Scores`); Finnish collapses both to the plural `Pisteet`, so the singular label becomes "Points". Informational loss rather than a grammar error. |
| 18 | `max_level` (`fi.json:63`) | `Max taso!` | (c) | `Max` is an abbreviation glued to a bare noun; Finnish would be `Maksimitaso!`. Minor. |

Total Finnish defects: **18**.

### The `quiz_title` asymmetry

Finding: `de.json:2` is `"quiz_title": "Quizzy (DE)"` while `en.json:2` and
`fi.json:2` are `"Quizzy"`. The suffix is a development marker, not a
translation, and it leaks into whatever screen renders `quiz_title`.

When it appeared:

```
$ git log -p -- components/locales/de.json | grep -n "quiz_title"
195:   "quiz_title": "Quizzy (DE)",
519:+  "quiz_title": "Quizzy (DE)",
```

```
$ git log --format='%h %ad %s' --date=short -S'"Quizzy (DE)"' -- components/locales/de.json
90f9cbe 2025-06-10 feat: Implement internationalization support with English and German translations
```

It has been there since the very first commit that created `de.json`, on
2025-06-10, and it has never been changed:

```
$ git show 90f9cbe:components/locales/de.json | head -6
{
  "quiz_title": "Quizzy (DE)",
  "select_quiz": "Quiz auswählen:",
  "question": "Frage",
  "correct": "Richtig!",
```

The same commit added `en.json` with `"quiz_title": "Quizzy"`. So there is no
commit message that justifies the suffix; the most likely reading is that it was
a marker to tell the two files apart during development. Reported, not fixed, per
the ticket.

### Two extra findings from this pass

1. **`en.json` has an inverted answer pair, and the keys are dead.** `en.json:36`
   `"Answers_right": "Wrong Answers"` and `en.json:37`
   `"Answers_wrong": "Correct Answers"`. German (`de.json:36-37` `Richtige
   Antworten` / `Falsche Antworten`) and Finnish (`fi.json:36-37` `Oikeita
   vastauksia` / `Vääriä vastauksia`) are semantically correct, so English is the
   odd one out. Neither key is referenced anywhere in code:
   ```
   $ grep -rn "Answers_right\|Answers_wrong" --include=*.tsx --include=*.ts --include=*.json . | grep -v node_modules
   ./components/locales/fi.json:36:  "Answers_right": "Oikeita vastauksia",
   ./components/locales/fi.json:37:  "Answers_wrong": "Vääriä vastauksia",
   ./components/locales/en.json:36:  "Answers_right": "Wrong Answers",
   ./components/locales/en.json:37:  "Answers_wrong": "Correct Answers",
   ./components/locales/de.json:36:  "Answers_right": "Richtige Antworten",
   ./components/locales/de.json:37:  "Answers_wrong": "Falsche Antworten",
   ```
   They are the only locale keys with no call site. Because they are dead, the
   inverted English is invisible today; it becomes a bug the moment someone wires
   them up.
2. **`resets_in` is dead too.** Repo-wide, the only occurrences are the three
   locale files (`en.json:75`, `de.json:85`, `fi.json:75`). No call site. That
   downgrades German row 8 and Finnish row 10 from user-visible defects to
   latent ones.

---

## Q8. Test feasibility

### Correction to the ticket's premise

The ticket says "There are **no jest unit tests** in the repo". That is wrong:
there are 15 tracked jest suites, and 14 of them are plain Node tests with no
component tree.

```
$ npx jest --listTests
/home/maverock24/gitrepos/Quizzy/components/__tests__/StyledText-test.js
/home/maverock24/gitrepos/Quizzy/services/__tests__/answerMode.test.js
/home/maverock24/gitrepos/Quizzy/services/__tests__/multiplicationProblems.test.js
/home/maverock24/gitrepos/Quizzy/services/__tests__/multiplayerRejoin.test.js
/home/maverock24/gitrepos/Quizzy/services/__tests__/multiplayerHost.test.js
/home/maverock24/gitrepos/Quizzy/services/__tests__/multiplayerJoin.test.js
/home/maverock24/gitrepos/Quizzy/services/__tests__/multiplayerRules.test.js
/home/maverock24/gitrepos/Quizzy/services/__tests__/presence.test.js
/home/maverock24/gitrepos/Quizzy/services/__tests__/multiplayerCreate.test.js
/home/maverock24/gitrepos/Quizzy/services/__tests__/multiplayerClientActions.test.js
/home/maverock24/gitrepos/Quizzy/services/__tests__/multiplayerQuizPayload.test.js
/home/maverock24/gitrepos/Quizzy/services/__tests__/multiplayerDeparture.test.js
/home/maverock24/gitrepos/Quizzy/services/__tests__/roomCode.test.js
/home/maverock24/gitrepos/Quizzy/services/__tests__/timedRound.test.js
/home/maverock24/gitrepos/Quizzy/services/__tests__/multiplayerFailures.test.js
EXIT_CODE:0
```

Why the ticket missed them: they are `.js`, and the ticket's scan looked for
`.spec.ts` / `.test.ts`. `git ls-files | grep __tests__` lists all 15 as
tracked.

Full suite, actually run:

```
$ npx jest
PASS services/__tests__/multiplayerClientActions.test.js
... (15 suites)
Snapshot Summary
 › 1 snapshot written from 1 test suite.

Test Suites: 15 passed, 15 total
Tests:       155 passed, 155 total
Snapshots:   1 written, 1 total
Time:        1.843 s
Ran all test suites.
EXIT_CODE:0
```

Side effect of that run, disclosed because it wrote to the working tree: the
snapshot suite (`components/__tests__/StyledText-test.js:8`
`expect(tree).toMatchSnapshot()`) has **no committed snapshot**, so the run
created `components/__tests__/__snapshots__/StyledText-test.js.snap` as an
untracked file. I removed it; `git status --porcelain` is back to `?? .scratch/`
only.

### Config inventory

- **No `jest.config.*` at all.** `ls jest.config.* jest.setup.* setupTests.*` →
  all "No such file or directory". Jest is configured entirely from
  `package.json`.
- **`package.json:14-21`** is the whole config:
  ```
  "jest": {
    "preset": "jest-expo",
    "testPathIgnorePatterns": [
      "/node_modules/",
      "/__rsc_tests__/",
      "/e2e/"
    ]
  },
  ```
- **`package.json:10`** `"test": "jest --watchAll"`. Confirmed: never exits, so it
  is unusable as a gate call.
- **`jest-expo`** is a devDependency at `package.json:116`
  `"jest-expo": "~52.0.6"`; installed version `52.0.6`.
- **`jest`** is at `package.json:115` `"jest": "^29.2.1"`; installed `29.7.0`.
- **`react-test-renderer`** `18.3.1` is present, used by the snapshot test.
- **No `@testing-library/react-native`, no `@testing-library/jest-native`, no
  `ts-jest`, no `@testing-library` scope at all:**
  ```
  $ ls -d node_modules/@testing-library node_modules/ts-jest
  ls: cannot access 'node_modules/@testing-library': No such file or directory
  ls: cannot access 'node_modules/ts-jest': No such file or directory
  ```
  TypeScript therefore goes through `babel-jest` with the Expo preset, i.e.
  type-checked only as far as Babel strips types. A `.test.ts` runs, but its
  types are not checked by jest.
- **`babel.config.js` exists** and is the Expo preset with NativeWind and the
  `@` alias:
  ```
  presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  plugins: [['module-resolver', { root: ['./'], alias: { '@': './', 'tailwind.config': './tailwind.config.js' } }]],
  ```

### Would `components/locales/locale-parity.test.ts` be picked up?

Yes. From `npx jest --showConfig`:

```
testMatch = [
 "**/__tests__/**/*.[jt]s?(x)",
 "**/?(*.)+(spec|test).[tj]s?(x)"
]
testPathIgnorePatterns = [
 "/node_modules/",
 "/__rsc_tests__/",
 "/e2e/"
]
rootDir = "/home/maverock24/gitrepos/Quizzy"
```

Glob check against those patterns:

```
$ node -e "const mm=require('micromatch'); ..."
components/locales/locale-parity.test.ts -> MATCHES testMatch
components/locales/locale-parity.test.js -> MATCHES testMatch
components/locales/locale-parity.spec.ts -> MATCHES testMatch
components/locales/__tests__/locale-parity.ts -> MATCHES testMatch
```

`/__tests__/` note: the first `testMatch` pattern treats **every** file inside a
`__tests__` directory as a test, helpers included. So a helper module must not
live in `__tests__`.

Ignore-pattern check: none of `/node_modules/`, `/__rsc_tests__/`, `/e2e/`
appears in the absolute path
`/home/maverock24/gitrepos/Quizzy/components/locales/locale-parity.test.ts`, so
it is kept. (The same reasoning explains why `e2e/multiplayer.spec.ts` matches
`testMatch` yet never appears in `--listTests`: its absolute path contains
`/e2e/`.)

### Exact commands

Single locale-parity test, run to completion, no watch mode:

```
npx jest components/locales/locale-parity.test.ts
```

Verified equivalent for an existing suite:

```
$ npx jest services/__tests__/answerMode.test.js
PASS services/__tests__/answerMode.test.js
  isTypedAnswer
    ✓ accepts a plain integer (2 ms)
    ... (15 tests)
Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
Time:        0.387 s, estimated 1 s
Ran all test suites matching /services\/__tests__\/answerMode.test.js/i.
EXIT_CODE:0
```

`npx jest <path>` does not watch when stdout is not a TTY, so it exits. For belt
and braces: `npx jest --watchAll=false components/locales/locale-parity.test.ts`.
Full suite to completion: `npx jest`.

### What the parity test must import

Import the JSON directly:

```
import en from './en.json';
import de from './de.json';
import fi from './fi.json';
```

Do **not** import `components/i18n.ts` from a Node test if avoidable. That module
imports `react-native-localize` (`components/i18n.ts:4`), whose installed
package (`3.4.1`) declares no `jest` field:
```
$ node -e "const p=require('./node_modules/react-native-localize/package.json'); console.log('version',p.version); console.log('has jest field:', !!p.jest)"
version 3.4.1
has jest field: false
```
`jest-expo`'s `setupFiles` do load React Native's setup
(`node_modules/react-native/jest/setup.js`,
`node_modules/jest-expo/src/preset/setup.js`), so the import would probably work,
but nothing in the repo proves it and the parity test does not need it. Keep the
test to plain JSON imports and it depends on neither RN nor a component tree.

---

## Q9. Re-render reliability

### The registration is correct

`components/i18n.ts` uses `initReactI18next` and sets no `react` options block
and no `bindI18n`:

```
$ grep -n "initReactI18next|\.use(|fallbackLng|resources|react:|bindI18n|useSuspense|interpolation" components/i18n.ts
2:import { initReactI18next } from 'react-i18next';
34:i18n.use(initReactI18next).init({
36:  fallbackLng: 'en',
37:  resources: {
42:  interpolation: {
```

Full option set passed to `.init()` (`components/i18n.ts:34-45`): `lng`,
`fallbackLng`, `resources`, `interpolation: { escapeValue: false }`. That is all.
No `react: { useSuspense: false }`, no `react: { bindI18n }`, no
`bindI18nStore`. Defaults therefore apply: `react-i18next` v15 binds to
`languageChanged` and `loaded`, and every component that calls `useTranslation()`
re-renders on `changeLanguage`.

No component in the tree is memoised, so nothing can swallow that re-render:

```
$ grep -rn "React.memo\|export default memo" --include=*.tsx --include=*.ts app/ components/
(no output, exit 0)
```

19 files call `useTranslation` (`grep -rl useTranslation app/ components/ | wc -l`
→ `19`).

### Places that copy `i18n.language` into local state

```
$ grep -rn "i18n\.language" --include=*.tsx --include=*.ts app/ components/
app/(tabs)/settings.tsx:189:                selectedValue={i18n.language}
components/useReadAloud.ts:327:      const lang = langOverride || i18n.language || 'en';
components/useReadAloud.ts:580:    [i18n.language, stopTTS],
components/Onboarding.tsx:25:  const [language, setLanguage] = useState(i18n.language || 'en');
components/Quizprovider.tsx:79:  const lang = i18n.language || 'en';
components/Quizprovider.tsx:116:  const [language, setLanguageState] = useState<string>(i18n.language || 'en');
components/Quizprovider.tsx:421:    setLanguageState(i18n.language || 'en');
components/Quizprovider.tsx:671:      setLanguageState(savedLanguage || i18n.language || 'en');
components/Quizprovider.tsx:686:      if (savedLanguage && savedLanguage !== i18n.language) {
components/Quizprovider.tsx:757:  // Listen for i18n.language or userQuizLoadEnabled changes and update quizzes accordingly
components/Quizprovider.tsx:766:      setLanguageState(i18n.language);
components/Quizprovider.tsx:768:  }, [i18n.language, userQuizLoadEnabled]);
```

Verdict per site:

| site | what it is | stale risk |
|---|---|---|
| `app/(tabs)/settings.tsx:189` | `selectedValue` prop of the language `Picker`, read during render | none: the component also calls `useTranslation`, so it re-renders and re-reads |
| `components/useReadAloud.ts:327` | read inside a callback at call time | none |
| `components/useReadAloud.ts:580` | dependency array | none; it is a correct dep |
| `components/Quizprovider.tsx:79` | read inside `getLocalQuizzes()` body, a plain function called per invocation | none |
| `components/Quizprovider.tsx:116` | `useState` initial value | none, because `:766` re-syncs it in an effect keyed on `[i18n.language, userQuizLoadEnabled]` (`:768`) |
| `components/Quizprovider.tsx:421`, `:671`, `:686` | reset / load / compare paths | none |
| `components/Onboarding.tsx:25` | `useState(i18n.language \|\| 'en')`, **no sync effect** | yes, this is the one. Its own `handleLanguageChange` (`Onboarding.tsx:28-31`) keeps the two in step, and the strings it renders go through `t()` (reactive), so nothing renders stale today. But the local `language` value is what gets passed to `onComplete(name, language)` (`Onboarding.tsx:37`), and if language ever changes from elsewhere while Onboarding is mounted, that value would be stale. Verified by reading `components/Onboarding.tsx:1-45`; no `useEffect` there. |

So: `changeLanguage` reliably re-renders every `t()` call. The only local copy
without a sync effect is `Onboarding.tsx:25`, and it affects a persisted
preference value rather than rendered text.

### Versions

- `package.json:113` `"i18next": "^25.2.1"`, installed `25.2.1`.
- `package.json:139` `"react-i18next": "^15.5.2"`, installed `15.5.2`.

```
$ node -e "... versions ..."
jest 29.7.0
jest-expo 52.0.6
i18next 25.2.1
react-i18next 15.5.2
react-test-renderer 18.3.1
```

---

## Q10. Content vs chrome

Both files are quiz **content**, English-only, long-form prose, and both are
rendered as user-facing text. Neither is interface chrome.

### `assets/essays_en.json`

Top-level is an array of 3 essays. Shape: `category`, `title`, `sections[]`, and
each section is `heading`, `image`, `content`.

```
$ node -e "..."
type: array len 3
0 keys: category,title,sections | category: ☁️ Cloud & AWS | sections: 13
1 keys: category,title,sections | category: 🤖 AI & Machine Learning | sections: 16
2 keys: category,title,sections | category: 💻 Programming & Development | sections: 18
section keys: heading,image,content
```

First 300 chars of the file:

```
[
    {
        "category": "☁️ Cloud & AWS",
        "title": "Cloud Computing & AWS — Your Complete Guide",
        "sections": [
            {
                "heading": "What Even IS Cloud Computing?",
                "image": "cloud_pizza_model.png",
                "content": "Imagine you need electricity. You could build your own power plant, buy generators, hire engineers, and maintain turbines. Or, you could simply plug into the grid and pay for what you use. Cloud computing is exactly like that power grid, ...
```

47 sections total, each a multi-paragraph English essay body.

### `assets/glossary.json`

Top-level is one flat object of 350 `term -> definition` pairs, `term` used as the
map key.

```
type: object
keys: A/B Testing,A100 GPU,ACID,AI,API,API Key,AWS,Accuracy
glossary terms: 350
```

```
{
  "A/B Testing": "A controlled experiment comparing two model versions by routing a portion of live traffic to each. Measures which model performs better on real business metrics before full rollout.",
  "A100 GPU": "NVIDIA A100 — a high-end data center GPU with 40GB or 80GB VRAM. Designed for demanding training and inference workloads. Common in cloud GPU rentals for LLM fine-tuning.",
```

### They are rendered as text in the UI

Both are. This is content on screen, not hidden data:

- `components/EssayReader.tsx:55` `{essay.category}`, `:56` `{essay.title}`,
  `:58` `{essay.sections.length} sections`, `:75` `{section.heading}`,
  `:84` `{section.content}`. Header, body and image captions all come from the
  JSON. `:58` is the one hardcoded English string in that component
  (`sections` is literally English, unwrapped).
- `components/GlossaryModal.tsx:135` `{item.term}`, `:137` `{item.definition}`,
  `:154` `{selectedTerm.term}`, `:158` `{selectedTerm.definition}`, plus the
  hardcoded header `:202` `{selectedTerm ? 'Definition' : 'AI/ML Glossary'}`.
- `components/GlossaryProvider.tsx:8` `import glossaryData from
  '@/assets/glossary.json'` and `:39-43` turns the object into a sorted
  `GlossaryEntry[]` (`{ term, definition }`, type at `GlossaryProvider.tsx:10-13`).
- `components/Quizprovider.tsx:107-110`:
  ```
  const getLocalEssays = (): CategoryEssay[] => {
    // Only English essays exist for now; extend with de/fi when available
    return require('../assets/essays_en.json');
  };
  ```

### Only `essays_en.json` exists

```
$ ls assets/ | grep -i "essay|glossary"
essay_images
essays_en.json
glossary.json
```

There is no `essays_de.json`, `essays_fi.json`, `glossary_de.json` or
`glossary_fi.json`. Repo-wide the only references are
`components/GlossaryProvider.tsx:8` and `components/Quizprovider.tsx:109`
(grep for `essays_en|essays_de|essays_fi|glossary.json|glossary_de|glossary_fi`
across the repo returns exactly those two lines). The code comment at
`Quizprovider.tsx:108` states the intent explicitly: "Only English essays exist
for now; extend with de/fi when available".

### Verdict for scope

The **bodies** of both files are content and stay out of scope, consistent with
the ticket's assumption about `assets/quizzes_*.json`: 47 essay sections and 350
glossary definitions are a translation project, not a string sweep, and there is
no `_de`/`_fi` variant to key into.

The **chrome around them** is UI text and does belong in scope. Two examples
found while checking: `EssayReader.tsx:58` `{essay.sections.length} sections`
(hardcoded, English, count-sensitive) and `GlossaryModal.tsx:202`
`'Definition'` / `'AI/ML Glossary'` (hardcoded). Both are in files the ticket
already lists as having no `useTranslation`, so the ticket's file list already
covers them; Q1's inventory is where the full count belongs.
