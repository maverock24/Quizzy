# Research merged: i18n UI coverage (Q1 to Q11)

Merge of four research fragments into one answer per ticket question. No new
investigation, except two counts that the fragments and the ticket disagreed on
(`useTranslation` file count, and the bare `t` import), re-run here and marked as
such.

Sources merged:

- `research/1-app.md` (questions 1, 2, 5; file set `app/`)
- `research/2-components-a.md` (questions 1, 2, 11; 19 files under `components/`)
- `research/3-learning.md` (questions 1, 2, 5, 6; `components/learning/`,
  `components/Quizprovider.tsx`, `hooks/`)
- `research/4-mechanics.md` (questions 3, 4, 7, 8, 9, 10)

Count basis used throughout: **literal occurrences**, not distinct strings. A
literal that appears twice (for example `"Cancel"` in two branches) counts twice,
matching each fragment's own convention.

---

## Q1. Full inventory of hardcoded UI strings

Answer: **339 user-facing literal occurrences across 29 files** (9 under `app/`,
18 under `components/`, 2 under `services/`), by the merged reading. The exact
total is 338 to 340 because two `services/` counts are disputed between the
ticket and the fragments; see footnote f1. `components/` is **not fully
inventoried**: 21 files in that directory were never assigned to a fragment, so
their counts are unknown, not zero. See footnote f2 and the gaps section.

### `app/` (fragment 1; 13 files read in full, 4376 lines; 9 files carry strings, 144 occurrences)

**`app/+html.tsx` - 4.** Web document shell, runs in Node during static
rendering (`+html.tsx:3-6`), so no `t()` and no i18n instance in scope.

- `app/+html.tsx:9` - `lang="en"` (html attribute; reaches screen readers, browsers, SEO; unconditional)
- `app/+html.tsx:19` - `content="Quizzy"` (meta application-name)
- `app/+html.tsx:22` - `content="Quizzy"` (meta apple-mobile-web-app-title)
- `app/+html.tsx:25` - `"Educational quiz application with offline support"` (meta description; search results and share cards)

Not user-facing there: `:12` `X-UA-Compatible`, `:15` viewport, `:20`
`apple-mobile-web-app-capable`, `:21` status-bar-style, `:27` `format-detection`,
`:28` `mobile-web-app-capable`, `:29` `theme-color`, icon hrefs at `:39`, `:45`,
`:51`, `:53`, `:57`, `:62`, and the CSS blob `responsiveBackground` (`:80-97`,
injected at `:72`).

**`app/+not-found.tsx` - 3.**

- `app/+not-found.tsx:9` - `"Oops!"` (`options:title` on `<Stack.Screen>`)
- `app/+not-found.tsx:11` - `"This screen doesn't exist."` (JSX text, via `&apos;`)
- `app/+not-found.tsx:14` - `"Go to home screen!"` (JSX text, link label)

**`app/modal.tsx` - 2.**

- `app/modal.tsx:10` - `"Modal"` (JSX text, screen title)
- `app/modal.tsx:16` - `path="app/modal.tsx"` (prop, rendered as text at `components/EditScreenInfo.tsx:27` inside `<MonoText>`; a file path, so the choice is translate or delete, not translation)

`EditScreenInfo` renders English prose of its own (`components/EditScreenInfo.tsx:14-20`,
`:30-37`, `:45-48`), which lies outside fragment 1's file set and was never
counted. Footnote f2.

**`app/(tabs)/_layout.tsx` - 4.** All `options.title` (tab bar labels). No
`useTranslation` in the file (import block `:1-15`).

- `app/(tabs)/_layout.tsx:91` - `"Quiz"`
- `app/(tabs)/_layout.tsx:112` - `"Learn"`
- `app/(tabs)/_layout.tsx:121` - `"Profile"`
- `app/(tabs)/_layout.tsx:130` - `"Settings"`

Not user-facing: icon `name=` props (`home`, `graduation-cap`, `trophy`, `gear`,
`info-circle`), `resizeMode`, `initialRouteName`, `tabBarLabelPosition`,
`animation`, easing names.

**`app/(tabs)/index.tsx` - 6.** `useTranslation` present (`:15`, `:95`), partial
coverage.

- `app/(tabs)/index.tsx:505` - `"Open glossary"` (`accessibilityLabel`)
- `app/(tabs)/index.tsx:508` - `"Glossary"` (JSX text, button)
- `app/(tabs)/index.tsx:524-527` - `t('multiplication_quiz_label_range', { from, to })`; key missing from `en.json` and `fi.json`, present only in `de.json:57`, so on en/fi i18next returns the raw key and the quiz list renders the literal `multiplication_quiz_label_range`
- `app/(tabs)/index.tsx:655` - `"Open glossary"` (`accessibilityLabel`, second button)
- `app/(tabs)/index.tsx:658` - `"Glossary"` (JSX text, second button)
- `app/(tabs)/index.tsx:455` - `` `${lastPlayedQuizName} (Retry)` `` (template). Not rendered by this screen, but it becomes `selectedQuizName` via `setSelectedQuizName(retryQuiz.name)` at `:461`, and reaches the screen through `components/Reader.tsx:302` (`{quiz.name}`) in reader mode and `components/LearningTodos.tsx:97`, because `handleAnswerSelection` (`:281-288`) files wrong answers under `selectedQuiz.name`

Notes: `:470-476` only reshapes data, no literal. No `Alert`, `Toast`,
`placeholder`, `console.*` in the file. `selectedQuizName` is never read for
display: `grep -rn selectedQuizName` hits only `Quizprovider.tsx:30`, `:118`,
`:784` and a comment at `index.tsx:440`.

Footnote f5 on counting: `:524-527` is a `t()` call, not a hardcoded literal, yet
fragment 1 counts it in the 6 because it renders raw key text today.

**`app/(tabs)/learn.tsx` - 23.** No `useTranslation`. Five `learningOptions`
constants (`:68-108`), each rendered twice, at `:260`/`:262` (tier 1) and
`:306`/`:308` (tier 2):

- `app/(tabs)/learn.tsx:69` - `"Daily Warmup"` (constant `title`, rendered `:260`)
- `app/(tabs)/learn.tsx:71` - `"Spaced repetition practice on questions you've answered before"` (constant `description`, rendered `:262`)
- `app/(tabs)/learn.tsx:78` - `"Mental Compiler"` (constant `title`, rendered `:306`)
- `app/(tabs)/learn.tsx:79` - `"Predict code output to build your mental execution model"` (constant `description`, rendered `:308`)
- `app/(tabs)/learn.tsx:86` - `"Parsons Problems"` (constant `title`)
- `app/(tabs)/learn.tsx:87` - `"Arrange scrambled code lines into the correct order"` (constant `description`)
- `app/(tabs)/learn.tsx:94` - `"Scaffolded Learning"` (constant `title`)
- `app/(tabs)/learn.tsx:96` - `"Study complete examples, then fill in progressively more blanks"` (constant `description`)
- `app/(tabs)/learn.tsx:103` - `"Bug Hunter"` (constant `title`)
- `app/(tabs)/learn.tsx:104` - `"Find the bug in seemingly correct code"` (constant `description`)
- `app/(tabs)/learn.tsx:120` - `"All Categories"` (constant returned by `getCategoryDisplayName`, rendered `:216` in the category chip)

JSX text:

- `app/(tabs)/learn.tsx:185` - `"🧠 Enhanced Learning"`
- `app/(tabs)/learn.tsx:187` - `"Science-backed methods for maximum retention"`
- `app/(tabs)/learn.tsx:193` - `"📚 Category Filter"`
- `app/(tabs)/learn.tsx:221` - `" quizzes • "` (fragment with `{filteredQuizzes.length}` before it, renders as `12 quizzes • 400 questions`)
- `app/(tabs)/learn.tsx:226` - `"questions"` (second half of the same counter line, after a `reduce()`)
- `app/(tabs)/learn.tsx:234` - `"TIER 1"`
- `app/(tabs)/learn.tsx:236` - `"High Efficiency"`
- `app/(tabs)/learn.tsx:239` - `"Low cognitive load, high learning ROI"`
- `app/(tabs)/learn.tsx:279` - `"TIER 2"`
- `app/(tabs)/learn.tsx:282` - `"Deep Learning"`
- `app/(tabs)/learn.tsx:285` - `"For mastering patterns after grasping basics"`
- `app/(tabs)/learn.tsx:323-324` - `"Daily Warmup adapts to your quiz performance using spaced repetition. The more you practice, the smarter it gets!"`

Not user-facing: `LearningMode` union literals (`:26-31`), the `'all'` category
sentinel (`:45`, `:55`, `:60`, `:120`), mode ids (`:68`, `:77`, `:85`, `:93`,
`:102`), tier numbers, icon names, colours. Category chip text for real
categories comes from `quiz.category` (content); `getCategoryDisplayName`
(`:118-127`) only strips an emoji prefix.

**`app/(tabs)/settings.tsx` - 36.** `useTranslation` present (`:6`, `:56`);
partial coverage. Already translated and not to be touched: `t('settings')`
`:175`, `t('language')` `:178`, `t('english'|'german'|'finnish')` `:194-196`, the
switch rows `:200-299` and `:309-370`, `t('minutes')` inside the duration labels
`:357-364`, `t('reset_settings')` / `t('reset_settings_desc')` / `t('reset')`
`:527-541`.

Update-state messages:

- `app/(tabs)/settings.tsx:91` - `"No published Android build found."` (`setUpdateError`, rendered `:486`)
- `app/(tabs)/settings.tsx:94` - `"Unable to check for updates."` (`setUpdateError`, rendered `:486`)
- `app/(tabs)/settings.tsx:108` - `"Failed to install update."` (fallback when the thrown value is not an `Error`; goes to state at `:109` and the Alert body at `:110`)
- `app/(tabs)/settings.tsx:486` - `"Checking for updates…"` (ternary fallback in the setting description)

Default user-quiz template written into the editable JSON, visible inside the
modal `TextInput` at `:584` (`value={userQuizJson}`); user-facing but quiz
content rather than chrome:

- `app/(tabs)/settings.tsx:136` - `"User Quiz"`
- `app/(tabs)/settings.tsx:139` - `"What is 2+2?"`
- `app/(tabs)/settings.tsx:142` - `"2+2=4"`

Alerts:

- `app/(tabs)/settings.tsx:110` - `"Update failed"` (title)
- `app/(tabs)/settings.tsx:110` - `msg` (body; `err.message` or the literal at `:108`)
- `app/(tabs)/settings.tsx:155` - `"Error"` (title)
- `app/(tabs)/settings.tsx:155` - `"Failed to load or create user quizzes"` (body)
- `app/(tabs)/settings.tsx:167` - `"Error"` (title)
- `app/(tabs)/settings.tsx:167` - `"Failed to save user quizzes"` (body)

JSX text and props:

- `app/(tabs)/settings.tsx:304` - `"🎨 Kids Mode"`
- `app/(tabs)/settings.tsx:306-307` - `"Größere Feiern, Streak-Haustier und buntere Animationen für Kinder"` (hardcoded **German**; English and Finnish users see German today)
- `app/(tabs)/settings.tsx:373` - `"TTS Voice"`
- `app/(tabs)/settings.tsx:394` - `"Default Voice"` (`Picker.Item label=`)
- `app/(tabs)/settings.tsx:398` - `` `${voice.name} (${voice.lang})` `` (`Picker.Item label=`; voice names come from the OS, only the parentheses are ours)
- `app/(tabs)/settings.tsx:411` - `"Test Voice"`
- `app/(tabs)/settings.tsx:413-414` - `"Test the selected voice. On mobile devices, this also enables TTS functionality."`
- `app/(tabs)/settings.tsx:420` - `"Hello! This is a test of the text-to-speech voice."` (local `testText`, spoken by `new SpeechSynthesisUtterance(testText)` at `:427`; heard, not read)
- `app/(tabs)/settings.tsx:439` - `"Test"` (button)
- `app/(tabs)/settings.tsx:447` - `"Enable User Quizzes"`
- `app/(tabs)/settings.tsx:449-450` - `"Load quizzes from your own quizzes_user.json file in addition to the language-specific quizzes."`
- `app/(tabs)/settings.tsx:465` - `"Edit User Quizzes"`
- `app/(tabs)/settings.tsx:467` - `"Open a dialog to edit your quizzes_user.json file."`
- `app/(tabs)/settings.tsx:474` - `"Edit"` (button)
- `app/(tabs)/settings.tsx:482` - `"App Updates"`
- `app/(tabs)/settings.tsx:485` - `` `Latest build: ${androidRelease.versionName} (build #${androidRelease.versionCode})` `` (ternary branch)
- `app/(tabs)/settings.tsx:487` - `"Installed build: "` (JSX text with `{'\n'}` at `:487` and `{' '}` at `:488`)
- `app/(tabs)/settings.tsx:490` - `"unknown"` (ternary fallback when `installedVersionCode` is 0)
- `app/(tabs)/settings.tsx:506` - `"Download & Install"` (button)
- `app/(tabs)/settings.tsx:511` - `"Up to date"` (no-button branch)
- `app/(tabs)/settings.tsx:519` - `"Check"` (button)
- `app/(tabs)/settings.tsx:570` - `"Edit quizzes_user.json"` (modal title)
- `app/(tabs)/settings.tsx:595` - `"Cancel"` (modal button)
- `app/(tabs)/settings.tsx:598` - `"Save"` (modal button)

Not user-facing: AsyncStorage keys `'userQuizLoadEnabled'` (`:72`, `:80`) and
`'userQuizzes'` (`:128`, `:150`, `:162`), Switch colours, style keys.

**`app/multiplayer/index.tsx` - 26.** No `useTranslation`. `showAlert` helper
(`:26-34`) is a thin wrapper: `window.alert(`${title}\n\n${message}`)` on web
(`:29`), `Alert.alert(title, message)` on native (`:32`). Every literal below is
passed in by the caller; all bodies except the first two come from
`services/multiplayerFailures.ts`.

Alerts:

- `app/multiplayer/index.tsx:127` - `"Required"` (title)
- `app/multiplayer/index.tsx:127` - `"Please enter your name"` (body)
- `app/multiplayer/index.tsx:141` - `"Cannot create a room"` (title; body `failureMessage(result.failure)`)
- `app/multiplayer/index.tsx:145` - `"Cannot create a room"` (title; body `failureMessage('could-not-create')`)
- `app/multiplayer/index.tsx:155` - `"Required"` (title)
- `app/multiplayer/index.tsx:155` - `"Please enter your name"` (body)
- `app/multiplayer/index.tsx:171` - `"Cannot join"` (title; body `failureMessage(result.failure)`)
- `app/multiplayer/index.tsx:175` - `"Cannot join"` (title; body `failureMessage('connect-failed')`)
- `app/multiplayer/index.tsx:198` - `"Cannot create a room"` (title)
- `app/multiplayer/index.tsx:202` - `"Cannot send invite"` (title; body `failureMessage('network')`)

JSX text and props:

- `app/multiplayer/index.tsx:231` - `"Multiplayer Quiz"` (native-only screen title)
- `app/multiplayer/index.tsx:233-234` - `"Multiplayer needs a browser. Open the web version to play with a friend."` (native-only empty state)
- `app/multiplayer/index.tsx:242` - `"Open the web version"` (button)
- `app/multiplayer/index.tsx:262` - `"⚔️ Multiplayer Quiz"` (web screen title)
- `app/multiplayer/index.tsx:266` - `"Your Name"` (field label)
- `app/multiplayer/index.tsx:269` - `"Enter your name"` (`placeholder`)
- `app/multiplayer/index.tsx:289` - `"🚀 Create New Game"` (button)
- `app/multiplayer/index.tsx:303` - `"📬 Incoming Invites"` (section header)
- `app/multiplayer/index.tsx:308` - `" invited you!"` (JSX text with `{invite.fromName}` before it; word order is baked into the JSX)
- `app/multiplayer/index.tsx:315` - `"Accept"` (button)
- `app/multiplayer/index.tsx:321` - `"Decline"` (button)
- `app/multiplayer/index.tsx:332` - `"🟢 Active Players in Lobby"` (section header)
- `app/multiplayer/index.tsx:343-344` - `"Enter your name above to enter the lobby and see who is online."` (empty state)
- `app/multiplayer/index.tsx:348-349` - `"No one else is online right now. Waiting for players... Ask the host for their invite link to join."` (empty state)
- `app/multiplayer/index.tsx:371` - `"Join"` (ternary `user.roomCode ? 'Join' : 'Invite'`)
- `app/multiplayer/index.tsx:371` - `"Invite"` (ternary, second branch)

Not user-facing: AppState and DOM event names `'active'`/`'change'`/`'visible'`/
`'visibilitychange'` (`:88`, `:101`, `:107`, `:114`, `:120`), keyboard behaviours
`'padding'`/`'height'` (`:220`), `'done'` returnKeyType (`:273`), the share URL
`'https://quizzy-2504.netlify.app/multiplayer'` (`:239`), `console.error` at
`:144`, `:174`, `:201`.

**`app/multiplayer/[code].tsx` - 40.** No `useTranslation`. `showAlert`
(`:50-70`) uses `window.confirm`/`window.alert` on web and
`Alert.alert(title, message, buttons)` on native (`:69`); button labels are
object properties, not JSX.

Alerts:

- `app/multiplayer/[code].tsx:161` - `"Leave Game?"` (title)
- `app/multiplayer/[code].tsx:161` - `"Are you sure you want to leave?"` (body)
- `app/multiplayer/[code].tsx:162` - `"Cancel"` (button `text`)
- `app/multiplayer/[code].tsx:164` - `"Leave"` (button `text`)
- `app/multiplayer/[code].tsx:342` - `"Select Quiz"` (title)
- `app/multiplayer/[code].tsx:342` - `"Please select a quiz first"` (body)

Results screen:

- `app/multiplayer/[code].tsx:434` - `"🏆 Game Over!"` (ternary `allFinished ? ...`)
- `app/multiplayer/[code].tsx:434` - `"⏳ Waiting for opponent..."` (ternary)
- `app/multiplayer/[code].tsx:443` - `"You Win!"` (ternary `iAmWinner ? ...`)
- `app/multiplayer/[code].tsx:443` - `` `${winner.name} Wins!` `` (ternary template, second branch)
- `app/multiplayer/[code].tsx:449` - `"Final Scores"`
- `app/multiplayer/[code].tsx:465` - `"(You)"` (ternary `p.id === myId ? '(You)' : ''`)
- `app/multiplayer/[code].tsx:469` - `"Finished in "` (JSX text before `{formatTime(...)}`)
- `app/multiplayer/[code].tsx:473` - `"Still playing..."`
- `app/multiplayer/[code].tsx:492` - `"🏠 Back to Lobby"` (button)

Host-gone and name screens:

- `app/multiplayer/[code].tsx:516` - `"The host connection dropped."`
- `app/multiplayer/[code].tsx:522` - `"Rejoin"` (button)
- `app/multiplayer/[code].tsx:585` - `"Enter your name to join"`
- `app/multiplayer/[code].tsx:588` - `"Enter your name"` (`placeholder`)
- `app/multiplayer/[code].tsx:604` - `"Join"` (button)
- `app/multiplayer/[code].tsx:613` - `"Try again"` (button)

Lobby:

- `app/multiplayer/[code].tsx:648` - `"Room: "` (JSX text before `{code}`)
- `app/multiplayer/[code].tsx:660` - `"Link copied"` (ternary `copied ? ...`)
- `app/multiplayer/[code].tsx:660` - `"Copy link"` (ternary)
- `app/multiplayer/[code].tsx:669` - `"Share"` (button)
- `app/multiplayer/[code].tsx:676` - `"Players:"`
- `app/multiplayer/[code].tsx:689` - `"Left"` (ternary `p.left ? 'Left' : '✅ Ready'`)
- `app/multiplayer/[code].tsx:689` - `"✅ Ready"` (ternary)
- `app/multiplayer/[code].tsx:696` - `"Waiting for opponent..."` (placeholder row)
- `app/multiplayer/[code].tsx:710` - `"Selected Quiz: "` (before `{selectedQuiz?.name || ...}`)
- `app/multiplayer/[code].tsx:710` - `"None selected"` (ternary fallback inside that expression)
- `app/multiplayer/[code].tsx:716` - `"📚 Select Quiz"` (button)
- `app/multiplayer/[code].tsx:728` - `"🎮 Start Game"` (button)
- `app/multiplayer/[code].tsx:733` - `"Send your opponent the room link to join"` (hint)
- `app/multiplayer/[code].tsx:757` - `"Try again"` (button, second occurrence)
- `app/multiplayer/[code].tsx:771` - `"Waiting for host to start..."` (joiner waiting state)
- `app/multiplayer/[code].tsx:780` - `"Quiz: "` (before `{selectedQuiz.name}`)

Quiz selector overlay:

- `app/multiplayer/[code].tsx:795` - `"Select a Quiz"` (overlay title)
- `app/multiplayer/[code].tsx:807` - `"Cancel"` (button)

Helper that produces screen text:

- `app/multiplayer/[code].tsx:44-49` - `formatTime` returns `` `${minutes}m ${secs}s` `` or `` `${secs}s` `` (`:48`); rendered at `:469`, and `m`/`s` are English unit abbreviations

Not user-facing: `'cancel'` button style marker (`:60`), `gameState.status`
values `'waiting'`/`'playing'` (`:89`, `:177`, `:179`, `:213`, `:270`, `:282`,
`:421`, `:502`), `'true'` query param (`:85`), `'hardwareBackPress'` (`:291`),
`console.error` at `:143`, `:155`, clipboard and share URLs at `:138`, `:150`.

### `components/` (fragments 2 and 3; 27 of 53 files read, 183 occurrences)

**`components/Flashcards.tsx` - 3.** No `useTranslation`; line 20 is
`import { t } from 'i18next';`, the bare instance, so the component does not
subscribe to language changes. Covered already: `t('use_flashcards')` `:480`.

- `components/Flashcards.tsx:445` - `"Loading or no more flashcards..."` (empty state of the carousel when `topCardData` is falsy)
- `components/Flashcards.tsx:498` - `"dump"` (label under the `arrow-left` icon)
- `components/Flashcards.tsx:550` - `"Keep"` (label under the `arrow-down` icon)

Not user-facing: `Answer` type, `FALLBACK_CARD_WIDTH`, `DEFAULT_CARD_HEIGHT`,
`NEXT_CARD_*` animation constants, `StyleSheet` keys, `require()` paths,
`key={`${nextCardData.id}-next`}`. Numbers at `:108` and `:132` are data.

**`components/GlossaryModal.tsx` - 5.** No `useTranslation`.

- `components/GlossaryModal.tsx:202` - `"Definition"` (ternary; header title with a term open)
- `components/GlossaryModal.tsx:202` - `"AI/ML Glossary"` (ternary; list mode)
- `components/GlossaryModal.tsx:219` - `"Search terms..."` (`placeholder`)
- `components/GlossaryModal.tsx:264` - `"No matching terms found"` (ternary, `ListEmptyComponent`)
- `components/GlossaryModal.tsx:265` - `` `${filteredTerms.length} terms available` `` (template; needs plural handling)

Not user-facing: `{item.term}` and `{item.definition}` (`:135`, `:137`, `:154`,
`:157`) come from `assets/glossary.json` (content). `window.history.pushState({ glossaryModal: true }, ...)`
(`:48`) is internal state, icon ids `search-outline`/`close-circle`.

**`components/MultiplayerScoreboard.tsx` - 5 (plus 5 more defined in `services/`).**
No `useTranslation`.

- `components/MultiplayerScoreboard.tsx:26` - `"Left"` (ternary, `label` when `p.left`)
- `components/MultiplayerScoreboard.tsx:28` - `"Finished"` (ternary, `label` when `p.finished`)
- `components/MultiplayerScoreboard.tsx:30` - `` `Q${Math.min(p.progress + 1, q)}/${q}` `` (progress label, rendered `:52`)
- `components/MultiplayerScoreboard.tsx:34` - `"You"` (ternary, your own row name)
- `components/MultiplayerScoreboard.tsx:34` - `` `⚔️ ${p.name}` `` (rival row name)

Five further strings render on `:73` through `leadLabel(standing)`, defined
outside this file: `services/multiplayerRules.ts:129` `"Waiting for your rival"`,
`:130` `"Opponent left"`, `:131` `` `${-lead} behind` ``, `:132`
`` `You're ahead by ${lead}` ``, `:132` `"Tied"`. So this component puts 10
translatable strings on screen, 5 of them defined in `services/`.

**`components/OfflineIndicator.tsx` - 2. Dead.** No import anywhere under `app/`
or `components/`.

- `components/OfflineIndicator.tsx:69` - `"✓ Back online"` (ternary, banner after reconnect)
- `components/OfflineIndicator.tsx:69` - `"Offline - Using cached data"` (ternary, offline banner)

**`components/Score.tsx` - 5.** `useTranslation` present (`:14`, `:168`); partial
coverage. Covered already: `Score.tsx:335` `{`⏰ ${t('time_up')} ⏰`}`, `:377`
`{t('score')}`, `:398` `🔄 {t('retry_wrong', 'Retry Wrong Answers')} ({wrongAnswerCount})`
(template plus an untranslated count in parentheses).

- `components/Score.tsx:337` - `"🎉 Well Done! 🎉"` (ternary, winner heading)
- `components/Score.tsx:338` - `"💪 Try again!"` (ternary, loser heading)
- `components/Score.tsx:342` - `"✨ Perfect Score! ✨"` (ternary, sub-heading when `isPerfect`)
- `components/Score.tsx:342` - `"Great job!"` (ternary, sub-heading otherwise)
- `components/Score.tsx:416` - `"🎉 Well Done! 🎉"` (JSX text, `flashcardsEnabled` branch); the same English heading is written twice, once per branch

Not user-facing: `confettiColors`, `celebrationEmojis` (`:295`), `'0deg'`,
`'-15deg'`, `outputRange` angle strings, `'⭐'` in `StarBurst` (`:148`),
`styles.*`, `%`, `{displayScore} / {selectedQuizAnswersAmount}`.

**`components/Question.tsx` - 3.** `useTranslation` present (`:17`, `:265`);
partial. Covered already: `:851` `placeholder={t('type_your_answer')}`, `:868`
`{t('submit_answer')}`, `:890` `{t('correct_answer_is')}: {correctAnswer}`.

- `components/Question.tsx:158` - `"+1 ✨"` (JSX text, floating score popup)
- `components/Question.tsx:267` - `"A:"`, `"B:"`, `"C:"`, `"D:"` (constant `answerLabels`; rendered `:973` as `{answerLabels[index]}`, spoken by TTS at `:709`)
- `components/Question.tsx:826` - `"Read question and answers aloud"` (`accessibilityLabel`)

Not user-facing: the `latexToUnicode` map (`:168-189`), `decode()`, `\text{...}`
and `\frac` replacements, `key` props, `'#00FF00'`, haptic type names
`'success' | 'error' | 'light'`, `require('../assets/sounds/...')`,
`console.warn` strings.

**`components/QuizSelection.tsx` - 2.** `useTranslation` present (`:14`, `:330`);
partial. Covered already: `:372` `title: t('other') || 'Other'` (the `|| 'Other'`
is dead fallback) and `:459` `groupedQuizzes[0]?.title === (t('other') || 'Other')`.

- `components/QuizSelection.tsx:137` - `"📖 Read"` (JSX text, essay badge inside `CategoryHeader`)
- `components/QuizSelection.tsx:449` - `"⚔️ Multiplayer Mode"` (JSX text, `MultiplayerHeader` button)

Not user-facing: haptic type names, `'0deg'`, `'90deg'`, `'rgba(...)'`,
`router.push('/multiplayer')` path, `styles.*`, `▶` (`:127`), `{item.questions?.length || 0} 📝` (`:294`).

**`components/EssayReader.tsx` - 5.** No `useTranslation`.

- `components/EssayReader.tsx:44` - `"Back"` (back button)
- `components/EssayReader.tsx:49` - `"Study Material"` (header badge)
- `components/EssayReader.tsx:58` - `"{essay.sections.length} sections"` (JSX expression plus the literal word `sections`; needs plural handling)
- `components/EssayReader.tsx:91` - `"Ready to test your knowledge?"` (CTA)
- `components/EssayReader.tsx:97` - `"Start Quiz"` (CTA button)

Not user-facing: `{essay.category}`, `{essay.title}`, `{section.heading}`,
`{section.content}` (`:55-56`, `:81`, `:85`) are content from
`assets/essays_*.json`. `essayImages` keys are file names. `{index + 1}` is a
number.

**`components/TtsTestComponent.tsx` - 26. Dead.** No import anywhere under
`app/` or `components/`. Two groups: an `Alert` debug dump and a button panel.

Debug dump (built `:35-51`, shown by the `Alert` at `:53`):

- `components/TtsTestComponent.tsx:35` - `"Speech Synthesis: Available\n"` (template)
- `components/TtsTestComponent.tsx:36` - `` `Voices loaded: ${voices.length}\n` ``
- `components/TtsTestComponent.tsx:37` - `` `Platform: ${isAndroid ? 'Android' : 'Other'}\n` `` (with `"Android"` and `"Other"`)
- `components/TtsTestComponent.tsx:38` - `` `Browser: ${isChrome ? 'Chrome' : 'Other'}\n` `` (with `"Chrome"` and `"Other"`)
- `components/TtsTestComponent.tsx:39` - `` `Mobile: ${isMobile ? 'Yes' : 'No'}\n` `` (with `"Yes"`, `"No"`)
- `components/TtsTestComponent.tsx:40` - `` `First voice: ${voices[0]?.name || 'None'}\n` `` (with `"None"`)
- `components/TtsTestComponent.tsx:41` - `` `Default voice: ${voices.find((v) => v.default)?.name || 'None'}\n` `` (with `"None"`)
- `components/TtsTestComponent.tsx:44` - `` `Speaking: ${window.speechSynthesis.speaking ? 'Yes' : 'No'}\n` ``
- `components/TtsTestComponent.tsx:47` - `` `Pending: ${window.speechSynthesis.pending ? 'Yes' : 'No'}\n` ``
- `components/TtsTestComponent.tsx:50` - `` `Paused: ${window.speechSynthesis.paused ? 'Yes' : 'No'}\n` ``
- `components/TtsTestComponent.tsx:51` - `` `User Agent: ${navigator.userAgent.substring(0, 100)}...` ``

Alerts:

- `components/TtsTestComponent.tsx:53` - `"Speech Synthesis Debug"` (title)
- `components/TtsTestComponent.tsx:65` - `"Speech Synthesis Status"` (title)
- `components/TtsTestComponent.tsx:65` - `"Speech Synthesis: Not Available"` (body)
- `components/TtsTestComponent.tsx:106` - `"Android Test Failed"` (title)
- `components/TtsTestComponent.tsx:110` - `"Error"` (title)
- `components/TtsTestComponent.tsx:110` - `"Speech synthesis not available"` (body)

Panel:

- `components/TtsTestComponent.tsx:116` - `"TTS Debug Console"` (title)
- `components/TtsTestComponent.tsx:117` - `"Status: "` (followed by `{ttsState}`)
- `components/TtsTestComponent.tsx:120` - `"Test Basic TTS"` (button)
- `components/TtsTestComponent.tsx:124` - `"Test with Breaks"` (button)
- `components/TtsTestComponent.tsx:128` - `"Test Long Text"` (button)
- `components/TtsTestComponent.tsx:132` - `"Check Speech API"` (button)
- `components/TtsTestComponent.tsx:136` - `"Android Direct Test"` (button)
- `components/TtsTestComponent.tsx:144` - `"Stop TTS"` (button)

Borderline, listed for completeness: four spoken test sentences (`:7`, `:13`,
`:19`, `:75`) go through `readAloud` and are heard, not read. `ttsState` values
(`'idle'` and so on, rendered raw at `:117`) are internal state names.
`utterance.lang = 'en-US'` (`:82`) is a locale id.

**`components/AnalogClock.tsx` - 2. Dead.** No import anywhere under `app/` or
`components/`.

- `components/AnalogClock.tsx:116` - `"PM"` (ternary constant in `formatTime`, rendered by the digital `SvgText` at `:184`)
- `components/AnalogClock.tsx:116` - `"AM"` (same ternary)

Not user-facing: the `12`, `3`, `6`, `9` hour labels (`:92`), `hourNum`, colour
ternaries, inline styles, `textAnchor="middle"`.

**`components/kids/StreakPet.tsx` - 24.** No `useTranslation`, no `t()`. The file
is hardcoded **German**, so it renders German in all three languages. Stage names
and messages are module-level constants (`PET_STAGES`, `:10`), rendered at `:256`
(`stage.name`) and `:280` (`stage.message`):

- `components/kids/StreakPet.tsx:14` - `"Ei"` (stage 0 `name`)
- `components/kids/StreakPet.tsx:16` - `"Spiele täglich, um mich schlüpfen zu sehen!"` (stage 0 `message`)
- `components/kids/StreakPet.tsx:21` - `"Küken"` (stage 1)
- `components/kids/StreakPet.tsx:23` - `"Ich bin geschlüpft! Spiel weiter!"` (stage 1)
- `components/kids/StreakPet.tsx:28` - `"Jungvogel"` (stage 3)
- `components/kids/StreakPet.tsx:30` - `"Ich wachse! Noch 4 Tage bis zum nächsten Level!"` (stage 3)
- `components/kids/StreakPet.tsx:35` - `"Weise Eule"` (stage 7)
- `components/kids/StreakPet.tsx:37` - `"Du bist toll! Ich bin jetzt eine weise Eule!"` (stage 7)
- `components/kids/StreakPet.tsx:42` - `"Einhorn"` (stage 14)
- `components/kids/StreakPet.tsx:44` - `"Magisch! Du hast 14 Tage geschafft!"` (stage 14)
- `components/kids/StreakPet.tsx:49` - `"Drache"` (stage 30)
- `components/kids/StreakPet.tsx:51` - `"FEUER! 30 Tage — ich bin jetzt ein Drache! 🐉🔥"` (stage 30)
- `components/kids/StreakPet.tsx:56` - `"Sternenwesen"` (stage 60)
- `components/kids/StreakPet.tsx:58` - `"Legendär! 60 Tage in Folge!"` (stage 60)
- `components/kids/StreakPet.tsx:63` - `"König"` (stage 100)
- `components/kids/StreakPet.tsx:65` - `"Der Quiz-König! 100 Tage! 👑"` (stage 100)

Inline in the render:

- `components/kids/StreakPet.tsx:256` - `"Schlafend..."` (ternary, pet name when not played today)
- `components/kids/StreakPet.tsx:259` - `"Tag"` (streak counter word)
- `components/kids/StreakPet.tsx:259` - `"e"` (ternary plural suffix `{currentStreak !== 1 ? 'e' : ''}`)
- `components/kids/StreakPet.tsx:263` - `"⚠️ Heute noch nicht gespielt! Spiel jetzt, damit deine Serie nicht abbricht!"`
- `components/kids/StreakPet.tsx:269` - `"Tag"` (days-to-next-stage counter)
- `components/kids/StreakPet.tsx:269` - `"e"` (ternary plural suffix `{daysToNext !== 1 ? 'e' : ''}`)
- `components/kids/StreakPet.tsx:269` - `"Noch"`, `"bis zum"` and the trailing `"!"` (JSX text fragments around `{daysToNext}`, `{nextStage.emoji}`, `{nextStage.name}`)
- `components/kids/StreakPet.tsx:275` - `"👑 Du hast alle Level erreicht! Legendär!"`
- `components/kids/StreakPet.tsx:281` - `"Dein Haustier schläft... Spiel ein Quiz zum Aufwecken!"` (ternary, message when not played today)

Count basis: 16 constant names/messages plus 8 inline literals. The two German
plural concatenations at `:259` and `:269` cannot survive a straight `t()` swap
and need i18next plurals.

Not user-facing: `'😴'` (`:249`) and the stage emoji, `sizeMap`/`fontSizeMap`
(`:179-180`), colours, the `size` prop union, `Animated` easing names,
`styles.*`.

**`components/kids/CelebrationOverload.tsx` - 5.** No `useTranslation`. Mixed
English and German in one random pool, picked once via `useState` at `:413`
(`const texts = [...]` at `:414`), rendered by `WooHooText` at `:442`
(`{text}`).

- `components/kids/CelebrationOverload.tsx:415` - `"SUPER! 🦄"` (English)
- `components/kids/CelebrationOverload.tsx:416` - `"WOOOHOO! 🌈"` (English)
- `components/kids/CelebrationOverload.tsx:417` - `"TOLL! 🦄"` (German)
- `components/kids/CelebrationOverload.tsx:418` - `"GENIAL! 🌈"` (German)
- `components/kids/CelebrationOverload.tsx:419` - `"KLASSE! 🦄"` (German)

Not user-facing: emoji literals (`:88`, `:98`, `:216`, `:274-281`), the `colors`
hex array (`:226`), `'0deg'`, `pointerEvents="none"`, animation values.

**`components/kids/MultiplicationRangeSheet.tsx` - 1 hardcoded string, plus 7
keys that render raw.** `useTranslation` present (`:4`, `:43`); partial. Covered
already: `:70` `` label={`${minutes} ${t('minutes')}`} `` (the `minutes` key exists
in all three locales).

- `components/kids/MultiplicationRangeSheet.tsx:147` - `"Abbrechen"` (`t('cancel', 'Abbrechen')` inline default for the Cancel button). There is no `cancel` key in `en.json`, `de.json` or `fi.json`, so this renders `Abbrechen` in English, German and Finnish alike. Currently visible bug.

Seven `t()` calls with no default argument whose keys exist only in `de.json`; on
`en` and `fi` the raw key text is on screen (evidence in Q6):

- `components/kids/MultiplicationRangeSheet.tsx:96` - `{t('multiplication_quiz_name')}` (sheet title)
- `components/kids/MultiplicationRangeSheet.tsx:98` - `{t('multiplication_mode')}` (row label)
- `components/kids/MultiplicationRangeSheet.tsx:120` - `{t(labelKey)}` with `labelKey` from `MODE_OPTIONS` (`:36-39`): `multiplication_mode_count`, `multiplication_mode_timed`
- `components/kids/MultiplicationRangeSheet.tsx:129` - `{t('multiplication_duration')}` (row label, timed mode only)
- `components/kids/MultiplicationRangeSheet.tsx:134` - `{t('multiplication_range_from')}` (row label)
- `components/kids/MultiplicationRangeSheet.tsx:138` - `{t('multiplication_range_to')}` (row label)
- `components/kids/MultiplicationRangeSheet.tsx:155` - `{t('multiplication_range_start')}` (Start button)

Not user-facing: `FACTOR_ITEMS` labels (`:30`, `label={String(index + 1)}`),
`DURATION_MINUTES = [1, 2, 3, 5, 10]`, `'count' | 'timed'` values, `key` props,
`accessibilityRole`, `dropdownIconColor`, `styles.*`.

**`components/learning/CodeTracing.tsx` - 15.** No `useTranslation`, no `t()`.

- `components/learning/CodeTracing.tsx:67` - `'This is the correct answer.'` (fallback for `explanation`, rendered `:268-270`)
- `components/learning/CodeTracing.tsx:128` - `'Code Tracing Complete!'` (`completedTitle`)
- `components/learning/CodeTracing.tsx:130` - `{correctCount} / {questions.length} correct ({percentage}%)` (`scoreText`; three interpolations around the word `correct`)
- `components/learning/CodeTracing.tsx:134` - `"You're a mental compiler! 🧠"` (ternary `>= 90`)
- `components/learning/CodeTracing.tsx:136` - `'Great mental model! 🎯'` (ternary `>= 70`)
- `components/learning/CodeTracing.tsx:138` - `'Keep building that mental model 💪'` (ternary `>= 50`)
- `components/learning/CodeTracing.tsx:139` - `'Practice makes the mental compiler stronger! 🔧'` (ternary else)
- `components/learning/CodeTracing.tsx:144` - `'Back'` (button)
- `components/learning/CodeTracing.tsx:148` - `'Try Again'` (button)
- `components/learning/CodeTracing.tsx:164` - `'🧠 Mental Compiler'` (header, always on screen)
- `components/learning/CodeTracing.tsx:192` - `'script.js'` (fake file name in the code-card chrome, always on screen)
- `components/learning/CodeTracing.tsx:265` - `'✅ Correct! You traced it right.'` (correct branch)
- `components/learning/CodeTracing.tsx:266` - `"❌ Not quite. Here's the trace:"` (wrong branch)
- `components/learning/CodeTracing.tsx:274` - `'Next Challenge'` (not-last branch)
- `components/learning/CodeTracing.tsx:275` - `'See Results'` (last branch)

Chrome worth noting: the answer prefix `{String.fromCharCode(65 + index)}.` at
`:247` is a Latin letter label; progress readouts at `:165-167` and `:130` are
numbers. Quiz content (`question`, `options`, `explanation` at `:63-69`, `:200`,
`:212`, `:268`) comes from `assets/quizzes_*.json` via the `quizzes` prop.

**`components/learning/DebuggingExercise.tsx` - 23.** No `useTranslation`. The
one file in fragment 3's set where module-level code builds English sentences out
of content.

- `components/learning/DebuggingExercise.tsx:72` - `` `// Concept: ${line}` `` (i === 0 branch), rendered `:257`
- `components/learning/DebuggingExercise.tsx:72` - `` `// ${line}` `` (else branch), rendered `:257`
- `components/learning/DebuggingExercise.tsx:79` - `` `// ❌ Wrong: ${wrongAnswers[0].answer}` ``, rendered `:257`
- `components/learning/DebuggingExercise.tsx:88` - `` `The correct answer is: ${q.answer}. ${q.explanation}` `` (result card body, `:283-285`)
- `components/learning/DebuggingExercise.tsx:89` - `` `// ✅ Correct: ${q.answer}\n${q.explanation}` `` ("fixed code" body, `:305-307`)
- `components/learning/DebuggingExercise.tsx:151` - `'Bug Hunt Complete!'`
- `components/learning/DebuggingExercise.tsx:153` - `{correctCount} / {exercises.length} bugs found ({percentage}%)`
- `components/learning/DebuggingExercise.tsx:157` - `"You're a debugging master! 🐛🔍"` (ternary `>= 90`)
- `components/learning/DebuggingExercise.tsx:159` - `'Great bug detection skills! 🎯'` (ternary `>= 70`)
- `components/learning/DebuggingExercise.tsx:161` - `'Keep hunting those bugs! 💪'` (ternary `>= 50`)
- `components/learning/DebuggingExercise.tsx:162` - `'Practice makes a better debugger! 🔧'` (ternary else)
- `components/learning/DebuggingExercise.tsx:167` - `'Back'` (button)
- `components/learning/DebuggingExercise.tsx:171` - `'Try Again'` (button)
- `components/learning/DebuggingExercise.tsx:189` - `'🐛 Bug Hunter'` (header)
- `components/learning/DebuggingExercise.tsx:215` - `'👆 Tap the line with the bug'` (instruction)
- `components/learning/DebuggingExercise.tsx:226` - `'buggy_code.js'` (fake file name)
- `components/learning/DebuggingExercise.tsx:281` - `'🎯 Bug Found!'` (correct branch)
- `components/learning/DebuggingExercise.tsx:281` - `'❌ Wrong Line'` (wrong branch)
- `components/learning/DebuggingExercise.tsx:297` - `'Hide Fix'` (`showFix`)
- `components/learning/DebuggingExercise.tsx:297` - `'Show Fixed Code'` (`!showFix`)
- `components/learning/DebuggingExercise.tsx:303` - `'✅ Fixed Code:'` (card title)
- `components/learning/DebuggingExercise.tsx:315` - `'Next Bug'` (not-last branch)
- `components/learning/DebuggingExercise.tsx:316` - `'See Results'` (last branch)

`:257`'s `{line || ' '}` is a space, not copy.

**`components/learning/FadedExamples.tsx` - 19.** No `useTranslation`.

- `components/learning/FadedExamples.tsx:79` - `'Read and understand the concept.'` (`stage.description`, stage 1, rendered `:309-311`)
- `components/learning/FadedExamples.tsx:92` - `'Fill in the key term.'` (`stage.description`, stage 2, rendered `:309-311`)
- `components/learning/FadedExamples.tsx:210` - `placeholder="fill in..."` (`TextInput` inside the blank, `:200-213`)
- `components/learning/FadedExamples.tsx:246` - `'Scaffolding Complete!'`
- `components/learning/FadedExamples.tsx:248` - `{correctCount} / {totalStagesWithBlanks} stages correct (` + `{percentage}%)` (score line, split across `:247-250`)
- `components/learning/FadedExamples.tsx:253` - `"You've mastered these patterns! 🏆"` (ternary `>= 90`)
- `components/learning/FadedExamples.tsx:255` - `'Great understanding! 🎯'` (ternary `>= 70`)
- `components/learning/FadedExamples.tsx:256` - `'Keep practicing these patterns! 📚'` (ternary else; this component has no `>= 50` branch, unlike the other four)
- `components/learning/FadedExamples.tsx:261` - `'Back'` (button)
- `components/learning/FadedExamples.tsx:265` - `'Start Over'` (button; the other four say `Try Again`)
- `components/learning/FadedExamples.tsx:282` - `'📖 Faded Examples'` (header)
- `components/learning/FadedExamples.tsx:324` - `Stage {currentStageIndex + 1} of {currentExample.stages.length}` (code-card chrome, a sentence with two numbers)
- `components/learning/FadedExamples.tsx:344` - `'✅ Perfect!'` (correct branch)
- `components/learning/FadedExamples.tsx:344` - `'❌ Not quite right'` (wrong branch)
- `components/learning/FadedExamples.tsx:348` - `'Correct answers:'` (label above the answer list)
- `components/learning/FadedExamples.tsx:363` - `'Check Answers'` (primary button)
- `components/learning/FadedExamples.tsx:371` - `'Next Stage'` (more stages)
- `components/learning/FadedExamples.tsx:373` - `'Next Example'` (more examples)
- `components/learning/FadedExamples.tsx:374` - `'Finish'` (last)

`'___BLANK___'` at `:88` is an internal sentinel consumed by
`renderCodeWithBlanks()` (`:174-226`); the matched fragment is replaced by the
`TextInput`, so it never reaches the screen.

**`components/learning/ParsonsProblems.tsx` - 21.** No `useTranslation`.

- `components/learning/ParsonsProblems.tsx:191` - `'Parsons Complete!'`
- `components/learning/ParsonsProblems.tsx:193` - `{correctCount} / {problems.length} correct ({percentage}%)`
- `components/learning/ParsonsProblems.tsx:197` - `'Master code organizer! 🏆'` (ternary `>= 90`)
- `components/learning/ParsonsProblems.tsx:199` - `'Great logical thinking! 🎯'` (ternary `>= 70`)
- `components/learning/ParsonsProblems.tsx:201` - `'Good progress! Keep practicing 💪'` (ternary `>= 50`)
- `components/learning/ParsonsProblems.tsx:202` - `'Focus on the structure! 📚'` (ternary else)
- `components/learning/ParsonsProblems.tsx:207` - `'Back'` (button)
- `components/learning/ParsonsProblems.tsx:211` - `'Try Again'` (button)
- `components/learning/ParsonsProblems.tsx:227` - `'📦 Parsons Problems'` (header)
- `components/learning/ParsonsProblems.tsx:254` - `'📝 Your Solution (tap to remove)'` (section title)
- `components/learning/ParsonsProblems.tsx:259` - `'Tap lines below to add them here...'` (empty state for the placed-lines box)
- `components/learning/ParsonsProblems.tsx:299` - `'🧩 Available Lines (tap to add)'` (section title)
- `components/learning/ParsonsProblems.tsx:313` - `'All lines placed! Check your answer.'` (empty state for the pool)
- `components/learning/ParsonsProblems.tsx:322` - `'Reset'` (button)
- `components/learning/ParsonsProblems.tsx:333` - `'Check Answer'` (button)
- `components/learning/ParsonsProblems.tsx:346` - `'✅ Perfect Order!'` (correct branch)
- `components/learning/ParsonsProblems.tsx:346` - `'❌ Not Quite Right'` (wrong branch)
- `components/learning/ParsonsProblems.tsx:350` - `'You arranged all the code lines correctly!'` (correct body)
- `components/learning/ParsonsProblems.tsx:351` - `'Some lines are in the wrong position. The correct positions are highlighted.'` (wrong body)
- `components/learning/ParsonsProblems.tsx:356` - `'Next Problem'` (not-last)
- `components/learning/ParsonsProblems.tsx:357` - `'See Results'` (last)

`:254`, `:299` and `:322` are the first things a `de`/`fi` user sees on this
screen, and `styles.sectionTitle` adds `textTransform: 'uppercase'` (`:435`).

**`components/learning/SRSDailyWarmup.tsx` - 17 sites, 16 distinct.** No
`useTranslation`, though it already imports `useQuiz` at `:12`.

- `components/learning/SRSDailyWarmup.tsx:129` - `'Loading your daily warmup...'` (loading state)
- `components/learning/SRSDailyWarmup.tsx:139` - `'All caught up! 🎉'` (empty-state title)
- `components/learning/SRSDailyWarmup.tsx:141` - `'No questions due for review right now.'` (empty-state subtitle)
- `components/learning/SRSDailyWarmup.tsx:143-147` - `📊 {stats.totalTracked} questions tracked • {stats.masteredCount}{' '} mastered` (two counts and a plural in one string)
- `components/learning/SRSDailyWarmup.tsx:149` - `'Back to Learn'` (button, empty state)
- `components/learning/SRSDailyWarmup.tsx:166` - `'Warmup Complete!'`
- `components/learning/SRSDailyWarmup.tsx:168` - `{correctCount} / {questions.length} correct ({percentage}%)`
- `components/learning/SRSDailyWarmup.tsx:172` - `'Outstanding! 🌟'` (ternary `>= 90`)
- `components/learning/SRSDailyWarmup.tsx:174` - `'Great job! 👏'` (ternary `>= 70`)
- `components/learning/SRSDailyWarmup.tsx:176` - `'Good effort! Keep practicing 💪'` (ternary `>= 50`)
- `components/learning/SRSDailyWarmup.tsx:177` - `'Keep at it! Practice makes perfect 📚'` (ternary else)
- `components/learning/SRSDailyWarmup.tsx:181` - `'Back to Learn'` (button, completion state; second occurrence)
- `components/learning/SRSDailyWarmup.tsx:194` - `'Daily Warmup'` (header)
- `components/learning/SRSDailyWarmup.tsx:273` - `'✅ Correct!'` (correct branch)
- `components/learning/SRSDailyWarmup.tsx:274` - `'❌ Incorrect'` (wrong branch)
- `components/learning/SRSDailyWarmup.tsx:282` - `'Next Question'` (not-last)
- `components/learning/SRSDailyWarmup.tsx:283` - `'Finish'` (last)

Question and answer text (`currentQuestion.quizName`, `.question`, `ans.answer`,
`.explanation` at `:222`, `:223`, `:257`, `:277`) comes from the SRS object, i.e.
quiz content. `stats.dueToday` from `getSRSStats()` is fetched at `:85` and never
rendered here.

Cross-file duplicates the plan can merge into one key: `'Back'` (CodeTracing
`:144`, DebuggingExercise `:167`, FadedExamples `:261`, ParsonsProblems `:207`;
`en.json:8` already has `"back": "back"`, lowercase, so it is not the same
string), `'Try Again'` (3x), `'See Results'` (3x), `'Finish'` (2x), `'Back to
Learn'` (2x), and the score pattern `{a} / {b} correct ({p}%)` (4x).

### `services/` (inventory owed to fragment 1's ticket evidence and fragment 2; 5 or 7 occurrences, disputed)

**`services/multiplayerRules.ts` - 5** (fragment 2) against the ticket's 4. No
`useTranslation` (plain `.ts`).

- `services/multiplayerRules.ts:129` - `"Waiting for your rival"`
- `services/multiplayerRules.ts:130` - `"Opponent left"`
- `services/multiplayerRules.ts:131` - `` `${-lead} behind` `` (template)
- `services/multiplayerRules.ts:132` - `` `You're ahead by ${lead}` `` (template)
- `services/multiplayerRules.ts:132` - `"Tied"`

The ticket counted 4 for `leadLabel`, so it folded the two literals on `:132`
into one. Footnote f1.

**`services/multiplayerFailures.ts` - 7** (ticket, `:40-52`) against fragment 1's
"8 English sentences" at `:40-55`.

- `services/multiplayerFailures.ts:40-52` - `No room with that code`, `This room is already full`, `This device cannot do multiplayer`, `Cannot reach the server, check the connection`, `Could not connect, try again`, `The room did not answer`, `Could not create a room, try again`

Neither fragment read this file; the count and the line range conflict.
Footnote f1, unresolved.

**`services/MultiplicationQuiz.ts` - 0 hardcoded strings**, but it is the one
service that already translates: `:1` `import i18n from '@/components/i18n';`,
`:14` `i18n.t('multiplication_quiz_name')`, `:15`
`i18n.t('multiplication_quiz_category')`. Both are module-scope calls. It is
listed here rather than in the table because it has no literal of its own.

### Master table (Q1)

Definitions used in the columns:

- **user-facing strings**: literal occurrences found by a fragment. 0 means
  "no fragment found a hardcoded literal", not "no user-facing text": rows
  marked `partial` still render untranslated text through `t()` keys that are
  missing or wrong.
- **useTranslation**: `yes` = hook used and no hardcoded literal left; `partial`
  = the file translates some strings and still hardcodes others, or translates
  through the non-reactive bare `t` import; `no` = no translation call at all.
  No row in this table can be `yes`: the only two files that are fully covered,
  `components/LearningTodos.tsx` and `app/(tabs)/profile.tsx`, have zero
  hardcoded literals and therefore no row.
- **dead**: no import of the file anywhere under `app/`, `components/`, `hooks/`
  or `services/` (verified with `grep -rn` in fragments 1 and 2).
- **need work** = not dead, i.e. the row the plan wants.

| file | user-facing strings | useTranslation (yes/no/partial) | dead (yes/no) |
| --- | ---: | --- | --- |
| `app/+html.tsx` | 4 | no | no |
| `app/+not-found.tsx` | 3 | no | no |
| `app/modal.tsx` | 2 | no | no |
| `app/(tabs)/_layout.tsx` | 4 | no | no |
| `app/(tabs)/index.tsx` | 6 | partial | no |
| `app/(tabs)/learn.tsx` | 23 | no | no |
| `app/(tabs)/settings.tsx` | 36 | partial | no |
| `app/multiplayer/index.tsx` | 26 | no | no |
| `app/multiplayer/[code].tsx` | 40 | no | no |
| `components/Flashcards.tsx` | 3 | partial (bare `t` from `i18next`, not the hook) | no |
| `components/GlossaryModal.tsx` | 5 | no | no |
| `components/MultiplayerScoreboard.tsx` | 5 | no | no |
| `components/OfflineIndicator.tsx` | 2 | no | **yes** |
| `components/Score.tsx` | 5 | partial | no |
| `components/Question.tsx` | 3 | partial | no |
| `components/QuizSelection.tsx` | 2 | partial | no |
| `components/EssayReader.tsx` | 5 | no | no |
| `components/TtsTestComponent.tsx` | 26 | no | **yes** |
| `components/AnalogClock.tsx` | 2 | no | **yes** |
| `components/kids/StreakPet.tsx` | 24 | no | no |
| `components/kids/CelebrationOverload.tsx` | 5 | no | no |
| `components/kids/MultiplicationRangeSheet.tsx` | 1 | partial | no |
| `components/learning/CodeTracing.tsx` | 15 | no | no |
| `components/learning/DebuggingExercise.tsx` | 23 | no | no |
| `components/learning/FadedExamples.tsx` | 19 | no | no |
| `components/learning/ParsonsProblems.tsx` | 21 | no | no |
| `components/learning/SRSDailyWarmup.tsx` | 17 | no | no |
| `services/multiplayerRules.ts` | 5 (ticket says 4, footnote f1) | no | no |
| `services/multiplayerFailures.ts` | 7 (fragment 1 says 8, footnote f1) | no | no |
| **total** | **339** (range 338 to 340, footnote f1) | | **3 dead of 29** |

Per-surface subtotals: `app/` 144 across 9 files; `components/` 183 across 18
files; `services/` 12 or 13 across 2 files. Rows that need work: **26**.

**f1. Disputed counts inside the table.** Two `services/` rows disagree between
the ticket and a fragment, and no fragment read `services/multiplayerFailures.ts`
or recounted `services/multiplayerRules.ts`:

- `services/multiplayerRules.ts`: ticket says 4 strings at `:129-132`; fragment 2
  lists 5, because `:132` holds two literals (`You're ahead by ${lead}` and
  `Tied`). Fragment 2 read the file's line numbers; the ticket did not cite a
  read. The table takes 5 and flags it.
- `services/multiplayerFailures.ts`: ticket says 7 strings at `:40-52`;
  fragment 1's non-component table says "8 English sentences" at `:40-55`. The
  table takes 7 because the ticket enumerates 7 sentences, and marks the count
  unresolved. Both fragments are second-hand here.

Total therefore reads 339 (rules 5 + failures 7), 338 (rules 4 + failures 7) or
340 (rules 5 + failures 8).

**f2. `components/` is incomplete, and the table cannot be made complete from
these fragments.** 53 files live under `components/` outside `ui/` and
`locales/`; the fragments read 27 of them (19 in fragment 2, 8 in fragment 3,
plus `hooks/useOfflineDetection.ts`, which is not under `components/`). Files
with **no inventory anywhere**:
`components/CodeFormatter.tsx`, `components/EditScreenInfo.tsx`,
`components/Explanation.tsx`, `components/ExternalLink.tsx`,
`components/Onboarding.tsx`, `components/Reader.tsx`,
`components/SafeAreaGradient.tsx`, `components/SettingsHeader.tsx`,
`components/StyledText.tsx`, `components/Themed.tsx`, `components/types.ts`,
`components/gamification/AchievementBadge.tsx`,
`components/gamification/AchievementModal.tsx`,
`components/gamification/DailyQuiz.tsx`,
`components/gamification/GamificationProvider.tsx`,
`components/gamification/GamificationStats.tsx`,
`components/gamification/StreakDisplay.tsx`,
`components/gamification/XPProgress.tsx`, `components/gamification/index.ts`,
`components/gamification/types.ts`, `components/useClientOnlyValue.ts`,
`components/useClientOnlyValue.web.ts`, `components/useColorScheme.ts`,
`components/useColorScheme.web.ts`, `components/useReadAloud.ts`. That is 25
paths, 21 of them plausibly render text; `i18n.ts` is excluded by the ticket.

Three of those files are known to carry text without a count:
`components/EditScreenInfo.tsx` (prose cited at `:14-20`, `:30-37`, `:45-48` by
fragment 1 but never counted), `components/Reader.tsx` (hardcoded `Currently
reading` and `of` cited at `:351` by fragment 4), `components/Onboarding.tsx`
(`t('almost_there', 'Almost there!')` cited at `:61` by fragment 4). So 339 is a
floor, not a total, for the repo as a whole.

---

## Q2. Which files are not user-facing and must be skipped

Answer: merge of the three fragment verdicts.

**Zero rendered text, skip entirely (11 files).**

| file | why |
| --- | --- |
| `app/_layout.tsx` | provider/navigation shell plus service-worker registration; only `console.log`/`console.error` (`:63`, `:77`, `:83`); `<Stack.Screen>` entries at `:148-155` set no title |
| `app/multiplayer/_layout.tsx` | two `<Stack.Screen>` entries at `:6-7`, both `headerShown: false`, no titles |
| `app/remoteUpdate.ts` | server route handler; every string is a JSON `error` payload or a log (`:14`, `:30`, `:37`, `:50-52`, `:54`, `:57-59`, `:83`, `:104`, `:106`, `:108`), and the only consumer sends them to `console.error` (`components/Quizprovider.tsx:527`) |
| `app/(tabs)/profile.tsx` | renders text but all three strings already go through `t()` (`:30` `t('hello','Hello')`, `:46` `t('stats','Stats')`, `:59` `t('learning','Learning')`) and all three keys exist in en/de/fi |
| `components/GlossaryProvider.tsx` | renders `{children}` only; the one literal `:90` `"useGlossary must be used within a GlossaryProvider"` is a developer `throw` |
| `components/ClickableTerms.tsx` | every visible character comes from the `text` prop or `assets/glossary.json` |
| `components/Music.tsx` | `return null` (`:38`); only `require()` paths and a comment. Still mounted from `app/_layout.tsx:110`, so it is live, not dead |
| `components/QuizTimer.tsx` | renders `formatTime(secondsLeft)` (`:115`), a zero-padded `MM:SS` with no word to translate |
| `components/LearningTodosProvider.tsx` | renders `{children}` (`:200`); AsyncStorage key `'quizzy_learning_todos'` (`:14`), `todo_` id prefix (`:61`), two `console.error` (`:94`, `:104`), developer `throw` (`:208-211`) |
| `components/Quizprovider.tsx` | context provider; renders `{children}` (`:776-837`) or `null` (`:770-773`); 31 `console.error` calls, two thrown `Error`s (`:844`, `:733`) |
| `components/learning/index.ts` | 9 lines of re-exports, only a comment (`:1`) |
| `components/learning/SRSManager.ts` | pure logic plus AsyncStorage; see Q5c |
| `hooks/useOfflineDetection.ts` | returns `{ isOnline, wasOffline }` booleans only (`:38`) |

(13 rows; `components/Quizprovider.tsx` sits in this bucket by fragment 3's
verdict, which the ticket contradicts. See the gaps section.)

**User-facing but unreachable, decide before spending (3 files, 30 strings).**

- `components/TtsTestComponent.tsx` - 26 strings, no import anywhere.
- `components/AnalogClock.tsx` - 2 strings, no import anywhere.
- `components/OfflineIndicator.tsx` - 2 strings, no import anywhere.

All three confirmed dead by `grep -rn` over `app/`, `components/`, `hooks/` and
`services/`, in both the ticket and fragment 2. Whether translating them is
worth it is a Design decision, not a research finding.

---

## Q3. Naming convention for new keys

Answer (fragment 4, plus fragment 1's and fragment 2's in-code observations).

**Shape: flat, `snake_case`, no namespaces.** All three locale files are one flat
`string -> string` object. Counts: `en.json` 111 keys, `de.json` 121, `fi.json`
111. `components/i18n.ts:37-41` registers exactly one namespace per language
(`en: { translation: en }`), so every key lives in `translation`; there is no
`:` separator anywhere.

- Dominant style is flat `snake_case`: `quiz_title`, `select_quiz`,
  `show_explanation_desc`, `achievement_category_streak`,
  `multiplication_quiz_label_range`.
- Four legacy keys use `Pascal_Snake`, all in the score block: `en.json:33`
  `Quiz_wins`, `en.json:34` `Quiz_losses`, `en.json:36` `Answers_right`,
  `en.json:37` `Answers_wrong`. They are the only keys starting uppercase.
- No key contains a hyphen, dot or colon (no namespacing).
- Feature prefixes are used instead of namespaces, consistently: `timer_*`
  (`en.json:47-51`), `achievement_category_*` (`en.json:79-83`),
  `multiplication_*` (`de.json:55-64`, German only), `achievement_*`.
- Keys are **not** sorted: order follows feature landing order (quiz chrome,
  settings toggles, score, reader, timer, gamification, daily quiz, statistics,
  learning to-dos, explanation, onboarding). `de.json` and `fi.json` mirror the
  `en.json` order, with the ten `multiplication_*` keys spliced into `de.json`
  between `minutes` (`de.json:54`) and `time_up` (`de.json:65`).

**How keys were added historically** (`git log --oneline -15 -- components/locales/`):
`77c1c95`, `375ab40`, `9d9ab9d`, `20b55fc` (the four Einmaleins commits),
`63287c5`, `37f389e`, `dec0955`, `76cf6fc`, `d4faee0`, `d8e0f61`, `4824fa9`,
`a382b25`, `82571b1`, `0d5853d`, `20152da`. Four observed rules:

1. One block of keys per feature, shipped in the feature commit. `d4faee0`
   (timer) brings `timer_mode`, `timer_mode_desc`, `timer_duration`,
   `timer_duration_desc`, `minutes`, `time_up`, `time_remaining`; `76cf6fc`
   (gamification) brings the `achievement_*` and stats block.
2. New keys are inserted beside the keys they belong with, not appended.
   `20b55fc` adds `multiplication_range_from`/`_to`/`_start` directly after
   `multiplication_quiz_category` and before `time_up`.
3. Single-language commits happen and are the known failure mode: all four
   `multiplication_*` commits touch `de.json` only (`20b55fc ... 1 file changed,
   3 insertions(+)`), which is exactly how `de.json` ended up with 10 keys the
   other two lack. Their commit convention is `feat(i18n): ...` plus a
   `QRSPI: <slug>` trailer.
4. `en.json` is the reference and is edited last or simultaneously. Its most
   recent change is a deletion, in `63287c5`:
   `- "multiplication_quiz_name": "Multiplication Tables (1–10)"` and
   `- "multiplication_quiz_category": "📐 Mathematics"`, body: "The generated
   Einmaleins round is for the German quiz set, so inject it only when the app
   language is German. Drops the unused English and Finnish name/category keys."

**House convention: in-code English defaults.** 23 `t()` calls pass an English
string as the second argument (`grep -rn "t('[a-z_]*', *'" --include=*.tsx
--include=*.ts app/ components/ | wc -l` → 23). Examples:
`app/(tabs)/profile.tsx:30` `{t('hello', 'Hello')}, {userName}! 👋`,
`components/Onboarding.tsx:61` `t('almost_there', 'Almost there!')`,
`components/LearningTodos.tsx:77` `t('question_to_review', 'question to review')`.
Fragment 2 adds the counter-example that this convention can bite: at
`components/LearningTodos.tsx:111` the call `t('correct', 'correct')` resolves to
`en.json:6` `"Correct!"` (de `Richtig!`, fi `Oikein!`), so a noun label renders as
a congratulation.

---

## Q4. Dynamic strings, plurals, formatted numbers

Answer (fragment 4, with the count sites from fragments 1, 2 and 3).

**Interpolated keys: exactly two, and one is German-only.**

```
components/locales/en.json:101  "progress_info": "Answer correctly {{remaining}} more times to master this question"
components/locales/fi.json:101  "progress_info": "Vastaa oikein vielä {{remaining}} kertaa oppiaksesi tämän kysymyksen"
components/locales/de.json:111  "progress_info": "Noch {{remaining}} mal richtig beantworten, um diese Frage zu meistern"
components/locales/de.json:57   "multiplication_quiz_label_range": "Einmaleins ({{from}}×{{from}} bis {{to}}×{{to}})"
```

| key | languages | placeholders | call site |
| --- | --- | --- | --- |
| `progress_info` | en, de, fi | `{{remaining}}` | `components/LearningTodos.tsx:178-183` (key on `:179-180`, literal default on `:181`, `{ remaining: 3 - selectedTodo.correctCount }` on `:182`) |
| `multiplication_quiz_label_range` | de only | `{{from}}`, `{{to}}` | `app/(tabs)/index.tsx:524-528` |

Those are the only `t()` calls in `app/` and `components/` that pass an options
object (`grep -rn "t('[a-z_]*', *{"` returns only `index.tsx:524`; it misses
`progress_info` because that key sits on its own line).

**Plural machinery: not used at all today.**

- `grep -rn "_one\|_other\|_zero\|_many" components/locales/` → no output, exit
  1. No `_one`/`_other` key in any locale file.
- No `t()` call passes a `count` option. The 9 `count:` hits are
  `QuizSelection.tsx:44`, `:367`, `:374`, `:403`, `:417` (SectionList metadata)
  and `gamification/StreakDisplay.tsx:81`, `:88`, `:95` (style keys).
- Singular/plural is hand-rolled with a ternary over two keys,
  `components/LearningTodos.tsx:75-79`:
  `{todos.length === 1 ? t('question_to_review', ...) : t('questions_to_review', ...)}`.
  The existing pairs are `question`/`questions` (`en.json:4-5`; fi `Kysymys` /
  `kysymystä`; de `Frage` / `Fragen`) and `question_to_review` /
  `questions_to_review` (`en.json:94-95`). `fi.json:4-5` already encodes the
  Finnish partitive correctly (`5 kysymystä`), so the two-key approach works for
  Finnish as long as the count-1 branch is used for exactly 1.

**Digit-bearing values, and numbers glued onto strings.** No `en.json` or
`fi.json` value contains a digit; `de.json` has two: `:55`
`"Einmaleins (1×1 bis 10×10)"` and `:62` `"20 Aufgaben"`. Every other number is
concatenated in the component:

| file:line | code | note |
| --- | --- | --- |
| `app/(tabs)/settings.tsx:357-364` | ``label={`1 ${t('minutes')}`}`` … ``label={`30 ${t('minutes')}`}`` | 8 hardcoded number + unit |
| `components/kids/MultiplicationRangeSheet.tsx:70` | ``label={`${minutes} ${t('minutes')}`}`` | same pattern |
| `components/SettingsHeader.tsx:88` | `{t('question')} {currentQuestionIndex + 1}` | number follows the noun, correct order for en/de/fi |
| `components/Reader.tsx:59` | ``content += `${t('question')} ${questionNumber}: ${question.question}. `;`` | TTS output |
| `components/Reader.tsx:338` | ``label={`${t('question')} ${index + 1}`}`` | |
| `components/Reader.tsx:351` | `Currently reading: {t('question')} {currentQuestionIndex + 1} of{' '}` | the words `Currently reading` and `of` are hardcoded English |
| `components/Reader.tsx:381` | `{t('question')} {index + 1}` | |
| `components/gamification/DailyQuiz.tsx:85` | `{dailyQuizData.quiz.questions?.length \|\| 0} {t('questions')}` | number + `questions`, needs the singular branch at 1 |
| `components/gamification/StreakDisplay.tsx:183-186` | `{streak.currentStreak}` in one `<Text>`, `{t('day_streak')}` in the next | `en.json:58` is singular-only, so 1 and 7 read the same |
| `components/gamification/XPProgress.tsx:151` | `{xp.totalXP.toLocaleString()} {t('total_xp')}` | locale-formatted number |
| `components/gamification/XPProgress.tsx:182` | `` `${xp.xpForNextLevel - xp.xpInCurrentLevel} ${t('xp_to_next')}` `` | |
| `components/gamification/GamificationStats.tsx:68,78,96,106,111,116` | `t('quizzes')`, `t('accuracy')`, `t('questions_answered')`, `t('perfect_scores')`, `t('Quiz_wins')`, `t('days_played')` | bare labels beside counters |
| `components/LearningTodos.tsx:75` | `{todos.length}{' '}` | count plus plural pair |

Component-level count sites reported by the other fragments, each already listed
in Q1: `components/kids/StreakPet.tsx:259` and `:269` (German `Tag`/`e` plural
concatenation), `components/GlossaryModal.tsx:265`
(`` `${filteredTerms.length} terms available` ``), `components/EssayReader.tsx:58`
(`{essay.sections.length} sections`), `components/learning/SRSDailyWarmup.tsx:143-147`
(two counts and a plural in one string), `app/(tabs)/learn.tsx:221-226`
(`" quizzes • "` then `"questions"` around a `reduce()`),
`app/multiplayer/[code].tsx:44-49` (`formatTime`, English `m`/`s` units,
rendered `:469`), `app/multiplayer/[code].tsx:30`-style progress
`Q{n}/{q}` in `components/MultiplayerScoreboard.tsx:30`, and the four score lines
`{a} / {b} correct ({p}%)` in CodeTracing `:130`, DebuggingExercise `:153`,
ParsonsProblems `:193`, SRSDailyWarmup `:168`.

No translated value embeds a date or a time, and there is no `Intl` date
formatting in any locale string. `components/QuizTimer.tsx:115` renders `MM:SS`,
which is locale-neutral as written. `components/AnalogClock.tsx:116` holds
`AM`/`PM` but is dead.

**Strings that need a count form** (ranked by whether English reads wrong at 1;
the ranking is fragment 4's, carried as evidence, not a recommendation):

1. `question`/`questions` (`en.json:4-5`) at `DailyQuiz.tsx:85`: at 1 question
   English prints "1 questions". The one plural bug reachable today.
2. `question_to_review`/`questions_to_review` (`en.json:94-95`) at
   `LearningTodos.tsx:76-78`: already handled by the ternary, correct.
3. `day_streak` (`en.json:58`): no plural form exists; "1 day streak" and "7 day
   streak" both read acceptably, so no count form needed.
4. `minutes` (`en.json:54`): `settings.tsx:357` already offers 1, which renders
   "1 minutes" in English and "1 minuuttia" instead of "1 minuutti" in Finnish.
   German `Minuten` is fine for every count.
5. Also count-sensitive but not in fragment 4's list: `multiplication_mode_count`
   `de.json:62` `"20 Aufgaben"` (number baked into the value),
   `GalleryModal`'s `terms available` (`GlossaryModal.tsx:265`), and
   `StreakPet.tsx:259`/`:269` whose plural is a bare `e` suffix.

Everything else (`Quiz_wins`, `quizzes`, `days_played`, `xp_to_next`, `total_xp`)
is a bare label beside a number and is count-invariant in all three languages.

---

## Q5. Non-component string sources

Answer: merged table. Fragment 1 covered `app/`, fragment 3 covered
`learning/` and `Quizprovider`, fragment 2 covered the `components/` set.

| Kind | Location | Notes |
| --- | --- | --- |
| `Alert.alert` | `app/(tabs)/settings.tsx:110`, `:155`, `:167` | 3 calls, two with the generic title `"Error"`. Native only, no web branch. |
| `showAlert` wrapper (web `window.alert`/`window.confirm`, native `Alert.alert`) | defined `app/multiplayer/index.tsx:26-34`; called `:127`, `:141`, `:145`, `:155`, `:171`, `:175`, `:198`, `:202` | web path composes `` `${title}\n\n${message}` `` at `:29` |
| `showAlert` with buttons | defined `app/multiplayer/[code].tsx:50-70`; called `:161`, `:342` | button labels at `:162` (`Cancel`), `:164` (`Leave`); web path uses `window.confirm` at `:58`, so the confirm dialog also depends on those strings |
| `Alert.alert` in a dead component | `components/TtsTestComponent.tsx:53`, `:65`, `:106`, `:110` | 6 title/body strings; dead code |
| Alert bodies from a service | `services/multiplayerFailures.ts:40-52` (ticket) / `:40-55` (fragment 1) | 7 or 8 sentences injected into the alerts above; defined outside `app/`, rendered from `app/` |
| Lead line from a service | `services/multiplayerRules.ts:129-132` | rendered by `components/MultiplayerScoreboard.tsx:73`, and `app/multiplayer/[code].tsx` imports `leadLabel` too |
| `accessibilityLabel` | `app/(tabs)/index.tsx:505`, `:655` (both `"Open glossary"`), `components/Question.tsx:826` (`"Read question and answers aloud"`) | only three in the repo; `grep -rn accessibilityHint app/` returns nothing |
| `placeholder` | `app/multiplayer/index.tsx:269`, `app/multiplayer/[code].tsx:588` (both `"Enter your name"`), `components/GlossaryModal.tsx:219`, `components/learning/FadedExamples.tsx:210`, `components/Question.tsx:851` (already `t('type_your_answer')`) | |
| `Picker.Item label` | `app/(tabs)/settings.tsx:194-196` (already `t()`), `:357-364` (`` `${n} ${t('minutes')}` ``), `:394` (`"Default Voice"`), `:398` (`` `${voice.name} (${voice.lang})` ``), `components/kids/MultiplicationRangeSheet.tsx:70` | unit order is hardcoded as `number space unit` |
| Screen `options.title` | `app/(tabs)/_layout.tsx:91`, `:112`, `:121`, `:130` | tab bar labels. `app/_layout.tsx:120-127` and `app/multiplayer/_layout.tsx:6-7` set no title |
| `<Stack.Screen options={{ title }}>` | `app/+not-found.tsx:9` | `"Oops!"` |
| TTS output | `app/(tabs)/settings.tsx:419-420` (`const testText = 'Hello! This is a test of the text-to-speech voice.'`, spoken at `:427`), `components/useReadAloud.ts` (outside every fragment's file set), `components/Reader.tsx:49` (`` content = `${t('quiz_title')}: ${quiz.name}. ` ``), `components/Reader.tsx:59`, `components/TtsTestComponent.tsx:7`, `:13`, `:19`, `:75` | heard, not read, but still user-facing |
| Constants rendered later | `app/(tabs)/learn.tsx:68-108` (`learningOptions`, rendered `:260`/`:262`/`:306`/`:308`), `:120` (`getCategoryDisplayName`, rendered `:216`), `components/kids/StreakPet.tsx:10-65` (`PET_STAGES`, rendered `:256`, `:280`), `components/kids/CelebrationOverload.tsx:414-419` (`texts`, rendered `:442`), `components/QuizSelection.tsx:372` (`title:`) | a JSX-only scan misses these |
| Helper producing screen text | `app/multiplayer/[code].tsx:44-49` (`formatTime`, rendered `:469`) | English `m`/`s` units |
| `console.*` | `app/_layout.tsx:63`, `:77`, `:83`; `app/remoteUpdate.ts:37`, `:50`, `:104`; `app/multiplayer/index.tsx:144`, `:174`, `:201`; `app/multiplayer/[code].tsx:143`, `:155`; `components/Quizprovider.tsx` 31 calls; `components/learning/SRSManager.ts:53`, `:67`; `components/LearningTodosProvider.tsx:94`, `:104` | none reach the UI; leave English |
| `Toast` | none | `grep -rn Toast app/` returns 0 hits |

No `Alert.alert` and no `accessibilityLabel` exist in `components/learning/*`,
`components/Quizprovider.tsx` or `hooks/*` (fragment 3, `grep -n "Alert\."` exit
1).

**Is `components/i18n.ts` importable from a plain `.ts` without a cycle? Yes,
and there is a working precedent.**

- `components/i18n.ts` imports only `i18next`, `react-i18next`, `react-native`
  (`Platform`), `react-native-localize`,
  `./locales/de.json`, `./locales/en.json`, `./locales/fi.json`. It imports
  nothing from `components/` or `app/`, so `plain .ts -> components/i18n.ts` is a
  leaf edge and no cycle can form through it.
- Existing precedent: `services/MultiplicationQuiz.ts:1`
  `import i18n from '@/components/i18n';`, then `i18n.t(...)` at `:14-15`.
  Also `components/Quizprovider.tsx:1` and `app/_layout.tsx:19`, with
  `app/_layout.tsx:102` wrapping the tree in `<I18nextProvider i18n={i18n}>`.
  `components/i18n.ts:33-45` initialises i18next at import time (side effect).
  `npx tsc --noEmit` is clean over these imports (ticket gate).
- **Hazard, recorded by both fragments 1 and 3:** module-scope `i18n.t()`
  freezes the value at import time. `services/MultiplicationQuiz.ts:14-15` is
  evaluated once, so that quiz name does not follow a language change after
  load, and `i18n.ts` loads before `Quizprovider` calls `i18n.changeLanguage`,
  so the first evaluation is already in the initial language. It happens to be
  harmless today only because `getLocalQuizzes()` re-calls
  `createMultiplicationQuiz()` on every language change
  (`Quizprovider.tsx:757-768` effect). Any new `i18n.t()` in a plain module
  should sit inside a function body.

**`components/learning/SRSManager.ts` needs no `t()` at all.** Full audit:
exported API is `generateQuestionId` (`:26-40`), `loadSRSData` (`:44-56`),
`saveSRSData` (`:61-70`), `getQuestionSRSData` (`:74-94`),
`calculateNextReview` (`:101-146`), `getDueQuestions` (`:152-220`),
`recordAnswer` (`:228-244`), `getSRSStats` (`:249-266`), plus the
`SRSReviewQuestion` interface (`:13-21`). Literals: storage key
`'@quizzy_srs_data'` (`:9`) and two `console.error` strings
`'Failed to load SRS data:'` (`:53`) and `'Failed to save SRS data:'` (`:67`).
`getDueQuestions()` returns text copied verbatim from the `quizzes` argument
(`:167-177`, `:199-210`), i.e. content selected upstream in `getLocalQuizzes()`.
`getSRSStats()` returns three numbers only (`:259-265`).
`generateQuestionId` builds `` `${quizName}::${questionText.substring(0, 50)}` ``
(`:31`) as a hash input that never reaches the UI.

---

## Q6. The `multiplication_*` gap

Answer: 10 keys, 11 call sites across 3 files, and the gap does **not** reach a
user today because the multiplication quiz is injected for German only. On
`en`/`fi` the affected screens would show **raw key text, not English** (the
ticket's premise is refuted here).

**Where the keys are consumed.** `grep -rn "multiplication_" app/ components/
services/` gives 11 `t()`/`i18n.t()` call sites plus the 10 definitions in
`components/locales/de.json:55-64`:

| file:line | call |
| --- | --- |
| `app/(tabs)/index.tsx:524` | `t('multiplication_quiz_label_range', { from, to })` (the only interpolated one) |
| `components/kids/MultiplicationRangeSheet.tsx:36` | `labelKey: 'multiplication_mode_count'`, translated at `:120` |
| `components/kids/MultiplicationRangeSheet.tsx:37` | `labelKey: 'multiplication_mode_timed'`, translated at `:120` |
| `components/kids/MultiplicationRangeSheet.tsx:96` | `t('multiplication_quiz_name')` (sheet title) |
| `components/kids/MultiplicationRangeSheet.tsx:98` | `t('multiplication_mode')` |
| `components/kids/MultiplicationRangeSheet.tsx:129` | `t('multiplication_duration')` (timed mode only) |
| `components/kids/MultiplicationRangeSheet.tsx:134` | `t('multiplication_range_from')` |
| `components/kids/MultiplicationRangeSheet.tsx:138` | `t('multiplication_range_to')` |
| `components/kids/MultiplicationRangeSheet.tsx:155` | `t('multiplication_range_start')` |
| `services/MultiplicationQuiz.ts:14` | `i18n.t('multiplication_quiz_name')` → quiz `name` |
| `services/MultiplicationQuiz.ts:15` | `i18n.t('multiplication_quiz_category')` → quiz `category`, reaching the screen as the quiz-list group heading via `QuizSelection` |

Between them these cover all 10 keys. The builder itself lives in
`components/Quizprovider.tsx:95-97`, which appends `createMultiplicationQuiz()`
**only when `lang.startsWith('de')`**, with the comment
`// Generated Einmaleins practice round. German-only for now.`

**What actually renders for `en`/`fi`: the raw key, not English.** This was
verified by running the repo's own `i18next@25.2.1` against the real locale
files, not by reading the library. Resolution path:
`node_modules/i18next/dist/cjs/i18next.js:605-670`, where `res = key` at
`:614-616` and `extendTranslation` interpolates that key string at `:663`.
Recorded output:

```
en ["multiplication_quiz_label_range","multiplication_quiz_name","multiplication_mode",
    "multiplication_range_start","multiplication_mode_count","multiplication_duration",
    "multiplication_quiz_category","Abbrechen","minutes"]
fi [same raw keys, plus "minuuttia"]
de ["Einmaleins (2×2 bis 7×7)","Einmaleins (1×1 bis 10×10)","Modus","Los geht’s",
    "20 Aufgaben","Dauer","🔢 Mathematik","Abbrechen","Minuten"]
```

So `en` and `fi` would see bare snake_case identifiers with underscores
(`multiplication_quiz_name` and so on), and the `fi` fallback chain (`fi` → `en`,
both missing) behaves identically to `en`. Separately,
`t('cancel', 'Abbrechen')` at `MultiplicationRangeSheet.tsx:147` renders the
German word for `en`/`fi` users, because a missing key with a `defaultValue` takes
the default (`i18next.js:609-612`), and `cancel` exists in none of the three
locale files.

**Why it is dormant.** Two independent gates:

1. `components/Quizprovider.tsx:94-97` only appends the quiz when
   `lang.startsWith('de')` (comment: "German-only for now"), so `en`/`fi` quiz
   lists contain no quiz with `generator === MULTIPLICATION_GENERATOR`.
2. `app/(tabs)/index.tsx:241-249` only opens the sheet when the selected quiz
   matches `generator === MULTIPLICATION_GENERATOR`, and `:663-675` only mounts
   `<MultiplicationRangeSheet>` while `rangeSheetQuiz !== null`.

No `assets/quizzes_{en,de,fi}.json` contains a `generator` field (the only
`multiplication` hits in `quizzes_en.json` are prose inside explanations;
`quizzes_de` and `quizzes_fi` have zero). The one live path for an `en`/`fi` user
is a user-supplied quiz JSON declaring `"generator": "multiplication"`, loaded
through `Quizprovider.tsx:349-360` `loadUserQuizzes()`, which `JSON.parse`s the
stored array without validating `generator`. The defect becomes visible the
moment the German-only gate is lifted.

**What English text the keys correspond to.** Fragment 3 found no remaining
English literal in `MultiplicationRangeSheet.tsx` beyond the `cancel` default, so
the keys were introduced together with the German-only feature and the English
copies were never written. Fragment 3 recorded this proposed `en`/`fi` mapping
(carried as its evidence, not a decision):

| key | `de` value (intent) | fragment 3's proposed `en` |
| --- | --- | --- |
| `multiplication_quiz_name` | `Einmaleins (1×1 bis 10×10)` | multiplication tables name; the `1×1 bis 10×10` is baked in and will be stale for any other range |
| `multiplication_quiz_category` | `🔢 Mathematik` | `🔢 Mathematics` |
| `multiplication_quiz_label_range` | `Einmaleins ({{from}}×{{from}} bis {{to}}×{{to}})` | `{{from}}×{{from}} to {{to}}×{{to}}` |
| `multiplication_range_from` | `Von` | `From` |
| `multiplication_range_to` | `Bis` | `To` |
| `multiplication_range_start` | `Los geht’s` | `Start` |
| `multiplication_mode` | `Modus` | `Mode` |
| `multiplication_mode_count` | `20 Aufgaben` | `20 problems` (matches `MULTIPLICATION_QUESTION_COUNT = 20`, `services/multiplicationProblems.ts:10`) |
| `multiplication_mode_timed` | `Zeit` | `Timed` |
| `multiplication_duration` | `Dauer` | `Duration` |

Two adjacent facts: `minutes` already exists in all three files (`en.json:54`,
`de.json:54`, `fi.json:54`), and `cancel` exists in none, which is why
`Abbrechen` shows for everyone.

**Is `"quiz_title": "Quizzy (DE)"` intentional? Not documented, and now
answered as far as it can be.** Two fragments say different things and both are
kept:

- Fragment 3 marked it **unresolved**: intent needs `git log`/`git blame`, which
  its stage instructions forbade. Its evidence: the suffix is a developer-style
  marker and it survives into spoken audio, which reads as a debug artefact.
- Fragment 4 answered it with git: the string has been present since the file's
  first commit, `90f9cbe 2025-06-10 feat: Implement internationalization support
  with English and German translations`, and has never been changed
  (`git log -S'"Quizzy (DE)"' -- components/locales/de.json`, and
  `git show 90f9cbe:components/locales/de.json` shows it on line 2). The same
  commit created `en.json` with `"quiz_title": "Quizzy"`. **No commit message
  justifies the suffix.** Fragment 4's reading: a marker to tell the two files
  apart during development.

Line-number correction: the key is `de.json:2`, not `de.json:1`; line 1 of all
three files is the opening brace. Sole consumer is
`components/Reader.tsx:49`: `` content = `${t('quiz_title')}: ${quiz.name}. ` ``,
fed to `readAloud(...)` from `useReadAloud` at `components/Reader.tsx:165` and
`:253`. Not rendered as on-screen text anywhere (`grep -rn "quiz_title"` over
`app/` and `components/` returns that one hit), so the asymmetry is audible in
reader mode and invisible otherwise. **Whether it should change remains a Design
question; what research adds is that nothing in history records an intent.**

---

## Q7. Translation-quality check

Answer (fragment 4; every `en.json` key read against its `de.json` and `fi.json`
counterpart). **16 German defects and 18 Finnish defects.** No fixes applied.

### German (`components/locales/de.json`), 16

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

Fragment 4's own summary of that list: 2 of the 16 are bucket "still English", so
14 real translation problems plus the `quiz_title` asymmetry.

### Finnish (`components/locales/fi.json`), 18

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

### Two extra findings that change what counts as a defect

1. **`en.json` has an inverted answer pair, and both keys are dead.**
   `en.json:36` `"Answers_right": "Wrong Answers"`, `en.json:37`
   `"Answers_wrong": "Correct Answers"`. German (`de.json:36-37` `Richtige
   Antworten` / `Falsche Antworten`) and Finnish (`fi.json:36-37` `Oikeita
   vastauksia` / `Vääriä vastauksia`) are semantically correct, so English is the
   odd one out. Repo-wide grep shows no call site: those six locale lines are the
   only hits. Dead today, a bug the moment someone wires them up.
2. **`resets_in` is dead too.** Its only occurrences are `en.json:75`,
   `de.json:85`, `fi.json:75`; no call site. That downgrades German row 8 and
   Finnish row 10 from user-visible to latent.

---

## Q8. Where a regression test should live

Answer (fragment 4, which corrects the ticket's premise; the ticket's own body
already carries a partial correction).

**Correction to "There are no unit tests":** there are 15 tracked jest suites.
`npx jest --listTests` lists 14 under `services/__tests__/` plus
`components/__tests__/StyledText-test.js`. The ticket's scan missed them because
they are `.js` and it looked for `.spec.ts`/`.test.ts`. Full run:
`Test Suites: 15 passed, 15 total / Tests: 155 passed, 155 total / Snapshots: 1
written / Time: 1.843 s`, exit 0. The ticket's separate statement of "14 suites /
154 tests" describes `services/__tests__` only, which is why the two numbers
differ (footnote in the gaps section).

One disclosure from fragment 4: the snapshot suite has no committed snapshot, so
that run created `components/__tests__/__snapshots__/StyledText-test.js.snap` as
an untracked file, which fragment 4 then removed; `git status --porcelain` was
back to `?? .scratch/`.

**Config inventory.**

- No `jest.config.*`, no `jest.setup.*`, no `setupTests.*` anywhere. Jest config
  lives entirely in `package.json:14-21`: `preset: "jest-expo"`,
  `testPathIgnorePatterns: ["/node_modules/", "/__rsc_tests__/", "/e2e/"]`.
- `package.json:10` `"test": "jest --watchAll"` never exits, so it cannot be a
  gate call.
- `jest-expo` `~52.0.6` at `package.json:116` (installed 52.0.6); `jest`
  `^29.2.1` at `package.json:115` (installed 29.7.0); `react-test-renderer`
  18.3.1 present.
- No `@testing-library/*`, no `@testing-library/jest-native`, no `ts-jest`:
  `ls -d node_modules/@testing-library node_modules/ts-jest` both "No such file
  or directory". TypeScript therefore runs through `babel-jest` with the Expo
  preset, i.e. types are stripped, not checked, in tests.
- `babel.config.js` exists: `babel-preset-expo` with `jsxImportSource:
  'nativewind'`, `nativewind/babel`, and `module-resolver` with alias
  `@ -> ./` plus `tailwind.config`.

**Would `components/locales/locale-parity.test.ts` be picked up? Yes.** From
`npx jest --showConfig`: `testMatch` is `["**/__tests__/**/*.[jt]s?(x)",
"**/?(*.)+(spec|test).[tj]s?(x)"]`, `testPathIgnorePatterns` as above, `rootDir`
`/home/maverock24/gitrepos/Quizzy`. A micromatch check confirms
`components/locales/locale-parity.test.ts`, `...test.js` and
`...spec.ts` all match, as does any file dropped in a `__tests__` directory, so a
helper module must not live in `__tests__`. The parity test's path contains none
of the three ignore patterns, so it is kept. (The same logic explains why
`e2e/multiplayer.spec.ts` matches `testMatch` yet never appears in `--listTests`:
its path contains `/e2e/`.)

**Exact commands.**

- One test, to completion: `npx jest components/locales/locale-parity.test.ts`.
  Verified of the same shape on an existing suite: `npx jest
  services/__tests__/answerMode.test.js` → `1 passed, 15 tests`, exit 0. `npx
  jest <path>` does not watch when stdout is not a TTY, so it exits. Belt and
  braces: `npx jest --watchAll=false <path>`.
- Whole suite: `npx jest`.

**What the parity test must import.** The three JSON files directly:
`import en from './en.json'` and so on. Do **not** import
`components/i18n.ts` from a Node test if avoidable: it imports
`react-native-localize` (`components/i18n.ts:4`), whose installed 3.4.1 declares
no `jest` field, so nothing in the repo proves that import works under jest.
Plain JSON imports depend on neither React Native nor a component tree.

A locale-parity test of the form "every `en` key present in `de` and `fi`, no
value identical to English" is therefore feasible and needs no component tree.

---

## Q9. Is `i18next` re-rendering reliable?

Answer: yes for the hook, with one measured exception (a component that does not
use the hook).

**Registration is correct.** `components/i18n.ts` uses `initReactI18next` (`:2`,
`:34`) and passes only `lng`, `fallbackLng`, `resources`,
`interpolation: { escapeValue: false }` to `.init()` (`:34-45`). No
`react: { useSuspense: false }`, no `react: { bindI18n }`, no `bindI18nStore`, so
react-i18next 15.5.2 defaults apply: bind to `languageChanged` and `loaded`, and
every `useTranslation()` consumer re-renders on `changeLanguage`.

Nothing swallows the re-render either: `grep -rn "React.memo\|export default
memo"` over `app/` and `components/` returns no output.

**Count correction.** Fragment 4 counted 19 files calling `useTranslation`; the
ticket says 21. Re-run during this merge: `grep -rl useTranslation --include=*.tsx
--include=*.ts app components | wc -l` → **19**, and the 19 import sites are
`app/(tabs)/index.tsx:15`, `app/(tabs)/profile.tsx:11`,
`app/(tabs)/settings.tsx:6`, `components/useReadAloud.ts:4`,
`components/Onboarding.tsx:15`, `components/Question.tsx:17`,
`components/kids/MultiplicationRangeSheet.tsx:4`, `components/SettingsHeader.tsx:4`,
`components/Explanation.tsx:6`, `components/Score.tsx:14`,
`components/LearningTodos.tsx:15`, `components/Reader.tsx:4`,
`components/QuizSelection.tsx:14`, `components/gamification/AchievementModal.tsx:17`,
`components/gamification/GamificationStats.tsx:16`,
`components/gamification/StreakDisplay.tsx:16`,
`components/gamification/XPProgress.tsx:16`,
`components/gamification/DailyQuiz.tsx:17`,
`components/gamification/AchievementBadge.tsx:8`. Fragment 4's count is the
correct one.

**Places that copy `i18n.language` into local state** (`grep -rn "i18n\.language"`):

| site | what it is | stale risk |
| --- | --- | --- |
| `app/(tabs)/settings.tsx:189` | `selectedValue` of the language `Picker`, read during render | none; the component also calls `useTranslation`, so it re-renders and re-reads |
| `components/useReadAloud.ts:327` | read inside a callback at call time | none |
| `components/useReadAloud.ts:580` | dependency array entry | none; correct dep |
| `components/Quizprovider.tsx:79` | read inside `getLocalQuizzes()`, a plain function called per invocation | none |
| `components/Quizprovider.tsx:116` | `useState` initial value | none, because `:766` re-syncs in an effect keyed on `[i18n.language, userQuizLoadEnabled]` (`:768`) |
| `components/Quizprovider.tsx:421`, `:671`, `:686` | reset / load / compare paths | none |
| `components/Onboarding.tsx:25` | `useState(i18n.language \|\| 'en')`, **no sync effect** | the one case. Its `handleLanguageChange` (`Onboarding.tsx:28-31`) keeps the two in step and its rendered strings go through `t()` (reactive), so nothing renders stale today. But the local value is what `onComplete(name, language)` receives (`Onboarding.tsx:37`), so a language change from elsewhere while Onboarding is mounted would pass a stale value. Verified by reading `components/Onboarding.tsx:1-45`: no `useEffect` |

**The exception the hook analysis misses:** `components/Flashcards.tsx:20` is
`import { t } from 'i18next';`, the bare instance rather than the hook. It calls
`t('use_flashcards')` at `:480`, and that value does not re-render on
`changeLanguage`, because nothing subscribes. Fragment 2 found this; fragment 4's
"every `t()` call re-renders" claim holds only for hook consumers.

Versions: `i18next` `^25.2.1` at `package.json:113` (installed 25.2.1),
`react-i18next` `^15.5.2` at `package.json:139` (installed 15.5.2).

---

## Q10. `assets/essays_en.json` and `assets/glossary.json`

Answer (fragment 4): both are **content**, English-only, long-form prose, and
both are **rendered as visible text** in the UI. Their bodies stay out of scope;
the chrome around them is UI text and belongs in scope.

`assets/essays_en.json` is a top-level array of 3 essays (`category`, `title`,
`sections[]`), 13 + 16 + 18 = 47 sections, each section `heading`, `image`,
`content` with multi-paragraph English bodies. `assets/glossary.json` is one flat
object of 350 `term -> definition` pairs. Only the `_en` variant exists:
`ls assets/ | grep -i "essay|glossary"` → `essay_images`, `essays_en.json`,
`glossary.json`; no `essays_de.json`, `essays_fi.json`, `glossary_de.json` or
`glossary_fi.json`. Repo-wide, the only references are
`components/GlossaryProvider.tsx:8` and `components/Quizprovider.tsx:109`,
and `Quizprovider.tsx:106-110` states the intent in a comment: `// Only English
essays exist for now; extend with de/fi when available`, returning
`require('../assets/essays_en.json')`.

They are rendered as text, not hidden data:

- `components/EssayReader.tsx:55` `{essay.category}`, `:56` `{essay.title}`,
  `:58` `{essay.sections.length} sections`, `:75` `{section.heading}`, `:84`
  `{section.content}`.
- `components/GlossaryModal.tsx:135` `{item.term}`, `:137` `{item.definition}`,
  `:154` `{selectedTerm.term}`, `:158` `{selectedTerm.definition}`, plus the
  hardcoded header `:202` `{selectedTerm ? 'Definition' : 'AI/ML Glossary'}`.
- `components/GlossaryProvider.tsx:8` imports the JSON, `:39-43` turns the object
  into a sorted `GlossaryEntry[]` (`{ term, definition }`, type `:10-13`).

Verdict: the file **bodies** are out of scope, consistent with the ticket's
assumption for `assets/quizzes_*.json`; 47 essay sections and 350 glossary
definitions are a translation project, and there is no `_de`/`_fi` variant to key
into. The **chrome** around them is in scope, and the two examples are already in
the ticket's "no `useTranslation`" file list: `EssayReader.tsx:58` and
`GlossaryModal.tsx:202`. So the ticket's scope assumption is confirmed for the
bodies and does not shrink the file list.

Also relevant to scope, from fragment 3: `components/Quizprovider.tsx:78-104`
selects `assets/quizzes_{en,fi,de}.json` and sorts by `quiz.name || quiz.nimi`,
so quiz content is language-selected upstream and stays out of scope as the
ticket assumed.

---

## Q11. Anything already half-done

Answer: fragment 2's ranked partial-coverage list, merged with fragment 1's
per-file `t()` inventory for `app/` and fragment 3's finding that
`components/learning/` has zero coverage.

**Fully covered, nothing to do:** `components/LearningTodos.tsx` (twelve `t()`
calls, no hardcoded literal: `:32` `unknown_quiz`, `:55` `no_todos`, `:57`
`no_todos_desc`, `:72` `learning_todos`, `:75-79` the plural ternary, `:87`
`practice_all`, `:111` `correct`, `:142` `question`, `:150` `your_answer`, `:157`
`correct_answer`, `:167` `explanation`, `:180` `progress_info`, `:193` `close`),
with the one caveat recorded below. `app/(tabs)/profile.tsx` is also fully
covered (`:30`, `:46`, `:59`).

**Partial coverage, cheapest first** (fragment 2's ranking, carried as evidence):

1. `components/kids/MultiplicationRangeSheet.tsx` - 9 of 10 strings covered, 1
   hardcoded (`t('cancel', 'Abbrechen')` `:147`). The only one already visible in
   English, and the cheapest fix in the `components/` set.
2. `components/QuizSelection.tsx` - covered: `t('other')` `:372`, `:459`.
   Uncovered: `"📖 Read"` `:137`, `"⚔️ Multiplayer Mode"` `:449`. Category titles
   and quiz names come from data, not from this file.
3. `components/Question.tsx` - covered: `t('type_your_answer')` `:851`,
   `t('submit_answer')` `:868`, `t('correct_answer_is')` `:890`. Uncovered:
   `"+1 ✨"` `:158`, the `answerLabels` array A: to D: `:267` (rendered `:973`,
   spoken `:709`), the read-aloud `accessibilityLabel` `:826`.
4. `components/Score.tsx` - covered: `t('time_up')` `:335`, `t('score')` `:377`,
   `t('retry_wrong', ...)` `:398`. Uncovered: `"🎉 Well Done! 🎉"` `:337` and
   again `:416`, `"💪 Try again!"` `:338`, `"✨ Perfect Score! ✨"` `:342`,
   `"Great job!"` `:342`. Same heading written twice, once per branch.
5. `components/LearningTodos.tsx` - nominally 100 percent covered, but every call
   passes an English inline default duplicating `en.json`, and
   `t('correct', 'correct')` `:111` resolves to `"Correct!"` instead of the
   intended noun (`en.json:6`), so a row reads "0/3 Correct!". Also no plural
   handling on `correct`.
6. `components/Flashcards.tsx` - partially covered through the wrong mechanism:
   `t` imported from `i18next` at `:20`, not the hook. Covered
   `t('use_flashcards')` `:480`; uncovered `:445`, `:498`, `:550`. Because the
   bare `t` does not subscribe, this component also does not re-render on
   language change (Q9).

Two more partials from fragment 1, not in fragment 2's ranking:

7. `app/(tabs)/settings.tsx` - about 10 `t()` sites already (`:175`, `:178`,
   `:194-196`, the switch rows `:200-299` and `:309-370`, `t('minutes')` inside
   `:357-364`, `:527-541`), with 36 literals still hardcoded, including one
   hardcoded **German** description at `:306-307`.
8. `app/(tabs)/index.tsx` - `useTranslation` present (`:15`, `:95`), which is why
   the `t('multiplication_quiz_label_range', ...)` call at `:524-527` exists at
   all, yet its key is missing from `en.json`/`fi.json` so the quiz list shows
   the raw key.

**Zero coverage, no partial to salvage:** all five `components/learning/`
components (`CodeTracing` 15, `DebuggingExercise` 23, `FadedExamples` 19,
`ParsonsProblems` 21, `SRSDailyWarmup` 17 = 95 literals). None imports
`useTranslation`; `grep -n "useTranslation\|t(" components/learning/*` matches
only `useState`/`useEffect`/`setState` and the `t`-free `useQuiz()` destructure at
`SRSDailyWarmup.tsx:34`. `SRSDailyWarmup.tsx` is the cheapest of the five because
it already imports `useQuiz` at `:12` and every label is a plain sibling of a
question the file already loads.

---

## Contradictions and gaps

1. **`components/` is not fully inventoried, so Q1 is unanswered for 25 files.**
   No fragment read `components/CodeFormatter.tsx`, `EditScreenInfo.tsx`,
   `Explanation.tsx`, `ExternalLink.tsx`, `Onboarding.tsx`, `Reader.tsx`,
   `SafeAreaGradient.tsx`, `SettingsHeader.tsx`, `StyledText.tsx`, `Themed.tsx`,
   `types.ts`, the six text-bearing `gamification/` components, `gamification/index.ts`,
   `gamification/types.ts`, `gamification/GamificationProvider.tsx`,
   `useClientOnlyValue(.web).ts`, `useColorScheme(.web).ts`, `useReadAloud.ts`.
   Fragment 2 was assigned "19 files" and fragment 3 nine; nobody was assigned the
   rest. Consequence: the 339 total is a floor. Unresolved, reason: scope
   assignment, not evidence.
2. **`components/EditScreenInfo.tsx` has strings that were cited but never
   counted.** Fragment 1 wrote "`EditScreenInfo` also renders English prose of its
   own (`components/EditScreenInfo.tsx:14-20`, `30-37`, `45-48`)" and flagged it
   for "whoever covers `components/`". Nobody did, so the file is missing from
   the master table despite a fragment finding strings in it. The clearest
   zero-vs-strings case in this merge.
3. **`components/Reader.tsx` is in the same hole.** Fragment 4 cites hardcoded
   English at `:351` (`Currently reading`, `of`) and translated calls at `:49`,
   `:59`, `:338`, `:381`, but no fragment inventoried the file. Present in Q4's
   dynamic-string table only.
4. **Ticket says 21 files call `useTranslation`; the grep says 19** (re-run
   during this merge, and fragment 4 independently reported 19). The ticket's own
   enumeration also has 19 entries. Resolved in favour of 19.
5. **Ticket lists `app/(tabs)/profile.tsx` as having no `useTranslation`** in one
   list and as a `useTranslation` file in another. Fragment 1 read the file: it
   has the hook (`:11`, `:16`) and zero hardcoded strings. Resolved in favour of
   fragment 1.
6. **Ticket claims `components/Quizprovider.tsx` renders user-facing text;**
   fragment 3 read all 847 lines and found none (renders `{children}` `:776-837`
   or `null` `:770-773`; 31 `console.error`; two thrown `Error`s). Resolved in
   favour of fragment 3.
7. **Ticket's "suspected" list is contradicted for four files**:
   `components/QuizTimer.tsx` (0 strings, `MM:SS` only),
   `components/Music.tsx` (0, returns `null` at `:38`),
   `components/ClickableTerms.tsx` (0), `components/GlossaryProvider.tsx` (0, one
   developer `throw` at `:90`), `components/LearningTodosProvider.tsx` (0), and
   `components/learning/SRSManager.ts` (0, per fragment 3's full audit). Also
   `components/MultiplayerScoreboard.tsx` was "suspected" and is confirmed
   user-facing with 5 strings. Fragments win on all six.
8. **String count for `services/multiplayerRules.ts`: fragment 2 says 5, the
   ticket says 4.** Cause: `:132` holds two literals. Fragment 2 cites line
   numbers, the ticket cites a count only. Unresolved for the file; the table
   takes 5 and flags it.
9. **String count for `services/multiplayerFailures.ts`: ticket says 7 at
   `:40-52`, fragment 1's table says "8 English sentences" at `:40-55`.** Neither
   fragment read the file. Unresolved, reason: no first-hand read; the table
   takes 7 because the ticket enumerates 7 sentences.
10. **`components/kids/MultiplicationRangeSheet.tsx`: fragment 3 says "no
    remaining English literal" in the render path, fragment 2 lists 1 hardcoded
    (`t('cancel', 'Abbrechen')` `:147`).** Both are consistent about the cause
    (a `t()` default rather than a bare literal) but disagree on the count.
    Resolved as: 1 occurrence, of the `t(key, default)` kind; fragment 3 was
    counting bare literals.
11. **Test-suite counts do not match: ticket says 14 suites / 154 tests,
    fragment 4 says 15 / 155.** Fragment 4 includes
    `components/__tests__/StyledText-test.js`; the ticket's numbers describe
    `services/__tests__` alone. Both are correct for their own scope. Note also
    that fragment 4's run wrote and then deleted an untracked snapshot file.
12. **Fragment 4's Q9 claim "every `t()` call re-renders on `changeLanguage`"
    does not hold for `components/Flashcards.tsx:20`**, which imports the bare
    `t` from `i18next` instead of the hook (fragment 2). Scope mismatch, not a
    factual error in either fragment; the merged Q9 carries both.
13. **`"quiz_title": "Quizzy (DE)"` is marked unresolved by fragment 3 and
    answered by fragment 4** (present since commit `90f9cbe`, 2025-06-10, never
    changed, no commit message justifies it). Merged as: the history is settled,
    the intent is undocumented. Whether to change it remains open.
14. **Line citation error inherited from the ticket: `de.json:1` should be
    `de.json:2`** for `quiz_title` (line 1 is the opening brace in all three
    files). Fragment 3 caught it, fragment 4 confirms.
15. **Ticket's premise for Q6 is refuted**: it asks research to "confirm that on
    `fi` the multiplication quiz currently falls back to English". The measured
    output is the raw key text (`multiplication_quiz_name` and friends), not
    English, and the screens do not reach `en`/`fi` users at all because of the
    `lang.startsWith('de')` gate at `components/Quizprovider.tsx:94-97`.
16. **Ticket's premise for Q8 is refuted** ("There are no unit tests"): the
    ticket's own body already carries the correction, and fragment 4 confirms 15
    suites.
17. **No fragment verified the e2e constraint.** The ticket asserts
    `e2e/multiplayer.spec.ts` pins English strings at `:34`, `:38`, `:41`, `:58`,
    `:65`, `:68`, `:76`, `:79`. No fragment re-read that file or ran Playwright.
    Unresolved, reason: outside every fragment's assignment. The authoritative
    statement about copy that must not move (`services/__tests__/multiplayerRules.test.js:266-294`,
    `services/__tests__/multiplayerFailures.test.js:51`) also rests on the ticket,
    not on a fragment read.
18. **Things the ticket asked for that no fragment answered:** the per-file count
    for the 25 uninventoried `components/` files (gap 1); whether translating the
    three dead components is worth doing (a Design decision, deliberately left
    open by both fragments); and any key that `en.json` has but `de.json`/`fi.json`
    lack (the ticket reports "no key in `en.json` is missing from either", and no
    fragment re-ran that diff, so the parity direction en to de/fi is
    unverified, while the reverse direction, the 10 `multiplication_*` keys, is
    confirmed at `de.json:55-64`).
