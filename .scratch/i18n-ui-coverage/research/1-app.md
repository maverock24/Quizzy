# Research 1: hardcoded UI strings in `app/` (questions 1, 2, 5)

Scope: every file under `app/`, read in full (13 files, 4376 lines).
Label key: `USER-FACING` / `NOT`. Per-file count in each heading counts only
user-facing literals (occurrences, not distinct strings).

Totals: **144 user-facing literal occurrences** across 9 files; 4 files clean.

Per file: `+html.tsx` 4, `+not-found.tsx` 3, `modal.tsx` 2, `(tabs)/_layout.tsx` 4,
`(tabs)/index.tsx` 6, `(tabs)/learn.tsx` 23, `(tabs)/settings.tsx` 36,
`multiplayer/index.tsx` 26, `multiplayer/[code].tsx` 40.

---

## app/_layout.tsx  — 0 user-facing strings

No rendered text. Only developer logs:

- `app/_layout.tsx:63` — `"[App] Service Worker registered with scope:"`  (console.log, NOT)
- `app/_layout.tsx:77` — `"[App] New content available, please refresh."`  (console.log, NOT; never reaches the user, there is no UI listener)
- `app/_layout.tsx:83` — `"[App] Service Worker registration failed:"`  (console.error, NOT)

Screen options carry no text:

- `app/_layout.tsx:148-151` — `<Stack.Screen name="(tabs)" options={{ headerShown: false }} />` (no title)
- `app/_layout.tsx:152-155` — `<Stack.Screen name="modal" options={{ presentation: 'modal' }} />` (no title)

## app/+html.tsx  — 4 user-facing strings

Web-only document shell, runs in Node during static rendering (own comment,
`+html.tsx:3-6`), so it has no `t()` and no i18n instance in scope.

- `app/+html.tsx:9` — `lang="en"`  (html attribute; USER-FACING for screen readers, browsers and SEO; unconditional)
- `app/+html.tsx:19` — `content="Quizzy"`  (meta application-name; USER-FACING, brand)
- `app/+html.tsx:22` — `content="Quizzy"`  (meta apple-mobile-web-app-title; USER-FACING, brand)
- `app/+html.tsx:25` — `"Educational quiz application with offline support"`  (meta description; USER-FACING in search results and share cards)

Not user-facing: `+html.tsx:12` `X-UA-Compatible`, `:15` viewport, `:20` `apple-mobile-web-app-capable`, `:21` status-bar-style, `:27` `format-detection`, `:28` `mobile-web-app-capable`, `:29` `theme-color`, `:39`/`:45`/`:51`/`:53`/`:57`/`:62` icon hrefs, and the CSS blob `responsiveBackground` at `:80-97` (injected at `:72`).

## app/+not-found.tsx  — 3 user-facing strings

- `app/+not-found.tsx:9` — `"Oops!"`  (options:title on `<Stack.Screen>`)
- `app/+not-found.tsx:11` — `"This screen doesn't exist."`  (JSX text, via `&apos;`)
- `app/+not-found.tsx:14` — `"Go to home screen!"`  (JSX text, link label)

## app/modal.tsx  — 2 user-facing strings

- `app/modal.tsx:10` — `"Modal"`  (JSX text, screen title)
- `app/modal.tsx:16` — `path="app/modal.tsx"`  (prop; rendered as text at `components/EditScreenInfo.tsx:27` in a `<MonoText>`; USER-FACING but a file path, so translate-or-delete decision, not a translation)

`EditScreenInfo` also renders English prose of its own (`components/EditScreenInfo.tsx:14-20`, `30-37`, `45-48`) which is outside this file set. Flagged for whoever covers `components/`.

## app/remoteUpdate.ts  — 0 user-facing strings

Server route handler. Every string is an API `error` field or a log. The consumer
(`components/Quizprovider.tsx:511-527`) reads `errorJson.error` and passes it to
`console.error('Failed to download quizzes:', errorText)` (Quizprovider.tsx:527)
and `return false`. Nothing is rendered, so none of these reach the user.

- `app/remoteUpdate.ts:14` — `"Missing remoteAddress parameter"`  (JSON error, NOT)
- `app/remoteUpdate.ts:30` — `"Invalid remoteAddress"`  (JSON error, NOT)
- `app/remoteUpdate.ts:37` — `"Fetching remote address:"`  (console.log, NOT)
- `app/remoteUpdate.ts:50-52` — `` `Failed to fetch remote resource at ${remoteAddress}: ${status} ${statusText}` ``  (console.error, NOT)
- `app/remoteUpdate.ts:54` — `` `Failed to fetch remote resource: ${status} ${statusText}` ``  (JSON error, NOT)
- `app/remoteUpdate.ts:57-59` — `` `Failed to fetch remote resource (${status}): ${errorBody}` ``  (JSON error, NOT)
- `app/remoteUpdate.ts:83` — `"Response body from remote address is null"`  (thrown Error, NOT)
- `app/remoteUpdate.ts:104` — `"Error fetching or processing remote resource:"`  (console.error, NOT)
- `app/remoteUpdate.ts:106` — `"An unknown error occurred"`  (JSON error, NOT)
- `app/remoteUpdate.ts:108` — `` `Internal server error: ${errorMessage}` ``  (JSON error, NOT)
- `app/remoteUpdate.ts:71-74` — `"application/octet-stream"`  (MIME type, NOT)

## app/(tabs)/_layout.tsx  — 4 user-facing strings

Tab bar labels, all `options.title`:

- `app/(tabs)/_layout.tsx:91` — `"Quiz"`  (options:title, same text as `quiz` key family in en.json but hardcoded)
- `app/(tabs)/_layout.tsx:112` — `"Learn"`  (options:title)
- `app/(tabs)/_layout.tsx:121` — `"Profile"`  (options:title)
- `app/(tabs)/_layout.tsx:130` — `"Settings"`  (options:title)

Not user-facing: icon `name=` props (`home`, `graduation-cap`, `trophy`, `gear`, `info-circle`), `resizeMode`, `initialRouteName`, `tabBarLabelPosition`, `animation`, easing names.

No `useTranslation` in this file (confirmed by import block, lines 1-15), so adding `t()` here means either the hook inside `TabLayout` or `i18n.t()`; the layout is a component, so the hook is available.

## app/(tabs)/index.tsx  — 6 user-facing strings

- `app/(tabs)/index.tsx:505` — `"Open glossary"`  (prop:accessibilityLabel, glossary button)
- `app/(tabs)/index.tsx:508` — `"Glossary"`  (JSX text, button)
- `app/(tabs)/index.tsx:524-527` — `t('multiplication_quiz_label_range', { from, to })`  (t() call whose key is MISSING from `en.json` and `fi.json`, present only in `de.json:57`; on en/fi i18next resolves to the raw key, so the quiz list renders the literal text `multiplication_quiz_label_range`)
- `app/(tabs)/index.tsx:655` — `"Open glossary"`  (prop:accessibilityLabel, second button)
- `app/(tabs)/index.tsx:658` — `"Glossary"`  (JSX text, second button)
- `app/(tabs)/index.tsx:455` — `` `${lastPlayedQuizName} (Retry)` ``  (template; quiz name. Not rendered by this screen, but it becomes `selectedQuizName` via `setSelectedQuizName(retryQuiz.name)` at `:461` and the retry quiz is the `selectedQuiz`, so it reaches the screen through `components/Reader.tsx:302` (`{quiz.name}`) when reader mode is on, and through `components/LearningTodos.tsx:97` because `handleAnswerSelection` (`:281-288`) files wrong answers under `selectedQuiz.name`)

Notes:
- `app/(tabs)/index.tsx:470-476` — the `quizQuestions` map only reshapes data, no literals.
- No `Alert`, no `Toast`, no `placeholder`, no `console.*` in this file (grep confirmed).
- `selectedQuizName` is never read for display anywhere in the repo: `grep -rn selectedQuizName` returns only `Quizprovider.tsx:30`, `:118`, `:784` (setter/state/context) and a comment at `index.tsx:440`. So the retry name is user-visible only through Reader / LearningTodos, not through a header.

## app/(tabs)/learn.tsx  — 23 user-facing strings

Five `learningOptions` constants (`:68-108`), rendered twice each at `:260`/`:262` (tier 1) and `:306`/`:308` (tier 2):

- `app/(tabs)/learn.tsx:69` — `"Daily Warmup"`  (constant `title`, rendered `:260`)
- `app/(tabs)/learn.tsx:71` — `"Spaced repetition practice on questions you've answered before"`  (constant `description`, rendered `:262`)
- `app/(tabs)/learn.tsx:78` — `"Mental Compiler"`  (constant `title`, rendered `:306`)
- `app/(tabs)/learn.tsx:79` — `"Predict code output to build your mental execution model"`  (constant `description`, rendered `:308`)
- `app/(tabs)/learn.tsx:86` — `"Parsons Problems"`  (constant `title`)
- `app/(tabs)/learn.tsx:87` — `"Arrange scrambled code lines into the correct order"`  (constant `description`)
- `app/(tabs)/learn.tsx:94` — `"Scaffolded Learning"`  (constant `title`)
- `app/(tabs)/learn.tsx:96` — `"Study complete examples, then fill in progressively more blanks"`  (constant `description`)
- `app/(tabs)/learn.tsx:103` — `"Bug Hunter"`  (constant `title`)
- `app/(tabs)/learn.tsx:104` — `"Find the bug in seemingly correct code"`  (constant `description`)

Helper constant:

- `app/(tabs)/learn.tsx:120` — `"All Categories"`  (constant returned by `getCategoryDisplayName`, rendered at `:216` inside the category chip)

JSX text:

- `app/(tabs)/learn.tsx:185` — `"🧠 Enhanced Learning"`  (JSX text, header)
- `app/(tabs)/learn.tsx:187` — `"Science-backed methods for maximum retention"`  (JSX text, subtitle)
- `app/(tabs)/learn.tsx:193` — `"📚 Category Filter"`  (JSX text, section label)
- `app/(tabs)/learn.tsx:221` — `" quizzes • "`  (JSX text fragment with `{filteredQuizzes.length}` interpolation before it; renders as `12 quizzes • 400 questions`)
- `app/(tabs)/learn.tsx:226` — `"questions"`  (JSX text, second half of the same counter line, after a reduce())
- `app/(tabs)/learn.tsx:234` — `"TIER 1"`  (JSX text, badge)
- `app/(tabs)/learn.tsx:236` — `"High Efficiency"`  (JSX text, tier title)
- `app/(tabs)/learn.tsx:239` — `"Low cognitive load, high learning ROI"`  (JSX text, tier description)
- `app/(tabs)/learn.tsx:279` — `"TIER 2"`  (JSX text, badge)
- `app/(tabs)/learn.tsx:282` — `"Deep Learning"`  (JSX text, tier title)
- `app/(tabs)/learn.tsx:285` — `"For mastering patterns after grasping basics"`  (JSX text, tier description)
- `app/(tabs)/learn.tsx:323-324` — `"Daily Warmup adapts to your quiz performance using spaced repetition. The more you practice, the smarter it gets!"`  (JSX text, info section)

Not user-facing in this file: `LearningMode` union literals (`:26-31`), `'all'` category sentinel (`:45`, `:55`, `:60`, `:120`), mode ids (`:68`, `:77`, `:85`, `:93`, `:102`), tier numbers, icon names, colours.

Data note: category chip text for real categories comes from quiz data (`quiz.category`), which is content, and `getCategoryDisplayName` (`:118-127`) only strips an emoji prefix off that content.

## app/(tabs)/profile.tsx  — 0 hardcoded user-facing strings

All three strings already go through `t()` with English inline defaults, and all three keys exist in en/de/fi (verified by grep: `hello`, `stats`, `learning` each present once in all three locale files).

- `app/(tabs)/profile.tsx:30` — `t('hello', 'Hello')`  (t() with default; renders `Hello, {userName}! 👋`)
- `app/(tabs)/profile.tsx:46` — `t('stats', 'Stats')`  (t() with default; renders `📊 Stats`)
- `app/(tabs)/profile.tsx:59` — `t('learning', 'Learning')`  (t() with default; renders `📚 Learning`)

Emojis `👋`, `📊`, `📚` are non-linguistic. `TabType` literals `'stats'`/`'todos'` are ids.

## app/(tabs)/settings.tsx  — 36 user-facing string occurrences

State messages that render in the update block:

- `app/(tabs)/settings.tsx:91` — `"No published Android build found."`  (setUpdateError; rendered at `:486`)
- `app/(tabs)/settings.tsx:94` — `"Unable to check for updates."`  (setUpdateError; rendered at `:486`)
- `app/(tabs)/settings.tsx:108` — `"Failed to install update."`  (fallback when the thrown value is not an Error; goes to `:109` state and `:110` Alert body)
- `app/(tabs)/settings.tsx:486` — `"Checking for updates…"`  (ternary fallback inside the setting description)

Default user-quiz template written into the editable JSON. Visible to the user inside the modal `TextInput` at `:584` (`value={userQuizJson}`), so USER-FACING but it is quiz *content*, not chrome:

- `app/(tabs)/settings.tsx:136` — `"User Quiz"`  (quiz name in template JSON)
- `app/(tabs)/settings.tsx:139` — `"What is 2+2?"`  (question in template JSON)
- `app/(tabs)/settings.tsx:142` — `"2+2=4"`  (explanation in template JSON)

Alerts:

- `app/(tabs)/settings.tsx:110` — `"Update failed"`  (Alert title)
- `app/(tabs)/settings.tsx:110` — `msg`  (Alert body; `err.message` or the literal at `:108`)
- `app/(tabs)/settings.tsx:155` — `"Error"`  (Alert title)
- `app/(tabs)/settings.tsx:155` — `"Failed to load or create user quizzes"`  (Alert body)
- `app/(tabs)/settings.tsx:167` — `"Error"`  (Alert title)
- `app/(tabs)/settings.tsx:167` — `"Failed to save user quizzes"`  (Alert body)

JSX text and props:

- `app/(tabs)/settings.tsx:304` — `"🎨 Kids Mode"`  (JSX text, setting name)
- `app/(tabs)/settings.tsx:306-307` — `"Größere Feiern, Streak-Haustier und buntere Animationen für Kinder"`  (JSX text, setting description; hardcoded GERMAN, so English and Finnish users see German here today)
- `app/(tabs)/settings.tsx:373` — `"TTS Voice"`  (JSX text, setting name)
- `app/(tabs)/settings.tsx:394` — `"Default Voice"`  (Picker.Item `label=`)
- `app/(tabs)/settings.tsx:398` — `` `${voice.name} (${voice.lang})` ``  (Picker.Item `label=`; voice names come from the OS, only the parentheses are ours)
- `app/(tabs)/settings.tsx:411` — `"Test Voice"`  (JSX text, setting name)
- `app/(tabs)/settings.tsx:413-414` — `"Test the selected voice. On mobile devices, this also enables TTS functionality."`  (JSX text, description)
- `app/(tabs)/settings.tsx:420` — `"Hello! This is a test of the text-to-speech voice."`  (local `testText`, spoken by `new SpeechSynthesisUtterance(testText)` at `:427`; heard, not read)
- `app/(tabs)/settings.tsx:439` — `"Test"`  (JSX text, button)
- `app/(tabs)/settings.tsx:447` — `"Enable User Quizzes"`  (JSX text, setting name)
- `app/(tabs)/settings.tsx:449-450` — `"Load quizzes from your own quizzes_user.json file in addition to the language-specific quizzes."`  (JSX text, description)
- `app/(tabs)/settings.tsx:465` — `"Edit User Quizzes"`  (JSX text, setting name)
- `app/(tabs)/settings.tsx:467` — `"Open a dialog to edit your quizzes_user.json file."`  (JSX text, description)
- `app/(tabs)/settings.tsx:474` — `"Edit"`  (JSX text, button)
- `app/(tabs)/settings.tsx:482` — `"App Updates"`  (JSX text, setting name)
- `app/(tabs)/settings.tsx:485` — `` `Latest build: ${androidRelease.versionName} (build #${androidRelease.versionCode})` ``  (template, ternary branch)
- `app/(tabs)/settings.tsx:487` — `"Installed build: "`  (JSX text, with `{'\n'}` at `:487` and `{' '}` at `:488`)
- `app/(tabs)/settings.tsx:490` — `"unknown"`  (ternary fallback when `installedVersionCode` is 0)
- `app/(tabs)/settings.tsx:506` — `"Download & Install"`  (JSX text, button)
- `app/(tabs)/settings.tsx:511` — `"Up to date"`  (JSX text, no-button branch)
- `app/(tabs)/settings.tsx:519` — `"Check"`  (JSX text, button)
- `app/(tabs)/settings.tsx:570` — `"Edit quizzes_user.json"`  (JSX text, modal title)
- `app/(tabs)/settings.tsx:595` — `"Cancel"`  (JSX text, modal button)
- `app/(tabs)/settings.tsx:598` — `"Save"`  (JSX text, modal button)

Already translated in this file (do not touch): `t('settings')` `:175`, `t('language')` `:178`, `t('english'|'german'|'finnish')` `:194-196`, and the switch rows at `:200-299`, `:309-370`, `t('minutes')` inside the duration labels `:357-364`, `t('reset_settings')`/`t('reset_settings_desc')`/`t('reset')` `:527-541`.

Not user-facing: AsyncStorage keys `'userQuizLoadEnabled'` (`:72`, `:80`) and `'userQuizzes'` (`:128`, `:150`, `:162`), Switch colour values, style keys.

## app/multiplayer/_layout.tsx  — 0 user-facing strings

- `app/multiplayer/_layout.tsx:6` — `<Stack.Screen name="index" options={{ headerShown: false }} />` (no title)
- `app/multiplayer/_layout.tsx:7` — `<Stack.Screen name="[code]" options={{ headerShown: false }} />` (no title)

No rendered text anywhere in the file.

## app/multiplayer/index.tsx  — 26 user-facing string occurrences

`showAlert` helper (`:26-34`) is a thin wrapper: `window.alert(`${title}\n\n${message}`)` on web (`:29`), `Alert.alert(title, message)` on native (`:32`). Every literal below is passed in by the callers.

Alerts (10 literal slots; all message bodies except the first two come from `services/multiplayerFailures.ts`):

- `app/multiplayer/index.tsx:127` — `"Required"`  (Alert title)
- `app/multiplayer/index.tsx:127` — `"Please enter your name"`  (Alert body)
- `app/multiplayer/index.tsx:141` — `"Cannot create a room"`  (Alert title; body `failureMessage(result.failure)`)
- `app/multiplayer/index.tsx:145` — `"Cannot create a room"`  (Alert title; body `failureMessage('could-not-create')`)
- `app/multiplayer/index.tsx:155` — `"Required"`  (Alert title)
- `app/multiplayer/index.tsx:155` — `"Please enter your name"`  (Alert body)
- `app/multiplayer/index.tsx:171` — `"Cannot join"`  (Alert title; body `failureMessage(result.failure)`)
- `app/multiplayer/index.tsx:175` — `"Cannot join"`  (Alert title; body `failureMessage('connect-failed')`)
- `app/multiplayer/index.tsx:198` — `"Cannot create a room"`  (Alert title)
- `app/multiplayer/index.tsx:202` — `"Cannot send invite"`  (Alert title; body `failureMessage('network')`)

JSX text and props (16):

- `app/multiplayer/index.tsx:231` — `"Multiplayer Quiz"`  (JSX text, native-only screen title)
- `app/multiplayer/index.tsx:233-234` — `"Multiplayer needs a browser. Open the web version to play with a friend."`  (JSX text, native-only empty state)
- `app/multiplayer/index.tsx:242` — `"Open the web version"`  (JSX text, button)
- `app/multiplayer/index.tsx:262` — `"⚔️ Multiplayer Quiz"`  (JSX text, web screen title)
- `app/multiplayer/index.tsx:266` — `"Your Name"`  (JSX text, field label)
- `app/multiplayer/index.tsx:269` — `"Enter your name"`  (prop:placeholder)
- `app/multiplayer/index.tsx:289` — `"🚀 Create New Game"`  (JSX text, button)
- `app/multiplayer/index.tsx:303` — `"📬 Incoming Invites"`  (JSX text, section header)
- `app/multiplayer/index.tsx:308` — `" invited you!"`  (JSX text with `{invite.fromName}` before it, so word order is baked into the JSX)
- `app/multiplayer/index.tsx:315` — `"Accept"`  (JSX text, button)
- `app/multiplayer/index.tsx:321` — `"Decline"`  (JSX text, button)
- `app/multiplayer/index.tsx:332` — `"🟢 Active Players in Lobby"`  (JSX text, section header)
- `app/multiplayer/index.tsx:343-344` — `"Enter your name above to enter the lobby and see who is online."`  (JSX text, empty state)
- `app/multiplayer/index.tsx:348-349` — `"No one else is online right now. Waiting for players... Ask the host for their invite link to join."`  (JSX text, empty state)
- `app/multiplayer/index.tsx:371` — `"Join"`  (ternary, `user.roomCode ? 'Join' : 'Invite'`)
- `app/multiplayer/index.tsx:371` — `"Invite"`  (ternary, second branch of the same line)

Not user-facing: `'active'`/`'change'`/`'visible'`/`'visibilitychange'` AppState and DOM event names (`:88`, `:101`, `:107`, `:114`, `:120`), `'padding'`/`'height'` keyboard behaviours (`:220`), `'done'` returnKeyType (`:273`), the hardcoded share URL `'https://quizzy-2504.netlify.app/multiplayer'` (`:239`), console.error at `:144`, `:174`, `:201`.

## app/multiplayer/[code].tsx  — 40 user-facing string occurrences

`showAlert` helper (`:50-70`) uses `window.confirm`/`window.alert` on web and `Alert.alert(title, message, buttons)` on native (`:69`). Button objects carry user-visible `text` (`:162`, `:164`) that were easy to miss because they are object properties, not JSX.

Alerts:

- `app/multiplayer/[code].tsx:161` — `"Leave Game?"`  (Alert title)
- `app/multiplayer/[code].tsx:161` — `"Are you sure you want to leave?"`  (Alert body)
- `app/multiplayer/[code].tsx:162` — `"Cancel"`  (Alert button `text`)
- `app/multiplayer/[code].tsx:164` — `"Leave"`  (Alert button `text`)
- `app/multiplayer/[code].tsx:342` — `"Select Quiz"`  (Alert title)
- `app/multiplayer/[code].tsx:342` — `"Please select a quiz first"`  (Alert body)

Results screen:

- `app/multiplayer/[code].tsx:434` — `"🏆 Game Over!"`  (ternary, `allFinished ? ...`)
- `app/multiplayer/[code].tsx:434` — `"⏳ Waiting for opponent..."`  (ternary)
- `app/multiplayer/[code].tsx:443` — `"You Win!"`  (ternary, `iAmWinner ? ...`)
- `app/multiplayer/[code].tsx:443` — `` `${winner.name} Wins!` ``  (ternary template, second branch)
- `app/multiplayer/[code].tsx:449` — `"Final Scores"`  (JSX text, section header)
- `app/multiplayer/[code].tsx:465` — `"(You)"`  (ternary, `p.id === myId ? '(You)' : ''`)
- `app/multiplayer/[code].tsx:469` — `"Finished in "`  (JSX text before `{formatTime(...)}`)
- `app/multiplayer/[code].tsx:473` — `"Still playing..."`  (JSX text, not-finished branch)
- `app/multiplayer/[code].tsx:492` — `"🏠 Back to Lobby"`  (JSX text, button)

Host-gone and name screens:

- `app/multiplayer/[code].tsx:516` — `"The host connection dropped."`  (JSX text, subtitle)
- `app/multiplayer/[code].tsx:522` — `"Rejoin"`  (JSX text, button)
- `app/multiplayer/[code].tsx:585` — `"Enter your name to join"`  (JSX text, subtitle)
- `app/multiplayer/[code].tsx:588` — `"Enter your name"`  (prop:placeholder)
- `app/multiplayer/[code].tsx:604` — `"Join"`  (JSX text, button)
- `app/multiplayer/[code].tsx:613` — `"Try again"`  (JSX text, button)

Lobby:

- `app/multiplayer/[code].tsx:648` — `"Room: "`  (JSX text before `{code}`)
- `app/multiplayer/[code].tsx:660` — `"Link copied"`  (ternary, `copied ? ...`)
- `app/multiplayer/[code].tsx:660` — `"Copy link"`  (ternary)
- `app/multiplayer/[code].tsx:669` — `"Share"`  (JSX text, button)
- `app/multiplayer/[code].tsx:676` — `"Players:"`  (JSX text, subtitle)
- `app/multiplayer/[code].tsx:689` — `"Left"`  (ternary, `p.left ? 'Left' : '✅ Ready'`)
- `app/multiplayer/[code].tsx:689` — `"✅ Ready"`  (ternary)
- `app/multiplayer/[code].tsx:696` — `"Waiting for opponent..."`  (JSX text, placeholder row)
- `app/multiplayer/[code].tsx:710` — `"Selected Quiz: "`  (JSX text before `{selectedQuiz?.name || ...}`)
- `app/multiplayer/[code].tsx:710` — `"None selected"`  (ternary fallback inside that JSX expression)
- `app/multiplayer/[code].tsx:716` — `"📚 Select Quiz"`  (JSX text, button)
- `app/multiplayer/[code].tsx:728` — `"🎮 Start Game"`  (JSX text, button)
- `app/multiplayer/[code].tsx:733` — `"Send your opponent the room link to join"`  (JSX text, hint)
- `app/multiplayer/[code].tsx:757` — `"Try again"`  (JSX text, button, second occurrence)
- `app/multiplayer/[code].tsx:771` — `"Waiting for host to start..."`  (JSX text, joiner waiting state)
- `app/multiplayer/[code].tsx:780` — `"Quiz: "`  (JSX text before `{selectedQuiz.name}`)

Quiz selector overlay:

- `app/multiplayer/[code].tsx:795` — `"Select a Quiz"`  (JSX text, overlay title)
- `app/multiplayer/[code].tsx:807` — `"Cancel"`  (JSX text, button)

Helper that produces screen text:

- `app/multiplayer/[code].tsx:44-49` — `formatTime` returns `` `${minutes}m ${secs}s` `` (`:48`) or `` `${secs}s` `` (`:48`); user-facing (rendered at `:469`), and `m`/`s` are English unit abbreviations.

Not user-facing: `'cancel'` button style marker (`:60`), `gameState.status` strings `'waiting'`/`'playing'` (`:89`, `:177`, `:179`, `:213`, `:270`, `:282`, `:421`, `:502`), `'true'` query param (`:85`), `'hardwareBackPress'` (`:291`), console.error at `:143` and `:155`, the clipboard/share URLs at `:138` and `:150`, `'6'`-style temp values (`:52` unrelated).

---

## Files in app/ with no user-facing text

- `app/_layout.tsx` — provider/navigation shell and service-worker registration, only `console.log`/`console.error` strings, no rendered text and no screen titles.
- `app/multiplayer/_layout.tsx` — two `<Stack.Screen>` entries, both `headerShown: false`, no titles.
- `app/remoteUpdate.ts` — server route handler, all strings are JSON `error` payloads or logs, and the only consumer sends them to `console.error` (`components/Quizprovider.tsx:527`).
- `app/(tabs)/profile.tsx` — renders text, but every string already goes through `t()` (`:30`, `:46`, `:59`) and all three keys exist in en/de/fi. No literal needs adding.

## Non-component string sources in app/ (question 5)

| Kind | Location | Notes |
| --- | --- | --- |
| `Alert.alert` | `app/(tabs)/settings.tsx:110`, `:155`, `:167` | 3 calls, 2 of them with the generic title `"Error"`. Native only; no web branch. |
| `showAlert` wrapper (web `window.alert`/`window.confirm`, native `Alert.alert`) | defined `app/multiplayer/index.tsx:26-34`; called `:127`, `:141`, `:145`, `:155`, `:171`, `:175`, `:198`, `:202` | Web path composes `` `${title}\n\n${message}` `` at `:29`. |
| `showAlert` wrapper with buttons | defined `app/multiplayer/[code].tsx:50-70`; called `:161`, `:342` | Button labels at `:162` (`Cancel`) and `:164` (`Leave`) are user-visible text in object properties. Web path uses `window.confirm` at `:58`, so even the confirm/cancel dialog depends on those strings. |
| Alert message bodies from a service | `services/multiplayerFailures.ts:40-55` | 8 English sentences returned by `failureMessage()` and injected into the alerts above. Outside `app/`, but rendered from `app/`. |
| `accessibilityLabel` | `app/(tabs)/index.tsx:505`, `:655` | Both `"Open glossary"`. No other accessibility prop exists in `app/` (grep for `accessibilityHint` returns nothing). |
| `placeholder` | `app/multiplayer/index.tsx:269`, `app/multiplayer/[code].tsx:588` | Both `"Enter your name"`. |
| `Picker.Item label` | `app/(tabs)/settings.tsx:194-196` (already `t()`), `:357-364` (`` `${n} ${t('minutes')}` ``), `:394` (`"Default Voice"`), `:398` (`` `${voice.name} (${voice.lang})` ``) | The 8 duration labels are numeric prefix + translated unit; the unit order is hardcoded as `number space unit`, which is wrong for some languages but correct for en/de/fi. |
| Screen `options.title` | `app/(tabs)/_layout.tsx:91`, `:112`, `:121`, `:130` | Tab bar labels. `app/_layout.tsx:120-127` and `app/multiplayer/_layout.tsx:6-7` set no titles. |
| `<Stack.Screen options={{ title }}>` | `app/+not-found.tsx:9` | `"Oops!"`. |
| TTS output | `app/(tabs)/settings.tsx:419-420` | `const testText = 'Hello! This is a test of the text-to-speech voice.'` fed to `new SpeechSynthesisUtterance(testText)` at `:427`. Spoken, so it needs a translation even though it is never rendered. `components/useReadAloud.ts` is the other TTS source and is outside this file set. |
| Constants rendered later | `app/(tabs)/learn.tsx:68-108` (`learningOptions`, rendered `:260`/`:262`/`:306`/`:308`), `app/(tabs)/learn.tsx:120` (`getCategoryDisplayName`, rendered `:216`) | 11 literals that a JSX-only scan misses because the words sit in a data array. |
| Helper producing screen text | `app/multiplayer/[code].tsx:44-49` (`formatTime`, rendered `:469`) | Durations with English `m`/`s` suffixes. |
| `console.warn`/`console.error`/`console.log` | `app/_layout.tsx:63`, `:77`, `:83`; `app/remoteUpdate.ts:37`, `:50`, `:104`; `app/multiplayer/index.tsx:144`, `:174`, `:201`; `app/multiplayer/[code].tsx:143`, `:155` | None reach the UI. Leave them English. |
| `Toast` | none | `grep -rn Toast app/` returns 0 hits. Only two `accessibilityLabel` props exist in the whole directory. |

### Is `components/i18n.ts` importable from a plain `.ts` without circular-import trouble?

Yes, and there is already a working precedent in the repo:

- `services/MultiplicationQuiz.ts:1` — `import i18n from '@/components/i18n';`, a plain `.ts` file in `services/`.
- `services/MultiplicationQuiz.ts:14-15` — calls `i18n.t('multiplication_quiz_name')` and `i18n.t('multiplication_quiz_category')` at module top level, and these become the quiz list entry.
- Same default import at `components/Quizprovider.tsx:1` and `app/_layout.tsx:19`, and `app/_layout.tsx:102` wraps the tree in `<I18nextProvider i18n={i18n}>`.

`components/i18n.ts:33-45` initialises i18next at import time (side effect), and only imports the three locale JSONs, so nothing imports the module back. The gate in the ticket (`npx tsc --noEmit` clean) covers these imports.

Hazard found, for the design to consider: module-scope `i18n.t()` freezes the value at import time. `services/MultiplicationQuiz.ts:14-15` is evaluated once, so that quiz name would not follow a language change after load. `i18n.ts` loads before `Quizprovider` calls `i18n.changeLanguage`, so the first evaluation is already in the initial language.
