# Research stage, question 1 / 2 / 11, file set `components/` (part B)

Answers only questions 1, 2 and 11, restricted to the 25 files assigned to this
window. Every file was read end to end with the read tool (Reader.tsx in two
chunks, useReadAloud.ts in two chunks, gamification/types.ts in three). Line
numbers are from the file as it is on `master` at the time of this reading.

Terms used below, same as `2-components-a.md`:

- JSX text: a literal sitting directly between tags.
- prop:accessibilityLabel: the literal value of that prop.
- constant: a module-level or in-function literal that reaches the screen.
- data: an English string defined in a data constant and rendered elsewhere. The
  definition line is cited once, in the section that owns it
  (`components/gamification/types.ts`); render sites are listed in their own file
  and marked `data`.
- covered: the string already goes through `t()` and the key exists in
  `components/locales/en.json`. Listed so the partial/clean verdict is auditable.

Counting rule: one bullet per user-facing literal. A line carrying two literals
gets two bullets that both cite the same line, marked `(a)` / `(b)`.

Every `t()` key cited in this file was checked against `components/locales/en.json`
(111 keys, flat snake_case). All of them exist. No `_one` / `_other` plural key
exists anywhere in the locale files.

---

## components/Onboarding.tsx — 6 user-facing strings (useTranslation: partial)

Imports `useTranslation` at `:15`, uses it at `:23`. All copy goes through `t()`,
but the language option labels and the brand name do not.

- `Onboarding.tsx:57` — "Quizzy" (JSX text; app title, brand name)
- `Onboarding.tsx:74` — "English" (constant; `label` in the inline language array, rendered at `:90`)
- `Onboarding.tsx:75` — "Deutsch" (constant; same array, rendered at `:90`)
- `Onboarding.tsx:76` — "Suomi" (constant; same array, rendered at `:90`)
- `Onboarding.tsx:97` — "✓" (JSX text; checkmark glyph, no translation needed)
- `Onboarding.tsx:151` — "→" (JSX text; button arrow glyph, no translation needed)

Covered already: `:60` `t('welcome_message', …)`, `:61` `t('almost_there', …)`,
`:69` `t('select_language', …)`, `:105` `t('language_helper', …)`,
`:112` `t('whats_your_name', …)`, `:119` `t('enter_name', …)` (placeholder),
`:128` `t('name_helper', …)`, `:148` `t('continue', …)`,
`:149` `t('start_learning', …)`.

Two facts for the plan:

1. The three option labels are endonyms, which is normal UI practice for a
   language picker. But `app/(tabs)/settings.tsx:194-196` translates the same
   three choices with `t('english')`, `t('german')`, `t('finnish')`, so the same
   picker differs between the two screens. Keys exist; this screen does not use
   them.
2. This is the only file in the set that passes an English default as the second
   argument to `t()`, 9 times (`:60, 61, 69, 105, 112, 119, 128, 148, 149`).
   Those defaults are English literals in source but they never render while the
   keys exist, so they are not leaks. They are listed here so nobody counts them
   as hardcoded UI text a second time.

Reachability: not imported with an `import` statement. `app/_layout.tsx:116` does
`const { Onboarding } = require('@/components/Onboarding');` and renders it at
`:119` inside `OnboardingWrapper`. Live.

## components/Reader.tsx — 4 user-facing strings (useTranslation: partial)

Imports `useTranslation` at `:4`, uses it at `:22`. The read-aloud text is
assembled from `t()` keys (covered), but the reader chrome and the progress line
are English glue.

- `Reader.tsx:319` — "Start from question:" (JSX text; label left of the question `Picker`)
- `Reader.tsx:351 (a)` — "Currently reading: " (JSX text; the citation in the brief was correct)
- `Reader.tsx:351 (b)` — " of" (JSX text; the joining word between `{currentQuestionIndex + 1}` on `:351` and `{quiz.questions.length}` on `:352`)
- `Reader.tsx:383` — " 🔊 READING NOW" (JSX text; nested `Text` inside the question number when that question is being spoken)

Covered already: `:299` `t('back')`, `:311` `t('stop')` / `t('read_aloud')`,
`:338` ``label={`${t('question')} ${index + 1}`}`` (Picker items),
`:381` `{t('question')} {index + 1}`, `:419` `t('correct_answer_is')`,
`:440` `t('show_explanation')`, and the TTS string assembly at `:49`
`t('quiz_title')`, `:59` `t('question')`, `:62` `t('correct_answer_is')`,
`:64` `t('show_explanation')`, `:244` `t('correct_answer_is')` and
`t('show_explanation')`.

Note on `:351`: the progress sentence is built as
`Currently reading: {t('question')} {n} of {total}`, so "Question 3 of 10" is
half translated. The two English fragments sit on one source line, which is why
the earlier fragment could not cite them separately.

Also user-visible but not a string literal: `quiz.name` at `:302` and the quiz
content rendered through `CodeFormatter` at `:401`, `:420`, `:442`. That is quiz
data, out of scope by the ticket's assumption.

## components/Explanation.tsx — 2 user-facing strings (useTranslation: partial)

Imports `useTranslation` at `:6`, uses it at `:29`. Only the correct/wrong
heading is translated; the screen-reader label and the glossary hint are English.

- `Explanation.tsx:80` — "Read explanation aloud" (prop:accessibilityLabel on the speaker `TouchableOpacity`; read by assistive tech only, still a user-facing string)
- `Explanation.tsx:100` — "Tap highlighted terms for definitions" (JSX text; the bulb-icon hint under the explanation card)

Covered already: `:32` — `const righOrWrong = answerIsCorrect ? t('correct') : t('wrong');`,
rendered at `:89`, and concatenated into the TTS string at `:35`
(`readAloud(righOrWrong + explanation)`).

Not user-facing: `:116` is a commented-out `Next` button,
`{/* <Text style={styles.buttonText}>Next </Text> */}`. It does not render. Do not
count it, and do not "translate" a comment.

`explanation` itself (`:94`, `ClickableTerms`) is quiz content, not UI copy.

## components/SettingsHeader.tsx — 1 user-facing string (useTranslation: yes)

Imports `useTranslation` at `:4`, uses it at `:27`. Every label goes through
`t()`.

- `SettingsHeader.tsx:89` — " / " (template; numeric separator inside `` ` / ${selectedQuizAnswersAmount}` ``, rendered next to `{t('question')} {n}` on `:88`)

Covered already: `:41` `t('enable_music')`, `:52` `t('show_explanation')`,
`:63` `t('enable_sound')`, `:74` `t('use_flashcards')`, `:88` `t('question')`.

Clean apart from a slash between two numbers, which needs no key.

## components/CodeFormatter.tsx — 0 user-facing strings (useTranslation: no)

No `useTranslation`, no rendered copy. The component renders whatever `text` prop
it is given. The LaTeX map at `:57-75` (`'\\times': '×'`, `'\\sqrt': '√'`,
`'\\alpha': 'α'`, …) emits mathematical glyphs, which are the same in en, de and
fi. The `Text` nodes at `:83`, `:112`, `:140`, `:145`, `:190`, `:268`, `:299`
render substrings of the prop. Nothing to translate here; skip the file.

## components/EditScreenInfo.tsx — 3 user-facing strings (useTranslation: no)

Default-exported Expo template component. No `useTranslation`. Full render, with
the ranges the brief asked about:

- `:14-20` a `Text` whose only child is the literal at `:19`
- `:22-28` a `View` wrapping `<MonoText>{path}</MonoText>` at `:27`, which renders the prop value passed by the caller
- `:30-37` a `Text` whose child is the wrapped literal at `:35-36`
- `:41-49` an `ExternalLink` wrapping a `Text` whose child is the wrapped literal at `:46-47`

- `EditScreenInfo.tsx:19` — "Open up the code for this screen:" (JSX text, wrapped across `:19` only)
- `EditScreenInfo.tsx:35` — "Change any of the text, save the file, and your app will automatically update." (JSX text, one sentence split over `:35-36`)
- `EditScreenInfo.tsx:46` — "Tap here if your app doesn't automatically update after making changes" (JSX text, split over `:46-47`, source uses `&apos;`)

Not user-facing: the URL at `:43` (link target, not copy), the `<MonoText>{path}</MonoText>`
value at `:27` (a file path, passed in as `path="app/modal.tsx"` from
`app/modal.tsx:16`), and every `StyleSheet` key.

Reachability: **live, but only inside the template demo modal.**

- Imported once: `app/modal.tsx:4` `import EditScreenInfo from '@/components/EditScreenInfo';`, rendered at `app/modal.tsx:16`.
- That route is registered at `app/_layout.tsx:153-154` (`name="modal"`, `presentation: 'modal'`).
- It is linked from the tab header at `app/(tabs)/_layout.tsx:94` (`<Link href="/modal" asChild>`).
- `grep -rn EditScreenInfo app components hooks services` returns exactly those two lines (`app/modal.tsx:4`, `app/modal.tsx:16`).

So a user who taps the header info button on the tab screen sees this Expo
boilerplate in English, including at `app/modal.tsx:10` the title "Modal". Worth
reporting: the three strings in `EditScreenInfo.tsx` are reachable, in the same
way `app/modal.tsx` is reachable.

## components/useReadAloud.ts — 1 user-facing string (useTranslation: partial)

Imports `useTranslation` at `:4`. Uses it at `:15` exactly as the brief said:
`const { i18n } = useTranslation();`. It destructures **`i18n` only, never `t`**,
so it calls **zero** `t()` keys.

How the hook actually uses i18n:

- `:327` — `const lang = langOverride || i18n.language || 'en';`
- `:328-333` — `langMap` maps `en`→`en-US`, `fi`→`fi-FI`, `de`→`de-DE`; applied as
  `ttsLang` and set on every `SpeechSynthesisUtterance` (`:525`) and on
  `Speech.speak` (`:564`). This is the one place the TTS voice follows the app
  language, and it is already working.
- `:580` — `i18n.language` in the `useCallback` dependency list, so the callback
  is rebuilt on language change.

It produces no speech text of its own. Every spoken string is assembled by the
caller and passed in as `text` (`components/Reader.tsx:49-70`, `:238-245`;
`components/Explanation.tsx:35`; also `components/Question.tsx` and
`app/(tabs)/index.tsx`). The `<break time="Ns"/>` markers it parses at `:388-406`
are SSML, not copy.

Its only user-facing literal:

- `useReadAloud.ts:576` — "Text-to-speech is not supported in this browser." (browser `alert()` body; reached when `Platform.OS === 'web'` but `'speechSynthesis' in window` is false, i.e. an old or locked-down desktop browser)

Not user-facing (leave English): the 38 `console.*` calls at `:31, 39, 46, 50,
58, 71, 79, 107, 116, 135, 191, 201, 207, 213, 218, 233, 242, 248, 254, 260,
269, 291, 297, 339, 353, 359, 379, 444, 446, 464, 479, 487, 502, 506, 510,
549, 557, 570`. Debug text only (`'Mobile detected:'`, `'Voice loading attempt'`,
`'SpeechSynthesis Utterance Error:'`, …). `:107` is the only `console.warn`.

## components/ExternalLink.tsx — 0 user-facing strings (useTranslation: no)

25 lines. A `Link` wrapper that opens `props.href` in an in-app browser. No text,
no labels, no placeholders. Skip.

## components/SafeAreaGradient.tsx — 0 user-facing strings (useTranslation: no)

Wraps children in `LinearGradient` + `SafeAreaView`. Default colours
`['#1a1a1a', '#2a2a2a']` at `:20` are hex values. No text. Skip.

## components/StyledText.tsx — 0 user-facing strings (useTranslation: no)

5 lines. `MonoText` forwards props and adds `fontFamily: 'SpaceMono'` at `:3`.
Renders only its children. Skip.

## components/Themed.tsx — 0 user-facing strings (useTranslation: no)

`Text` and `View` wrappers that apply theme colours. The only strings are
`Colors` key names and the `'light'` fallback at `:24` (a colour-scheme name, not
copy). Skip.

## components/types.ts — 0 user-facing strings (useTranslation: no)

91 lines of type declarations. Field names, union members (`'choice' | 'text'`,
`generator?: 'multiplication'`) and comments only. Nothing renders. Skip.

## components/useClientOnlyValue.ts — 0 user-facing strings (useTranslation: no)

4 lines, one exported function returning `client`. Dead, see below.

## components/useClientOnlyValue.web.ts — 0 user-facing strings (useTranslation: no)

12 lines, same function with a `useState`/`useEffect`. Dead, see below.

## components/useColorScheme.ts — 0 user-facing strings (useTranslation: no)

1 line, re-export of `react-native`'s `useColorScheme`.

## components/useColorScheme.web.ts — 0 user-facing strings (useTranslation: no)

Returns the literal `'light'` at `:7`. That is a React Native colour-scheme value,
not UI copy. Live: imported by `components/Themed.tsx:9` and
`app/(tabs)/_layout.tsx:14`.

## components/gamification/AchievementBadge.tsx — 8 user-facing strings (useTranslation: partial)

Imports `useTranslation` at `:8`, uses it at `:23`. Two hardcoded strings go
through `t()` (the secret-achievement placeholder), everything else on the card
is either a glyph, an XP acronym, or English data.

- `AchievementBadge.tsx:86` — "❓" (JSX text; icon shown for a locked secret achievement)
- `AchievementBadge.tsx:90` — covered: `t('secret_achievement')`
- `AchievementBadge.tsx:93` — covered: `t('keep_playing')`
- `AchievementBadge.tsx:125` — "✓" (JSX text; unlocked checkmark)
- `AchievementBadge.tsx:139` — `{achievement.name}` (data; English from `components/gamification/types.ts:146` and 52 more, see that section)
- `AchievementBadge.tsx:145` — `{achievement.description}` (data; English from `types.ts:147` and 52 more)
- `AchievementBadge.tsx:176` — "XP" (JSX text; suffix of `+{achievement.xpReward} XP`)
- `AchievementBadge.tsx:180` — `new Date(progress.unlockedAt).toLocaleDateString()` (call; renders a date in the device locale, which will not follow the app language)

Also rendered, numeric only: `:163` `{currentProgress}/{achievement.requirement}`.

This is the file where the locale keys `achievements` and `achievement_unlocked`
would belong, and it uses neither.

## components/gamification/AchievementModal.tsx — 8 user-facing strings (useTranslation: partial)

Imports `useTranslation` at `:17`, uses it at `:105`. The celebration modal is
half translated.

- `AchievementModal.tsx:253 (a)` — "🎉 " (JSX text; emoji before the header)
- `AchievementModal.tsx:253 (b)` — " 🎉" (JSX text; emoji after the header)
- `AchievementModal.tsx:253 (c)` — covered: `t('achievement_unlocked')`
- `AchievementModal.tsx:283` — `{currentAchievement.name}` (data; English from `components/gamification/types.ts`)
- `AchievementModal.tsx:290` — `{currentAchievement.description}` (data; English from `components/gamification/types.ts`)
- `AchievementModal.tsx:298` — `+{displayXP}` (JSX text; bare number, the unit sits on `:300`)
- `AchievementModal.tsx:300` — "XP" (JSX text; `<Text style={styles.xpText}>XP</Text>`)
- `AchievementModal.tsx:329` — covered: `t('next')` / `t('awesome')` (ternary at `:329-330`)

No "Achievements"/"Badge unlocked" heading exists beyond the `t()` on `:253`.
`t('achievements')` is not used here, nor anywhere else in the repo (see the
locale-key section at the end).

## components/gamification/DailyQuiz.tsx — 9 user-facing strings (useTranslation: partial)

Imports `useTranslation` at `:16`, uses it at `:29`. Four strings covered, five
hardcoded. Also **never rendered** (see below).

- `DailyQuiz.tsx:69` — "📅" (JSX text; calendar emoji before the title)
- `DailyQuiz.tsx:70` — covered: `t('daily_challenge')`
- `DailyQuiz.tsx:74` — "XP" (JSX text; suffix of `+{XP_REWARDS.DAILY_QUIZ_COMPLETION} XP`)
- `DailyQuiz.tsx:85` — `{count} {t('questions')}` (covered key, wrong for a count of 1: renders "1 questions"; `questions` is a plural-only value and no `_one`/`_other` key exists)
- `DailyQuiz.tsx:95` — covered: `t('start_daily')`
- `DailyQuiz.tsx:103 (a)` — "🔥 " (JSX text; emoji before the streak bonus line)
- `DailyQuiz.tsx:103 (b)` — ": +" (JSX text; punctuation joining `t('streak_bonus')` on `:103` to the number on `:104`)
- `DailyQuiz.tsx:104` — "XP" (JSX text; suffix of `{streak.currentStreak * XP_REWARDS.DAILY_STREAK_BONUS} XP`)
- `DailyQuiz.tsx:96` — "→" (JSX text; arrow glyph on the start button)

Also rendered, data: `:81` `{dailyQuizData.quiz.name}` (quiz title from quiz data,
content, out of scope).

Dead: `grep -rn DailyQuiz app components` finds only its own definition
(`:25`, `:200`), the `index.ts` barrel re-export (`:20`), and type names
(`DailyQuizData`, `dailyQuiz`, `onStartDailyQuiz`, `getDailyQuiz`,
`completeDailyQuiz`) in `GamificationProvider.tsx`. No file imports the component
and no file renders `<DailyQuiz`. `app/(tabs)/index.tsx:22-26` imports
`useGamification`, `StreakDisplay` and `XPProgress` from the barrel but not
`DailyQuiz`. `GamificationProvider.tsx:506-510` `getDailyQuiz` also returns `null`
unconditionally, so `DailyQuiz` would render nothing even if it were mounted.

## components/gamification/GamificationProvider.tsx — 0 user-facing strings (useTranslation: no)

611 lines, a context provider. No `useTranslation`, no JSX text. It does hold one
English string that can reach a screen edge case:

- `GamificationProvider.tsx:607` — "useGamification must be used within a GamificationProvider" (thrown `Error` at `:606`; developer-facing, surfaces in the dev red box or a crash log, never in normal UI)

And one English value that does reach the UI:

- `GamificationProvider.tsx:570` — `const levelTitle = getLevelTitle(stats.xp.currentLevel);`, exposed through context at `:582` and rendered by `components/gamification/XPProgress.tsx:147`. The titles themselves are defined in `components/gamification/types.ts:114-138`, so they are counted once, there.

Not user-facing (leave English): `:130`, `:143`, `:565` `console.error`
message text.

## components/gamification/GamificationStats.tsx — 8 user-facing strings (useTranslation: partial)

Imports `useTranslation` at `:16`, uses it at `:29`. **Every text label on this
screen is translated.** What is hardcoded is the icon set and one counter.

- `GamificationStats.tsx:94` — "🎯" (JSX text; icon on the "Questions Answered" card)
- `GamificationStats.tsx:99` — "✅" (JSX text; icon on the "Correct Answers" card)
- `GamificationStats.tsx:104` — "⭐" (JSX text; icon on the "Perfect Scores" card)
- `GamificationStats.tsx:109` — "🏆" (JSX text; icon on the "Wins" card)
- `GamificationStats.tsx:114` — "📅" (JSX text; icon on the "Days Played" card)
- `GamificationStats.tsx:119` — "🔥" (JSX text; icon on the "Best Streak" card)
- `GamificationStats.tsx:132` — `{getCategoryIcon(category)}` (helper; glyphs defined at `:166` 🔥, `:168` ⭐, `:170` 📚, `:172` ⚡, `:174` 🎁, `:176` 🏆, rendered in the section header)
- `GamificationStats.tsx:135-141` — `{unlocked}/{total}` (JSX expression; achievement counter, e.g. "3/7", no label)

Covered already: `:68` `t('quizzes')`, `:74` `t('badges')`, `:78` `t('accuracy')`,
`:85` `t('level_progress')`, `:91` `t('statistics')`,
`:96` `t('questions_answered')`, `:101` `t('correct_answers')`,
`:106` `t('perfect_scores')`, `:111` `t('Quiz_wins')`, `:116` `t('days_played')`,
`:121` `t('best_streak')`, and the dynamic key at `:133`
`` t(`achievement_category_${category}`) `` which resolves to
`achievement_category_streak` / `_score` / `_volume` / `_speed` / `_special`, all
present in `en.json`.

Note: `t('achievements')` exists in `en.json` and is not used on this screen even
though it is the natural header for the sections at `:126-152`.

## components/gamification/StreakDisplay.tsx — 3 user-facing strings (useTranslation: partial)

Imports `useTranslation` at `:16`, uses it at `:30`. Labels are translated, flames
are literals.

- `StreakDisplay.tsx:144` — "🔥" (JSX text; each flame in the animated row, `1` to `5` of them by milestone)
- `StreakDisplay.tsx:160` — "🔥" (JSX text; single dimmed flame in the zero state)
- `StreakDisplay.tsx:161` — "0" (JSX text; the count in the zero state)

Covered already: `:164` `t('streak')`, `:186` `t('day_streak')`. Both of those
keys exist and are consumed here, so the claim that `day_streak` is unused is
wrong.

Also rendered, numeric only: `:184` `{streak.currentStreak}`.

## components/gamification/XPProgress.tsx — 5 user-facing strings (useTranslation: partial)

Imports `useTranslation` at `:17`, uses it at `:30`. Four keys covered; the XP
suffix, two numeric renderings and the level title are not.

- `XPProgress.tsx:126` — `{displayXP}/{xp.xpForNextLevel}` (JSX expression; compact bar counter, e.g. "40/100")
- `XPProgress.tsx:147` — `{levelTitle}` (data; English from `components/gamification/types.ts:114-138`, via `GamificationProvider.tsx:570`)
- `XPProgress.tsx:179` — " XP" (JSX text; suffix of `{displayXP} XP`)
- `XPProgress.tsx:182` — `${xp.xpForNextLevel - xp.xpInCurrentLevel} ${t('xp_to_next')}` (covered key, but the number is prefixed with no plural handling; "1 XP to next level" reads wrong in all three languages)
- `XPProgress.tsx:194` — `{xp.currentLevel + 1}` (JSX expression; the next-level badge number, no label of its own)

Covered already: `:151` `t('total_xp')`, `:182` `t('xp_to_next')`,
`:183` `t('max_level')`, `:191` `t('next_level')`.

## components/gamification/index.ts — 0 user-facing strings (useTranslation: no)

21 lines, pure barrel: `export * from './types'` and named re-exports of the
provider and the six components. Nothing renders. Skip.

## components/gamification/types.ts — 132 user-facing strings (useTranslation: no)

721 lines of types, config and data. No `useTranslation`, but this is where most
of the untranslated gamification copy actually lives: **53 achievement names,
53 achievement descriptions, 25 level titles**, plus one fallback title. All are
defined once here and rendered by the badge, the modal and the XP bar. A plan
that only touches the `.tsx` files leaves every achievement name in English.

Level titles, `LEVEL_CONFIGS`, rendered by `XPProgress.tsx:147` through
`GamificationProvider.tsx:570`:

- `types.ts:114` — "Newcomer" (level 1)
- `types.ts:115` — "Beginner" (level 2)
- `types.ts:116` — "Curious" (level 3)
- `types.ts:117` — "Learner" (level 4)
- `types.ts:118` — "Student" (level 5)
- `types.ts:119` — "Apprentice" (level 6)
- `types.ts:120` — "Scholar" (level 7)
- `types.ts:121` — "Adept" (level 8)
- `types.ts:122` — "Expert" (level 9)
- `types.ts:123` — "Master" (level 10)
- `types.ts:124` — "Sage" (level 11)
- `types.ts:125` — "Grandmaster" (level 12)
- `types.ts:126` — "Virtuoso" (level 13)
- `types.ts:127` — "Prodigy" (level 14)
- `types.ts:128` — "Champion" (level 15)
- `types.ts:129` — "Legend" (level 16)
- `types.ts:130` — "Mythic" (level 17)
- `types.ts:131` — "Hero" (level 18)
- `types.ts:132` — "Titan" (level 19)
- `types.ts:133` — "Immortal" (level 20)
- `types.ts:134` — "Demigod" (level 21)
- `types.ts:135` — "Ascendant" (level 22)
- `types.ts:136` — "Transcendent" (level 23)
- `types.ts:137` — "Eternal" (level 24)
- `types.ts:138` — "Omniscient" (level 25)
- `types.ts:695` — "Beginner" (fallback in `getLevelTitle`, `config?.title || 'Beginner'`; unreachable while the config array has all 25 levels)

Achievement names and descriptions, `DEFAULT_ACHIEVEMENTS`, rendered by
`AchievementBadge.tsx:139`/`:145`, `AchievementModal.tsx:283`/`:290`, and listed
in `GamificationStats.tsx` via `AchievementBadge`. Names on the first line,
descriptions on the second, per achievement:

| id | name `types.ts:line` | description `types.ts:line` |
|---|---|---|
| `streak_3` | `:146` "Getting Started" | `:147` "Complete quizzes 3 days in a row" |
| `streak_7` | `:155` "Week Warrior" | `:156` "Complete quizzes 7 days in a row" |
| `streak_14` | `:164` "Fortnight Fighter" | `:165` "Complete quizzes 14 days in a row" |
| `streak_30` | `:173` "Monthly Master" | `:174` "Complete quizzes 30 days in a row" |
| `streak_60` | `:182` "Two Month Titan" | `:183` "Complete quizzes 60 days in a row" |
| `streak_100` | `:191` "Century Legend" | `:192` "Complete quizzes 100 days in a row" |
| `streak_365` | `:200` "Year of Dedication" | `:201` "Complete quizzes 365 days in a row" |
| `first_perfect` | `:212` "Perfectionist" | `:213` "Get your first perfect score" |
| `perfect_5` | `:221` "Flawless Five" | `:222` "Get 5 perfect scores" |
| `perfect_10` | `:230` "Perfect Ten" | `:231` "Get 10 perfect scores" |
| `perfect_25` | `:239` "Quarter Century" | `:240` "Get 25 perfect scores" |
| `perfect_50` | `:248` "Golden Standard" | `:249` "Get 50 perfect scores" |
| `perfect_100` | `:257` "Perfect Century" | `:258` "Get 100 perfect scores" |
| `comeback_king` | `:266` "Comeback King" | `:267` "Get a perfect score after 3 failed quizzes" |
| `consistency_10` | `:276` "Steady Hand" | `:277` "Score 80%+ on 10 consecutive quizzes" |
| `first_quiz` | `:287` "First Steps" | `:288` "Complete your first quiz" |
| `questions_50` | `:296` "Half Century" | `:297` "Answer 50 questions" |
| `questions_100` | `:305` "Century Club" | `:306` "Answer 100 questions" |
| `questions_250` | `:314` "Bookworm" | `:315` "Answer 250 questions" |
| `questions_500` | `:323` "Knowledge Seeker" | `:324` "Answer 500 questions" |
| `questions_1000` | `:332` "Quiz Enthusiast" | `:333` "Answer 1000 questions" |
| `questions_2500` | `:341` "Scholar Supreme" | `:342` "Answer 2500 questions" |
| `questions_5000` | `:350` "Quiz Master" | `:351` "Answer 5000 questions" |
| `quizzes_5` | `:359` "Warming Up" | `:360` "Complete 5 quizzes" |
| `quizzes_10` | `:368` "Getting Comfortable" | `:369` "Complete 10 quizzes" |
| `quizzes_25` | `:377` "Quiz Regular" | `:378` "Complete 25 quizzes" |
| `quizzes_50` | `:386` "Quiz Addict" | `:387` "Complete 50 quizzes" |
| `quizzes_100` | `:395` "Centurion" | `:396` "Complete 100 quizzes" |
| `quizzes_250` | `:404` "Quiz Legend" | `:405` "Complete 250 quizzes" |
| `quick_thinker` | `:415` "Quick Thinker" | `:416` "Complete a quiz with avg 5 seconds per question" |
| `speed_demon` | `:424` "Speed Demon" | `:425` "Answer 10 questions correctly in under 60 seconds" |
| `lightning_fast` | `:433` "Lightning Fast" | `:434` "Complete a 10-question quiz in under 30 seconds" |
| `sonic_speed` | `:442` "Sonic Speed" | `:444` "Complete a 10-question quiz with perfect score in under 20 seconds" |
| `speed_streak_5` | `:453` "Fast Five" | `:454` "Complete 5 quizzes in a row with avg under 5 sec/question" |
| `category_explorer` | `:464` "Category Explorer" | `:465` "Complete quizzes in 3 different categories" |
| `category_conqueror` | `:473` "Category Conqueror" | `:474` "Complete quizzes in 5 different categories" |
| `category_master` | `:482` "Category Master" | `:483` "Get a perfect score in 5 different categories" |
| `all_rounder` | `:491` "All-Rounder" | `:492` "Complete at least 3 quizzes in every category" |
| `daily_quiz_first` | `:503` "Daily Challenger" | `:504` "Complete your first Daily Quiz" |
| `daily_quiz_7` | `:512` "Weekly Regular" | `:513` "Complete 7 Daily Quizzes" |
| `daily_quiz_30` | `:521` "Monthly Devotee" | `:522` "Complete 30 Daily Quizzes" |
| `daily_perfect_streak_3` | `:530` "Perfect Daily Streak" | `:531` "Get perfect scores on 3 Daily Quizzes in a row" |
| `night_owl` | `:539` "Night Owl" | `:540` "Complete a quiz after midnight" |
| `early_bird` | `:549` "Early Bird" | `:550` "Complete a quiz before 6 AM" |
| `weekend_warrior` | `:559` "Weekend Warrior" | `:560` "Complete 5 quizzes on a Saturday or Sunday" |
| `marathon_session` | `:569` "Marathon Session" | `:570` "Complete 10 quizzes in a single day" |
| `first_try_legend` | `:578` "First Try Legend" | `:579` "Get a perfect score on a quiz you never played before" |
| `no_hints` | `:587` "Pure Knowledge" | `:588` "Complete 10 quizzes without using any hints" |
| `level_10` | `:596` "Level 10 Achieved" | `:597` "Reach level 10" |
| `level_25` | `:605` "Elite Status" | `:606` "Reach level 25" |
| `xp_1000` | `:615` "XP Collector" | `:616` "Earn 1000 total XP" |
| `xp_10000` | `:624` "XP Hoarder" | `:625` "Earn 10000 total XP" |
| `xp_50000` | `:633` "XP Baron" | `:634` "Earn 50000 total XP" |

That is 106 achievement strings + 25 level titles + 1 fallback = **132**.

Not user-facing: `icons` (emoji fields, same in every language), `id` fields,
`XP_REWARDS` keys, `requirement` numbers, and the dates produced by
`getTodayDateString`.

---

## Locale keys these files do and do not consume

Keys in `components/locales/en.json` that these 25 files consume (all confirmed
present, so nothing here falls back to English at runtime):

`quiz_title`, `question`, `correct`, `wrong`, `show_explanation`, `back`, `stop`,
`read_aloud`, `correct_answer_is`, `enable_music`, `enable_sound`,
`use_flashcards`, `secret_achievement`, `keep_playing`, `achievement_unlocked`,
`next`, `awesome`, `daily_challenge`, `questions`, `start_daily`,
`streak_bonus`, `quizzes`, `badges`, `accuracy`, `level_progress`, `statistics`,
`questions_answered`, `correct_answers`, `perfect_scores`, `Quiz_wins`,
`days_played`, `best_streak`, `total_xp`, `xp_to_next`, `max_level`,
`next_level`, `streak`, `day_streak`, `achievement_category_streak`,
`achievement_category_score`, `achievement_category_volume`,
`achievement_category_speed`, `achievement_category_special`,
`welcome_message`, `almost_there`, `select_language`, `language_helper`,
`whats_your_name`, `enter_name`, `name_helper`, `continue`, `start_learning`.

So the pair `xp_to_next`, `day_streak`, `best_streak`, `achievement_unlocked`
that the brief flagged as possibly unconsumed **are** consumed, at
`XPProgress.tsx:182`, `StreakDisplay.tsx:186`, `GamificationStats.tsx:121` and
`AchievementModal.tsx:253` respectively.

Keys that exist in `en.json`, belong to this set's subject matter, and are
consumed by **none** of these 25 files. Each was also grepped repo-wide, and none
is used by `app/` either:

| key | value | expected consumer in this set | repo-wide `t('key')` hits |
|---|---|---|---|
| `achievements` | "Achievements" | `GamificationStats.tsx` section header | 0 |
| `completed` | "Completed!" | `DailyQuiz.tsx` completed state (the component hides instead) | 0 |
| `resets_in` | "Resets in" | `DailyQuiz.tsx` reset countdown (never implemented) | 0 |
| `explanation` | "Explanation" | `Explanation.tsx` / `Reader.tsx` heading (both use `show_explanation` instead) | 0 |
| `english` / `german` / `finnish` | "English" / "German" / "Finnish" | `Onboarding.tsx:74-76`, which hardcodes endonyms instead | used only at `app/(tabs)/settings.tsx:194-196` |

Also worth recording for the plural design pass: no locale file has a
`_one`/`_other` pair. The four count-bearing strings in this set are
`DailyQuiz.tsx:85` (`{n} questions`), `XPProgress.tsx:182` (`{n} XP to next
level`), `AchievementBadge.tsx:163` (`{n}/{m}`) and
`GamificationStats.tsx:135-141` (`{n}/{m}`). Only the first two put a noun next to a
number.

## Dead files in this set

Verified with `grep -rn --include=*.ts --include=*.tsx` for each module name over
`app/ components/ hooks/ services/`:

| file | imported by | verdict |
|---|---|---|
| `components/useClientOnlyValue.ts` | nothing | dead |
| `components/useClientOnlyValue.web.ts` | nothing | dead |
| `components/gamification/DailyQuiz.tsx` | only `components/gamification/index.ts:20` (barrel re-export); no render site anywhere | dead in practice |
| everything else in the set | see per-file notes | live |

Two traps found while checking this, both of which a naive import grep gets
wrong:

- `components/Onboarding.tsx` looks dead under `grep "from '.*Onboarding'"`. It is loaded with `require('@/components/Onboarding')` at `app/_layout.tsx:116`. Live.
- `components/EditScreenInfo.tsx` looks dead because nothing in `app/(tabs)/` mentions it. It is imported by `app/modal.tsx:4`, and that route is registered at `app/_layout.tsx:153` and linked at `app/(tabs)/_layout.tsx:94`. Live, reachable by tapping the header info button.

---

## Master table rows for the files in this set

`user-facing strings` counts the bullets above (glyphs, XP acronym, numeric
renderings and English data all included, since all of them reach the screen).
`dead` = no import or render site outside this file, verified with grep.

| file | user-facing strings | useTranslation | dead |
|---|---|---|---|
| `components/Onboarding.tsx` | 6 | partial | no |
| `components/Reader.tsx` | 4 | partial | no |
| `components/Explanation.tsx` | 2 | partial | no |
| `components/SettingsHeader.tsx` | 1 | yes | no |
| `components/CodeFormatter.tsx` | 0 | no | no |
| `components/EditScreenInfo.tsx` | 3 | no | no |
| `components/useReadAloud.ts` | 1 | partial | no |
| `components/ExternalLink.tsx` | 0 | no | no |
| `components/SafeAreaGradient.tsx` | 0 | no | no |
| `components/StyledText.tsx` | 0 | no | no |
| `components/Themed.tsx` | 0 | no | no |
| `components/types.ts` | 0 | no | no |
| `components/useClientOnlyValue.ts` | 0 | no | yes |
| `components/useClientOnlyValue.web.ts` | 0 | no | yes |
| `components/useColorScheme.ts` | 0 | no | no |
| `components/useColorScheme.web.ts` | 0 | no | no |
| `components/gamification/AchievementBadge.tsx` | 8 | partial | no |
| `components/gamification/AchievementModal.tsx` | 8 | partial | no |
| `components/gamification/DailyQuiz.tsx` | 9 | partial | yes |
| `components/gamification/GamificationProvider.tsx` | 0 | no | no |
| `components/gamification/GamificationStats.tsx` | 8 | partial | no |
| `components/gamification/StreakDisplay.tsx` | 3 | partial | no |
| `components/gamification/XPProgress.tsx` | 5 | partial | no |
| `components/gamification/index.ts` | 0 | no | no |
| `components/gamification/types.ts` | 132 | no | no |
| **total** | **190** | 11 files with the hook, 14 without | 3 dead |
