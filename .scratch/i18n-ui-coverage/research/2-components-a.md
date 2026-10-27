# Research stage, question 1 / 2 / 11, file set `components/` (part A)

Answers only questions 1, 2 and 11, restricted to the 19 files assigned to this
window. Every file was read end to end with the read tool. Line numbers are from
the file as it is on `master` at the time of this reading.

Terms used below:

- JSX text: a literal sitting directly between tags.
- ternary: a literal selected by a `? :` or `&&` expression.
- template: a template literal, interpolation shown as `${...}`.
- Alert: a title or body argument of `Alert.alert`.
- prop:placeholder / prop:accessibilityLabel: the literal value of that prop.
- constant: a module-level or in-function literal that reaches the screen.
- N user-facing: count of literals listed for that file.

---

## components/Flashcards.tsx — 3 user-facing strings (useTranslation: no)

Note first: this file does **not** import `useTranslation`. Line 20 is
`import { t } from 'i18next';`, the bare instance import. It is a direct call,
not the reactive hook.

- `Flashcards.tsx:445` — "Loading or no more flashcards..." (JSX text; empty-state of the carousel when `topCardData` is falsy)
- `Flashcards.tsx:498` — "dump" (JSX text; label under the `arrow-left` icon, swipe-left affordance)
- `Flashcards.tsx:550` — "Keep" (JSX text; label under the `arrow-down` icon, swipe-down affordance)

Not user-facing in this file: the `Answer` type, `FALLBACK_CARD_WIDTH`,
`DEFAULT_CARD_HEIGHT`, `NEXT_CARD_*` animation constants, every
`StyleSheet.create` key, the `require()` paths, `key={`${nextCardData.id}-next`}`.
The numbers rendered at lines 108 and 132 (`{selectedQuizAnswersAmount}`) are
data, not text.

Covered already: `Flashcards.tsx:480` — `{t('use_flashcards')}`.

## components/GlossaryModal.tsx — 5 user-facing strings (useTranslation: no)

- `GlossaryModal.tsx:202` — "Definition" (ternary; header title when a term is open)
- `GlossaryModal.tsx:202` — "AI/ML Glossary" (ternary; header title in list mode)
- `GlossaryModal.tsx:219` — "Search terms..." (prop:placeholder on the `TextInput`)
- `GlossaryModal.tsx:264` — "No matching terms found" (ternary; `ListEmptyComponent`)
- `GlossaryModal.tsx:265` — `${filteredTerms.length} terms available` (template; `ListEmptyComponent`, needs plural handling)

Not user-facing: `{ item.term }` and `{ item.definition }` (lines 135, 137, 154,
157) come from `assets/glossary.json` and are content, not chrome. The
`window.history.pushState({ glossaryModal: true }, ...)` marker (line 48) is
internal state. `styles.*` names, `name="search-outline"`, `name="close-circle"`
are icon ids.

## components/GlossaryProvider.tsx — 0 user-facing strings (useTranslation: no)

Renders only `{children}`. The only literal that can surface is
`GlossaryProvider.tsx:90` — "useGlossary must be used within a GlossaryProvider"
in `throw new Error`, a developer error, not UI. NOT user-facing.

## components/ClickableTerms.tsx — 0 user-facing strings (useTranslation: no)

Every visible character comes from the `text` prop or from `assets/glossary.json`
via `useGlossary()`. `termLink` style name and `'term' | 'text'` segment type
strings are internal.

## components/MultiplayerScoreboard.tsx — 5 user-facing strings (useTranslation: no)

- `MultiplayerScoreboard.tsx:26` — "Left" (ternary; `label` when `p.left`)
- `MultiplayerScoreboard.tsx:28` — "Finished" (ternary; `label` when `p.finished`)
- `MultiplayerScoreboard.tsx:30` — `Q${Math.min(p.progress + 1, q)}/${q}` (template; progress label, rendered at line 52)
- `MultiplayerScoreboard.tsx:34` — "You" (ternary; your own row name)
- `MultiplayerScoreboard.tsx:34` — `⚔️ ${p.name}` (template; rival row name)

Five more strings render on line 73 through `leadLabel(standing)`, defined
outside this file in `services/multiplayerRules.ts`:

- `services/multiplayerRules.ts:129` — "Waiting for your rival"
- `services/multiplayerRules.ts:130` — "Opponent left"
- `services/multiplayerRules.ts:131` — `${-lead} behind` (template)
- `services/multiplayerRules.ts:132` — `You're ahead by ${lead}` (template)
- `services/multiplayerRules.ts:132` — "Tied"

So this component puts 10 translatable strings on screen, 5 of them defined in
`services/`. The plan must not miss the `services/` half.

## components/Music.tsx — 0 user-facing strings (useTranslation: no)

Returns `null` (line 38). Only literals are `require()` paths and the comment
`// Lower volume`. Also not imported anywhere by a `components/` file, but it is
mounted from `app/_layout.tsx:110`.

## components/OfflineIndicator.tsx — 2 user-facing strings (useTranslation: no)

- `OfflineIndicator.tsx:69` — "✓ Back online" (ternary; banner after reconnect)
- `OfflineIndicator.tsx:69` — "Offline - Using cached data" (ternary; offline banner)

Not user-facing: `'#4caf50'`, `'#ff9800'`, the `-100` sentinel, `'web'` platform
checks, `styles.*`. No consumer in the repo: grep over `app/` and `components/`
finds no import of `OfflineIndicator`, so it is dead code today (see question 2).

## components/QuizTimer.tsx — 0 user-facing strings (useTranslation: no)

The only rendered output is `formatTime(secondsLeft)` (line 115), a
zero-padded `MM:SS` string. There is no word to translate. `'light' | 'medium' |
'success'` style type names, `pulseAnim` values and `styles.*` are internal.
`MM:SS` is locale-neutral as written.

## components/Score.tsx — 5 user-facing strings (useTranslation: yes)

- `Score.tsx:337` — "🎉 Well Done! 🎉" (ternary; winner heading)
- `Score.tsx:338` — "💪 Try again!" (ternary; loser heading)
- `Score.tsx:342` — "✨ Perfect Score! ✨" (ternary; sub-heading when `isPerfect`)
- `Score.tsx:342` — "Great job!" (ternary; sub-heading otherwise)
- `Score.tsx:416` — "🎉 Well Done! 🎉" (JSX text; the `flashcardsEnabled` branch heading)

Covered already, same file:

- `Score.tsx:335` — `{`⏰ ${t('time_up')} ⏰`}` (template around a translated key)
- `Score.tsx:377` — `{t('score')}`
- `Score.tsx:398` — `🔄 {t('retry_wrong', 'Retry Wrong Answers')} ({wrongAnswerCount})` (template plus an untranslated count in parentheses)

Not user-facing: `confettiColors`, `celebrationEmojis` (pure emoji array, line 295), `'0deg'`,
`'-15deg'`, `outputRange` angle strings, `'⭐'` in `StarBurst`
(line 148), `styles.*`, the `%` sign and `{displayScore} / {selectedQuizAnswersAmount}`
numbers.

## components/Question.tsx — 3 user-facing strings (useTranslation: yes)

- `Question.tsx:158` — "+1 ✨" (JSX text; floating score popup)
- `Question.tsx:267` — "A:", "B:", "C:", "D:" (constant `answerLabels`; rendered at `Question.tsx:973` as `{answerLabels[index]}` and spoken by TTS at `Question.tsx:709`)
- `Question.tsx:826` — "Read question and answers aloud" (prop:accessibilityLabel on the read-aloud `TouchableOpacity`)

Covered already, same file:

- `Question.tsx:851` — `placeholder={t('type_your_answer')}`
- `Question.tsx:868` — `{t('submit_answer')}` (submit button)
- `Question.tsx:890` — `{t('correct_answer_is')}: {correctAnswer}` (hint after a wrong typed answer)

Not user-facing: the `latexToUnicode` map (lines 168-189) maps LaTeX commands to
symbols, a parser table. `decode()`, `\text{...}` and `\frac` replacements, the
`key` props `text-`, `math-`, `full-text`, `'#00FF00'`, `styles.*`, the
`'success' | 'error' | 'light'` haptic type names, `require('../assets/sounds/...')`
paths and the `console.warn` strings ("Error playing sound:", "Error playing
select sound:") are all internal.

## components/QuizSelection.tsx — 2 user-facing strings (useTranslation: yes)

- `QuizSelection.tsx:137` — "📖 Read" (JSX text; the essay badge inside `CategoryHeader`)
- `QuizSelection.tsx:449` — "⚔️ Multiplayer Mode" (JSX text; the `MultiplayerHeader` button)

Covered already, same file:

- `QuizSelection.tsx:372` — `title: t('other') || 'Other'` (the `|| 'Other'` is a dead fallback, `t` already returns the key)
- `QuizSelection.tsx:459` — `groupedQuizzes[0]?.title === (t('other') || 'Other')`

Not user-facing: `'light' | 'medium' | 'success'` haptic type names, `'0deg'`,
`'90deg'`, `'rgba(...)'` colours, `_layout` icon names in
`router.push('/multiplayer')`, `styles.*`. The `▶` arrow at line 127 is a
decorative glyph, and `{item.questions?.length || 0} 📝` at line 294 is a number
plus emoji.

## components/EssayReader.tsx — 5 user-facing strings (useTranslation: no)

- `EssayReader.tsx:44` — "Back" (JSX text; back button)
- `EssayReader.tsx:49` — "Study Material" (JSX text; header badge)
- `EssayReader.tsx:58` — "{essay.sections.length} sections" (JSX expression plus the literal word "sections"; needs plural handling)
- `EssayReader.tsx:91` — "Ready to test your knowledge?" (JSX text; CTA)
- `EssayReader.tsx:97` — "Start Quiz" (JSX text; CTA button)

Not user-facing: `{essay.category}`, `{essay.title}`, `{section.heading}`,
`{section.content}` (lines 55-56, 81, 85) are content from `assets/essays_*.json`.
`essayImages` keys are file names. `{index + 1}` is a number.

## components/TtsTestComponent.tsx — 26 user-facing strings (useTranslation: no)

Dead code: grep over `app/` and `components/` finds no import of
`TtsTestComponent` anywhere. The strings below still exist and would render if
the component were mounted. Two groups: the `Alert.alert` debug dump, and the
button panel.

Debug dump (built at lines 35-51, shown by the `Alert` at line 53):

- `TtsTestComponent.tsx:35` — "Speech Synthesis: Available\n" (template)
- `TtsTestComponent.tsx:36` — `Voices loaded: ${voices.length}\n` (template)
- `TtsTestComponent.tsx:37` — `Platform: ${isAndroid ? 'Android' : 'Other'}\n` (template, with "Android" / "Other" ternaries)
- `TtsTestComponent.tsx:38` — `Browser: ${isChrome ? 'Chrome' : 'Other'}\n` (template, with "Chrome" / "Other")
- `TtsTestComponent.tsx:39` — `Mobile: ${isMobile ? 'Yes' : 'No'}\n` (template, with "Yes" / "No")
- `TtsTestComponent.tsx:40` — `First voice: ${voices[0]?.name || 'None'}\n` (template, with "None")
- `TtsTestComponent.tsx:41` — `Default voice: ${voices.find((v) => v.default)?.name || 'None'}\n` (template, with "None")
- `TtsTestComponent.tsx:44` — `Speaking: ${window.speechSynthesis.speaking ? 'Yes' : 'No'}\n` (template, with "Yes" / "No")
- `TtsTestComponent.tsx:47` — `Pending: ${window.speechSynthesis.pending ? 'Yes' : 'No'}\n` (template, with "Yes" / "No")
- `TtsTestComponent.tsx:50` — `Paused: ${window.speechSynthesis.paused ? 'Yes' : 'No'}\n` (template, with "Yes" / "No")
- `TtsTestComponent.tsx:51` — `User Agent: ${navigator.userAgent.substring(0, 100)}...` (template)

Alert calls:

- `TtsTestComponent.tsx:53` — "Speech Synthesis Debug" (Alert title)
- `TtsTestComponent.tsx:65` — "Speech Synthesis Status" (Alert title)
- `TtsTestComponent.tsx:65` — "Speech Synthesis: Not Available" (Alert body)
- `TtsTestComponent.tsx:106` — "Android Test Failed" (Alert title)
- `TtsTestComponent.tsx:110` — "Error" (Alert title)
- `TtsTestComponent.tsx:110` — "Speech synthesis not available" (Alert body)

Panel:

- `TtsTestComponent.tsx:116` — "TTS Debug Console" (JSX text; screen title)
- `TtsTestComponent.tsx:117` — "Status: " (JSX text; followed by `{ttsState}`)
- `TtsTestComponent.tsx:120` — "Test Basic TTS" (JSX text; button)
- `TtsTestComponent.tsx:124` — "Test with Breaks" (JSX text; button)
- `TtsTestComponent.tsx:128` — "Test Long Text" (JSX text; button)
- `TtsTestComponent.tsx:132` — "Check Speech API" (JSX text; button)
- `TtsTestComponent.tsx:136` — "Android Direct Test" (JSX text; button)
- `TtsTestComponent.tsx:144` — "Stop TTS" (JSX text; button)

Borderline, listed for completeness: the four spoken test sentences
(`TtsTestComponent.tsx:7`, `:13`, `:19`, `:75`) go through `readAloud` and are
heard, not read. `ttsState` values (`'idle'`, etc. from `useReadAloud`) are
rendered raw at line 117 but are internal state names, NOT translatable.
`utterance.lang = 'en-US'` (line 82) is a locale id, NOT.

## components/AnalogClock.tsx — 2 user-facing strings (useTranslation: no)

- `AnalogClock.tsx:116` — "PM" (ternary, constant inside `formatTime`; rendered by the digital `SvgText` at `AnalogClock.tsx:184`)
- `AnalogClock.tsx:116` — "AM" (ternary, same `formatTime` and render site)

Dead code: grep over `app/` and `components/` finds no import of `AnalogClock`.
The `12`, `3`, `6`, `9` hour labels (computed at `AnalogClock.tsx:92`) are numbers. `hourNum`, the colour ternary results (`'#FFFFFF'` / `'#333333'`), the inline
style objects and `textAnchor="middle"` are NOT.

## components/kids/StreakPet.tsx — 24 user-facing strings (useTranslation: no)

This file is hardcoded **German**, not English. There is no `useTranslation` and
no `t()` anywhere in it. It renders in German for all three languages. Stage
names and messages are module-level constants (`PET_STAGES`, declared at line 10),
rendered at `StreakPet.tsx:256` (`stage.name`) and `StreakPet.tsx:280`
(`stage.message`):

- `StreakPet.tsx:14` — "Ei" (constant `name`, stage 0)
- `StreakPet.tsx:16` — "Spiele täglich, um mich schlüpfen zu sehen!" (constant `message`, stage 0)
- `StreakPet.tsx:21` — "Küken" (constant `name`, stage 1)
- `StreakPet.tsx:23` — "Ich bin geschlüpft! Spiel weiter!" (constant `message`, stage 1)
- `StreakPet.tsx:28` — "Jungvogel" (constant `name`, stage 3)
- `StreakPet.tsx:30` — "Ich wachse! Noch 4 Tage bis zum nächsten Level!" (constant `message`, stage 3)
- `StreakPet.tsx:35` — "Weise Eule" (constant `name`, stage 7)
- `StreakPet.tsx:37` — "Du bist toll! Ich bin jetzt eine weise Eule!" (constant `message`, stage 7)
- `StreakPet.tsx:42` — "Einhorn" (constant `name`, stage 14)
- `StreakPet.tsx:44` — "Magisch! Du hast 14 Tage geschafft!" (constant `message`, stage 14)
- `StreakPet.tsx:49` — "Drache" (constant `name`, stage 30)
- `StreakPet.tsx:51` — "FEUER! 30 Tage — ich bin jetzt ein Drache! 🐉🔥" (constant `message`, stage 30)
- `StreakPet.tsx:56` — "Sternenwesen" (constant `name`, stage 60)
- `StreakPet.tsx:58` — "Legendär! 60 Tage in Folge!" (constant `message`, stage 60)
- `StreakPet.tsx:63` — "König" (constant `name`, stage 100)
- `StreakPet.tsx:65` — "Der Quiz-König! 100 Tage! 👑" (constant `message`, stage 100)

Inline in the render:

- `StreakPet.tsx:256` — "Schlafend..." (ternary; pet name when not played today)
- `StreakPet.tsx:259` — "Tag" (JSX text; streak counter word)
- `StreakPet.tsx:259` — "e" (ternary plural suffix: `{currentStreak !== 1 ? 'e' : ''}`)
- `StreakPet.tsx:263` — "⚠️ Heute noch nicht gespielt! Spiel jetzt, damit deine Serie nicht abbricht!" (JSX text; warning)
- `StreakPet.tsx:269` — "Tag" (JSX text; days-to-next-stage counter)
- `StreakPet.tsx:269` — "e" (ternary plural suffix: `{daysToNext !== 1 ? 'e' : ''}`)
- `StreakPet.tsx:269` — "Noch" and "bis zum" and the trailing "!" (JSX text fragments around `{daysToNext}`, `{nextStage.emoji}`, `{nextStage.name}`)
- `StreakPet.tsx:275` — "👑 Du hast alle Level erreicht! Legendär!" (JSX text; final-stage line)
- `StreakPet.tsx:281` — "Dein Haustier schläft... Spiel ein Quiz zum Aufwecken!" (ternary; message when not played today)

Counted as 16 constant names/messages plus 8 inline literals = 24. Note the two
German plural concatenations at 259 and 269: those cannot survive a straight
`t()` swap and need `i18next` plurals.

NOT user-facing: `'😴'` (line 249) and the stage emoji are pictographs,
`sizeMap` / `fontSizeMap` (`{ small: 50, medium: 80, large: 120 }`, lines 179-180)
are numbers, `'#FFD700'` etc. are colours, `'small' | 'medium' | 'large'` is the
`size` prop union, `Animated` easing names and `styles.*` are internal.

## components/kids/CelebrationOverload.tsx — 5 user-facing strings (useTranslation: no)

Mixed English and German in one random pool, picked once via `useState` on
line 413 (`const texts = [...]` at line 414) and rendered by `WooHooText` at
`CelebrationOverload.tsx:442` (`{text}`):

- `CelebrationOverload.tsx:415` — "SUPER! 🦄" (constant, English)
- `CelebrationOverload.tsx:416` — "WOOOHOO! 🌈" (constant, English)
- `CelebrationOverload.tsx:417` — "TOLL! 🦄" (constant, German)
- `CelebrationOverload.tsx:418` — "GENIAL! 🌈" (constant, German)
- `CelebrationOverload.tsx:419` — "KLASSE! 🦄" (constant, German)

NOT user-facing: the emoji literals `'✨'`, `'🦄'`, `'💕'`, `'💖'`, `'💗'`,
`'💝'`, `'🌈'` (lines 88, 98, 216, 274-281), the `colors` array of hex strings
(line 226), `'0deg'`, `pointerEvents="none"`, and every animation value.

## components/kids/MultiplicationRangeSheet.tsx — 1 hardcoded string, 7 keys that render raw (useTranslation: yes)

One hardcoded literal, and it is German:

- `MultiplicationRangeSheet.tsx:147` — "Abbrechen" (t() inline default for the Cancel button: `{t('cancel', 'Abbrechen')}`). There is no `cancel` key in `en.json`, `de.json` or `fi.json` (grep for `"cancel"` in `components/locales/` returns nothing), so this renders "Abbrechen" in **English, German and Finnish alike**. This is a real, currently visible bug.

Seven `t()` calls with no default argument whose keys exist only in `de.json`.
`en.json` and `fi.json` contain zero `multiplication_*` keys (grep count: 0 / 0 /
10), and i18next with no `parseMissingKeyHandler` returns the key itself, so on
`en` and `fi` the raw key text is on screen:

- `MultiplicationRangeSheet.tsx:96` — `{t('multiplication_quiz_name')}` (sheet title)
- `MultiplicationRangeSheet.tsx:98` — `{t('multiplication_mode')}` (row label)
- `MultiplicationRangeSheet.tsx:120` — `{t(labelKey)}` with `labelKey` from `MODE_OPTIONS` (lines 36-39): `multiplication_mode_count`, `multiplication_mode_timed`
- `MultiplicationRangeSheet.tsx:129` — `{t('multiplication_duration')}` (row label, timed mode only)
- `MultiplicationRangeSheet.tsx:134` — `{t('multiplication_range_from')}` (row label)
- `MultiplicationRangeSheet.tsx:138` — `{t('multiplication_range_to')}` (row label)
- `MultiplicationRangeSheet.tsx:155` — `{t('multiplication_range_start')}` (Start button)

Covered already: `MultiplicationRangeSheet.tsx:70` — `label={`${minutes} ${t('minutes')}`}`
(the `minutes` key exists in all three locales, so the duration picker items are
fine).

NOT user-facing: `FACTOR_ITEMS` labels at line 30 (`label={String(index + 1)}`)
are digits; `DURATION_MINUTES = [1, 2, 3, 5, 10]`; `'count' | 'timed'` values;
`key={minutes}`, `key={mode}`, `accessibilityRole="button"`,
`dropdownIconColor="black"`, `styles.*`.

## components/LearningTodos.tsx — 0 hardcoded user-facing strings (useTranslation: yes)

Fully covered. Twelve `t()` calls, listed so the plan can verify coverage:
`LearningTodos.tsx:32` `unknown_quiz`, `:55` `no_todos`, `:57` `no_todos_desc`,
`:72` `learning_todos`, `:77` `question_to_review`, `:78`
`questions_to_review` (a singular/plural ternary, the form question 4 cares
about), `:87` `practice_all`, `:111` `correct`, `:142` `question`, `:150`
`your_answer`, `:157` `correct_answer`, `:167` `explanation`, `:180`
`progress_info` (with `{{remaining}}`), `:193` `close`.

One live defect inside the covered strings, reported here because it changes what
the user sees: `LearningTodos.tsx:111` renders
`{todo.correctCount}/3 {t('correct', 'correct')}`. The `correct` key **does**
exist in all three locales and its value is the congratulation
`en.json:6` "Correct!", `de.json:6` "Richtig!", `fi.json:6` "Oikein!", so the
inline default `'correct'` is never used and the row reads "0/3 Correct!"
("0/3 Richtig!"). The key is being reused for a noun label. No plural handling
either: `correct` has no `_one` / `_other` variants.

NOT user-facing: `'🎉'` (line 53), `'→'` (line 126), the `/3` in the progress
text and `{(todo.correctCount / 3) * 100}%`, `animationType="fade"`,
`numberOfLines={2}`, `activeOpacity={0.7}`, `styles.*`. `{todo.question}`,
`{todo.userAnswer}`, `{todo.correctAnswer}`, `{todo.explanation}` and
`{quizName}` are quiz content carried in from a wrong answer.

## components/LearningTodosProvider.tsx — 0 user-facing strings (useTranslation: no)

Renders only `{children}` (line 200). Every literal is internal:
`STORAGE_KEY = 'quizzy_learning_todos'` (line 14, AsyncStorage key),
`todo_` id prefix in `generateQuestionId` (line 61),
`console.error('Failed to load learning todos:', ...)` (line 94),
`console.error('Failed to save learning todos:', ...)` (line 104), and the
developer `throw new Error('useLearningTodos must be used within a
LearningTodosProvider')` (lines 208-211, string on line 209).

---

## Files in this set with no user-facing text

- `components/GlossaryProvider.tsx` — provider only, renders `{children}`; its one literal is a developer `throw new Error`.
- `components/ClickableTerms.tsx` — renders the `text` prop plus glossary content; no literal of its own.
- `components/Music.tsx` — returns `null`; sound only.
- `components/QuizTimer.tsx` — renders `MM:SS` only; no word to translate.
- `components/LearningTodosProvider.tsx` — provider only; AsyncStorage key, console messages and a developer `throw`.

## Partial coverage

Files that call `t()` for some strings and still hardcode others. Ranked by how
cheap the win is (fewest uncovered strings first).

1. `components/kids/MultiplicationRangeSheet.tsx` — 9 of 10 strings covered, 1
   hardcoded (`t('cancel', 'Abbrechen')` at :147). Cheapest fix in the whole set,
   and the only one already visible in English.
2. `components/QuizSelection.tsx` — covered: `t('other')` at :372 and :459.
   Uncovered: "📖 Read" (:137), "⚔️ Multiplayer Mode" (:449). Category titles and
   quiz names come from the quiz data, not from this file.
3. `components/Question.tsx` — covered: `t('type_your_answer')` (:851),
   `t('submit_answer')` (:868), `t('correct_answer_is')` (:890). Uncovered:
   "+1 ✨" (:158), the `answerLabels` array A: to D: (:267, rendered :973, spoken
   :709), the read-aloud `accessibilityLabel` (:826).
4. `components/Score.tsx` — covered: `t('time_up')` (:335), `t('score')` (:377),
   `t('retry_wrong', ...)` (:398). Uncovered: "🎉 Well Done! 🎉" (:337 and again
   at :416), "💪 Try again!" (:338), "✨ Perfect Score! ✨" (:342), "Great job!"
   (:342). Note the same English heading is written twice, once per branch.
5. `components/LearningTodos.tsx` — nominally 100% covered, but every call passes
   an English inline default that duplicates `en.json`, and `t('correct',
   'correct')` at :111 resolves to "Correct!" instead of the intended noun. Worth
   listing as a partial-coverage case for the design: either drop the inline
   defaults or add a separate noun key.
6. `components/Flashcards.tsx` — partially covered through the wrong mechanism:
   `t` is imported from `i18next` at :20 instead of `useTranslation`. Covered:
   `t('use_flashcards')` (:480). Uncovered: "Loading or no more flashcards..."
   (:445), "dump" (:498), "Keep" (:550). Because the bare `t` is not the hook,
   this component does not subscribe to language changes, so question 9 applies
   here too.

Files in this set that call `t()` and hardcode nothing else: only
`components/LearningTodos.tsx` (with the caveat above). Every other
`useTranslation` file in this set is on the partial list.

## Answer to question 2 for this set

User-facing, must be worked on: `Flashcards.tsx`, `GlossaryModal.tsx`,
`MultiplayerScoreboard.tsx`, `OfflineIndicator.tsx`, `Score.tsx`, `Question.tsx`,
`QuizSelection.tsx`, `EssayReader.tsx`, `kids/StreakPet.tsx`,
`kids/CelebrationOverload.tsx`, `kids/MultiplicationRangeSheet.tsx`.

User-facing but currently unreachable (dead code, decide before spending on
them): `TtsTestComponent.tsx` (no import anywhere), `AnalogClock.tsx` (no import
anywhere), `OfflineIndicator.tsx` (no import anywhere).

Must be skipped entirely, no rendered text: `GlossaryProvider.tsx`,
`ClickableTerms.tsx`, `Music.tsx`, `QuizTimer.tsx`, `LearningTodosProvider.tsx`.

Special case, out of this file set but load-bearing for it: the five strings in
`services/multiplayerRules.ts:129-132` (`leadLabel`) are rendered by
`MultiplayerScoreboard.tsx:73`, and `app/multiplayer/[code].tsx` imports
`leadLabel` as well, so a plan that only touches `components/` will leave the
multiplayer lead line in English.
